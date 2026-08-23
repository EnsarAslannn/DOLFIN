using api.Helpers;
using api.Models;

namespace api.Interfaces
{
    public interface ITransactionRepository
    {
        Task AddAsync(Transaction transaction);
        Task<List<Transaction>> GetByUserAsync(string appUserId, TransactionQueryObject query);
    }
}
