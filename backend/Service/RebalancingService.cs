using api.Dtos.Portfolio;
using api.Extensions;
using api.Interfaces;
using api.Models;

namespace api.Service
{
    public class RebalancingService : IRebalancingService
    {
        private const decimal ToleranceBandPercent = 2m;

        private readonly IPortfolioAnalyticsService _analyticsService;

        public RebalancingService(IPortfolioAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        public async Task<RebalancingRecommendationDto> GetRecommendationAsync(AppUser user)
        {
            var metrics = await _analyticsService.GetMetricsAsync(user);

            if (metrics.Allocations.Count == 0)
            {
                return new RebalancingRecommendationDto
                {
                    Adjustments = [],
                    HoldingCount = 0,
                    TargetAllocationPercent = 0m,
                    Summary = "No open positions to rebalance.",
                };
            }

            var targetPercent = 100m / metrics.Allocations.Count;

            var adjustments = metrics
                .Allocations.Select(allocation =>
                    BuildAdjustment(allocation, targetPercent, metrics.CurrentValue)
                )
                .ToList();

            return new RebalancingRecommendationDto
            {
                Adjustments = adjustments,
                // The figures travel as data so the wallet can write the
                // summary in whichever language it is showing; the sentence
                // below stays for anything reading the API directly.
                HoldingCount = metrics.Allocations.Count,
                TargetAllocationPercent = targetPercent,
                Summary =
                    $"Equal-weight target across {metrics.Allocations.Count} holding(s) is {targetPercent.ToInvariantPercent()}% each.",
            };
        }

        private static StockAdjustmentDto BuildAdjustment(
            StockAllocationDto allocation,
            decimal targetPercent,
            decimal totalCurrentValue
        )
        {
            var deviation = allocation.AllocationPercent - targetPercent;
            var action =
                Math.Abs(deviation) <= ToleranceBandPercent ? "Hold"
                : deviation > 0 ? "Sell"
                : "Buy";

            var suggestedQuantity = 0;
            if (action != "Hold" && allocation.CurrentPrice > 0)
            {
                var targetValue = totalCurrentValue * (targetPercent / 100);
                var valueDifference = Math.Abs(targetValue - allocation.CurrentValue);
                suggestedQuantity = (int)
                    Math.Round(valueDifference / allocation.CurrentPrice, MidpointRounding.AwayFromZero);
            }

            return new StockAdjustmentDto
            {
                StockId = allocation.StockId,
                Symbol = allocation.Symbol,
                CurrentAllocationPercent = allocation.AllocationPercent,
                TargetAllocationPercent = targetPercent,
                Action = action,
                SuggestedQuantity = suggestedQuantity,
            };
        }
    }
}
