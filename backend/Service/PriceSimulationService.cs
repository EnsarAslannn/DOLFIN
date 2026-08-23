using api.Interfaces;

namespace api.Service
{
    /// <summary>
    /// Nudges every stock price on a schedule so the simulator behaves like a
    /// market instead of a price list. Without this the seeded prices never
    /// move, which makes unrealized P/L permanently zero (a position is always
    /// bought at the same price it is later valued at) and leaves price alerts
    /// with nothing to trigger on.
    /// </summary>
    public class PriceSimulationService : IPriceSimulationService
    {
        private readonly IStockRepository _stockRepo;
        private readonly PriceSimulationOptions _options;
        private readonly ILogger<PriceSimulationService> _logger;

        public PriceSimulationService(
            IStockRepository stockRepo,
            PriceSimulationOptions options,
            ILogger<PriceSimulationService> logger
        )
        {
            _stockRepo = stockRepo;
            _options = options;
            _logger = logger;
        }

        public async Task<int> TickAsync()
        {
            var count = await _stockRepo.UpdatePricesAsync(stock =>
                PriceWalk.Next(
                    stock.Purchase,
                    Random.Shared.NextDouble(),
                    _options.MaxMovePercent,
                    _options.MinPrice
                )
            );

            _logger.LogInformation("Price simulation moved {Count} stock prices", count);
            return count;
        }
    }
}
