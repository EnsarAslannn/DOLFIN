using System.Net;
using System.Net.Http.Json;
using api.Dtos.Stock;
using api.IntegrationTests.TestHelpers;
using Xunit;

namespace api.IntegrationTests
{
    [Collection("Integration")]
    public class StockEndpointsTests
    {
        private readonly DolfinApiFactory _factory;

        public StockEndpointsTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        private static CreateStockRequestDto MakeCreateDto(string symbol) =>
            new()
            {
                Symbol = symbol,
                CompanyName = "Integration Test Corp",
                Purchase = 42.50m,
                LastDiv = 0.10m,
                Industry = "Software",
                MarketCap = 1_000_000_000,
            };

        [Fact]
        public async Task GetAll_ReturnsSeededDemoStock()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.GetAsync("/api/stock?symbol=AAPL&pageSize=5");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var stocks = await response.Content.ReadFromJsonAsync<List<StockDto>>();
            Assert.NotNull(stocks);
            Assert.Contains(stocks!, s => s.Symbol == "AAPL" && s.CompanyName == "Apple Inc.");
        }

        // PostgreSQL's LIKE is case-sensitive, so a bare Contains() filter let
        // "Microsoft" match while "microsoft" returned nothing. The InMemory
        // provider the unit tests run on compares case-insensitively and can
        // never catch that -- this is the test that does.
        [Theory]
        [InlineData("microsoft")]
        [InlineData("MICROSOFT")]
        [InlineData("Microsoft")]
        public async Task GetAll_FiltersByCompanyName_RegardlessOfCase(string term)
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.GetAsync($"/api/stock?companyName={term}&pageSize=100");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var stocks = await response.Content.ReadFromJsonAsync<List<StockDto>>();
            Assert.Contains(stocks!, s => s.Symbol == "MSFT");
        }

        [Theory]
        [InlineData("aapl")]
        [InlineData("AAPL")]
        public async Task GetAll_FiltersBySymbol_RegardlessOfCase(string term)
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.GetAsync($"/api/stock?symbol={term}&pageSize=100");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var stocks = await response.Content.ReadFromJsonAsync<List<StockDto>>();
            Assert.Contains(stocks!, s => s.Symbol == "AAPL");
        }

        [Fact]
        public async Task Create_AsAdmin_SucceedsAndIsRetrievableById()
        {
            var symbol = $"T{Guid.NewGuid():N}"[..7].ToUpperInvariant();
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory, asAdmin: true);

            var createResponse = await client.PostAsJsonAsync("/api/stock", MakeCreateDto(symbol));
            Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
            var created = await createResponse.Content.ReadFromJsonAsync<StockDto>();
            Assert.NotNull(created);
            Assert.Equal(symbol, created!.Symbol);

            var getResponse = await client.GetAsync($"/api/stock/{created.Id}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var fetched = await getResponse.Content.ReadFromJsonAsync<StockDto>();
            Assert.Equal(symbol, fetched!.Symbol);
        }

        [Fact]
        public async Task Create_AsNonAdmin_ReturnsForbidden()
        {
            var symbol = $"T{Guid.NewGuid():N}"[..7].ToUpperInvariant();
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory, asAdmin: false);

            var response = await client.PostAsJsonAsync("/api/stock", MakeCreateDto(symbol));

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task Create_DuplicateSymbol_ReturnsConflict()
        {
            var symbol = $"T{Guid.NewGuid():N}"[..7].ToUpperInvariant();
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory, asAdmin: true);
            var firstResponse = await client.PostAsJsonAsync("/api/stock", MakeCreateDto(symbol));
            Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);

            var secondResponse = await client.PostAsJsonAsync(
                "/api/stock",
                MakeCreateDto(symbol.ToLowerInvariant())
            );

            Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
        }
    }
}
