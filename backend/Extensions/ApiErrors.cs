using api.Dtos;
using api.Models;

namespace api.Extensions
{
    /// <summary>
    /// The error bodies controllers return directly, where there is no
    /// exception to convert. Each pairs a code the client translates with the
    /// English sentence anything else can read.
    /// </summary>
    public static class ApiErrors
    {
        public static ApiErrorDto Of(
            string code,
            string message,
            Dictionary<string, string>? args = null
        ) => new() { Code = code, Message = message, Args = args };

        public static ApiErrorDto UserContextNotFound() =>
            Of(ErrorCodes.AccountUserContextNotFound, "User context not found.");

        public static ApiErrorDto InvalidCredentials() =>
            Of(ErrorCodes.AccountInvalidCredentials, "Invalid username or password");

        public static ApiErrorDto LockedOut() =>
            Of(
                ErrorCodes.AccountLockedOut,
                "Account is temporarily locked due to too many failed login attempts. Please try again later."
            );

        public static ApiErrorDto AlertNotFound() =>
            Of(ErrorCodes.AlertNotFound, "Alert not found");

        public static ApiErrorDto AlertNotificationNotFound() =>
            Of(ErrorCodes.AlertNotificationNotFound, "Notification not found");

        public static ApiErrorDto CommentNotFound() =>
            Of(ErrorCodes.CommentNotFound, "Comment not found");

        public static ApiErrorDto CommentStockNotFound() =>
            Of(ErrorCodes.CommentStockNotFound, "Stock does not exist");

        public static ApiErrorDto StockNotFound() => Of(ErrorCodes.StockNotFound, "Stock not found");

        public static ApiErrorDto StockTrendsNotFound() =>
            Of(ErrorCodes.StockTrendsNotFound, "Trend stocks not found in database.");

        public static ApiErrorDto StockSymbolTaken(string symbol) =>
            Of(
                ErrorCodes.StockSymbolTaken,
                $"A stock with symbol '{symbol}' already exists.",
                new Dictionary<string, string> { ["symbol"] = symbol }
            );
    }
}
