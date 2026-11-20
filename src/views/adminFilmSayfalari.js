import { kacisMetni } from "../lib/html.js";
import { posterAdresi } from "../lib/tmdb.js";

function ozetKisalt(ozet, uzunluk = 220) {
  const metin = String(ozet ?? "").replace(/\s+/g, " ").trim();
  if (metin.length <= uzunluk) return metin;
  return `${metin.slice(0, uzunluk).trimEnd()}…`;
}

function sonucKarti(film, mevcutFilmler, q) {
  const mevcut = mevcutFilmler[film.tmdbId];

  return `
        <li class="tmdb-sonuc">
          <img class="tmdb-poster" src="${kacisMetni(posterAdresi(film.posterYolu, "w185"))}"
               alt="" width="185" height="278" loading="lazy">
          <div class="tmdb-bilgi">
            <h3>${kacisMetni(film.baslik)}${film.yil ? ` <span class="tmdb-yil">(${kacisMetni(film.yil)})</span>` : ""}</h3>
            <p class="film-alt-bilgi">${film.puan > 0 ? `TMDB ${film.puan.toFixed(1)}` : "TMDB puanı yok"}</p>
            <p class="tmdb-ozet">${film.ozet ? kacisMetni(ozetKisalt(film.ozet)) : "Özet bulunmuyor."}</p>
          </div>
          <div class="tmdb-eylem">
            ${
              mevcut
                ? `<a class="dugme dugme-ikincil" href="/filmler/${mevcut.id}">Zaten ekli</a>`
                : `<form method="post" action="/admin/filmler/aktar">
              <input type="hidden" name="tmdbId" value="${film.tmdbId}">
              <input type="hidden" name="q" value="${kacisMetni(q)}">
              <button class="dugme dugme-birincil" type="submit">Aktar</button>
            </form>`
            }
          </div>
        </li>`;
}

/** /admin/filmler/ekle sayfası: TMDB araması ve aktarma. */
export function adminFilmEkleIcerigi({
  q = "",
  arama = null,
  hata = null,
  eklendi = null,
  zaten = null,
  mevcutFilmler = {},
}) {
  const bildirimler = [];

  if (eklendi) {
    bildirimler.push(
      `<p class="bildirim bildirim-basari" role="status">Film veritabanına aktarıldı. <a href="/filmler/${eklendi.id}">Film sayfasına git</a></p>`
    );
  }
  if (zaten) {
    bildirimler.push(
      `<p class="bildirim" role="status">Bu film zaten ekli. <a href="/filmler/${zaten.id}">Film sayfasına git</a></p>`
    );
  }
  if (hata) {
    bildirimler.push(`<p class="form-hatasi" role="alert">${kacisMetni(hata)}</p>`);
  }

  let sonuclar = "";
  if (arama) {
    if (!arama.sonuclar.length) {
      sonuclar = `<p class="bos-durum">"${kacisMetni(q)}" için TMDB'de sonuç bulunamadı.</p>`;
    } else {
      sonuclar = `
        <p class="sonuc-sayisi">TMDB'de ${arama.toplam} sonuç bulundu; ilk ${arama.sonuclar.length} tanesi gösteriliyor.</p>
        <ul class="tmdb-sonuclari">
${arama.sonuclar.map((film) => sonucKarti(film, mevcutFilmler, q)).join("\n")}
        </ul>`;
    }
  }

  return `
      <section class="sayfa-basligi">
        <h1>TMDB'den Film Ekle</h1>
        <p class="kahraman-metin">Film adıyla TMDB'de arayın, doğru sonucu seçip veritabanına aktarın.</p>
      </section>

      ${bildirimler.join("\n      ")}

      <form class="filtre-formu" method="get" action="/admin/filmler/ekle" role="search">
        <div class="filtre-alani filtre-arama">
          <label for="q">Film adı</label>
          <input id="q" name="q" type="search" maxlength="100" value="${kacisMetni(q)}"
                 placeholder="Örn. Yüzüklerin Efendisi" required>
        </div>
        <div class="filtre-eylemler">
          <button class="dugme dugme-birincil" type="submit">TMDB'de Ara</button>
        </div>
      </form>

      ${sonuclar}`;
}
