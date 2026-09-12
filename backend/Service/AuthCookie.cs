using Microsoft.AspNetCore.Http;

namespace api.Service
{
    /// <summary>
    /// The one place the auth cookie's name, lifetime and attributes are
    /// written down.
    ///
    /// They used to be spelled out separately in TokenService (the JWT's
    /// expiry), AccountController (the cookie's) and Program.cs (the name read
    /// back), which is three places to keep in step and no way to notice when
    /// they drift.
    /// </summary>
    public static class AuthCookie
    {
        public const string Name = "access_token";

        /// <summary>
        /// How long a freshly issued token is good for. Both the JWT's own
        /// expiry and the cookie's are set from this, so they cannot disagree.
        /// </summary>
        public static readonly TimeSpan Lifetime = TimeSpan.FromHours(4);

        /// <summary>
        /// A token is renewed once less than this much of its life is left.
        /// Renewing on every request would mint a token per call for no
        /// benefit; waiting for the last minute would leave a request racing
        /// its own expiry.
        /// </summary>
        public static readonly TimeSpan RenewWhenRemainingIsBelow = TimeSpan.FromHours(2);

        /// <summary>
        /// Whether a token this close to expiry should be exchanged for a
        /// fresh one.
        ///
        /// A pure decision so it can be tested at the boundaries rather than
        /// only by waiting two hours. A token with no expiry at all is left
        /// alone: that is not a token this application issued, and guessing at
        /// its intent is worse than declining to.
        /// </summary>
        public static bool ShouldRenew(DateTime validToUtc, DateTime nowUtc)
        {
            if (validToUtc == default)
                return false;

            // Already expired is not this decision's business -- validation has
            // failed the request before it gets here -- but saying so keeps the
            // answer honest if it is ever asked out of order.
            var remaining = validToUtc - nowUtc;
            return remaining > TimeSpan.Zero && remaining < RenewWhenRemainingIsBelow;
        }

        public static CookieOptions Options() =>
            new()
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.Add(Lifetime),
            };

        public static void Write(HttpResponse response, string token) =>
            response.Cookies.Append(Name, token, Options());

        /// <summary>
        /// Deletes it with the attributes it was written with. A browser
        /// matches a deletion on name, path and domain, and leaving the rest
        /// off is the kind of near-miss that leaves a cookie in place on some
        /// browsers and not others.
        /// </summary>
        public static void Clear(HttpResponse response) =>
            response.Cookies.Delete(
                Name,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                }
            );
    }
}
