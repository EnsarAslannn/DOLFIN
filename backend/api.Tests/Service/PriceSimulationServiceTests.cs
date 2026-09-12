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

        // The walk had been running since it was written and keeping none of
        // it: every tick overwrote the one price a stock had, so there was
        // never anything to draw a line from.
        [Fact]
        public async Task TickAsync_WritesOnePointPerStockAtOneTimestamp()
        {
            var recorded = new List<PriceHistoryPoint>();
            var historyRepo = new Mock<IPriceHistoryRepository>();
            historyRepo
                .Setup(r => r.RecordAsync(It.IsAny<IEnumerable<PriceHistoryPoint>>()))
                .Callback<IEnumerable<PriceHistoryPoint>>(points => recorded.AddRange(points))
                .Returns(Task.CompletedTask);

            var repo = new Mock<IStockRepository>();
            repo.Setup(r => r.UpdatePricesAsync(It.IsAny<Func<Stock, decimal>>()))
                .ReturnsAsync(
                    (Func<Stock, decimal> nextPrice) =>
                    {
                        nextPrice(new Stock { Id = 1, Symbol = "AAPL", Purchase = 100m });
                        nextPrice(new Stock { Id = 2, Symbol = "MSFT", Purchase = 400m });
                        return 2;
                    }
                );

            await MakeService(repo, historyRepo: historyRepo).TickAsync();

            Assert.Equal(2, recorded.Count);
            Assert.Contains(recorded, p => p.StockId == 1);
            Assert.Contains(recorded, p => p.StockId == 2);
            // One snapshot of a simulated market, so one timestamp -- stamping
            // them apart would put the catalog on slightly different clocks in
            // any chart drawn from it.
            Assert.Single(recorded.Select(p => p.RecordedAt).Distinct());
        }

        [Fact]
        public async Task TickAsync_RecordsThePriceItActuallyWrote()
        {
            var recorded = new List<PriceHistoryPoint>();
            var written = new List<decimal>();
            var historyRepo = new Mock<IPriceHistoryRepository>();
            historyRepo
                .Setup(r => r.RecordAsync(It.IsAny<IEnumerable<PriceHistoryPoint>>()))
                .Callback<IEnumerable<PriceHistoryPoint>>(points => recorded.AddRange(points))
                .Returns(Task.CompletedTask);

            var repo = new Mock<IStockRepository>();
            repo.Setup(r => r.UpdatePricesAsync(It.IsAny<Func<Stock, decimal>>()))
                .ReturnsAsync(
                    (Func<Stock, decimal> nextPrice) =>
                    {
                        written.Add(nextPrice(new Stock { Id = 1, Symbol = "AAPL", Purchase = 100m }));
                        return 1;
                    }
                );

            await MakeService(repo, historyRepo: historyRepo).TickAsync();

            Assert.Equal(written.Single(), Assert.Single(recorded).Price);
        }

        [Fact]
        public async Task TickAsync_PrunesHistoryPastTheRetentionWindow()
        {
            DateTime? cutoff = null;
            var historyRepo = new Mock<IPriceHistoryRepository>();
            historyRepo
                .Setup(r => r.PruneOlderThanAsync(It.IsAny<DateTime>()))
                .Callback<DateTime>(c => cutoff = c)
                .ReturnsAsync(0);

            var repo = new Mock<IStockRepository>();
            repo.Setup(r => r.UpdatePricesAsync(It.IsAny<Func<Stock, decimal>>())).ReturnsAsync(0);

            await MakeService(
                repo,
                new PriceSimulationOptions { HistoryRetentionHours = 6 },
                historyRepo
            ).TickAsync();

            Assert.NotNull(cutoff);
            Assert.InRange(DateTime.UtcNow - cutoff!.Value, TimeSpan.FromHours(5.9), TimeSpan.FromHours(6.1));
        }

        [Fact]
        public async Task TickAsync_RetentionOfZeroKeepsEverything()
        {
            var historyRepo = new Mock<IPriceHistoryRepository>();
            var repo = new Mock<IStockRepository>();
            repo.Setup(r => r.UpdatePricesAsync(It.IsAny<Func<Stock, decimal>>())).ReturnsAsync(0);

            await MakeService(
                repo,
                new PriceSimulationOptions { HistoryRetentionHours = 0 },
                historyRepo
            ).TickAsync();

            historyRepo.Verify(r => r.PruneOlderThanAsync(It.IsAny<DateTime>()), Times.Never);
        }

        // Losing a sweep costs disk, not correctness. It must not take the
        // price walk down with it.
        [Fact]
        public async Task TickAsync_SurvivesAFailedRetentionSweep()
        {
            var historyRepo = new Mock<IPriceHistoryRepository>();
            historyRepo
                .Setup(r => r.PruneOlderThanAsync(It.IsAny<DateTime>()))
                .ThrowsAsync(new InvalidOperationException("database went away"));

            var repo = new Mock<IStockRepository>();
            repo.Setup(r => r.UpdatePricesAsync(It.IsAny<Func<Stock, decimal>>())).ReturnsAsync(4);

            var moved = await MakeService(repo, historyRepo: historyRepo).TickAsync();

            Assert.Equal(4, moved);
        }

        private static PriceSimulationService MakeService(
            Mock<IStockRepository> repo,
            PriceSimulationOptions? options = null,
            Mock<IPriceHistoryRepository>? historyRepo = null
        ) =>
            new(
                repo.Object,
                (historyRepo ?? new Mock<IPriceHistoryRepository>()).Object,
                options ?? new PriceSimulationOptions(),
                new Mock<ILogger<PriceSimulationService>>().Object
            );
    }
}
