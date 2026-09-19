using api.Dtos.Chat;

namespace api.Interfaces;

public interface ISiteKnowledgeService
{
    IReadOnlyList<SiteKnowledgeItem> FindRelevant(string query, string language, int limit);
}
