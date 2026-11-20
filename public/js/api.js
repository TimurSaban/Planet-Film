/**
 * API çağrıları için küçük yardımcı.
 * Ağ ya da sunucu hatasında da aynı { tamam, durum, veri } biçimini döndürür.
 */
export async function apiIstek(yol, secenekler = {}) {
  const { headers, ...gerisi } = secenekler;

  try {
    const yanit = await fetch(yol, {
      ...gerisi,
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    });

    let veri = null;
    try {
      veri = await yanit.json();
    } catch {
      veri = null;
    }

    return { tamam: yanit.ok, durum: yanit.status, veri };
  } catch {
    return {
      tamam: false,
      durum: 0,
      veri: { hata: "Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin." },
    };
  }
}
