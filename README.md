# Planet Film Site

Film inceleme, puanlama ve yorum sitesi. Arayüz tamamen Türkçe; düz HTML/CSS/JS + Node.js (Express) + Prisma.

> **Durum:** Aşama 1–4 tamamlandı (iskelet/tema, üyelik, filmler, listeler). Filmler TMDB'den yönetici tarafından aktarılır; puanlar ve yorumlar sonraki aşamalarda eklenecek.

## Gereksinimler

- **Node.js 20.6 veya üzeri** (proje `node --env-file=.env` kullanıyor) — `node -v` ile kontrol edin
- **npm** (Node ile birlikte gelir)
- PostgreSQL, Docker veya harici veritabanı **gerekmez**: Aşama 1'de SQLite kullanılıyor, veritabanı `prisma/dev.db` adlı tek dosyadır.

## Kurulum

### 1) Paketleri kur

```bash
npm install
```

### 2) `.env` dosyasını oluştur

```bash
cp .env.example .env
```

PowerShell: `Copy-Item .env.example .env`

İçerik:

```
PORT=3000
NODE_ENV=development
SESSION_SECRET=<rastgele-uzun-bir-anahtar>
DATABASE_URL="file:./dev.db"
TMDB_API_ANAHTARI=
```

`SESSION_SECRET` oturum çerezlerini imzalar ve **zorunludur**. Rastgele bir değer üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`.env` git'e eklenmez. **TMDB anahtarı zorunludur** (Aşama 3): https://www.themoviedb.org/settings/api adresinden v3 API anahtarını alıp `TMDB_API_ANAHTARI=` satırına yazın. Anahtar yoksa film ekleme sayfası açıklayıcı bir hata gösterir; veritabanındaki filmler yine listelenir.

### 3) Veritabanını oluştur

```bash
npm run veritabani:migrate
```

Migration uygulanır, `prisma/dev.db` oluşur; `users`, `movies`, `turler`, `film_turleri` ve `user_lists` tabloları hazır olur. (`Cannot find module '@prisma/client'` hatası alırsanız `npx prisma generate` çalıştırın.)

## Çalıştırma

```bash
npm run dev
```

Ardından tarayıcıda **http://localhost:3000** adresini açın. Durdurmak için `Ctrl + C`.

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Sunucuyu izleme modunda başlatır (dosya değişince yeniden başlar) |
| `npm start` | Sunucuyu izleme olmadan başlatır |
| `npm run veritabani:migrate` | Şema değişikliklerini uygular ve Prisma Client'ı üretir |
| `npm run veritabani:studio` | Veritabanını http://localhost:5555 adresinde görüntüler |
| `npm run create-admin` | Terminalde sorarak tek seferlik **yönetici** hesabı oluşturur (zaten yönetici varsa çalışmaz) |

## Üyelik (Aşama 2)

- `/kayit` — kullanıcı adı, e-posta ve şifre ile kayıt; kayıt sonrası otomatik giriş
- `/giris` — e-posta veya kullanıcı adı ile giriş
- Sağ üstteki **Çıkış** düğmesi oturumu kapatır
- API uçları: `POST /api/kayit`, `POST /api/giris`, `POST /api/cikis`, `GET /api/oturum`
- Şifreler bcrypt ile hashlenir, oturum çerezi `httpOnly` + `sameSite=lax` (üretimde `secure`)

**Geliştirme notu:** express-session'ın varsayılan bellek deposu yalnızca geliştirme içindir; sunucu yeniden başladığında oturumlar sıfırlanır. Üretimde kalıcı bir oturum deposu kullanılmalıdır.

## Filmler (Aşama 3)

- `/filmler` — arama (`q`), tür (`tur`) ve yayın durumu (`durum=yayinda|yakinda`) filtresi; sayfa başına 20 film
- `/filmler/:id` — poster, başlık/orijinal başlık, yayın tarihi, süre, türler, yönetmen, oyuncular, özet, TMDB puanı
- Posterler TMDB CDN'inden hotlink ile gösterilir; poster yoksa yerel `public/images/poster-yok.svg` kullanılır
- Veriler yerel veritabanında önbelleklenir; detay sayfası açıldığında 30 günden eski kayıt TMDB'den sessizce yenilenir (TMDB koşulları: en fazla 6 ay)
- TMDB logosu ve "Bu ürün TMDB API'sini kullanır..." bildirimi alt bilgide yer alır
- Yayın tarihi gelecekte olan filmler "Yakında" rozetiyle listede görünür

### Yönetici olarak film ekleme

1. `npm run create-admin` ile yönetici hesabı oluşturun (yoksa)
2. Yönetici hesabıyla giriş yapın; menüde **Film Ekle** görünür → `/admin/filmler/ekle`
3. Film adını aratın, sonuçtaki **Aktar** düğmesine basın; film türleriyle birlikte kaydedilir
4. Aynı film ikinci kez aktarılamaz; sonuçta "Zaten ekli" bağlantısı görünür

`/admin` yolları sunucu tarafında yalnızca `yonetici` rolüne açıktır; üyeler ana sayfaya yönlendirilir.

## Listeler (Aşama 4)

- `/profil` — giriş yapmış üyenin film listeleri; **İzlediklerim** ve **İzleyeceklerim** sekmeleri
- Film sayfasındaki **Listem** bölümünden film `İzledim` ya da `İzleyeceğim` olarak listeye eklenir; aynı film için düğmeye tekrar basmak durumu değiştirir
- **Listeden çıkar** düğmesi kaydı siler
- Her kullanıcı bir filmi listede yalnızca bir kez tutar (`user_lists` tablosunda `(kullanici_id, film_id)` benzersiz)
- `durum` alanı metindir; kitaplar için `okudum`/`okuyacağım` değerleri ileride eklenecek
- Listeye ekleme, durum değiştirme ve çıkarma JS olmadan form POST ile çalışır; işlemler giriş gerektirir

## Sık karşılaşılan hatalar

**`EADDRINUSE: address already in use :::3000`** — 3000 portu dolu. `.env` içinde `PORT=3001` yapıp tekrar `npm run dev` çalıştırın, tarayıcıda http://localhost:3001 açın.

**`Cannot find module '@prisma/client'` veya Prisma Client hataları** — `npm install` sonrası `npx prisma generate` çalıştırın.

**`Environment variable not found: DATABASE_URL`** — `.env` dosyası yok veya yanlış yerde. Dosya `planet-film-site/.env` olmalı (`src/` içinde değil). 2. adımı uygulayın.

**`--env-file` tanınmıyor / Node sürüm hatası** — Node 20.6'dan eski. Node'u güncelleyin.

**`SESSION_SECRET tanımlı değil` hatası** — `.env` dosyasına `SESSION_SECRET=...` satırı ekleyin (2. adım) ve sunucuyu yeniden başlatın.

**`TMDB_API_ANAHTARI tanımlı değil` veya `TMDB API anahtarı geçersiz`** — `.env` dosyasındaki `TMDB_API_ANAHTARI` değerini kontrol edin; anahtarı değiştirdikten sonra sunucuyu yeniden başlatın.

**Veritabanını sıfırlamak** — `prisma/dev.db` dosyasını silip `npm run veritabani:migrate` çalıştırın; tablolar boş olarak yeniden kurulur.
