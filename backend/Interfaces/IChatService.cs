using api.Dtos.Chat;

namespace api.Interfaces;

public interface IChatService
{
    Task<ChatResponseDto> AnswerAsync(
        ChatRequestDto request,
        CancellationToken cancellationToken
    );
}
