using System.Net;
using System.Net.Http.Json;
using api.Dtos.Account;
using api.IntegrationTests.TestHelpers;
using Xunit;

namespace api.IntegrationTests
{
    /// <summary>
    /// None of these headers were set at all. The point of asserting them here
    /// rather than reading Program.cs is that they have to survive the
    /// responses that never reach a controller — a 401, a 404, a rate-limit
    /// rejection — which is exactly where a middleware ordering mistake shows
    /// up and nowhere else.
    /// </summary>
    [Collection("Integration")]
    public class SecurityHeadersTests
    {
        private readonly DolfinApiFactory _factory;

        public SecurityHeadersTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        private static void AssertSecurityHeaders(HttpResponseMessage response)
        {
            Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
            Assert.Equal("SAMEORIGIN", Assert.Single(response.Headers.GetValues("X-Frame-Options")));
            Assert.Equal(
                "strict-origin-when-cross-origin",
                Assert.Single(response.Headers.GetValues("Referrer-Policy"))
            );
            Assert.Contains("geolocation=()", Assert.Single(response.Headers.GetValues("Permissions-Policy")));
        }

        [Fact]
        public async Task AnOrdinaryResponse_CarriesTheSecurityHeaders()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/stock?pageSize=1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            AssertSecurityHeaders(response);
        }

        // A 401 is written by the authentication handler, not by a controller,
        // so it is one of the responses a middleware placed too late would
        // miss.
        [Fact]
        public async Task AnUnauthorizedResponse_CarriesTheSecurityHeaders()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/portfolio");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            AssertSecurityHeaders(response);
        }

        [Fact]
        public async Task ANotFoundResponse_CarriesTheSecurityHeaders()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/stock/99999999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            AssertSecurityHeaders(response);
        }

        // The CSRF check short-circuits the pipeline before routing resolves an
        // action, which is the other place a response can escape uncovered.
        // Registering without then calling /profile leaves the caller with an
        // auth cookie and no CSRF token, which is what makes the next request
        // a 403.
        [Fact]
        public async Task ARejectedCsrfResponse_CarriesTheSecurityHeaders()
        {
            var username = $"hdr{Guid.NewGuid():N}"[..20];
            var client = TestClientFactory.CreateHttpsClient(_factory, new CookieRelayHandler());

            var registerResponse = await client.PostAsJsonAsync(
                "/api/account/register",
                new RegisterDto
                {
                    Username = username,
                    Email = $"{username}@test.local",
                    Password = AuthHelper.DefaultPassword,
                }
            );
            registerResponse.EnsureSuccessStatusCode();

            var response = await client.PostAsync("/api/account/logout", content: null);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
            AssertSecurityHeaders(response);
        }

        [Fact]
        public async Task TheHealthEndpoint_CarriesTheSecurityHeaders()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/health");

            AssertSecurityHeaders(response);
        }

        // UseHsts excludes localhost by default, which is the behaviour worth
        // pinning: a developer who picks up Strict-Transport-Security on
        // localhost has their browser refuse plain HTTP there for a month, on
        // every project they run on that port. The header belongs on the real
        // host and nowhere else, and these tests talk to https://localhost.
        [Fact]
        public async Task Localhost_DoesNotGetPinnedToHttps()
        {
            var client = TestClientFactory.CreateHttpsClient(_factory);

            var response = await client.GetAsync("/api/stock?pageSize=1");

            Assert.False(response.Headers.Contains("Strict-Transport-Security"));
        }
    }
}
