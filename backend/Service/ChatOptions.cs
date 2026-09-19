namespace api.Service;

public sealed class ChatOptions
{
    public bool Enabled { get; init; }

    public string ApiKey { get; init; } = string.Empty;

    public string Endpoint { get; init; } = "https://ai-gateway.vercel.sh/v1/chat/completions";

    public string Model { get; init; } = "openai/gpt-5.4-mini";

    public static ChatOptions FromConfiguration(IConfiguration configuration)
    {
        var apiKey = configuration["Chat:ApiKey"] ?? string.Empty;
        return new ChatOptions
        {
            Enabled = configuration.GetValue<bool?>("Chat:Enabled") ?? !string.IsNullOrWhiteSpace(apiKey),
            ApiKey = apiKey,
            Endpoint = configuration["Chat:Endpoint"]
                ?? "https://ai-gateway.vercel.sh/v1/chat/completions",
            Model = configuration["Chat:Model"] ?? "openai/gpt-5.4-mini",
        };
    }
}
