namespace api.Service
{
    public class PriceSimulationOptions
    {
        public bool Enabled { get; set; } = true;

        public double IntervalSeconds { get; set; } = 60;

        public decimal MaxMovePercent { get; set; } = 1.5m;

        public decimal MinPrice { get; set; } = 1.00m;

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
            };
        }
    }
}
