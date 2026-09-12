using api.Data;
using api.Interfaces;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Repository
{
    public class WatchlistRepository : IWatchlistRepository
    {
        private readonly ApplicationDBContext _context;

        public WatchlistRepository(ApplicationDBContext context)
        {
            _context = context;
        }

        // The stock comes along because every field the list renders except
        // the date lives on it.
        public Task<List<WatchlistEntry>> GetForUserAsync(string appUserId) =>
            _context
                .WatchlistEntries.Include(w => w.Stock)
                .Where(w => w.AppUserId == appUserId)
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();

        public Task<WatchlistEntry?> GetAsync(string appUserId, int stockId) =>
            _context
                .WatchlistEntries.Include(w => w.Stock)
                .FirstOrDefaultAsync(w => w.AppUserId == appUserId && w.StockId == stockId);

        public async Task<WatchlistEntry> AddAsync(WatchlistEntry entry)
        {
            await _context.WatchlistEntries.AddAsync(entry);
            await _context.SaveChangesAsync();
            return entry;
        }

        public async Task RemoveAsync(WatchlistEntry entry)
        {
            _context.WatchlistEntries.Remove(entry);
            await _context.SaveChangesAsync();
        }
    }
}
