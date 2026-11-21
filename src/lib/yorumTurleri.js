/**
 * Yorum türleri (spec 4.5). Sayfada ayrı sekmelerde gösterilir; veritabanında
 * `tur` metin olarak tutulur.
 */
export const YORUM_TUR_DEGERLERI = ["spoilersiz", "spoilerli"];

export const YORUM_TURLERI = [
  {
    deger: "spoilersiz",
    sekme: "Spoilersız",
    baslik: "Spoilersız yorumunuz",
    ipucu: "Filmi bozmadan genel değerlendirmenizi yazın.",
  },
  {
    deger: "spoilerli",
    sekme: "Spoilerlı",
    baslik: "Spoilerlı yorumunuz",
    ipucu:
      "Olay örgüsü ve sonla ilgili detaylar içerebilir. Okurlara uyarı gösterilir, yorumu ancak tıklayınca görürler.",
  },
];

/** Tür değerinin görünen bilgilerini döner; bilinmeyen değerde null. */
export function yorumTuruBilgisi(deger) {
  return YORUM_TURLERI.find((tur) => tur.deger === deger) ?? null;
}
