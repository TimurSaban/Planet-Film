import { prisma } from "../lib/prisma.js";
import { aramaMetniNormalize } from "../lib/arama.js";

export const YONETIM_SAYFA_BOYUTU = 20;

function sayfaBilgisi(toplam, sayfa) {
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / YONETIM_SAYFA_BOYUTU));
  const gecerliSayfa = Math.min(Math.max(1, Number(sayfa) || 1), sayfaSayisi);
  return {
    sayfa: gecerliSayfa,
    sayfaSayisi,
    atla: (gecerliSayfa - 1) * YONETIM_SAYFA_BOYUTU,
  };
}

/** Panelin genel bakış sayfasındaki sayaçlar. */
export async function yonetimOzeti() {
  const [filmSayisi, yayindaFilm, kullaniciSayisi, yorumSayisi, puanSayisi] =
    await Promise.all([
      prisma.movie.count(),
      prisma.movie.count({ where: { yayinda: true } }),
      prisma.user.count(),
      prisma.yorum.count(),
      prisma.puan.count(),
    ]);

  return { filmSayisi, yayindaFilm, kullaniciSayisi, yorumSayisi, puanSayisi };
}

/** Yayında olsun olmasın tüm filmleri sayfalı listeler. */
export async function yonetimFilmleri({ sayfa = 1, arama = "" } = {}) {
  const metin = aramaMetniNormalize(arama);
  const ham = String(arama ?? "").trim();
  // `aramaMetni` TMDB'den aktarılan kayıtlarda doludur; elle oluşturulmuş eski
  // kayıtlar için başlık alanlarında da aranır.
  const where = metin
    ? {
        OR: [
          { aramaMetni: { contains: metin } },
          { baslik: { contains: ham } },
          { orijinalBaslik: { contains: ham } },
        ],
      }
    : {};

  const toplam = await prisma.movie.count({ where });
  const { sayfa: gecerliSayfa, sayfaSayisi, atla } = sayfaBilgisi(toplam, sayfa);

  const filmler = await prisma.movie.findMany({
    where,
    include: {
      _count: { select: { puanlar: true, yorumlar: true } },
    },
    // Yönetim listesinde en son eklenen/değişen üstte kalsın; yayından kaldırılan
    // film listenin sonuna savrulmasın.
    orderBy: { id: "desc" },
    skip: atla,
    take: YONETIM_SAYFA_BOYUTU,
  });

  return { filmler, toplam, sayfa: gecerliSayfa, sayfaSayisi };
}

/** Yayında olmayan filmler dahil tek filmi getirir (düzenleme için). */
export function filmYonetimBul(id) {
  return prisma.movie.findUnique({
    where: { id: Number(id) },
    include: {
      turler: { include: { tur: true } },
      _count: { select: { puanlar: true, yorumlar: true } },
    },
  });
}

/** Film bilgilerini günceller; arama metni başlıklardan yeniden üretilir. */
export function filmGuncelle(id, veri) {
  return prisma.movie.update({
    where: { id: Number(id) },
    data: {
      ...veri,
      aramaMetni: aramaMetniNormalize(
        `${veri.baslik ?? ""} ${veri.orijinalBaslik ?? ""}`
      ),
    },
  });
}

/** Filmi yayından kaldırır ya da yeniden yayınlar. */
export function filmYayinDurumu(id, yayinda) {
  return prisma.movie.update({
    where: { id: Number(id) },
    data: { yayinda },
  });
}

/** Tüm yorumları yazar ve film bilgisiyle sayfalı listeler. */
export async function yonetimYorumlari({ sayfa = 1 } = {}) {
  const toplam = await prisma.yorum.count();
  const { sayfa: gecerliSayfa, sayfaSayisi, atla } = sayfaBilgisi(toplam, sayfa);

  const yorumlar = await prisma.yorum.findMany({
    include: {
      kullanici: { select: { kullaniciAdi: true } },
      film: { select: { id: true, baslik: true } },
    },
    orderBy: { olusturmaTarihi: "desc" },
    skip: atla,
    take: YONETIM_SAYFA_BOYUTU,
  });

  return { yorumlar, toplam, sayfa: gecerliSayfa, sayfaSayisi };
}

/** Yöneticinin moderasyon amacıyla herhangi bir yorumu silmesi. */
export function yorumYonetimSil(id) {
  return prisma.yorum.deleteMany({ where: { id: Number(id) } });
}

/** Kullanıcıları liste, puan ve yorum sayılarıyla sayfalı listeler. */
export async function yonetimKullanicilari({ sayfa = 1 } = {}) {
  const toplam = await prisma.user.count();
  const { sayfa: gecerliSayfa, sayfaSayisi, atla } = sayfaBilgisi(toplam, sayfa);

  const kullanicilar = await prisma.user.findMany({
    select: {
      id: true,
      kullaniciAdi: true,
      email: true,
      rol: true,
      aktif: true,
      olusturmaTarihi: true,
      _count: { select: { listeKayitlari: true, puanlar: true, yorumlar: true } },
    },
    orderBy: { olusturmaTarihi: "desc" },
    skip: atla,
    take: YONETIM_SAYFA_BOYUTU,
  });

  return { kullanicilar, toplam, sayfa: gecerliSayfa, sayfaSayisi };
}

export function kullaniciYonetimBul(id) {
  return prisma.user.findUnique({
    where: { id: Number(id) },
    select: { id: true, kullaniciAdi: true, rol: true, aktif: true },
  });
}

/** Hesabı devre dışı bırakır ya da yeniden etkinleştirir. */
export function kullaniciAktiflik(id, aktif) {
  return prisma.user.update({
    where: { id: Number(id) },
    data: { aktif },
  });
}
