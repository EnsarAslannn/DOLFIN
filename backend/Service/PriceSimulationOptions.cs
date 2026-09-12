namespace api.Service
{
    public class PriceSimulationOptions
    {
        public bool Enabled { get; set; } = true;

        public double IntervalSeconds { get; set; } = 60;

        public decimal MaxMovePercent { get; set; } = 1.5m;

        public decimal MinPrice { get; set; } = 1.00m;

        /// <summary>
        /// How long a recorded price is kept. At one tick a minute across the
        /// demo catalog this is a few tens of thousands of rows, and without a
        /// ceiling the table grows for as long as the process runs.
        /// </summary>
        public int HistoryRetentionHours { get; set; } = 48;

        public static PriceSimulationOptions FromConfiguration(IConfiguration configuration)
        {
            var section = configuration.GetSection("PriceSimulation");
            var defaults = new PriceSimulationOptions();

            return new PriceSimulationOptions
            {
                Enabled = section.GetValue<bool?>("Enabled") ?? defaults.Enabled,
                IntervalSeconds = section.GetValue<double?>("IntervalSeconds") ?? defaults.IntervalSeconds,
                MaxMovePercent = section.GetValue<decimal?>("MaxMovePercent") ?? defaults.MaxMovePercent,
                MinPrice = section.GetValue<decimal?>("MinPrice") ?? defaults.MinPrice,
                HistoryRetentionHours =
                    section.GetValue<int?>("HistoryRetentionHours") ?? defaults.HistoryRetentionHours,
            };
        }
    }
}
