using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using api.Dtos.Chat;
using api.Interfaces;

namespace api.Service;

public class GatewayChatCompletionClient : IChatCompletionClient
{
    private readonly HttpClient _httpClient;
    private readonly ChatOptions _options;

    public GatewayChatCompletionClient(HttpClient httpClient, ChatOptions options)
    {
        _httpClient = httpClient;
        _options = options;
    }

    public bool IsConfigured => _options.Enabled && !string.IsNullOrWhiteSpace(_options.ApiKey);

    public async Task<string?> CompleteAsync(
        string systemPrompt,
        IReadOnlyList<ChatTurnDto> history,
        string question,
        CancellationToken cancellationToken
    )
    {
        if (!IsConfigured)
            return null;

        var messages = new List<object> { new { role = "system", content = systemPrompt } };
        messages.AddRange(
            history.TakeLast(8).Select(turn => (object)new
            {
                role = turn.Role == "assistant" ? "assistant" : "user",
                content = turn.Content,
            })
        );
        messages.Add(new { role = "user", content = question });

        using var request = new HttpRequestMessage(HttpMethod.Post, _options.Endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        request.Content = JsonContent.Create(new
        {
            model = _options.Model,
            messages,
            stream = false,
            max_tokens = 450,
        });

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var document = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken
        );
        return document.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();
    }
}

public sealed class DisabledChatCompletionClient : IChatCompletionClient
{
    public bool IsConfigured => false;

    public Task<string?> CompleteAsync(
        string systemPrompt,
        IReadOnlyList<ChatTurnDto> history,
        string question,
        CancellationToken cancellationToken
    ) => Task.FromResult<string?>(null);
}
