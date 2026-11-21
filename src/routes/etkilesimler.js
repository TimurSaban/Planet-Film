import { Router } from "express";
import { sayfaSablonu } from "../views/layout.js";
import { filmYokIcerigi } from "../views/filmSayfalari.js";
import { dogrula } from "../lib/dogrulama.js";
import { kacisMetni } from "../lib/html.js";
import { guvenliYonlendirme } from "../lib/yonlendirme.js";
import { filmBul } from "../services/filmler.js";
import { puanKaydet } from "../services/puanlar.js";
import { yorumKaydet, yorumSil } from "../services/yorumlar.js";
import {
  puanSemasi,
  yorumSemasi,
  yorumTuruSemasi,
} from "../validasyon/etkilesimSemalari.js";

// Film detayındaki puan ve yorum işlemleri (Aşama 5). GET istekleri film
// rotalarına bırakılır; burada yalnızca POST uçları vardır.
export const etkilesimRotalari = Router();

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

function filmYokSayfasi(yanit) {
  return yanit.status(404).send(
    sayfaSablonu({
      baslik: "Film bulunamadı",
      aktifMenu: "/filmler",
      kullanici: yanit.locals.kullanici,
      icerik: filmYokIcerigi(),
    })
  );
}

function girisYonlendirmesi(yanit, filmId) {
  const hedef = `/filmler/${filmId}`;
  return yanit.redirect(`/giris?yonlendirme=${encodeURIComponent(hedef)}`);
}

/** Var olan sorgu dizesini ve çapayı koruyarak parametre ekler. */
function adreseEkle(yol, parametreler) {
  const adres = new URL(yol, "http://yerel");
  for (const [anahtar, deger] of Object.entries(parametreler)) {
    adres.searchParams.set(anahtar, deger);
  }
  return `${adres.pathname}${adres.search}${adres.hash}`;
}

function gecerliFilmId(deger) {
  const id = Number(deger);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Puan verir ya da var olan puanın üzerine yazar (spec 4.4).
etkilesimRotalari.post("/:id/puan", async (istek, yanit) => {
  const filmId = gecerliFilmId(istek.params.id);
  if (!filmId) return hataSayfasi(yanit, "Geçersiz film numarası.");

  const kullanici = yanit.locals.kullanici;
  if (!kullanici) return girisYonlendirmesi(yanit, filmId);

  const film = await filmBul(filmId);
  if (!film) return filmYokSayfasi(yanit);

  const sonuc = dogrula(puanSemasi, istek.body);
  if (!sonuc.basarili) {
    return hataSayfasi(yanit, sonuc.alanlar.puan ?? "Puan isteği geçersiz.");
  }

  await puanKaydet(kullanici.id, film.id, sonuc.veri.puan);
  return yanit.redirect(`/filmler/${film.id}?puan=kaydedildi#puanlar`);
});

// Spoilersız / spoilerlı yorum yazar ya da var olanı günceller (spec 4.5).
etkilesimRotalari.post("/:id/yorumlar", async (istek, yanit) => {
  const filmId = gecerliFilmId(istek.params.id);
  if (!filmId) return hataSayfasi(yanit, "Geçersiz film numarası.");

  const kullanici = yanit.locals.kullanici;
  if (!kullanici) return girisYonlendirmesi(yanit, filmId);

  const film = await filmBul(filmId);
  if (!film) return filmYokSayfasi(yanit);

  const sonuc = dogrula(yorumSemasi, istek.body);
  if (!sonuc.basarili) {
    return hataSayfasi(yanit, sonuc.alanlar.icerik ?? sonuc.alanlar.tur ?? "Yorum isteği geçersiz.");
  }

  const { tur, icerik } = sonuc.veri;
  const { guncellendi } = await yorumKaydet(kullanici.id, film.id, tur, icerik);
  const durum = guncellendi ? "guncellendi" : "kaydedildi";

  return yanit.redirect(
    `/filmler/${film.id}?yorum=${durum}&tur=${encodeURIComponent(tur)}#yorumlar`
  );
});

// Kullanıcı yalnızca kendi yorumunu siler (spec 4.5).
etkilesimRotalari.post("/:id/yorumlar/:tur/sil", async (istek, yanit) => {
  const filmId = gecerliFilmId(istek.params.id);
  if (!filmId) return hataSayfasi(yanit, "Geçersiz film numarası.");

  const kullanici = yanit.locals.kullanici;
  if (!kullanici) return girisYonlendirmesi(yanit, filmId);

  const turSonucu = yorumTuruSemasi.safeParse(istek.params.tur);
  if (!turSonucu.success) return hataSayfasi(yanit, "Geçersiz yorum türü.");

  const tur = turSonucu.data;
  await yorumSil(kullanici.id, filmId, tur);

  const varsayilan = `/filmler/${filmId}?yorum=silindi&tur=${encodeURIComponent(tur)}#yorumlar`;
  const donus = guvenliYonlendirme(istek.body?.donus);
  const hedef = donus
    ? adreseEkle(donus, { yorum: "silindi", tur })
    : varsayilan;

  return yanit.redirect(hedef);
});
