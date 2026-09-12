using api.Caching;
using api.Interfaces;
using api.Models;
using api.Service;
using api.Tests.TestHelpers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace api.Tests.Service
{
    public class PortfolioServiceTests
    {
        private static AppUser MakeUser(decimal walletBalance = 1000m) =>
            new AppUser { Id = "user-1", UserName = "trader", WalletBalance = walletBalance };

        private static Stock MakeStock(string symbol = "AAPL", decimal purchase = 100m) =>
            new Stock { Id = 1, Symbol = symbol, CompanyName = "Apple Inc.", Purchase = purchase };

        private static Portfolio MakePosition(int quantity, decimal averagePrice) =>
            new Portfolio
            {
                Id = 1,
                AppUserId = "user-1",
                StockId = 1,
                Quantity = quantity,
                AveragePrice = averagePrice,
            };

        private static PortfolioService CreateService(
            Mock<IPortfolioRepository> portfolioRepo,
            Mock<IStockRepository> stockRepo,
            Mock<ITransactionRepository> transactionRepo,
            Mock<UserManager<AppUser>> userManager
        )
        {
            var unitOfWork = new Mock<IUnitOfWork>();
            unitOfWork
                .Setup(u => u.ExecuteInTransactionAsync(It.IsAny<Func<Task<object>>>()))
                .Returns<Func<Task<object>>>(operation => operation());

            var cache = new Mock<HybridCache>();
            cache
                .Setup(c => c.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .Returns(ValueTask.CompletedTask);

            transactionRepo
                .Setup(t => t.AddAsync(It.IsAny<Transaction>()))
                .Returns(Task.CompletedTask);

            var logger = new Mock<ILogger<PortfolioService>>();

            return new PortfolioService(
                portfolioRepo.Object,
                stockRepo.Object,
                transactionRepo.Object,
                unitOfWork.Object,
                userManager.Object,
                cache.Object,
                new CacheMetrics(),
                logger.Object
            );
        }

        [Fact]
        public async Task BuyStockAsync_ZeroOrNegativeQuantity_ThrowsDomainException()
        {
            var service = CreateService(
                new Mock<IPortfolioRepository>(),
                new Mock<IStockRepository>(),
                new Mock<ITransactionRepository>(),
                MockUserManager.Create()
            );

            await Assert.ThrowsAsync<DomainException>(
                () => service.BuyStockAsync(MakeUser(), "AAPL", 0)
            );
        }

        [Fact]
        public async Task BuyStockAsync_InsufficientFunds_ThrowsDomainException()
        {
            var user = MakeUser(walletBalance: 50m);
            var stock = MakeStock(purchase: 100m);

            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(s => s.GetBySymbolAsync("AAPL")).ReturnsAsync(stock);

            var service = CreateService(
                new Mock<IPortfolioRepository>(),
                stockRepo,
                new Mock<ITransactionRepository>(),
                MockUserManager.Create()
            );

            await Assert.ThrowsAsync<DomainException>(
                () => service.BuyStockAsync(user, "AAPL", 1)
            );
        }

        [Fact]
        public async Task BuyStockAsync_ExistingPosition_ComputesWeightedAveragePriceAndInvalidatesCache()
        {
            var user = MakeUser(walletBalance: 1000m);
            var stock = MakeStock(purchase: 100m);
            var existingPosition = MakePosition(quantity: 10, averagePrice: 80m);

            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(s => s.GetBySymbolAsync("AAPL")).ReturnsAsync(stock);

            var portfolioRepo = new Mock<IPortfolioRepository>();
            portfolioRepo
                .Setup(p => p.GetByAppUserAndStockId(user.Id, stock.Id))
                .ReturnsAsync(existingPosition);
            portfolioRepo
                .Setup(p => p.UpdateAsync(It.IsAny<Portfolio>()))
                .ReturnsAsync((Portfolio p) => p);

            var userManager = MockUserManager.Create();
            userManager
                .Setup(u => u.UpdateAsync(It.IsAny<AppUser>()))
                .ReturnsAsync(IdentityResult.Success);

            var service = CreateService(
                portfolioRepo,
                stockRepo,
                new Mock<ITransactionRepository>(),
                userManager
            );

            await service.BuyStockAsync(user, "AAPL", 10);

            Assert.Equal(20, existingPosition.Quantity);
            Assert.Equal(90m, existingPosition.AveragePrice);
            portfolioRepo.Verify(p => p.UpdateAsync(existingPosition), Times.Once);
        }

        [Fact]
        public async Task BuyStockAsync_NoExistingPosition_CreatesNewPortfolio()
        {
            var user = MakeUser(walletBalance: 1000m);
            var stock = MakeStock(purchase: 100m);

            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(s => s.GetBySymbolAsync("AAPL")).ReturnsAsync(stock);

            var portfolioRepo = new Mock<IPortfolioRepository>();
            portfolioRepo
                .Setup(p => p.GetByAppUserAndStockId(user.Id, stock.Id))
                .ReturnsAsync((Portfolio?)null);
            portfolioRepo
                .Setup(p => p.CreateAsync(It.IsAny<Portfolio>()))
                .ReturnsAsync((Portfolio p) => p);

            var userManager = MockUserManager.Create();
            userManager
                .Setup(u => u.UpdateAsync(It.IsAny<AppUser>()))
                .ReturnsAsync(IdentityResult.Success);

            var service = CreateService(
                portfolioRepo,
                stockRepo,
                new Mock<ITransactionRepository>(),
                userManager
            );

            await service.BuyStockAsync(user, "AAPL", 5);

            portfolioRepo.Verify(
                p => p.CreateAsync(It.Is<Portfolio>(x => x.Quantity == 5 && x.StockId == stock.Id)),
                Times.Once
            );
        }

        [Fact]
        public async Task BuyStockAsync_WalletUpdateConcurrencyFailure_ThrowsDomainException()
        {
            var user = MakeUser(walletBalance: 1000m);
            var stock = MakeStock(purchase: 100m);

            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(s => s.GetBySymbolAsync("AAPL")).ReturnsAsync(stock);

            var portfolioRepo = new Mock<IPortfolioRepository>();
            portfolioRepo
                .Setup(p => p.GetByAppUserAndStockId(user.Id, stock.Id))
                .ReturnsAsync((Portfolio?)null);

            var userManager = MockUserManager.Create();
            userManager
                .Setup(u => u.UpdateAsync(It.IsAny<AppUser>()))
                .ReturnsAsync(
                    IdentityResult.Failed(new IdentityError { Code = "ConcurrencyFailure" })
                );

            var service = CreateService(
                portfolioRepo,
                stockRepo,
                new Mock<ITransactionRepository>(),
                userManager
            );

            await Assert.ThrowsAsync<DomainException>(
                () => service.BuyStockAsync(user, "AAPL", 5)
            );
        }

        [Fact]
        public async Task SellStockAsync_ZeroOrNegativeQuantity_ThrowsDomainException()
        {
            var service = CreateService(
                new Mock<IPortfolioRepository>(),
                new Mock<IStockRepository>(),
                new Mock<ITransactionRepository>(),
                MockUserManager.Create()
            );

            await Assert.ThrowsAsync<DomainException>(
                () => service.SellStockAsync(MakeUser(), "AAPL", 0)
            );
        }

        [Fact]
        public async Task SellStockAsync_InsufficientQuantity_ThrowsDomainException()
        {
            var user = MakeUser();
            var stock = MakeStock();
            var existingPosition = MakePosition(quantity: 2, averagePrice: 100m);

            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(s => s.GetBySymbolAsync("AAPL")).ReturnsAsync(stock);

            var portfolioRepo = new Mock<IPortfolioRepository>();
            portfolioRepo
                .Setup(p => p.GetByAppUserAndStockId(user.Id, stock.Id))
                .ReturnsAsync(existingPosition);

            var service = CreateService(
                portfolioRepo,
                stockRepo,
                new Mock<ITransactionRepository>(),
                MockUserManager.Create()
            );

            await Assert.ThrowsAsync<DomainException>(
                () => service.SellStockAsync(user, "AAPL", 5)
            );
        }

        [Fact]
        public async Task SellStockAsync_FullQuantity_DeletesPosition()
        {
            var user = MakeUser();
            var stock = MakeStock();
            var existingPosition = MakePosition(quantity: 5, averagePrice: 100m);

            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(s => s.GetBySymbolAsync("AAPL")).ReturnsAsync(stock);

            var portfolioRepo = new Mock<IPortfolioRepository>();
            portfolioRepo
                .Setup(p => p.GetByAppUserAndStockId(user.Id, stock.Id))
                .ReturnsAsync(existingPosition);
            portfolioRepo
                .Setup(p => p.DeletePortfolio(user, "AAPL"))
                .ReturnsAsync(existingPosition);

            var userManager = MockUserManager.Create();
            userManager
                .Setup(u => u.UpdateAsync(It.IsAny<AppUser>()))
                .ReturnsAsync(IdentityResult.Success);

            var service = CreateService(
                portfolioRepo,
                stockRepo,
                new Mock<ITransactionRepository>(),
                userManager
            );

            await service.SellStockAsync(user, "AAPL", 5);

            portfolioRepo.Verify(p => p.DeletePortfolio(user, "AAPL"), Times.Once);
            portfolioRepo.Verify(p => p.UpdateAsync(It.IsAny<Portfolio>()), Times.Never);
        }

        [Fact]
        public async Task SellStockAsync_PartialQuantity_UpdatesPosition()
        {
            var user = MakeUser();
            var stock = MakeStock();
            var existingPosition = MakePosition(quantity: 10, averagePrice: 100m);

            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(s => s.GetBySymbolAsync("AAPL")).ReturnsAsync(stock);

            var portfolioRepo = new Mock<IPortfolioRepository>();
            portfolioRepo
                .Setup(p => p.GetByAppUserAndStockId(user.Id, stock.Id))
                .ReturnsAsync(existingPosition);
            portfolioRepo
                .Setup(p => p.UpdateAsync(It.IsAny<Portfolio>()))
                .ReturnsAsync((Portfolio p) => p);

            var userManager = MockUserManager.Create();
            userManager
                .Setup(u => u.UpdateAsync(It.IsAny<AppUser>()))
                .ReturnsAsync(IdentityResult.Success);

            var service = CreateService(
                portfolioRepo,
                stockRepo,
                new Mock<ITransactionRepository>(),
                userManager
            );

            await service.SellStockAsync(user, "AAPL", 4);

            Assert.Equal(6, existingPosition.Quantity);
            portfolioRepo.Verify(p => p.DeletePortfolio(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task SellStockAsync_PortfolioUpdateConcurrencyConflict_ThrowsDomainException()
        {
            var user = MakeUser();
            var stock = MakeStock();
            var existingPosition = MakePosition(quantity: 10, averagePrice: 100m);

            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(s => s.GetBySymbolAsync("AAPL")).ReturnsAsync(stock);

            var portfolioRepo = new Mock<IPortfolioRepository>();
            portfolioRepo
                .Setup(p => p.GetByAppUserAndStockId(user.Id, stock.Id))
                .ReturnsAsync(existingPosition);
            portfolioRepo
                .Setup(p => p.UpdateAsync(It.IsAny<Portfolio>()))
                .ThrowsAsync(new DbUpdateConcurrencyException());

            var userManager = MockUserManager.Create();
            userManager
                .Setup(u => u.UpdateAsync(It.IsAny<AppUser>()))
                .ReturnsAsync(IdentityResult.Success);

            var service = CreateService(
                portfolioRepo,
                stockRepo,
                new Mock<ITransactionRepository>(),
                userManager
            );

            await Assert.ThrowsAsync<DomainException>(
                () => service.SellStockAsync(user, "AAPL", 4)
            );
        }

        [Fact]
        public async Task DepositFundsAsync_ZeroOrNegativeAmount_ThrowsDomainException()
        {
            var service = CreateService(
                new Mock<IPortfolioRepository>(),
                new Mock<IStockRepository>(),
                new Mock<ITransactionRepository>(),
                MockUserManager.Create()
            );

            await Assert.ThrowsAsync<DomainException>(
                () => service.DepositFundsAsync(MakeUser(), 0m)
            );
        }

        [Fact]
        public async Task DepositFundsAsync_Success_IncreasesBalanceAndRecordsTransaction()
        {
            var user = MakeUser(walletBalance: 100m);

            var userManager = MockUserManager.Create();
            userManager
                .Setup(u => u.UpdateAsync(It.IsAny<AppUser>()))
                .ReturnsAsync(IdentityResult.Success);

            var transactionRepo = new Mock<ITransactionRepository>();

            var service = CreateService(
                new Mock<IPortfolioRepository>(),
                new Mock<IStockRepository>(),
                transactionRepo,
                userManager
            );

            await service.DepositFundsAsync(user, 50m);

            Assert.Equal(150m, user.WalletBalance);
            transactionRepo.Verify(
                t => t.AddAsync(It.Is<Transaction>(x => x.TransactionType == "DEPOSIT" && x.Price == 50m)),
                Times.Once
            );
        }

        [Fact]
        public async Task WithdrawFundsAsync_ZeroOrNegativeAmount_ThrowsDomainException()
        {
            var service = CreateService(
                new Mock<IPortfolioRepository>(),
                new Mock<IStockRepository>(),
                new Mock<ITransactionRepository>(),
                MockUserManager.Create()
            );

            await Assert.ThrowsAsync<DomainException>(
                () => service.WithdrawFundsAsync(MakeUser(), 0m)
            );
        }

        [Fact]
        public async Task WithdrawFundsAsync_InsufficientFunds_ThrowsDomainException()
        {
            var user = MakeUser(walletBalance: 10m);

            var service = CreateService(
                new Mock<IPortfolioRepository>(),
                new Mock<IStockRepository>(),
                new Mock<ITransactionRepository>(),
                MockUserManager.Create()
            );

            await Assert.ThrowsAsync<DomainException>(
                () => service.WithdrawFundsAsync(user, 50m)
            );
        }

        [Fact]
        public async Task WithdrawFundsAsync_Success_DecreasesBalanceAndRecordsTransaction()
        {
            var user = MakeUser(walletBalance: 100m);

            var userManager = MockUserManager.Create();
            userManager
                .Setup(u => u.UpdateAsync(It.IsAny<AppUser>()))
                .ReturnsAsync(IdentityResult.Success);

            var transactionRepo = new Mock<ITransactionRepository>();

            var service = CreateService(
                new Mock<IPortfolioRepository>(),
                new Mock<IStockRepository>(),
                transactionRepo,
                userManager
            );

            await service.WithdrawFundsAsync(user, 40m);

            Assert.Equal(60m, user.WalletBalance);
            transactionRepo.Verify(
                t => t.AddAsync(It.Is<Transaction>(x => x.TransactionType == "WITHDRAW" && x.Price == 40m)),
                Times.Once
            );
        }
    }
}
