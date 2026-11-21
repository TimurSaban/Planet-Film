# Planet Film Site

Film inceleme, puanlama ve yorum sitesi. Arayüz tamamen Türkçe; düz HTML/CSS/JS + Node.js (Express) + Prisma.

> **Durum:** Aşama 1–6 tamamlandı; Aşama 7'nin tasarım ve mobil kontrolleri yapıldı, yayın adımı bekliyor. Filmler TMDB'den yönetici tarafından aktarılır.

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

Migration uygulanır, `prisma/dev.db` oluşur; `users`, `movies`, `turler`, `film_turleri`, `user_lists`, `ratings` ve `reviews` tabloları hazır olur. (`Cannot find module '@prisma/client'` hatası alırsanız `npx prisma generate` çalıştırın.)

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

## Puan ve yorumlar (Aşama 5)

### Puanlama

- Film detayındaki **Puanlar** bölümünden 1–10 arası tam sayı puan verilir; puan vermek için giriş gerekir
- Her kullanıcının film başına tek puanı vardır; yeni puan eskisinin üzerine yazar (`ratings` tablosunda `(kullanici_id, film_id)` benzersiz)
- Ortalama puan ve toplam puan sayısı film detayında gösterilir; puan metni istenmez (spec 4.4)

### Yorumlar

- Detay sayfasında **Spoilersız** ve **Spoilerlı** sekmeleri ayrı yorumları gösterir
- Bir kullanıcı bir film için her türden en fazla bir yorum yazar; form aynı türde tekrar gönderildiğinde yorum güncellenir (`reviews` tablosunda `(kullanici_id, film_id, tur)` benzersiz)
- Kullanıcı yalnızca kendi yorumunu düzenleyip silebilir; yönetici moderasyonu Aşama 6'da eklenecek
- Spoilerlı yorumlar doğrudan görünmez: "Spoiler uyarısı" katmanı açılmadan içerik gösterilmez (JavaScript gerekmez, `<details>` kullanılır)
- Yorumlar moderasyon kuyruğuna girmez, doğrudan yayınlanır
- `/profil?sekme=yorumlar` — kullanıcının yazdığı yorumlar; buradan düzenleme ve silme yapılabilir

Yorum içeriği 3–5000 karakter arasında doğrulanır; bu sınır spec'te belirtilmediği için boş/anlamsız girdiyi engelleyecek şekilde seçilmiştir.

## Yönetici paneli (Aşama 6)

Menüdeki **Yönetim** bağlantısı (`/admin`) yalnızca `yonetici` rolüne açıktır; üyeler ana sayfaya yönlendirilir. Panel sekmeleri:

- **Genel Bakış** — film, yayında film, kullanıcı, yorum ve puan sayaçları
- **Filmler** — yayında olsun olmasın tüm filmler, başlıkla arama ve sayfalama; satırdan düzenleme, yayından kaldırma/yeniden yayınlama
- **Yorumlar** — tüm yorumlar (spoiler rozetiyle); yönetici herhangi bir yorumu silebilir
- **Kullanıcılar** — liste, puan, yorum sayıları ve hesap durumu; devre dışı bırakma/yeniden etkinleştirme
- **TMDB'den Ekle** — mevcut film aktarma akışı

### Film düzenleme

- Başlık, orijinal başlık, özet, yayın tarihi, süre, yönetmen, oyuncular, poster yolu ve TMDB puanı düzenlenebilir
- Arama metni başlıklardan yeniden üretilir; film aramada güncel başlıkla bulunur
- Yayından kaldırılan film herkese açık listelerde ve detayda görünmez; puan/yorumları silinmez, yeniden yayınlanınca geri gelir

### Kullanıcı devre dışı bırakma

- `users` tablosuna `aktif` alanı eklendi (varsayılan `true`)
- Devre dışı bırakılan kullanıcı giriş yapamaz; açık oturumu bir sonraki istekte kapatılır
- Yönetici kendi hesabını devre dışı bırakamaz (kilitlenmeyi önlemek için)

## Tasarım ve mobil (Aşama 7)

