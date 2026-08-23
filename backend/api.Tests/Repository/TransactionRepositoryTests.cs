using api.Helpers;
using api.Models;
using api.Repository;
using api.Tests.TestHelpers;
using Xunit;

namespace api.Tests.Repository
{
    public class TransactionRepositoryTests
    {
        [Fact]
        public async Task AddAsync_PersistsTransaction()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new TransactionRepository(context);
            var transaction = new Transaction
            {
                AppUserId = "user-1",
                Symbol = "AAPL",
                CompanyName = "Apple Inc.",
                TransactionType = "BUY",
                Quantity = 10,
                Price = 185.20m,
            };

            await repo.AddAsync(transaction);

            var stored = Assert.Single(context.Transactions);
            Assert.Equal("AAPL", stored.Symbol);
            Assert.Equal("BUY", stored.TransactionType);
            Assert.Equal(10, stored.Quantity);
        }

        [Fact]
        public async Task AddAsync_MultipleTransactions_AllPersisted()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new TransactionRepository(context);

            await repo.AddAsync(new Transaction
            {
                AppUserId = "user-1",
                Symbol = "CASH",
                CompanyName = "Wallet Deposit",
                TransactionType = "DEPOSIT",
                Quantity = 1,
                Price = 500m,
            });
            await repo.AddAsync(new Transaction
            {
                AppUserId = "user-1",
                Symbol = "AAPL",
                CompanyName = "Apple Inc.",
                TransactionType = "BUY",
                Quantity = 2,
                Price = 185.20m,
            });

            Assert.Equal(2, context.Transactions.Count());
        }

        [Fact]
        public async Task GetByUserAsync_ReturnsNewestFirst()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new TransactionRepository(context);
            await repo.AddAsync(Trade("user-1", "AAPL", Day(1)));
            await repo.AddAsync(Trade("user-1", "TSLA", Day(3)));
            await repo.AddAsync(Trade("user-1", "NVDA", Day(2)));

            var history = await repo.GetByUserAsync("user-1", new TransactionQueryObject());

            Assert.Equal(new[] { "TSLA", "NVDA", "AAPL" }, history.Select(t => t.Symbol));
        }

        // Two trades placed in the same tick share a timestamp; without the id
        // tie-break their order would be whatever the provider happened to give.
        [Fact]
        public async Task GetByUserAsync_SameTimestamp_OrdersByIdDescending()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new TransactionRepository(context);
            var sharedTick = Day(1);
            await repo.AddAsync(Trade("user-1", "AAPL", sharedTick));
            await repo.AddAsync(Trade("user-1", "TSLA", sharedTick));

            var history = await repo.GetByUserAsync("user-1", new TransactionQueryObject());

            Assert.Equal(new[] { "TSLA", "AAPL" }, history.Select(t => t.Symbol));
        }

        [Fact]
        public async Task GetByUserAsync_ExcludesOtherUsersTransactions()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new TransactionRepository(context);
            await repo.AddAsync(Trade("user-1", "AAPL", Day(1)));
            await repo.AddAsync(Trade("user-2", "TSLA", Day(2)));

            var history = await repo.GetByUserAsync("user-1", new TransactionQueryObject());

            var only = Assert.Single(history);
            Assert.Equal("AAPL", only.Symbol);
        }

        [Fact]
        public async Task GetByUserAsync_AppliesPaging()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new TransactionRepository(context);
            await repo.AddAsync(Trade("user-1", "AAPL", Day(1)));
            await repo.AddAsync(Trade("user-1", "NVDA", Day(2)));
            await repo.AddAsync(Trade("user-1", "TSLA", Day(3)));

            var query = new TransactionQueryObject { PageNumber = 2, PageSize = 2 };
            var history = await repo.GetByUserAsync("user-1", query);

            var only = Assert.Single(history);
            Assert.Equal("AAPL", only.Symbol);
        }

        [Fact]
        public async Task GetByUserAsync_NoHistory_ReturnsEmptyList()
        {
            var context = InMemoryDbContextFactory.Create();
            var repo = new TransactionRepository(context);

            var history = await repo.GetByUserAsync("user-1", new TransactionQueryObject());

            Assert.Empty(history);
        }

        private static DateTime Day(int day) =>
            new DateTime(2026, 3, day, 12, 0, 0, DateTimeKind.Utc);

        private static Transaction Trade(string userId, string symbol, DateTime timestamp) =>
            new()
            {
                AppUserId = userId,
                Symbol = symbol,
                CompanyName = $"{symbol} Inc.",
                TransactionType = "BUY",
                Quantity = 1,
                Price = 100m,
                Timestamp = timestamp,
            };
    }
}
