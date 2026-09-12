using System.Security.Claims;
using api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Extensions
{
    public static class ClaimsExtensions
    {
        private const string AuthenticatedUserItemKey = "api.AuthenticatedUser";

        /// <summary>
        /// Remembers the user loaded while the token was being validated.
        ///
        /// Every authenticated request used to load the same AppUser row
        /// twice: once in OnTokenValidated, to compare the security stamp, and
        /// again in whichever controller action was about to run. The first
        /// lookup already has the row, and it happens in the same request
        /// scope, so it is the same tracked entity the second one would have
        /// returned — including for the wallet writes, which mutate it.
        /// </summary>
        public static void StoreAuthenticatedUser(this HttpContext context, AppUser user) =>
            context.Items[AuthenticatedUserItemKey] = user;

        /// <summary>
        /// The signed-in user, from the request if it is already there and
        /// from the database otherwise.
        /// </summary>
        public static Task<AppUser?> GetAuthenticatedUserAsync(
            this ControllerBase controller,
            UserManager<AppUser> userManager
        )
        {
            if (
                controller.HttpContext.Items.TryGetValue(AuthenticatedUserItemKey, out var stored)
                && stored is AppUser user
            )
            {
                return Task.FromResult<AppUser?>(user);
            }

            return controller.User.GetAuthenticatedUserAsync(userManager);
        }

        /// <summary>
        /// The signed-in user, read from the claims alone.
        ///
        /// The id is tried first. A username is a field a user could later be
        /// allowed to change, and resolving an identity by it would then
        /// depend on a claim that had quietly gone stale; the id never moves.
        /// The name claims remain as a fallback for a token that carries no id.
        /// </summary>
        public static async Task<AppUser?> GetAuthenticatedUserAsync(
            this ClaimsPrincipal user,
            UserManager<AppUser> userManager
        )
        {
            var userId =
                user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value
                ?? user.FindFirst(
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
                )?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                return await userManager.FindByIdAsync(userId);
            }

            var username =
                user.Identity?.Name
                ?? user.FindFirst(ClaimTypes.Name)?.Value
                ?? user.FindFirst("name")?.Value
                ?? user.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")
                    ?.Value;

            if (!string.IsNullOrEmpty(username))
            {
                return await userManager.FindByNameAsync(username);
            }

            return null;
        }
    }
}