- Tema değişkenleri spec Bölüm 8'e uygun: `#0a0a0a` arka plan, `#141414` yüzey, `rgba(255, 122, 0, 0.88)` turuncu dolgu ve düşük opaklıklı dış parlaklık yalnızca birincil düğme, hover/focus ve aktif sekmelerde kullanılıyor.
- Gövde metni 16 px, satır aralığı 1.6; düğme, form alanı ve sekmelerde dokunma hedefi en az 44 px.
- 360 px genişlikte film ızgarası iki sütuna düşer; yönetici tablosu ve panel sekmeleri sayfayı taşırmadan kendi içinde yatay kayar.
- Masaüstü (1280 px), tablet (768 px) ve telefon (360 px) genişliklerinde ana sayfa, film listesi/detayı, giriş, profil ve yönetici paneli yatay taşma olmadan kontrol edildi.

### Yayın: Render + Neon (ücretsiz)

Ücretsiz ve kalıcı olduğu için **Render web servisi + Neon PostgreSQL** seçildi:

- Render ücretsiz web: 750 saat/ay, 512 MB RAM; 15 dakika boşta kalınca uykuya geçer.
- Neon ücretsiz PostgreSQL: 1 GB veri, ayda 100 CU-saat; veri silinmez, 5 dakika boşta kalınca uykuya geçer.
- Render'ın kendi ücretsiz PostgreSQL'i 30 gün sonra silindiği, Railway'in ücretsiz planı ise aylık 1 $ krediyle sınırlı olduğu için bu ikisi seçilmedi.

Dağıtım yapılandırması `render.yaml` içinde hazır; hesap bağlantısı yapıldığında dağıtım tamamlanacak.

1. Neon'da Frankfurt bölgesinde bir proje açın ve bağlantı dizesini kopyalayın (`?sslmode=require` ekleyin).
2. Projeyi GitHub'a gönderin; Render'da **New → Blueprint** ile repoyu seçin (`render.yaml` otomatik okunur).
3. `DATABASE_URL` ve `TMDB_API_ANAHTARI` değerlerini girin; `SESSION_SECRET` Render tarafından üretilir.
4. Build komutu PostgreSQL istemcisini üretir ve migration'ları uygular; servis `npm run start:production` ile başlar.
5. Render'da `ADMIN_KULLANICI_ADI`, `ADMIN_EMAIL` ve `ADMIN_SIFRE` değişkenlerini girin. Ücretsiz planda shell/SSH olmadığı için ilk açılışta `scripts/admin-bootstrap.js` yöneticiyi bu değerlerden oluşturur; veritabanında yönetici varsa atlanır. Yönetici oluştuktan sonra `ADMIN_SIFRE` değişkenini Render'dan silin.
6. Giriş yapıp filmleri TMDB'den aktarın.

**Ücretsiz plan notları:** Servis uykuya geçtiğinde ilk istek yavaş açılır. Oturumlar şu an express-session'ın bellek deposunda tutulur; servis yeniden başladığında kullanıcılar yeniden giriş yapar. Kalıcı oturum deposu sonraki iyileştirme olarak bırakıldı.

Yerelde SQLite, üretimde PostgreSQL kullanılır. Şema değişikliğinde `prisma/schema.prisma` ve `prisma/postgres/schema.prisma` birlikte güncellenmeli, ardından PostgreSQL migration'ı üretilmelidir.

## Sık karşılaşılan hatalar

**`EADDRINUSE: address already in use :::3000`** — 3000 portu dolu. `.env` içinde `PORT=3001` yapıp tekrar `npm run dev` çalıştırın, tarayıcıda http://localhost:3001 açın.

**`Cannot find module '@prisma/client'` veya Prisma Client hataları** — `npm install` sonrası `npx prisma generate` çalıştırın.

**`Environment variable not found: DATABASE_URL`** — `.env` dosyası yok veya yanlış yerde. Dosya `planet-film-site/.env` olmalı (`src/` içinde değil). 2. adımı uygulayın.

**`--env-file` tanınmıyor / Node sürüm hatası** — Node 20.6'dan eski. Node'u güncelleyin.

**`SESSION_SECRET tanımlı değil` hatası** — `.env` dosyasına `SESSION_SECRET=...` satırı ekleyin (2. adım) ve sunucuyu yeniden başlatın.

**`TMDB_API_ANAHTARI tanımlı değil` veya `TMDB API anahtarı geçersiz`** — `.env` dosyasındaki `TMDB_API_ANAHTARI` değerini kontrol edin; anahtarı değiştirdikten sonra sunucuyu yeniden başlatın.

**Veritabanını sıfırlamak** — `prisma/dev.db` dosyasını silip `npm run veritabani:migrate` çalıştırın; tablolar boş olarak yeniden kurulur.
