using System.Net;
using System.Net.Http.Json;
using api.Data;
using api.Dtos.Stock;
using api.IntegrationTests.TestHelpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api.IntegrationTests
{
    /// <summary>
    /// Following a stock without owning it. The only way to keep an eye on
    /// something used to be a price alert, which makes you name a level and a
    /// direction before you have an opinion worth naming one for.
    /// </summary>
    [Collection("Integration")]
    public class WatchlistEndpointsTests
    {
        private readonly DolfinApiFactory _factory;

        public WatchlistEndpointsTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        private async Task<int> StockIdAsync(string symbol)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            return await db.Stock.Where(s => s.Symbol == symbol).Select(s => s.Id).FirstAsync();
        }

        [Fact]
        public async Task Add_ThenGet_ShowsTheStockWithItsCurrentPrice()
        {
            var stockId = await StockIdAsync("AAPL");
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var added = await client.PostAsJsonAsync(
                "/api/watchlist",
                new AddWatchlistRequestDto { StockId = stockId }
            );
            Assert.Equal(HttpStatusCode.OK, added.StatusCode);

            var response = await client.GetAsync("/api/watchlist");
            var items = await response.Content.ReadFromJsonAsync<List<WatchlistItemDto>>();

            var entry = Assert.Single(items!, i => i.StockId == stockId);
            Assert.Equal("AAPL", entry.Symbol);
            Assert.Equal("Apple Inc.", entry.CompanyName);
            // The price is what makes the list worth opening.
            Assert.True(entry.Purchase > 0);
        }

        // The button that calls this is a toggle, so a double click or a stale
        // tab should leave the list in the state the user asked for rather
        // than raise something for them to read.
        [Fact]
        public async Task Add_Twice_IsNotAnError_AndDoesNotDuplicate()
        {
            var stockId = await StockIdAsync("MSFT");
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var request = new AddWatchlistRequestDto { StockId = stockId };
            var first = await client.PostAsJsonAsync("/api/watchlist", request);
            var second = await client.PostAsJsonAsync("/api/watchlist", request);

            Assert.Equal(HttpStatusCode.OK, first.StatusCode);
            Assert.Equal(HttpStatusCode.OK, second.StatusCode);

            var response = await client.GetAsync("/api/watchlist");
            var items = await response.Content.ReadFromJsonAsync<List<WatchlistItemDto>>();
            Assert.Single(items!, i => i.StockId == stockId);
        }

        [Fact]
        public async Task Remove_TakesItOffTheList()
        {
            var stockId = await StockIdAsync("NVDA");
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            await client.PostAsJsonAsync(
                "/api/watchlist",
                new AddWatchlistRequestDto { StockId = stockId }
            );

            var removed = await client.DeleteAsync($"/api/watchlist/{stockId}");
            Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);

            var response = await client.GetAsync("/api/watchlist");
            var items = await response.Content.ReadFromJsonAsync<List<WatchlistItemDto>>();
            Assert.DoesNotContain(items!, i => i.StockId == stockId);
        }

        // The other half of the same toggle.
        [Fact]
        public async Task Remove_SomethingNotFollowed_IsNotAnError()
        {
            var stockId = await StockIdAsync("TSLA");
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.DeleteAsync($"/api/watchlist/{stockId}");

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task Add_UnknownStock_ReturnsBadRequestWithACode()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.PostAsJsonAsync(
                "/api/watchlist",
                new AddWatchlistRequestDto { StockId = 99999999 }
            );

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var error = await response.Content.ReadFromJsonAsync<api.Dtos.ApiErrorDto>();
            Assert.Equal(api.Models.ErrorCodes.StockNotFound, error!.Code);
        }

        [Fact]
        public async Task GetWatchlist_ReturnsOnlyTheCallersOwnFollows()
        {
            var stockId = await StockIdAsync("AMD");

            var owner = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await owner.PostAsJsonAsync(
                "/api/watchlist",
                new AddWatchlistRequestDto { StockId = stockId }
            );

            var stranger = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            var response = await stranger.GetAsync("/api/watchlist");
            var items = await response.Content.ReadFromJsonAsync<List<WatchlistItemDto>>();

            Assert.DoesNotContain(items!, i => i.StockId == stockId);
        }

        [Fact]
        public async Task GetWatchlist_WithoutAnAccount_IsRefused()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/watchlist");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
