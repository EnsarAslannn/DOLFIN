namespace api.Models
{
    /// <summary>
    /// Stable, machine-readable identifiers for the errors this API reports.
    ///
    /// Every error response carries one of these alongside its English
    /// message. The message is a fallback for anything reading the API
    /// directly (curl, Scalar, a non-browser client); the code is what the
    /// frontend keys its own translation off, so a Turkish user sees Turkish
    /// instead of a sentence composed in English on the server.
    ///
    /// These strings are part of the API contract: the frontend looks up
    /// "error.&lt;code&gt;" in its dictionary, so renaming one here without
    /// renaming it there silently falls back to the English message.
    /// </summary>
    public static class ErrorCodes
    {
        public const string Unexpected = "unexpected";

        public const string AccountInvalidCredentials = "account.invalidCredentials";
        public const string AccountLockedOut = "account.lockedOut";
        public const string AccountUserContextNotFound = "account.userContextNotFound";

        public const string PortfolioQuantityNotPositive = "portfolio.quantityNotPositive";
        public const string PortfolioStockNotFound = "portfolio.stockNotFound";
        public const string PortfolioInsufficientFunds = "portfolio.insufficientFunds";
        public const string PortfolioInsufficientShares = "portfolio.insufficientShares";
        public const string PortfolioDepositNotPositive = "portfolio.depositNotPositive";
        public const string PortfolioWithdrawNotPositive = "portfolio.withdrawNotPositive";
        public const string PortfolioInsufficientBalance = "portfolio.insufficientBalance";
        public const string PortfolioConcurrentUpdate = "portfolio.concurrentUpdate";

        public const string PortfolioWarningConcentration = "portfolio.warning.concentration";
        public const string PortfolioWarningSector = "portfolio.warning.sector";

        public const string AlertTargetPriceNotPositive = "alert.targetPriceNotPositive";
        public const string AlertStockNotFound = "alert.stockNotFound";
        public const string AlertDuplicatePending = "alert.duplicatePending";
        public const string AlertNotFound = "alert.notFound";
        public const string AlertNotificationNotFound = "alert.notificationNotFound";

        public const string CommentStockNotFound = "comment.stockNotFound";
        public const string CommentNotFound = "comment.notFound";

        public const string StockNotFound = "stock.notFound";
        public const string StockSymbolTaken = "stock.symbolTaken";
        public const string StockTrendsNotFound = "stock.trendsNotFound";
    }
}
