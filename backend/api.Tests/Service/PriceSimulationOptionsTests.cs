using api.Service;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace api.Tests.Service
{
    public class PriceSimulationOptionsTests
    {
        [Fact]
        public void FromConfiguration_ReadsEveryValueFromThePriceSimulationSection()
        {
            var options = Build(
                new()
                {
                    ["PriceSimulation:Enabled"] = "false",
                    ["PriceSimulation:IntervalSeconds"] = "15",
                    ["PriceSimulation:MaxMovePercent"] = "3.25",
                    ["PriceSimulation:MinPrice"] = "0.50",
                }
            );

            Assert.False(options.Enabled);
            Assert.Equal(15, options.IntervalSeconds);
            Assert.Equal(3.25m, options.MaxMovePercent);
            Assert.Equal(0.50m, options.MinPrice);
        }

        // The integration test factory switches the simulation off through this
        // exact key; if binding silently ignored it, prices would drift under
        // every test that buys at a known price.
        [Fact]
        public void FromConfiguration_HonoursTheDisableSwitch()
        {
            Assert.False(Build(new() { ["PriceSimulation:Enabled"] = "false" }).Enabled);
        }

        [Fact]
        public void FromConfiguration_WithNothingConfigured_FallsBackToTheDefaults()
        {
            var options = Build([]);
            var defaults = new PriceSimulationOptions();

            Assert.Equal(defaults.Enabled, options.Enabled);
            Assert.Equal(defaults.IntervalSeconds, options.IntervalSeconds);
            Assert.Equal(defaults.MaxMovePercent, options.MaxMovePercent);
            Assert.Equal(defaults.MinPrice, options.MinPrice);
        }

        [Fact]
        public void FromConfiguration_WithAPartialSection_KeepsDefaultsForTheRest()
        {
            var options = Build(new() { ["PriceSimulation:IntervalSeconds"] = "5" });

            Assert.Equal(5, options.IntervalSeconds);
            Assert.Equal(new PriceSimulationOptions().MaxMovePercent, options.MaxMovePercent);
        }

        private static PriceSimulationOptions Build(Dictionary<string, string?> values) =>
            PriceSimulationOptions.FromConfiguration(
                new ConfigurationBuilder().AddInMemoryCollection(values).Build()
            );
    }
}
