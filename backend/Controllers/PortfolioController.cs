using api.Dtos;
using api.Dtos.Portfolio;
using api.Extensions;
using api.Helpers;
using api.Interfaces;
using api.Service;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/portfolio")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public class PortfolioController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IPortfolioService _portfolioService;
        private readonly IPortfolioAnalyticsService _analyticsService;
        private readonly IRebalancingService _rebalancingService;

        public PortfolioController(
            UserManager<AppUser> userManager,
            IPortfolioService portfolioService,
            IPortfolioAnalyticsService analyticsService,
            IRebalancingService rebalancingService
        )
        {
            _userManager = userManager;
            _portfolioService = portfolioService;
            _analyticsService = analyticsService;
            _rebalancingService = rebalancingService;
        }

        /// <summary>
        /// Gets the signed-in user's current stock positions.
        /// </summary>
        /// <response code="200">The user's positions, one entry per held stock.</response>
        [HttpGet]
        [ProducesResponseType(typeof(List<PortfolioDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUserPortfolio()
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var userPortfolio = await _portfolioService.GetUserPortfolioAsync(appUser);
            return Ok(userPortfolio);
        }

        /// <summary>
        /// Gets aggregate performance metrics for the user's portfolio.
        /// </summary>
        /// <remarks>
        /// Covers total invested cost, current market value, absolute and
        /// percentage profit/loss, and the per-position allocation breakdown.
        /// </remarks>
        /// <response code="200">The calculated portfolio metrics.</response>
        [HttpGet("metrics")]
        [ProducesResponseType(typeof(PortfolioMetricsDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMetrics()
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var metrics = await _analyticsService.GetMetricsAsync(appUser);
            return Ok(metrics);
        }

        /// <summary>
        /// Lists concentration warnings for the user's current allocation.
        /// </summary>
        /// <remarks>
        /// Each warning is a human-readable message flagging a position that
        /// takes up an outsized share of the portfolio.
        /// </remarks>
        /// <response code="200">The warnings, or an empty list if the allocation looks healthy.</response>
        [HttpGet("warnings")]
        [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllocationWarnings()
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var warnings = await _analyticsService.GetAllocationWarningsAsync(appUser);
            return Ok(warnings);
        }

        /// <summary>
        /// Suggests the buys and sells that would rebalance the portfolio.
        /// </summary>
        /// <remarks>
        /// This only returns a recommendation — nothing is bought or sold. Use
        /// the trade endpoints to act on it.
        /// </remarks>
        /// <response code="200">The suggested per-symbol adjustments.</response>
        [HttpGet("rebalance")]
        [ProducesResponseType(typeof(RebalancingRecommendationDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRebalancingRecommendation()
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var recommendation = await _rebalancingService.GetRecommendationAsync(appUser);
            return Ok(recommendation);
        }

        /// <summary>
        /// Lists the signed-in user's trade and cash-movement history, newest first.
        /// </summary>
        /// <remarks>
        /// Covers buys, sells, deposits and withdrawals. Cash movements are
        /// recorded against the pseudo-symbol CASH with a quantity of 1, so
        /// TotalAmount carries the amount for every row regardless of type.
        /// </remarks>
        /// <param name="query">Paging parameters (PageNumber, PageSize).</param>
        /// <response code="200">The requested page of history, newest first.</response>
        /// <response code="400">The paging parameters failed validation.</response>
        [HttpGet("transactions")]
        [ProducesResponseType(typeof(List<TransactionDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetTransactionHistory([FromQuery] TransactionQueryObject query)
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var transactions = await _portfolioService.GetTransactionHistoryAsync(appUser, query);
            return Ok(transactions);
        }

        /// <summary>
        /// Buys a quantity of a stock using the user's wallet balance.
        /// </summary>
        /// <remarks>
        /// The wallet debit and the position update are committed in a single
        /// unit of work, so a failure part-way through leaves neither applied.
        /// </remarks>
        /// <param name="request">The stock symbol and quantity to buy.</param>
        /// <response code="200">The trade succeeded; the response carries the updated position.</response>
        /// <response code="400">Unknown symbol, non-positive quantity, or insufficient funds.</response>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AddPortfolio([FromBody] TradeRequestDto request)
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            try
            {
                var result = await _portfolioService.BuyStockAsync(appUser, request.Symbol, request.Quantity);
                return Ok(result);
            }
            catch (DomainException ex)
            {
                return BadRequest(ex.ToApiError());
            }
        }

        /// <summary>
        /// Sells a quantity of a stock the user holds and credits the proceeds.
        /// </summary>
        /// <param name="request">The stock symbol and quantity to sell.</param>
        /// <response code="200">The trade succeeded; the response carries the updated position.</response>
        /// <response code="400">Unknown symbol, non-positive quantity, or more shares requested than held.</response>
        [HttpPost("sell")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SellPortfolio([FromBody] TradeRequestDto request)
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            try
            {
                var result = await _portfolioService.SellStockAsync(appUser, request.Symbol, request.Quantity);
                return Ok(result);
            }
            catch (DomainException ex)
            {
                return BadRequest(ex.ToApiError());
            }
        }

        /// <summary>
        /// Adds simulated funds to the user's virtual wallet.
        /// </summary>
        /// <param name="request">The amount to deposit.</param>
        /// <response code="200">The deposit was applied; the response carries the new balance.</response>
        /// <response code="400">The amount is not a positive value.</response>
        [HttpPost("deposit")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DepositFunds([FromBody] AmountRequestDto request)
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            try
            {
                var result = await _portfolioService.DepositFundsAsync(appUser, request.Amount);
                return Ok(result);
            }
            catch (DomainException ex)
            {
                return BadRequest(ex.ToApiError());
            }
        }

        /// <summary>
        /// Withdraws simulated funds from the user's virtual wallet.
        /// </summary>
        /// <param name="request">The amount to withdraw.</param>
        /// <response code="200">The withdrawal was applied; the response carries the new balance.</response>
        /// <response code="400">The amount is not positive, or exceeds the available balance.</response>
        [HttpPost("withdraw")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> WithdrawFunds([FromBody] AmountRequestDto request)
        {
            var appUser = await User.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            try
            {
                var result = await _portfolioService.WithdrawFundsAsync(appUser, request.Amount);
                return Ok(result);
            }
            catch (DomainException ex)
            {
                return BadRequest(ex.ToApiError());
            }
        }
    }
}
