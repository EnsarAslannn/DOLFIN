using api.Service;
using Microsoft.Extensions.Configuration;

namespace api.Tests.Service;

public class ChatOptionsTests
{
    [Fact]
    public void FromConfiguration_ReadsGatewaySettings()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Chat:Enabled"] = "true",
                ["Chat:ApiKey"] = "secret",
                ["Chat:Model"] = "openai/gpt-5.4-mini",
                ["Chat:Endpoint"] = "https://example.test/v1/chat/completions",
            })
            .Build();

        var options = ChatOptions.FromConfiguration(configuration);

        Assert.True(options.Enabled);
        Assert.Equal("secret", options.ApiKey);
        Assert.Equal("openai/gpt-5.4-mini", options.Model);
        Assert.Equal("https://example.test/v1/chat/completions", options.Endpoint);
    }

    [Fact]
    public void FromConfiguration_WithoutAKey_LeavesAiDisabled()
    {
        var options = ChatOptions.FromConfiguration(new ConfigurationBuilder().Build());

        Assert.False(options.Enabled);
        Assert.Equal("openai/gpt-5.4-mini", options.Model);
    }
}
