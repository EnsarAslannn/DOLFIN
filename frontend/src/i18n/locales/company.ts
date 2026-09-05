// The company routes: sidebar, profile, key metrics and the three statements.
export const company = {
  en: {
    "company.sidebar.heading": "Instrument Panel",
    "company.sidebar.profile": "Company Profile",
    "company.sidebar.income": "Income Statement",
    "company.sidebar.balance": "Balance Sheet",
    "company.sidebar.cashflow": "Cashflow Statement",

    "company.metric.price": "Price",
    "company.metric.change": "Change",
    "company.metric.marketCap": "Market cap",
    "company.metric.beta": "Beta",

    "company.unavailable.title": "Financial Data Unavailable",
    "company.unavailable.code": "SCOPE_LIMITATION_WARNING // LIVE_DEMO_RESTRICTION",
    "company.unavailable.body":
      "Financial data for {{ticker}} is currently unavailable for this demo version.",
    "company.unavailable.tiers":
      "Please audit premium corporate tiers: AAPL, MSFT, NVDA, TSLA, GOOGL",

    "company.noData.title": "No financial data for this ticker",
    "company.noData.description":
      "The sandbox carries full statements for five companies. {{ticker}} is not one of them yet.",
    "company.loading": "Loading company profile",

    "company.overview.eyebrow": "Overview",
    "company.overview.title": "What the company does",
    "company.metrics.eyebrow": "Key metrics",
    "company.metrics.title": "Trailing twelve months",
    "company.peers.eyebrow": "Peers",
    "company.peers.title": "Similar companies",
    "company.peers.lead":
      "Publicly traded companies in the same sector and industry.",
    "company.peers.none": "No peers found",
    "company.filings.eyebrow": "Filings",
    "company.filings.title": "10-K reports",
    "company.filings.lead":
      "The SEC's audited annual report — financial statements and the risk factors management had to disclose.",
    "company.filings.none": "No reports found",

    "ratio.marketCap": "Market Cap",
    "ratio.marketCap.sub": "Total value of all a company's shares of stock",
    "ratio.currentRatio": "Current Ratio",
    "ratio.currentRatio.sub":
      "Measures the company's ability to pay short term debt obligations",
    "ratio.roe": "Return On Equity",
    "ratio.roe.sub":
      "Return on equity is the measure of a company's net income divided by its shareholder's equity",
    "ratio.roa": "Return On Assets",
    "ratio.roa.sub":
      "Return on assets is the measure of how effective a company is using its assets",
    "ratio.fcfPerShare": "Free Cashflow Per Share",
    "ratio.fcfPerShare.sub":
      "Cash generated after capital expenditure, expressed on a per share basis",
    "ratio.bookValue": "Book Value Per Share TTM",
    "ratio.bookValue.sub":
      "Book value per share indicates a firm's net asset value (total assets - total liabilities) on per share basis",
    "ratio.dividendYield": "Dividend Yield TTM",
    "ratio.dividendYield.sub":
      "Shows how much a company pays each year relative to stock price",
    "ratio.capex": "Capex Per Share TTM",
    "ratio.capex.sub":
      "Capex is used by a company to acquire, upgrade, and maintain physical assets",
    "ratio.graham": "Graham Number",
    "ratio.graham.sub":
      "This is the upper bound of the price range that a defensive investor should pay for a stock",
    "ratio.pe": "PE Ratio",
    "ratio.pe.sub":
      "Share price relative to earnings per share — what the market pays for each unit of profit",

    "income.col.date": "Date",
    "income.col.revenue": "Revenue",
    "income.col.costOfRevenue": "Cost Of Revenue",
    "income.col.depreciation": "Depreciation",
    "income.col.operatingIncome": "Operating Income",
    "income.col.incomeBeforeTaxes": "Income Before Taxes",
    "income.col.netIncome": "Net Income",
    "income.col.netIncomeRatio": "Net Income Ratio",
    "income.col.eps": "Earnings Per Share",
    "income.col.epsDiluted": "Earnings Per Diluted",
    "income.col.grossProfitRatio": "Gross Profit Ratio",
    "income.col.operatingIncomeRatio": "Opearting Income Ratio",
    "income.col.incomeBeforeTaxesRatio": "Income Before Taxes Ratio",

    "income.explain.title": "Understanding the Income Statement",
    "income.explain.p1.a": "An",
    "income.explain.p1.term": "Income Statement",
    "income.explain.p1.b":
      "(Profit and Loss Statement) maps out a corporate institution's core financial velocity over a sequential reporting period. It tracks how total",
    "income.explain.p1.topline": "Revenue (Top-Line)",
    "income.explain.p1.c":
      "transitions down into operational expenses, tax components, and finally yields the net consolidated",
    "income.explain.p1.bottomline": "Profit or Loss (Bottom-Line)",
    "income.explain.why": "Why is it Critical?",
    "income.explain.p2":
      "While the Balance Sheet records asset and liability weight levels, the Income Statement focuses strictly on business efficiency, momentum, and operational pricing leverage. Investors study this matrix to measure market share scalability, identifying if gross margins are healthy enough to outpace rising industrial overhead thresholds.",

    "income.metric.margin": "Net Profit Margin",
    "income.metric.margin.sub": "Net conversion efficiency of capital deployment",
    "income.metric.growth": "Revenue Growth (YoY)",
    "income.metric.growth.sub":
      "Top-line macroeconomic scalability expansion metric",
    "income.summary.title": "Income Statement Performance Intelligence",
    "income.summary.badge": "{{status}} OUTLOOK",
    "income.status.STRONG": "STRONG",
    "income.status.MODERATE": "MODERATE",
    "income.status.WEAK": "WEAK",
    "income.status.NEUTRAL": "NEUTRAL",
    "income.summary.strong":
      "The company expanded its top-line operations significantly, registering a year-over-year revenue growth of {{growth}}%. It maintained a stable net conversion efficiency with a profit margin of {{margin}}%, signaling sustainable operational scaling and resilient corporate risk management over the trailing fiscal period.",
    "income.summary.weak":
      "The asset shows contraction signs with a negative top-line revenue growth of {{growth}}% alongside a tight profit conversion margin sitting at {{margin}}%. This compression suggests potential headwinds in macroeconomic scaling or rising cost boundaries that require structural optimization.",
    "income.summary.moderate":
      "Mixed technical indicators observed. While top-line growth metrics or net profit margin fields show slight deceleration, corporate baseline indicators remain functional. Close inspection of underlying expenditure lines is advised to balance future fiscal performance.",

    "balance.col.year": "Year",
    "balance.col.totalAssets": "Total Assets",
    "balance.col.currentAssets": "Current Assets",
    "balance.col.totalCash": "Total Cash",
    "balance.col.property": "Property & equipment",
    "balance.col.intangible": "Intangible Assets",
    "balance.col.longTermDebt": "Long Term Debt",
    "balance.col.totalDebt": "Total Debt",
    "balance.col.totalLiabilities": "Total Liabilities",
    "balance.col.currentLiabilities": "Current Liabilities",
    "balance.col.longTermTaxes": "Long-Term Income Taxes",
    "balance.col.equity": "Stakeholder's Equity",
    "balance.col.retainedEarnings": "Retained Earnings",

    "balance.explain.title": "Understanding the Balance Sheet",
    "balance.explain.p1.a": "A",
    "balance.explain.p1.term": "Balance Sheet",
    "balance.explain.p1.b":
      "represents a financial snapshot of a company's structural health at a specific point in time. It explicitly details what the institution",
    "balance.explain.p1.owns": "owns (Assets)",
    "balance.explain.p1.c": ", what it",
    "balance.explain.p1.owes": "owes (Liabilities)",
    "balance.explain.p1.d": ", and the net capital invested by the",
    "balance.explain.p1.equity": "shareholders (Equity)",
    "balance.explain.p1.e":
      "based on the accounting core: Assets = Liabilities + Equity.",
    "balance.explain.why": "Why is it Critical?",
    "balance.explain.p2":
      "While the Income Statement demonstrates performance velocity, the Balance Sheet focuses heavily on liquidity, solvency risks, and capital structure longevity. Analysts review these parameters to compute capital leverage risks, evaluating if corporate assets are scaled safely or dangerously inflated by unsecured credit lines.",

    "balance.metric.dte": "Debt-to-Equity Ratio",
    "balance.metric.dte.sub":
      "Total liabilities divided by total shareholder equity leverage",
    "balance.metric.turnover": "Asset Turnover Ratio",
    "balance.metric.turnover.sub":
      "Efficiency of company assets in generating top-line revenue",
    "balance.summary.title": "Balance Sheet Structural Intelligence",
    "balance.summary.badge": "{{status}} LAYOUT",
    "balance.status.STABLE": "STABLE",
    "balance.status.LEVERAGED": "LEVERAGED",
    "balance.status.CAUTIOUS": "CAUTIOUS",
    "balance.status.NEUTRAL": "NEUTRAL",
    "balance.summary.stable":
      "The balance sheet structure presents a balanced capital architecture. The Debt-to-Equity leverage metric is sustained at {{dte}}, confirming that operational expansion is securely backed by capital reserves rather than toxic debt scaling. Furthermore, an Asset Turnover ratio of {{turnover}} highlights optimal institutional asset utilization to manufacture top-line corporate revenue channels.",
    "balance.summary.leveraged":
      "Technical screening signals a heavily leveraged balance allocation. The Debt-to-Equity ratio rests at an aggressive {{dte}}, implying that liabilities significantly outweigh stockholder equity cushions. Structural adjustments or long-term consolidation adjustments might be necessary to safeguard credit lines against macro volatility.",
    "balance.summary.cautious":
      "Asset efficiency indices indicate minor deceleration. While capital metrics appear safe with a Debt-to-Equity profile of {{dte}}, the asset turnover fields are underperforming at {{turnover}}. This suggests capital is trapped in idle physical properties or inventories rather than optimizing marketplace turnover.",

    "cashflow.col.date": "Date",
    "cashflow.col.operating": "Operating Cashflow",
    "cashflow.col.investing": "Investing Cashflow",
    "cashflow.col.financing": "Financing Cashflow",
    "cashflow.col.cashAtEnd": "Cash At End of Period",
    "cashflow.col.capex": "CapEX",
    "cashflow.col.issuance": "Issuance Of Stock",
    "cashflow.col.freeCashFlow": "Free Cash Flow",

    "cashflow.explain.title": "Understanding the Cashflow Statement",
    "cashflow.explain.p1.a": "A",
    "cashflow.explain.p1.term": "Cashflow Statement",
    "cashflow.explain.p1.b":
      "tracks the actual physical movement of liquid capital into and out of an enterprise. It isolates accounting constructs by dividing treasury adjustments into three key structural pillars:",
    "cashflow.explain.p1.operating": "Operating",
    "cashflow.explain.p1.operating.note": "(core business cash flow),",
    "cashflow.explain.p1.investing": "Investing",
    "cashflow.explain.p1.investing.note": "(asset purchases and CapEX), and",
    "cashflow.explain.p1.financing": "Financing",
    "cashflow.explain.p1.financing.note": "(debt and equity capital actions).",
    "cashflow.explain.why": "Why is it Critical?",
    "cashflow.explain.p2.a":
      "While the Income Statement can report paper net profits via accrued earnings, the Cashflow Statement proves whether the firm possesses genuine sovereign liquidity to satisfy invoice commitments. It yields the definitive",
    "cashflow.explain.p2.fcf": "Free Cash Flow (FCF)",
    "cashflow.explain.p2.b":
      "metric, showcasing the actual capital left to award dividends or buy back shares.",

    "cashflow.metric.cycle": "Cash Conversion Cycle",
    "cashflow.metric.cycle.sub":
      "Days required to convert resource investments back into cash lines",
    "cashflow.metric.days": "{{count}} Days",
    "cashflow.metric.yield": "Free Cash Flow Yield",
    "cashflow.metric.yield.sub":
      "Operating cash flow successfully converted into free capital assets",
    "cashflow.summary.title": "Cashflow Liquidity Performance Intelligence",
    "cashflow.summary.badge": "{{status}} SYSTEM",
    "cashflow.status.LIQUID": "LIQUID",
    "cashflow.status.CAPEX_HEAVY": "CAPEX_HEAVY",
    "cashflow.status.NEUTRAL": "NEUTRAL",
    "cashflow.summary.liquid":
      "The corporate entity demonstrates robust cash generation velocity. Free Cash Flow Efficiency is optimized at {{yield}}%, ensuring that cash flowing from raw operations effectively converts into unrestricted liquidity. Combined with a lean Cash Conversion Cycle of {{cycle}} days, the firm maintains prime treasury freedom to fund capital projects without dilution risks.",
    "cashflow.summary.capexHeavy":
      "The data exposes a capital-intensive operations phase. While core activities manufacture cash, the Free Cash Flow Yield is compressed to {{yield}}% due to intense capital expenditures (CapEX). This indicates short-term treasury compression that requires strict milestone management before achieving organic investment yields.",
  },
  tr: {
    "company.sidebar.heading": "Gösterge Paneli",
    "company.sidebar.profile": "Şirket Profili",
    "company.sidebar.income": "Gelir Tablosu",
    "company.sidebar.balance": "Bilanço",
    "company.sidebar.cashflow": "Nakit Akış Tablosu",

    "company.metric.price": "Fiyat",
    "company.metric.change": "Değişim",
    "company.metric.marketCap": "Piyasa değeri",
    "company.metric.beta": "Beta",

    "company.unavailable.title": "Finansal Veri Kullanılamıyor",
    "company.unavailable.code": "SCOPE_LIMITATION_WARNING // LIVE_DEMO_RESTRICTION",
    "company.unavailable.body":
      "{{ticker}} için finansal veriler bu demo sürümünde şu anda kullanılamıyor.",
    "company.unavailable.tiers":
      "Lütfen şu şirketleri inceleyin: AAPL, MSFT, NVDA, TSLA, GOOGL",

    "company.noData.title": "Bu hisse için finansal veri yok",
    "company.noData.description":
      "Sanal ortamda beş şirketin eksiksiz tabloları bulunuyor. {{ticker}} henüz bunlardan biri değil.",
    "company.loading": "Şirket profili yükleniyor",

    "company.overview.eyebrow": "Genel bakış",
    "company.overview.title": "Şirket ne yapıyor",
    "company.metrics.eyebrow": "Temel ölçütler",
    "company.metrics.title": "Son on iki ay",
    "company.peers.eyebrow": "Benzerleri",
    "company.peers.title": "Benzer şirketler",
    "company.peers.lead":
      "Aynı sektör ve alanda işlem gören halka açık şirketler.",
    "company.peers.none": "Benzer şirket bulunamadı",
    "company.filings.eyebrow": "Bildirimler",
    "company.filings.title": "10-K raporları",
    "company.filings.lead":
      "SEC'in denetlenmiş yıllık raporu — finansal tablolar ve yönetimin açıklamak zorunda olduğu risk faktörleri.",
    "company.filings.none": "Rapor bulunamadı",

    "ratio.marketCap": "Piyasa Değeri",
    "ratio.marketCap.sub": "Şirketin tüm hisselerinin toplam değeri",
    "ratio.currentRatio": "Cari Oran",
    "ratio.currentRatio.sub":
      "Şirketin kısa vadeli borç yükümlülüklerini ödeyebilme gücünü ölçer",
    "ratio.roe": "Özkaynak Kârlılığı",
    "ratio.roe.sub":
      "Özkaynak kârlılığı, şirketin net kârının özkaynaklarına bölünmesiyle bulunur",
    "ratio.roa": "Aktif Kârlılığı",
    "ratio.roa.sub":
      "Aktif kârlılığı, şirketin varlıklarını ne kadar etkin kullandığını ölçer",
    "ratio.fcfPerShare": "Hisse Başına Serbest Nakit Akışı",
    "ratio.fcfPerShare.sub":
      "Yatırım harcamalarından sonra kalan nakdin hisse başına ifadesi",
    "ratio.bookValue": "Hisse Başına Defter Değeri (SOA)",
    "ratio.bookValue.sub":
      "Hisse başına defter değeri, şirketin net varlık değerini (toplam varlıklar - toplam yükümlülükler) hisse başına gösterir",
    "ratio.dividendYield": "Temettü Verimi (SOA)",
    "ratio.dividendYield.sub":
      "Şirketin hisse fiyatına kıyasla yılda ne kadar temettü ödediğini gösterir",
    "ratio.capex": "Hisse Başına Yatırım Harcaması (SOA)",
    "ratio.capex.sub":
      "Yatırım harcaması, şirketin fiziki varlık edinmek, yenilemek ve sürdürmek için kullandığı tutardır",
    "ratio.graham": "Graham Sayısı",
    "ratio.graham.sub":
      "Temkinli bir yatırımcının bir hisse için ödemesi gereken fiyat aralığının üst sınırıdır",
    "ratio.pe": "F/K Oranı",
    "ratio.pe.sub":
      "Hisse fiyatının hisse başına kâra oranı — piyasanın her birim kâr için ödediği tutar",

    "income.col.date": "Tarih",
    "income.col.revenue": "Hasılat",
    "income.col.costOfRevenue": "Satışların Maliyeti",
    "income.col.depreciation": "Amortisman",
    "income.col.operatingIncome": "Faaliyet Kârı",
    "income.col.incomeBeforeTaxes": "Vergi Öncesi Kâr",
    "income.col.netIncome": "Net Kâr",
    "income.col.netIncomeRatio": "Net Kâr Oranı",
    "income.col.eps": "Hisse Başına Kâr",
    "income.col.epsDiluted": "Seyreltilmiş Hisse Başına Kâr",
    "income.col.grossProfitRatio": "Brüt Kâr Oranı",
    "income.col.operatingIncomeRatio": "Faaliyet Kârı Oranı",
    "income.col.incomeBeforeTaxesRatio": "Vergi Öncesi Kâr Oranı",

    "income.explain.title": "Gelir Tablosunu Anlamak",
    "income.explain.p1.a": "",
    "income.explain.p1.term": "Gelir tablosu",
    "income.explain.p1.b":
      "(kâr-zarar tablosu), bir şirketin ardışık bir raporlama dönemindeki temel finansal hızını ortaya koyar. Toplam",
    "income.explain.p1.topline": "hasılatın (üst satır)",
    "income.explain.p1.c":
      "nasıl faaliyet giderlerine, vergi kalemlerine dönüştüğünü ve sonunda konsolide net",
    "income.explain.p1.bottomline": "kâr ya da zararı (alt satır)",
    "income.explain.why": "Neden Kritik?",
    "income.explain.p2":
      "Bilanço varlık ve yükümlülük ağırlıklarını kaydederken, gelir tablosu doğrudan işletme verimliliğine, ivmeye ve fiyatlama gücüne odaklanır. Yatırımcılar pazar payının ölçeklenebilirliğini ölçmek ve brüt marjların artan sanayi giderlerini aşacak kadar sağlıklı olup olmadığını anlamak için bu tabloyu inceler.",

    "income.metric.margin": "Net Kâr Marjı",
    "income.metric.margin.sub": "Kullanılan sermayenin net kâra dönüşüm verimliliği",
    "income.metric.growth": "Hasılat Büyümesi (Yıllık)",
    "income.metric.growth.sub": "Üst satır ölçeklenebilirlik büyüme ölçütü",
    "income.summary.title": "Gelir Tablosu Performans Analizi",
    "income.summary.badge": "{{status}} GÖRÜNÜM",
    "income.status.STRONG": "GÜÇLÜ",
    "income.status.MODERATE": "ILIMLI",
    "income.status.WEAK": "ZAYIF",
    "income.status.NEUTRAL": "NÖTR",
    "income.summary.strong":
      "Şirket üst satır faaliyetlerini belirgin biçimde büyüttü ve yıllık %{{growth}} hasılat artışı kaydetti. %{{margin}} kâr marjıyla istikrarlı bir net dönüşüm verimliliği korudu; bu da geçtiğimiz mali dönemde sürdürülebilir bir ölçeklenmeye ve dirençli bir risk yönetimine işaret ediyor.",
    "income.summary.weak":
      "Varlık, %{{growth}} negatif hasılat büyümesi ve %{{margin}} seviyesindeki dar kâr dönüşüm marjıyla daralma işaretleri gösteriyor. Bu sıkışma, makroekonomik ölçeklenmede olası zorluklara ya da yapısal iyileştirme gerektiren artan maliyet sınırlarına işaret ediyor.",
    "income.summary.moderate":
      "Karışık teknik göstergeler gözlemleniyor. Üst satır büyümesi veya net kâr marjı hafif bir yavaşlama gösterse de temel kurumsal göstergeler işlevini koruyor. Gelecekteki mali performansı dengelemek için gider kalemlerinin yakından incelenmesi önerilir.",

    "balance.col.year": "Yıl",
    "balance.col.totalAssets": "Toplam Varlıklar",
    "balance.col.currentAssets": "Dönen Varlıklar",
    "balance.col.totalCash": "Toplam Nakit",
    "balance.col.property": "Maddi Duran Varlıklar",
    "balance.col.intangible": "Maddi Olmayan Varlıklar",
    "balance.col.longTermDebt": "Uzun Vadeli Borç",
    "balance.col.totalDebt": "Toplam Borç",
    "balance.col.totalLiabilities": "Toplam Yükümlülükler",
    "balance.col.currentLiabilities": "Kısa Vadeli Yükümlülükler",
    "balance.col.longTermTaxes": "Uzun Vadeli Gelir Vergileri",
    "balance.col.equity": "Özkaynaklar",
    "balance.col.retainedEarnings": "Geçmiş Yıl Kârları",

    "balance.explain.title": "Bilançoyu Anlamak",
    "balance.explain.p1.a": "",
    "balance.explain.p1.term": "Bilanço",
    "balance.explain.p1.b":
      ", bir şirketin belirli bir andaki yapısal sağlığının finansal fotoğrafıdır. Kurumun neye",
    "balance.explain.p1.owns": "sahip olduğunu (varlıklar)",
    "balance.explain.p1.c": ", neyi",
    "balance.explain.p1.owes": "borçlu olduğunu (yükümlülükler)",
    "balance.explain.p1.d": "ve ortakların yatırdığı net sermayeyi",
    "balance.explain.p1.equity": "(özkaynaklar)",
    "balance.explain.p1.e":
      "muhasebenin temel denklemine göre açıkça gösterir: Varlıklar = Yükümlülükler + Özkaynaklar.",
    "balance.explain.why": "Neden Kritik?",
    "balance.explain.p2":
      "Gelir tablosu performans hızını gösterirken, bilanço ağırlıklı olarak likiditeye, ödeme gücü risklerine ve sermaye yapısının sürdürülebilirliğine odaklanır. Analistler sermaye kaldıraç risklerini hesaplamak ve varlıkların güvenli biçimde mi büyüdüğünü yoksa teminatsız kredilerle tehlikeli biçimde mi şiştiğini değerlendirmek için bu kalemleri inceler.",

    "balance.metric.dte": "Borç / Özkaynak Oranı",
    "balance.metric.dte.sub":
      "Toplam yükümlülüklerin toplam özkaynaklara bölünmesiyle bulunan kaldıraç",
    "balance.metric.turnover": "Aktif Devir Hızı",
    "balance.metric.turnover.sub":
      "Şirket varlıklarının hasılat üretmedeki verimliliği",
    "balance.summary.title": "Bilanço Yapısal Analizi",
    "balance.summary.badge": "{{status}} YAPI",
    "balance.status.STABLE": "DENGELİ",
    "balance.status.LEVERAGED": "KALDIRAÇLI",
    "balance.status.CAUTIOUS": "TEMKİNLİ",
    "balance.status.NEUTRAL": "NÖTR",
    "balance.summary.stable":
      "Bilanço yapısı dengeli bir sermaye mimarisi sunuyor. Borç/özkaynak kaldıraç ölçütü {{dte}} seviyesinde korunuyor; bu da faaliyet büyümesinin riskli borçlanma yerine sermaye rezervleriyle güvenle desteklendiğini doğruluyor. Ayrıca {{turnover}} seviyesindeki aktif devir hızı, varlıkların hasılat üretmek için verimli kullanıldığını gösteriyor.",
    "balance.summary.leveraged":
      "Teknik tarama yoğun kaldıraçlı bir bilanço dağılımına işaret ediyor. Borç/özkaynak oranı {{dte}} gibi agresif bir seviyede; bu da yükümlülüklerin özkaynak tamponunu belirgin biçimde aştığı anlamına geliyor. Kredi hatlarını makro oynaklığa karşı korumak için yapısal düzenlemeler ya da uzun vadeli yeniden yapılandırma gerekebilir.",
    "balance.summary.cautious":
      "Varlık verimliliği göstergeleri hafif bir yavaşlamaya işaret ediyor. Sermaye ölçütleri {{dte}} borç/özkaynak profiliyle güvenli görünse de, aktif devir hızı {{turnover}} ile beklenenin altında. Bu, sermayenin piyasa devrini iyileştirmek yerine atıl fiziki varlıklarda ya da stoklarda sıkıştığını gösteriyor.",

    "cashflow.col.date": "Tarih",
    "cashflow.col.operating": "Faaliyet Nakit Akışı",
    "cashflow.col.investing": "Yatırım Nakit Akışı",
    "cashflow.col.financing": "Finansman Nakit Akışı",
    "cashflow.col.cashAtEnd": "Dönem Sonu Nakit",
    "cashflow.col.capex": "Yatırım Harcaması",
    "cashflow.col.issuance": "Hisse İhracı",
    "cashflow.col.freeCashFlow": "Serbest Nakit Akışı",

    "cashflow.explain.title": "Nakit Akış Tablosunu Anlamak",
    "cashflow.explain.p1.a": "",
    "cashflow.explain.p1.term": "Nakit akış tablosu",
    "cashflow.explain.p1.b":
      ", bir işletmeye giren ve çıkan nakdin gerçek hareketini izler. Muhasebe kalemlerini ayrıştırarak hazine hareketlerini üç temel başlığa böler:",
    "cashflow.explain.p1.operating": "Faaliyet",
    "cashflow.explain.p1.operating.note": "(esas işten gelen nakit),",
    "cashflow.explain.p1.investing": "Yatırım",
    "cashflow.explain.p1.investing.note": "(varlık alımları ve yatırım harcamaları) ve",
    "cashflow.explain.p1.financing": "Finansman",
    "cashflow.explain.p1.financing.note": "(borç ve özkaynak hareketleri).",
    "cashflow.explain.why": "Neden Kritik?",
    "cashflow.explain.p2.a":
      "Gelir tablosu tahakkuk esasıyla kâğıt üzerinde net kâr gösterebilirken, nakit akış tablosu şirketin yükümlülüklerini karşılayacak gerçek likiditeye sahip olup olmadığını ortaya koyar. Belirleyici",
    "cashflow.explain.p2.fcf": "serbest nakit akışı (FCF)",
    "cashflow.explain.p2.b":
      "ölçütünü verir ve temettü dağıtmak ya da hisse geri almak için gerçekte ne kadar sermaye kaldığını gösterir.",

    "cashflow.metric.cycle": "Nakit Dönüşüm Süresi",
    "cashflow.metric.cycle.sub":
      "Kaynak yatırımlarının yeniden nakde dönmesi için gereken gün sayısı",
    "cashflow.metric.days": "{{count}} Gün",
    "cashflow.metric.yield": "Serbest Nakit Akışı Verimi",
    "cashflow.metric.yield.sub":
      "Faaliyet nakit akışının serbest sermayeye dönüşen kısmı",
    "cashflow.summary.title": "Nakit Akışı Likidite Performans Analizi",
    "cashflow.summary.badge": "{{status}} SİSTEM",
    "cashflow.status.LIQUID": "LİKİT",
    "cashflow.status.CAPEX_HEAVY": "YATIRIM_AĞIRLIKLI",
    "cashflow.status.NEUTRAL": "NÖTR",
    "cashflow.summary.liquid":
      "Şirket güçlü bir nakit üretme hızı gösteriyor. Serbest nakit akışı verimliliği %{{yield}} seviyesinde; bu da esas faaliyetlerden gelen nakdin etkin biçimde serbest likiditeye dönüştüğünü gösteriyor. {{cycle}} günlük kısa nakit dönüşüm süresiyle birlikte şirket, sermaye projelerini sulandırma riski olmadan fonlayacak hazine serbestliğini koruyor.",
    "cashflow.summary.capexHeavy":
      "Veriler sermaye yoğun bir faaliyet dönemine işaret ediyor. Esas faaliyetler nakit üretse de, yoğun yatırım harcamaları nedeniyle serbest nakit akışı verimi %{{yield}} seviyesine sıkışmış durumda. Bu, organik yatırım getirilerine ulaşmadan önce sıkı bir aşama yönetimi gerektiren kısa vadeli bir hazine daralmasına işaret ediyor.",
  },
}
