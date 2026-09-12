using api.Dtos.Stock;
using FluentValidation;

namespace api.Validation
{
    public class AddWatchlistRequestDtoValidator : AbstractValidator<AddWatchlistRequestDto>
    {
        public AddWatchlistRequestDtoValidator()
        {
            RuleFor(x => x.StockId)
                .GreaterThan(0)
                .WithMessage("StockId must reference a valid stock");
        }
    }
}
