import { Router } from "express";
import { sayfaSablonu } from "../views/layout.js";
import { profilIcerigi } from "../views/profilSayfalari.js";
import { filmYokIcerigi } from "../views/filmSayfalari.js";
import { girisGerekli } from "../middleware/yetki.js";
import { dogrula } from "../lib/dogrulama.js";
import { kacisMetni } from "../lib/html.js";
import { guvenliYonlendirme } from "../lib/yonlendirme.js";
import { LISTE_DURUM_DEGERLERI } from "../lib/listeDurumlari.js";
import { filmBul } from "../services/filmler.js";
import {
  filmListeDurumu,
  kullaniciListesi,
  listeyeEkle,
  listedenCikar,
} from "../services/listeler.js";
import { listeDurumSemasi, listeyeEkleSemasi } from "../validasyon/listeSemalari.js";

export const profilRotalari = Router();

// Profil ve liste işlemleri yalnızca giriş yapmış üyelere açıktır (spec 4.3).
profilRotalari.use(girisGerekli);

function hataSayfasi(yanit, mesaj, durum = 400) {
  return yanit.status(durum).send(
    sayfaSablonu({
      baslik: "İstek işlenemedi",
      kullanici: yanit.locals.kullanici,
      icerik: `
      <section class="bolum">
        <h1>İstek işlenemedi</h1>
        <p class="kahraman-metin">${kacisMetni(mesaj)}</p>
        <a class="dugme dugme-birincil" href="/filmler">Filmlere Göz At</a>
      </section>`,
    })
  );
}

/** Var olan sorgu dizesini koruyarak yol üzerine parametre ekler. */
function sorguEkle(yol, parametreler) {
  const adres = new URL(yol, "http://yerel");
  for (const [anahtar, deger] of Object.entries(parametreler)) {
    adres.searchParams.set(anahtar, deger);
  }
  return `${adres.pathname}${adres.search}`;
}

// /profil — listeler sekmeli gösterilir.
profilRotalari.get("/", async (istek, yanit) => {
  const kullanici = yanit.locals.kullanici;
  const durumSonucu = listeDurumSemasi.safeParse(istek.query.durum);
  const durum = durumSonucu.success ? durumSonucu.data : LISTE_DURUM_DEGERLERI[0];

  const filmler = await kullaniciListesi(kullanici.id, durum);

  yanit.set("Cache-Control", "private, no-store");
  yanit.send(
    sayfaSablonu({
      baslik: "Profil",
      aciklama: "Film listeleriniz.",
      aktifMenu: "/profil",
      kullanici,
      icerik: profilIcerigi({ kullanici, durum, filmler }),
    })
  );
});

// Filmi listeye ekler ya da durumunu değiştirir (tek kayıt, spec 4.3).
profilRotalari.post("/listeler", async (istek, yanit) => {
  const kullanici = yanit.locals.kullanici;
  const sonuc = dogrula(listeyeEkleSemasi, istek.body);

  if (!sonuc.basarili) {
    return hataSayfasi(yanit, "Listeye ekleme isteği geçersiz. Film sayfasından tekrar deneyin.");
  }

  const { filmId, durum, donus } = sonuc.veri;
  const film = await filmBul(filmId);

  if (!film) {
    return yanit.status(404).send(
      sayfaSablonu({
        baslik: "Film bulunamadı",
        aktifMenu: "/filmler",
        kullanici,
        icerik: filmYokIcerigi(),
      })
    );
  }

  await listeyeEkle(kullanici.id, film.id, durum);

  const hedef = guvenliYonlendirme(donus) ?? `/filmler/${film.id}`;
  yanit.redirect(sorguEkle(hedef, { liste: "kaydedildi" }));
});

// Filmi listeden çıkarır.
profilRotalari.post("/listeler/:filmId/sil", async (istek, yanit) => {
  const kullanici = yanit.locals.kullanici;
  const filmId = Number(istek.params.filmId);

  if (!Number.isInteger(filmId) || filmId <= 0) {
    return hataSayfasi(yanit, "Geçersiz film numarası.");
  }

  await listedenCikar(kullanici.id, filmId);

  const hedef = guvenliYonlendirme(istek.body?.donus) ?? `/filmler/${filmId}`;
  yanit.redirect(sorguEkle(hedef, { liste: "cikarildi" }));
});
