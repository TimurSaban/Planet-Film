import { Router } from "express";
import { sayfaSablonu } from "../views/layout.js";
import { adminFilmEkleIcerigi } from "../views/adminFilmSayfalari.js";
import { yoneticiGerekli } from "../middleware/yetki.js";
import { dogrula } from "../lib/dogrulama.js";
import { kacisMetni } from "../lib/html.js";
import { filmAra, filmDetay, TmdbHatasi } from "../lib/tmdb.js";
import {
  filmKaydet,
  tmdbIleFilmBul,
  tmdbIdleriyleFilmler,
} from "../services/filmler.js";
import { filmAktarSemasi } from "../validasyon/filmSemalari.js";
import {
  filmDuzenleSemasi,
  yonetimAramaSemasi,
  yonetimSayfaSemasi,
} from "../validasyon/adminSemalari.js";
import {
  filmDuzenleIcerigi,
  yonetimAnaIcerigi,
  yonetimFilmleriIcerigi,
  yonetimKullanicilariIcerigi,
  yonetimYorumlariIcerigi,
} from "../views/yonetimSayfalari.js";
import {
  filmGuncelle,
  filmYayinDurumu,
  filmYonetimBul,
  kullaniciAktiflik,
  kullaniciYonetimBul,
  yonetimFilmleri,
  yonetimKullanicilari,
  yonetimOzeti,
  yonetimYorumlari,
  yorumYonetimSil,
} from "../services/yonetim.js";

export const adminRotalari = Router();

// Spec Bölüm 4.6/6: tüm /admin yolları sunucu tarafında rol kontrolüyle korunur.
adminRotalari.use(yoneticiGerekli);

function yonetimSayfasi(yanit, { baslik, icerik }) {
  yanit.set("Cache-Control", "private, no-store");
  return yanit.send(
    sayfaSablonu({
      baslik,
      aktifMenu: "/admin",
      kullanici: yanit.locals.kullanici,
      icerik,
    })
  );
}

function yonetimHata(yanit, mesaj, durum = 400) {
  return yanit.status(durum).send(
    sayfaSablonu({
      baslik: "İstek işlenemedi",
      aktifMenu: "/admin",
      kullanici: yanit.locals.kullanici,
      icerik: `
      <section class="bolum">
        <h1>İstek işlenemedi</h1>
        <p class="kahraman-metin">${kacisMetni(mesaj)}</p>
        <a class="dugme dugme-birincil" href="/admin">Yönetici Paneline Dön</a>
      </section>`,
    })
  );
}

function gecerliId(deger) {
  const id = Number(deger);
  return Number.isInteger(id) && id > 0 ? id : null;
}

adminRotalari.get("/", async (istek, yanit) => {
  const ozet = await yonetimOzeti();
  return yonetimSayfasi(yanit, {
    baslik: "Yönetici Paneli",
    icerik: yonetimAnaIcerigi({ ozet }),
  });
});

function ekleSayfasi(yanit, { q = "", arama = null, hata = null, eklendi = null, zaten = null, mevcutFilmler = {} }) {
  return yanit.send(
    sayfaSablonu({
      baslik: "TMDB'den Film Ekle",
      kullanici: yanit.locals.kullanici,
      icerik: adminFilmEkleIcerigi({ q, arama, hata, eklendi, zaten, mevcutFilmler }),
    })
  );
}

// Aşama 3: yönetici TMDB'de arayıp filmi veritabanına aktarır.
adminRotalari.get("/filmler/ekle", async (istek, yanit) => {
  const q = typeof istek.query.q === "string" ? istek.query.q.trim().slice(0, 100) : "";

  let eklendi = null;
  if (istek.query.eklendi) {
    const id = Number(istek.query.eklendi);
    if (Number.isInteger(id) && id > 0) eklendi = { id };
  }

  let zaten = null;
  if (istek.query.zaten) {
    const id = Number(istek.query.zaten);
    if (Number.isInteger(id) && id > 0) zaten = { id };
  }

  if (!q) {
    return ekleSayfasi(yanit, { eklendi, zaten });
  }

  try {
    const arama = await filmAra(q);
    const kayitlar = await tmdbIdleriyleFilmler(arama.sonuclar.map((film) => film.tmdbId));
    const mevcutFilmler = Object.fromEntries(
      kayitlar.map((kayit) => [kayit.tmdbId, { id: kayit.id }])
    );

    return ekleSayfasi(yanit, { q, arama, eklendi, zaten, mevcutFilmler });
  } catch (hata) {
    if (!(hata instanceof TmdbHatasi)) throw hata;
    return ekleSayfasi(yanit, { q, hata: hata.message, eklendi, zaten });
  }
});

