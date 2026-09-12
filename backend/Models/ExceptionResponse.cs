namespace api.Models
{
    public class ExceptionResponse
    {
        public int StatusCode { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Always <see cref="ErrorCodes.Unexpected"/>. Present so every error
        /// body this API produces carries a code, deliberate or not.
        /// </summary>
        public string Code { get; set; } = ErrorCodes.Unexpected;
    }
}
