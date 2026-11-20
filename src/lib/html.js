export function kacisMetni(deger) {
  return String(deger ?? "").replace(/[&<>"']/g, (karakter) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[karakter];
  });
}
