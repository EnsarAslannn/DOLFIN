using api.Data;
using api.Interfaces;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Repository
{
    public class PriceHistoryRepository : IPriceHistoryRepository
    {
        private readonly ApplicationDBContext _context;

        public PriceHistoryRepository(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task RecordAsync(IEnumerable<PriceHistoryPoint> points)
        {
            await _context.PriceHistory.AddRangeAsync(points);
            await _context.SaveChangesAsync();
        }

        public async Task<Dictionary<int, List<PriceHistoryPoint>>> GetRecentAsync(
            IReadOnlyCollection<int> stockIds,
            int pointsPerStock
        )
        {
            if (stockIds.Count == 0 || pointsPerStock <= 0)
                return [];

            // One query for every stock asked about rather than one per stock.
            // Taking the newest `pointsPerStock` per group and reversing them
            // in memory keeps it to a single round trip; the row count is
            // bounded by the caller's page size times this limit, and the
            // retention sweep keeps the table itself small.
            var rows = await _context
                .PriceHistory.Where(p => stockIds.Contains(p.StockId))
                .GroupBy(p => p.StockId)
                .Select(g => new
                {
                    StockId = g.Key,
                    Points = g.OrderByDescending(p => p.RecordedAt)
                        .ThenByDescending(p => p.Id)
                        .Take(pointsPerStock)
                        .ToList(),
                })
                .ToListAsync();

            return rows.ToDictionary(
                r => r.StockId,
                r => r.Points.OrderBy(p => p.RecordedAt).ThenBy(p => p.Id).ToList()
            );
        }

        public Task<int> PruneOlderThanAsync(DateTime cutoffUtc) =>
            _context.PriceHistory.Where(p => p.RecordedAt < cutoffUtc).ExecuteDeleteAsync();
    }
}
