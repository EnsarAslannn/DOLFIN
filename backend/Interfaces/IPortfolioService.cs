using api.Dtos;
using api.Dtos.Portfolio;
using api.Helpers;
using api.Models;

namespace api.Interfaces
{
    public interface IPortfolioService
    {
        Task<List<PortfolioDto>> GetUserPortfolioAsync(AppUser user);
        Task<object> BuyStockAsync(AppUser user, string symbol, int quantity);
        Task<object> SellStockAsync(AppUser user, string symbol, int quantity);
        Task<object> DepositFundsAsync(AppUser user, decimal amount);
        Task<object> WithdrawFundsAsync(AppUser user, decimal amount);
        Task<List<TransactionDto>> GetTransactionHistoryAsync(AppUser user, TransactionQueryObject query);
    }
}
