using System.Net;
using System.Net.Http.Json;
using api.Dtos.Account;
using api.IntegrationTests.TestHelpers;
using api.Service;
using Xunit;

namespace api.IntegrationTests
{
    /// <summary>
    /// A session used to end four hours after sign-in and not a minute later,
    /// however busy the user was. A token past halfway through its life is
    /// renewed on the next request instead.
    /// </summary>
    [Collection("Integration")]
    public class SlidingSessionTests
    {
        private readonly DolfinApiFactory _factory;

        public SlidingSessionTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        private static string? AuthCookieFrom(HttpResponseMessage response)
        {
            if (!response.Headers.TryGetValues("Set-Cookie", out var cookies))
                return null;

            return cookies.FirstOrDefault(c => c.StartsWith($"{AuthCookie.Name}=", StringComparison.Ordinal));
        }

        // A freshly issued token has its whole life ahead of it, so nothing is
        // renewed. Minting one per request would be pure waste.
        [Fact]
        public async Task AFreshTokenIsNotReissuedOnEveryRequest()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var response = await client.GetAsync("/api/portfolio");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Null(AuthCookieFrom(response));
        }

        [Fact]
        public async Task TheRenewalWindowIsShorterThanTheLifetime()
        {
            // If these ever cross, either every request mints a token or none
            // ever does -- and both failures are silent.
            Assert.True(AuthCookie.RenewWhenRemainingIsBelow < AuthCookie.Lifetime);
            Assert.True(AuthCookie.RenewWhenRemainingIsBelow > TimeSpan.Zero);
        }

        // Signing out revokes every token the user holds by rotating their
        // security stamp, and the renewal must not resurrect one: the stamp is
        // checked before anything is reissued.
        [Fact]
        public async Task ARevokedSessionIsNotRenewedBackToLife()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var logout = await client.PostAsync("/api/account/logout", content: null);
            Assert.Equal(HttpStatusCode.OK, logout.StatusCode);

            var afterLogout = await client.GetAsync("/api/portfolio");

            Assert.Equal(HttpStatusCode.Unauthorized, afterLogout.StatusCode);
            Assert.Null(AuthCookieFrom(afterLogout));
        }

        // The cookie the sign-in path writes and the one the renewal writes
        // come from the same place, so they cannot drift apart in their
        // attributes -- a renewal that dropped Secure or SameSite would be a
        // downgrade nobody would notice.
        [Fact]
        public async Task TheSignInCookieCarriesTheAttributesItShould()
        {
            var username = $"slide{Guid.NewGuid():N}"[..20];
            var client = TestClientFactory.CreateHttpsClient(_factory, new CookieRelayHandler());

            var response = await client.PostAsJsonAsync(
                "/api/account/register",
                new RegisterDto
                {
                    Username = username,
                    Email = $"{username}@test.local",
                    Password = AuthHelper.DefaultPassword,
                }
            );

            var cookie = AuthCookieFrom(response);
            Assert.NotNull(cookie);
            Assert.Contains("httponly", cookie!, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("secure", cookie, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("samesite=none", cookie, StringComparison.OrdinalIgnoreCase);
        }
    }
}
