using api.Interfaces;
using api.Models;
using api.Service;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace api.Tests.Service
{
    public class PriceSimulationServiceTests
    {
        [Fact]
        public async Task TickAsync_ReturnsTheNumberOfStocksTheRepositoryMoved()
        {
            var repo = new Mock<IStockRepository>();
            repo.Setup(r => r.UpdatePricesAsync(It.IsAny<Func<Stock, decimal>>())).ReturnsAsync(7);

            var moved = await MakeService(repo).TickAsync();

            Assert.Equal(7, moved);
        }

        // The service owns the randomness, so the only way to check it is to
        // run the delegate it hands the repository and watch where it lands.
        [Fact]
        public async Task TickAsync_KeepsEveryGeneratedPriceInsideTheConfiguredBand()
        {
            var prices = new List<decimal>();
            var repo = new Mock<IStockRepository>();
            repo.Setup(r => r.UpdatePricesAsync(It.IsAny<Func<Stock, decimal>>()))
                .ReturnsAsync(
                    (Func<Stock, decimal> nextPrice) =>
                    {
                        for (var i = 0; i < 200; i++)
                        {
                            prices.Add(nextPrice(new Stock { Symbol = "AAPL", Purchase = 100m }));
                        }

                        return prices.Count;
                    }
                );

            await MakeService(repo, new PriceSimulationOptions { MaxMovePercent = 2m, MinPrice = 1m }).TickAsync();

            Assert.All(prices, price => Assert.InRange(price, 98m, 102m));
        }

        [Fact]
        public async Task TickAsync_ActuallyMovesPrices_RatherThanReturningThemUnchanged()
        {
            var prices = new List<decimal>();
            var repo = new Mock<IStockRepository>();
            repo.Setup(r => r.UpdatePricesAsync(It.IsAny<Func<Stock, decimal>>()))
                .ReturnsAsync(
                    (Func<Stock, decimal> nextPrice) =>
                    {
                        for (var i = 0; i < 200; i++)
                        {
                            prices.Add(nextPrice(new Stock { Symbol = "AAPL", Purchase = 100m }));
                        }

                        return prices.Count;
                    }
                );

            await MakeService(repo).TickAsync();

            Assert.Contains(prices, price => price != 100m);
        }

        private static PriceSimulationService MakeService(
            Mock<IStockRepository> repo,
            PriceSimulationOptions? options = null
        ) =>
            new(
                repo.Object,
                options ?? new PriceSimulationOptions(),
                new Mock<ILogger<PriceSimulationService>>().Object
            );
    }
}
