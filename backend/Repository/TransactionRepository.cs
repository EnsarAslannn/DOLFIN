using api.Data;
using api.Helpers;
using api.Interfaces;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Repository
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly ApplicationDBContext _context;

        public TransactionRepository(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Transaction transaction)
        {
            await _context.Transactions.AddAsync(transaction);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Transaction>> GetByUserAsync(string appUserId, TransactionQueryObject query)
        {
            var skip = (query.PageNumber - 1) * query.PageSize;

            return await _context.Transactions
                .AsNoTracking()
                .Where(t => t.AppUserId == appUserId)
                .OrderByDescending(t => t.Timestamp)
                // Trades made inside the same tick share a timestamp, so the id
                // breaks the tie and keeps paging from repeating or skipping rows.
                .ThenByDescending(t => t.Id)
                .Skip(skip)
                .Take(query.PageSize)
                .ToListAsync();
        }
    }
}
