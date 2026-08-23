namespace api.Interfaces
{
    public interface IPriceSimulationService
    {
        Task<int> TickAsync();
    }
}
