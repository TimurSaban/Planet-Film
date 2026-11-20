/**
 * Zod şemasıyla doğrulama yardımcısı.
 * Başarısız olduğunda alan adı -> Türkçe hata mesajı eşlemesi döner.
 *
 * @returns {{ basarili: true, veri: object, alanlar: object }
 *        | { basarili: false, veri: null, alanlar: Record<string, string> }}
 */
export function dogrula(sema, veri) {
  const sonuc = sema.safeParse(veri ?? {});

  if (sonuc.success) {
    return { basarili: true, veri: sonuc.data, alanlar: {} };
  }

  const alanlar = {};
  for (const sorun of sonuc.error.issues) {
    const alan = String(sorun.path[0] ?? "genel");
    // Her alan için ilk hata mesajı gösterilir.
    if (!alanlar[alan]) alanlar[alan] = sorun.message;
  }

  return { basarili: false, veri: null, alanlar };
}
