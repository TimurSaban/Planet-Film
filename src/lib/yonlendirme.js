/**
 * Giriş sonrası yönlendirme adresini güvenli hâle getirir.
 * Yalnızca site içi yollar ("/..." ve "//" ile başlamayan) kabul edilir;
 * aksi hâlde null döner (açık yönlendirme engellenir).
 */
export function guvenliYonlendirme(yol) {
  if (typeof yol !== "string") return null;
  if (!yol.startsWith("/")) return null;
  if (yol.startsWith("//")) return null;
  // Tarayıcılar ters bölüyü "/" gibi yorumlayabildiği için "\\" reddedilir;
  // kontrol karakterleri de başlık/URL bozulmalarına yol açabilir.
  if (/[\\\u0000-\u001f\u007f]/.test(yol)) return null;
  return yol;
}
