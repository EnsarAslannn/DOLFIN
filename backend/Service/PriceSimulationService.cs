using api.Interfaces;
using api.Models;

namespace api.Service
{
    /// <summary>
    /// Nudges every stock price on a schedule so the simulator behaves like a
    /// market instead of a price list. Without this the seeded prices never
    /// move, which makes unrealized P/L permanently zero (a position is always
    /// bought at the same price it is later valued at) and leaves price alerts
    /// with nothing to trigger on.
    ///
    /// Each tick is also written to the price history. The walk had been
    /// running since it was added and keeping none of it -- every tick
    /// overwrote the one price a stock had -- so there was never anything to
    /// draw a line from.
    /// </summary>
    public class PriceSimulationService : IPriceSimulationService
    {
        private readonly IStockRepository _stockRepo;
        private readonly IPriceHistoryRepository _historyRepo;
        private readonly PriceSimulationOptions _options;
        private readonly ILogger<PriceSimulationService> _logger;

        public PriceSimulationService(
            IStockRepository stockRepo,
            IPriceHistoryRepository historyRepo,
            PriceSimulationOptions options,
            ILogger<PriceSimulationService> logger
        )
        {
            _stockRepo = stockRepo;
            _historyRepo = historyRepo;
            _options = options;
            _logger = logger;
        }

        public async Task<int> TickAsync()
        {
            var recordedAt = DateTime.UtcNow;
            var points = new List<PriceHistoryPoint>();

            var count = await _stockRepo.UpdatePricesAsync(stock =>
            {
                var next = PriceWalk.Next(
                    stock.Purchase,
                    Random.Shared.NextDouble(),
                    _options.MaxMovePercent,
                    _options.MinPrice
                );

                // One timestamp for the whole tick rather than one per stock:
                // these prices are a single snapshot of the simulated market,
                // and stamping them apart would put the catalog on slightly
                // different clocks in any chart drawn from them.
                points.Add(
                    new PriceHistoryPoint
                    {
                        StockId = stock.Id,
                        Price = next,
                        RecordedAt = recordedAt,
                    }
                );

                return next;
            });

            if (points.Count > 0)
            {
                await _historyRepo.RecordAsync(points);
            }

            await PruneHistoryAsync(recordedAt);

            _logger.LogInformation("Price simulation moved {Count} stock prices", count);
            return count;
        }

        // Retention runs on the same timer as the writes rather than on a
        // schedule of its own. It is a single indexed delete, and tying it to
        // the thing that causes the growth means there is no way to enable one
        // without the other.
        private async Task PruneHistoryAsync(DateTime now)
        {
            if (_options.HistoryRetentionHours <= 0)
                return;

            try
            {
                var cutoff = now.AddHours(-_options.HistoryRetentionHours);
                var removed = await _historyRepo.PruneOlderThanAsync(cutoff);

                if (removed > 0)
                {
                    _logger.LogInformation(
                        "Price history pruned {Count} point(s) older than {Cutoff:o}",
                        removed,
                        cutoff
                    );
                }
            }
            catch (Exception ex)
            {
                // Losing a sweep costs disk, not correctness, and the next tick
                // tries again -- it must not take the price walk down with it.
                _logger.LogWarning(ex, "Price history retention sweep failed");
            }
        }
    }
}
