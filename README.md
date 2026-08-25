# 🐬 DOL-FIN

[🇹🇷 Türkçe](README.md) | [🇬🇧 English](README.en.md)

[![Frontend CI](https://github.com/EnsarAslannn/DOLFIN/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/EnsarAslannn/DOLFIN/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/EnsarAslannn/DOLFIN/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/EnsarAslannn/DOLFIN/actions/workflows/backend-ci.yml)

.NET Web API ve React (TypeScript) mimarisi üzerine kurulu; kullanıcıların sanal bir
cüzdanla hisse senedi alım-satımı simüle edebildiği, portföylerini takip edebildiği ve
hisse senedi sayfalarına yorum bırakabildiği kurumsal odaklı bir finansal yönetim
platformu.

**🔗 Canlı demo:** [dol-fin.com](https://dol-fin.com) — üye olup sanal cüzdanınızla hisse
senedi alım-satımı ve yorum özelliklerini deneyebilirsiniz.

**📄 Canlı API Dokümantasyonu (Scalar):** [api-production-a1b64.up.railway.app/scalar](https://api-production-a1b64.up.railway.app/scalar)

## 📌 Proje Hakkında

DOL-FIN, önceden ayrı iki repoda (frontend ve backend) geliştirilen kodun, commit
geçmişleri korunarak tek bir monorepo altında birleştirildiği; kullanıcıların sanal bir
cüzdanla hisse senedi alıp satabildiği, portföy dağılımını ve performansını
izleyebildiği, hisse senedi sayfalarına yorum bırakabildiği bir finansal yönetim
platformudur.

Uygulama, harici bir piyasa verisi API'sine bağımlı olmadan; TSLA, NVDA, AAPL, GOOGL ve
MSFT için elle hazırlanmış yerel bir finansal veri seti üzerinde çalışır.

Amaç yalnızca basit bir alım-satım ekranı değil; rol tabanlı yetkilendirme, CSRF korumalı
kimlik doğrulama, Redis destekli cache mekanizması ve monorepo yapısında yürütülen gerçek
bir CI/CD sürecini bir araya getiren uçtan uca bir uygulama ortaya koymaktır.

## ⚙️ Öne Çıkan Özellikler

### 💼 Portföy & Varlık Yönetimi

- Kullanıcı bazlı sanal cüzdan ve varlık takip sistemi
- Nakit bakiye, toplam varlık değeri ve pozisyon bazlı dağılımın tek ekranda görüntülenmesi
- Anlık simüle mevduat (deposit) ve satış (sell) işlemleri
- Maliyet bazına göre hesaplanan gerçekleşmemiş kar/zarar: portföy toplamı ve pozisyon bazında
- Fiyatları periyodik olarak hareket ettiren simülasyon servisi (kar/zarar ve fiyat alarmlarını anlamlı kılar)
- Cüzdan sayfasının sekme görünürken kendini tazelemesi; fiyat hareket ettikçe kar/zarar güncellenir
- Alım, satım, mevduat ve çekim hareketlerinin sayfalanabilir işlem geçmişi

### 🔍 Hisse Arama & Profil

- TSLA, NVDA, AAPL, GOOGL ve MSFT için elle hazırlanmış yerel finansal veri seti
- Hisse senedi arama ve detaylı profil görüntüleme
- Admin yetkisiyle hisse senedi yönetimi

### 🔔 Fiyat Alarmları

- Bir hisse için hedef fiyat ve yön (üstüne çıkarsa / altına düşerse) belirleyerek alarm kurma
- Alarmları dakikada bir kontrol eden arka plan servisi; koşul sağlandığında bildirim üretir
- Navbar'daki zil ikonunda okunmamış bildirim sayacı, açılır panelde bildirim listesi ve
  tek tek ya da toplu okundu işaretleme
- Cüzdan sayfasında bekleyen/tetiklenmiş alarm listesi ve alarm silme

### 👀 Üye Olmadan Gezinme

- Hisse arama, şirket profilleri ve tartışma bölümü giriş yapmadan okunabilir
- Alım-satım, yorum yazma ve alarm kurma hesap gerektirir; ilgili butonlar ziyaretçiyi
  başarısız bir istek yerine giriş sayfasına yönlendirir

### 💬 İlişkisel Yorum Sistemi

- Hisse senedi sembolleriyle (ticker) doğrudan ilişkilendirilmiş dinamik yorum mimarisi
- Sahiplik kontrollü yorum CRUD işlemleri (yalnızca kendi yorumunu düzenleme/silme)
- Yorumları okumak herkese açık; yazmak için giriş gerekir

### 🔐 Güvenli Kimlik Doğrulama & Yetkilendirme

- ASP.NET Core Identity altyapısı, JWT'nin httpOnly cookie üzerinden taşınması (JS'e kapalı)
- Rol tabanlı yetkilendirme (Admin/User)
- Her durum değiştiren istekte double-submit cookie deseniyle CSRF koruması
- Login/register uç noktalarında IP bazlı rate limiting

### ⚡ Cache & Performans

- Redis destekli `HybridCache` (in-process L1 + Redis L2) ile hisse, yorum ve portföy
  okumalarının cache'lenmesi
- Yazma işlemlerinde cache-aside invalidation
- Uygulama açılışında cache warming ve key bazlı hit/miss metrikleri
- Redis çökse dahi sistem doğrudan veritabanına düşerek çalışmaya devam eder (fail-open
  yaklaşım)

### 🩺 Operasyonel Uç Noktalar

- `/health` — PostgreSQL (zorunlu) ve Redis (opsiyonel) için canlılık kontrolü
- `/scalar` — controller XML doc yorumlarından canlı üretilen interaktif API dokümantasyonu
- `/api/diagnostics/cache-metrics` ve `/api/diagnostics/redis-info` — admin'e özel
  cache/Redis izleme uç noktaları

## 🏗️ Proje Mimarisi

Proje, önceden ayrı iki repoda tutulan frontend ve backend kodunu, her ikisinin de commit
geçmişi korunarak tek bir monorepo altında birleştirir:

```
frontend/ → React + TypeScript + Vite istemcisi
backend/  → ASP.NET Core 10 Web API + PostgreSQL
```

Backend kendi içinde katmanlı bir yapıya sahiptir:

```
Controllers/ → API uç noktaları (Account, Stock, Portfolio, Comment, PriceAlert)
Service/     → İş mantığı (PortfolioService, RebalancingService, PriceAlertService, TokenService...)
Repository/  → Arayüzler arkasında veri erişimi
Validation/  → FluentValidation validator'ları + global ValidationActionFilter
Dtos/        → İstek/yanıt sözleşmeleri
Models/      → EF Core entity'leri
Migrations/  → EF Core migration'ları
```

Her iki alt klasör de kendi bağımsız proje dosyalarını (`package.json`, `api.csproj`,
kendi `.gitignore`'ları, kendi `.env.example`'ları vb.) korur — birleştirme sadece dizin
yapısını değiştirdi, build/test komutları yukarıdaki gibi çalışmaya devam ediyor. Backend'in
ayrıntıları için [backend/README.md](./backend/README.md), mimari döküm için
[ARCHITECTURE.md](./ARCHITECTURE.md).

## 🛠️ Kullanılan Teknolojiler

**Backend**

- .NET 10, ASP.NET Core Web API
- PostgreSQL (Entity Framework Core / Npgsql)
- Redis (StackExchangeRedis + HybridCache)
- ASP.NET Core Identity, JWT (httpOnly cookie)
- FluentValidation, Serilog, Scalar

**Frontend**

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Axios

**Test**

- xUnit, Moq, Testcontainers (backend)
- Vitest, React Testing Library, Playwright (frontend)

**CI/CD**

- GitHub Actions — `frontend-ci.yml` ve `backend-ci.yml`, yalnızca ilgili klasörde
  değişiklik olduğunda (`paths:` filtresiyle) tetiklenir
- Backend: çok aşamalı (multi-stage) Docker image ile Railway üzerinde, `/health` uç
  noktası deploy healthcheck'i olarak kullanılır

## 🚀 Kurulum

### Gereksinimler

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 22+
- Docker (Postgres ve Redis servisleri için)

### Backend

```bash
cd backend
docker compose up -d redis

dotnet user-secrets init --project api.csproj
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=dolfin;Username=postgres;Password=..." --project api.csproj
dotnet user-secrets set "JWT:SigningKey" "<en az 64 karakterlik bir anahtar>" --project api.csproj

dotnet restore
dotnet ef database update --project api.csproj
dotnet run --project api.csproj # https://localhost:7109 — /scalar üzerinden API dokümantasyonu
```

> Alternatif olarak `docker compose up -d --build` ile API + Postgres + Redis'i tek
> komutla ayağa kaldırabilirsiniz.

### Frontend

```bash
cd frontend
npm install
```

`.env` dosyası oluşturup API adresini tanımlayın:

```env
VITE_API_URL=https://localhost:7109
```

```bash
npm run dev
```

### Testler

```bash
# Backend
dotnet test api.sln

# Frontend
npm run lint
npm test        # birim testleri (Vitest)
npm run build
npm run test:e2e # uçtan uca testler (Playwright) — önce build gerektirir
```

> Backend entegrasyon testleri için Docker'ın çalışıyor olması gerekir.

## 📸 Proje Görselleri

**Ana Sayfa**

<p align="center">
<img src="frontend/docs/screenshots/homePage.png" width="800"/>
<img src="frontend/docs/screenshots/homePage2.png" width="800"/>
</p>

**Arama & Portföy**

<p align="center">
<img src="frontend/docs/screenshots/searchPage.png" width="800"/>
</p>

**Hisse Profili**

<p align="center">
<img src="frontend/docs/screenshots/companyProfile.png" width="800"/>
</p>

**Cüzdan**

<p align="center">
<img src="frontend/docs/screenshots/walletPage.png" width="800"/>
</p>

## 📄 Lisans

MIT — bkz. [LICENSE](./LICENSE).
