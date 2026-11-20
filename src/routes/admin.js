import { Router } from "express";
import { sayfaSablonu } from "../views/layout.js";
import { adminFilmEkleIcerigi } from "../views/adminFilmSayfalari.js";
import { yoneticiGerekli } from "../middleware/yetki.js";
import { dogrula } from "../lib/dogrulama.js";
import { filmAra, filmDetay, TmdbHatasi } from "../lib/tmdb.js";
import {
  filmKaydet,
  tmdbIleFilmBul,
  tmdbIdleriyleFilmler,
} from "../services/filmler.js";
import { filmAktarSemasi } from "../validasyon/filmSemalari.js";

export const adminRotalari = Router();

// Spec Bölüm 4.6/6: tüm /admin yolları sunucu tarafında rol kontrolüyle korunur.
adminRotalari.use(yoneticiGerekli);

adminRotalari.get("/", (istek, yanit) => {
  yanit.redirect("/admin/filmler/ekle");
});

function ekleSayfasi(yanit, { q = "", arama = null, hata = null, eklendi = null, zaten = null, mevcutFilmler = {} }) {
  return yanit.send(
    sayfaSablonu({
      baslik: "TMDB'den Film Ekle",
      kullanici: yanit.locals.kullanici,
      icerik: adminFilmEkleIcerigi({ q, arama, hata, eklendi, zaten, mevcutFilmler }),
    })
  );
}

// Aşama 3: yönetici TMDB'de arayıp filmi veritabanına aktarır.
adminRotalari.get("/filmler/ekle", async (istek, yanit) => {
  const q = typeof istek.query.q === "string" ? istek.query.q.trim().slice(0, 100) : "";

  let eklendi = null;
  if (istek.query.eklendi) {
    const id = Number(istek.query.eklendi);
    if (Number.isInteger(id) && id > 0) eklendi = { id };
  }

  let zaten = null;
  if (istek.query.zaten) {
    const id = Number(istek.query.zaten);
    if (Number.isInteger(id) && id > 0) zaten = { id };
  }

  if (!q) {
    return ekleSayfasi(yanit, { eklendi, zaten });
  }

  try {
    const arama = await filmAra(q);
    const kayitlar = await tmdbIdleriyleFilmler(arama.sonuclar.map((film) => film.tmdbId));
    const mevcutFilmler = Object.fromEntries(
      kayitlar.map((kayit) => [kayit.tmdbId, { id: kayit.id }])
    );

    return ekleSayfasi(yanit, { q, arama, eklendi, zaten, mevcutFilmler });
  } catch (hata) {
    if (!(hata instanceof TmdbHatasi)) throw hata;
    return ekleSayfasi(yanit, { q, hata: hata.message, eklendi, zaten });
  }
});

adminRotalari.post("/filmler/aktar", async (istek, yanit) => {
  const sonuc = dogrula(filmAktarSemasi, istek.body);

  if (!sonuc.basarili) {
    return ekleSayfasi(yanit, {
      q: typeof istek.body?.q === "string" ? istek.body.q.trim().slice(0, 100) : "",
      hata: "Geçerli bir film seçin.",
    });
  }

  const { tmdbId, q } = sonuc.veri;

  const mevcut = await tmdbIleFilmBul(tmdbId);
  if (mevcut) return yanit.redirect(`/admin/filmler/ekle?zaten=${mevcut.id}`);

  try {
    const detay = await filmDetay(tmdbId);
    const film = await filmKaydet(detay);
    return yanit.redirect(`/admin/filmler/ekle?eklendi=${film.id}`);
  } catch (hata) {
    if (!(hata instanceof TmdbHatasi)) throw hata;
    return ekleSayfasi(yanit, { q, hata: hata.message });
  }
});
