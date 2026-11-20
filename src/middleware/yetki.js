import { guvenliYonlendirme } from "../lib/yonlendirme.js";

function apiIstegiMi(istek) {
  return istek.originalUrl.startsWith("/api/");
}

/**
 * Giriş zorunlu rotalar için ara katman.
 * API isteklerinde 401 JSON, sayfa isteklerinde /giris yönlendirmesi döner.
 */
export function girisGerekli(istek, yanit, sonraki) {
  if (istek.session?.kullanici) return sonraki();

  if (apiIstegiMi(istek)) {
    return yanit.status(401).json({ hata: "Bu işlem için giriş yapmalısınız." });
  }

  const hedef = guvenliYonlendirme(istek.originalUrl);
  const sorgu = hedef ? `?yonlendirme=${encodeURIComponent(hedef)}` : "";
  return yanit.redirect(`/giris${sorgu}`);
}

/**
 * Yalnızca "yonetici" rolü için ara katman (spec Bölüm 6).
 * Yetki yalnızca arayüzde değil, sunucu tarafında da denetlenir.
 */
export function yoneticiGerekli(istek, yanit, sonraki) {
  const kullanici = istek.session?.kullanici;

  if (!kullanici) return girisGerekli(istek, yanit, sonraki);

  if (kullanici.rol !== "yonetici") {
    if (apiIstegiMi(istek)) {
      return yanit.status(403).json({ hata: "Bu sayfaya erişim yetkiniz yok." });
    }
    // Spec Bölüm 4.6: yetkisiz erişimde ana sayfaya yönlendirilir.
    return yanit.redirect("/");
  }

  return sonraki();
}
