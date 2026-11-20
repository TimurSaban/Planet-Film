import { kacisMetni } from "../lib/html.js";
import { posterAdresi } from "../lib/tmdb.js";
import { LISTE_DURUMLARI, durumBilgisi } from "../lib/listeDurumlari.js";

const TARIH_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function bugununBaslangici() {
  const bugun = new Date();
  bugun.setUTCHours(0, 0, 0, 0);
  return bugun;
}

/** Yayın tarihi gelecekte olan film "Yakında" sayılır (spec Bölüm 4.2). */
export function yakindaMi(film) {
  if (!film.yayinTarihi) return false;
  return new Date(film.yayinTarihi) > bugununBaslangici();
}

function yilMetni(film) {
  return film.yayinTarihi ? String(new Date(film.yayinTarihi).getUTCFullYear()) : null;
}

function turMetni(film) {
  return (film.turler ?? [])
    .map((kayit) => kayit.tur?.ad)
    .filter(Boolean)
    .join(", ");
}

function puanMetni(film) {
  const puan = Number(film.tmdbPuan ?? 0);
  return puan > 0 ? puan.toFixed(1) : null;
}

/** Tek film kartı (liste ve ana sayfa ortak). */
export function filmKarti(film) {
  const altBilgi = [yilMetni(film), turMetni(film)].filter(Boolean).join(" · ");
  const puan = puanMetni(film);

  return `
        <li class="film-karti">
          <a class="film-baglanti" href="/filmler/${film.id}">
            <span class="poster-kutusu">
              <img src="${kacisMetni(posterAdresi(film.posterYolu, "w342"))}"
                   alt="${kacisMetni(film.baslik)} posteri" width="342" height="513" loading="lazy">
              ${yakindaMi(film) ? '<span class="rozet rozet-yakinda">Yakında</span>' : ""}
            </span>
            <span class="film-bilgi">
              <span class="film-baslik">${kacisMetni(film.baslik)}</span>
              ${altBilgi ? `<span class="film-alt-bilgi">${kacisMetni(altBilgi)}</span>` : ""}
              ${puan ? `<span class="film-puan">TMDB <strong>${kacisMetni(puan)}</strong></span>` : ""}
            </span>
          </a>
        </li>`;
}

export function filmIzgarasi(filmler) {
  if (!filmler.length) return "";
  return `
      <ul class="film-izgarasi">
${filmler.map(filmKarti).join("\n")}
      </ul>`;
}

function sayfaBaglantisi(secili, sayfa) {
  const parametreler = new URLSearchParams();
  if (secili.q) parametreler.set("q", secili.q);
  if (secili.tur) parametreler.set("tur", String(secili.tur));
  if (secili.durum) parametreler.set("durum", secili.durum);
  if (sayfa > 1) parametreler.set("sayfa", String(sayfa));
  const sorgu = parametreler.toString();
  return sorgu ? `/filmler?${sorgu}` : "/filmler";
}

function sayfalamaHtml({ sayfa, sayfaSayisi, secili }) {
  if (sayfaSayisi <= 1) return "";

  const baslangic = Math.max(1, sayfa - 2);
  const bitis = Math.min(sayfaSayisi, baslangic + 4);
  const numaralar = [];

  for (let numara = baslangic; numara <= bitis; numara += 1) {
    numaralar.push(
      numara === sayfa
        ? `<span class="sayfa-numarasi aktif" aria-current="page">${numara}</span>`
        : `<a class="sayfa-numarasi" href="${sayfaBaglantisi(secili, numara)}">${numara}</a>`
    );
  }

  return `
      <nav class="sayfalama" aria-label="Sayfalar">
        ${sayfa > 1 ? `<a class="dugme dugme-ikincil" href="${sayfaBaglantisi(secili, sayfa - 1)}">Önceki</a>` : ""}
        <span class="sayfa-numaralari">${numaralar.join("")}</span>
        ${sayfa < sayfaSayisi ? `<a class="dugme dugme-ikincil" href="${sayfaBaglantisi(secili, sayfa + 1)}">Sonraki</a>` : ""}
      </nav>`;
}

