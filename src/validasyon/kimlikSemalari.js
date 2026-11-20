import { z } from "zod";

// Sunucu tarafı doğrulama (spec Bölüm 6: tüm kullanıcı girdileri zod ile doğrulanır).
// Metin olmayan değerler boş metne çevrilir; hata mesajları Türkçedir.

function metinAlani(sema) {
  return z.preprocess(
    (deger) => (typeof deger === "string" ? deger.trim() : ""),
    sema
  );
}

const kullaniciAdiSemasi = metinAlani(
  z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalı.")
    .max(30, "Kullanıcı adı en fazla 30 karakter olabilir.")
    .regex(
      /^[A-Za-z0-9ÇĞİÖŞÜçğıöşü_]+$/,
      "Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir."
    )
);

const emailSemasi = metinAlani(
  z
    .string()
    .max(254, "E-posta adresi çok uzun.")
    .email("Geçerli bir e-posta adresi girin.")
    .transform((deger) => deger.toLowerCase())
);

const sifreSemasi = metinAlani(
  z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı.")
    // bcrypt yalnızca ilk 72 baytı kullanır; daha uzun şifreler sessizce kırpılmasın.
    .max(72, "Şifre en fazla 72 karakter olabilir.")
);

export const kayitSemasi = z.object({
  kullaniciAdi: kullaniciAdiSemasi,
  email: emailSemasi,
  sifre: sifreSemasi,
});

export const girisSemasi = z.object({
  kimlik: metinAlani(
    z.string().min(1, "E-posta veya kullanıcı adı gerekli.").max(254)
  ),
  sifre: metinAlani(z.string().min(1, "Şifre gerekli.").max(72)),
  yonlendirme: z.string().optional(),
});
