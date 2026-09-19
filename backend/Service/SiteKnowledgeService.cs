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
                    ["dol-fin", "nedir", "ne ise yarar", "platform", "site", "nasil calisir"],
                    ["Piyasa verileri canlı mı?", "Nasıl portföy oluştururum?"]
                ),
                new(
                    "data",
                    "Simülasyon verileri",
                    "DOL-FIN gerçek zamanlı bir aracı kurum değildir. Fiyatlar ve finansal veriler eğitim ve ürün deneyimi için hazırlanmış simülasyon verileridir; yatırım kararı için kullanılmamalıdır.",
                    "/#help",
                    ["veri", "gercek", "canli", "fiyat", "simulasyon", "yatirim tavsiyesi", "piyasa"],
                    ["Simülasyon alım-satımı nasıl çalışır?", "Hangi şirketleri inceleyebilirim?"]
                ),
                new(
                    "portfolio",
                    "Portföy ve cüzdan",
                    "Portföy oluşturmak için hesabınıza giriş yaptıktan sonra Arama sayfasından bir hisse seçip sanal bakiyenizle alım yapabilirsiniz. Pozisyonlarınızı, maliyetinizi ve simüle edilmiş kâr/zararı Cüzdan sayfasında izleyebilirsiniz.",
                    "/wallet",
                    ["portfoy", "cuzdan", "alim", "satin al", "pozisyon", "kar", "zarar", "bakiye"],
                    ["Portföyümü göster", "Simülasyon işlemi yap", "İşlem geçmişim nerede?"]
                ),
                new(
                    "alerts",
                    "Fiyat alarmları",
                    "Cüzdan sayfasındaki fiyat alarmları bölümünden hisseyi, hedef fiyatı ve fiyatın hedefin üstüne mi altına mı gelmesi gerektiğini seçerek alarm kurabilirsiniz. Tetiklenen alarmlar üst menüdeki zil simgesinde görünür.",
                    "/wallet",
                    ["alarm", "bildirim", "hedef fiyat", "zil", "uyari"],
                    ["Tetiklenen alarmları nerede görürüm?", "Portföyümü göster"]
                ),
                new(
                    "companies",
                    "Desteklenen şirketler",
                    "Ayrıntılı şirket profilleri ve finansal tablolar AAPL, MSFT, NVDA, TSLA ve GOOGL için sunulur. Arama ve piyasa listesinde ek simülasyon hisseleri de bulunur.",
                    "/search",
                    ["sirket", "hisse", "desteklenen", "ticker", "aapl", "msft", "nvda", "tsla", "googl"],
                    ["Finansal tabloları nerede bulurum?", "Bir hisseyi nasıl izlerim?"]
                ),
                new(
                    "privacy",
                    "Portföy gizliliği",
                    "Portföyünüz, bakiyeniz ve cüzdan hareketleriniz yalnızca hesabınıza açıktır. Şirket sayfalarına yazdığınız yorumlar ise herkese açık olarak yayımlanır.",
                    "/wallet",
                    ["gizli", "gizlilik", "kim gorebilir", "guvenlik", "hesap", "yorum"],
                    ["Tüm konuşmaları nasıl temizlerim?", "Yorumlarımı kimler görebilir?"]
                ),
                new(
                    "trading",
                    "Simülasyon alım-satımı",
                    "Simülasyon işlemi için bir hisse kodu ve adet seçilir. Alım sanal bakiyeden düşer, satım bakiyeye eklenir. Asistan içindeki işlem formu önce tahmini tutarı gösterir ve siz onaylamadan işlem uygulamaz.",
                    "/search",
                    ["simulasyon islemi", "alim satim", "hisse al", "hisse sat", "islem yap", "sanal islem"],
                    ["Portföyümü göster", "Sanal bakiyeme nasıl para eklerim?"]
                ),
                new(
                    "funds",
                    "Sanal bakiye",
                    "Sanal cüzdanınıza Cüzdan sayfasındaki bakiye bölümünden para ekleyebilir veya çekebilirsiniz. Bunlar gerçek para hareketi değildir ve işlem geçmişinde bakiye hareketi olarak görünür.",
                    "/wallet",
                    ["sanal cuzdan", "para ekle", "bakiye ekle", "para cek", "deposit", "nakit"],
                    ["İşlem geçmişim nerede?", "Simülasyon işlemi yap"]
                ),
                new(
                    "transactions",
                    "İşlem geçmişi",
                    "Alım, satım, sanal para ekleme ve çekme hareketlerinizi Cüzdan sayfasındaki işlem geçmişi bölümünde en yeniden eskiye görebilirsiniz.",
                    "/wallet",
                    ["islem gecmisi", "gecmis", "hareket", "alimlarim", "satimlarim"],
                    ["Portföyümü göster", "Sanal bakiyeme nasıl para eklerim?"]
                ),
                new(
                    "watchlist",
                    "İzleme listesi",
                    "Bir hisseyi izleme listenize eklemek için hisse kartındaki veya şirket sayfasındaki izleme düğmesini kullanın. İzleme listeniz hesabınıza özeldir.",
                    "/search",
                    ["izleme listesi", "izleme", "takip listesi", "hisseyi izle", "favori"],
                    ["Hangi şirketleri inceleyebilirim?", "Fiyat alarmı nasıl kurulur?"]
                ),
                new(
                    "financials",
                    "Şirket finansalları",
                    "Desteklenen şirketlerin profil sayfalarında gelir tablosu, bilanço ve nakit akış tablosu bulunur. Veriler simülasyon ve ürün gösterimi içindir.",
                    "/search",
                    ["finansal tablo", "gelir tablosu", "bilanco", "nakit akis", "sirket finansallari"],
                    ["Hangi şirketleri inceleyebilirim?", "Piyasa verileri canlı mı?"]
                ),
                new(
                    "comments",
                    "Şirket yorumları",
                    "Oturum açmış kullanıcılar şirket sayfalarında yorum yazabilir. Yorumlar herkese açıktır; portföy ve bakiye bilgileri yorumlarla paylaşılmaz.",
                    "/search",
                    ["yorum", "yorum yaz", "sirket yorumu", "herkese acik"],
                    ["Portföyümü kimler görebilir?", "Hangi şirketleri inceleyebilirim?"]
                ),
            ],
            ["en"] =
            [
                new(
                    "about",
                    "About DOL-FIN",
                    "DOL-FIN is a financial simulation platform where you can explore stocks, read company financials, and practise portfolio management with a virtual wallet.",
                    "/#how-it-works",
                    ["dol-fin", "what is", "platform", "site", "how does it work"],
                    ["Is the market data live?", "How do I build a portfolio?"]
                ),
                new(
                    "data",
                    "Simulation data",
                    "DOL-FIN is not a real-time brokerage. Prices and financial data are simulated for learning and product demonstration, and should not be used to make investment decisions.",
                    "/#help",
                    ["data", "real", "live", "price", "simulated", "investment advice", "market"],
                    ["How does simulated trading work?", "Which companies can I explore?"]
                ),
                new(
                    "portfolio",
                    "Portfolio and wallet",
                    "After signing in, choose a stock on the Search page and buy it with your virtual balance. The Wallet page shows positions, cost basis, and simulated profit or loss.",
                    "/wallet",
                    ["portfolio", "wallet", "buy", "position", "profit", "loss", "balance"],
                    ["Show my portfolio", "Make a simulated trade", "Where is my transaction history?"]
                ),
                new(
                    "alerts",
                    "Price alerts",
                    "On the Wallet page, choose a stock, target price, and direction to create a price alert. Triggered alerts appear under the bell in the top navigation.",
                    "/wallet",
                    ["alert", "notification", "target price", "bell", "warning"],
                    ["Where do triggered alerts appear?", "Show my portfolio"]
                ),
                new(
                    "companies",
                    "Supported companies",
                    "Detailed company profiles and statements are available for AAPL, MSFT, NVDA, TSLA, and GOOGL. Additional simulated stocks appear in search and market lists.",
                    "/search",
                    ["company", "stock", "supported", "ticker", "aapl", "msft", "nvda", "tsla", "googl"],
                    ["Where are financial statements?", "How do I watch a stock?"]
                ),
                new(
                    "privacy",
                    "Portfolio privacy",
                    "Your portfolio, balance, and wallet activity are private to your account. Comments posted on company pages are public.",
                    "/wallet",
                    ["private", "privacy", "who can see", "security", "account", "comment"],
                    ["How do I clear all conversations?", "Who can see my comments?"]
                ),
                new(
                    "trading",
                    "Simulated trading",
                    "Choose a ticker and quantity for a simulated trade. Buys reduce your virtual balance and sells add to it. The assistant trade form shows an estimate first and never applies a trade until you confirm it.",
                    "/search",
                    ["simulated trade", "buy stock", "sell stock", "make a trade", "paper trade"],
                    ["Show my portfolio", "How do I add virtual cash?"]
                ),
                new(
                    "funds",
                    "Virtual balance",
                    "Use the balance section on the Wallet page to add or withdraw virtual cash. These are not real-money transfers and appear in your transaction history.",
                    "/wallet",
                    ["virtual cash", "add funds", "deposit", "withdraw", "wallet balance"],
                    ["Where is my transaction history?", "Make a simulated trade"]
                ),
                new(
                    "transactions",
                    "Transaction history",
                    "The Wallet page lists buys, sells, virtual deposits, and withdrawals in the transaction history from newest to oldest.",
                    "/wallet",
                    ["transaction history", "trade history", "past trades", "activity"],
                    ["Show my portfolio", "How do I add virtual cash?"]
                ),
                new(
                    "watchlist",
                    "Watchlist",
                    "Use the watch control on a stock card or company page to add that stock to your private watchlist.",
                    "/search",
                    ["watchlist", "watch a stock", "follow stock", "favorite"],
                    ["Which companies can I explore?", "How do I set a price alert?"]
                ),
                new(
                    "financials",
                    "Company financials",
                    "Supported company pages include financial statements: an income statement, balance sheet, and cash-flow statement. The figures are for simulation and product demonstration.",
                    "/search",
                    ["financial statements", "income statement", "balance sheet", "cash flow", "company financials"],
                    ["Which companies can I explore?", "Is the market data live?"]
                ),
                new(
                    "comments",
                    "Company comments",
                    "Signed-in users can post comments on company pages. Comments are public, while portfolio and wallet information remain private.",
                    "/search",
                    ["comment", "post comment", "company comment", "public"],
                    ["Who can see my portfolio?", "Which companies can I explore?"]
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
                    if (normalizedQuery.Contains(normalizedKeyword, StringComparison.Ordinal))
                    {
                        return normalizedKeyword.Contains(' ') ? 4 : 2;
                    }

                    return normalizedKeyword.Contains(' ') ? 0 : terms.Contains(normalizedKeyword) ? 1 : 0;
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
