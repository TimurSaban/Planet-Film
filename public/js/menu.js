// Mobil açılır menü davranışı
const dugme = document.querySelector(".menu-dugmesi");
const menu = document.getElementById("ana-menu");

if (dugme && menu) {
  dugme.addEventListener("click", () => {
    const acik = dugme.getAttribute("aria-expanded") === "true";
    dugme.setAttribute("aria-expanded", String(!acik));
    menu.classList.toggle("acik", !acik);
  });

  // Menüdeki bir bağlantıya tıklanınca mobilde menüyü kapat
  menu.addEventListener("click", (olay) => {
    if (olay.target.closest("a")) {
      dugme.setAttribute("aria-expanded", "false");
      menu.classList.remove("acik");
    }
  });

  // Escape tuşu menüyü kapatır
  document.addEventListener("keydown", (olay) => {
    if (olay.key === "Escape" && menu.classList.contains("acik")) {
      dugme.setAttribute("aria-expanded", "false");
      menu.classList.remove("acik");
      dugme.focus();
    }
  });
}
