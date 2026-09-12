using api.Dtos.Comment;
using api.Extensions;
using api.Helpers;
using api.Interfaces;
using api.Mappers;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace api.Controllers
{
    [Route("api/comment")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    public class CommentController : ControllerBase
    {
        private readonly ICommentRepository _commentRepo;
        private readonly IStockRepository _stockRepo;
        private readonly IStockCacheInvalidator _stockCacheInvalidator;
        private readonly UserManager<AppUser> _userManager;

        public CommentController(
            ICommentRepository commentRepo,
            IStockRepository stockRepo,
            IStockCacheInvalidator stockCacheInvalidator,
            UserManager<AppUser> userManager
        )
        {
            _commentRepo = commentRepo;
            _stockRepo = stockRepo;
            _stockCacheInvalidator = stockCacheInvalidator;
            _userManager = userManager;
        }

        /// <summary>
        /// Lists comments, optionally filtered by stock symbol and sorted.
        /// Open to anonymous callers so a visitor can read the discussion
        /// before signing up; posting still requires an account.
        /// </summary>
        /// <param name="queryObject">Symbol filter and sort options.</param>
        /// <response code="200">The matching comments.</response>
        /// <response code="400">The query parameters failed validation.</response>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<CommentDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetAll([FromQuery] CommentQueryObject queryObject)
        {
            var comments = await _commentRepo.GetAllAsync(queryObject);
            var commentDto = comments.Select(s => s.ToCommentDto());

            return Ok(commentDto);
        }

        /// <summary>
        /// Gets a single comment by id. Open to anonymous callers.
        /// </summary>
        /// <param name="id">The comment's id.</param>
        /// <response code="200">The requested comment.</response>
        /// <response code="404">No comment exists with that id.</response>
        [HttpGet("{id:int}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(CommentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var comment = await _commentRepo.GetByIdAsync(id);

            if (comment == null)
            {
                return NotFound();
            }

            return Ok(comment.ToCommentDto());
        }

        /// <summary>
        /// Posts a comment on a stock, authored by the signed-in user.
        /// </summary>
        /// <remarks>
        /// Creating a comment invalidates that stock's cache entry so the new
        /// comment shows up immediately rather than after the TTL expires.
        /// </remarks>
        /// <param name="stockId">The id of the stock being commented on.</param>
        /// <param name="commentDto">The comment title and body.</param>
        /// <response code="201">The comment was created.</response>
        /// <response code="400">No stock exists with that id, or the body failed validation.</response>
        [HttpPost("{stockId:int}")]
        [EnableRateLimiting("write")]
        [ProducesResponseType(typeof(CommentDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Create(
            [FromRoute] int stockId,
            [FromBody] CreateCommentDto commentDto
        )
        {
            if (!await _stockRepo.StockExists(stockId))
            {
                return BadRequest(ApiErrors.CommentStockNotFound());
            }

            var appUser = await this.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var commentModel = commentDto.ToCommentFromCreate(stockId, appUser.Id);
            await _commentRepo.CreateAsync(commentModel);
            await _stockCacheInvalidator.InvalidateStockAsync(stockId);

            return CreatedAtAction(
                nameof(GetById),
                new { id = commentModel.Id },
                commentModel.ToCommentDto()
            );
        }

        /// <summary>
        /// Edits a comment. Only its author may do so.
        /// </summary>
        /// <param name="id">The id of the comment to edit.</param>
        /// <param name="updateDto">The new title and body.</param>
        /// <response code="200">The updated comment.</response>
        /// <response code="400">The request body failed validation.</response>
        /// <response code="403">The comment belongs to a different user.</response>
        /// <response code="404">No comment exists with that id.</response>
        [HttpPut("{id:int}")]
        [EnableRateLimiting("write")]
        [ProducesResponseType(typeof(CommentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(
            [FromRoute] int id,
            [FromBody] UpdateCommentRequestDto updateDto
        )
        {
            var appUser = await this.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var existingComment = await _commentRepo.GetByIdAsync(id);
            if (existingComment == null)
            {
                return NotFound(ApiErrors.CommentNotFound());
            }
            if (existingComment.AppUserId != appUser.Id)
            {
                return Forbid();
            }

            var comment = await _commentRepo.UpdateAsync(
                id,
                updateDto.ToCommentFromUpdate(appUser.Id)
            );

            if (comment == null)
            {
                return NotFound(ApiErrors.CommentNotFound());
            }

            if (existingComment.StockId.HasValue)
            {
                await _stockCacheInvalidator.InvalidateStockAsync(existingComment.StockId.Value);
            }

            return Ok(comment.ToCommentDto());
        }

        /// <summary>
        /// Deletes a comment. Only its author may do so.
        /// </summary>
        /// <param name="id">The id of the comment to delete.</param>
        /// <response code="200">The deleted comment.</response>
        /// <response code="403">The comment belongs to a different user.</response>
        /// <response code="404">No comment exists with that id.</response>
        [HttpDelete("{id:int}")]
        [EnableRateLimiting("write")]
        [ProducesResponseType(typeof(CommentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var appUser = await this.GetAuthenticatedUserAsync(_userManager);
            if (appUser == null)
                return Unauthorized(ApiErrors.UserContextNotFound());

            var existingComment = await _commentRepo.GetByIdAsync(id);
            if (existingComment == null)
            {
                return NotFound(ApiErrors.CommentNotFound());
            }
            if (existingComment.AppUserId != appUser.Id)
            {
                return Forbid();
            }

            var commentModel = await _commentRepo.DeleteAsync(id);

            if (commentModel == null)
            {
                return NotFound(ApiErrors.CommentNotFound());
            }

            if (existingComment.StockId.HasValue)
            {
                await _stockCacheInvalidator.InvalidateStockAsync(existingComment.StockId.Value);
            }

            // The entity itself used to go out here, which put the author's
            // internal user id on the wire and made this the one action that
            // did not answer in the shape the rest of the controller does.
            // DeleteAsync does not load the author, so the name is taken from
            // the copy fetched for the ownership check above.
            commentModel.AppUser = existingComment.AppUser;
            return Ok(commentModel.ToCommentDto());
        }
    }
}
