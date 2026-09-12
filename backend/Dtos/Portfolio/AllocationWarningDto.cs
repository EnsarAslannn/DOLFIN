using api.Models;

namespace api.Dtos.Portfolio
{
    /// <summary>
    /// One concentration warning, as data rather than as a finished sentence.
    ///
    /// These used to come back as English strings built on the server, which
    /// meant the wallet could only have shown them in English however the rest
    /// of the page read. The client composes the wording from
    /// <see cref="Code"/> and the figures below.
    /// </summary>
    public class AllocationWarningDto
    {
        /// <summary>
        /// <see cref="ErrorCodes.PortfolioWarningConcentration"/> for a single
        /// oversized position, or
        /// <see cref="ErrorCodes.PortfolioWarningSector"/> for an industry.
        /// </summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>The ticker, for a single-position warning.</summary>
        public string? Symbol { get; set; }

        /// <summary>The industry, for a sector warning.</summary>
        public string? Industry { get; set; }

        /// <summary>The share of the portfolio, as a percentage.</summary>
        public decimal Percent { get; set; }

        /// <summary>The same warning as one English sentence.</summary>
        public string Message { get; set; } = string.Empty;
    }
}
