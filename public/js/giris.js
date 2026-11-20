import { apiIstek } from "./api.js";

const form = document.querySelector("#giris-formu");

if (form) {
  const dugme = form.querySelector('button[type="submit"]');
  const hataKutusu = form.querySelector(".form-hatasi");
  const alanlar = ["kimlik", "sifre"];

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

    hataKutusu.textContent = veri?.hata ?? "Giriş yapılamadı. Lütfen tekrar deneyin.";
    hataKutusu.hidden = false;
  }

  form.addEventListener("submit", async (olay) => {
    olay.preventDefault();
    hatalariTemizle();
    dugme.disabled = true;
    dugme.textContent = "Giriş yapılıyor...";

    const govde = Object.fromEntries(new FormData(form));
    const sonuc = await apiIstek("/api/giris", {
      method: "POST",
      body: JSON.stringify(govde),
    });

    if (sonuc.tamam) {
      window.location.assign(sonuc.veri?.yonlendirme ?? "/");
      return;
    }

    hatalariGoster(sonuc.veri);
    dugme.disabled = false;
    dugme.textContent = "Giriş Yap";
  });
}
