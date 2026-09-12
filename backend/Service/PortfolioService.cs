using api.Caching;
using api.Dtos;
using api.Extensions;
using api.Dtos.Portfolio;
using api.Helpers;
using api.Interfaces;
using api.Mappers;
using api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Hybrid;

namespace api.Service
{
    public class PortfolioService : IPortfolioService
    {
        private readonly IPortfolioRepository _portfolioRepo;
        private readonly IStockRepository _stockRepo;
        private readonly ITransactionRepository _transactionRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<AppUser> _userManager;
        private readonly HybridCache _cache;
        private readonly ICacheMetrics _metrics;
        private readonly ILogger<PortfolioService> _logger;

        public PortfolioService(
            IPortfolioRepository portfolioRepo,
            IStockRepository stockRepo,
            ITransactionRepository transactionRepo,
            IUnitOfWork unitOfWork,
            UserManager<AppUser> userManager,
            HybridCache cache,
            ICacheMetrics metrics,
            ILogger<PortfolioService> logger
        )
        {
            _portfolioRepo = portfolioRepo;
            _stockRepo = stockRepo;
            _transactionRepo = transactionRepo;
            _unitOfWork = unitOfWork;
            _userManager = userManager;
            _cache = cache;
            _metrics = metrics;
            _logger = logger;
        }

