import { prisma } from "../lib/prisma.js";

// Liste kayıtlarıyla birlikte film ve türlerini getirmek için ortak include.
const FILM_DAHIL = { film: { include: { turler: { include: { tur: true } } } } };

/** Filmin kullanıcı listesindeki durumunu döner; listede değilse null. */
export async function filmListeDurumu(kullaniciId, filmId) {
  const kayit = await prisma.liste.findUnique({
    where: { kullaniciId_filmId: { kullaniciId, filmId } },
    select: { durum: true },
  });
  return kayit?.durum ?? null;
}

/** Filmi listeye ekler; film zaten listedeyse durumunu günceller (spec 4.3). */
export function listeyeEkle(kullaniciId, filmId, durum) {
  return prisma.liste.upsert({
    where: { kullaniciId_filmId: { kullaniciId, filmId } },
    create: { kullaniciId, filmId, durum },
    update: { durum },
  });
}

/** Filmi listeden çıkarır; kayıt yoksa sessizce geçer. */
export function listedenCikar(kullaniciId, filmId) {
  return prisma.liste.deleteMany({ where: { kullaniciId, filmId } });
}

/** Kullanıcının belirli durumdaki yayındaki filmleri, en son eklenen önce. */
export async function kullaniciListesi(kullaniciId, durum) {
  const kayitlar = await prisma.liste.findMany({
    where: { kullaniciId, durum, film: { yayinda: true } },
    include: FILM_DAHIL,
    orderBy: { olusturmaTarihi: "desc" },
  });
  return kayitlar.map((kayit) => kayit.film);
}
