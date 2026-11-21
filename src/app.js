import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sayfalar } from "./routes/sayfalar.js";
import { kimlikRotalari } from "./routes/api/kimlik.js";
import { filmRotalari } from "./routes/filmler.js";
import { etkilesimRotalari } from "./routes/etkilesimler.js";
import { profilRotalari } from "./routes/profil.js";
import { adminRotalari } from "./routes/admin.js";
import { sayfaSablonu } from "./views/layout.js";
import { oturumAraKatmani, oturumBilgisi } from "./middleware/oturum.js";

const kokDizin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function uygulamaOlustur() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Üretimde güvenli çerez ve istemci IP'si için (proxy arkasında çalışırken).
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Oturum: httpOnly + sameSite çerez, üretimde secure (spec Bölüm 6).
  app.use(oturumAraKatmani());
  app.use(oturumBilgisi);

  // Statik dosyalar: CSS, JS, görseller
  app.use(
    express.static(path.join(kokDizin, "public"), {
      maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
    })
  );

  // API uçları (Aşama 2: kayıt, giriş, çıkış, oturum)
  app.use("/api", kimlikRotalari);

  // Film sayfaları ve yönetici film aktarma akışı (Aşama 3)
  // Puan ve yorum POST'ları (Aşama 5) film rotalarından önce bağlanır.
  app.use("/filmler", etkilesimRotalari);
  app.use("/filmler", filmRotalari);
  // Profil ve film listeleri (Aşama 4)
  app.use("/profil", profilRotalari);
  app.use("/admin", adminRotalari);

  app.use("/", sayfalar);

  // API için JSON 404
  app.use("/api", (istek, yanit) => {
    yanit.status(404).json({ hata: "İstenen API yolu bulunamadı." });
  });

  // 404
  app.use((istek, yanit) => {
    const icerik = `
      <section class="bolum">
        <h1>Sayfa bulunamadı</h1>
        <p class="kahraman-metin">Aradığınız sayfa mevcut değil ya da taşınmış olabilir.</p>
        <a class="dugme dugme-birincil" href="/">Ana Sayfaya Dön</a>
      </section>`;

    yanit.status(404).send(
      sayfaSablonu({
        baslik: "Sayfa bulunamadı",
        icerik,
        kullanici: yanit.locals.kullanici,
      })
    );
  });

  // Hata yakalayıcı
  app.use((hata, istek, yanit, sonraki) => {
    console.error("Sunucu hatası:", hata);

    // API isteklerinde HTML yerine JSON döner.
    if (istek.originalUrl.startsWith("/api/")) {
      const durum = Number(hata?.status) || 500;
      return yanit.status(durum).json({
        hata:
          durum === 500
            ? "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
            : "İstek işlenemedi.",
      });
    }

    yanit
      .status(500)
      .send(
        sayfaSablonu({
          baslik: "Sunucu hatası",
          kullanici: yanit.locals.kullanici,
          icerik: `
      <section class="bolum">
        <h1>Bir şeyler ters gitti</h1>
        <p class="kahraman-metin">İsteğiniz işlenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.</p>
        <a class="dugme dugme-birincil" href="/">Ana Sayfaya Dön</a>
      </section>`,
        })
      );
  });

  return app;
}
