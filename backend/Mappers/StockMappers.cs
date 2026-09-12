using api.Dtos.Stock;
using api.Models;

namespace api.Mappers
{
    public static class StockMappers
    {
        public static StockDto ToStockDto(this Stock stockModel)
        {
            return new StockDto
            {
                Id = stockModel.Id,
                Symbol = stockModel.Symbol,
                CompanyName = stockModel.CompanyName,
                Purchase = stockModel.Purchase,
                LastDiv = stockModel.LastDiv,
                Industry = stockModel.Industry,
                MarketCap = stockModel.MarketCap,
                Comments = stockModel.Comments.Select(c => c.ToCommentDto()).ToList(),
            };
        }

        public static PricePointDto ToPricePointDto(this PriceHistoryPoint point)
        {
            return new PricePointDto { Price = point.Price, RecordedAt = point.RecordedAt };
        }

        public static WatchlistItemDto ToWatchlistItemDto(this WatchlistEntry entry)
        {
            return new WatchlistItemDto
            {
                Id = entry.Id,
                StockId = entry.StockId,
                Symbol = entry.Stock.Symbol,
                CompanyName = entry.Stock.CompanyName,
                Industry = entry.Stock.Industry,
                Purchase = entry.Stock.Purchase,
                CreatedAt = entry.CreatedAt,
            };
        }

        public static Stock ToStockFromCreateDto(this CreateStockRequestDto stockDto)
        {
            return new Stock
            {
                Symbol = stockDto.Symbol.Trim().ToUpperInvariant(),
                CompanyName = stockDto.CompanyName,
                Purchase = stockDto.Purchase,
                LastDiv = stockDto.LastDiv,
                Industry = stockDto.Industry,
                MarketCap = stockDto.MarketCap,
            };
        }
    }
}
