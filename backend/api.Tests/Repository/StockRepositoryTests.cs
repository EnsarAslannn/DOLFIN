using api.Data;
using api.Dtos.Stock;
using api.Helpers;
using api.Models;
using api.Repository;
using api.Tests.TestHelpers;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api.Tests.Repository
{
    public class StockRepositoryTests
    {
        [Fact]
        public async Task UpdatePricesAsync_WritesTheNewPriceForEveryStock()
        {
            var context = await SeedAsync(MakeStock("AAPL", purchase: 100m), MakeStock("TSLA", purchase: 200m));
            var repo = new StockRepository(context);

            var count = await repo.UpdatePricesAsync(stock => stock.Purchase + 1m);

            Assert.Equal(2, count);
            Assert.Equal(101m, context.Stock.Single(s => s.Symbol == "AAPL").Purchase);
            Assert.Equal(201m, context.Stock.Single(s => s.Symbol == "TSLA").Purchase);
        }

        // Cost basis lives on the position, not the stock: a price tick must
        // not touch what a holder paid, or their P/L would always read zero.
        [Fact]
        public async Task UpdatePricesAsync_LeavesEverythingButThePriceAlone()
        {
            var context = await SeedAsync(MakeStock("AAPL", companyName: "Apple Inc.", purchase: 100m, marketCap: 55));
            var repo = new StockRepository(context);

            await repo.UpdatePricesAsync(_ => 123.45m);

            var stock = context.Stock.Single();
            Assert.Equal(123.45m, stock.Purchase);
            Assert.Equal("Apple Inc.", stock.CompanyName);
            Assert.Equal("Technology", stock.Industry);
            Assert.Equal(0.5m, stock.LastDiv);
            Assert.Equal(55, stock.MarketCap);
        }

        [Fact]
        public async Task UpdatePricesAsync_WithNoStocks_ReturnsZero()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new StockRepository(context);

            Assert.Equal(0, await repo.UpdatePricesAsync(_ => 1m));
        }

        private static Stock MakeStock(
            string symbol,
            string companyName = "Some Inc.",
            decimal purchase = 100m,
            long marketCap = 1_000_000
        ) =>
            new()
            {
                Symbol = symbol,
                CompanyName = companyName,
                Purchase = purchase,
                LastDiv = 0.5m,
                Industry = "Technology",
                MarketCap = marketCap,
            };

        private static async Task<ApplicationDBContext> SeedAsync(params Stock[] stocks)
        {
            var context = InMemoryDbContextFactory.Create();
            await context.Stock.AddRangeAsync(stocks);
            await context.SaveChangesAsync();
            return context;
        }

        [Fact]
        public async Task GetAllAsync_FiltersBySymbol()
        {
            var context = await SeedAsync(MakeStock("AAPL"), MakeStock("MSFT"));
            var repo = new StockRepository(context);

            var result = await repo.GetAllAsync(new QueryObject { Symbol = "AAP" });

            Assert.Single(result);
            Assert.Equal("AAPL", result[0].Symbol);
        }

        [Fact]
        public async Task GetAllAsync_FiltersByCompanyName()
        {
            var context = await SeedAsync(
                MakeStock("AAPL", companyName: "Apple Inc."),
                MakeStock("MSFT", companyName: "Microsoft Corporation")
            );
            var repo = new StockRepository(context);

            var result = await repo.GetAllAsync(new QueryObject { CompanyName = "Micro" });

            Assert.Single(result);
            Assert.Equal("MSFT", result[0].Symbol);
        }

        // Nobody types a company's capitalisation into a search box. The real
        // guard for this is the integration test against PostgreSQL, whose
        // LIKE is case-sensitive where InMemory's Contains is not -- this one
        // only keeps the lowering from being dropped from the query shape.
        [Fact]
        public async Task GetAllAsync_FiltersByCompanyName_IgnoringCase()
        {
            var context = await SeedAsync(
                MakeStock("AAPL", companyName: "Apple Inc."),
                MakeStock("MSFT", companyName: "Microsoft Corporation")
            );
            var repo = new StockRepository(context);

            var result = await repo.GetAllAsync(new QueryObject { CompanyName = "microsoft" });

            Assert.Single(result);
            Assert.Equal("MSFT", result[0].Symbol);
        }

        [Fact]
        public async Task GetAllAsync_FiltersBySymbol_IgnoringCase()
        {
            var context = await SeedAsync(
                MakeStock("AAPL", companyName: "Apple Inc."),
                MakeStock("MSFT", companyName: "Microsoft Corporation")
            );
            var repo = new StockRepository(context);

            var result = await repo.GetAllAsync(new QueryObject { Symbol = "msft" });

            Assert.Single(result);
            Assert.Equal("MSFT", result[0].Symbol);
        }

        [Fact]
        public async Task GetAllAsync_SortsByMarketCapDescending()
        {
            var context = await SeedAsync(
                MakeStock("SMALL", marketCap: 1_000),
                MakeStock("BIG", marketCap: 1_000_000)
            );
            var repo = new StockRepository(context);

            var result = await repo.GetAllAsync(
                new QueryObject { SortBy = "MarketCap", IsDescending = true }
            );

            Assert.Equal(new[] { "BIG", "SMALL" }, result.Select(s => s.Symbol));
        }

        [Fact]
        public async Task GetAllAsync_Paginates()
        {
            var context = await SeedAsync(
                MakeStock("AAA"),
                MakeStock("BBB"),
                MakeStock("CCC")
            );
            var repo = new StockRepository(context);

            var page = await repo.GetAllAsync(
                new QueryObject { PageNumber = 2, PageSize = 1 }
            );

            Assert.Single(page);
            Assert.Equal("BBB", page[0].Symbol);
        }

        [Fact]
        public async Task GetByIdAsync_Found_IncludesComments()
        {
            var stock = MakeStock("AAPL");
            var context = InMemoryDbContextFactory.Create();
            await context.Stock.AddAsync(stock);
            await context.SaveChangesAsync();
            context.Comments.Add(
                new Comment
                {
                    Title = "Nice",
                    Content = "Great buy",
                    StockId = stock.Id,
                    AppUserId = "user-1",
                }
            );
            await context.SaveChangesAsync();
            var repo = new StockRepository(context);

            var result = await repo.GetByIdAsync(stock.Id);

            Assert.NotNull(result);
            Assert.Single(result!.Comments);
        }

        [Fact]
        public async Task GetByIdAsync_NotFound_ReturnsNull()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new StockRepository(context);

            var result = await repo.GetByIdAsync(999);

            Assert.Null(result);
        }

        [Theory]
        [InlineData("aapl")]
        [InlineData("AAPL")]
        [InlineData(" AAPL ")]
        public async Task GetBySymbolAsync_IsCaseInsensitiveAndTrimmed(string lookup)
        {
            var context = await SeedAsync(MakeStock("AAPL"));
            var repo = new StockRepository(context);

            var result = await repo.GetBySymbolAsync(lookup);

            Assert.NotNull(result);
            Assert.Equal("AAPL", result!.Symbol);
        }

        [Fact]
        public async Task GetBySymbolAsync_NonExistentSymbol_ReturnsNull()
        {
            var context = await SeedAsync(MakeStock("AAPL"));
            var repo = new StockRepository(context);

            var result = await repo.GetBySymbolAsync("DOESNOTEXIST");

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateAsync_PersistsStock()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new StockRepository(context);

            var created = await repo.CreateAsync(MakeStock("AAPL"));

            Assert.NotEqual(0, created.Id);
            Assert.Equal(1, await context.Stock.CountAsync());
        }

        [Fact]
        public async Task DeleteAsync_Found_RemovesAndReturnsStock()
        {
            var stock = MakeStock("AAPL");
            var context = await SeedAsync(stock);
            var repo = new StockRepository(context);

            var deleted = await repo.DeleteAsync(stock.Id);

            Assert.NotNull(deleted);
            Assert.Equal(0, await context.Stock.CountAsync());
        }

        [Fact]
        public async Task DeleteAsync_NotFound_ReturnsNull()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new StockRepository(context);

            var deleted = await repo.DeleteAsync(999);

            Assert.Null(deleted);
        }

        [Fact]
        public async Task StockExists_ReturnsTrueForExistingId()
        {
            var stock = MakeStock("AAPL");
            var context = await SeedAsync(stock);
            var repo = new StockRepository(context);

            Assert.True(await repo.StockExists(stock.Id));
            Assert.False(await repo.StockExists(stock.Id + 1));
        }

        [Fact]
        public async Task UpdateAsync_Found_UpdatesAllFields()
        {
            var stock = MakeStock("AAPL", companyName: "Apple Inc.", purchase: 100m);
            var context = await SeedAsync(stock);
            var repo = new StockRepository(context);

            var updated = await repo.UpdateAsync(
                stock.Id,
                new UpdateStockRequestDto
                {
                    Symbol = "aapl",
                    CompanyName = "Apple Incorporated",
                    Purchase = 250m,
                    LastDiv = 1.5m,
                    Industry = "Consumer Electronics",
                    MarketCap = 3_000_000,
                }
            );

            Assert.NotNull(updated);
            Assert.Equal("AAPL", updated!.Symbol);
            Assert.Equal("Apple Incorporated", updated.CompanyName);
            Assert.Equal(250m, updated.Purchase);
            Assert.Equal(1.5m, updated.LastDiv);
            Assert.Equal("Consumer Electronics", updated.Industry);
            Assert.Equal(3_000_000, updated.MarketCap);
        }

        [Fact]
        public async Task UpdateAsync_NotFound_ReturnsNull()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new StockRepository(context);

            var updated = await repo.UpdateAsync(
                999,
                new UpdateStockRequestDto
                {
                    Symbol = "AAPL",
                    CompanyName = "Apple Inc.",
                    Purchase = 100m,
                    LastDiv = 0.5m,
                    Industry = "Technology",
                    MarketCap = 1_000_000,
                }
            );

            Assert.Null(updated);
        }

        [Fact]
        public async Task GetMarketTrendsAsync_OnlyReturnsKnownTrendSymbols()
        {
            var context = await SeedAsync(MakeStock("AAPL"), MakeStock("NOTATREND"));
            var repo = new StockRepository(context);

            var result = await repo.GetMarketTrendsAsync();

            Assert.Single(result);
            Assert.Equal("AAPL", result[0].Symbol);
        }
    }
}
