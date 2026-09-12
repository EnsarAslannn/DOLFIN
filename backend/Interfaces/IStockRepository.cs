using api.Dtos.Stock;
using api.Helpers;
using api.Models;

namespace api.Interfaces
{
    public interface IStockRepository
    {
        Task<List<Stock>> GetAllAsync(QueryObject query);

        Task<Stock?> GetByIdAsync(int id);

        Task<Stock?> GetBySymbolAsync(string symbol);

        Task<Stock> CreateAsync(Stock stockModel);

        Task<Stock?> UpdateAsync(int id, UpdateStockRequestDto stockDto);

        Task<Stock?> DeleteAsync(int id);

        Task<bool> StockExists(int id);

        Task<List<Stock>> GetMarketTrendsAsync();

        Task<int> UpdatePricesAsync(Func<Stock, decimal> nextPrice);

        /// <summary>
        /// The symbols for a set of ids, in one query. The price-history
        /// response labels each series with its ticker, and fetching the stocks
        /// one at a time to read a single string off each is the N+1 the
        /// interceptor exists to complain about.
        /// </summary>
        Task<Dictionary<int, string>> GetSymbolsByIdsAsync(IReadOnlyCollection<int> stockIds);
    }
}
