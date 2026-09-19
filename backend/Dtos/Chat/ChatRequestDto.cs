namespace api.Dtos.Chat;

public class ChatRequestDto
{
    public string Message { get; set; } = string.Empty;

    public string Language { get; set; } = "tr";

    public List<ChatTurnDto> History { get; set; } = [];
}

public class ChatTurnDto
{
    public string Role { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;
}
