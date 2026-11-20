/**
 * TMDB API v3 istemcisi (spec Bölüm 4.2 ve 6).
 * API anahtarı yalnızca sunucuda, .env dosyasından okunur; istemciye gönderilmez.
 */

const TMDB_TEMEL = "https://api.themoviedb.org/3";
const RESIM_TEMEL = "https://image.tmdb.org/t/p";
const ISTEK_ZAMAN_ASIMI_MS = 8000;

/** Poster bulunmayan filmler için yerel yedek görsel. */
export const POSTER_YEDEK = "/images/poster-yok.svg";

export class TmdbHatasi extends Error {
  constructor(mesaj, durum = 0) {
    super(mesaj);
    this.name = "TmdbHatasi";
    this.durum = durum;
  }
}

/** API anahtarı tanımlı mı? (Tanımsızken TMDB'ye hiç istek atılmaz.) */
export function tmdbAnahtariTanimliMi() {
  return String(process.env.TMDB_API_ANAHTARI ?? "").trim().length > 0;
}

function apiAnahtari() {
  const anahtar = String(process.env.TMDB_API_ANAHTARI ?? "").trim();
  if (!anahtar) {
    throw new TmdbHatasi(
      "TMDB_API_ANAHTARI tanımlı değil. .env dosyasına TMDB v3 API anahtarını ekleyip sunucuyu yeniden başlatın."
    );
  }
  return anahtar;
}

async function tmdbIstek(yol, parametreler = {}) {
  const adres = new URL(`${TMDB_TEMEL}${yol}`);
  adres.searchParams.set("api_key", apiAnahtari());
  adres.searchParams.set("language", parametreler.dil ?? "tr-TR");

  for (const [anahtar, deger] of Object.entries(parametreler)) {
    if (anahtar === "dil" || deger === undefined || deger === null || deger === "") continue;
    adres.searchParams.set(anahtar, String(deger));
  }

  let yanit;
  try {
    yanit = await fetch(adres, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(ISTEK_ZAMAN_ASIMI_MS),
    });
  } catch (hata) {
    if (hata?.name === "TimeoutError" || hata?.name === "AbortError") {
      throw new TmdbHatasi("TMDB isteği zaman aşımına uğradı. Lütfen tekrar deneyin.");
    }
    throw new TmdbHatasi("TMDB'ye ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
  }

  if (yanit.status === 401) {
    throw new TmdbHatasi(
      "TMDB API anahtarı geçersiz. .env dosyasındaki TMDB_API_ANAHTARI değerini kontrol edin.",
      401
    );
  }
  if (yanit.status === 404) {
    throw new TmdbHatasi("Aranan film TMDB'de bulunamadı.", 404);
  }
  if (yanit.status === 429) {
    throw new TmdbHatasi("TMDB istek sınırı aşıldı. Lütfen biraz sonra tekrar deneyin.", 429);
  }
  if (!yanit.ok) {
    throw new TmdbHatasi("TMDB'den veri alınamadı. Lütfen tekrar deneyin.", yanit.status);
  }

  return yanit.json();
}

/** TMDB'de film arar (ilk sayfa, yetişkin içerik hariç). */
export async function filmAra(sorgu) {
  const veri = await tmdbIstek("/search/movie", {
    query: sorgu,
    include_adult: "false",
    page: 1,
  });

  return {
    toplam: Number(veri.total_results ?? 0),
    sonuclar: (veri.results ?? []).slice(0, 20).map((film) => ({
      tmdbId: film.id,
      baslik: film.title || film.original_title || "Adsız film",
      yil: (film.release_date ?? "").slice(0, 4) || null,
      posterYolu: film.poster_path ?? null,
      puan: Number(film.vote_average ?? 0),
      ozet: String(film.overview ?? "").trim(),
    })),
  };
}

/**
 * Film detayını kredilerle birlikte getirir.
 * Türkçe alanlar boşsa (ör. özet yoksa) İngilizce veriyle tamamlanır (spec: dil Türkçe).
 */
export async function filmDetay(tmdbId) {
  const film = await tmdbIstek(`/movie/${Number(tmdbId)}`, {
    append_to_response: "credits",
  });

  if (!String(film.overview ?? "").trim()) {
    try {
      const ingilizce = await tmdbIstek(`/movie/${Number(tmdbId)}`, {
        append_to_response: "credits",
        dil: "en-US",
      });
      if (!String(film.overview ?? "").trim()) film.overview = ingilizce.overview ?? "";
      if (!String(film.title ?? "").trim()) film.title = ingilizce.title ?? "";
    } catch {
      // Yedek istek başarısız olsa da Türkçe kayıt gösterilebilir.
    }
  }

  return film;
}

/** TMDB poster yolunu tam adrese çevirir; poster yoksa yerel yedeği döner. */
export function posterAdresi(posterYolu, boyut = "w500") {
  if (!posterYolu) return POSTER_YEDEK;
  const yol = String(posterYolu).startsWith("/") ? posterYolu : `/${posterYolu}`;
  return `${RESIM_TEMEL}/${boyut}${yol}`;
}
