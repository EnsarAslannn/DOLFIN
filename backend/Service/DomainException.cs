using api.Dtos;

namespace api.Service
{
    /// <summary>
    /// A rule the caller broke, as opposed to something going wrong.
    ///
    /// Services used to signal these with ArgumentException and
    /// InvalidOperationException carrying an English sentence, which left the
    /// controller with nothing to return but that sentence -- and so a Turkish
    /// user read "Insufficient funds. Required: $420.00" no matter which
    /// language the app was in. Carrying a code and its arguments instead lets
    /// the client say it in its own words.
    /// </summary>
    public class DomainException : Exception
    {
        public DomainException(
            string code,
            string message,
            Dictionary<string, string>? args = null
        )
            : base(message)
        {
            Code = code;
            Args = args;
        }

        public string Code { get; }

        public Dictionary<string, string>? Args { get; }

        public ApiErrorDto ToApiError() =>
            new()
            {
                Code = Code,
                Message = Message,
                Args = Args,
            };
    }
}
