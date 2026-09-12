namespace api.Dtos
{
    /// <summary>
    /// The body of every error this API returns deliberately, as opposed to
    /// the ValidationProblemDetails that failed request validation produces.
    /// </summary>
    public class ApiErrorDto
    {
        /// <summary>A stable identifier from <see cref="api.Models.ErrorCodes"/>.</summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// The same error in English, for clients that do not translate codes.
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Values the sentence interpolates -- an amount, a symbol -- so a
        /// client can compose its own wording rather than parse this one's.
        /// Null when the message has no moving parts.
        /// </summary>
        public Dictionary<string, string>? Args { get; set; }
    }
}
