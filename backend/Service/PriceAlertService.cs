using api.Extensions;
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
                throw new DomainException(
                    ErrorCodes.AlertTargetPriceNotPositive,
                    "Target price must be greater than 0"
                );

            var stock = await _stockRepo.GetByIdAsync(stockId);
            if (stock == null)
                throw new DomainException(ErrorCodes.AlertStockNotFound, "Stock not found");

            // The endpoint has always documented a 400 for a duplicate alert;
            // nothing checked for one, so the same watch could be set any
            // number of times and would then raise that many identical
            // notifications the moment it fired.
            if (
                await _alertRepo.HasPendingDuplicateAsync(user.Id, stockId, targetPrice, condition)
            )
            {
                throw new DomainException(
                    ErrorCodes.AlertDuplicatePending,
                    "You already have a pending alert for this stock at this price.",
                    new Dictionary<string, string>
                    {
                        ["symbol"] = stock.Symbol,
                        ["targetPrice"] = targetPrice.ToInvariantAmount(),
                    }
                );
            }

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

        public Task<List<PriceAlert>> GetAlertsAsync(AppUser user) =>
            _alertRepo.GetAlertsForUserAsync(user.Id);

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

                // IsActive is cleared alongside TriggeredAt so the flag stops
                // being a field nothing ever wrote: an alert that has fired is
                // no longer being watched, and this is the only thing that
                // stops watching it.
                alert.TriggeredAt = DateTime.UtcNow;
                alert.IsActive = false;
                alert.TriggeredPrice = currentPrice;
                await _alertRepo.UpdateAsync(alert);

                await _alertRepo.CreateNotificationAsync(
                    new AlertNotification
                    {
                        PriceAlertId = alert.Id,
                        AppUserId = alert.AppUserId,
                        Message =
                            $"{alert.Stock.Symbol} reached {currentPrice.ToInvariantAmount()} (target {alert.TargetPrice.ToInvariantAmount()}).",
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
