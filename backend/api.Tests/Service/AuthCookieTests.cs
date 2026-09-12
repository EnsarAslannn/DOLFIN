using api.Service;
using Xunit;

namespace api.Tests.Service
{
    /// <summary>
    /// A session used to end four hours after sign-in and not a minute later,
    /// however busy the user was -- mid-trade, mid-form. These are the
    /// boundaries of the decision that keeps an active one alive, tested
    /// directly rather than by waiting two hours for one.
    /// </summary>
    public class AuthCookieTests
    {
        private static readonly DateTime Now = new(2026, 9, 12, 12, 0, 0, DateTimeKind.Utc);

        [Fact]
        public void AFreshTokenIsNotRenewed()
        {
            Assert.False(AuthCookie.ShouldRenew(Now.Add(AuthCookie.Lifetime), Now));
        }

        [Fact]
        public void ATokenPastHalfwayIsRenewed()
        {
            var validTo = Now.Add(AuthCookie.RenewWhenRemainingIsBelow).AddMinutes(-1);

            Assert.True(AuthCookie.ShouldRenew(validTo, Now));
        }

        // Exactly on the threshold is not yet inside it. Stated as a test
        // because "less than" and "at most" are the same sentence in English
        // and different code.
        [Fact]
        public void ATokenExactlyOnTheThresholdIsNotYetRenewed()
        {
            Assert.False(AuthCookie.ShouldRenew(Now.Add(AuthCookie.RenewWhenRemainingIsBelow), Now));
        }

        [Fact]
        public void ATokenAboutToExpireIsRenewed()
        {
            Assert.True(AuthCookie.ShouldRenew(Now.AddSeconds(30), Now));
        }

        // Validation has already failed the request by this point, so this
        // only keeps the answer honest if it is ever asked out of order.
        [Fact]
        public void AnExpiredTokenIsNotRenewed()
        {
            Assert.False(AuthCookie.ShouldRenew(Now.AddMinutes(-1), Now));
        }

        // Not a token this application issued; guessing at its intent is worse
        // than declining to.
        [Fact]
        public void ATokenWithNoExpiryIsLeftAlone()
        {
            Assert.False(AuthCookie.ShouldRenew(default, Now));
        }

        // If these ever cross, either every request mints a token or none ever
        // does, and both failures are silent.
        [Fact]
        public void TheRenewalWindowSitsInsideTheLifetime()
        {
            Assert.True(AuthCookie.RenewWhenRemainingIsBelow > TimeSpan.Zero);
            Assert.True(AuthCookie.RenewWhenRemainingIsBelow < AuthCookie.Lifetime);
        }

        // The cookie carries the same attributes wherever it is written, so a
        // renewal cannot quietly downgrade what sign-in set.
        [Fact]
        public void TheCookieIsHttpOnlySecureAndCrossSite()
        {
            var options = AuthCookie.Options();

            Assert.True(options.HttpOnly);
            Assert.True(options.Secure);
            Assert.Equal(Microsoft.AspNetCore.Http.SameSiteMode.None, options.SameSite);
            Assert.NotNull(options.Expires);
        }
    }
}
