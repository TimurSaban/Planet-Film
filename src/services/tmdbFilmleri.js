import { aramaMetniNormalize } from "../lib/arama.js";

/** "YYYY-AA-GG" tarihini UTC gece yarısına çevirir; geçersizse null. */
function tariheCevir(deger) {
  if (!deger || !/^\d{4}-\d{2}-\d{2}$/.test(deger)) return null;
  const tarih = new Date(`${deger}T00:00:00.000Z`);
  return Number.isNaN(tarih.getTime()) ? null : tarih;
}

/** TMDB detay yanıtını movies/film_turleri kayıtlarına dönüştürür. */
export function tmdbFilmVerisiniEsle(film) {
  const yonetmenler = (film.credits?.crew ?? [])
    .filter((kisi) => kisi.job === "Director")
    .map((kisi) => kisi.name)
    .filter(Boolean);

  const oyuncular = (film.credits?.cast ?? [])
    .slice(0, 5)
    .map((kisi) => kisi.name)
    .filter(Boolean);

  const baslik = film.title || film.original_title || "Adsız film";

  return {
    film: {
      tmdbId: Number(film.id),
      baslik,
      orijinalBaslik: film.original_title || baslik,
      ozet: String(film.overview ?? "").trim(),
      yayinTarihi: tariheCevir(film.release_date),
      sureDakika:
        Number.isFinite(film.runtime) && film.runtime > 0 ? Number(film.runtime) : null,
      posterYolu: film.poster_path || null,
      yonetmen: yonetmenler.slice(0, 2).join(", "),
      oyuncular: oyuncular.join(", "),
      tmdbPuan: Math.round(Number(film.vote_average ?? 0) * 10) / 10,
      aramaMetni: aramaMetniNormalize(`${film.title ?? ""} ${film.original_title ?? ""}`),
      tmdbGuncellemeTarihi: new Date(),
    },
    turler: (film.genres ?? [])
      .filter((tur) => tur && tur.id && tur.name)
      .map((tur) => ({ tmdbId: Number(tur.id), ad: String(tur.name) })),
  };
}
