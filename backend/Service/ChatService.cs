using api.Dtos.Chat;
using api.Interfaces;

namespace api.Service;

public class ChatService : IChatService
{
    private readonly ISiteKnowledgeService _knowledge;
    private readonly IChatCompletionClient _completionClient;
    private readonly ChatOptions _options;
    private readonly ILogger<ChatService> _logger;

    public ChatService(
        ISiteKnowledgeService knowledge,
        IChatCompletionClient completionClient,
        ChatOptions options,
        ILogger<ChatService> logger
    )
    {
        _knowledge = knowledge;
        _completionClient = completionClient;
        _options = options;
        _logger = logger;
    }

    public async Task<ChatResponseDto> AnswerAsync(
        ChatRequestDto request,
        CancellationToken cancellationToken
    )
    {
        var language = request.Language == "en" ? "en" : "tr";
        var matches = _knowledge.FindRelevant(request.Message, language, 3);
        if (matches.Count == 0 && request.History.Count > 0)
        {
            var contextualQuery = string.Join(
                '\n',
                request.History
                    .TakeLast(4)
                    .Select(turn => turn.Content)
                    .Append(request.Message)
            );
            matches = _knowledge.FindRelevant(contextualQuery, language, 3);
        }

        var pageContext = BuildPageContext(request, language);
        if (matches.Count == 0 && !string.IsNullOrWhiteSpace(pageContext))
        {
            matches = _knowledge.FindRelevant(pageContext, language, 3);
        }

        if (matches.Count == 0)
        {
            return new ChatResponseDto
            {
                Answer = language == "en"
                    ? "I can help with DOL-FIN features, simulated stocks, wallets, portfolios, and price alerts. I could not find a reliable DOL-FIN answer for that question."
                    : "DOL-FIN özellikleri, simülasyon hisseleri, cüzdan, portföy ve fiyat alarmları hakkında yardımcı olabilirim. Bu soru için güvenilir bir DOL-FIN yanıtı bulamadım.",
            };
        }

        var sources = matches
            .Select(item => new ChatSourceDto { Title = item.Title, Path = item.Path })
            .DistinctBy(source => source.Path)
            .ToList();
        var suggestions = matches
            .SelectMany(item => item.Suggestions ?? [])
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .ToList();

        if (_options.Enabled && _completionClient.IsConfigured)
        {
            try
            {
                var context = string.Join(
                    "\n\n",
                    matches.Select(item => $"[{item.Title}]\n{item.Content}\nPath: {item.Path}")
                );
                var systemPrompt = language == "en"
                    ? $"""You are DOL-FIN's concise product assistant. Answer only from the supplied context. Never present simulated data as live market data or give investment advice. If the context is insufficient, say so. Reply in English.\n\nCURRENT PAGE\n{pageContext}\n\nCONTEXT\n{context}"""
                    : $"""DOL-FIN'in kısa ve açık ürün yardımcısısın. Yalnızca verilen bağlamdan cevap ver. Simülasyon verilerini asla canlı piyasa verisi gibi sunma ve yatırım tavsiyesi verme. Bağlam yetersizse bunu söyle. Türkçe cevap ver.\n\nMEVCUT SAYFA\n{pageContext}\n\nBAĞLAM\n{context}""";
                var answer = await _completionClient.CompleteAsync(
                    systemPrompt,
                    request.History,
                    request.Message,
                    cancellationToken
                );

                if (!string.IsNullOrWhiteSpace(answer))
                {
                    return new ChatResponseDto
                    {
                        Answer = answer.Trim(),
                        Sources = sources,
                        UsedAi = true,
                        Suggestions = suggestions,
                    };
                }
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                _logger.LogWarning(exception, "AI chat completion failed; using grounded fallback");
            }
        }

        return new ChatResponseDto
        {
            Answer = matches[0].Content,
            Sources = sources,
            UsedAi = false,
            Suggestions = suggestions,
        };
    }

    private static string BuildPageContext(ChatRequestDto request, string language)
    {
        var path = request.CurrentPath?.ToLowerInvariant() ?? string.Empty;
        if (path.StartsWith("/wallet", StringComparison.Ordinal))
        {
            return language == "en" ? "portfolio wallet" : "portfoy cuzdan";
        }

        if (path.StartsWith("/search", StringComparison.Ordinal))
        {
            return language == "en" ? "company stock search" : "sirket hisse";
        }

        if (path.StartsWith("/company/", StringComparison.Ordinal))
        {
            var symbol = request.CurrentSymbol?.ToUpperInvariant() ?? string.Empty;
            return language == "en"
                ? $"{symbol} company financial statements"
                : $"{symbol} sirket finansal tablo";
        }

        return path == "/" ? "DOL-FIN platform" : string.Empty;
    }
}
