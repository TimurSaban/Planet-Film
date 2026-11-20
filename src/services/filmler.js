import { prisma } from "../lib/prisma.js";
import { aramaMetniNormalize } from "../lib/arama.js";
import { filmDetay, tmdbAnahtariTanimliMi } from "../lib/tmdb.js";
import { tmdbFilmVerisiniEsle } from "./tmdbFilmleri.js";

export const SAYFA_BOYUTU = 20;

// TMDB verileri 6 aydan uzun süre önbelleğe alınamaz (TMDB API kullanım koşulları).
// Bu yüzden film kaydı 30 günden eskiyse detay sayfası açıldığında sessizce yenilenir.
const YENILEME_SURESI_MS = 30 * 24 * 60 * 60 * 1000;
// Başarısız yenileme denemesi bir süre ertelenir; böylece film sayfası her
// açıldığında TMDB'ye tekrar gidilip zaman aşımı beklenmez.
const HATA_BEKLEME_MS = 60 * 60 * 1000;
const basarisizYenilemeler = new Map();

const TUR_DAHIL = { turler: { include: { tur: true } } };

function bugununBaslangici() {
  const bugun = new Date();
  bugun.setUTCHours(0, 0, 0, 0);
  return bugun;
}

/** Yayında olan filmleri arar, tür/durum filtreler ve sayfalar (spec Bölüm 4.2). */
export async function filmleriListele({ arama = "", turId = null, durum = null, sayfa = 1 } = {}) {
  const kosullar = [{ yayinda: true }];

  const metin = aramaMetniNormalize(arama);
  if (metin) kosullar.push({ aramaMetni: { contains: metin } });

  if (turId) kosullar.push({ turler: { some: { turId } } });

  if (durum === "yakinda") {
    kosullar.push({ yayinTarihi: { gt: bugununBaslangici() } });
  } else if (durum === "yayinda") {
    kosullar.push({
      OR: [{ yayinTarihi: null }, { yayinTarihi: { lte: bugununBaslangici() } }],
    });
  }

  const where = { AND: kosullar };

  const toplam = await prisma.movie.count({ where });
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));
  const gecerliSayfa = Math.min(Math.max(1, Number(sayfa) || 1), sayfaSayisi);

  const filmler = await prisma.movie.findMany({
    where,
    include: TUR_DAHIL,
    orderBy: [{ yayinTarihi: "desc" }, { id: "desc" }],
    skip: (gecerliSayfa - 1) * SAYFA_BOYUTU,
    take: SAYFA_BOYUTU,
  });

  return { filmler, toplam, sayfa: gecerliSayfa, sayfaSayisi };
}

/** Filtre kutusunda listelenecek tüm türler. */
export function tumTurler() {
  return prisma.tur.findMany({ orderBy: { ad: "asc" } });
}

/** Yayındaki tek bir filmi türleriyle getirir. */
export function filmBul(id) {
  return prisma.movie.findFirst({
    where: { id: Number(id), yayinda: true },
    include: TUR_DAHIL,
  });
}

/** Ana sayfa için son eklenen filmler. */
export function sonFilmler(adet = 8) {
  return prisma.movie.findMany({
    where: { yayinda: true },
    include: TUR_DAHIL,
    orderBy: { olusturmaTarihi: "desc" },
    take: adet,
  });
}

/** Verilen TMDB kimliklerinden veritabanında zaten olanları bulur. */
export function tmdbIdleriyleFilmler(tmdbIdler) {
  if (!tmdbIdler.length) return Promise.resolve([]);
  return prisma.movie.findMany({
    where: { tmdbId: { in: tmdbIdler } },
    select: { id: true, tmdbId: true },
  });
}

/** TMDB kimliğiyle kayıtlı film (aktarma öncesi kontrol). */
export function tmdbIleFilmBul(tmdbId) {
  return prisma.movie.findUnique({
    where: { tmdbId: Number(tmdbId) },
    select: { id: true, baslik: true },
  });
}

/** TMDB verisini film + tür kayıtları olarak ekler ya da günceller. */
export async function filmKaydet(tmdbVerisi) {
  const { film, turler } = tmdbFilmVerisiniEsle(tmdbVerisi);

  return prisma.$transaction(async (tx) => {
    const kayit = await tx.movie.upsert({
      where: { tmdbId: film.tmdbId },
      create: film,
      update: film,
    });

    // Tür ilişkileri her aktarımda yeniden kurulur (TMDB türleri değişebilir).
    await tx.filmTur.deleteMany({ where: { filmId: kayit.id } });

    for (const tur of turler) {
      const turKaydi = await tx.tur.upsert({
        where: { tmdbId: tur.tmdbId },
        create: tur,
        update: { ad: tur.ad },
      });
      await tx.filmTur.create({
        data: { filmId: kayit.id, turId: turKaydi.id },
      });
    }

    return kayit;
  });
}

/** Son deneme yakın zamanda başarısız olduysa tekrar denenmez. */
function yakinZamandaBasarisiz(filmId) {
  const onceki = basarisizYenilemeler.get(filmId);
  if (!onceki) return false;
  if (Date.now() - onceki < HATA_BEKLEME_MS) return true;
  basarisizYenilemeler.delete(filmId);
  return false;
}

/** 30 günden eski film verisini TMDB'den yeniler; hata olursa mevcut kayıt döner. */
export async function filmYenile(film) {
  const yas = Date.now() - new Date(film.tmdbGuncellemeTarihi).getTime();
  if (Number.isFinite(yas) && yas < YENILEME_SURESI_MS) return film;

  // Anahtar yoksa istek atılmaz: sayfa beklemesin, günlük dolmasın.
  if (!tmdbAnahtariTanimliMi()) return film;
  if (yakinZamandaBasarisiz(film.id)) return film;

  try {
    const veri = await filmDetay(film.tmdbId);
    await filmKaydet(veri);
    basarisizYenilemeler.delete(film.id);
    return (await filmBul(film.id)) ?? film;
  } catch (hata) {
    if (basarisizYenilemeler.size > 1000) basarisizYenilemeler.clear();
    basarisizYenilemeler.set(film.id, Date.now());
    console.warn(`Film ${film.id} TMDB'den yenilenemedi: ${hata.message}`);
    return film;
  }
}
