using api.Helpers;
using FluentValidation;

namespace api.Validation
{
    public class PriceHistoryQueryObjectValidator : AbstractValidator<PriceHistoryQueryObject>
    {
        // The ceiling is what stops one request asking for every point of every
        // stock at once: the row count is ids times points, so both sides need
        // a bound, not just one.
        private const int MaxStockIds = 50;

        public PriceHistoryQueryObjectValidator()
        {
            RuleFor(x => x.Points)
                .InclusiveBetween(1, 200)
                .WithMessage("Points must be between 1 and 200");

            RuleFor(x => x.StockIds)
                .Must(ids =>
                    string.IsNullOrWhiteSpace(ids)
                    || ids.Split(',', StringSplitOptions.RemoveEmptyEntries).Length <= MaxStockIds
                )
                .WithMessage($"No more than {MaxStockIds} stock ids may be requested at once");
        }
    }
}
