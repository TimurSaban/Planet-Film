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
import { puanOzeti } from "../services/puanlar.js";
import {
  filmYorumlari,
  kullaniciYorumlari,
} from "../services/yorumlar.js";
import { YORUM_TUR_DEGERLERI } from "../lib/yorumTurleri.js";

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
  const yorumBildirimleri = {
    kaydedildi: "Yorumunuz yayınlandı.",
    guncellendi: "Yorumunuz güncellendi.",
    silindi: "Yorumunuz silindi.",
  };

  let bildirim = null;
  if (typeof istek.query.puan === "string" && istek.query.puan === "kaydedildi") {
    bildirim = "Puanınız kaydedildi.";
  } else if (
    typeof istek.query.yorum === "string" &&
    istek.query.yorum !== "spoilerli" &&
    istek.query.yorum !== "spoilersiz"
  ) {
    bildirim = yorumBildirimleri[istek.query.yorum] ?? null;
  } else if (typeof istek.query.liste === "string") {
    bildirim = listeBildirimleri[istek.query.liste] ?? null;
  }

  // Yorum sekmesi: `?yorum=spoilersiz|spoilerli` (spec 4.5). Geçersiz değerde
  // varsayılan sekme gösterilir.
  const istenenTur = YORUM_TUR_DEGERLERI.includes(istek.query.tur)
    ? istek.query.tur
    : YORUM_TUR_DEGERLERI.includes(istek.query.yorum)
      ? istek.query.yorum
      : null;
  const seciliYorumTuru = istenenTur ?? YORUM_TUR_DEGERLERI[0];

  const [puanlar, yorumlar, kendiYorumlarim] = await Promise.all([
    puanOzeti(guncelFilm.id, kullanici?.id ?? null),
    filmYorumlari(guncelFilm.id, seciliYorumTuru),
    kullanici ? kullaniciYorumlari(guncelFilm.id, kullanici.id) : [],
  ]);

  yanit.set("Cache-Control", "private, no-store");
  yanit.send(
    sayfaSablonu({
      baslik: guncelFilm.baslik,
      aciklama: guncelFilm.ozet ? guncelFilm.ozet.slice(0, 160) : undefined,
      aktifMenu: "/filmler",
      kullanici,
      icerik: filmDetayIcerigi({
        film: guncelFilm,
        eklendi,
        kullanici,
        listeDurumu,
        bildirim,
        puanOzeti: puanlar,
        yorumlar,
        kullaniciYorumlari: kendiYorumlarim,
        seciliYorumTuru,
      }),
    })
  );
});
