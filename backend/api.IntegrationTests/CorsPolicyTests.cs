using System.Net.Http.Headers;
using Xunit;

namespace api.IntegrationTests
{
    /// <summary>
    /// `AllowedOrigins` was documented in .env.example and set in
    /// appsettings.json while the CORS origin list was hardcoded in
    /// Program.cs, so setting it did nothing and nothing said so. These tests
    /// are what keeps the setting connected to the policy.
    /// </summary>
    [Collection("Integration")]
    public class CorsPolicyTests
    {
        private readonly DolfinApiFactory _factory;

        public CorsPolicyTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        private async Task<HttpResponseMessage> PreflightAsync(string origin)
        {
            var client = _factory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Options, "/api/stock");
            request.Headers.Add("Origin", origin);
            request.Headers.Add("Access-Control-Request-Method", "GET");
            return await client.SendAsync(request);
        }

        private static string? AllowedOrigin(HttpResponseHeaders headers) =>
            headers.TryGetValues("Access-Control-Allow-Origin", out var values)
                ? values.FirstOrDefault()
                : null;

        [Fact]
        public async Task Preflight_AllowsAnOriginSuppliedThroughConfiguration()
        {
            var response = await PreflightAsync(DolfinApiFactory.ConfiguredCorsOrigin);

            Assert.Equal(DolfinApiFactory.ConfiguredCorsOrigin, AllowedOrigin(response.Headers));
        }

        // A configured origin written with a trailing slash still has to match:
        // the browser's Origin header never carries one.
        [Fact]
        public async Task Preflight_AllowsAConfiguredOriginWrittenWithATrailingSlash()
        {
            var response = await PreflightAsync(
                DolfinApiFactory.ConfiguredCorsOriginWithTrailingSlash
            );

            Assert.Equal(
                DolfinApiFactory.ConfiguredCorsOriginWithTrailingSlash,
                AllowedOrigin(response.Headers)
            );
        }

        // Configuration adds to the built-in list rather than replacing it, so
        // a deployment that sets AllowedOrigins cannot lock the real frontend
        // out by forgetting to repeat it.
        [Fact]
        public async Task Preflight_StillAllowsTheBuiltInFrontendOrigin()
        {
            var response = await PreflightAsync("https://dol-fin.com");

            Assert.Equal("https://dol-fin.com", AllowedOrigin(response.Headers));
        }

        [Fact]
        public async Task Preflight_RejectsAnUnlistedOrigin()
        {
            var response = await PreflightAsync("https://not-our-frontend.example");

            Assert.Null(AllowedOrigin(response.Headers));
        }
    }
}
