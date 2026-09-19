using api.Dtos.Chat;
using FluentValidation;

namespace api.Validation;

public class ChatRequestDtoValidator : AbstractValidator<ChatRequestDto>
{
    public ChatRequestDtoValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty()
            .WithMessage("Message is required")
            .MaximumLength(1000)
            .WithMessage("Message must not exceed 1000 characters");

        RuleFor(x => x.Language)
            .Must(language => language is "tr" or "en")
            .WithMessage("Language must be either tr or en");

        RuleFor(x => x.History)
            .Must(history => history.Count <= 8)
            .WithMessage("History must not contain more than 8 messages");

        RuleForEach(x => x.History).ChildRules(turn =>
        {
            turn.RuleFor(x => x.Role)
                .Must(role => role is "user" or "assistant")
                .WithMessage("History roles must be either user or assistant");
            turn.RuleFor(x => x.Content)
                .NotEmpty()
                .MaximumLength(1000)
                .WithMessage("History messages must not exceed 1000 characters");
        });
    }
}
