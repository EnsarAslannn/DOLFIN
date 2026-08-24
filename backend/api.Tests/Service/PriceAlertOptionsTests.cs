using api.Service;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace api.Tests.Service
{
    public class PriceAlertOptionsTests
    {
        [Fact]
        public void FromConfiguration_ReadsTheCurrentKeys()
        {
            var options = Build(
                new() { ["PriceAlerts:Enabled"] = "false", ["PriceAlerts:IntervalSeconds"] = "30" }
            );

            Assert.False(options.Enabled);
            Assert.Equal(30, options.IntervalSeconds);
        }

        [Fact]
        public void FromConfiguration_WithNothingConfigured_ChecksEveryMinute()
        {
            var options = Build([]);

            Assert.True(options.Enabled);
            Assert.Equal(60, options.IntervalSeconds);
        }

        // The setting shipped as CheckIntervalHours. A deployment overriding
        // that through the environment must keep its value rather than
        // silently snapping to the default.
        [Fact]
        public void FromConfiguration_StillHonoursTheLegacyHoursKey()
        {
            var options = Build(new() { ["PriceAlerts:CheckIntervalHours"] = "2" });

            Assert.Equal(7200, options.IntervalSeconds);
        }

        [Fact]
        public void FromConfiguration_WhenBothKeysArePresent_SecondsWins()
        {
            var options = Build(
                new()
                {
                    ["PriceAlerts:CheckIntervalHours"] = "24",
                    ["PriceAlerts:IntervalSeconds"] = "45",
                }
            );

            Assert.Equal(45, options.IntervalSeconds);
        }

        // The integration test factory switches the checks off through this
        // key so a tick cannot fire an alert in the middle of a test.
        [Fact]
        public void FromConfiguration_HonoursTheDisableSwitch()
        {
            Assert.False(Build(new() { ["PriceAlerts:Enabled"] = "false" }).Enabled);
        }

        private static PriceAlertOptions Build(Dictionary<string, string?> values) =>
            PriceAlertOptions.FromConfiguration(
                new ConfigurationBuilder().AddInMemoryCollection(values).Build()
            );
    }
}
