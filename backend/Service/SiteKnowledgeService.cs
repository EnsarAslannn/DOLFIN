using System.Globalization;
using System.Text;
using api.Dtos.Chat;
using api.Interfaces;

namespace api.Service;

public class SiteKnowledgeService : ISiteKnowledgeService
{
    private static readonly IReadOnlyDictionary<string, IReadOnlyList<SiteKnowledgeItem>> Items =
        new Dictionary<string, IReadOnlyList<SiteKnowledgeItem>>
        {
            ["tr"] =
            [
                new(
                    "about",
                    "DOL-FIN hakkında",
                    "DOL-FIN; hisseleri inceleyebileceğiniz, şirket finansallarını okuyabileceğiniz ve sanal bir cüzdanla portföy yönetimini deneyebileceğiniz bir finansal simülasyon platformudur.",
                    "/#how-it-works",
                    ["dol-fin", "nedir", "ne ise yarar", "platform", "site", "nasil calisir"]
                ),
                new(
                    "data",
                    "Simülasyon verileri",
                    "DOL-FIN gerçek zamanlı bir aracı kurum değildir. Fiyatlar ve finansal veriler eğitim ve ürün deneyimi için hazırlanmış simülasyon verileridir; yatırım kararı için kullanılmamalıdır.",
                    "/#help",
                    ["veri", "gercek", "canli", "fiyat", "simulasyon", "yatirim tavsiyesi", "piyasa"]
                ),
                new(
                    "portfolio",
                    "Portföy ve cüzdan",
                    "Portföy oluşturmak için hesabınıza giriş yaptıktan sonra Arama sayfasından bir hisse seçip sanal bakiyenizle alım yapabilirsiniz. Pozisyonlarınızı, maliyetinizi ve simüle edilmiş kâr/zararı Cüzdan sayfasında izleyebilirsiniz.",
                    "/wallet",
                    ["portfoy", "cuzdan", "alim", "satin al", "pozisyon", "kar", "zarar", "bakiye"]
                ),
                new(
                    "alerts",
                    "Fiyat alarmları",
                    "Cüzdan sayfasındaki fiyat alarmları bölümünden hisseyi, hedef fiyatı ve fiyatın hedefin üstüne mi altına mı gelmesi gerektiğini seçerek alarm kurabilirsiniz. Tetiklenen alarmlar üst menüdeki zil simgesinde görünür.",
                    "/wallet",
                    ["alarm", "bildirim", "hedef fiyat", "zil", "uyari"]
                ),
                new(
                    "companies",
                    "Desteklenen şirketler",
                    "Ayrıntılı şirket profilleri ve finansal tablolar AAPL, MSFT, NVDA, TSLA ve GOOGL için sunulur. Arama ve piyasa listesinde ek simülasyon hisseleri de bulunur.",
                    "/search",
                    ["sirket", "hisse", "desteklenen", "ticker", "aapl", "msft", "nvda", "tsla", "googl"]
                ),
                new(
                    "privacy",
                    "Portföy gizliliği",
                    "Portföyünüz, bakiyeniz ve cüzdan hareketleriniz yalnızca hesabınıza açıktır. Şirket sayfalarına yazdığınız yorumlar ise herkese açık olarak yayımlanır.",
                    "/wallet",
                    ["gizli", "gizlilik", "kim gorebilir", "guvenlik", "hesap", "yorum"]
                ),
            ],
            ["en"] =
            [
                new(
                    "about",
                    "About DOL-FIN",
                    "DOL-FIN is a financial simulation platform where you can explore stocks, read company financials, and practise portfolio management with a virtual wallet.",
                    "/#how-it-works",
                    ["dol-fin", "what is", "platform", "site", "how does it work"]
                ),
                new(
                    "data",
                    "Simulation data",
                    "DOL-FIN is not a real-time brokerage. Prices and financial data are simulated for learning and product demonstration, and should not be used to make investment decisions.",
                    "/#help",
                    ["data", "real", "live", "price", "simulated", "investment advice", "market"]
                ),
                new(
                    "portfolio",
                    "Portfolio and wallet",
                    "After signing in, choose a stock on the Search page and buy it with your virtual balance. The Wallet page shows positions, cost basis, and simulated profit or loss.",
                    "/wallet",
                    ["portfolio", "wallet", "buy", "position", "profit", "loss", "balance"]
                ),
                new(
                    "alerts",
                    "Price alerts",
                    "On the Wallet page, choose a stock, target price, and direction to create a price alert. Triggered alerts appear under the bell in the top navigation.",
                    "/wallet",
                    ["alert", "notification", "target price", "bell", "warning"]
                ),
                new(
                    "companies",
                    "Supported companies",
                    "Detailed company profiles and statements are available for AAPL, MSFT, NVDA, TSLA, and GOOGL. Additional simulated stocks appear in search and market lists.",
                    "/search",
                    ["company", "stock", "supported", "ticker", "aapl", "msft", "nvda", "tsla", "googl"]
                ),
                new(
                    "privacy",
                    "Portfolio privacy",
                    "Your portfolio, balance, and wallet activity are private to your account. Comments posted on company pages are public.",
                    "/wallet",
                    ["private", "privacy", "who can see", "security", "account", "comment"]
                ),
            ],
        };

    public IReadOnlyList<SiteKnowledgeItem> FindRelevant(string query, string language, int limit)
    {
        var normalizedQuery = Normalize(query);
        var terms = normalizedQuery
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(term => term.Length > 2)
            .ToHashSet(StringComparer.Ordinal);
        var items = Items.TryGetValue(language, out var localized) ? localized : Items["tr"];

        return items
            .Select(item => new
            {
                Item = item,
                Score = item.Keywords.Sum(keyword =>
                {
                    var normalizedKeyword = Normalize(keyword);
                    return normalizedQuery.Contains(normalizedKeyword, StringComparison.Ordinal)
                        ? normalizedKeyword.Contains(' ') ? 4 : 2
                        : normalizedKeyword.Split(' ').Count(terms.Contains);
                }),
            })
            .Where(match => match.Score > 0)
            .OrderByDescending(match => match.Score)
            .ThenBy(match => match.Item.Id)
            .Take(Math.Max(0, limit))
            .Select(match => match.Item)
            .ToList();
    }

    private static string Normalize(string value)
    {
        var decomposed = value.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);

        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character is 'ı' ? 'i' : character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
