using api.Data;
using api.Interfaces;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Repository
{
    public class PriceAlertRepository : IPriceAlertRepository
    {
        private readonly ApplicationDBContext _context;

        public PriceAlertRepository(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<PriceAlert> CreateAsync(PriceAlert alert)
        {
            await _context.PriceAlerts.AddAsync(alert);
            await _context.SaveChangesAsync();
            return alert;
        }

        public async Task<PriceAlert?> GetByIdAsync(int id)
        {
            return await _context.PriceAlerts.Include(a => a.Stock).FirstOrDefaultAsync(a => a.Id == id);
        }

        // Every alert the user owns, pending and already fired alike -- the
        // wallet lists both, and the caller tells them apart by TriggeredAt.
        // There is deliberately no IsActive filter here: rows that fired
        // before IsActive was ever written to still carry IsActive = true,
        // and rows that fire now carry false, so filtering on it would hide
        // one half or the other depending on when the alert happened to go
        // off.
        public async Task<List<PriceAlert>> GetAlertsForUserAsync(string appUserId)
        {
            return await _context
                .PriceAlerts.Include(a => a.Stock)
                .Where(a => a.AppUserId == appUserId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        // The TriggeredAt clause is what actually stops an alert firing twice.
        // IsActive is checked alongside it rather than instead of it: alerts
        // that fired before IsActive started being written still have it set
        // to true, so it cannot be trusted alone on existing data.
        public async Task<List<PriceAlert>> GetAllUntriggeredActiveAlertsAsync()
        {
            return await _context
                .PriceAlerts.Include(a => a.Stock)
                .Where(a => a.IsActive && a.TriggeredAt == null)
                .ToListAsync();
        }

        public Task<bool> HasPendingDuplicateAsync(
            string appUserId,
            int stockId,
            decimal targetPrice,
            PriceAlertCondition condition
        )
        {
            return _context.PriceAlerts.AnyAsync(a =>
                a.AppUserId == appUserId
                && a.StockId == stockId
                && a.TargetPrice == targetPrice
                && a.Condition == condition
                && a.TriggeredAt == null
            );
        }

        public async Task UpdateAsync(PriceAlert alert)
        {
            _context.PriceAlerts.Update(alert);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(PriceAlert alert)
        {
            _context.PriceAlerts.Remove(alert);
            await _context.SaveChangesAsync();
        }

        public async Task<AlertNotification> CreateNotificationAsync(AlertNotification notification)
        {
            await _context.AlertNotifications.AddAsync(notification);
            await _context.SaveChangesAsync();
            return notification;
        }

        public async Task<AlertNotification?> GetNotificationByIdAsync(int id)
        {
            return await _context.AlertNotifications.FirstOrDefaultAsync(n => n.Id == id);
        }

        public async Task<List<AlertNotification>> GetNotificationsForUserAsync(string appUserId)
        {
            return await _context
                .AlertNotifications.Where(n => n.AppUserId == appUserId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task UpdateNotificationAsync(AlertNotification notification)
        {
            _context.AlertNotifications.Update(notification);
            await _context.SaveChangesAsync();
        }
    }
}
