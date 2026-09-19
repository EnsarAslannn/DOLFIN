using api.Dtos.Chat;
using api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace api.Controllers;

[Route("api/chat")]
[ApiController]
[AllowAnonymous]
[Produces("application/json")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    /// <summary>
    /// Answers a question about DOL-FIN from the curated site knowledge base.
    /// </summary>
    /// <param name="request">The question, UI language, and optional recent conversation.</param>
    /// <param name="cancellationToken">Cancelled when the caller disconnects.</param>
    /// <response code="200">A grounded answer and the relevant in-app sources.</response>
    /// <response code="400">The question or language failed validation.</response>
    /// <response code="429">The caller has exceeded the chat request limit.</response>
    [HttpPost]
    [EnableRateLimiting("chat")]
    [ProducesResponseType(typeof(ChatResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Ask(
        [FromBody] ChatRequestDto request,
        CancellationToken cancellationToken
    ) => Ok(await _chatService.AnswerAsync(request, cancellationToken));
}
