/** Ortak sayfa şablonu (header + footer). */

import { kacisMetni } from "../lib/html.js";

const SITE_ADI = "Planet Film Site";

/**
 * @param {object} secenekler
 * @param {string} secenekler.baslik   Sayfa başlığı (site adı otomatik eklenir)
 * @param {string} secenekler.icerik   Sayfanın <main> içeriği (HTML)
 * @param {string} [secenekler.aktifMenu] Aktif menü öğesinin yolu, örn. "/filmler"
 * @param {string} [secenekler.aciklama] Meta açıklama
 * @param {object|null} [secenekler.kullanici] Oturumdaki kullanıcı (yoksa null)
 * @param {string[]} [secenekler.betikler] Sayfaya özel ek JS dosyaları
 */
export function sayfaSablonu({
  baslik,
  icerik,
  aktifMenu = "",
  aciklama = "",
  kullanici = null,
  betikler = [],
}) {
  const menuOgeleri = [
    { yol: "/", etiket: "Ana Sayfa" },
    { yol: "/filmler", etiket: "Filmler" },
  ];

  // Giriş yapan üyeye profil (listeler) bağlantısı (spec Bölüm 4.3/9).
  if (kullanici) {
    menuOgeleri.push({ yol: "/profil", etiket: "Profil" });
  }

  // Yöneticiye TMDB'den film ekleme bağlantısı (spec Bölüm 4.6).
  if (kullanici?.rol === "yonetici") {
    menuOgeleri.push({ yol: "/admin/filmler/ekle", etiket: "Film Ekle" });
  }

  const menuHtml = menuOgeleri
    .map(({ yol, etiket }) => {
      const aktif = yol === aktifMenu ? ' aria-current="page"' : "";
      return `<li><a href="${yol}"${aktif}>${etiket}</a></li>`;
    })
    .join("\n          ");

  // Oturum durumuna göre menü: giriş yapılmışsa kullanıcı adı + çıkış.
  const oturumHtml = kullanici
    ? `<span class="kullanici-etiketi">${kacisMetni(kullanici.kullaniciAdi)}</span>
          <form class="menu-cikis" action="/cikis" method="post">
            <button class="dugme dugme-ikincil" type="submit">Çıkış</button>
          </form>`
    : `<a class="dugme dugme-ikincil" href="/giris">Giriş</a>
          <a class="dugme dugme-birincil" href="/kayit">Kayıt Ol</a>`;

  const ekBetikler = betikler
    .map((yol) => `<script type="module" src="${yol}"></script>`)
    .join("\n  ");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${baslik ? `${kacisMetni(baslik)} — ${SITE_ADI}` : SITE_ADI}</title>
  ${aciklama ? `<meta name="description" content="${kacisMetni(aciklama)}">` : ""}
  <link rel="stylesheet" href="/css/theme.css">
  <link rel="stylesheet" href="/css/style.css">
  <script src="/js/menu.js" defer></script>
  ${ekBetikler}
</head>
<body>
  <a class="atlama-baglantisi" href="#icerik">İçeriğe geç</a>

  <header class="ust-bilgi">
    <div class="kap">
      <a class="logo" href="/">Planet<span>Film</span></a>

      <button class="menu-dugmesi" type="button" aria-expanded="false" aria-controls="ana-menu">
        <span class="menu-dugmesi-cizgi"></span>
        <span class="gizli-metin">Menüyü aç</span>
      </button>

      <nav id="ana-menu" class="ana-menu" aria-label="Ana menü">
        <ul>
          ${menuHtml}
        </ul>
        <div class="menu-oturum">
          ${oturumHtml}
        </div>
      </nav>
    </div>
  </header>

  <main id="icerik" class="icerik">
    <div class="kap">
${icerik}
    </div>
  </main>

  <footer class="alt-bilgi">
    <div class="kap">
      <div class="alt-bilgi-tmdb">
        <img class="tmdb-logo" src="/images/tmdb-logo.svg" alt="TMDB" width="90" height="12" loading="lazy">
        <p class="tmdb-bildirimi">
          Bu ürün TMDB API'sini kullanır ancak TMDB tarafından onaylanmamış veya sertifikalandırılmamıştır.
        </p>
      </div>
      <p class="telif">© ${new Date().getFullYear()} ${SITE_ADI}</p>
    </div>
  </footer>
</body>
</html>`;
}
