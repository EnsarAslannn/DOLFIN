using System.Net;
using System.Net.Http.Json;
using api.Dtos.Account;
using api.IntegrationTests.TestHelpers;
using Xunit;

namespace api.IntegrationTests
{
    [Collection("Integration")]
    public class AuthFlowTests
    {
        private readonly DolfinApiFactory _factory;

        public AuthFlowTests(DolfinApiFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task Register_NewUser_ReturnsOkWithZeroBalance()
        {
            var username = $"newuser{Guid.NewGuid():N}"[..20];
            var client = TestClientFactory.CreateHttpsClient(_factory);

            var response = await client.PostAsJsonAsync(
                "/api/account/register",
                new RegisterDto
                {
                    Username = username,
                    Email = $"{username}@test.local",
                    Password = AuthHelper.DefaultPassword,
                }
            );

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadFromJsonAsync<NewUserDto>();
            Assert.NotNull(body);
            Assert.Equal(username, body!.UserName);
            Assert.Equal(0, body.WalletBalance);
        }

        [Fact]
        public async Task Login_WrongPassword_ReturnsUnauthorized()
        {
            var username = $"loginuser{Guid.NewGuid():N}"[..20];
            var registerClient = TestClientFactory.CreateHttpsClient(_factory);
            await registerClient.PostAsJsonAsync(
                "/api/account/register",
                new RegisterDto
                {
                    Username = username,
                    Email = $"{username}@test.local",
                    Password = AuthHelper.DefaultPassword,
                }
            );

            var client = TestClientFactory.CreateHttpsClient(_factory);
            var response = await client.PostAsJsonAsync(
                "/api/account/login",
                new LoginDto { UserName = username, Password = "WrongPassword123!" }
            );

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task UnauthenticatedRequest_ToProtectedEndpoint_ReturnsUnauthorized()
        {
            var client = TestClientFactory.CreateHttpsClient(_factory);

            var response = await client.GetAsync("/api/portfolio");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetUserProfile_WhenAuthenticated_ReturnsUserDetailsAndIssuesCsrfCookie()
        {
            var username = $"profileuser{Guid.NewGuid():N}"[..20];
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

            var profileResponse = await client.GetAsync("/api/account/profile");

            Assert.Equal(HttpStatusCode.OK, profileResponse.StatusCode);
            Assert.True(profileResponse.Headers.TryGetValues("Set-Cookie", out var setCookies));
            Assert.Contains(setCookies!, c => c.StartsWith("XSRF-TOKEN="));

            var body = await profileResponse.Content.ReadFromJsonAsync<UserProfileResponse>();
            Assert.NotNull(body);
            Assert.Equal(username, body!.UserName);
            Assert.Equal(0, body.WalletBalance);
        }

        [Fact]
        public async Task Logout_ThenAccessProtectedEndpoint_ReturnsUnauthorized()
        {
            var client = await AuthHelper.CreateAuthenticatedClientAsync(_factory);

            var before = await client.GetAsync("/api/portfolio");
            Assert.Equal(HttpStatusCode.OK, before.StatusCode);

            var logoutResponse = await client.PostAsync("/api/account/logout", content: null);
            Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);

            var after = await client.GetAsync("/api/portfolio");
            Assert.Equal(HttpStatusCode.Unauthorized, after.StatusCode);
        }

        [Fact]
        public async Task MutatingRequest_WithoutCsrfToken_ReturnsForbidden()
        {
            var username = $"nocsrfuser{Guid.NewGuid():N}"[..20];
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
        }

        [Fact]
        public async Task Session_WithoutAuthCookie_ReturnsNoContent()
        {
            var client = TestClientFactory.CreateHttpsClient(_factory);

            var response = await client.GetAsync("/api/account/session");

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task Session_WithAuthCookie_ReturnsProfileAndCsrfToken()
        {
            var username = $"sessionuser{Guid.NewGuid():N}"[..20];
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

            var response = await client.GetAsync("/api/account/session");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.True(response.Headers.TryGetValues("Set-Cookie", out var setCookies));
            Assert.Contains(setCookies!, c => c.StartsWith("XSRF-TOKEN="));

            var body = await response.Content.ReadFromJsonAsync<UserProfileResponse>();
            Assert.NotNull(body);
            Assert.Equal(username, body!.UserName);
        }

        private class UserProfileResponse
        {
            public string UserName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public decimal WalletBalance { get; set; }
        }
    }
}
