import { prisma } from "../lib/prisma.js";

/** Filmin ortalama puanı, puan sayısı ve (giriş yapmışsa) kullanıcının puanı. */
export async function puanOzeti(filmId, kullaniciId = null) {
  const [toplam, kullaniciKaydi] = await Promise.all([
    prisma.puan.aggregate({
      where: { filmId },
      _avg: { puan: true },
      _count: { _all: true },
    }),
    kullaniciId
      ? prisma.puan.findUnique({
          where: { kullaniciId_filmId: { kullaniciId, filmId } },
          select: { puan: true },
        })
      : null,
  ]);

  return {
    ortalama: toplam._avg.puan ?? 0,
    sayi: toplam._count._all,
    kullaniciPuani: kullaniciKaydi?.puan ?? null,
  };
}

/** Puanı kaydeder; kullanıcının bu film için puanı varsa üzerine yazar (spec 4.4). */
export function puanKaydet(kullaniciId, filmId, puan) {
  return prisma.puan.upsert({
    where: { kullaniciId_filmId: { kullaniciId, filmId } },
    create: { kullaniciId, filmId, puan },
    update: { puan },
  });
}
