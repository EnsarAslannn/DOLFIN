using System.Security.Claims;
using api.Extensions;
using api.Models;
using api.Tests.TestHelpers;
using Moq;
using Xunit;

namespace api.Tests.Extensions
{
    public class ClaimsExtensionsTests
    {
        private static ClaimsPrincipal MakePrincipal(params Claim[] claims) =>
            new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        [Fact]
        public async Task GetAuthenticatedUserAsync_WithIdentityName_LooksUpByName()
        {
            var user = new AppUser { Id = "u1", UserName = "trader1" };
            var userManager = MockUserManager.Create();
            userManager.Setup(m => m.FindByNameAsync("trader1")).ReturnsAsync(user);

            var principal = MakePrincipal(new Claim(ClaimTypes.Name, "trader1"));

            var result = await principal.GetAuthenticatedUserAsync(userManager.Object);

            Assert.Same(user, result);
            userManager.Verify(m => m.FindByNameAsync("trader1"), Times.Once);
            userManager.Verify(m => m.FindByIdAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task GetAuthenticatedUserAsync_WithPlainNameClaim_FallsBackToIt()
        {
            var user = new AppUser { Id = "u2", UserName = "trader2" };
            var userManager = MockUserManager.Create();
            userManager.Setup(m => m.FindByNameAsync("trader2")).ReturnsAsync(user);

            var principal = MakePrincipal(new Claim("name", "trader2"));

            var result = await principal.GetAuthenticatedUserAsync(userManager.Object);

            Assert.Same(user, result);
        }

        [Fact]
        public async Task GetAuthenticatedUserAsync_NoNameClaim_FallsBackToNameIdentifier()
        {
            var user = new AppUser { Id = "u3", UserName = "trader3" };
            var userManager = MockUserManager.Create();
            userManager.Setup(m => m.FindByIdAsync("u3")).ReturnsAsync(user);

            var principal = MakePrincipal(new Claim(ClaimTypes.NameIdentifier, "u3"));

            var result = await principal.GetAuthenticatedUserAsync(userManager.Object);

            Assert.Same(user, result);
            userManager.Verify(m => m.FindByNameAsync(It.IsAny<string>()), Times.Never);
            userManager.Verify(m => m.FindByIdAsync("u3"), Times.Once);
        }

        [Fact]
        public async Task GetAuthenticatedUserAsync_NoNameClaim_FallsBackToSubClaim()
        {
            var user = new AppUser { Id = "u4", UserName = "trader4" };
            var userManager = MockUserManager.Create();
            userManager.Setup(m => m.FindByIdAsync("u4")).ReturnsAsync(user);

            var principal = MakePrincipal(new Claim("sub", "u4"));

            var result = await principal.GetAuthenticatedUserAsync(userManager.Object);

            Assert.Same(user, result);
        }

        [Fact]
        public async Task GetAuthenticatedUserAsync_NoUsableClaims_ReturnsNullWithoutCallingUserManager()
        {
            var userManager = MockUserManager.Create();

            var principal = MakePrincipal(new Claim(ClaimTypes.Role, "Admin"));

            var result = await principal.GetAuthenticatedUserAsync(userManager.Object);

            Assert.Null(result);
            userManager.Verify(m => m.FindByNameAsync(It.IsAny<string>()), Times.Never);
            userManager.Verify(m => m.FindByIdAsync(It.IsAny<string>()), Times.Never);
        }

        // A real token carries both. The id is what identity should hang off:
        // a username is a field a user could later be allowed to change, and a
        // claim naming one would then have quietly gone stale.
        [Fact]
        public async Task GetAuthenticatedUserAsync_WithBothClaims_PrefersTheId()
        {
            var user = new AppUser { Id = "u5", UserName = "trader5" };
            var userManager = MockUserManager.Create();
            userManager.Setup(m => m.FindByIdAsync("u5")).ReturnsAsync(user);

            var principal = MakePrincipal(
                new Claim(ClaimTypes.Name, "trader5"),
                new Claim(ClaimTypes.NameIdentifier, "u5")
            );

            var result = await principal.GetAuthenticatedUserAsync(userManager.Object);

            Assert.Same(user, result);
            userManager.Verify(m => m.FindByIdAsync("u5"), Times.Once);
            userManager.Verify(m => m.FindByNameAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task GetAuthenticatedUserAsync_NameClaimPresentButUnknownUser_ReturnsNull()
        {
            var userManager = MockUserManager.Create();
            userManager.Setup(m => m.FindByNameAsync("ghost")).ReturnsAsync((AppUser?)null);

            var principal = MakePrincipal(new Claim(ClaimTypes.Name, "ghost"));

            var result = await principal.GetAuthenticatedUserAsync(userManager.Object);

            Assert.Null(result);
        }
    }
}