/** /filmler sayfası: arama, tür ve yayın durumu filtresi, sayfalama. */
export function filmListesiIcerigi({ filmler, toplam, sayfa, sayfaSayisi, turler, secili }) {
  const turSecenekleri = turler
    .map(
      (tur) =>
        `<option value="${tur.id}"${secili.tur === tur.id ? " selected" : ""}>${kacisMetni(tur.ad)}</option>`
    )
    .join("\n            ");

  const durumSecenekleri = [
    { deger: "yayinda", etiket: "Yayınlanmış" },
    { deger: "yakinda", etiket: "Yakında" },
  ]
    .map(
      (durum) =>
        `<option value="${durum.deger}"${secili.durum === durum.deger ? " selected" : ""}>${durum.etiket}</option>`
    )
    .join("\n            ");

  const bosDurum = secili.q || secili.tur || secili.durum
    ? `<p class="bos-durum">Aramanıza uygun film bulunamadı. Filtreleri temizleyip tekrar deneyin.</p>`
    : `<p class="bos-durum">Henüz film eklenmedi. Filmler yönetici tarafından TMDB'den aktarılır.</p>`;

  return `
      <section class="sayfa-basligi">
        <h1>Filmler</h1>
        <p class="kahraman-metin">Filmleri arayın, türe ve yayın durumuna göre filtreleyin.</p>
      </section>

      <form class="filtre-formu" method="get" action="/filmler" role="search">
        <div class="filtre-alani filtre-arama">
          <label for="q">Ara</label>
          <input id="q" name="q" type="search" maxlength="100" value="${kacisMetni(secili.q)}"
                 placeholder="Film adı">
        </div>
        <div class="filtre-alani">
          <label for="tur">Tür</label>
          <select id="tur" name="tur">
            <option value="">Tümü</option>
            ${turSecenekleri}
          </select>
        </div>
        <div class="filtre-alani">
          <label for="durum">Durum</label>
          <select id="durum" name="durum">
            <option value="">Tümü</option>
            ${durumSecenekleri}
          </select>
        </div>
        <div class="filtre-eylemler">
          <button class="dugme dugme-birincil" type="submit">Filtrele</button>
          <a class="dugme dugme-ikincil" href="/filmler">Temizle</a>
        </div>
      </form>

      ${
        toplam > 0
          ? `<p class="sonuc-sayisi">${toplam} film bulundu${sayfaSayisi > 1 ? ` · Sayfa ${sayfa} / ${sayfaSayisi}` : ""}</p>`
          : ""
      }

      ${filmler.length ? filmIzgarasi(filmler) : bosDurum}
      ${sayfalamaHtml({ sayfa, sayfaSayisi, secili })}`;
}

/** Film detayında listeye ekleme / durum değiştirme / çıkarma bölümü (spec 4.3). */
export function listeBolumu({ film, kullanici, listeDurumu }) {
  const donus = `/filmler/${film.id}`;

  if (!kullanici) {
    return `
      <section class="listeye-ekle">
        <h2>Listem</h2>
        <p class="liste-durumu">
          Filmi listenize eklemek için
          <a href="/giris?yonlendirme=${encodeURIComponent(donus)}">giriş yapın</a>.
        </p>
      </section>`;
  }

  const butonlar = LISTE_DURUMLARI.map((durum) => {
    const aktif = listeDurumu === durum.deger;
    return `
          <form method="post" action="/profil/listeler">
            <input type="hidden" name="filmId" value="${film.id}">
            <input type="hidden" name="durum" value="${kacisMetni(durum.deger)}">
            <input type="hidden" name="donus" value="${donus}">
            <button class="dugme ${aktif ? "dugme-birincil" : "dugme-ikincil"}" type="submit" aria-pressed="${aktif}">
              ${kacisMetni(durum.eylem)}
            </button>
          </form>`;
  }).join("");

  const cikarFormu = listeDurumu
    ? `
          <form method="post" action="/profil/listeler/${film.id}/sil">
            <input type="hidden" name="donus" value="${donus}">
            <button class="dugme dugme-ikincil" type="submit">Listeden çıkar</button>
          </form>`
    : "";

  const mevcutDurum = listeDurumu ? durumBilgisi(listeDurumu) : null;

  return `
      <section class="listeye-ekle">
        <h2>Listem</h2>
        <p class="liste-durumu">
          ${
            mevcutDurum
              ? `Bu film <strong>${kacisMetni(mevcutDurum.sekme)}</strong> listesinde.`
              : "Bu film henüz listelerinizde değil."
          }
        </p>
        <div class="liste-eylemler">${butonlar}${cikarFormu}
        </div>
      </section>`;
}

