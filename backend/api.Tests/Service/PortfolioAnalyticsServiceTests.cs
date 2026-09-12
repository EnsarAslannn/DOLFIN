using api.Dtos;
using api.Interfaces;
using api.Models;
using api.Service;
using Moq;
using Xunit;

namespace api.Tests.Service
{
    public class PortfolioAnalyticsServiceTests
    {
        private static AppUser MakeUser() => new() { Id = "user-1", UserName = "trader" };

        private static PortfolioDto MakePosition(
            int id,
            string symbol,
            string industry,
            int quantity,
            decimal averagePrice,
            decimal currentPrice
        ) =>
            new()
            {
                Id = id,
                Symbol = symbol,
                CompanyName = $"{symbol} Inc.",
                Purchase = currentPrice,
                Industry = industry,
                Quantity = quantity,
                AveragePrice = averagePrice,
            };

        private static PortfolioAnalyticsService CreateService(List<PortfolioDto> positions)
        {
            var portfolioService = new Mock<IPortfolioService>();
            portfolioService.Setup(s => s.GetUserPortfolioAsync(It.IsAny<AppUser>())).ReturnsAsync(positions);
            return new PortfolioAnalyticsService(portfolioService.Object);
        }

        [Fact]
        public async Task GetMetricsAsync_SumsInvestedAndCurrentValueAcrossPositions()
        {
            var positions = new List<PortfolioDto>
            {
                MakePosition(1, "AAPL", "Consumer Electronics", quantity: 10, averagePrice: 100m, currentPrice: 150m),
                MakePosition(2, "MSFT", "Software", quantity: 5, averagePrice: 200m, currentPrice: 250m),
            };
            var service = CreateService(positions);

            var metrics = await service.GetMetricsAsync(MakeUser());

            Assert.Equal(2000m, metrics.TotalInvestedAmount);
            Assert.Equal(2750m, metrics.CurrentValue);
            Assert.Equal(750m, metrics.GainLossAmount);
        }

        [Fact]
        public async Task GetMetricsAsync_ComputesGainLossPercent()
        {
            var positions = new List<PortfolioDto>
            {
                MakePosition(1, "AAPL", "Consumer Electronics", quantity: 10, averagePrice: 200m, currentPrice: 250m),
            };
            var service = CreateService(positions);

            var metrics = await service.GetMetricsAsync(MakeUser());

            Assert.Equal(25m, metrics.GainLossPercent);
        }

        [Fact]
        public async Task GetMetricsAsync_EmptyPortfolio_ReturnsZeroedMetrics()
        {
            var service = CreateService([]);

            var metrics = await service.GetMetricsAsync(MakeUser());

            Assert.Equal(0m, metrics.TotalInvestedAmount);
            Assert.Equal(0m, metrics.CurrentValue);
            Assert.Equal(0m, metrics.GainLossAmount);
            Assert.Equal(0m, metrics.GainLossPercent);
            Assert.Empty(metrics.Allocations);
        }

        [Fact]
        public async Task GetMetricsAsync_ComputesPerStockAllocationPercent()
        {
            var positions = new List<PortfolioDto>
            {
                MakePosition(1, "AAPL", "Consumer Electronics", quantity: 10, averagePrice: 100m, currentPrice: 100m),
                MakePosition(2, "MSFT", "Software", quantity: 10, averagePrice: 100m, currentPrice: 300m),
            };
            var service = CreateService(positions);

            var metrics = await service.GetMetricsAsync(MakeUser());

            var aapl = metrics.Allocations.Single(a => a.Symbol == "AAPL");
            var msft = metrics.Allocations.Single(a => a.Symbol == "MSFT");
            Assert.Equal(25m, aapl.AllocationPercent);
            Assert.Equal(75m, msft.AllocationPercent);
        }

        [Fact]
        public async Task GetAllocationWarningsAsync_SingleStockOverThreshold_ReturnsWarning()
        {
            var positions = new List<PortfolioDto>
            {
                MakePosition(1, "AAPL", "Consumer Electronics", quantity: 10, averagePrice: 100m, currentPrice: 100m),
                MakePosition(2, "WMT", "Discount Stores", quantity: 1, averagePrice: 100m, currentPrice: 100m),
            };
            var service = CreateService(positions);

            var warnings = await service.GetAllocationWarningsAsync(MakeUser());

            var warning = Assert.Single(
                warnings,
                w => w.Code == ErrorCodes.PortfolioWarningConcentration
            );
            Assert.Equal("AAPL", warning.Symbol);
            Assert.Null(warning.Industry);
            // The figure comes back as a number, not baked into a sentence, so
            // the client can put it where its own grammar wants it.
            Assert.True(warning.Percent > 40m);
        }

        [Fact]
        public async Task GetAllocationWarningsAsync_SectorOverThreshold_ReturnsWarning()
        {
            var positions = new List<PortfolioDto>
            {
                MakePosition(1, "AAPL", "Technology", quantity: 4, averagePrice: 100m, currentPrice: 100m),
                MakePosition(2, "MSFT", "Technology", quantity: 4, averagePrice: 100m, currentPrice: 100m),
                MakePosition(3, "WMT", "Discount Stores", quantity: 2, averagePrice: 100m, currentPrice: 100m),
            };
            var service = CreateService(positions);

            var warnings = await service.GetAllocationWarningsAsync(MakeUser());

            Assert.Contains(
                warnings,
                w => w.Code == ErrorCodes.PortfolioWarningSector && w.Industry == "Technology"
            );
        }

        [Fact]
        public async Task GetAllocationWarningsAsync_BalancedPortfolio_ReturnsNoWarnings()
        {
            var positions = new List<PortfolioDto>
            {
                MakePosition(1, "AAPL", "Consumer Electronics", quantity: 1, averagePrice: 100m, currentPrice: 100m),
                MakePosition(2, "WMT", "Discount Stores", quantity: 1, averagePrice: 100m, currentPrice: 100m),
                MakePosition(3, "JPM", "Banks", quantity: 1, averagePrice: 100m, currentPrice: 100m),
            };
            var service = CreateService(positions);

            var warnings = await service.GetAllocationWarningsAsync(MakeUser());

            Assert.Empty(warnings);
        }
    }
}
