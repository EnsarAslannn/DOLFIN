using api.Models;

namespace api.Dtos.Alerts
{
    public class AlertNotificationDto
    {
        public int Id { get; set; }
        public int PriceAlertId { get; set; }

        /// <summary>
        /// The notification as one English sentence, kept for clients that do
        /// not compose their own.
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// The same notification as data. The sentence used to exist only in
        /// English, written into the database at trigger time, so a Turkish
        /// reader got an English line in an otherwise Turkish bell. These are
        /// the parts a client needs to write it in whichever language it is
        /// showing.
        /// </summary>
        public string Symbol { get; set; } = string.Empty;

        public PriceAlertCondition Condition { get; set; }

        public decimal TargetPrice { get; set; }

        public decimal? TriggeredPrice { get; set; }

        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