adminRotalari.post("/filmler/aktar", async (istek, yanit) => {
  const sonuc = dogrula(filmAktarSemasi, istek.body);

  if (!sonuc.basarili) {
    return ekleSayfasi(yanit, {
      q: typeof istek.body?.q === "string" ? istek.body.q.trim().slice(0, 100) : "",
      hata: "Geçerli bir film seçin.",
    });
  }

  const { tmdbId, q } = sonuc.veri;

  const mevcut = await tmdbIleFilmBul(tmdbId);
  if (mevcut) return yanit.redirect(`/admin/filmler/ekle?zaten=${mevcut.id}`);

  try {
    const detay = await filmDetay(tmdbId);
    const film = await filmKaydet(detay);
    return yanit.redirect(`/admin/filmler/ekle?eklendi=${film.id}`);
  } catch (hata) {
    if (!(hata instanceof TmdbHatasi)) throw hata;
    return ekleSayfasi(yanit, { q, hata: hata.message });
  }
});

// /admin/filmler — yayında olsun olmasın tüm filmler (spec 4.6).
adminRotalari.get("/filmler", async (istek, yanit) => {
  const sayfaSonucu = yonetimSayfaSemasi.safeParse(istek.query.sayfa);
  const sayfa = sayfaSonucu.success ? sayfaSonucu.data : 1;
  const aramaSonucu = yonetimAramaSemasi.safeParse(istek.query.q);
  const arama = aramaSonucu.success ? aramaSonucu.data : "";

  const liste = await yonetimFilmleri({ sayfa, arama });

  let bildirim = null;
  if (istek.query.guncellendi) bildirim = "Film bilgileri güncellendi.";
  else if (istek.query.yayin === "yayinlandi") bildirim = "Film yeniden yayınlandı.";
  else if (istek.query.yayin === "kaldirildi") bildirim = "Film yayından kaldırıldı.";

  return yonetimSayfasi(yanit, {
    baslik: "Film Yönetimi",
    icerik: yonetimFilmleriIcerigi({ ...liste, arama, bildirim }),
  });
});

// Film bilgilerini düzenleme formu (spec 4.6).
adminRotalari.get("/filmler/:id/duzenle", async (istek, yanit) => {
  const id = gecerliId(istek.params.id);
  if (!id) return yonetimHata(yanit, "Geçersiz film numarası.");

  const film = await filmYonetimBul(id);
  if (!film) return yonetimHata(yanit, "Film bulunamadı.", 404);

  return yonetimSayfasi(yanit, {
    baslik: `${film.baslik} — Düzenle`,
    icerik: filmDuzenleIcerigi({
      film,
      degerler: {
        baslik: film.baslik,
        orijinalBaslik: film.orijinalBaslik,
        ozet: film.ozet,
        yayinTarihi: film.yayinTarihi
          ? new Date(film.yayinTarihi).toISOString().slice(0, 10)
          : "",
        sureDakika: film.sureDakika ?? "",
        posterYolu: film.posterYolu ?? "",
        yonetmen: film.yonetmen,
        oyuncular: film.oyuncular,
        tmdbPuan: film.tmdbPuan,
        yayinda: film.yayinda,
      },
    }),
  });
});

adminRotalari.post("/filmler/:id/duzenle", async (istek, yanit) => {
  const id = gecerliId(istek.params.id);
  if (!id) return yonetimHata(yanit, "Geçersiz film numarası.");

  const film = await filmYonetimBul(id);
  if (!film) return yonetimHata(yanit, "Film bulunamadı.", 404);

  const sonuc = dogrula(filmDuzenleSemasi, istek.body);
  if (!sonuc.basarili) {
    return yanit.status(400).send(
      sayfaSablonu({
        baslik: `${film.baslik} — Düzenle`,
        aktifMenu: "/admin",
        kullanici: yanit.locals.kullanici,
        icerik: filmDuzenleIcerigi({
          film,
          degerler: {
            ...istek.body,
            yayinda: istek.body?.yayinda === "1",
          },
          hatalar: sonuc.alanlar,
          hata: "Lütfen işaretli alanları düzeltin.",
        }),
      })
    );
  }

  await filmGuncelle(film.id, {
    ...sonuc.veri,
    tmdbPuan: sonuc.veri.tmdbPuan ?? 0,
  });

  return yanit.redirect(`/admin/filmler?guncellendi=${film.id}`);
});

