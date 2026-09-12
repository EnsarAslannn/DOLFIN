using api.Dtos.Alerts;
using api.Models;

namespace api.Mappers
{
    public static class PriceAlertMappers
    {
        public static PriceAlertDto ToPriceAlertDto(this PriceAlert alert)
        {
            return new PriceAlertDto
            {
                Id = alert.Id,
                StockId = alert.StockId,
                Symbol = alert.Stock.Symbol,
                TargetPrice = alert.TargetPrice,
                Condition = alert.Condition,
                IsActive = alert.IsActive,
                TriggeredAt = alert.TriggeredAt,
                TriggeredPrice = alert.TriggeredPrice,
                CreatedAt = alert.CreatedAt,
            };
        }

        // The alert a notification came from is loaded alongside it, because
        // the symbol, the target and the price that actually fired all live
        // there -- without them the client can only reprint the English
        // sentence the server happened to store.
        public static AlertNotificationDto ToAlertNotificationDto(this AlertNotification notification)
        {
            var alert = notification.PriceAlert;

            return new AlertNotificationDto
            {
                Id = notification.Id,
                PriceAlertId = notification.PriceAlertId,
                Message = notification.Message,
                Symbol = alert?.Stock?.Symbol ?? string.Empty,
                Condition = alert?.Condition ?? PriceAlertCondition.GreaterThanOrEqual,
                TargetPrice = alert?.TargetPrice ?? 0m,
                TriggeredPrice = alert?.TriggeredPrice,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
            };
        }
    }
}
