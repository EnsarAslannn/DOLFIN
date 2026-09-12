using api.Dtos.Account;
using api.Extensions;
using api.Interfaces;
using api.Models;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace api.Controllers
{
    [Route("api/account")]
    [ApiController]
    [Produces("application/json")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly IAntiforgery _antiforgery;

        public AccountController(
            UserManager<AppUser> userManager,
            ITokenService tokenService,
            SignInManager<AppUser> signInManager,
            IAntiforgery antiforgery
        )
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _signInManager = signInManager;
            _antiforgery = antiforgery;
        }

        /// <summary>
        /// Signs a user in and issues the authentication cookie.
        /// </summary>
        /// <remarks>
        /// The JWT is returned in an httpOnly <c>access_token</c> cookie rather
        /// than in the response body, so it is never readable from JavaScript.
        /// Repeated failures lock the account for 15 minutes, and this endpoint
        /// is rate limited per client IP.
        /// </remarks>
        /// <param name="loginDto">The username and password to authenticate.</param>
        /// <response code="200">Authenticated; the auth cookie has been set.</response>
        /// <response code="400">The request body failed validation.</response>
        /// <response code="401">The credentials are invalid or the account is locked out.</response>
        /// <response code="429">Too many login attempts from this IP.</response>
        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        [ProducesResponseType(typeof(NewUserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var user = await _userManager.FindByNameAsync(loginDto.UserName);

            if (user == null)
                return Unauthorized(ApiErrors.InvalidCredentials());

            var result = await _signInManager.CheckPasswordSignInAsync(
                user,
                loginDto.Password,
                lockoutOnFailure: true
            );

            if (result.IsLockedOut)
                return Unauthorized(ApiErrors.LockedOut());

            if (!result.Succeeded)
                return Unauthorized(ApiErrors.InvalidCredentials());

            SetAuthCookie(await _tokenService.CreateToken(user));

            return Ok(
                new NewUserDto
                {
                    UserName = user.UserName ?? string.Empty,
                    Email = user.Email ?? string.Empty,
                    WalletBalance = user.WalletBalance
                }
            );
        }

        /// <summary>
        /// Registers a new user, assigns the User role and signs them in.
        /// </summary>
        /// <remarks>
        /// Passwords must be at least 12 characters and mix upper case, lower
        /// case, digits and symbols. New accounts start with a zero wallet
        /// balance. On success the auth cookie is set just as it is for login.
        /// </remarks>
        /// <param name="registerDto">The username, email and password to register.</param>
        /// <response code="200">The account was created and signed in.</response>
        /// <response code="400">Validation failed, or the username/email is already taken.</response>
        /// <response code="429">Too many registration attempts from this IP.</response>
        [HttpPost("register")]
        [EnableRateLimiting("auth")]
        [ProducesResponseType(typeof(NewUserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            var appUser = new AppUser
            {
                UserName = registerDto.Username!,
                Email = registerDto.Email!,
                WalletBalance = 0
            };

            var createdUser = await _userManager.CreateAsync(appUser, registerDto.Password!);

            if (!createdUser.Succeeded)
                return BadRequest(createdUser.Errors);

            var roleResult = await _userManager.AddToRoleAsync(appUser, "User");

            if (!roleResult.Succeeded)
                return BadRequest(roleResult.Errors);

            SetAuthCookie(await _tokenService.CreateToken(appUser));

            return Ok(
                new NewUserDto
                {
                    UserName = appUser.UserName ?? string.Empty,
                    Email = appUser.Email ?? string.Empty,
                    WalletBalance = appUser.WalletBalance
                }
            );
        }

        /// <summary>
        /// Signs the current user out and revokes their existing tokens.
        /// </summary>
        /// <remarks>
        /// Rotating the user's security stamp invalidates every token already
        /// issued to them, so logging out on one device also revokes the others
        /// rather than only clearing the local cookie.
        /// </remarks>
        /// <response code="200">Signed out; auth and CSRF cookies have been cleared.</response>
        /// <response code="401">No valid authentication cookie was supplied.</response>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Logout()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user != null)
            {
                await _userManager.UpdateSecurityStampAsync(user);
            }

            Response.Cookies.Delete("access_token");
            Response.Cookies.Delete("XSRF-TOKEN");
            Response.Cookies.Delete("af-token");
            return Ok();
        }

        private void SetAuthCookie(string token)
        {
            Response.Cookies.Append(
                "access_token",
                token,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddHours(4),
                }
            );

        }

        private void IssueCsrfCookie()
        {
            var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
            Response.Cookies.Append(
                "XSRF-TOKEN",
                tokens.RequestToken!,
                new CookieOptions
                {
                    HttpOnly = false,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                }
            );
        }

        /// <summary>
        /// Gets the signed-in user's profile and issues a fresh CSRF token.
        /// </summary>
        /// <remarks>
        /// This is also the endpoint that hands out the readable
        /// <c>XSRF-TOKEN</c> cookie, so a client must call it before making any
        /// state-changing request — those are rejected with 403 unless the
        /// token is echoed back in the <c>X-CSRF-TOKEN</c> header.
        /// </remarks>
        /// <response code="200">The current user's username, email and wallet balance.</response>
        /// <response code="401">No valid authentication cookie was supplied.</response>
        [HttpGet("profile")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetUserProfile()
        {
            IssueCsrfCookie();

            var user = await this.GetAuthenticatedUserAsync(_userManager);
            if (user == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            return Ok(new { user.WalletBalance, user.UserName, user.Email });
        }

        /// <summary>
        /// Reports whether the caller has a session, without failing when they do not.
        /// </summary>
        /// <remarks>
        /// Visitors are allowed to browse before signing up, so "nobody is
        /// signed in" is a normal answer rather than an error: this endpoint
        /// replies 204 where <c>GET /api/account/profile</c> raises the 401
        /// that would otherwise show up as a failed request in every guest's
        /// console and error tracking. A signed-in caller gets the same payload
        /// and the same fresh CSRF cookie as <c>profile</c>.
        /// </remarks>
        /// <response code="200">The current user's username, email and wallet balance.</response>
        /// <response code="204">No valid authentication cookie was supplied.</response>
        [HttpGet("session")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> GetSession()
        {
            if (User.Identity?.IsAuthenticated != true)
                return NoContent();

            var user = await this.GetAuthenticatedUserAsync(_userManager);
            if (user == null)
                return NoContent();

            // Only a real session is handed a CSRF token: the antiforgery token
            // is bound to the caller's identity, so one minted while anonymous
            // would be rejected on the first request made after signing in.
            IssueCsrfCookie();

            return Ok(new { user.WalletBalance, user.UserName, user.Email });
        }
    }
}