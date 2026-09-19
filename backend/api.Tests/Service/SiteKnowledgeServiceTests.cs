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

    [Theory]
    [InlineData("Sanal cüzdanıma nasıl para eklerim?", "tr", "bakiye")]
    [InlineData("Where can I see my transaction history?", "en", "history")]
    [InlineData("Bir hisseyi izleme listeme nasıl eklerim?", "tr", "izleme")]
    [InlineData("Where are company financial statements?", "en", "statements")]
    public void FindRelevant_ForExpandedProductTopics_ReturnsGuidance(
        string question,
        string language,
        string expectedText
    )
    {
        var matches = _service.FindRelevant(question, language, 3);

        Assert.NotEmpty(matches);
        Assert.Contains(expectedText, matches[0].Content, StringComparison.OrdinalIgnoreCase);
    }
}
