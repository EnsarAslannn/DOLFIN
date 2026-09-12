using api.Data;
using api.Dtos.Stock;
using api.Helpers;
using api.Interfaces;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Repository
{
    public class StockRepository : IStockRepository
    {
        private readonly ApplicationDBContext _context;

        public StockRepository(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<Stock> CreateAsync(Stock stockModel)
        {
            await _context.Stock.AddAsync(stockModel);
            await _context.SaveChangesAsync();
            return stockModel;
        }

        public async Task<Stock?> DeleteAsync(int id)
        {
            var stockModel = await _context.Stock.FirstOrDefaultAsync(x => x.Id == id);

            if (stockModel == null)
            {
                return null;
            }

            _context.Stock.Remove(stockModel);
            await _context.SaveChangesAsync();
            return stockModel;
        }

        public async Task<List<Stock>> GetAllAsync(QueryObject query)
        {
            var stocks = _context.Stock.AsQueryable();

            // Lowered on both sides rather than left to a bare Contains: that
            // compiles to a plain LIKE, which PostgreSQL matches
            // case-sensitively, so searching "microsoft" found nothing while
            // "Microsoft" found the row. Npgsql turns this into
            // `lower(col) LIKE '%term%'`. EF.Functions.ILike would read better
            // but has no implementation on the InMemory provider the unit
            // tests run against, and a leading wildcard rules out an index
            // either way, so nothing is given up here.
            if (!string.IsNullOrWhiteSpace(query.CompanyName))
            {
                var companyName = query.CompanyName.ToLower();
                stocks = stocks.Where(s => s.CompanyName.ToLower().Contains(companyName));
            }

            if (!string.IsNullOrWhiteSpace(query.Symbol))
            {
                var symbol = query.Symbol.ToLower();
                stocks = stocks.Where(s => s.Symbol.ToLower().Contains(symbol));
            }

            if (!string.IsNullOrWhiteSpace(query.SortBy))
            {
                if (query.SortBy.Equals("Symbol", StringComparison.OrdinalIgnoreCase))
                {
                    stocks = query.IsDescending
                        ? stocks.OrderByDescending(s => s.Symbol)
                        : stocks.OrderBy(s => s.Symbol);
                }
                else if (query.SortBy.Equals("MarketCap", StringComparison.OrdinalIgnoreCase))
                {
                    stocks = query.IsDescending
                        ? stocks.OrderByDescending(s => s.MarketCap)
                        : stocks.OrderBy(s => s.MarketCap);
                }
            }
            else
            {
                stocks = stocks.OrderBy(s => s.Id);
            }

            var skipNumber = (query.PageNumber - 1) * query.PageSize;

            return await stocks.Skip(skipNumber).Take(query.PageSize).ToListAsync();
        }

        public async Task<Stock?> GetByIdAsync(int id)
        {
            return await _context
                .Stock.Include(c => c.Comments)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<Stock?> GetBySymbolAsync(string symbol)
        {
            var normalized = symbol.Trim().ToUpperInvariant();
            return await _context.Stock.FirstOrDefaultAsync(s => s.Symbol.ToUpper() == normalized);
        }

        public Task<bool> StockExists(int id)
        {
            return _context.Stock.AnyAsync(s => s.Id == id);
        }

        public async Task<int> UpdatePricesAsync(Func<Stock, decimal> nextPrice)
        {
            var stocks = await _context.Stock.ToListAsync();

            foreach (var stock in stocks)
            {
                stock.Purchase = nextPrice(stock);
            }

            await _context.SaveChangesAsync();
            return stocks.Count;
        }

        public async Task<Stock?> UpdateAsync(int id, UpdateStockRequestDto stockDto)
        {
            var existingStock = await _context.Stock.FirstOrDefaultAsync(x => x.Id == id);

            if (existingStock == null)
            {
                return null;
            }

            existingStock.Symbol = stockDto.Symbol.Trim().ToUpperInvariant();
            existingStock.CompanyName = stockDto.CompanyName;
            existingStock.Purchase = stockDto.Purchase;
            existingStock.LastDiv = stockDto.LastDiv;
            existingStock.Industry = stockDto.Industry;
            existingStock.MarketCap = stockDto.MarketCap;

            await _context.SaveChangesAsync();

            return existingStock;
        }

        public async Task<Dictionary<int, string>> GetSymbolsByIdsAsync(
            IReadOnlyCollection<int> stockIds
        )
        {
            if (stockIds.Count == 0)
                return [];

            return await _context
                .Stock.Where(s => stockIds.Contains(s.Id))
                .Select(s => new { s.Id, s.Symbol })
                .ToDictionaryAsync(s => s.Id, s => s.Symbol);
        }

        public async Task<List<Stock>> GetMarketTrendsAsync()
        {
            var trendSymbols = new List<string>
    {
        "MSFT", "AAPL", "TSLA", "GOOGL", "NVDA",
        "AMZN", "META", "NFLX", "AMD", "DIS",
        "BRK.B", "VISA", "JPM", "JNJ", "WMT"
    };

            var allStocks = await _context.Stock.ToListAsync();
            return allStocks
                .Where(s => s != null && !string.IsNullOrEmpty(s.Symbol) &&
                            trendSymbols.Contains(s.Symbol.Trim().ToUpper()))
                .ToList();
        }
    }
}
