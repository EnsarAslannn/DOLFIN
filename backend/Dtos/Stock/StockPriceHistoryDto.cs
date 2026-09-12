namespace api.Dtos.Stock
{
    /// <summary>
    /// One stock's recent prices, oldest first so a client can draw them
    /// left to right without reversing anything.
    /// </summary>
    public class StockPriceHistoryDto
    {
        public int StockId { get; set; }

        public string Symbol { get; set; } = string.Empty;

        public List<PricePointDto> Points { get; set; } = [];
    }
}
