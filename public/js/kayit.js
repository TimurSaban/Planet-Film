import { apiIstek } from "./api.js";

const form = document.querySelector("#kayit-formu");

if (form) {
  const dugme = form.querySelector('button[type="submit"]');
  const hataKutusu = form.querySelector(".form-hatasi");
  const alanlar = ["kullaniciAdi", "email", "sifre"];

  function hatalariTemizle() {
    hataKutusu.hidden = true;
    hataKutusu.textContent = "";

    for (const alan of alanlar) {
      const girdi = form.elements[alan];
      const uyari = form.querySelector(`[data-alan="${alan}"]`);
      if (girdi) girdi.removeAttribute("aria-invalid");
      if (uyari) uyari.textContent = "";
    }
  }

  function hatalariGoster(veri) {
    const alanHatalari = veri?.alanlar ?? {};

    for (const [alan, mesaj] of Object.entries(alanHatalari)) {
      const girdi = form.elements[alan];
      const uyari = form.querySelector(`[data-alan="${alan}"]`);
      if (girdi) girdi.setAttribute("aria-invalid", "true");
      if (uyari) uyari.textContent = mesaj;
    }

    const genel = veri?.hata ?? "Kayıt tamamlanamadı. Lütfen tekrar deneyin.";
    // Alan hatası zaten gösterildiyse genel kutu gereksiz tekrar olur.
    if (Object.keys(alanHatalari).length === 0) {
      hataKutusu.textContent = genel;
      hataKutusu.hidden = false;
    }
  }

  form.addEventListener("submit", async (olay) => {
    olay.preventDefault();
    hatalariTemizle();
    dugme.disabled = true;
    dugme.textContent = "Kayıt yapılıyor...";

    const govde = Object.fromEntries(new FormData(form));
    const sonuc = await apiIstek("/api/kayit", {
      method: "POST",
      body: JSON.stringify(govde),
    });

    if (sonuc.tamam) {
      window.location.assign("/");
      return;
    }

    hatalariGoster(sonuc.veri);
    dugme.disabled = false;
    dugme.textContent = "Kayıt Ol";
  });
}
