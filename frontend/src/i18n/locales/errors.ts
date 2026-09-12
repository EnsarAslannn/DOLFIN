// Everything the API can tell the user went wrong, plus the two sentences the
// client raises on its own behalf.
//
// The API answers an error with a stable code from its ErrorCodes class and an
// English message. Before these keys existed the message was what got
// toasted, so a Turkish user read "Insufficient funds. Required: $420.00" in
// an otherwise Turkish app. Each code maps to "error.<code>" here; an
// unrecognised code still falls back to the server's sentence, so a new error
// on the API reads as untranslated copy rather than as a blank toast.
//
// The {{vars}} come from the error's `args`, which the API sends alongside the
// code precisely so the numbers can be dropped into a sentence with the words
// in whatever order the language wants them.
export const errors = {
  en: {
    "error.unexpected": "Something went wrong. Please try again.",
    "error.session.expired": "Your session has ended. Please sign in again.",

    "error.account.invalidCredentials": "Incorrect username or password.",
    "error.account.lockedOut":
      "Too many failed attempts. This account is locked for 15 minutes.",
    "error.account.userContextNotFound":
      "We could not identify your account. Please sign in again.",

    "error.portfolio.quantityNotPositive": "Enter a quantity above zero.",
    "error.portfolio.stockNotFound": "That stock is not in the catalog.",
    "error.portfolio.insufficientFunds":
      "Not enough cash. This costs ${{required}} and you have ${{available}}.",
    "error.portfolio.insufficientShares":
      "You hold {{held}} {{symbol}}, so you cannot sell {{requested}}.",
    "error.portfolio.depositNotPositive": "Enter an amount above zero to add.",
    "error.portfolio.withdrawNotPositive":
      "Enter an amount above zero to withdraw.",
    "error.portfolio.insufficientBalance":
      "You asked for ${{requested}} but your balance is ${{available}}.",
    "error.portfolio.concurrentUpdate":
      "Another request changed your account while this one was running. Please try again.",

    "error.alert.targetPriceNotPositive": "Enter a target price above zero.",
    "error.alert.stockNotFound": "That stock is not in the catalog.",
    "error.alert.duplicatePending":
      "You are already watching {{symbol}} at ${{targetPrice}}.",
    "error.alert.notFound": "That alert no longer exists.",
    "error.alert.notificationNotFound": "That notification no longer exists.",

    "error.comment.stockNotFound": "That stock is not in the catalog.",
    "error.comment.notFound": "That comment no longer exists.",

    "error.stock.notFound": "That stock is not in the catalog.",
    "error.stock.symbolTaken": "A stock with the symbol {{symbol}} already exists.",
    "error.stock.trendsNotFound": "Market trends are unavailable right now.",

    // Composed from the alert the notification came from, rather than from a
    // sentence the server wrote in English at trigger time.
    "alerts.notification.rose": "{{symbol}} rose to ${{price}} (target ${{target}}).",
    "alerts.notification.fell": "{{symbol}} fell to ${{price}} (target ${{target}}).",
    "alerts.notification.triggered": "{{symbol}} reached its ${{target}} target.",

    "portfolio.warning.concentration":
      "{{symbol}} is {{percent}}% of your portfolio. Consider diversifying.",
    "portfolio.warning.sector":
      "{{industry}} makes up {{percent}}% of your portfolio. That is a lot riding on one sector.",
  },
  tr: {
    "error.unexpected": "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
    "error.session.expired": "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",

    "error.account.invalidCredentials": "Kullanıcı adı veya parola hatalı.",
    "error.account.lockedOut":
      "Çok fazla hatalı deneme yapıldı. Bu hesap 15 dakika kilitli.",
    "error.account.userContextNotFound":
      "Hesabınızı tanıyamadık. Lütfen tekrar giriş yapın.",

    "error.portfolio.quantityNotPositive": "Sıfırdan büyük bir adet girin.",
    "error.portfolio.stockNotFound": "Bu hisse katalogda yok.",
    "error.portfolio.insufficientFunds":
      "Bakiyeniz yetmiyor. Bu işlem ${{required}} tutuyor, elinizde ${{available}} var.",
    "error.portfolio.insufficientShares":
      "Elinizde {{held}} adet {{symbol}} var, {{requested}} adet satamazsınız.",
    "error.portfolio.depositNotPositive": "Eklemek için sıfırdan büyük bir tutar girin.",
    "error.portfolio.withdrawNotPositive": "Çekmek için sıfırdan büyük bir tutar girin.",
    "error.portfolio.insufficientBalance":
      "${{requested}} istediniz ama bakiyeniz ${{available}}.",
    "error.portfolio.concurrentUpdate":
      "Bu işlem sürerken başka bir istek hesabınızı değiştirdi. Lütfen tekrar deneyin.",

    "error.alert.targetPriceNotPositive": "Sıfırdan büyük bir hedef fiyat girin.",
    "error.alert.stockNotFound": "Bu hisse katalogda yok.",
    "error.alert.duplicatePending":
      "{{symbol}} hissesini zaten ${{targetPrice}} seviyesinde izliyorsunuz.",
    "error.alert.notFound": "Bu alarm artık mevcut değil.",
    "error.alert.notificationNotFound": "Bu bildirim artık mevcut değil.",

    "error.comment.stockNotFound": "Bu hisse katalogda yok.",
    "error.comment.notFound": "Bu yorum artık mevcut değil.",

    "error.stock.notFound": "Bu hisse katalogda yok.",
    "error.stock.symbolTaken": "{{symbol}} kodlu bir hisse zaten var.",
    "error.stock.trendsNotFound": "Piyasa hareketlerine şu an ulaşılamıyor.",

    "alerts.notification.rose": "{{symbol}} ${{price}} seviyesine yükseldi (hedef ${{target}}).",
    "alerts.notification.fell": "{{symbol}} ${{price}} seviyesine düştü (hedef ${{target}}).",
    "alerts.notification.triggered": "{{symbol}} ${{target}} hedefine ulaştı.",

    "portfolio.warning.concentration":
      "{{symbol}} portföyünüzün %{{percent}}'i. Dağıtmayı düşünün.",
    "portfolio.warning.sector":
      "{{industry}} portföyünüzün %{{percent}}'ini oluşturuyor. Tek bir sektöre fazla yüklenmişsiniz.",
  },
}
