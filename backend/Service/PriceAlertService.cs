using api.Interfaces;
using api.Models;
using Microsoft.Extensions.Logging;

namespace api.Service
{
    public class PriceAlertService : IPriceAlertService
    {
        private readonly IPriceAlertRepository _alertRepo;
        private readonly IStockRepository _stockRepo;
        private readonly ILogger<PriceAlertService> _logger;

        public PriceAlertService(
            IPriceAlertRepository alertRepo,
            IStockRepository stockRepo,
            ILogger<PriceAlertService> logger
        )
        {
            _alertRepo = alertRepo;
            _stockRepo = stockRepo;
            _logger = logger;
        }

        public async Task<PriceAlert> CreateAlertAsync(
            AppUser user,
            int stockId,
            decimal targetPrice,
            PriceAlertCondition condition
        )
        {
            if (targetPrice <= 0)
                throw new ArgumentException("Target price must be greater than 0");

            var stock = await _stockRepo.GetByIdAsync(stockId);
            if (stock == null)
                throw new InvalidOperationException("Stock not found");

            var alert = new PriceAlert
            {
                AppUserId = user.Id,
                StockId = stockId,
                TargetPrice = targetPrice,
                Condition = condition,
            };

            var created = await _alertRepo.CreateAsync(alert);
            created.Stock = stock;
            return created;
        }

        public Task<List<PriceAlert>> GetActiveAlertsAsync(AppUser user) =>
            _alertRepo.GetActiveAlertsForUserAsync(user.Id);

        public Task<PriceAlert?> GetAlertByIdAsync(int alertId) => _alertRepo.GetByIdAsync(alertId);

        public Task DeleteAlertAsync(PriceAlert alert) => _alertRepo.DeleteAsync(alert);

        public Task<List<AlertNotification>> GetNotificationsAsync(AppUser user) =>
            _alertRepo.GetNotificationsForUserAsync(user.Id);

        public Task<AlertNotification?> GetNotificationByIdAsync(int notificationId) =>
            _alertRepo.GetNotificationByIdAsync(notificationId);

        public async Task MarkNotificationReadAsync(AlertNotification notification)
        {
            notification.IsRead = true;
            await _alertRepo.UpdateNotificationAsync(notification);
        }

        public async Task<int> CheckAndTriggerAlertsAsync()
        {
            var alerts = await _alertRepo.GetAllUntriggeredActiveAlertsAsync();
            var triggeredCount = 0;

            foreach (var alert in alerts)
            {
                var currentPrice = alert.Stock.Purchase;
                var shouldTrigger =
                    alert.Condition == PriceAlertCondition.GreaterThanOrEqual
                        ? currentPrice >= alert.TargetPrice
                        : currentPrice <= alert.TargetPrice;

                if (!shouldTrigger)
                    continue;

                alert.TriggeredAt = DateTime.UtcNow;
                await _alertRepo.UpdateAsync(alert);

                await _alertRepo.CreateNotificationAsync(
                    new AlertNotification
                    {
                        PriceAlertId = alert.Id,
                        AppUserId = alert.AppUserId,
                        Message =
                            $"{alert.Stock.Symbol} reached {currentPrice:F2} (target {alert.TargetPrice:F2}).",
                    }
                );

                triggeredCount++;
            }

            if (triggeredCount > 0)
            {
                _logger.LogInformation("Price alert check triggered {Count} alert(s)", triggeredCount);
            }

            return triggeredCount;
        }
    }
}