        public async Task<List<PortfolioDto>> GetUserPortfolioAsync(AppUser user)
        {
            try
            {
                return await _cache.GetOrCreateWithMetricsAsync(
                    _metrics,
                    CacheKeys.PortfolioByUser(user.Id),
                    async ct => await _portfolioRepo.GetUserPortfolio(user),
                    CacheConfiguration.Portfolio,
                    tags: [CacheKeys.PortfolioTag]
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis unavailable, falling back to direct DB read for portfolio of user {UserId}", user.Id);
                return await _portfolioRepo.GetUserPortfolio(user);
            }
        }

        private const string ConcurrencyErrorMessage =
            "Your account was updated by another request while this operation was in progress. Please try again.";

        private static DomainException ConcurrencyConflict() =>
            new(ErrorCodes.PortfolioConcurrentUpdate, ConcurrencyErrorMessage);

        private static void EnsureIdentityUpdateSucceeded(IdentityResult updateResult)
        {
            if (updateResult.Succeeded)
                return;

            if (updateResult.Errors.Any(e => e.Code == "ConcurrencyFailure"))
                throw ConcurrencyConflict();

            throw new Exception("Failed to update user wallet balance.");
        }

        private async Task InvalidatePortfolioCacheAsync(string userId)
        {
            try
            {
                await _cache.RemoveAsync(CacheKeys.PortfolioByUser(userId));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis unavailable, could not invalidate portfolio cache for user {UserId}", userId);
            }
        }

        public async Task<object> BuyStockAsync(AppUser user, string symbol, int quantity)
        {
            if (quantity <= 0)
                throw new DomainException(
                    ErrorCodes.PortfolioQuantityNotPositive,
                    "Quantity must be greater than 0"
                );

            var stock = await _stockRepo.GetBySymbolAsync(symbol);
            if (stock == null)
                throw new DomainException(ErrorCodes.PortfolioStockNotFound, "Stock not found");

            decimal totalCost = stock.Purchase * quantity;

            if (user.WalletBalance < totalCost)
                throw new DomainException(
                    ErrorCodes.PortfolioInsufficientFunds,
                    $"Insufficient funds. Required: ${totalCost.ToInvariantAmount()}, Available: ${user.WalletBalance.ToInvariantAmount()}",
                    new Dictionary<string, string>
                    {
                        ["required"] = totalCost.ToInvariantAmount(),
                        ["available"] = user.WalletBalance.ToInvariantAmount(),
                    }
                );

            object result;
            try
            {
                result = await _unitOfWork.ExecuteInTransactionAsync(async () =>
                {
                    user.WalletBalance -= totalCost;
                    EnsureIdentityUpdateSucceeded(await _userManager.UpdateAsync(user));

                    var existingPosition = await _portfolioRepo.GetByAppUserAndStockId(user.Id, stock.Id);

                    if (existingPosition != null)
                    {
                        decimal existingTotalCost = existingPosition.AveragePrice * existingPosition.Quantity;
                        decimal newTotalCost = existingTotalCost + totalCost;

                        existingPosition.Quantity += quantity;
                        existingPosition.AveragePrice = newTotalCost / existingPosition.Quantity;

                        await _portfolioRepo.UpdateAsync(existingPosition);
                    }
                    else
                    {
                        var portfolioModel = new Portfolio
                        {
                            StockId = stock.Id,
                            AppUserId = user.Id,
                            Quantity = quantity,
                            AveragePrice = stock.Purchase
                        };
                        await _portfolioRepo.CreateAsync(portfolioModel);
                    }

                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AppUserId = user.Id,
                        Symbol = stock.Symbol.ToUpper(),
                        CompanyName = stock.CompanyName,
                        TransactionType = "BUY",
                        Quantity = quantity,
                        Price = stock.Purchase,
                        Timestamp = DateTime.UtcNow
                    });

                    return (object)new { Message = "Stock purchased successfully", NewBalance = user.WalletBalance };
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                throw ConcurrencyConflict();
            }

            await InvalidatePortfolioCacheAsync(user.Id);
            return result;
        }

        public async Task<object> SellStockAsync(AppUser user, string symbol, int quantity)
        {
            if (quantity <= 0)
                throw new DomainException(
                    ErrorCodes.PortfolioQuantityNotPositive,
                    "Quantity must be greater than 0"
                );

            var stock = await _stockRepo.GetBySymbolAsync(symbol);
            if (stock == null)
                throw new DomainException(ErrorCodes.PortfolioStockNotFound, "Stock not found");

            var existingPosition = await _portfolioRepo.GetByAppUserAndStockId(user.Id, stock.Id);
            if (existingPosition == null || existingPosition.Quantity < quantity)
                throw new DomainException(
                    ErrorCodes.PortfolioInsufficientShares,
                    "Insufficient stock quantity in portfolio to execute this sale",
                    new Dictionary<string, string>
                    {
                        ["symbol"] = stock.Symbol,
                        ["requested"] = quantity.ToInvariantAmount(),
                        ["held"] = (existingPosition?.Quantity ?? 0).ToInvariantAmount(),
                    }
                );

            decimal totalRevenue = stock.Purchase * quantity;

            object result;
            try
            {
                result = await _unitOfWork.ExecuteInTransactionAsync(async () =>
                {
                    user.WalletBalance += totalRevenue;
                    EnsureIdentityUpdateSucceeded(await _userManager.UpdateAsync(user));

                    if (existingPosition.Quantity == quantity)
                    {
                        await _portfolioRepo.DeletePortfolio(user, symbol);
                    }
                    else
                    {
                        existingPosition.Quantity -= quantity;
                        await _portfolioRepo.UpdateAsync(existingPosition);
                    }

                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AppUserId = user.Id,
                        Symbol = stock.Symbol.ToUpper(),
                        CompanyName = stock.CompanyName,
                        TransactionType = "SELL",
                        Quantity = quantity,
                        Price = stock.Purchase,
                        Timestamp = DateTime.UtcNow
                    });

                    return (object)new { Message = "Stock sold successfully", NewBalance = user.WalletBalance };
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                throw ConcurrencyConflict();
            }

            await InvalidatePortfolioCacheAsync(user.Id);
            return result;
        }

        public async Task<object> DepositFundsAsync(AppUser user, decimal amount)
        {
            if (amount <= 0)
                throw new DomainException(
                    ErrorCodes.PortfolioDepositNotPositive,
                    "Deposit amount must be greater than 0"
                );

            object result;
            try
            {
                result = await _unitOfWork.ExecuteInTransactionAsync(async () =>
                {
                    user.WalletBalance += amount;
                    EnsureIdentityUpdateSucceeded(await _userManager.UpdateAsync(user));

                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AppUserId = user.Id,
                        Symbol = "CASH",
                        CompanyName = "Wallet Deposit",
                        TransactionType = "DEPOSIT",
                        Quantity = 1,
                        Price = amount,
                        Timestamp = DateTime.UtcNow
                    });

                    return (object)new { Message = "Funds deposited successfully", NewBalance = user.WalletBalance };
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                throw ConcurrencyConflict();
            }

            await InvalidatePortfolioCacheAsync(user.Id);
            return result;
        }

        public async Task<object> WithdrawFundsAsync(AppUser user, decimal amount)
        {
            if (amount <= 0)
                throw new DomainException(
                    ErrorCodes.PortfolioWithdrawNotPositive,
                    "Withdraw amount must be greater than 0"
                );

            if (user.WalletBalance < amount)
                throw new DomainException(
                    ErrorCodes.PortfolioInsufficientBalance,
                    $"Insufficient funds. Available: ${user.WalletBalance.ToInvariantAmount()}",
                    new Dictionary<string, string>
                    {
                        ["requested"] = amount.ToInvariantAmount(),
                        ["available"] = user.WalletBalance.ToInvariantAmount(),
                    }
                );

            object result;
            try
            {
                result = await _unitOfWork.ExecuteInTransactionAsync(async () =>
                {
                    user.WalletBalance -= amount;
                    EnsureIdentityUpdateSucceeded(await _userManager.UpdateAsync(user));

                    await _transactionRepo.AddAsync(new Transaction
                    {
                        AppUserId = user.Id,
                        Symbol = "CASH",
                        CompanyName = "Wallet Withdraw",
                        TransactionType = "WITHDRAW",
                        Quantity = 1,
                        Price = amount,
                        Timestamp = DateTime.UtcNow
                    });

                    return (object)new { Message = "Funds withdrawn successfully", NewBalance = user.WalletBalance };
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                throw ConcurrencyConflict();
            }

            await InvalidatePortfolioCacheAsync(user.Id);
            return result;
        }

        // Deliberately uncached: every trade, deposit and withdrawal appends a
        // row, so a cached page would be stale the moment it mattered.
        public async Task<List<TransactionDto>> GetTransactionHistoryAsync(AppUser user, TransactionQueryObject query)
        {
            var transactions = await _transactionRepo.GetByUserAsync(user.Id, query);
            return transactions.Select(t => t.ToTransactionDto()).ToList();
        }
    }
}
