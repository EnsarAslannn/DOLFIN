using api.Models;

namespace api.Interfaces
{
    public interface IPriceAlertRepository
    {
        Task<PriceAlert> CreateAsync(PriceAlert alert);

        Task<PriceAlert?> GetByIdAsync(int id);

        Task<List<PriceAlert>> GetAlertsForUserAsync(string appUserId);

        Task<List<PriceAlert>> GetAllUntriggeredActiveAlertsAsync();

        /// <summary>
        /// Whether the user already has an alert still waiting on exactly this
        /// stock, price and direction. An alert that has already fired does not
        /// count — setting the same watch again is how you re-arm it.
        /// </summary>
        Task<bool> HasPendingDuplicateAsync(
            string appUserId,
            int stockId,
            decimal targetPrice,
            PriceAlertCondition condition
        );

        Task UpdateAsync(PriceAlert alert);

        Task DeleteAsync(PriceAlert alert);

        Task<AlertNotification> CreateNotificationAsync(AlertNotification notification);

        Task<AlertNotification?> GetNotificationByIdAsync(int id);

        Task<List<AlertNotification>> GetNotificationsForUserAsync(string appUserId);

        Task UpdateNotificationAsync(AlertNotification notification);
    }
}
