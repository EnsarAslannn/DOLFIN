namespace api.Dtos.Stock
{
    public class WatchlistItemDto
    {
        public int Id { get; set; }

        public int StockId { get; set; }

        public string Symbol { get; set; } = string.Empty;

        public string CompanyName { get; set; } = string.Empty;

        public string Industry { get; set; } = string.Empty;

        /// <summary>The stock's current price, so the list is worth looking at.</summary>
        public decimal Purchase { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
