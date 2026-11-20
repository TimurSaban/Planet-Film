import { kacisMetni } from "../lib/html.js";
import { LISTE_DURUMLARI, durumBilgisi } from "../lib/listeDurumlari.js";
import { filmIzgarasi } from "./filmSayfalari.js";

function sekmeler(seciliDurum) {
  return LISTE_DURUMLARI.map((durum) => {
    const aktif = durum.deger === seciliDurum;
    const adres = `/profil?durum=${encodeURIComponent(durum.deger)}`;
    return `<a class="liste-sekme${aktif ? " aktif" : ""}" href="${adres}"${
      aktif ? ' aria-current="page"' : ""
    }>${kacisMetni(durum.sekme)}</a>`;
  }).join("\n        ");
}

/** /profil sayfası: film listeleri durumlara göre sekmeli gösterilir (spec 4.3). */
export function profilIcerigi({ kullanici, durum, filmler }) {
  const secili = durumBilgisi(durum) ?? LISTE_DURUMLARI[0];

  return `
      <section class="sayfa-basligi">
        <h1>Profil</h1>
        <p class="kahraman-metin">${kacisMetni(kullanici.kullaniciAdi)} olarak film listelerinizi burada yönetin.</p>
      </section>

      <nav class="liste-sekmeleri" aria-label="Film listeleri">
        ${sekmeler(secili.deger)}
      </nav>

      ${
        filmler.length
          ? `<p class="sonuc-sayisi">${filmler.length} film</p>\n      ${filmIzgarasi(filmler)}`
          : `<p class="bos-durum">${kacisMetni(secili.sekme)} listenizde henüz film yok.
        <a href="/filmler">Filmlere göz atıp</a> listeye ekleyebilirsiniz.</p>`
      }`;
}
