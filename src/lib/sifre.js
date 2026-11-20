import bcrypt from "bcrypt";

// Aşama 2: şifreler bcrypt ile hashlenir, düz metin asla saklanmaz (spec Bölüm 4.1 ve 6).
// 12 tur, güvenlik ile giriş hızı arasında makul bir dengedir.
const TUR_SAYISI = 12;

/** Şifreyi bcrypt ile hashler. */
export function sifreHashle(sifre) {
  return bcrypt.hash(sifre, TUR_SAYISI);
}

/** Girilen şifreyi kayıtlı hash ile karşılaştırır. */
export function sifreDogrula(sifre, sifreHash) {
  return bcrypt.compare(sifre, sifreHash);
}
