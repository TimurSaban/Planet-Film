/**
 * Arama metnini sadeleştirir: Türkçe karakterler ASCII karşılığına çevrilir,
 * küçük harfe indirilir ve boşluklar tekleştirilir.
 *
 * SQLite'ta büyük/küçük harf duyarsız `contains` olmadığı için arama hem
 * kayıtta (movies.arama_metni) hem sorguda bu fonksiyonla normalize edilir.
 */
const HARF_ESLEMESI = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
  Ç: "c",
  Ğ: "g",
  İ: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
  Â: "a",
  Î: "i",
  Û: "u",
};

export function aramaMetniNormalize(deger) {
  return String(deger ?? "")
    .replace(/[çğıöşüâîûÇĞİÖŞÜÂÎÛ]/g, (harf) => HARF_ESLEMESI[harf] ?? harf)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
