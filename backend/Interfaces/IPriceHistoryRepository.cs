using api.Models;

namespace api.Interfaces
{
    public interface IPriceHistoryRepository
    {
        Task RecordAsync(IEnumerable<PriceHistoryPoint> points);

        /// <summary>
        /// The most recent points for each of the given stocks, oldest first.
        /// Asking for several at once is the point: the wallet draws a line per
        /// position and would otherwise make one request per row.
        /// </summary>
        Task<Dictionary<int, List<PriceHistoryPoint>>> GetRecentAsync(
            IReadOnlyCollection<int> stockIds,
            int pointsPerStock
        );

        /// <summary>Drops points older than the cutoff. Returns how many went.</summary>
        Task<int> PruneOlderThanAsync(DateTime cutoffUtc);
    }
}
