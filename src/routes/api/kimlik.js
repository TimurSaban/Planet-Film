import { Router } from "express";
import { dogrula } from "../../lib/dogrulama.js";
import { sifreHashle, sifreDogrula } from "../../lib/sifre.js";
import { guvenliYonlendirme } from "../../lib/yonlendirme.js";
import { oturumBaslat, oturumBitir } from "../../middleware/oturum.js";
import {
  kullaniciBilgisi,
  kullaniciOlustur,
  kayitliKullaniciBul,
  kimlikIleKullaniciBul,
} from "../../services/kullanicilar.js";
import { kayitSemasi, girisSemasi } from "../../validasyon/kimlikSemalari.js";

export const kimlikRotalari = Router();

// POST /api/kayit — yeni üye oluşturur ve oturumu başlatır.
kimlikRotalari.post("/kayit", async (istek, yanit, sonraki) => {
  try {
    const sonuc = dogrula(kayitSemasi, istek.body);
    if (!sonuc.basarili) {
      return yanit.status(400).json({
        hata: "Lütfen formdaki alanları kontrol edin.",
        alanlar: sonuc.alanlar,
      });
    }

    const { kullaniciAdi, email, sifre } = sonuc.veri;

    const mevcut = await kayitliKullaniciBul({ kullaniciAdi, email });
    if (mevcut) {
      if (mevcut.email === email) {
        const mesaj = "Bu e-posta adresi zaten kayıtlı.";
        return yanit.status(409).json({ hata: mesaj, alanlar: { email: mesaj } });
      }
      const mesaj = "Bu kullanıcı adı zaten alınmış.";
      return yanit
        .status(409)
        .json({ hata: mesaj, alanlar: { kullaniciAdi: mesaj } });
    }

    const sifreHash = await sifreHashle(sifre);
    const kullanici = await kullaniciOlustur({ kullaniciAdi, email, sifreHash });

    await oturumBaslat(istek, kullaniciBilgisi(kullanici));

    return yanit.status(201).json({
      mesaj: "Kayıt başarılı, giriş yapıldı.",
      kullanici: kullaniciBilgisi(kullanici),
    });
  } catch (hata) {
    // Aynı anda gelen iki kayıtta benzersizlik kısıtı devreye girer (Prisma P2002).
    if (hata?.code === "P2002") {
      return yanit.status(409).json({
        hata: "Bu kullanıcı adı veya e-posta adresi zaten kayıtlı.",
      });
    }
    return sonraki(hata);
  }
});

// POST /api/giris — e-posta veya kullanıcı adı ile giriş.
kimlikRotalari.post("/giris", async (istek, yanit, sonraki) => {
  try {
    const sonuc = dogrula(girisSemasi, istek.body);
    if (!sonuc.basarili) {
      return yanit.status(400).json({
        hata: "Lütfen formdaki alanları kontrol edin.",
        alanlar: sonuc.alanlar,
      });
    }

    const { kimlik, sifre } = sonuc.veri;
    const kullanici = await kimlikIleKullaniciBul(kimlik);

    // Kullanıcı bulunamazsa da hash karşılaştırması yapılmış gibi davranılır:
    // dönen mesaj her iki durumda aynıdır, hangi bilginin yanlış olduğu açıklanmaz.
    const dogruMu = kullanici ? await sifreDogrula(sifre, kullanici.sifreHash) : false;
    if (!dogruMu) {
      return yanit
        .status(401)
        .json({ hata: "E-posta, kullanıcı adı veya şifre hatalı." });
    }

    await oturumBaslat(istek, kullaniciBilgisi(kullanici));

    return yanit.json({
      mesaj: "Giriş başarılı.",
      kullanici: kullaniciBilgisi(kullanici),
      yonlendirme: guvenliYonlendirme(sonuc.veri.yonlendirme) ?? "/",
    });
  } catch (hata) {
    return sonraki(hata);
  }
});

// POST /api/cikis — oturumu sonlandırır.
kimlikRotalari.post("/cikis", async (istek, yanit, sonraki) => {
  try {
    await oturumBitir(istek, yanit);
    return yanit.json({ mesaj: "Çıkış yapıldı." });
  } catch (hata) {
    return sonraki(hata);
  }
});

// GET /api/oturum — istemcinin oturum durumunu öğrenmesi için.
kimlikRotalari.get("/oturum", (istek, yanit) => {
  const kullanici = istek.session?.kullanici ?? null;
  yanit.set("Cache-Control", "no-store");
  yanit.json({ girisYapildi: Boolean(kullanici), kullanici });
});
