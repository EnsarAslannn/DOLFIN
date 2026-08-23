using api.Helpers;

namespace api.Caching
{
    public static class CacheKeys
    {
        public const string StockListTag = "stock:list";
        public const string StockTrends = "stock:trends";

        public static string StockById(int id) => $"stock:id:{id}";

        public static string StockBySymbol(string symbol) => $"stock:symbol:{symbol.Trim().ToUpperInvariant()}";

        public static string StockList(QueryObject query)
        {
            string Norm(string? value) => string.IsNullOrWhiteSpace(value) ? "_" : value.Trim().ToLowerInvariant();

            return string.Join(
                '|',
                "stock:list:" + Norm(query.Symbol),
                Norm(query.CompanyName),
                Norm(query.SortBy),
                query.IsDescending,
                query.PageNumber,
                query.PageSize
            );
        }

        public const string CommentListTag = "comment:list";

        public static string CommentById(int id) => $"comment:id:{id}";

        public static string CommentList(CommentQueryObject query)
        {
            string Norm(string? value) => string.IsNullOrWhiteSpace(value) ? "_" : value.Trim().ToLowerInvariant();

            return string.Join(
                '|',
                "comment:list:" + Norm(query.Symbol),
                query.IsDescending,
                query.PageNumber,
                query.PageSize
            );
        }

        // Cached portfolios embed the stock price, so anything that moves a
        // price has to expire every user's entry -- not just the trader's.
        public const string PortfolioTag = "portfolio:all";

        public static string PortfolioByUser(string userId) => $"portfolio:user:{userId}";
    }
}
