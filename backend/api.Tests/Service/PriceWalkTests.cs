using api.Service;
using Xunit;

namespace api.Tests.Service
{
    public class PriceWalkTests
    {
        [Fact]
        public void Next_RollOfHalf_LeavesThePriceUnchanged()
        {
            // 0.5 maps to the midpoint of [-max, +max], which is no movement.
            Assert.Equal(100m, PriceWalk.Next(100m, 0.5, maxMovePercent: 1.5m, minPrice: 1m));
        }

        [Fact]
        public void Next_HighestRoll_MovesUpByTheFullPercentage()
        {
            var result = PriceWalk.Next(100m, 0.999999, maxMovePercent: 2m, minPrice: 1m);

            Assert.Equal(102m, result);
        }

        [Fact]
        public void Next_LowestRoll_MovesDownByTheFullPercentage()
        {
            var result = PriceWalk.Next(100m, 0d, maxMovePercent: 2m, minPrice: 1m);

            Assert.Equal(98m, result);
        }

        // The whole point is a bounded walk: a single tick must never be able
        // to move a price further than the configured percentage.
        [Theory]
        [InlineData(0d)]
        [InlineData(0.25d)]
        [InlineData(0.5d)]
        [InlineData(0.75d)]
        [InlineData(0.999999d)]
        public void Next_StaysWithinTheConfiguredBand(double roll)
        {
            var result = PriceWalk.Next(200m, roll, maxMovePercent: 1.5m, minPrice: 1m);

            Assert.InRange(result, 197m, 203m);
        }

        [Fact]
        public void Next_RoundsToTwoDecimals_MatchingTheStoredColumn()
        {
            var result = PriceWalk.Next(185.20m, 0.7, maxMovePercent: 1.5m, minPrice: 1m);

            Assert.Equal(result, Math.Round(result, 2));
        }

        // A long run of bad rolls must not walk a price to zero, where the
        // gain percentage would divide by an invested amount of nothing.
        [Fact]
        public void Next_NeverFallsBelowTheFloor()
        {
            var price = 5m;

            for (var i = 0; i < 500; i++)
            {
                price = PriceWalk.Next(price, 0d, maxMovePercent: 10m, minPrice: 1m);
            }

            Assert.Equal(1m, price);
        }

        [Fact]
        public void Next_WithVolatilityDisabled_IsANoOp()
        {
            Assert.Equal(42.50m, PriceWalk.Next(42.50m, 0.9, maxMovePercent: 0m, minPrice: 1m));
        }
    }
}
