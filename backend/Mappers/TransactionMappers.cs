using api.Dtos.Portfolio;
using api.Models;

namespace api.Mappers
{
    public static class TransactionMappers
    {
        public static TransactionDto ToTransactionDto(this Transaction transaction)
        {
            return new TransactionDto
            {
                Id = transaction.Id,
                Symbol = transaction.Symbol,
                CompanyName = transaction.CompanyName,
                TransactionType = transaction.TransactionType,
                Quantity = transaction.Quantity,
                Price = transaction.Price,
                // Cash moves are written with Quantity = 1 and Price = amount,
                // so the same multiplication gives the deposited/withdrawn sum.
                TotalAmount = transaction.Quantity * transaction.Price,
                Timestamp = transaction.Timestamp
            };
        }
    }
}
