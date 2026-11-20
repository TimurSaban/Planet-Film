/**
 * Liste durumları (spec Bölüm 4.3).
 * Tek liste tablosunda `durum` metin olarak tutulur; ileride kitaplar için
 * "okudum"/"okuyacağım" gibi değerler eklenecek.
 */
export const LISTE_DURUM_DEGERLERI = ["izledim", "izleyeceğim"];

export const LISTE_DURUMLARI = [
  { deger: "izledim", sekme: "İzlediklerim", eylem: "İzledim" },
  { deger: "izleyeceğim", sekme: "İzleyeceklerim", eylem: "İzleyeceğim" },
];

/** Durum değerinin görünen etiketlerini döner; bilinmeyen değerde null. */
export function durumBilgisi(deger) {
  return LISTE_DURUMLARI.find((durum) => durum.deger === deger) ?? null;
}
