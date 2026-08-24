using api.Interfaces;

namespace api.Service
{
    public class PriceAlertBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<PriceAlertBackgroundService> _logger;
        private readonly PriceAlertOptions _options;

        public PriceAlertBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<PriceAlertBackgroundService> logger,
            PriceAlertOptions options
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
                _logger.LogInformation("Price alert checks are disabled; no alert will fire");
                return;
            }

            var interval = TimeSpan.FromSeconds(Math.Max(_options.IntervalSeconds, 1));

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var alertService = scope.ServiceProvider.GetRequiredService<IPriceAlertService>();
                    await alertService.CheckAndTriggerAlertsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Price alert background check failed");
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
