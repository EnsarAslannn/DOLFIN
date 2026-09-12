namespace api.Helpers
{
    public class PriceHistoryQueryObject
    {
        /// <summary>
        /// Comma-separated stock ids. A list rather than one id per request
        /// because the wallet draws a line for every position it shows.
        /// </summary>
        public string? StockIds { get; set; }

        /// <summary>How many of the most recent points to return per stock.</summary>
        public int Points { get; set; } = 30;

        /// <summary>
        /// The ids as numbers, in the order given, without repeats. Anything
        /// unparseable is dropped rather than failing the request: the
        /// validator already bounds how many may be asked for, and this is
        /// what keeps a trailing comma from turning into a 400.
        /// </summary>
        public List<int> ParseStockIds()
        {
            if (string.IsNullOrWhiteSpace(StockIds))
                return [];

            return StockIds
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(part => int.TryParse(part, out var id) ? id : 0)
                .Where(id => id > 0)
                .Distinct()
                .ToList();
        }
    }
}
