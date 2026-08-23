using System.Net;
using System.Net.Http.Json;
using api.Dtos;
using api.Dtos.Portfolio;
using api.IntegrationTests.TestHelpers;
using Xunit;

namespace api.IntegrationTests
{
    [Collection("Integration")]
    public class TransactionHistoryEndpointsTests
    {
        private readonly DolfinApiFactory _factory;

        public TransactionHistoryEndpointsTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task GetTransactions_NewUser_ReturnsEmptyList()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.GetAsync("/api/portfolio/transactions");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var history = await response.Content.ReadFromJsonAsync<List<TransactionDto>>();
            Assert.NotNull(history);
            Assert.Empty(history!);
        }

        [Fact]
        public async Task GetTransactions_RecordsEveryMovementNewestFirst()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await client.PostAsJsonAsync("/api/portfolio/deposit", new AmountRequestDto { Amount = 5000m });
            await client.PostAsJsonAsync("/api/portfolio", new TradeRequestDto { Symbol = "AAPL", Quantity = 2 });
            await client.PostAsJsonAsync("/api/portfolio/sell", new TradeRequestDto { Symbol = "AAPL", Quantity = 1 });

            var response = await client.GetAsync("/api/portfolio/transactions");

            var history = await response.Content.ReadFromJsonAsync<List<TransactionDto>>();
            Assert.Equal(
                new[] { "SELL", "BUY", "DEPOSIT" },
                history!.Select(t => t.TransactionType)
            );
        }

        [Fact]
        public async Task GetTransactions_BuyRow_CarriesQuantityPriceAndTotal()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await client.PostAsJsonAsync("/api/portfolio/deposit", new AmountRequestDto { Amount = 5000m });
            await client.PostAsJsonAsync("/api/portfolio", new TradeRequestDto { Symbol = "AAPL", Quantity = 2 });

            var response = await client.GetAsync("/api/portfolio/transactions");

            var history = await response.Content.ReadFromJsonAsync<List<TransactionDto>>();
            var buy = Assert.Single(history!, t => t.TransactionType == "BUY");
            Assert.Equal("AAPL", buy.Symbol);
            Assert.Equal(2, buy.Quantity);
            Assert.Equal(buy.Quantity * buy.Price, buy.TotalAmount);
        }

        // A deposit is stored as one unit priced at the amount, so the row the
        // UI renders has to show the deposited sum, not a quantity of 1.
        [Fact]
        public async Task GetTransactions_DepositRow_TotalAmountIsTheDepositedSum()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await client.PostAsJsonAsync("/api/portfolio/deposit", new AmountRequestDto { Amount = 750m });

            var response = await client.GetAsync("/api/portfolio/transactions");

            var history = await response.Content.ReadFromJsonAsync<List<TransactionDto>>();
            var deposit = Assert.Single(history!, t => t.TransactionType == "DEPOSIT");
            Assert.Equal("CASH", deposit.Symbol);
            Assert.Equal(750m, deposit.TotalAmount);
        }

        [Fact]
        public async Task GetTransactions_OnlyReturnsTheCallersOwnHistory()
        {
            var owner = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await owner.PostAsJsonAsync("/api/portfolio/deposit", new AmountRequestDto { Amount = 400m });

            var stranger = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            var response = await stranger.GetAsync("/api/portfolio/transactions");

            var history = await response.Content.ReadFromJsonAsync<List<TransactionDto>>();
            Assert.Empty(history!);
        }

        [Fact]
        public async Task GetTransactions_Paging_SplitsTheHistory()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await client.PostAsJsonAsync("/api/portfolio/deposit", new AmountRequestDto { Amount = 5000m });
            await client.PostAsJsonAsync("/api/portfolio", new TradeRequestDto { Symbol = "AAPL", Quantity = 1 });
            await client.PostAsJsonAsync("/api/portfolio", new TradeRequestDto { Symbol = "TSLA", Quantity = 1 });

            var firstPage = await client.GetFromJsonAsync<List<TransactionDto>>(
                "/api/portfolio/transactions?pageNumber=1&pageSize=2"
            );
            var secondPage = await client.GetFromJsonAsync<List<TransactionDto>>(
                "/api/portfolio/transactions?pageNumber=2&pageSize=2"
            );

            Assert.Equal(2, firstPage!.Count);
            var carriedOver = Assert.Single(secondPage!);
            Assert.Equal("DEPOSIT", carriedOver.TransactionType);
            Assert.DoesNotContain(firstPage, t => t.Id == carriedOver.Id);
        }

        [Fact]
        public async Task GetTransactions_InvalidPageSize_ReturnsBadRequest()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.GetAsync("/api/portfolio/transactions?pageSize=0");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task GetTransactions_Anonymous_IsRejected()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/portfolio/transactions");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
