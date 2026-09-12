using api.Dtos.Stock;
using api.Extensions;
using api.Interfaces;
using api.Mappers;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace api.Controllers
{
    [Route("api/watchlist")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public class WatchlistController : ControllerBase
    {
        private readonly IWatchlistRepository _watchlistRepo;
        private readonly IStockRepository _stockRepo;
        private readonly UserManager<AppUser> _userManager;

        public WatchlistController(
            IWatchlistRepository watchlistRepo,
            IStockRepository stockRepo,
            UserManager<AppUser> userManager
        )
        {
            _watchlistRepo = watchlistRepo;
            _stockRepo = stockRepo;
            _userManager = userManager;
        }

        /// <summary>
        /// Lists the stocks the signed-in user is following, newest first.
        /// </summary>
        /// <remarks>
        /// Following a stock says nothing about owning it and costs nothing —
        /// unlike a price alert, which needs a level and a direction decided
        /// up front. This is the list for a company you are still forming an
        /// opinion about.
        /// </remarks>
        /// <response code="200">The user's watchlist, with each stock's current price.</response>
        [HttpGet]
        [ProducesResponseType(typeof(List<WatchlistItemDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetWatchlist()
        {
            var appUser = await this.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var entries = await _watchlistRepo.GetForUserAsync(appUser.Id);
            return Ok(entries.Select(e => e.ToWatchlistItemDto()));
        }

        /// <summary>
        /// Adds a stock to the signed-in user's watchlist.
        /// </summary>
        /// <remarks>
        /// Following a stock that is already followed is not an error: the
        /// button that calls this is a toggle, and a double click or a stale
        /// tab should leave the list in the state the user asked for rather
        /// than raise something for them to read.
        /// </remarks>
        /// <param name="request">The stock to follow.</param>
        /// <response code="200">The stock is on the watchlist.</response>
        /// <response code="400">No stock exists with that id.</response>
        [HttpPost]
        [EnableRateLimiting("write")]
        [ProducesResponseType(typeof(WatchlistItemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Dtos.ApiErrorDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Add([FromBody] AddWatchlistRequestDto request)
        {
            var appUser = await this.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var stock = await _stockRepo.GetByIdAsync(request.StockId);
            if (stock == null)
                return BadRequest(ApiErrors.StockNotFound());

            var existing = await _watchlistRepo.GetAsync(appUser.Id, request.StockId);
            if (existing != null)
            {
                return Ok(existing.ToWatchlistItemDto());
            }

            var created = await _watchlistRepo.AddAsync(
                new WatchlistEntry { AppUserId = appUser.Id, StockId = request.StockId }
            );
            created.Stock = stock;

            return Ok(created.ToWatchlistItemDto());
        }

        /// <summary>
        /// Removes a stock from the signed-in user's watchlist.
        /// </summary>
        /// <remarks>
        /// Unfollowing something that is not followed is not an error either,
        /// for the same reason as adding: this is the other half of a toggle.
        /// </remarks>
        /// <param name="stockId">The stock to stop following.</param>
        /// <response code="204">The stock is not on the watchlist.</response>
        [HttpDelete("{stockId:int}")]
        [EnableRateLimiting("write")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Remove([FromRoute] int stockId)
        {
            var appUser = await this.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var entry = await _watchlistRepo.GetAsync(appUser.Id, stockId);
            if (entry != null)
            {
                await _watchlistRepo.RemoveAsync(entry);
            }

            return NoContent();
        }
    }
}
