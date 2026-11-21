import { z } from "zod";

function metinAlani(sema) {
  return z.preprocess(
    (deger) => (typeof deger === "string" ? deger.trim() : ""),
    sema
  );
}

const bosuNull = (deger) =>
  typeof deger === "string" && deger.trim() === "" ? null : deger;

const opsiyonelTarih = z.preprocess(
  bosuNull,
  z.coerce
    .date({ error: "Geçerli bir yayın tarihi girin." })
    .nullable()
);

const opsiyonelSayi = (enAz, enFazla, mesaj) =>
  z.preprocess(
    bosuNull,
    z.coerce
      .number({ error: mesaj })
      .int(mesaj)
      .min(enAz, mesaj)
      .max(enFazla, mesaj)
      .nullable()
  );

// /admin/filmler/:id/duzenle formu (spec 4.6).
export const filmDuzenleSemasi = z.object({
  baslik: metinAlani(
    z.string().min(1, "Başlık gerekli.").max(200, "Başlık en fazla 200 karakter olabilir.")
  ),
  orijinalBaslik: metinAlani(
    z
      .string()
      .min(1, "Orijinal başlık gerekli.")
      .max(200, "Orijinal başlık en fazla 200 karakter olabilir.")
  ),
  ozet: metinAlani(z.string().max(5000, "Özet en fazla 5000 karakter olabilir.")),
  yayinTarihi: opsiyonelTarih,
  sureDakika: opsiyonelSayi(1, 1000, "Süre 1 ile 1000 dakika arasında olmalı."),
  posterYolu: z.preprocess(
    bosuNull,
    z.string().max(300, "Poster yolu en fazla 300 karakter olabilir.").nullable()
  ),
  yonetmen: metinAlani(z.string().max(300, "Yönetmen en fazla 300 karakter olabilir.")),
  oyuncular: metinAlani(z.string().max(500, "Oyuncular en fazla 500 karakter olabilir.")),
  tmdbPuan: z.preprocess(
    bosuNull,
    z.coerce
      .number({ error: "TMDB puanı 0 ile 10 arasında olmalı." })
      .min(0, "TMDB puanı 0 ile 10 arasında olmalı.")
      .max(10, "TMDB puanı 0 ile 10 arasında olmalı.")
      .nullable()
  ),
  yayinda: z.preprocess(
    (deger) => deger === "1" || deger === "on" || deger === true,
    z.boolean()
  ),
});

export const yonetimSayfaSemasi = z.coerce.number().int().min(1).default(1);

export const yonetimAramaSemasi = z
  .string()
  .max(100, "Arama en fazla 100 karakter olabilir.")
  .optional()
  .default("");
