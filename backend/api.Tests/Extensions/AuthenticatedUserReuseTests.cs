using System.Security.Claims;
using api.Extensions;
using api.Models;
using api.Tests.TestHelpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace api.Tests.Extensions
{
    /// <summary>
    /// Every authenticated request used to load the same AppUser row twice:
    /// once in OnTokenValidated to compare the security stamp, and again in
    /// whichever action was about to run.
    /// </summary>
    public class AuthenticatedUserReuseTests
    {
        private sealed class ProbeController : ControllerBase { }

        private static ProbeController MakeController(params Claim[] claims)
        {
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

            return new ProbeController
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = principal },
                },
            };
        }

        [Fact]
        public async Task ReusesTheUserStoredDuringTokenValidation()
        {
            var user = new AppUser { Id = "u1", UserName = "trader" };
            var userManager = MockUserManager.Create();

            var controller = MakeController(new Claim(ClaimTypes.NameIdentifier, "u1"));
            controller.HttpContext.StoreAuthenticatedUser(user);

            var result = await controller.GetAuthenticatedUserAsync(userManager.Object);

            Assert.Same(user, result);
            userManager.Verify(m => m.FindByIdAsync(It.IsAny<string>()), Times.Never);
            userManager.Verify(m => m.FindByNameAsync(It.IsAny<string>()), Times.Never);
        }

        // Nothing is stored for a request that never presented a token, and
        // the anonymous endpoints still have to work.
        [Fact]
        public async Task FallsBackToTheDatabaseWhenNothingWasStored()
        {
            var user = new AppUser { Id = "u1", UserName = "trader" };
            var userManager = MockUserManager.Create();
            userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);

            var controller = MakeController(new Claim(ClaimTypes.NameIdentifier, "u1"));

            var result = await controller.GetAuthenticatedUserAsync(userManager.Object);

            Assert.Same(user, result);
            userManager.Verify(m => m.FindByIdAsync("u1"), Times.Once);
        }

        [Fact]
        public async Task ReturnsNullForARequestWithNoIdentityAtAll()
        {
            var userManager = MockUserManager.Create();
            var controller = MakeController();

            Assert.Null(await controller.GetAuthenticatedUserAsync(userManager.Object));
        }

        // The stash lives in HttpContext.Items, which is per-request, so one
        // request cannot hand its user to the next.
        [Fact]
        public async Task DoesNotLeakTheUserIntoAnotherRequest()
        {
            var user = new AppUser { Id = "u1", UserName = "trader" };
            var userManager = MockUserManager.Create();
            userManager.Setup(m => m.FindByIdAsync("u2")).ReturnsAsync((AppUser?)null);

            var first = MakeController(new Claim(ClaimTypes.NameIdentifier, "u1"));
            first.HttpContext.StoreAuthenticatedUser(user);
            await first.GetAuthenticatedUserAsync(userManager.Object);

            var second = MakeController(new Claim(ClaimTypes.NameIdentifier, "u2"));

            Assert.Null(await second.GetAuthenticatedUserAsync(userManager.Object));
        }
    }
}
