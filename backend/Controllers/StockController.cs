using api.Dtos.Stock;
using api.Helpers;
using api.Interfaces;
using api.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/stock")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public class StockController : ControllerBase
    {
        private readonly IStockRepository _stockRepo;

        public StockController(IStockRepository stockRepo)
        {
            _stockRepo = stockRepo;
        }

        /// <summary>
        /// Lists the stock catalog with optional filtering, sorting and paging.
        /// </summary>
        /// <remarks>
        /// Results are served from the Redis-backed cache when available and
        /// fall back to a direct database read if the cache is unreachable.
        /// Open to anonymous callers so a visitor can browse the catalog
        /// before signing up.
        /// </remarks>
        /// <param name="query">Filter (symbol, company name), sort and paging options.</param>
        /// <response code="200">The matching page of stocks.</response>
        /// <response code="400">The query parameters failed validation.</response>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(List<StockDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetAll([FromQuery] QueryObject query)
        {
            var stocks = await _stockRepo.GetAllAsync(query);
            var stockDto = stocks.Select(s => s.ToStockDto()).ToList();

            return Ok(stockDto);
        }

        /// <summary>
        /// Gets a single stock by its numeric id. Open to anonymous callers.
        /// </summary>
        /// <param name="id">The stock's database id.</param>
        /// <response code="200">The requested stock.</response>
        /// <response code="404">No stock exists with that id.</response>
        [HttpGet("{id:int}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(StockDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var stock = await _stockRepo.GetByIdAsync(id);

            if (stock == null)
            {
                return NotFound();
            }

            return Ok(stock.ToStockDto());
        }

        /// <summary>
        /// Creates a new stock in the catalog. Admin only.
        /// </summary>
        /// <remarks>
        /// Symbols are unique and compared case-insensitively, so creating
        /// "aapl" when "AAPL" already exists is rejected as a conflict.
        /// </remarks>
        /// <param name="stockDto">The stock to create.</param>
        /// <response code="201">The stock was created; the response body is the new stock.</response>
        /// <response code="400">The request body failed validation.</response>
        /// <response code="403">The caller is authenticated but not an Admin.</response>
        /// <response code="409">A stock with that symbol already exists.</response>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(StockDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create([FromBody] CreateStockRequestDto stockDto)
        {
            if (await _stockRepo.GetBySymbolAsync(stockDto.Symbol) != null)
            {
                return Conflict($"A stock with symbol '{stockDto.Symbol.Trim().ToUpperInvariant()}' already exists.");
            }

            var stockModel = stockDto.ToStockFromCreateDto();
            await _stockRepo.CreateAsync(stockModel);

            return CreatedAtAction(
                nameof(GetById),
                new { id = stockModel.Id },
                stockModel.ToStockDto()
            );
        }

        /// <summary>
        /// Updates an existing stock. Admin only.
        /// </summary>
        /// <param name="id">The id of the stock to update.</param>
        /// <param name="updateDto">The new values for the stock.</param>
        /// <response code="200">The updated stock.</response>
        /// <response code="400">The request body failed validation.</response>
        /// <response code="403">The caller is authenticated but not an Admin.</response>
        /// <response code="404">No stock exists with that id.</response>
        /// <response code="409">Another stock already uses the requested symbol.</response>
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(StockDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(
            [FromRoute] int id,
            [FromBody] UpdateStockRequestDto updateDto
        )
        {
            var conflicting = await _stockRepo.GetBySymbolAsync(updateDto.Symbol);
            if (conflicting != null && conflicting.Id != id)
            {
                return Conflict($"A stock with symbol '{updateDto.Symbol.Trim().ToUpperInvariant()}' already exists.");
            }

            var stockModel = await _stockRepo.UpdateAsync(id, updateDto);

            if (stockModel == null)
            {
                return NotFound();
            }

            return Ok(stockModel.ToStockDto());
        }

        /// <summary>
        /// Deletes a stock from the catalog. Admin only.
        /// </summary>
        /// <param name="id">The id of the stock to delete.</param>
        /// <response code="204">The stock was deleted.</response>
        /// <response code="403">The caller is authenticated but not an Admin.</response>
        /// <response code="404">No stock exists with that id.</response>
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var stockModel = await _stockRepo.DeleteAsync(id);

            if (stockModel == null)
            {
                return NotFound();
            }

            return NoContent();
        }

        /// <summary>
        /// Gets the stocks shown in the market trends ticker. Open to
        /// anonymous callers.
        /// </summary>
        /// <response code="200">The trending stocks.</response>
        /// <response code="404">The stock catalog has not been seeded yet.</response>
        [HttpGet("trends")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(List<api.Models.Stock>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMarketTrends()
        {
            var stocks = await _stockRepo.GetMarketTrendsAsync();

            if (stocks == null || !stocks.Any())
            {
                return NotFound("Trend stocks not found in database.");
            }

            return Ok(stocks);
        }
    }
}
