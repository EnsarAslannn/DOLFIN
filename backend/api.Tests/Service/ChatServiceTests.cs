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
        Assert.NotEmpty(response.Suggestions);
        Assert.All(response.Suggestions, suggestion => Assert.False(string.IsNullOrWhiteSpace(suggestion)));
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

    [Fact]
    public async Task AnswerAsync_ForAnAmbiguousFollowUp_UsesRecentConversationForRetrieval()
    {
        var service = CreateService(new ChatOptions());
        var request = new ChatRequestDto
        {
            Message = "Peki bunu nereden yaparım?",
            Language = "tr",
            History =
            [
                new ChatTurnDto
                {
                    Role = "user",
                    Content = "AAPL için bir fiyat alarmı kurmak istiyorum.",
                },
                new ChatTurnDto
                {
                    Role = "assistant",
                    Content = "Fiyat alarmı oluşturma konusunda yardımcı olabilirim.",
                },
            ],
        };

        var response = await service.AnswerAsync(request, CancellationToken.None);

        Assert.Contains("alarm", response.Answer, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(response.Sources, source => source.Title.Contains("alarm", StringComparison.OrdinalIgnoreCase));
    }

    private static ChatService CreateService(ChatOptions options) =>
        new(
            new SiteKnowledgeService(),
            new DisabledChatCompletionClient(),
            options,
            NullLogger<ChatService>.Instance
        );
}
