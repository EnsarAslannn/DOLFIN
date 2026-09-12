using Microsoft.AspNetCore.Http;

namespace api.Middleware
{
    /// <summary>
    /// The response headers a browser uses to decide what it is allowed to do
    /// with what we sent it.
    ///
    /// None of these were set. That stood out next to the rest of the security
    /// work here — CSRF double-submit, account lockout, security-stamp token
    /// revocation — which is all the hard part; this is the one-line part.
    ///
    /// They are applied from a callback on OnStarting rather than written
    /// directly, so they land on responses that never come back through this
    /// middleware: the ones short-circuited further down the pipeline, such as
    /// a 403 from the CSRF check or a 429 from the rate limiter.
    /// </summary>
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public Task InvokeAsync(HttpContext context)
        {
            context.Response.OnStarting(
                static state =>
                {
                    var headers = ((HttpContext)state).Response.Headers;

                    // Stops a browser second-guessing a declared Content-Type.
                    // Everything here is JSON, and a sniffed response that a
                    // browser decides is HTML is the whole of a class of
                    // injection bugs.
                    headers["X-Content-Type-Options"] = "nosniff";

                    // Nothing this API returns is meant to be framed. Scalar
                    // is served from this origin, so SAMEORIGIN rather than
                    // DENY.
                    headers["X-Frame-Options"] = "SAMEORIGIN";

                    // A URL here can carry a stock id or an alert id. Sending
                    // only the origin to another site is enough for a referrer
                    // and leaks no path.
                    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

                    // This is an API and a docs page; it needs none of these.
                    headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";

                    return Task.CompletedTask;
                },
                context
            );

            return _next(context);
        }
    }
}
