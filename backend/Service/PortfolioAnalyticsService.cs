using api.Dtos.Portfolio;
using api.Interfaces;
using api.Models;

namespace api.Service
{
    public class PortfolioAnalyticsService : IPortfolioAnalyticsService
    {
        private const decimal SingleStockWarningThresholdPercent = 40m;

        private const decimal SectorWarningThresholdPercent = 60m;

        private readonly IPortfolioService _portfolioService;

        public PortfolioAnalyticsService(IPortfolioService portfolioService)
        {
            _portfolioService = portfolioService;
        }

        public async Task<PortfolioMetricsDto> GetMetricsAsync(AppUser user)
        {
            var positions = await _portfolioService.GetUserPortfolioAsync(user);

            var allocations = positions
                .Select(p => new StockAllocationDto
                {
                    StockId = p.Id,
                    Symbol = p.Symbol,
                    CompanyName = p.CompanyName,
                    Industry = p.Industry,
                    Quantity = p.Quantity,
                    AverageCostPerShare = p.AveragePrice,
                    CurrentPrice = p.Purchase,
                    CurrentValue = p.Quantity * p.Purchase,
                })
                .ToList();

            var totalInvested = allocations.Sum(a => a.Quantity * a.AverageCostPerShare);
            var totalCurrentValue = allocations.Sum(a => a.CurrentValue);

            foreach (var allocation in allocations)
            {
                var invested = allocation.Quantity * allocation.AverageCostPerShare;
                allocation.GainLossAmount = allocation.CurrentValue - invested;
                allocation.GainLossPercent = invested > 0 ? allocation.GainLossAmount / invested * 100 : 0;
                allocation.AllocationPercent =
                    totalCurrentValue > 0 ? allocation.CurrentValue / totalCurrentValue * 100 : 0;
            }

            var gainLossAmount = totalCurrentValue - totalInvested;

            return new PortfolioMetricsDto
            {
                TotalInvestedAmount = totalInvested,
                CurrentValue = totalCurrentValue,
                GainLossAmount = gainLossAmount,
                GainLossPercent = totalInvested > 0 ? gainLossAmount / totalInvested * 100 : 0,
                Allocations = allocations,
            };
        }

        // Warnings come back as data, not as finished English sentences: the
        // wallet renders them in whichever language it is showing, and a
        // sentence composed here could only ever have been in one.
        public async Task<List<AllocationWarningDto>> GetAllocationWarningsAsync(AppUser user)
        {
            var metrics = await GetMetricsAsync(user);
            var warnings = new List<AllocationWarningDto>();

            foreach (
                var allocation in metrics.Allocations.Where(a =>
                    a.AllocationPercent > SingleStockWarningThresholdPercent
                )
            )
            {
                warnings.Add(
                    new AllocationWarningDto
                    {
                        Code = ErrorCodes.PortfolioWarningConcentration,
                        Symbol = allocation.Symbol,
                        Percent = allocation.AllocationPercent,
                        Message =
                            $"{allocation.Symbol} is {allocation.AllocationPercent:F1}% of your portfolio. Consider diversifying.",
                    }
                );
            }

            var overConcentratedSectors = metrics
                .Allocations.GroupBy(a => a.Industry)
                .Select(g => new { Industry = g.Key, Percent = g.Sum(a => a.AllocationPercent) })
                .Where(g => g.Percent > SectorWarningThresholdPercent);

            foreach (var sector in overConcentratedSectors)
            {
                warnings.Add(
                    new AllocationWarningDto
                    {
                        Code = ErrorCodes.PortfolioWarningSector,
                        Industry = sector.Industry,
                        Percent = sector.Percent,
                        Message =
                            $"{sector.Industry} makes up {sector.Percent:F1}% of your portfolio. High sector concentration risk.",
                    }
                );
            }

            return warnings;
        }
    }
}
