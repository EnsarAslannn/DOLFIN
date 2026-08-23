namespace api.Service
{
    /// <summary>
    /// The pure half of the price simulation: given the current price and one
    /// roll of a die, produce the next price. Kept free of randomness so the
    /// movement rules can be tested without a seeded RNG.
    /// </summary>
    public static class PriceWalk
    {
        public static decimal Next(decimal currentPrice, double roll, decimal maxMovePercent, decimal minPrice)
        {
            if (maxMovePercent <= 0)
                return currentPrice;

            // roll is [0,1) from the caller's RNG; map it onto [-max, +max].
            var swing = (decimal)((roll * 2d) - 1d) * maxMovePercent;
            var moved = currentPrice * (1m + (swing / 100m));

            var rounded = Math.Round(moved, 2, MidpointRounding.AwayFromZero);

            // A floor keeps a long run of bad rolls from walking a price to
            // zero, where it would divide into a meaningless gain percentage.
            return rounded < minPrice ? minPrice : rounded;
        }
    }
}
