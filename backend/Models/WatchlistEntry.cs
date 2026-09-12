using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    /// <summary>
    /// A stock a user is following without owning.
    ///
    /// The only way to keep an eye on something was to set a price alert,
    /// which means naming a level and a direction up front -- fine once you
    /// have an opinion, useless while you are still forming one.
    /// </summary>
    [Table("WatchlistEntries")]
    public class WatchlistEntry
    {
        public int Id { get; set; }

        public required string AppUserId { get; set; }

        public int StockId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public AppUser AppUser { get; set; } = default!;

        public Stock Stock { get; set; } = default!;
    }
}
