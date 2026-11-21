import { z } from "zod";
import { YORUM_TUR_DEGERLERI } from "../lib/yorumTurleri.js";

// Metin olmayan değerler boş metne çevrilir (kimlik semalarındaki gibi).
function metinAlani(sema) {
  return z.preprocess(
    (deger) => (typeof deger === "string" ? deger.trim() : ""),
    sema
  );
}

// Puan formu (spec 4.4): yalnızca 1-10 arası tam sayı kabul edilir.
export const puanSemasi = z.object({
  puan: z.coerce
    .number({ error: "Puan 1 ile 10 arasında bir tam sayı olmalı." })
    .int("Puan 1 ile 10 arasında bir tam sayı olmalı.")
    .min(1, "Puan en az 1 olmalı.")
    .max(10, "Puan en fazla 10 olabilir."),
});

// Yorum formu (spec 4.5): tür ve içerik. İçerik sınırları spec'te belirtilmediği
// için boş/anlamsız girdiyi engelleyen makul bir aralık seçildi.
export const yorumSemasi = z.object({
  tur: z.enum(YORUM_TUR_DEGERLERI, { error: "Geçersiz yorum türü." }),
  icerik: metinAlani(
    z
      .string()
      .min(3, "Yorum en az 3 karakter olmalı.")
      .max(5000, "Yorum en fazla 5000 karakter olabilir.")
  ),
});

// Yorum silme yolundaki tür parametresi.
export const yorumTuruSemasi = z.enum(YORUM_TUR_DEGERLERI, {
  error: "Geçersiz yorum türü.",
});
