using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Testcontainers.PostgreSql;
using Testcontainers.Redis;
using Xunit;

namespace api.IntegrationTests
{
    public class DolfinApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private const string TestJwtSigningKey =
            "integration-test-signing-key-that-is-at-least-64-bytes-long-for-hs512-0000";

        private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:17-alpine").Build();

        private readonly RedisContainer _redis = new RedisBuilder("redis:7-alpine").Build();

        public async Task InitializeAsync()
        {
            await Task.WhenAll(_postgres.StartAsync(), _redis.StartAsync());

            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
            Environment.SetEnvironmentVariable(
                "ConnectionStrings__DefaultConnection",
                _postgres.GetConnectionString()
            );
            Environment.SetEnvironmentVariable("ConnectionStrings__Redis", _redis.GetConnectionString());
            Environment.SetEnvironmentVariable("JWT__SigningKey", TestJwtSigningKey);
            Environment.SetEnvironmentVariable("JWT__Issuer", "https://dol-fin.com");
            Environment.SetEnvironmentVariable("JWT__Audience", "https://dol-fin.com");
            Environment.SetEnvironmentVariable("Admin__SeedUsername", "");
            // Prices must hold still for the duration of a test: several specs
            // buy at a price and then assert on the resulting balance.
            Environment.SetEnvironmentVariable("PriceSimulation__Enabled", "false");
            Environment.SetEnvironmentVariable("PriceAlerts__Enabled", "false");
            Environment.SetEnvironmentVariable("RateLimiting__AuthPermitLimit", "1000");
            Environment.SetEnvironmentVariable("RateLimiting__AuthWindowSeconds", "60");
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
        }

        async Task IAsyncLifetime.DisposeAsync()
        {
            await _postgres.DisposeAsync();
            await _redis.DisposeAsync();
            await base.DisposeAsync();
        }
    }

    [CollectionDefinition("Integration")]
    public class IntegrationTestCollection : ICollectionFixture<DolfinApiFactory> { }
}
