namespace api.Service
{
    public class PriceAlertOptions
    {
        public bool Enabled { get; set; } = true;

        public double IntervalSeconds { get; set; } = 60;

        public static PriceAlertOptions FromConfiguration(IConfiguration configuration)
        {
            var section = configuration.GetSection("PriceAlerts");
            var defaults = new PriceAlertOptions();

            // CheckIntervalHours is the key this setting shipped under. It is
            // still honoured so a deployment that overrides it through the
            // environment keeps working instead of silently falling back to
            // the default, but IntervalSeconds wins when both are present.
            var legacyHours = section.GetValue<double?>("CheckIntervalHours");
            var intervalSeconds =
                section.GetValue<double?>("IntervalSeconds")
                ?? (legacyHours.HasValue ? legacyHours.Value * 3600 : null);

            return new PriceAlertOptions
            {
                Enabled = section.GetValue<bool?>("Enabled") ?? defaults.Enabled,
                IntervalSeconds = intervalSeconds ?? defaults.IntervalSeconds,
            };
        }
    }
}
