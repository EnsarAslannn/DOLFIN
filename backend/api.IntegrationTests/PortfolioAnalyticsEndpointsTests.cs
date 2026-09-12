using System.Net;
using System.Net.Http.Json;
using api.Dtos.Portfolio;
using api.IntegrationTests.TestHelpers;
using Xunit;

namespace api.IntegrationTests
{
    [Collection("Integration")]
    public class PortfolioAnalyticsEndpointsTests
    {
        private readonly DolfinApiFactory _factory;

        public PortfolioAnalyticsEndpointsTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task GetMetrics_NewUser_ReturnsZeroedMetrics()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.GetAsync("/api/portfolio/metrics");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var metrics = await response.Content.ReadFromJsonAsync<PortfolioMetricsDto>();
            Assert.NotNull(metrics);
            Assert.Equal(0m, metrics!.TotalInvestedAmount);
            Assert.Equal(0m, metrics.CurrentValue);
            Assert.Empty(metrics.Allocations);
        }

        [Fact]
        public async Task GetMetrics_AfterBuyingStock_ReflectsThePosition()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await client.PostAsJsonAsync("/api/portfolio/deposit", new { Amount = 5000m });
            await client.PostAsJsonAsync("/api/portfolio", new { Symbol = "AAPL", Quantity = 3 });

            var response = await client.GetAsync("/api/portfolio/metrics");

            var metrics = await response.Content.ReadFromJsonAsync<PortfolioMetricsDto>();
            var position = Assert.Single(metrics!.Allocations, a => a.Symbol == "AAPL");
            Assert.Equal(3, position.Quantity);
            Assert.Equal(100m, position.AllocationPercent);
            Assert.Equal(position.Quantity * position.CurrentPrice, metrics.CurrentValue);
        }

        [Fact]
        public async Task GetWarnings_SingleStockConcentration_ReturnsWarning()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await client.PostAsJsonAsync("/api/portfolio/deposit", new { Amount = 5000m });
            await client.PostAsJsonAsync("/api/portfolio", new { Symbol = "AAPL", Quantity = 1 });

            var response = await client.GetAsync("/api/portfolio/warnings");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            // Warnings come back as data rather than as finished English
            // sentences, so the wallet can word them in whichever language it
            // is showing.
            var warnings = await response.Content.ReadFromJsonAsync<List<AllocationWarningDto>>();
            var warning = Assert.Single(
                warnings!,
                w => w.Code == api.Models.ErrorCodes.PortfolioWarningConcentration
            );
            Assert.Equal("AAPL", warning.Symbol);
            Assert.True(warning.Percent > 40m);
        }

        [Fact]
        public async Task GetRebalance_NewUser_ReturnsNoPositionsMessage()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.GetAsync("/api/portfolio/rebalance");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var recommendation = await response.Content.ReadFromJsonAsync<RebalancingRecommendationDto>();
            Assert.Empty(recommendation!.Adjustments);
        }
    }
}
