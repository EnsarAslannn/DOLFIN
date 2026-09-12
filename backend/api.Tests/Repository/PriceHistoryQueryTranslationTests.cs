using api.Data;
using api.Repository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace api.Tests.Repository
{
    /// <summary>
    /// The price-history read is the one query in the codebase whose shape --
    /// newest N rows per group, in a single round trip -- is not obviously
    /// translatable. The unit suite runs on EF Core's InMemory provider, which
    /// happily executes anything in memory and so would say nothing either
    /// way; PostgreSQL either translates it or throws at runtime.
    ///
    /// ToQueryString drives the real Npgsql translation pipeline without
    /// opening a connection, which is what lets this be a unit test rather
    /// than something only CI finds out about.
    /// </summary>
    public class PriceHistoryQueryTranslationTests
    {
        private static ApplicationDBContext NpgsqlContext()
        {
            // Never connected to: the provider only has to build the SQL.
            var options = new DbContextOptionsBuilder<ApplicationDBContext>()
                .UseNpgsql("Host=localhost;Database=translation-check;Username=none;Password=none")
                .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning))
                .Options;

            return new ApplicationDBContext(options);
        }

        [Fact]
        public void TheRecentPointsQueryTranslatesToSql()
        {
            using var context = NpgsqlContext();
            int[] stockIds = [1, 2, 3];

            var sql = context
                .PriceHistory.Where(p => stockIds.Contains(p.StockId))
                .GroupBy(p => p.StockId)
                .Select(g => new
                {
                    StockId = g.Key,
                    Points = g.OrderByDescending(p => p.RecordedAt)
                        .ThenByDescending(p => p.Id)
                        .Take(30)
                        .ToList(),
                })
                .ToQueryString();

            Assert.Contains("PriceHistory", sql);
        }

        [Fact]
        public void ThePruneQueryTranslatesToSql()
        {
            using var context = NpgsqlContext();

            var sql = context
                .PriceHistory.Where(p => p.RecordedAt < DateTime.UtcNow)
                .ToQueryString();

            Assert.Contains("PriceHistory", sql);
        }
    }
}
