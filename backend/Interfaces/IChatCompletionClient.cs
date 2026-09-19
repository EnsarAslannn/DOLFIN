using api.Dtos.Chat;

namespace api.Interfaces;

public interface IChatCompletionClient
{
    bool IsConfigured { get; }

    Task<string?> CompleteAsync(
        string systemPrompt,
        IReadOnlyList<ChatTurnDto> history,
        string question,
        CancellationToken cancellationToken
    );
}
