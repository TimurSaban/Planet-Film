import session from "express-session";

export const OTURUM_CEREZ_ADI = "pfs.oturum";
const YEDI_GUN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Oturum ara katmanı (spec Bölüm 2 ve 6).
 * Çerez httpOnly + sameSite; üretimde secure.
 *
 * Not: express-session'ın varsayılan MemoryStore'u geliştirme içindir;
 * üretimde kalıcı bir oturum deposu (ör. Redis) kullanılmalıdır.
 */
export function oturumAraKatmani() {
  const gizliAnahtar = process.env.SESSION_SECRET;
  if (!gizliAnahtar) {
    throw new Error(
      "SESSION_SECRET tanımlı değil. .env dosyasına (ya da sunucu ortam değişkenlerine) ekleyin."
    );
  }

  return session({
    name: OTURUM_CEREZ_ADI,
    secret: gizliAnahtar,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: YEDI_GUN_MS,
    },
  });
}

/** Görünümlere (layout) oturumdaki kullanıcıyı aktarır. */
export function oturumBilgisi(istek, yanit, sonraki) {
  yanit.locals.kullanici = istek.session?.kullanici ?? null;
  sonraki();
}

/** Oturumu yeniden oluşturup kullanıcıyı yazar (oturum sabitleme saldırısına karşı). */
export function oturumBaslat(istek, kullanici) {
  return new Promise((cozumle, reddet) => {
    istek.session.regenerate((hata) => {
      if (hata) return reddet(hata);
      istek.session.kullanici = kullanici;
      istek.session.save((kaydetmeHatasi) => {
        if (kaydetmeHatasi) return reddet(kaydetmeHatasi);
        cozumle();
      });
    });
  });
}

/** Oturumu siler ve çerezi temizler. */
export function oturumBitir(istek, yanit) {
  return new Promise((cozumle, reddet) => {
    istek.session.destroy((hata) => {
      if (hata) return reddet(hata);
      yanit.clearCookie(OTURUM_CEREZ_ADI, { path: "/" });
      cozumle();
    });
  });
}
