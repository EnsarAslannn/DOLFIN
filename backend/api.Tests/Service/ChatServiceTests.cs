using api.Dtos.Chat;
using api.Service;
using Microsoft.Extensions.Logging.Abstractions;

namespace api.Tests.Service;

public class ChatServiceTests
{
    [Fact]
    public async Task AnswerAsync_WithoutGatewayConfiguration_AnswersFromSiteKnowledge()
    {
        var service = CreateService(new ChatOptions());

        var response = await service.AnswerAsync(
            new ChatRequestDto { Message = "Fiyat alarmı nasıl kurulur?", Language = "tr" },
            CancellationToken.None
        );

        Assert.Contains("alarm", response.Answer, StringComparison.OrdinalIgnoreCase);
        Assert.NotEmpty(response.Sources);
        Assert.False(response.UsedAi);
    }

    [Fact]
    public async Task AnswerAsync_ForAnOutOfScopeQuestion_DoesNotInventAnAnswer()
    {
        var service = CreateService(new ChatOptions());

        var response = await service.AnswerAsync(
            new ChatRequestDto { Message = "Bana ay hakkında şiir yaz", Language = "tr" },
            CancellationToken.None
        );

        Assert.Contains("DOL-FIN", response.Answer);
        Assert.Empty(response.Sources);
    }

    private static ChatService CreateService(ChatOptions options) =>
        new(
            new SiteKnowledgeService(),
            new DisabledChatCompletionClient(),
            options,
            NullLogger<ChatService>.Instance
        );
}
