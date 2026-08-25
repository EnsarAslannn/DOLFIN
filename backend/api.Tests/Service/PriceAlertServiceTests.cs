using api.Interfaces;
using api.Models;
using api.Service;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace api.Tests.Service
{
    public class PriceAlertServiceTests
    {
        private static AppUser MakeUser() => new() { Id = "user-1", UserName = "trader" };

        private static Stock MakeStock(int id = 1, string symbol = "AAPL", decimal purchase = 150m) =>
            new()
            {
                Id = id,
                Symbol = symbol,
                CompanyName = "Apple Inc.",
                Purchase = purchase,
                Industry = "Consumer Electronics",
            };

        private static PriceAlertService CreateService(
            Mock<IPriceAlertRepository> alertRepo,
            Mock<IStockRepository> stockRepo
        ) => new(alertRepo.Object, stockRepo.Object, new Mock<ILogger<PriceAlertService>>().Object);

        [Fact]
        public async Task CreateAlertAsync_ZeroOrNegativeTargetPrice_ThrowsArgumentException()
        {
            var service = CreateService(new Mock<IPriceAlertRepository>(), new Mock<IStockRepository>());

            await Assert.ThrowsAsync<ArgumentException>(
                () => service.CreateAlertAsync(MakeUser(), 1, 0m, PriceAlertCondition.GreaterThanOrEqual)
            );
        }

        [Fact]
        public async Task CreateAlertAsync_StockNotFound_ThrowsInvalidOperationException()
        {
            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Stock?)null);
            var service = CreateService(new Mock<IPriceAlertRepository>(), stockRepo);

            await Assert.ThrowsAsync<InvalidOperationException>(
                () => service.CreateAlertAsync(MakeUser(), 99, 200m, PriceAlertCondition.GreaterThanOrEqual)
            );
        }

        [Fact]
        public async Task CreateAlertAsync_ValidInput_PersistsAlertForUser()
        {
            var user = MakeUser();
            var stock = MakeStock();
            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(r => r.GetByIdAsync(stock.Id)).ReturnsAsync(stock);

            var alertRepo = new Mock<IPriceAlertRepository>();
            alertRepo.Setup(r => r.CreateAsync(It.IsAny<PriceAlert>())).ReturnsAsync((PriceAlert a) => a);

            var service = CreateService(alertRepo, stockRepo);

            var alert = await service.CreateAlertAsync(user, stock.Id, 200m, PriceAlertCondition.GreaterThanOrEqual);

            Assert.Equal(user.Id, alert.AppUserId);
            Assert.Equal(stock.Id, alert.StockId);
            Assert.Equal(200m, alert.TargetPrice);
            alertRepo.Verify(r => r.CreateAsync(It.IsAny<PriceAlert>()), Times.Once);
        }

        [Fact]
        public async Task CheckAndTriggerAlertsAsync_PriceMeetsGreaterThanOrEqual_CreatesNotificationAndMarksTriggered()
        {
            var stock = MakeStock(purchase: 210m);
            var alert = new PriceAlert
            {
                Id = 1,
                AppUserId = "user-1",
                StockId = stock.Id,
                TargetPrice = 200m,
                Condition = PriceAlertCondition.GreaterThanOrEqual,
                IsActive = true,
                Stock = stock,
            };

            var alertRepo = new Mock<IPriceAlertRepository>();
            alertRepo.Setup(r => r.GetAllUntriggeredActiveAlertsAsync()).ReturnsAsync([alert]);

            var service = CreateService(alertRepo, new Mock<IStockRepository>());

            var triggeredCount = await service.CheckAndTriggerAlertsAsync();

            Assert.Equal(1, triggeredCount);
            Assert.NotNull(alert.TriggeredAt);
            alertRepo.Verify(r => r.UpdateAsync(alert), Times.Once);
            alertRepo.Verify(
                r =>
                    r.CreateNotificationAsync(
                        It.Is<AlertNotification>(n =>
                            n.PriceAlertId == alert.Id && n.AppUserId == alert.AppUserId
                        )
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task CheckAndTriggerAlertsAsync_PriceBelowThreshold_DoesNotTrigger()
        {
            var stock = MakeStock(purchase: 150m);
            var alert = new PriceAlert
            {
                Id = 1,
                AppUserId = "user-1",
                StockId = stock.Id,
                TargetPrice = 200m,
                Condition = PriceAlertCondition.GreaterThanOrEqual,
                IsActive = true,
                Stock = stock,
            };

            var alertRepo = new Mock<IPriceAlertRepository>();
            alertRepo.Setup(r => r.GetAllUntriggeredActiveAlertsAsync()).ReturnsAsync([alert]);

            var service = CreateService(alertRepo, new Mock<IStockRepository>());

            var triggeredCount = await service.CheckAndTriggerAlertsAsync();

            Assert.Equal(0, triggeredCount);
            Assert.Null(alert.TriggeredAt);
            alertRepo.Verify(r => r.CreateNotificationAsync(It.IsAny<AlertNotification>()), Times.Never);
        }

        [Fact]
        public async Task CheckAndTriggerAlertsAsync_LessThanOrEqualCondition_TriggersWhenPriceDrops()
        {
            var stock = MakeStock(purchase: 90m);
            var alert = new PriceAlert
            {
                Id = 1,
                AppUserId = "user-1",
                StockId = stock.Id,
                TargetPrice = 100m,
                Condition = PriceAlertCondition.LessThanOrEqual,
                IsActive = true,
                Stock = stock,
            };

            var alertRepo = new Mock<IPriceAlertRepository>();
            alertRepo.Setup(r => r.GetAllUntriggeredActiveAlertsAsync()).ReturnsAsync([alert]);

            var service = CreateService(alertRepo, new Mock<IStockRepository>());

            var triggeredCount = await service.CheckAndTriggerAlertsAsync();

            Assert.Equal(1, triggeredCount);
        }

        [Fact]
        public async Task MarkNotificationReadAsync_SetsIsReadTrue()
        {
            var notification = new AlertNotification
            {
                Id = 1,
                PriceAlertId = 1,
                AppUserId = "user-1",
                Message = "AAPL reached 210.00",
                IsRead = false,
            };

            var alertRepo = new Mock<IPriceAlertRepository>();
            var service = CreateService(alertRepo, new Mock<IStockRepository>());

            await service.MarkNotificationReadAsync(notification);

            Assert.True(notification.IsRead);
            alertRepo.Verify(r => r.UpdateNotificationAsync(notification), Times.Once);
        }

        [Fact]
        public async Task GetAlertByIdAsync_ReadsThroughToTheRepository()
        {
            var alert = new PriceAlert { Id = 7, AppUserId = "user-1", StockId = 1, TargetPrice = 200m };
            var alertRepo = new Mock<IPriceAlertRepository>();
            alertRepo.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(alert);

            var service = CreateService(alertRepo, new Mock<IStockRepository>());

            Assert.Same(alert, await service.GetAlertByIdAsync(7));
        }

        [Fact]
        public async Task DeleteAlertAsync_RemovesTheAlert()
        {
            var alert = new PriceAlert { Id = 7, AppUserId = "user-1", StockId = 1, TargetPrice = 200m };
            var alertRepo = new Mock<IPriceAlertRepository>();

            var service = CreateService(alertRepo, new Mock<IStockRepository>());

            await service.DeleteAlertAsync(alert);

            alertRepo.Verify(r => r.DeleteAsync(alert), Times.Once);
        }
    }
}
