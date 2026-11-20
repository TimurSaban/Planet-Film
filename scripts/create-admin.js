import process from "node:process";
import { prisma } from "../src/lib/prisma.js";
import { sifreHashle } from "../src/lib/sifre.js";
import { kayitSemasi } from "../src/validasyon/kimlikSemalari.js";

// Tek seferlik yönetici oluşturma betiği (spec Bölüm 3 ve 12.1).
// Şifre koda yazılmaz; terminalde sorulur ve yalnızca hash'i kaydedilir.

if (!process.stdin.isTTY) {
  console.error(
    "Bu betik etkileşimli bir terminalde çalıştırılmalıdır: npm run create-admin"
  );
  process.exit(1);
}

/**
 * Terminali ham moda alıp satır okur. Gizli sorularda yazılan karakter yerine "*" gösterilir.
 * readline kullanılmaz: aynı akışı dinlediği için gizli girişi echo'layabiliyor.
 */
function satirOku(soru, { gizli = false } = {}) {
  const girdi = process.stdin;
  const eskiHam = girdi.isRaw;

  return new Promise((cozumle, reddet) => {
    let deger = "";

    function bitir() {
      girdi.removeListener("data", veriGeldi);
      girdi.setRawMode(Boolean(eskiHam));
      girdi.pause();
      process.stdout.write("\n");
    }

    function veriGeldi(parca) {
      for (const karakter of parca.toString("utf8")) {
        if (karakter === "\r" || karakter === "\n") {
          bitir();
          cozumle(deger);
          return;
        }
        if (karakter === "\u0003") {
          // Ctrl+C
          bitir();
          reddet(new Error("İptal edildi."));
          return;
        }
        if (karakter === "\u007f" || karakter === "\b") {
          if (deger.length > 0) {
            deger = deger.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        // Ok tuşları gibi kaçış dizileri yok sayılır.
        if (karakter === "\u001b") continue;

        deger += karakter;
        process.stdout.write(gizli ? "*" : karakter);
      }
    }

    girdi.setRawMode(true);
    girdi.resume();
    process.stdout.write(soru);
    girdi.on("data", veriGeldi);
  });
}

async function yoneticiOlustur() {
  const mevcut = await prisma.user.findFirst({
    where: { rol: "yonetici" },
    select: { kullaniciAdi: true },
  });

  if (mevcut) {
    console.log(
      `Veritabanında zaten bir yönetici var (${mevcut.kullaniciAdi}). Betik çalıştırılmadı.`
    );
    return;
  }

  console.log("Yeni yönetici hesabı oluşturulacak. (İptal etmek için Ctrl+C)\n");

  for (;;) {
    const kullaniciAdi = (await satirOku("Kullanıcı adı: ")).trim();
    const email = (await satirOku("E-posta: ")).trim();
    const sifre = (await satirOku("Şifre: ", { gizli: true })).trim();
    const sifreTekrar = (await satirOku("Şifre (tekrar): ", { gizli: true })).trim();

    if (sifre !== sifreTekrar) {
      console.log("\nŞifreler eşleşmiyor, tekrar deneyin.\n");
      continue;
    }

    const sonuc = kayitSemasi.safeParse({ kullaniciAdi, email, sifre });
    if (!sonuc.success) {
      console.log("\nGirilen bilgiler geçersiz:");
      for (const sorun of sonuc.error.issues) {
        console.log(`- ${sorun.message}`);
      }
      console.log("");
      continue;
    }

    const cakisma = await prisma.user.findFirst({
      where: {
        OR: [{ email: sonuc.data.email }, { kullaniciAdi: sonuc.data.kullaniciAdi }],
      },
      select: { email: true, kullaniciAdi: true },
    });

    if (cakisma) {
      console.log("\nBu kullanıcı adı veya e-posta adresi zaten kullanılıyor.\n");
      continue;
    }

    const sifreHash = await sifreHashle(sonuc.data.sifre);
    const yonetici = await prisma.user.create({
      data: {
        kullaniciAdi: sonuc.data.kullaniciAdi,
        email: sonuc.data.email,
        sifreHash,
        rol: "yonetici",
      },
    });

    console.log(`\nYönetici oluşturuldu: ${yonetici.kullaniciAdi} <${yonetici.email}>`);
    return;
  }
}

yoneticiOlustur()
  .catch((hata) => {
    console.error(hata.message === "İptal edildi." ? "\nİptal edildi." : `\nYönetici oluşturulamadı: ${hata.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
