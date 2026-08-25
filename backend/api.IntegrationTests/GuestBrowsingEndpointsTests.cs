using System.Net;
using System.Net.Http.Json;
using api.Dtos.Comment;
using api.Dtos.Stock;
using api.IntegrationTests.TestHelpers;
using Xunit;

namespace api.IntegrationTests
{
    /// <summary>
    /// A visitor with no account can read the catalog and the discussion, but
    /// anything tied to a wallet stays behind the sign-in wall.
    /// </summary>
    [Collection("Integration")]
    public class GuestBrowsingEndpointsTests
    {
        private readonly DolfinApiFactory _factory;

        public GuestBrowsingEndpointsTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        private HttpClient AnonymousClient() => TestClientFactory.CreateHttpsClient(_factory);

        [Fact]
        public async Task GetStocks_Anonymously_ReturnsCatalog()
        {
            var response = await AnonymousClient().GetAsync("/api/stock?symbol=AAPL&pageSize=5");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var stocks = await response.Content.ReadFromJsonAsync<List<StockDto>>();
            Assert.Contains(stocks!, s => s.Symbol == "AAPL");
        }

        [Fact]
        public async Task GetStockById_Anonymously_ReturnsStock()
        {
            var client = AnonymousClient();
            var listed = await client.GetFromJsonAsync<List<StockDto>>("/api/stock?symbol=AAPL&pageSize=1");
            var id = listed!.Single().Id;

            var response = await client.GetAsync($"/api/stock/{id}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var stock = await response.Content.ReadFromJsonAsync<StockDto>();
            Assert.Equal("AAPL", stock!.Symbol);
        }

        [Fact]
        public async Task GetMarketTrends_Anonymously_IsNotUnauthorized()
        {
            var response = await AnonymousClient().GetAsync("/api/stock/trends");

            // The seeder decides whether trend stocks exist, so a 404 is a
            // legitimate answer here -- the point is that it is not a 401.
            Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetComments_Anonymously_ReturnsDiscussion()
        {
            var response = await AnonymousClient().GetAsync("/api/comment");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var comments = await response.Content.ReadFromJsonAsync<List<CommentDto>>();
            Assert.NotNull(comments);
        }

        [Fact]
        public async Task GetPortfolio_Anonymously_ReturnsUnauthorized()
        {
            var response = await AnonymousClient().GetAsync("/api/portfolio");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetNotifications_Anonymously_ReturnsUnauthorized()
        {
            var response = await AnonymousClient().GetAsync("/api/alerts/notifications");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
