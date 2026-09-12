using System.Net;
using System.Net.Http.Json;
using api.Data;
using api.Dtos.Stock;
using api.Interfaces;
using api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api.IntegrationTests
{
    /// <summary>
    /// The price walk had been running since it was written and keeping none
    /// of what it did: every tick overwrote the one price a stock had. These
    /// cover the table that now remembers it, and the endpoint that reads it
    /// back.
    /// </summary>
    [Collection("Integration")]
    public class PriceHistoryEndpointsTests
    {
        private readonly DolfinApiFactory _factory;

        public PriceHistoryEndpointsTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        private async Task<int> StockIdAsync(string symbol)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            return await db.Stock.Where(s => s.Symbol == symbol).Select(s => s.Id).FirstAsync();
        }

        private async Task RecordAsync(int stockId, params (decimal price, DateTime at)[] points)
        {
            using var scope = _factory.Services.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IPriceHistoryRepository>();
            await repo.RecordAsync(
                points.Select(p => new PriceHistoryPoint
                {
                    StockId = stockId,
                    Price = p.price,
                    RecordedAt = p.at,
                })
            );
        }

        [Fact]
        public async Task GetPriceHistory_ReturnsRecordedPointsOldestFirst()
        {
            var stockId = await StockIdAsync("AAPL");
            var now = DateTime.UtcNow;
            await RecordAsync(
                stockId,
                (101m, now.AddMinutes(-3)),
                (103m, now.AddMinutes(-2)),
                (102m, now.AddMinutes(-1))
            );

            var client = _factory.CreateClient();
            var response = await client.GetAsync($"/api/stock/history?stockIds={stockId}&points=10");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var series = await response.Content.ReadFromJsonAsync<List<StockPriceHistoryDto>>();

            var apple = Assert.Single(series!, s => s.StockId == stockId);
            Assert.Equal("AAPL", apple.Symbol);
            // Oldest first, so a client can draw them left to right without
            // reversing anything.
            var recorded = apple.Points.Select(p => p.RecordedAt).ToList();
            Assert.Equal(recorded.OrderBy(t => t), recorded);
        }

        [Fact]
        public async Task GetPriceHistory_ReturnsOnlyTheMostRecentPointsAsked()
        {
            var stockId = await StockIdAsync("MSFT");
            var now = DateTime.UtcNow;
            await RecordAsync(
                stockId,
                (400m, now.AddMinutes(-5)),
                (401m, now.AddMinutes(-4)),
                (402m, now.AddMinutes(-3)),
                (403m, now.AddMinutes(-2))
            );

            var client = _factory.CreateClient();
            var response = await client.GetAsync($"/api/stock/history?stockIds={stockId}&points=2");

            var series = await response.Content.ReadFromJsonAsync<List<StockPriceHistoryDto>>();
            var msft = Assert.Single(series!, s => s.StockId == stockId);

            Assert.Equal(2, msft.Points.Count);
            // The newest two, still in oldest-first order.
            Assert.True(msft.Points[0].RecordedAt < msft.Points[1].RecordedAt);
        }

        // The wallet draws a line per position and asks for all of them at
        // once; one request per row is the thing this endpoint shape avoids.
        [Fact]
        public async Task GetPriceHistory_AnswersForSeveralStocksInOneRequest()
        {
            var first = await StockIdAsync("TSLA");
            var second = await StockIdAsync("NVDA");
            var now = DateTime.UtcNow;
            await RecordAsync(first, (170m, now.AddMinutes(-2)), (172m, now.AddMinutes(-1)));
            await RecordAsync(second, (900m, now.AddMinutes(-2)), (910m, now.AddMinutes(-1)));

            var client = _factory.CreateClient();
            var response = await client.GetAsync(
                $"/api/stock/history?stockIds={first},{second}&points=10"
            );

            var series = await response.Content.ReadFromJsonAsync<List<StockPriceHistoryDto>>();

            Assert.Contains(series!, s => s.StockId == first && s.Points.Count >= 2);
            Assert.Contains(series!, s => s.StockId == second && s.Points.Count >= 2);
        }

        // A caller lines the answer up with what it asked for, so a stock with
        // nothing recorded has to come back empty rather than be left out.
        [Fact]
        public async Task GetPriceHistory_IncludesAStockWithNoPointsAsAnEmptySeries()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/stock/history?stockIds=99999999&points=10");

            var series = await response.Content.ReadFromJsonAsync<List<StockPriceHistoryDto>>();
            var missing = Assert.Single(series!);
            Assert.Equal(99999999, missing.StockId);
            Assert.Empty(missing.Points);
        }

        // Open to anonymous callers, like the rest of the catalog reads -- a
        // visitor browsing before signing up sees the same chart.
        [Fact]
        public async Task GetPriceHistory_IsOpenToAVisitor()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/stock/history?stockIds=1&points=5");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetPriceHistory_WithNoIds_ReturnsAnEmptyList()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/stock/history");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var series = await response.Content.ReadFromJsonAsync<List<StockPriceHistoryDto>>();
            Assert.Empty(series!);
        }

        // The row count a request can ask for is ids times points, so both
        // sides are bounded.
        [Theory]
        [InlineData("points=0")]
        [InlineData("points=500")]
        public async Task GetPriceHistory_RejectsAnUnboundedRequest(string query)
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync($"/api/stock/history?stockIds=1&{query}");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task PruneOlderThan_DropsPointsPastTheWindowAndKeepsTheRest()
        {
            var stockId = await StockIdAsync("AMD");
            var now = DateTime.UtcNow;
            await RecordAsync(stockId, (100m, now.AddHours(-10)), (101m, now.AddMinutes(-1)));

            using var scope = _factory.Services.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IPriceHistoryRepository>();

            await repo.PruneOlderThanAsync(now.AddHours(-5));

            var remaining = await repo.GetRecentAsync([stockId], 100);
            Assert.All(remaining[stockId], point => Assert.True(point.RecordedAt > now.AddHours(-5)));
        }
    }
}
