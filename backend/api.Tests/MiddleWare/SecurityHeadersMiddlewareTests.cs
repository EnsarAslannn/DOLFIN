using api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Xunit;

namespace api.Tests.MiddleWare
{
    public class SecurityHeadersMiddlewareTests
    {
        /// <summary>
        /// DefaultHttpContext's response feature drops OnStarting callbacks on
        /// the floor, so a test built on it alone would pass whether or not the
        /// middleware registered one. This keeps them and fires them the way a
        /// real server does when the response begins.
        /// </summary>
        private sealed class StartableResponseFeature : HttpResponseFeature
        {
            private readonly List<(Func<object, Task> callback, object state)> _callbacks = [];

            public override bool HasStarted { get; }

            public override void OnStarting(Func<object, Task> callback, object state) =>
                _callbacks.Add((callback, state));

            public async Task FireOnStartingAsync()
            {
                foreach (var (callback, state) in _callbacks)
                {
                    await callback(state);
                }
            }
        }

        private static async Task<IHeaderDictionary> HeadersAfterAsync(RequestDelegate next)
        {
            var responseFeature = new StartableResponseFeature();
            var context = new DefaultHttpContext();
            context.Features.Set<IHttpResponseFeature>(responseFeature);

            var middleware = new SecurityHeadersMiddleware(next);

            await middleware.InvokeAsync(context);
            await responseFeature.FireOnStartingAsync();

            return context.Response.Headers;
        }

        [Fact]
        public async Task SetsEveryHeader()
        {
            var headers = await HeadersAfterAsync(_ => Task.CompletedTask);

            Assert.Equal("nosniff", headers["X-Content-Type-Options"]);
            Assert.Equal("SAMEORIGIN", headers["X-Frame-Options"]);
            Assert.Equal("strict-origin-when-cross-origin", headers["Referrer-Policy"]);
            Assert.Contains("geolocation=()", headers["Permissions-Policy"].ToString());
        }

        // Writing from OnStarting rather than inline is the whole point: a
        // response short-circuited further down the pipeline -- a 403 from the
        // CSRF check, a 429 from the rate limiter -- never unwinds back
        // through this middleware, and would otherwise go out bare.
        [Fact]
        public async Task SetsThemOnAResponseThatWasShortCircuited()
        {
            var headers = await HeadersAfterAsync(context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            });

            Assert.Equal("nosniff", headers["X-Content-Type-Options"]);
        }

        [Fact]
        public async Task PassesTheRequestOn()
        {
            var reachedNext = false;

            await HeadersAfterAsync(_ =>
            {
                reachedNext = true;
                return Task.CompletedTask;
            });

            Assert.True(reachedNext);
        }
    }
}
