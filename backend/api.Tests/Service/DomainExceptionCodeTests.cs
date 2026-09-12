using api.Interfaces;
using api.Models;
using api.Service;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace api.Tests.Service
{
    /// <summary>
    /// The codes themselves, rather than the sentences around them.
    ///
    /// The frontend looks up "error.&lt;code&gt;" in its own dictionary, so a
    /// code that quietly changes here stops translating there and silently
    /// falls back to the English message — exactly the thing this mechanism
    /// exists to stop. These assertions are what make that a failing test
    /// rather than a regression nobody notices.
    /// </summary>
    public class DomainExceptionCodeTests
    {
        private static AppUser MakeUser(decimal walletBalance = 0m) =>
            new() { Id = "user-1", UserName = "trader", WalletBalance = walletBalance };

        private static Stock MakeStock(decimal purchase = 150m) =>
            new()
            {
                Id = 1,
                Symbol = "AAPL",
                CompanyName = "Apple Inc.",
                Purchase = purchase,
                Industry = "Consumer Electronics",
            };

        // Every case here fails before any repository, transaction or cache is
        // reached, so bare mocks are enough -- the point is the code on the
        // exception, not the path that would have followed.
        private static PortfolioService CreatePortfolioService(Mock<IStockRepository> stockRepo) =>
            new(
                new Mock<IPortfolioRepository>().Object,
                stockRepo.Object,
                new Mock<ITransactionRepository>().Object,
                new Mock<IUnitOfWork>().Object,
                api.Tests.TestHelpers.MockUserManager.Create().Object,
                new Mock<Microsoft.Extensions.Caching.Hybrid.HybridCache>().Object,
                new Mock<api.Caching.ICacheMetrics>().Object,
                new Mock<ILogger<PortfolioService>>().Object
            );

        [Fact]
        public async Task BuyStock_InsufficientFunds_CarriesTheCodeAndTheFigures()
        {
            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(r => r.GetBySymbolAsync("AAPL")).ReturnsAsync(MakeStock(purchase: 150m));

            var service = CreatePortfolioService(stockRepo);

            var ex = await Assert.ThrowsAsync<DomainException>(
                () => service.BuyStockAsync(MakeUser(walletBalance: 10m), "AAPL", 3)
            );

            Assert.Equal(ErrorCodes.PortfolioInsufficientFunds, ex.Code);
            Assert.NotNull(ex.Args);
            // The client builds its own sentence out of these rather than
            // parsing them back out of the English one.
            Assert.Equal("450.00", ex.Args!["required"]);
            Assert.Equal("10.00", ex.Args["available"]);
        }

        [Fact]
        public async Task BuyStock_UnknownSymbol_CarriesTheStockNotFoundCode()
        {
            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(r => r.GetBySymbolAsync("NOPE")).ReturnsAsync((Stock?)null);

            var service = CreatePortfolioService(stockRepo);

            var ex = await Assert.ThrowsAsync<DomainException>(
                () => service.BuyStockAsync(MakeUser(), "NOPE", 1)
            );

            Assert.Equal(ErrorCodes.PortfolioStockNotFound, ex.Code);
        }

        [Fact]
        public async Task BuyStock_ZeroQuantity_CarriesTheQuantityCode()
        {
            var service = CreatePortfolioService(new Mock<IStockRepository>());

            var ex = await Assert.ThrowsAsync<DomainException>(
                () => service.BuyStockAsync(MakeUser(), "AAPL", 0)
            );

            Assert.Equal(ErrorCodes.PortfolioQuantityNotPositive, ex.Code);
        }

        [Fact]
        public async Task WithdrawFunds_OverBalance_CarriesTheCodeAndTheFigures()
        {
            var service = CreatePortfolioService(new Mock<IStockRepository>());

            var ex = await Assert.ThrowsAsync<DomainException>(
                () => service.WithdrawFundsAsync(MakeUser(walletBalance: 25m), 100m)
            );

            Assert.Equal(ErrorCodes.PortfolioInsufficientBalance, ex.Code);
            Assert.Equal("100.00", ex.Args!["requested"]);
            Assert.Equal("25.00", ex.Args["available"]);
        }

        [Fact]
        public async Task CreateAlert_DuplicatePending_CarriesTheCodeAndTheWatch()
        {
            var stock = MakeStock();
            var stockRepo = new Mock<IStockRepository>();
            stockRepo.Setup(r => r.GetByIdAsync(stock.Id)).ReturnsAsync(stock);

            var alertRepo = new Mock<IPriceAlertRepository>();
            alertRepo
                .Setup(r =>
                    r.HasPendingDuplicateAsync(
                        It.IsAny<string>(),
                        It.IsAny<int>(),
                        It.IsAny<decimal>(),
                        It.IsAny<PriceAlertCondition>()
                    )
                )
                .ReturnsAsync(true);

            var service = new PriceAlertService(
                alertRepo.Object,
                stockRepo.Object,
                new Mock<ILogger<PriceAlertService>>().Object
            );

            var ex = await Assert.ThrowsAsync<DomainException>(
                () =>
                    service.CreateAlertAsync(
                        MakeUser(),
                        stock.Id,
                        200m,
                        PriceAlertCondition.GreaterThanOrEqual
                    )
            );

            Assert.Equal(ErrorCodes.AlertDuplicatePending, ex.Code);
            Assert.Equal("AAPL", ex.Args!["symbol"]);
            Assert.Equal("200.00", ex.Args["targetPrice"]);
        }

        // Every error body carries a code, so a client never has to fall back
        // to matching on English prose.
        [Fact]
        public void ToApiError_CarriesCodeMessageAndArgs()
        {
            var ex = new DomainException(
                ErrorCodes.PortfolioInsufficientFunds,
                "Insufficient funds.",
                new Dictionary<string, string> { ["required"] = "1.00" }
            );

            var body = ex.ToApiError();

            Assert.Equal(ErrorCodes.PortfolioInsufficientFunds, body.Code);
            Assert.Equal("Insufficient funds.", body.Message);
            Assert.Equal("1.00", body.Args!["required"]);
        }
    }
}
