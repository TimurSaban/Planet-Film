-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kullanici_adi" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sifre_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'uye',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturma_tarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_users" ("email", "id", "kullanici_adi", "olusturma_tarihi", "rol", "sifre_hash") SELECT "email", "id", "kullanici_adi", "olusturma_tarihi", "rol", "sifre_hash" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_kullanici_adi_key" ON "users"("kullanici_adi");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
