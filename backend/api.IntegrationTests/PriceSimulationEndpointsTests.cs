using System.Net.Http.Json;
using api.Dtos;
using api.Dtos.Portfolio;
using api.Dtos.Stock;
using api.Interfaces;
using api.IntegrationTests.TestHelpers;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api.IntegrationTests
{
    /// <summary>
    /// The simulation's background timer is off in tests, so these drive the
    /// same repository path it uses and assert on what a user would then see.
    /// NVDA is used throughout because no other spec trades it.
    /// </summary>
    [Collection("Integration")]
    public class PriceSimulationEndpointsTests
    {
        private const string Symbol = "NVDA";

        private readonly DolfinApiFactory _factory;

        public PriceSimulationEndpointsTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task PriceMove_TurnsAFlatPositionIntoARealGain()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await client.PostAsJsonAsync("/api/portfolio/deposit", new AmountRequestDto { Amount = 50_000m });
            await client.PostAsJsonAsync("/api/portfolio", new TradeRequestDto { Symbol = Symbol, Quantity = 3 });

            var before = await GetPositionAsync(client);
            Assert.Equal(0m, before.GainLossAmount);

            var original = before.CurrentPrice;
            try
            {
                await SetPriceAsync(original + 10m);

                var after = await GetPositionAsync(client);

                Assert.Equal(original + 10m, after.CurrentPrice);
                Assert.Equal(original, after.AverageCostPerShare);
                Assert.Equal(30m, after.GainLossAmount);
                Assert.True(after.GainLossPercent > 0);
            }
            finally
            {
                await SetPriceAsync(original);
            }
        }

        [Fact]
        public async Task PriceMove_CanPutAPositionUnderwater()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await client.PostAsJsonAsync("/api/portfolio/deposit", new AmountRequestDto { Amount = 50_000m });
            await client.PostAsJsonAsync("/api/portfolio", new TradeRequestDto { Symbol = Symbol, Quantity = 2 });

            var original = (await GetPositionAsync(client)).CurrentPrice;
            try
            {
                await SetPriceAsync(original - 20m);

                var after = await GetPositionAsync(client);

                Assert.Equal(-40m, after.GainLossAmount);
                Assert.True(after.GainLossPercent < 0);
            }
            finally
            {
                await SetPriceAsync(original);
            }
        }

        // The stock read path is cached; if a price move did not invalidate it
        // the API would keep serving the old price while P/L moved underneath.
        [Fact]
        public async Task PriceMove_IsVisibleThroughTheCachedStockRead()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            var before = await GetStockPriceAsync(client);

            try
            {
                await SetPriceAsync(before + 7m);

                Assert.Equal(before + 7m, await GetStockPriceAsync(client));
            }
            finally
            {
                await SetPriceAsync(before);
            }
        }

        // Cost basis belongs to the position, not the stock. If a tick rewrote
        // it, every holding would snap back to zero P/L on the next move.
        [Fact]
        public async Task PriceMove_DoesNotDisturbWhatTheHolderPaid()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);
            await client.PostAsJsonAsync("/api/portfolio/deposit", new AmountRequestDto { Amount = 50_000m });
            await client.PostAsJsonAsync("/api/portfolio", new TradeRequestDto { Symbol = Symbol, Quantity = 1 });

            var original = (await GetPositionAsync(client)).AverageCostPerShare;
            try
            {
                await SetPriceAsync(original + 5m);
                await SetPriceAsync(original + 11m);

                Assert.Equal(original, (await GetPositionAsync(client)).AverageCostPerShare);
            }
            finally
            {
                await SetPriceAsync(original);
            }
        }

        private async Task SetPriceAsync(decimal price)
        {
            using var scope = _factory.Services.CreateScope();
            var stockRepo = scope.ServiceProvider.GetRequiredService<IStockRepository>();

            await stockRepo.UpdatePricesAsync(stock =>
                stock.Symbol == Symbol ? price : stock.Purchase
            );
        }

        private static async Task<StockAllocationDto> GetPositionAsync(HttpClient client)
        {
            var metrics = await client.GetFromJsonAsync<PortfolioMetricsDto>("/api/portfolio/metrics");
            return Assert.Single(metrics!.Allocations, a => a.Symbol == Symbol);
        }

        private static async Task<decimal> GetStockPriceAsync(HttpClient client)
        {
            var stocks = await client.GetFromJsonAsync<List<StockDto>>($"/api/stock?Symbol={Symbol}");
            return Assert.Single(stocks!, s => s.Symbol == Symbol).Purchase;
        }
    }
}
