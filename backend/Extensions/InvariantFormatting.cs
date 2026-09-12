using System.Globalization;

namespace api.Extensions
{
    /// <summary>
    /// Money and percentages formatted the same way on every machine.
    ///
    /// These figures travel in an error's <c>args</c> and in the English
    /// fallback sentence, where they are data rather than display: a client
    /// reads them back and renders them with its own locale's separators.
    /// Plain <c>ToString("F2")</c> follows the server's culture, so the same
    /// deployment produced "450.00" on one host and "450,00" on another
    /// depending on nothing the caller can see.
    /// </summary>
    public static class InvariantFormatting
    {
        public static string ToInvariantAmount(this decimal value) =>
            value.ToString("F2", CultureInfo.InvariantCulture);

        public static string ToInvariantAmount(this int value) =>
            value.ToString(CultureInfo.InvariantCulture);
    }
}
