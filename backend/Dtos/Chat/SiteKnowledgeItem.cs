namespace api.Dtos.Chat;

public sealed record SiteKnowledgeItem(
    string Id,
    string Title,
    string Content,
    string Path,
    IReadOnlyList<string> Keywords,
    IReadOnlyList<string>? Suggestions = null
);
