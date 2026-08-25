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

        public async Task<List<PriceAlert>> GetActiveAlertsForUserAsync(string appUserId)
        {
            return await _context
                .PriceAlerts.Include(a => a.Stock)
                .Where(a => a.AppUserId == appUserId && a.IsActive)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<PriceAlert>> GetAllUntriggeredActiveAlertsAsync()
        {
            return await _context
                .PriceAlerts.Include(a => a.Stock)
                .Where(a => a.IsActive && a.TriggeredAt == null)
                .ToListAsync();
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
