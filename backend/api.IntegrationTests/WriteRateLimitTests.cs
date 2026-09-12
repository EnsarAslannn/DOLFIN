using System.Net;
using System.Net.Http.Json;
using api.Dtos.Account;
using api.Dtos.Portfolio;
using api.IntegrationTests.TestHelpers;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace api.IntegrationTests
{
    /// <summary>
    /// Only sign-in and sign-up were ever rate limited. Trading, moving money
    /// and posting comments had no ceiling at all.
    ///
    /// These build their own host on top of the shared containers so the limit
    /// can be turned down to something a test can actually reach — the shared
    /// factory runs with it raised, or the rest of the suite would throttle
    /// itself.
    /// </summary>
    [Collection("Integration")]
    public class WriteRateLimitTests
    {
        private readonly DolfinApiFactory _factory;

        public WriteRateLimitTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        private WebApplicationFactory<Program> WithWriteLimit(int permits) =>
            _factory.WithWebHostBuilder(builder =>
            {
                builder.UseSetting("RateLimiting:WritePermitLimit", permits.ToString());
                builder.UseSetting("RateLimiting:WriteWindowSeconds", "60");
            });

        private static async Task<HttpClient> RegisterAsync(WebApplicationFactory<Program> factory)
        {
            var username = $"rl{Guid.NewGuid():N}"[..20];
            var client = factory.CreateDefaultClient(
                new Uri("https://localhost"),
                new CookieRelayHandler()
            );

            var register = await client.PostAsJsonAsync(
                "/api/account/register",
                new RegisterDto
                {
                    Username = username,
                    Email = $"{username}@test.local",
                    Password = AuthHelper.DefaultPassword,
                }
            );
            register.EnsureSuccessStatusCode();

            // Picks up the CSRF token the mutating requests below need.
            (await client.GetAsync("/api/account/profile")).EnsureSuccessStatusCode();

            return client;
        }

        [Fact]
        public async Task Deposit_PastTheLimit_IsRejectedWith429()
        {
            var factory = WithWriteLimit(2);
            var client = await RegisterAsync(factory);

            var statuses = new List<HttpStatusCode>();
            for (var i = 0; i < 4; i++)
            {
                var response = await client.PostAsJsonAsync(
                    "/api/portfolio/deposit",
                    new AmountRequestDto { Amount = 1m }
                );
                statuses.Add(response.StatusCode);
            }

            Assert.Equal(HttpStatusCode.OK, statuses[0]);
            Assert.Contains(HttpStatusCode.TooManyRequests, statuses);
        }

        // The budget is per user, not per IP. Every request in this suite comes
        // from the same address, so an IP partition would have the second
        // account already throttled by the first -- which is what would happen
        // to two real people behind one office network.
        [Fact]
        public async Task TheBudgetIsPerUserNotPerAddress()
        {
            var factory = WithWriteLimit(1);

            var first = await RegisterAsync(factory);
            var second = await RegisterAsync(factory);

            var firstDeposit = await first.PostAsJsonAsync(
                "/api/portfolio/deposit",
                new AmountRequestDto { Amount = 1m }
            );
            var firstAgain = await first.PostAsJsonAsync(
                "/api/portfolio/deposit",
                new AmountRequestDto { Amount = 1m }
            );
            var secondDeposit = await second.PostAsJsonAsync(
                "/api/portfolio/deposit",
                new AmountRequestDto { Amount = 1m }
            );

            Assert.Equal(HttpStatusCode.OK, firstDeposit.StatusCode);
            Assert.Equal(HttpStatusCode.TooManyRequests, firstAgain.StatusCode);
            Assert.Equal(HttpStatusCode.OK, secondDeposit.StatusCode);
        }

        // Reads are not throttled: the wallet polls its own figures on a timer,
        // and a limit there would start failing a page nobody is abusing.
        [Fact]
        public async Task ReadsAreNotThrottled()
        {
            var factory = WithWriteLimit(1);
            var client = await RegisterAsync(factory);

            for (var i = 0; i < 5; i++)
            {
                var response = await client.GetAsync("/api/portfolio");
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            }
        }

        // Marking a notification read is deliberately outside the policy: the
        // navbar bell fires one per unread notification when "mark all read"
        // is clicked, with no ceiling on how many that is.
        [Fact]
        public async Task MarkingNotificationsRead_IsNotThrottled()
        {
            var factory = WithWriteLimit(1);
            var client = await RegisterAsync(factory);

            for (var i = 0; i < 5; i++)
            {
                var response = await client.PostAsync(
                    "/api/alerts/notifications/999999/read",
                    content: null
                );
                // The notification does not exist; the point is that the
                // request is answered rather than refused for being the sixth.
                Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            }
        }
    }
}