// Filmi yayından kaldırır ya da yeniden yayınlar.
adminRotalari.post("/filmler/:id/yayin", async (istek, yanit) => {
  const id = gecerliId(istek.params.id);
  if (!id) return yonetimHata(yanit, "Geçersiz film numarası.");

  const film = await filmYonetimBul(id);
  if (!film) return yonetimHata(yanit, "Film bulunamadı.", 404);

  await filmYayinDurumu(film.id, !film.yayinda);
  return yanit.redirect(
    `/admin/filmler?yayin=${film.yayinda ? "kaldirildi" : "yayinlandi"}`
  );
});

// /admin/yorumlar — herhangi bir yorumu silme (spec 4.5/4.6).
adminRotalari.get("/yorumlar", async (istek, yanit) => {
  const sayfaSonucu = yonetimSayfaSemasi.safeParse(istek.query.sayfa);
  const sayfa = sayfaSonucu.success ? sayfaSonucu.data : 1;
  const liste = await yonetimYorumlari({ sayfa });

  let bildirim = null;
  if (istek.query.silindi === "1") bildirim = "Yorum silindi.";
  else if (istek.query.silindi === "0") bildirim = "Yorum bulunamadı; başka biri tarafından silinmiş olabilir.";

  return yonetimSayfasi(yanit, {
    baslik: "Yorum Yönetimi",
    icerik: yonetimYorumlariIcerigi({ ...liste, bildirim }),
  });
});

adminRotalari.post("/yorumlar/:id/sil", async (istek, yanit) => {
  const id = gecerliId(istek.params.id);
  if (!id) return yonetimHata(yanit, "Geçersiz yorum numarası.");

  const sonuc = await yorumYonetimSil(id);
  return yanit.redirect(`/admin/yorumlar?silindi=${sonuc.count > 0 ? 1 : 0}`);
});

// /admin/kullanicilar — listeleme ve devre dışı bırakma (spec 4.6).
adminRotalari.get("/kullanicilar", async (istek, yanit) => {
  const sayfaSonucu = yonetimSayfaSemasi.safeParse(istek.query.sayfa);
  const sayfa = sayfaSonucu.success ? sayfaSonucu.data : 1;
  const liste = await yonetimKullanicilari({ sayfa });

  let bildirim = null;
  if (istek.query.aktiflik === "devre-disi") bildirim = "Kullanıcı devre dışı bırakıldı.";
  else if (istek.query.aktiflik === "etkin") bildirim = "Kullanıcı yeniden etkinleştirildi.";

  const hata =
    istek.query.hata === "kendiniz"
      ? "Kendi hesabınızı devre dışı bırakamazsınız."
      : null;

  return yonetimSayfasi(yanit, {
    baslik: "Kullanıcı Yönetimi",
    icerik: yonetimKullanicilariIcerigi({
      ...liste,
      kendimId: yanit.locals.kullanici.id,
      bildirim,
      hata,
    }),
  });
});

adminRotalari.post("/kullanicilar/:id/aktiflik", async (istek, yanit) => {
  const id = gecerliId(istek.params.id);
  if (!id) return yonetimHata(yanit, "Geçersiz kullanıcı numarası.");

  const hedef = await kullaniciYonetimBul(id);
  if (!hedef) return yonetimHata(yanit, "Kullanıcı bulunamadı.", 404);

  if (hedef.id === yanit.locals.kullanici.id) {
    return yanit.redirect("/admin/kullanicilar?hata=kendiniz");
  }

  await kullaniciAktiflik(hedef.id, !hedef.aktif);
  return yanit.redirect(
    `/admin/kullanicilar?aktiflik=${hedef.aktif ? "devre-disi" : "etkin"}`
  );
});
