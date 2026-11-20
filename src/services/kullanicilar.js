import { prisma } from "../lib/prisma.js";

/** Oturuma ve istemciye gönderilecek güvenli kullanıcı bilgisi (şifre hash'i asla). */
export function kullaniciBilgisi(kullanici) {
  return {
    id: kullanici.id,
    kullaniciAdi: kullanici.kullaniciAdi,
    email: kullanici.email,
    rol: kullanici.rol,
  };
}

/** Aynı kullanıcı adı ya da e-posta ile kayıtlı hesap var mı? */
export function kayitliKullaniciBul({ kullaniciAdi, email }) {
  return prisma.user.findFirst({
    where: { OR: [{ kullaniciAdi }, { email }] },
    select: { id: true, kullaniciAdi: true, email: true },
  });
}

/** Giriş için e-posta (küçük harf) veya kullanıcı adı ile kullanıcıyı bulur. */
export function kimlikIleKullaniciBul(kimlik) {
  const deger = kimlik.trim();
  return prisma.user.findFirst({
    where: {
      OR: [{ email: deger.toLowerCase() }, { kullaniciAdi: deger }],
    },
  });
}

/** Yeni üye oluşturur; rol varsayılan olarak "uye" kalır (yönetici betikle oluşturulur). */
export function kullaniciOlustur({ kullaniciAdi, email, sifreHash }) {
  return prisma.user.create({
    data: { kullaniciAdi, email, sifreHash },
  });
}
