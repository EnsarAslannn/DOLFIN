using api.Models;

namespace api.Dtos.Alerts
{
    public class PriceAlertDto
    {
        public int Id { get; set; }
        public int StockId { get; set; }
        public string Symbol { get; set; } = string.Empty;
        public decimal TargetPrice { get; set; }
        public PriceAlertCondition Condition { get; set; }
        public bool IsActive { get; set; }
        public DateTime? TriggeredAt { get; set; }

        /// <summary>The price that fired the alert; null while it is pending.</summary>
        public decimal? TriggeredPrice { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
