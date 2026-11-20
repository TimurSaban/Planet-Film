import { z } from "zod";
import { LISTE_DURUM_DEGERLERI } from "../lib/listeDurumlari.js";

// /profil?durum=... için; geçersiz değerde varsayılan duruma dönülür.
export const listeDurumSemasi = z.enum(LISTE_DURUM_DEGERLERI).default("izledim");

// Film sayfasındaki listeye ekleme formu (JS'siz POST).
export const listeyeEkleSemasi = z.object({
  filmId: z.coerce.number().int().positive(),
  durum: z.enum(LISTE_DURUM_DEGERLERI),
  donus: z.string().max(300).optional(),
});
