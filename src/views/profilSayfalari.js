import { kacisMetni } from "../lib/html.js";
import { LISTE_DURUMLARI, durumBilgisi } from "../lib/listeDurumlari.js";
import { yorumTuruBilgisi } from "../lib/yorumTurleri.js";
import { filmIzgarasi } from "./filmSayfalari.js";

const TARIH_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function sekmeler(seciliSekme, seciliDurum) {
  const listeSekmeleri = LISTE_DURUMLARI.map((durum) => {
    const aktif = seciliSekme === "listeler" && durum.deger === seciliDurum;
    const adres = `/profil?durum=${encodeURIComponent(durum.deger)}`;
    return `<a class="liste-sekme${aktif ? " aktif" : ""}" href="${adres}"${
      aktif ? ' aria-current="page"' : ""
    }>${kacisMetni(durum.sekme)}</a>`;
  });

  const yorumSekmesi = `<a class="liste-sekme${
    seciliSekme === "yorumlar" ? " aktif" : ""
  }" href="/profil?sekme=yorumlar"${
    seciliSekme === "yorumlar" ? ' aria-current="page"' : ""
  }>Yorumlarım</a>`;

  return [...listeSekmeleri, yorumSekmesi].join("\n        ");
}

/** Tek yorum kartı (profilde kendi yorumlar; spoiler uyarısı gerekmez). */
function yorumKarti(yorum) {
  const tur = yorumTuruBilgisi(yorum.tur);
  const spoiler = yorum.tur === "spoilerli";
  const metin = kacisMetni(yorum.icerik).replace(/\n/g, "<br>");
  const duzenlendi =
    yorum.guncellemeTarihi &&
    yorum.olusturmaTarihi &&
    new Date(yorum.guncellemeTarihi).getTime() -
      new Date(yorum.olusturmaTarihi).getTime() >
      1000;

  return `
        <article class="yorum-karti">
          <header class="yorum-basligi">
            <a class="yorum-film" href="/filmler/${yorum.film.id}">${kacisMetni(
              yorum.film.baslik
            )}</a>
            <span class="yorum-tur">${kacisMetni(tur?.sekme ?? yorum.tur)}</span>
            ${
              spoiler ? '<span class="rozet rozet-spoiler">Spoiler</span>' : ""
            }
            <span class="yorum-tarih">${TARIH_BICIMI.format(
              new Date(yorum.olusturmaTarihi)
            )}</span>
            ${duzenlendi ? '<span class="yorum-duzenlendi">düzenlendi</span>' : ""}
          </header>
          <p class="yorum-metni">${metin}</p>
          <div class="yorum-eylemler">
            <a class="dugme dugme-ikincil" href="/filmler/${yorum.film.id}?yorum=${encodeURIComponent(
              yorum.tur
            )}#yorum-formu">Düzenle</a>
            <form method="post" action="/filmler/${yorum.film.id}/yorumlar/${encodeURIComponent(
              yorum.tur
            )}/sil">
              <input type="hidden" name="donus" value="/profil?sekme=yorumlar">
              <button class="dugme dugme-ikincil" type="submit">Sil</button>
            </form>
          </div>
        </article>`;
}

function yorumlarBolumu(yorumlar) {
  if (!yorumlar.length) {
    return `<p class="bos-durum">Henüz yorum yazmadınız.
        <a href="/filmler">Filmlere göz atıp</a> düşüncelerinizi paylaşabilirsiniz.</p>`;
  }

  return `
      <p class="sonuc-sayisi">${yorumlar.length} yorum</p>
      <div class="yorum-listesi">
${yorumlar.map(yorumKarti).join("\n")}
      </div>`;
}

/** /profil sayfası: film listeleri durumlara göre, yorumlar ayrı sekmede (spec 4.3, 4.5). */
export function profilIcerigi({
  kullanici,
  sekme = "listeler",
  durum,
  filmler,
  yorumlar = [],
  bildirim = null,
}) {
  const secili = durumBilgisi(durum) ?? LISTE_DURUMLARI[0];

  return `
      <section class="sayfa-basligi">
        <h1>Profil</h1>
        <p class="kahraman-metin">${kacisMetni(
          kullanici.kullaniciAdi
        )} olarak film listelerinizi ve yorumlarınızı burada yönetin.</p>
      </section>

      ${
        bildirim
          ? `<p class="bildirim bildirim-basari" role="status">${kacisMetni(
              bildirim
            )}</p>`
          : ""
      }

      <nav class="liste-sekmeleri" aria-label="Profil sekmeleri">
        ${sekmeler(sekme, secili.deger)}
      </nav>

      ${
        sekme === "yorumlar"
          ? yorumlarBolumu(yorumlar)
          : filmler.length
            ? `<p class="sonuc-sayisi">${filmler.length} film</p>
      ${filmIzgarasi(filmler)}`
            : `<p class="bos-durum">${kacisMetni(secili.sekme)} listenizde henüz film yok.
        <a href="/filmler">Filmlere göz atıp</a> listeye ekleyebilirsiniz.</p>`
      }`;
}
