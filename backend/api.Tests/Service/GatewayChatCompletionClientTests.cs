using System.Net;
using System.Text;
using api.Dtos.Chat;
using api.Service;

namespace api.Tests.Service;

public class GatewayChatCompletionClientTests
{
    [Fact]
    public async Task CompleteAsync_SendsGroundedPromptAndReturnsAssistantText()
    {
        string? requestBody = null;
        string? authorization = null;
        var handler = new RecordingHandler(request =>
        {
            requestBody = request.Content!.ReadAsStringAsync().GetAwaiter().GetResult();
            authorization = request.Headers.Authorization?.ToString();
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """{"choices":[{"message":{"content":"Use the Wallet page."}}]}""",
                    Encoding.UTF8,
                    "application/json"
                ),
            };
        });
        var client = new GatewayChatCompletionClient(
            new HttpClient(handler),
            new ChatOptions
            {
                Enabled = true,
                ApiKey = "gateway-key",
                Endpoint = "https://example.test/v1/chat/completions",
                Model = "openai/gpt-5.4-mini",
            }
        );

        var result = await client.CompleteAsync(
            "Answer only from this context: wallet guidance",
            [new ChatTurnDto { Role = "assistant", Content = "Welcome" }],
            "Where is my wallet?",
            CancellationToken.None
        );

        Assert.Equal("Use the Wallet page.", result);
        Assert.Equal("Bearer gateway-key", authorization);
        Assert.Contains("wallet guidance", requestBody);
        Assert.Contains("Where is my wallet?", requestBody);
    }

    private sealed class RecordingHandler(
        Func<HttpRequestMessage, HttpResponseMessage> responseFactory
    ) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken
        ) => Task.FromResult(responseFactory(request));
    }
}
