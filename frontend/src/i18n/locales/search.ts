// The search route and the shared result/empty/guest surfaces it renders.
export const search = {
  en: {
    "search.eyebrow": "Search",
    "search.title": "Find a company",
    "search.lead.user":
      "Look up any listed ticker to read its fundamentals, then add it to your portfolio.",
    "search.lead.guest":
      "Look up any listed ticker and read its fundamentals. Browsing is open — an account is only needed to trade.",
    "search.input.placeholder": "Search companies by ticker or name...",
    "search.input.submit": "Search",
    "search.suggestions.heading": "Featured Demo Assets",

    "search.results.eyebrow": "Results",
    "search.results.title": "Matching companies",
    "search.results.count.one": "{{count}} match",
    "search.results.count.other": "{{count}} matches",

    "search.col.company": "Company",
    "search.col.industry": "Industry",
    "search.col.marketCap": "Market cap",
    "search.col.price": "Price",
    "search.industry.fallback": "Equity Market",

    "search.link.profile": "Profile",
    "search.link.income": "Income",
    "search.link.balance": "Balance sheet",
    "search.link.cashflow": "Cash flow",

    "search.empty.title": "Search for a company to begin",
    "search.empty.description":
      "Look up any listed ticker to read its fundamentals and add it to your portfolio.",
    "search.noMatch.title": "Nothing matched that search",
    "search.noMatch.description":
      "Check the spelling, or try a ticker instead of a company name — try AAPL, TSLA or MSFT.",

    "search.guest.eyebrow": "Guest",
    "search.guest.title": "Trading needs an account",
    "search.guest.description":
      "Search, fundamentals and the discussion are open to everyone. Opening a wallet gives you a starting balance to trade with, unrealized profit and loss on every position, and price alerts that watch a level for you.",

    "search.analytics.eyebrow": "Analytics",
    "search.analytics.title": "Portfolio analytics",
    "search.tile.netWorth": "Total Net Worth",
    "search.tile.health": "Portfolio Health",
    "search.tile.sector": "Primary Sector",

    "search.worth.title": "Net Worth Growth Timeline",
    "search.worth.subtitle":
      "Live historical context based on wallet & asset capitalization",
    "search.worth.badge": "All-Time High",

    "search.health.title": "Portfolio Risk & Diversification Audit",
    "search.health.subtitle":
      "Quantifying capital exposure and asset correlation metrics",
    "search.health.strategy": "Active Strategy: {{status}}",
    "search.health.analysisLabel": "Macroeconomic & Structural Risk Analysis:",

    "search.health.empty.status": "Empty Portfolio",
    "search.health.empty.description":
      "Your capital is currently completely unallocated in the equities market, resting fully in cash assets. While this strategy completely mitigates market volatility and systemic equity risk, it exposes your capital to purchasing power degradation via inflation. Consider initiating structural positions across uncorrelated assets to build a baseline risk-adjusted compounding framework.",
    "search.health.concentrated.status": "Concentrated Risk",
    "search.health.concentrated.description":
      "Your portfolio exhibits maximum idiosyncratic risk due to total asset concentration in a single equity instrument. Under standard Modern Portfolio Theory (MPT), this specific allocation configuration exposes your entire capital to unhedged corporate volatility and sector-specific shocks. To optimize your Sharpe ratio and build systemic resilience, consider liquidating marginal portions to diversify into low-correlation industries.",
    "search.health.diversifying.status": "Diversifying",
    "search.health.diversifying.description":
      "Your asset layout indicates an active transition toward a balanced model, demonstrating a structured mitigation of individual asset beta. While you have successfully eliminated absolute concentration risk, your portfolio's macroeconomic sensitivity remains tied to specific cluster movements. Fine-tuning your variance through international equities or contrasting industrial sectors will further secure equity insulation during broader market drawdowns.",
    "search.health.safe.status": "Highly Safe",
    "search.health.safe.description":
      "Your capital structure possesses institutional-grade diversification, effectively minimizing idiosyncratic risk factors across multiple moving parameters. The variance of your equity distribution successfully counteracts isolated sector contractions, optimizing long-term capital preservation metrics. Maintain periodic capital rebalancing schedules to ensure asset weight drifts do not inadvertently distort your target alpha-to-risk boundary parameters.",

    "search.sector.title": "Sector Allocation Layout",
    "search.sector.tech": "Technology & Semiconductors",
    "search.sector.other": "Other Sectors ({{sector}})",
    "search.sector.none": "None",
    "search.sector.technology": "Technology",

    "search.toast.portfolioFailed": "Could not get portfolio values!",
    "search.toast.bought": "Stock purchased successfully!",
    "search.toast.buyFailed": "Could not create portfolio item!",
    "search.toast.sold": "Stock sold successfully!",
    "search.toast.sellFailed": "Transaction execution failed!",
    "search.toast.searchFailed":
      "Could not fetch search results from local server!",
    "search.error.offline": "Unable to connect to local API server",

    "loader.readingTape": "Reading the tape",
  },
  tr: {
    "search.eyebrow": "Arama",
    "search.title": "Şirket bulun",
    "search.lead.user":
      "Listelenen herhangi bir hisseyi arayıp temel verilerini okuyun, ardından portföyünüze ekleyin.",
    "search.lead.guest":
      "Listelenen herhangi bir hisseyi arayın ve temel verilerini okuyun. Gezinme herkese açık — hesap yalnızca işlem yapmak için gerekli.",
    "search.input.placeholder": "Şirketleri koda veya ada göre arayın...",
    "search.input.submit": "Ara",
    "search.suggestions.heading": "Öne çıkan demo varlıklar",

    "search.results.eyebrow": "Sonuçlar",
    "search.results.title": "Eşleşen şirketler",
    "search.results.count.one": "{{count}} sonuç",
    "search.results.count.other": "{{count}} sonuç",

    "search.col.company": "Şirket",
    "search.col.industry": "Sektör",
    "search.col.marketCap": "Piyasa değeri",
    "search.col.price": "Fiyat",
    "search.industry.fallback": "Hisse Senedi Piyasası",

    "search.link.profile": "Profil",
    "search.link.income": "Gelir",
    "search.link.balance": "Bilanço",
    "search.link.cashflow": "Nakit akışı",

    "search.empty.title": "Başlamak için bir şirket arayın",
    "search.empty.description":
      "Listelenen herhangi bir hisseyi arayıp temel verilerini okuyun ve portföyünüze ekleyin.",
    "search.noMatch.title": "Bu aramayla eşleşen sonuç yok",
    "search.noMatch.description":
      "Yazımı kontrol edin veya şirket adı yerine hisse kodunu deneyin — AAPL, TSLA ya da MSFT gibi.",

    "search.guest.eyebrow": "Misafir",
    "search.guest.title": "İşlem yapmak için hesap gerekir",
    "search.guest.description":
      "Arama, temel veriler ve tartışma herkese açıktır. Cüzdan açmak size işlem yapabileceğiniz bir başlangıç bakiyesi, her pozisyon için gerçekleşmemiş kâr/zarar ve sizin adınıza bir seviyeyi izleyen fiyat alarmları verir.",

    "search.analytics.eyebrow": "Analiz",
    "search.analytics.title": "Portföy analizi",
    "search.tile.netWorth": "Toplam Net Varlık",
    "search.tile.health": "Portföy Sağlığı",
    "search.tile.sector": "Baskın Sektör",

    "search.worth.title": "Net Varlık Büyüme Çizelgesi",
    "search.worth.subtitle":
      "Cüzdan ve varlık değerine dayalı canlı geçmiş bağlamı",
    "search.worth.badge": "Tüm Zamanların Zirvesi",

    "search.health.title": "Portföy Risk ve Çeşitlendirme Denetimi",
    "search.health.subtitle":
      "Sermaye maruziyeti ve varlık korelasyon ölçütlerinin nicelendirilmesi",
    "search.health.strategy": "Aktif strateji: {{status}}",
    "search.health.analysisLabel": "Makroekonomik ve Yapısal Risk Analizi:",

    "search.health.empty.status": "Boş Portföy",
    "search.health.empty.description":
      "Sermayeniz şu anda hisse senedi piyasasında hiç dağıtılmamış durumda ve tamamen nakit olarak duruyor. Bu strateji piyasa oynaklığını ve sistemik hisse riskini tümüyle bertaraf etse de, sermayenizi enflasyon yoluyla alım gücü kaybına açık bırakır. Riske göre düzeltilmiş bir bileşik getiri çerçevesi kurmak için birbiriyle ilişkisiz varlıklarda yapısal pozisyonlar açmayı değerlendirin.",
    "search.health.concentrated.status": "Yoğunlaşmış Risk",
    "search.health.concentrated.description":
      "Portföyünüz, tüm varlığın tek bir hisse senedinde toplanması nedeniyle azami şirkete özgü risk taşıyor. Standart Modern Portföy Teorisi (MPT) çerçevesinde bu dağılım, sermayenizin tamamını korumasız şirket oynaklığına ve sektöre özgü şoklara açık bırakır. Sharpe oranınızı iyileştirmek ve sistemik dayanıklılık kurmak için bir bölümünü nakde çevirip düşük korelasyonlu sektörlere dağılmayı değerlendirin.",
    "search.health.diversifying.status": "Çeşitleniyor",
    "search.health.diversifying.description":
      "Varlık dağılımınız dengeli bir modele doğru aktif bir geçişe işaret ediyor ve tekil varlık betasının yapısal olarak azaltıldığını gösteriyor. Mutlak yoğunlaşma riskini başarıyla ortadan kaldırmış olsanız da, portföyünüzün makroekonomik duyarlılığı hâlâ belirli küme hareketlerine bağlı. Uluslararası hisseler veya birbirine zıt sanayi sektörleriyle varyansınızı ince ayarlamak, geniş çaplı piyasa düşüşlerinde korumanızı daha da güçlendirecektir.",
    "search.health.safe.status": "Yüksek Güvenlik",
    "search.health.safe.description":
      "Sermaye yapınız kurumsal düzeyde çeşitlendirmeye sahip ve birden çok değişken boyunca şirkete özgü risk etkenlerini etkili biçimde en aza indiriyor. Hisse dağılımınızın varyansı, izole sektör daralmalarını başarıyla dengeleyerek uzun vadeli sermaye koruma ölçütlerini iyileştiriyor. Varlık ağırlıklarındaki kaymaların hedef alfa-risk sınırınızı bozmaması için düzenli yeniden dengeleme takvimini sürdürün.",

    "search.sector.title": "Sektör Dağılım Şeması",
    "search.sector.tech": "Teknoloji ve Yarı İletkenler",
    "search.sector.other": "Diğer Sektörler ({{sector}})",
    "search.sector.none": "Yok",
    "search.sector.technology": "Teknoloji",

    "search.toast.portfolioFailed": "Portföy değerleri alınamadı!",
    "search.toast.bought": "Hisse başarıyla satın alındı!",
    "search.toast.buyFailed": "Portföy kaydı oluşturulamadı!",
    "search.toast.sold": "Hisse başarıyla satıldı!",
    "search.toast.sellFailed": "İşlem gerçekleştirilemedi!",
    "search.toast.searchFailed": "Yerel sunucudan arama sonuçları alınamadı!",
    "search.error.offline": "Yerel API sunucusuna bağlanılamıyor",

    "loader.readingTape": "Piyasa okunuyor",
  },
}
