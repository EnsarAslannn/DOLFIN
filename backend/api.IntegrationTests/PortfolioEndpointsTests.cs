using System.Net;
using System.Net.Http.Json;
using api.Dtos;
using api.Dtos.Portfolio;
using api.IntegrationTests.TestHelpers;
using Xunit;

namespace api.IntegrationTests
{
    [Collection("Integration")]
    public class PortfolioEndpointsTests
    {
        private readonly DolfinApiFactory _factory;

        public PortfolioEndpointsTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task GetUserPortfolio_NewUser_ReturnsEmptyList()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.GetAsync("/api/portfolio");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var portfolio = await response.Content.ReadFromJsonAsync<List<PortfolioDto>>();
            Assert.NotNull(portfolio);
            Assert.Empty(portfolio!);
        }

        [Fact]
        public async Task AddPortfolio_AfterDeposit_CreatesPositionVisibleInGetPortfolio()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var depositResponse = await client.PostAsJsonAsync(
                "/api/portfolio/deposit",
                new AmountRequestDto { Amount = 1000m }
            );
            Assert.Equal(HttpStatusCode.OK, depositResponse.StatusCode);

            var buyResponse = await client.PostAsJsonAsync(
                "/api/portfolio",
                new TradeRequestDto { Symbol = "AAPL", Quantity = 2 }
            );
            Assert.Equal(HttpStatusCode.OK, buyResponse.StatusCode);

            var portfolioResponse = await client.GetAsync("/api/portfolio");
            var portfolio = await portfolioResponse.Content.ReadFromJsonAsync<List<PortfolioDto>>();

            var position = Assert.Single(portfolio!, p => p.Symbol == "AAPL");
            Assert.Equal(2, position.Quantity);
        }

        [Fact]
        public async Task AddPortfolio_WithoutFunds_ReturnsBadRequest()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.PostAsJsonAsync(
                "/api/portfolio",
                new TradeRequestDto { Symbol = "AAPL", Quantity = 1 }
            );

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        // The error reaches the client as a code and the figures behind it, so
        // the wording can be written in whichever language the app is showing.
        // It used to arrive only as an English sentence, which is what a
        // Turkish user then read.
        [Fact]
        public async Task AddPortfolio_WithoutFunds_AnswersWithACodeAndTheFigures()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.PostAsJsonAsync(
                "/api/portfolio",
                new TradeRequestDto { Symbol = "AAPL", Quantity = 1 }
            );

            var error = await response.Content.ReadFromJsonAsync<ApiErrorDto>();

            Assert.NotNull(error);
            Assert.Equal(api.Models.ErrorCodes.PortfolioInsufficientFunds, error!.Code);
            Assert.NotNull(error.Args);
            Assert.True(error.Args!.ContainsKey("required"));
            Assert.True(error.Args.ContainsKey("available"));
            // Figures travel as data, so they are formatted the same way
            // whatever culture the server happens to be running under.
            Assert.DoesNotContain(",", error.Args["required"]);
            // The English sentence stays, for anything reading the API directly.
            Assert.False(string.IsNullOrWhiteSpace(error.Message));
        }

        [Fact]
        public async Task Deposit_NonPositiveAmount_AnswersWithItsOwnCode()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.PostAsJsonAsync(
                "/api/portfolio/deposit",
                new { amount = -5m }
            );

            // Validation catches this before the service does, so the body is
            // a ValidationProblemDetails rather than an ApiErrorDto -- the
            // point here is only that it is still refused.
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }
}