/** /filmler/:id sayfası. */
export function filmDetayIcerigi({ film, eklendi = false, kullanici = null, listeDurumu = null, bildirim = null }) {
  const puan = puanMetni(film);
  const satirlar = [
    ["Yayın tarihi", film.yayinTarihi ? TARIH_BICIMI.format(new Date(film.yayinTarihi)) : null],
    ["Süre", film.sureDakika ? `${film.sureDakika} dakika` : null],
    ["Türler", turMetni(film) || null],
    ["Yönetmen", film.yonetmen || null],
    ["Oyuncular", film.oyuncular || null],
    ["TMDB puanı", puan ? `${puan} / 10` : null],
  ].filter(([, deger]) => deger);

  const bilgiListesi = satirlar
    .map(
      ([etiket, deger]) => `
            <div class="bilgi-satiri">
              <dt>${kacisMetni(etiket)}</dt>
              <dd>${kacisMetni(deger)}</dd>
            </div>`
    )
    .join("");

  const orijinalBaslik =
    film.orijinalBaslik && film.orijinalBaslik !== film.baslik
      ? `<p class="film-orijinal-baslik">${kacisMetni(film.orijinalBaslik)}</p>`
      : "";

  return `
      <p class="geri-baglanti"><a href="/filmler">← Filmlere dön</a></p>

      ${
        eklendi
          ? `<p class="bildirim bildirim-basari" role="status">Film TMDB'den başarıyla aktarıldı.</p>`
          : ""
      }

      ${bildirim ? `<p class="bildirim bildirim-basari" role="status">${kacisMetni(bildirim)}</p>` : ""}

      <article class="film-detay">
        <div class="film-detay-poster">
          <img src="${kacisMetni(posterAdresi(film.posterYolu, "w500"))}"
               alt="${kacisMetni(film.baslik)} posteri" width="500" height="750">
        </div>

        <div class="film-detay-bilgi">
          <div class="film-detay-baslik">
            <h1>${kacisMetni(film.baslik)}</h1>
            ${orijinalBaslik}
            ${yakindaMi(film) ? '<span class="rozet rozet-yakinda">Yakında</span>' : ""}
          </div>

          <dl class="bilgi-listesi">
            ${bilgiListesi}
          </dl>

          <section class="film-ozet">
            <h2>Özet</h2>
            <p>${film.ozet ? kacisMetni(film.ozet) : "Bu film için Türkçe ya da İngilizce özet bulunmuyor."}</p>
          </section>
        </div>
      </article>

      ${listeBolumu({ film, kullanici, listeDurumu })}`;
}

/** Bulunamayan film için 404 içeriği. */
export function filmYokIcerigi() {
  return `
      <section class="bolum">
        <h1>Film bulunamadı</h1>
        <p class="kahraman-metin">Aradığınız film sitede kayıtlı değil ya da yayından kaldırılmış olabilir.</p>
        <a class="dugme dugme-birincil" href="/filmler">Filmlere Göz At</a>
      </section>`;
}
