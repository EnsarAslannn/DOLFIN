using api.Service;

namespace api.Tests.Service;

public class SiteKnowledgeServiceTests
{
    private readonly SiteKnowledgeService _service = new();

    [Fact]
    public void FindRelevant_ForAPortfolioQuestion_ReturnsPortfolioGuidance()
    {
        var matches = _service.FindRelevant("Portföyümü nasıl oluştururum?", "tr", 3);

        Assert.NotEmpty(matches);
        Assert.Contains("portföy", matches[0].Content, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("/wallet", matches[0].Path);
    }

    [Fact]
    public void FindRelevant_ForAnEnglishDataQuestion_ReturnsSimulationDisclosure()
    {
        var matches = _service.FindRelevant("Is this live market data?", "en", 3);

        Assert.NotEmpty(matches);
        Assert.Contains("simulated", matches[0].Content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void FindRelevant_ForAnUnrelatedQuestion_ReturnsNoMatch()
    {
        var matches = _service.FindRelevant("Write a poem about the moon", "en", 3);

        Assert.Empty(matches);
    }
}
