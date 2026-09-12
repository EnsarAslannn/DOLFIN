using api.Dtos.Portfolio;
using api.Models;

namespace api.Interfaces
{
    public interface IPortfolioAnalyticsService
    {
        Task<PortfolioMetricsDto> GetMetricsAsync(AppUser user);

        Task<List<AllocationWarningDto>> GetAllocationWarningsAsync(AppUser user);
    }
}
