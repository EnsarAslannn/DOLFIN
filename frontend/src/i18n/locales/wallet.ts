// The wallet route: balance summary, the deposit form and the assets table.
export const wallet = {
  en: {
    "wallet.eyebrow": "Wallet",
    "wallet.title": "Wallet overview",
    "wallet.lead":
      "Manage your funds and monitor estimated asset distribution.",

    "wallet.estTotal": "Est. Total Value",
    "wallet.cashBalance": "Cash Balance (Wallet)",
    "wallet.stocksValue": "Stocks Value (Portfolio)",
    "wallet.unrealized": "Unrealized P/L",

    "wallet.deposit.title": "Deposit Cash",
    "wallet.deposit.lead":
      "Add instant simulator credits into your trading account.",
    "wallet.deposit.processing": "Processing...",
    "wallet.deposit.submit": "Confirm Deposit",

    "wallet.holdings.eyebrow": "Holdings",
    "wallet.holdings.title": "My assets",
    "wallet.table.label": "Assets",
    "wallet.col.asset": "Asset Name",
    "wallet.col.marketPrice": "Market Price",
    "wallet.col.gainLoss": "Gain / Loss",
    "wallet.col.allocation": "Holdings Allocation",
    "wallet.col.action": "Action",
    "wallet.usd.name": "United States Dollar",
    "wallet.sell": "Sell",

    "wallet.empty.title": "Cash only, for now",
    "wallet.empty.description":
      "Your balance is sitting idle. Search for a ticker to put it to work and it will appear here beside your cash.",
    "wallet.empty.cta": "Find a company",

    // Portfolio health: the concentration warnings and the equal-weight
    // rebalance the API has always computed and nothing ever displayed.
    "health.eyebrow": "Portfolio health",
    "health.title": "How your capital is spread",
    "health.lead":
      "Two reads on the same positions: where you are concentrated, and what an equal-weight book would look like.",
    "health.loading": "Reading your allocation",
    "health.empty.title": "Nothing to weigh yet",
    "health.empty.description":
      "Concentration and rebalancing need at least one open position. Buy something and this fills in.",

    "health.warnings.title": "Concentration",
    "health.warnings.clear":
      "Nothing is oversized. No position is above 40% and no sector above 60%.",

    "health.rebalance.title": "Equal-weight target",
    "health.rebalance.summary":
      "Spread evenly, each of your {{count}} holdings would sit at {{target}}%.",
    "health.rebalance.none": "No open positions to rebalance.",
    "health.rebalance.hint":
      "A suggestion, not an order. Nothing here is bought or sold for you.",
    "health.col.asset": "Asset",
    "health.col.current": "Now",
    "health.col.target": "Target",
    "health.col.action": "Suggestion",
    "health.action.Buy": "Buy {{quantity}}",
    "health.action.Sell": "Sell {{quantity}}",
    "health.action.Hold": "Hold",
    "health.table.label": "Rebalancing suggestions",

    "wallet.toast.invalidAmount": "Please enter a valid amount greater than 0",
    "wallet.toast.depositFailed": "Deposit failed. Please try again.",
    "wallet.toast.noUsd": "You do not have any USD balance to sell!",
    "wallet.toast.withdrawFailed": "Withdrawal failed. Please try again.",
    "wallet.toast.converted": "Asset converted to cash successfully!",
    "wallet.toast.saleFailed": "Sale order execution failed.",
  },
  tr: {
    "wallet.eyebrow": "Cüzdan",
    "wallet.title": "Cüzdan özeti",
    "wallet.lead":
      "Paranızı yönetin ve tahmini varlık dağılımınızı izleyin.",

    "wallet.estTotal": "Tahmini Toplam Değer",
    "wallet.cashBalance": "Nakit Bakiye (Cüzdan)",
    "wallet.stocksValue": "Hisse Değeri (Portföy)",
    "wallet.unrealized": "Gerçekleşmemiş K/Z",

    "wallet.deposit.title": "Nakit Yatır",
    "wallet.deposit.lead":
      "İşlem hesabınıza anında simülasyon bakiyesi ekleyin.",
    "wallet.deposit.processing": "İşleniyor...",
    "wallet.deposit.submit": "Yatırmayı Onayla",

    "wallet.holdings.eyebrow": "Varlıklar",
    "wallet.holdings.title": "Varlıklarım",
    "wallet.table.label": "Varlıklar",
    "wallet.col.asset": "Varlık Adı",
    "wallet.col.marketPrice": "Piyasa Fiyatı",
    "wallet.col.gainLoss": "Kâr / Zarar",
    "wallet.col.allocation": "Varlık Dağılımı",
    "wallet.col.action": "İşlem",
    "wallet.usd.name": "Amerikan Doları",
    "wallet.sell": "Sat",

    "wallet.empty.title": "Şimdilik yalnızca nakit",
    "wallet.empty.description":
      "Bakiyeniz şu an boşta duruyor. Değerlendirmek için bir hisse arayın; aldığınız hisse burada nakdinizin yanında görünecek.",
    "wallet.empty.cta": "Şirket bul",

    "health.eyebrow": "Portföy sağlığı",
    "health.title": "Sermayeniz nasıl dağılmış",
    "health.lead":
      "Aynı pozisyonlara iki bakış: nerede yoğunlaştığınız ve eşit ağırlıklı bir portföyün nasıl görüneceği.",
    "health.loading": "Dağılımınız okunuyor",
    "health.empty.title": "Henüz tartılacak bir şey yok",
    "health.empty.description":
      "Yoğunlaşma ve yeniden dengeleme için en az bir açık pozisyon gerekir. Bir şey aldığınızda burası dolar.",

    "health.warnings.title": "Yoğunlaşma",
    "health.warnings.clear":
      "Aşırı büyüyen bir kalem yok. Hiçbir pozisyon %40'ın, hiçbir sektör %60'ın üzerinde değil.",

    "health.rebalance.title": "Eşit ağırlık hedefi",
    "health.rebalance.summary":
      "Eşit dağıtıldığında {{count}} pozisyonunuzun her biri %{{target}} olurdu.",
    "health.rebalance.none": "Yeniden dengelenecek açık pozisyon yok.",
    "health.rebalance.hint":
      "Bu bir öneri, emir değil. Burada sizin adınıza hiçbir alım satım yapılmaz.",
    "health.col.asset": "Varlık",
    "health.col.current": "Şu an",
    "health.col.target": "Hedef",
    "health.col.action": "Öneri",
    "health.action.Buy": "{{quantity}} al",
    "health.action.Sell": "{{quantity}} sat",
    "health.action.Hold": "Tut",
    "health.table.label": "Yeniden dengeleme önerileri",

    "wallet.toast.invalidAmount": "Lütfen 0'dan büyük geçerli bir tutar girin",
    "wallet.toast.depositFailed": "Para yatırma işlemi başarısız oldu. Lütfen tekrar deneyin.",
    "wallet.toast.noUsd": "Satılacak USD bakiyeniz yok!",
    "wallet.toast.withdrawFailed": "Para çekme işlemi başarısız oldu. Lütfen tekrar deneyin.",
    "wallet.toast.converted": "Varlık başarıyla nakde çevrildi!",
    "wallet.toast.saleFailed": "Satış emri gerçekleştirilemedi.",
  },
}
