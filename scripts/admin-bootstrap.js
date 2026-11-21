import process from "node:process";
import { prisma } from "../src/lib/prisma.js";
import { sifreHashle } from "../src/lib/sifre.js";
import { kayitSemasi } from "../src/validasyon/kimlikSemalari.js";

// Üretim (Render ücretsiz plan) için tek seferlik yönetici tohumlaması.
// Ücretsiz Render servislerinde shell/SSH olmadığından `npm run create-admin`
// çalıştırılamaz. Bu betik ADMIN_KULLANICI_ADI, ADMIN_EMAIL ve ADMIN_SIFRE
// ortam değişkenlerini kullanır; veritabanında zaten bir yönetici varsa hiçbir
// şey yapmaz. Şifre koda veya git'e yazılmaz; yalnızca Render secret olarak tutulur.
// Yereldeki etkileşimli akış `npm run create-admin` olarak korunur.

const kullaniciAdi = String(process.env.ADMIN_KULLANICI_ADI ?? "").trim();
const email = String(process.env.ADMIN_EMAIL ?? "").trim();
const sifre = process.env.ADMIN_SIFRE;

const tanimliSayisi = [kullaniciAdi, email, sifre].filter(Boolean).length;

if (tanimliSayisi === 0) {
  console.log("ADMIN_* ortam değişkenleri tanımlı değil; yönetici tohumlaması atlandı.");
  process.exit(0);
}

async function calistir() {
  const mevcut = await prisma.user.findFirst({
    where: { rol: "yonetici" },
    select: { kullaniciAdi: true },
  });

  // Yönetici varsa eksik/silinmiş ADMIN_* değişkenleri başlangıcı durdurmamalı.
  if (mevcut) {
    console.log(`Veritabanında zaten bir yönetici var (${mevcut.kullaniciAdi}); atlandı.`);
    return;
  }

  if (tanimliSayisi !== 3) {
    console.error(
      "Yönetici tohumlaması için ADMIN_KULLANICI_ADI, ADMIN_EMAIL ve ADMIN_SIFRE birlikte tanımlanmalı."
    );
    process.exitCode = 1;
    return;
  }

  const sonuc = kayitSemasi.safeParse({ kullaniciAdi, email, sifre });
  if (!sonuc.success) {
    console.error("Yönetici bilgileri geçersiz:");
    for (const sorun of sonuc.error.issues) {
      console.error(`- ${sorun.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const cakisma = await prisma.user.findFirst({
    where: {
      OR: [{ email: sonuc.data.email }, { kullaniciAdi: sonuc.data.kullaniciAdi }],
    },
    select: { email: true, kullaniciAdi: true },
  });

  if (cakisma) {
    console.error("Bu kullanıcı adı veya e-posta adresi zaten kullanılıyor.");
    process.exitCode = 1;
    return;
  }

  const yonetici = await prisma.user.create({
    data: {
      kullaniciAdi: sonuc.data.kullaniciAdi,
      email: sonuc.data.email,
      sifreHash: await sifreHashle(sonuc.data.sifre),
      rol: "yonetici",
    },
  });

  console.log(`Yönetici oluşturuldu: ${yonetici.kullaniciAdi} <${yonetici.email}>`);
  console.log(
    "Güvenlik için Render panelinden ADMIN_SIFRE değişkenini kaldırabilirsiniz; betik artık atlanacak."
  );
}

calistir()
  .catch((hata) => {
    console.error("Yönetici tohumlaması başarısız:", hata.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
