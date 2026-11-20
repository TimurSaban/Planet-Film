import { z } from "zod";

// Film listesi sorgu parametreleri. Her parametre ayrı doğrulanır: yalnızca
// geçersiz olan varsayılana döner, diğer filtreler korunur (sayfa çökmemeli).
const aramaSemasi = z
  .string()
  .max(100, "Arama metni en fazla 100 karakter olabilir.")
  .default("");
const turSemasi = z.coerce.number().int().positive();
const durumSemasi = z.enum(["yayinda", "yakinda"]);
const sayfaSemasi = z.coerce.number().int().min(1).default(1);

export const filmListeSemasi = z.object({
  q: aramaSemasi,
  tur: turSemasi.optional(),
  durum: durumSemasi.optional(),
  sayfa: sayfaSemasi,
});

/** Sorgu dizesini güvenli filtre değerlerine çevirir. */
export function listeParametreleri(sorgu) {
  const ham = sorgu ?? {};
  const q = aramaSemasi.safeParse(ham.q);
  const tur = turSemasi.safeParse(ham.tur);
  const durum = durumSemasi.safeParse(ham.durum);
  const sayfa = sayfaSemasi.safeParse(ham.sayfa);

  return {
    q: q.success ? q.data.trim() : "",
    tur: tur.success ? tur.data : null,
    durum: durum.success ? durum.data : null,
    sayfa: sayfa.success ? sayfa.data : 1,
  };
}

// Yönetici film aktarma formu.
export const filmAktarSemasi = z.object({
  tmdbId: z.coerce
    .number()
    .int("Geçerli bir film seçin.")
    .positive("Geçerli bir film seçin."),
  q: z.string().max(100).optional().default(""),
});
