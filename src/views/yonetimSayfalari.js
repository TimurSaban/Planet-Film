import { kacisMetni } from "../lib/html.js";
import { posterAdresi } from "../lib/tmdb.js";

const TARIH_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const KISA_TARIH = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const SEKMELER = [
  { yol: "/admin", ad: "Genel Bakış", anahtar: "ozet" },
  { yol: "/admin/filmler", ad: "Filmler", anahtar: "filmler" },
  { yol: "/admin/yorumlar", ad: "Yorumlar", anahtar: "yorumlar" },
  { yol: "/admin/kullanicilar", ad: "Kullanıcılar", anahtar: "kullanicilar" },
  { yol: "/admin/filmler/ekle", ad: "TMDB'den Ekle", anahtar: "tmdb" },
];

/** Yönetici paneli sekmeleri. */
export function yonetimSekmeleri(aktif) {
  return `
      <nav class="liste-sekmeleri yonetim-sekmeleri" aria-label="Yönetici paneli">
        ${SEKMELER.map((sekme) => {
          const secili = sekme.anahtar === aktif;
          return `<a class="liste-sekme${secili ? " aktif" : ""}" href="${
            sekme.yol
          }"${secili ? ' aria-current="page"' : ""}>${sekme.ad}</a>`;
        }).join("\n        ")}
      </nav>`;
}

function sayfalama(yol, sayfa, sayfaSayisi, parametreler = {}) {
  if (sayfaSayisi <= 1) return "";

  const adres = (numara) => {
    const sorgu = new URLSearchParams();
    for (const [anahtar, deger] of Object.entries(parametreler)) {
      if (deger) sorgu.set(anahtar, String(deger));
    }
    if (numara > 1) sorgu.set("sayfa", String(numara));
    const metin = sorgu.toString();
    return metin ? `${yol}?${metin}` : yol;
  };

  return `
      <nav class="sayfalama" aria-label="Sayfalar">
        ${
          sayfa > 1
            ? `<a class="dugme dugme-ikincil" href="${adres(sayfa - 1)}">Önceki</a>`
            : ""
        }
        <span class="sonuc-sayisi">Sayfa ${sayfa} / ${sayfaSayisi}</span>
        ${
          sayfa < sayfaSayisi
            ? `<a class="dugme dugme-ikincil" href="${adres(sayfa + 1)}">Sonraki</a>`
            : ""
        }
      </nav>`;
}

function bildirimHtml(bildirim) {
  if (!bildirim) return "";
  return `<p class="bildirim bildirim-basari" role="status">${kacisMetni(bildirim)}</p>`;
}

/** /admin — genel bakış. */
export function yonetimAnaIcerigi({ ozet }) {
  const kartlar = [
    { etiket: "Toplam film", deger: ozet.filmSayisi, yol: "/admin/filmler" },
    { etiket: "Yayında film", deger: ozet.yayindaFilm, yol: "/admin/filmler" },
    { etiket: "Kullanıcı", deger: ozet.kullaniciSayisi, yol: "/admin/kullanicilar" },
    { etiket: "Yorum", deger: ozet.yorumSayisi, yol: "/admin/yorumlar" },
    { etiket: "Puan", deger: ozet.puanSayisi, yol: null },
  ];

  return `
      <section class="sayfa-basligi">
        <h1>Yönetici Paneli</h1>
        <p class="kahraman-metin">Filmleri, yorumları ve kullanıcıları buradan yönetin.</p>
      </section>

      ${yonetimSekmeleri("ozet")}

      <ul class="yonetim-kartlari">
        ${kartlar
          .map(
            (kart) => `
          <li class="yonetim-kart">
            ${
              kart.yol
                ? `<a href="${kart.yol}">
              <span class="yonetim-kart-deger">${kart.deger}</span>
              <span class="yonetim-kart-etiket">${kart.etiket}</span>
            </a>`
                : `<div>
              <span class="yonetim-kart-deger">${kart.deger}</span>
              <span class="yonetim-kart-etiket">${kart.etiket}</span>
            </div>`
            }
          </li>`
          )
          .join("")}
      </ul>

      <section class="bolum">
        <h2>Hızlı İşlemler</h2>
        <div class="liste-eylemler">
          <a class="dugme dugme-birincil" href="/admin/filmler/ekle">TMDB'den Film Ekle</a>
          <a class="dugme dugme-ikincil" href="/admin/filmler">Filmleri Yönet</a>
          <a class="dugme dugme-ikincil" href="/admin/yorumlar">Yorumları Yönet</a>
          <a class="dugme dugme-ikincil" href="/admin/kullanicilar">Kullanıcıları Yönet</a>
        </div>
      </section>`;
}

/** /admin/filmler — tüm filmlerin listesi. */
export function yonetimFilmleriIcerigi({
  filmler,
  toplam,
  sayfa,
  sayfaSayisi,
  arama = "",
  bildirim = null,
}) {
  const satirlar = filmler
    .map((film) => {
      const yil = film.yayinTarihi
        ? new Date(film.yayinTarihi).getUTCFullYear()
        : "—";
      return `
          <tr>
            <td data-etiket="Film">
              <div class="yonetim-film">
                <img class="yonetim-poster" src="${kacisMetni(
                  posterAdresi(film.posterYolu, "w92")
                )}" alt="" width="46" height="69" loading="lazy">
                <div>
                  <strong>${kacisMetni(film.baslik)}</strong>
                  <span class="film-alt-bilgi">${kacisMetni(yil)} · TMDB #${film.tmdbId}</span>
                </div>
              </div>
            </td>
            <td data-etiket="Durum">
              ${
                film.yayinda
                  ? '<span class="durum-rozet durum-yayinda">Yayında</span>'
                  : '<span class="durum-rozet durum-yayinda-degil">Yayında değil</span>'
              }
            </td>
            <td data-etiket="Puan / Yorum">${film._count.puanlar} / ${film._count.yorumlar}</td>
            <td data-etiket="İşlem">
              <div class="yonetim-islemler">
                <a class="dugme dugme-ikincil" href="/admin/filmler/${film.id}/duzenle">Düzenle</a>
                ${
                  film.yayinda
                    ? `<a class="dugme dugme-ikincil" href="/filmler/${film.id}">Görüntüle</a>`
                    : ""
                }
                <form method="post" action="/admin/filmler/${film.id}/yayin">
                  <button class="dugme ${
                    film.yayinda ? "dugme-ikincil" : "dugme-birincil"
                  }" type="submit">${film.yayinda ? "Yayından kaldır" : "Yayınla"}</button>
                </form>
              </div>
            </td>
          </tr>`;
    })
    .join("");

  return `
      <section class="sayfa-basligi">
        <h1>Filmler</h1>
        <p class="kahraman-metin">Film bilgilerini düzenleyin, yayından kaldırın ya da yeniden yayınlayın.</p>
      </section>

      ${yonetimSekmeleri("filmler")}
      ${bildirimHtml(bildirim)}

      <form class="filtre-formu" method="get" action="/admin/filmler" role="search">
        <div class="filtre-alani filtre-arama">
          <label for="q">Film ara</label>
          <input id="q" name="q" type="search" maxlength="100" value="${kacisMetni(
            arama
          )}" placeholder="Başlık">
        </div>
        <div class="filtre-eylemler">
          <button class="dugme dugme-birincil" type="submit">Ara</button>
          <a class="dugme dugme-ikincil" href="/admin/filmler">Temizle</a>
        </div>
      </form>

      ${
        filmler.length
          ? `<p class="sonuc-sayisi">${toplam} film</p>
      <div class="yonetim-tablo-kap">
        <table class="yonetim-tablo">
          <thead>
            <tr><th>Film</th><th>Durum</th><th>Puan / Yorum</th><th>İşlem</th></tr>
          </thead>
          <tbody>${satirlar}
          </tbody>
        </table>
      </div>
      ${sayfalama("/admin/filmler", sayfa, sayfaSayisi, { q: arama })}`
          : `<p class="bos-durum">${
              arama
                ? "Aramanıza uygun film bulunamadı."
                : "Henüz film eklenmedi. TMDB'den Ekle sekmesini kullanın."
            }</p>`
      }`;
}

/** /admin/filmler/:id/duzenle — film bilgileri formu. */
export function filmDuzenleIcerigi({ film, degerler, hatalar = {}, hata = null }) {
  const alan = (ad, etiket, ek = "") => `
          <div class="form-alani">
            <label for="${ad}">${etiket}</label>
            <input id="${ad}" name="${ad}" type="text" value="${kacisMetni(
              degerler[ad] ?? ""
            )}"${ek}>
            ${hatalar[ad] ? `<p class="alan-hatasi">${kacisMetni(hatalar[ad])}</p>` : ""}
          </div>`;

  const tarihDegeri = degerler.yayinTarihi
    ? String(degerler.yayinTarihi).slice(0, 10)
    : "";

  return `
      <section class="sayfa-basligi">
        <h1>Filmi Düzenle</h1>
        <p class="kahraman-metin">${kacisMetni(
          film.baslik
        )} — değişiklikler kaydedildiğinde film sayfasına yansır.</p>
      </section>

      ${yonetimSekmeleri("filmler")}

      <div class="film-duzenle-kap">
        <div class="film-duzenle-poster">
          <img src="${kacisMetni(
            posterAdresi(film.posterYolu, "w342")
          )}" alt="${kacisMetni(film.baslik)} posteri" width="342" height="513">
          <p class="film-alt-bilgi">TMDB #${film.tmdbId}${
            film.turler?.length
              ? ` · ${film.turler.map((kayit) => kacisMetni(kayit.tur.ad)).join(", ")}`
              : ""
          }</p>
        </div>

        <div>
          ${
            hata
              ? `<p class="form-hatasi" role="alert">${kacisMetni(hata)}</p>`
              : ""
          }
          <form class="form yonetim-formu" method="post" action="/admin/filmler/${
            film.id
          }/duzenle">
            ${alan("baslik", "Başlık", ' required maxlength="200"')}
            ${alan("orijinalBaslik", "Orijinal başlık", ' required maxlength="200"')}

            <div class="form-alani">
              <label for="ozet">Özet</label>
              <textarea id="ozet" name="ozet" rows="6" maxlength="5000">${kacisMetni(
                degerler.ozet ?? ""
              )}</textarea>
              ${hatalar.ozet ? `<p class="alan-hatasi">${kacisMetni(hatalar.ozet)}</p>` : ""}
            </div>

            <div class="form-ikili">
              <div class="form-alani">
                <label for="yayinTarihi">Yayın tarihi</label>
                <input id="yayinTarihi" name="yayinTarihi" type="date" value="${kacisMetni(
                  tarihDegeri
                )}">
                ${
                  hatalar.yayinTarihi
                    ? `<p class="alan-hatasi">${kacisMetni(hatalar.yayinTarihi)}</p>`
                    : ""
                }
              </div>
              ${alan(
                "sureDakika",
                "Süre (dakika)",
                ' inputmode="numeric" maxlength="4"'
              )}
              ${alan("tmdbPuan", "TMDB puanı (0–10)", ' inputmode="decimal" maxlength="5"')}
            </div>

            ${alan("yonetmen", "Yönetmen", ' maxlength="300"')}
            ${alan("oyuncular", "Oyuncular", ' maxlength="500"')}
            ${alan("posterYolu", "Poster yolu (TMDB)", ' maxlength="300" placeholder="/abc123.jpg"')}

            <label class="onay-kutusu">
              <input type="checkbox" name="yayinda" value="1"${
                degerler.yayinda ? " checked" : ""
              }>
              <span>Film yayında (herkese görünür)</span>
            </label>

            <div class="liste-eylemler">
              <button class="dugme dugme-birincil" type="submit">Değişiklikleri Kaydet</button>
              <a class="dugme dugme-ikincil" href="/admin/filmler">Vazgeç</a>
            </div>
          </form>
        </div>
      </div>`;
}

/** /admin/yorumlar — tüm yorumlar ve moderasyon. */
export function yonetimYorumlariIcerigi({
  yorumlar,
  toplam,
  sayfa,
  sayfaSayisi,
  bildirim = null,
}) {
  const satirlar = yorumlar
    .map((yorum) => {
      const spoiler = yorum.tur === "spoilerli";
      return `
          <tr>
            <td data-etiket="Film">
              <a href="/filmler/${yorum.film.id}">${kacisMetni(yorum.film.baslik)}</a>
            </td>
            <td data-etiket="Yazar">${kacisMetni(yorum.kullanici.kullaniciAdi)}</td>
            <td data-etiket="Tür">
              <span class="durum-rozet ${spoiler ? "durum-spoiler" : "durum-spoilersiz"}">${
                spoiler ? "Spoilerlı" : "Spoilersız"
              }</span>
            </td>
            <td data-etiket="Tarih">${KISA_TARIH.format(new Date(yorum.olusturmaTarihi))}</td>
            <td data-etiket="Yorum" class="yonetim-yorum-metni">${kacisMetni(
              yorum.icerik
            ).replace(/\n/g, "<br>")}</td>
            <td data-etiket="İşlem">
              <form method="post" action="/admin/yorumlar/${yorum.id}/sil">
                <button class="dugme dugme-ikincil" type="submit">Sil</button>
              </form>
            </td>
          </tr>`;
    })
    .join("");

  return `
      <section class="sayfa-basligi">
        <h1>Yorumlar</h1>
        <p class="kahraman-metin">Moderasyon amacıyla herhangi bir yorumu silebilirsiniz.</p>
      </section>

      ${yonetimSekmeleri("yorumlar")}
      ${bildirimHtml(bildirim)}

      ${
        yorumlar.length
          ? `<p class="sonuc-sayisi">${toplam} yorum</p>
      <div class="yonetim-tablo-kap">
        <table class="yonetim-tablo">
          <thead>
            <tr><th>Film</th><th>Yazar</th><th>Tür</th><th>Tarih</th><th>Yorum</th><th>İşlem</th></tr>
          </thead>
          <tbody>${satirlar}
          </tbody>
        </table>
      </div>
      ${sayfalama("/admin/yorumlar", sayfa, sayfaSayisi)}`
          : '<p class="bos-durum">Henüz yorum yok.</p>'
      }`;
}

/** /admin/kullanicilar — kullanıcı listesi ve devre dışı bırakma. */
export function yonetimKullanicilariIcerigi({
  kullanicilar,
  toplam,
  sayfa,
  sayfaSayisi,
  kendimId,
  bildirim = null,
  hata = null,
}) {
  const satirlar = kullanicilar
    .map((kullanici) => {
      const kendisi = kullanici.id === kendimId;
      return `
          <tr>
            <td data-etiket="Kullanıcı">
              <strong>${kacisMetni(kullanici.kullaniciAdi)}</strong>
              ${kendisi ? '<span class="film-alt-bilgi"> (siz)</span>' : ""}
              ${
                kullanici.rol === "yonetici"
                  ? '<span class="durum-rozet durum-yonetici">Yönetici</span>'
                  : ""
              }
            </td>
            <td data-etiket="E-posta">${kacisMetni(kullanici.email)}</td>
            <td data-etiket="Kayıt">${KISA_TARIH.format(new Date(kullanici.olusturmaTarihi))}</td>
            <td data-etiket="Etkinlik">${kullanici._count.listeKayitlari} liste · ${
              kullanici._count.puanlar
            } puan · ${kullanici._count.yorumlar} yorum</td>
            <td data-etiket="Durum">
              ${
                kullanici.aktif
                  ? '<span class="durum-rozet durum-yayinda">Etkin</span>'
                  : '<span class="durum-rozet durum-yayinda-degil">Devre dışı</span>'
              }
            </td>
            <td data-etiket="İşlem">
              ${
                kendisi
                  ? '<span class="film-alt-bilgi">Kendi hesabınızı devre dışı bırakamazsınız.</span>'
                  : `<form method="post" action="/admin/kullanicilar/${kullanici.id}/aktiflik">
                <button class="dugme dugme-ikincil" type="submit">${
                  kullanici.aktif ? "Devre dışı bırak" : "Etkinleştir"
                }</button>
              </form>`
              }
            </td>
          </tr>`;
    })
    .join("");

  return `
      <section class="sayfa-basligi">
        <h1>Kullanıcılar</h1>
        <p class="kahraman-metin">Hesapları görüntüleyin; devre dışı bırakılan kullanıcılar giriş yapamaz.</p>
      </section>

      ${yonetimSekmeleri("kullanicilar")}
      ${bildirimHtml(bildirim)}
      ${hata ? `<p class="form-hatasi" role="alert">${kacisMetni(hata)}</p>` : ""}

      <p class="sonuc-sayisi">${toplam} kullanıcı</p>
      <div class="yonetim-tablo-kap">
        <table class="yonetim-tablo">
          <thead>
            <tr><th>Kullanıcı</th><th>E-posta</th><th>Kayıt</th><th>Etkinlik</th><th>Durum</th><th>İşlem</th></tr>
          </thead>
          <tbody>${satirlar}
          </tbody>
        </table>
      </div>
      ${sayfalama("/admin/kullanicilar", sayfa, sayfaSayisi)}`;
}
