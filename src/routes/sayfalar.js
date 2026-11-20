import { Router } from "express";
import { sayfaSablonu } from "../views/layout.js";
import { girisIcerigi, kayitIcerigi } from "../views/kimlikSayfalari.js";
import { guvenliYonlendirme } from "../lib/yonlendirme.js";
import { oturumBitir } from "../middleware/oturum.js";
import { sonFilmler } from "../services/filmler.js";
import { filmIzgarasi } from "../views/filmSayfalari.js";

export const sayfalar = Router();

// Sayfa şablonuna oturumdaki kullanıcıyı her zaman aktarır (header menüsü için).
function sablon(yanit, secenekler) {
  return sayfaSablonu({ kullanici: yanit.locals.kullanici, ...secenekler });
}

sayfalar.get("/", async (istek, yanit) => {
  const yeniFilmler = await sonFilmler(8);

  const icerik = `
      <section class="kahraman">
        <p class="kahraman-etiket">Film yorumlama sitesi</p>
        <h1>Filmleri izleyin, puanlayın, tartışın.</h1>
        <p class="kahraman-metin">
          Planet Film Site; filmleri inceleyebileceğiniz, 1–10 arası puan verebileceğiniz
          ve spoilerlı ya da spoilersız yorum yazabileceğiniz bir platformdur.
          Film listesinde arayabilir, türe ve yayın durumuna göre filtreleyebilirsiniz.
        </p>
        <div class="kahraman-eylemler">
          <a class="dugme dugme-birincil" href="/filmler">Filmlere Göz At</a>
          <a class="dugme dugme-ikincil" href="/kayit">Üye Ol</a>
        </div>
      </section>

      <section class="bolum">
        <div class="bolum-basligi">
          <h2>Yeni Eklenen Filmler</h2>
          <a href="/filmler">Tümünü gör</a>
        </div>
        ${
          yeniFilmler.length
            ? filmIzgarasi(yeniFilmler)
            : '<p class="bos-durum">Henüz film eklenmedi. Filmler yönetici tarafından TMDB\'den aktarılır.</p>'
        }
      </section>

      <section class="bolum">
        <h2>Neler Yapacaksınız?</h2>
        <ul class="ozellik-listesi">
          <li class="kart">
            <h3>Puan Verin</h3>
            <p>Her filme 1 ile 10 arasında puan verin; ortalama puan film sayfasında görünür.</p>
          </li>
          <li class="kart">
            <h3>Yorum Yazın</h3>
            <p>Spoilersız değerlendirmelerinizi herkesle, spoilerlı notlarınızı uyarı arkasında paylaşın.</p>
          </li>
          <li class="kart">
            <h3>Liste Tutun</h3>
            <p>İzlediklerinizi ve izleyeceklerinizi kendi profilinizde listeleyin.</p>
          </li>
        </ul>
      </section>`;

  yanit.send(
    sablon(yanit, {
      baslik: "Ana Sayfa",
      aciklama: "Film inceleme, puanlama ve yorum sitesi.",
      aktifMenu: "/",
      icerik,
    })
  );
});

// Giriş sayfası (spec Bölüm 9)
sayfalar.get("/giris", (istek, yanit) => {
  if (istek.session?.kullanici) return yanit.redirect("/");

  yanit.send(
    sablon(yanit, {
      baslik: "Giriş Yap",
      aciklama: "Planet Film Site hesabınıza giriş yapın.",
      icerik: girisIcerigi({
        yonlendirme: guvenliYonlendirme(istek.query.yonlendirme),
      }),
      betikler: ["/js/giris.js"],
    })
  );
});

// Kayıt sayfası (spec Bölüm 9)
sayfalar.get("/kayit", (istek, yanit) => {
  if (istek.session?.kullanici) return yanit.redirect("/");

  yanit.send(
    sablon(yanit, {
      baslik: "Kayıt Ol",
      aciklama: "Planet Film Site'e üye olun.",
      icerik: kayitIcerigi(),
      betikler: ["/js/kayit.js"],
    })
  );
});

// Çıkış (form gönderimi için; JS'siz de çalışır)
sayfalar.post("/cikis", async (istek, yanit, sonraki) => {
  try {
    await oturumBitir(istek, yanit);
    yanit.redirect("/");
  } catch (hata) {
    sonraki(hata);
  }
});
