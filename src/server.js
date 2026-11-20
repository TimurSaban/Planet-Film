import { uygulamaOlustur } from "./app.js";
import { prisma } from "./lib/prisma.js";

// PORT tanımsız, boş ya da geçersizse 3000 kullanılır.
const port = Number(process.env.PORT) || 3000;

async function baslat() {
  await prisma.$connect();
  console.log("Veritabanı bağlantısı kuruldu.");

  const app = uygulamaOlustur();
  const sunucu = app.listen(port, () => {
    console.log(`Planet Film Site çalışıyor: http://localhost:${port}`);
  });

  async function kapat(sinyal) {
    console.log(`\n${sinyal} alındı, sunucu kapatılıyor...`);
    sunucu.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => kapat("SIGINT"));
  process.on("SIGTERM", () => kapat("SIGTERM"));
}

baslat().catch(async (hata) => {
  console.error("Sunucu başlatılamadı:", hata);
  await prisma.$disconnect();
  process.exit(1);
});
