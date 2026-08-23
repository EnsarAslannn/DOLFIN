using api.Mappers;
using api.Models;
using Xunit;

namespace api.Tests.Mappers
{
    public class TransactionMappersTests
    {
        [Fact]
        public void ToTransactionDto_MapsEveryField()
        {
            var timestamp = new DateTime(2026, 3, 4, 10, 30, 0, DateTimeKind.Utc);
            var transaction = new Transaction
            {
                Id = 12,
                AppUserId = "user-1",
                Symbol = "AAPL",
                CompanyName = "Apple Inc.",
                TransactionType = "BUY",
                Quantity = 4,
                Price = 185.20m,
                Timestamp = timestamp,
            };

            var dto = transaction.ToTransactionDto();

            Assert.Equal(12, dto.Id);
            Assert.Equal("AAPL", dto.Symbol);
            Assert.Equal("Apple Inc.", dto.CompanyName);
            Assert.Equal("BUY", dto.TransactionType);
            Assert.Equal(4, dto.Quantity);
            Assert.Equal(185.20m, dto.Price);
            Assert.Equal(timestamp, dto.Timestamp);
        }

        [Fact]
        public void ToTransactionDto_TotalAmount_IsQuantityTimesPrice()
        {
            var transaction = new Transaction
            {
                Symbol = "TSLA",
                TransactionType = "SELL",
                Quantity = 3,
                Price = 210.50m,
            };

            var dto = transaction.ToTransactionDto();

            Assert.Equal(631.50m, dto.TotalAmount);
        }

        // Deposits and withdrawals are stored with Quantity = 1 and the amount
        // in Price, so the same field carries the sum for cash rows too.
        [Theory]
        [InlineData("DEPOSIT")]
        [InlineData("WITHDRAW")]
        public void ToTransactionDto_CashMovement_TotalAmountIsTheAmount(string type)
        {
            var transaction = new Transaction
            {
                Symbol = "CASH",
                CompanyName = "Wallet Deposit",
                TransactionType = type,
                Quantity = 1,
                Price = 500m,
            };

            var dto = transaction.ToTransactionDto();

            Assert.Equal(500m, dto.TotalAmount);
        }

        // AppUserId is the ownership filter, never part of the response body.
        [Fact]
        public void ToTransactionDto_DoesNotExposeTheOwnerId()
        {
            var dto = new Transaction { AppUserId = "user-1", Symbol = "AAPL" }.ToTransactionDto();

            Assert.DoesNotContain(
                dto.GetType().GetProperties(),
                p => p.Name.Contains("AppUser", StringComparison.OrdinalIgnoreCase)
            );
        }
    }
}
