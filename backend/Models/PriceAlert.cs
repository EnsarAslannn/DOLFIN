using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("PriceAlerts")]
    public class PriceAlert
    {
        public int Id { get; set; }

        public required string AppUserId { get; set; }

        public int StockId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TargetPrice { get; set; }

        public PriceAlertCondition Condition { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime? TriggeredAt { get; set; }

        /// <summary>
        /// The price that actually set the alert off, which is not the target
        /// — a walk can jump straight past it. It used to be formatted into
        /// the notification's English sentence and then thrown away, so the
        /// figure could not be shown in any other language, or read back at
        /// all. Null until the alert fires.
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? TriggeredPrice { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public AppUser AppUser { get; set; } = default!;
        public Stock Stock { get; set; } = default!;
    }
}
