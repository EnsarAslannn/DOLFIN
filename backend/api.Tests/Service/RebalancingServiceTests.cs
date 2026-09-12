using api.Dtos.Portfolio;
using api.Interfaces;
using api.Models;
using api.Service;
using Moq;
using Xunit;

namespace api.Tests.Service
{
    public class RebalancingServiceTests
    {
        private static AppUser MakeUser() => new() { Id = "user-1", UserName = "trader" };

        private static StockAllocationDto MakeAllocation(
            int stockId,
            string symbol,
            decimal allocationPercent,
            decimal currentValue,
            decimal currentPrice
        ) =>
            new()
            {
                StockId = stockId,
                Symbol = symbol,
                AllocationPercent = allocationPercent,
                CurrentValue = currentValue,
                CurrentPrice = currentPrice,
            };

        private static RebalancingService CreateService(PortfolioMetricsDto metrics)
        {
            var analyticsService = new Mock<IPortfolioAnalyticsService>();
            analyticsService.Setup(s => s.GetMetricsAsync(It.IsAny<AppUser>())).ReturnsAsync(metrics);
            return new RebalancingService(analyticsService.Object);
        }

        [Fact]
        public async Task GetRecommendationAsync_NoPositions_ReturnsEmptyAdjustmentsWithMessage()
        {
            var service = CreateService(new PortfolioMetricsDto { Allocations = [] });

            var recommendation = await service.GetRecommendationAsync(MakeUser());

            Assert.Empty(recommendation.Adjustments);
            Assert.Equal(0, recommendation.HoldingCount);
            Assert.Contains("No open positions", recommendation.Summary);
        }

        // The wallet writes its own summary from these two figures, so they
        // have to be on the response rather than only inside the English
        // sentence.
        [Fact]
        public async Task GetRecommendationAsync_ReportsTheTargetAsFiguresNotOnlyProse()
        {
            var metrics = new PortfolioMetricsDto
            {
                CurrentValue = 1000m,
                Allocations =
                [
                    MakeAllocation(1, "AAPL", allocationPercent: 90m, currentValue: 900m, currentPrice: 100m),
                    MakeAllocation(2, "WMT", allocationPercent: 10m, currentValue: 100m, currentPrice: 50m),
                ],
            };
            var service = CreateService(metrics);

            var recommendation = await service.GetRecommendationAsync(MakeUser());

            Assert.Equal(2, recommendation.HoldingCount);
            Assert.Equal(50m, recommendation.TargetAllocationPercent);
            // Formatted the same way on every host, since a client reads it back.
            Assert.Contains("50.0%", recommendation.Summary);
        }

        [Fact]
        public async Task GetRecommendationAsync_OverweightStock_SuggestsSell()
        {
            var metrics = new PortfolioMetricsDto
            {
                CurrentValue = 1000m,
                Allocations =
                [
                    MakeAllocation(1, "AAPL", allocationPercent: 90m, currentValue: 900m, currentPrice: 100m),
                    MakeAllocation(2, "WMT", allocationPercent: 10m, currentValue: 100m, currentPrice: 50m),
                ],
            };
            var service = CreateService(metrics);

            var recommendation = await service.GetRecommendationAsync(MakeUser());

            var aapl = recommendation.Adjustments.Single(a => a.Symbol == "AAPL");
            Assert.Equal("Sell", aapl.Action);
            Assert.True(aapl.SuggestedQuantity > 0);
        }

        [Fact]
        public async Task GetRecommendationAsync_UnderweightStock_SuggestsBuy()
        {
            var metrics = new PortfolioMetricsDto
            {
                CurrentValue = 1000m,
                Allocations =
                [
                    MakeAllocation(1, "AAPL", allocationPercent: 90m, currentValue: 900m, currentPrice: 100m),
                    MakeAllocation(2, "WMT", allocationPercent: 10m, currentValue: 100m, currentPrice: 50m),
                ],
            };
            var service = CreateService(metrics);

            var recommendation = await service.GetRecommendationAsync(MakeUser());

            var wmt = recommendation.Adjustments.Single(a => a.Symbol == "WMT");
            Assert.Equal("Buy", wmt.Action);
            Assert.True(wmt.SuggestedQuantity > 0);
        }

        [Fact]
        public async Task GetRecommendationAsync_AlreadyBalanced_SuggestsHold()
        {
            var metrics = new PortfolioMetricsDto
            {
                CurrentValue = 1000m,
                Allocations =
                [
                    MakeAllocation(1, "AAPL", allocationPercent: 50m, currentValue: 500m, currentPrice: 100m),
                    MakeAllocation(2, "WMT", allocationPercent: 50m, currentValue: 500m, currentPrice: 50m),
                ],
            };
            var service = CreateService(metrics);

            var recommendation = await service.GetRecommendationAsync(MakeUser());

            Assert.All(recommendation.Adjustments, a => Assert.Equal("Hold", a.Action));
            Assert.All(recommendation.Adjustments, a => Assert.Equal(0, a.SuggestedQuantity));
        }

        [Fact]
        public async Task GetRecommendationAsync_TargetAllocationIsEqualWeight()
        {
            var metrics = new PortfolioMetricsDto
            {
                CurrentValue = 1000m,
                Allocations =
                [
                    MakeAllocation(1, "AAPL", allocationPercent: 60m, currentValue: 600m, currentPrice: 100m),
                    MakeAllocation(2, "WMT", allocationPercent: 25m, currentValue: 250m, currentPrice: 50m),
                    MakeAllocation(3, "JPM", allocationPercent: 15m, currentValue: 150m, currentPrice: 75m),
                ],
            };
            var service = CreateService(metrics);

            var recommendation = await service.GetRecommendationAsync(MakeUser());

            Assert.All(recommendation.Adjustments, a => Assert.Equal(100m / 3, a.TargetAllocationPercent));
        }
    }
}
