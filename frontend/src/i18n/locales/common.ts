// Chrome shared across every route: the navbar, the footer and the handful of
// states (loading, crash, empty) that any page can end up rendering.
export const common = {
  en: {
    "lang.toggle.label": "Language",
    "lang.tr.full": "Turkish",
    "lang.en.full": "English",

    "nav.howItWorks": "How it works",
    "nav.helpCenter": "Help Center",
    "nav.search": "Search",
    "nav.wallet": "Wallet",
    "nav.logout": "Logout",
    "nav.login": "Log in",
    "nav.createAccount": "Create account",
    "nav.openMenu": "Open menu",
    "nav.closeMenu": "Close menu",
    "nav.mobileLabel": "Mobile",

    // Shown when a session ends mid-use -- the token expired, or it was
    // revoked -- instead of reloading the whole app onto the sign-in page.
    "session.expired.title": "Your session has ended",
    "session.expired.description":
      "You have been signed out. Sign in again to pick up where you left off.",
    "session.expired.cta": "Sign in again",

    "footer.tagline":
      "Find the signal beneath the noise. Fundamentals, filings and portfolio tracking in one sandboxed terminal.",
    "footer.col.platform": "Platform",
    "footer.col.account": "Account",
    "footer.col.company": "Company",
    "footer.copyright": "© 2026 DOL-FIN",
    "footer.disclaimer": "Simulated data · run in a secure sandbox",

    "state.loading": "Loading",
    "state.error.title": "Something went wrong",
    "state.error.body":
      "The page hit an unexpected error. Reloading usually clears it.",
    "state.error.retry": "Reload the page",
  },
  tr: {
    "lang.toggle.label": "Dil",
    "lang.tr.full": "Türkçe",
    "lang.en.full": "İngilizce",

    "nav.howItWorks": "Nasıl çalışır",
    "nav.helpCenter": "Yardım Merkezi",
    "nav.search": "Arama",
    "nav.wallet": "Cüzdan",
    "nav.logout": "Çıkış yap",
    "nav.login": "Giriş yap",
    "nav.createAccount": "Hesap oluştur",
    "nav.openMenu": "Menüyü aç",
    "nav.closeMenu": "Menüyü kapat",
    "nav.mobileLabel": "Mobil",

    "session.expired.title": "Oturumunuz sona erdi",
    "session.expired.description":
      "Oturumunuz kapatıldı. Kaldığınız yerden devam etmek için tekrar giriş yapın.",
    "session.expired.cta": "Tekrar giriş yap",

    "footer.tagline":
      "Gürültünün altındaki sinyali bulun. Temel veriler, resmi raporlar ve portföy takibi tek bir korumalı terminalde.",
    "footer.col.platform": "Platform",
    "footer.col.account": "Hesap",
    "footer.col.company": "Kurumsal",
    "footer.copyright": "© 2026 DOL-FIN",
    "footer.disclaimer": "Simülasyon verisi · korumalı bir ortamda çalışır",

    "state.loading": "Yükleniyor",
    "state.error.title": "Bir şeyler ters gitti",
    "state.error.body":
      "Sayfa beklenmedik bir hatayla karşılaştı. Yeniden yüklemek genellikle sorunu giderir.",
    "state.error.retry": "Sayfayı yeniden yükle",
  },
}
