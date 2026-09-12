using api.Models;

namespace api.Interfaces
{
    public interface IWatchlistRepository
    {
        Task<List<WatchlistEntry>> GetForUserAsync(string appUserId);

        Task<WatchlistEntry?> GetAsync(string appUserId, int stockId);

        Task<WatchlistEntry> AddAsync(WatchlistEntry entry);

        Task RemoveAsync(WatchlistEntry entry);
    }
}
