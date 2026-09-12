namespace api.Dtos.Portfolio
{
    public class RebalancingRecommendationDto
    {
        public List<StockAdjustmentDto> Adjustments { get; set; } = [];

        /// <summary>
        /// How many positions the equal-weight target is spread across. Zero
        /// means there is nothing to rebalance.
        /// </summary>
        public int HoldingCount { get; set; }

        /// <summary>The equal-weight share each holding is measured against.</summary>
        public decimal TargetAllocationPercent { get; set; }

        /// <summary>
        /// The same summary as one English sentence, for clients that do not
        /// compose their own from the two figures above.
        /// </summary>
        public string Summary { get; set; } = string.Empty;
    }
}
