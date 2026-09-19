namespace api.Dtos.Chat;

public class ChatResponseDto
{
    public string Answer { get; set; } = string.Empty;

    public List<ChatSourceDto> Sources { get; set; } = [];

    public bool UsedAi { get; set; }

    public List<string> Suggestions { get; set; } = [];
}

public class ChatSourceDto
{
    public string Title { get; set; } = string.Empty;

    public string Path { get; set; } = string.Empty;
}
