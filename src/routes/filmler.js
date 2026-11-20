import { Router } from "express";
import { sayfaSablonu } from "../views/layout.js";
import {
  filmListesiIcerigi,
  filmDetayIcerigi,
  filmYokIcerigi,
} from "../views/filmSayfalari.js";
import {
  filmleriListele,
  filmBul,
  filmYenile,
  tumTurler,
} from "../services/filmler.js";
import { listeParametreleri } from "../validasyon/filmSemalari.js";
import { filmListeDurumu } from "../services/listeler.js";

export const filmRotalari = Router();

// /filmler — arama, tür ve yayın durumu filtresi, sayfalama (spec Bölüm 4.2)
filmRotalari.get("/", async (istek, yanit) => {
  const parametreler = listeParametreleri(istek.query);

  const [liste, turler] = await Promise.all([
    filmleriListele({
      arama: parametreler.q,
      turId: parametreler.tur,
      durum: parametreler.durum,
      sayfa: parametreler.sayfa,
    }),
    tumTurler(),
  ]);

  const secili = { q: parametreler.q, tur: parametreler.tur, durum: parametreler.durum };

  yanit.send(
    sayfaSablonu({
      baslik: "Filmler",
      aciklama: "Filmleri arayın, türe ve yayın durumuna göre filtreleyin.",
      aktifMenu: "/filmler",
      kullanici: yanit.locals.kullanici,
      icerik: filmListesiIcerigi({ ...liste, turler, secili }),
    })
  );
});

// /filmler/:id — film detayı (spec Bölüm 4.2)
filmRotalari.get("/:id", async (istek, yanit) => {
  const id = Number(istek.params.id);
  const film = Number.isInteger(id) && id > 0 ? await filmBul(id) : null;

  if (!film) {
    return yanit.status(404).send(
      sayfaSablonu({
        baslik: "Film bulunamadı",
        aktifMenu: "/filmler",
        kullanici: yanit.locals.kullanici,
        icerik: filmYokIcerigi(),
      })
    );
  }

  // 30 günden eski veri varsa sessizce yenilenir (6 aylık TMDB önbellek sınırı).
  const guncelFilm = await filmYenile(film);
  const eklendi = istek.query.eklendi === "1";
  const kullanici = yanit.locals.kullanici;

  // Giriş yapmış üye için filmin listesindeki mevcut durumu (spec 4.3).
  const listeDurumu = kullanici ? await filmListeDurumu(kullanici.id, guncelFilm.id) : null;

  const listeBildirimleri = {
    kaydedildi: "Film listenize kaydedildi.",
    cikarildi: "Film listenizden çıkarıldı.",
  };
  const bildirim =
    typeof istek.query.liste === "string"
      ? listeBildirimleri[istek.query.liste] ?? null
      : null;

  yanit.set("Cache-Control", "private, no-store");
  yanit.send(
    sayfaSablonu({
      baslik: guncelFilm.baslik,
      aciklama: guncelFilm.ozet ? guncelFilm.ozet.slice(0, 160) : undefined,
      aktifMenu: "/filmler",
      kullanici,
      icerik: filmDetayIcerigi({ film: guncelFilm, eklendi, kullanici, listeDurumu, bildirim }),
    })
  );
});
