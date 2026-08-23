using api.Interfaces;

namespace api.Service
{
    public class PriceSimulationBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<PriceSimulationBackgroundService> _logger;
        private readonly PriceSimulationOptions _options;

        public PriceSimulationBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<PriceSimulationBackgroundService> logger,
            PriceSimulationOptions options
        )
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _options = options;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_options.Enabled)
            {
                _logger.LogInformation("Price simulation is disabled; prices will stay at their seeded values");
                return;
            }

            var interval = TimeSpan.FromSeconds(Math.Max(_options.IntervalSeconds, 1));

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var simulation = scope.ServiceProvider.GetRequiredService<IPriceSimulationService>();
                    await simulation.TickAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Price simulation tick failed");
                }

                try
                {
                    await Task.Delay(interval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                }
            }
        }
    }
}
