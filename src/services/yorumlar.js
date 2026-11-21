import { prisma } from "../lib/prisma.js";

const YAZAR_DAHIL = { kullanici: { select: { kullaniciAdi: true } } };

/** Filmin belirli türdeki yorumları, en yeni önce. */
export function filmYorumlari(filmId, tur) {
  return prisma.yorum.findMany({
    where: { filmId, tur },
    include: YAZAR_DAHIL,
    orderBy: { olusturmaTarihi: "desc" },
  });
}

/** Kullanıcının bu filmdeki her iki türdeki yorumları (form ön doldurma için). */
export function kullaniciYorumlari(filmId, kullaniciId) {
  return prisma.yorum.findMany({
    where: { filmId, kullaniciId },
    orderBy: { olusturmaTarihi: "asc" },
  });
}

/** Profildeki "Yorumlarım" sekmesi: kullanıcının yayındaki filmlere yazdığı yorumlar. */
export function kullaniciYorumlariListesi(kullaniciId) {
  return prisma.yorum.findMany({
    where: { kullaniciId, film: { yayinda: true } },
    include: {
      film: { select: { id: true, baslik: true } },
    },
    orderBy: { guncellemeTarihi: "desc" },
  });
}

/**
 * Yorumu kaydeder. Kullanıcının aynı film ve türde yorumu varsa günceller
 * (spec 4.5: kullanıcı başına film başına tür başına tek yorum).
 */
export async function yorumKaydet(kullaniciId, filmId, tur, icerik) {
  const mevcut = await prisma.yorum.findUnique({
    where: { kullaniciId_filmId_tur: { kullaniciId, filmId, tur } },
    select: { id: true },
  });

  const yorum = await prisma.yorum.upsert({
    where: { kullaniciId_filmId_tur: { kullaniciId, filmId, tur } },
    create: { kullaniciId, filmId, tur, icerik },
    update: { icerik },
  });

  return { yorum, guncellendi: Boolean(mevcut) };
}

/**
 * Yorumu siler. Silme koşulu kullanıcıya bağlıdır; başka bir kullanıcının
 * yorumu bu yolla silinemez (yönetici moderasyonu Aşama 6'da eklenecek).
 */
export function yorumSil(kullaniciId, filmId, tur) {
  return prisma.yorum.deleteMany({ where: { kullaniciId, filmId, tur } });
}
