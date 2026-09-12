using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    /// <summary>
    /// One stock's price at one moment.
    ///
    /// The simulation has moved prices on a timer since it was written and
    /// kept none of it: every tick overwrote Stock.Purchase, so the only
    /// price that ever existed was the current one. That is why there was no
    /// chart to draw -- not because nothing had happened, but because nothing
    /// was written down.
    /// </summary>
    [Table("PriceHistory")]
    public class PriceHistoryPoint
    {
        public long Id { get; set; }

        public int StockId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

        public Stock Stock { get; set; } = default!;
    }
}
