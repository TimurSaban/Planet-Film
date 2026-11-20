-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kullanici_adi" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sifre_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'uye',
    "olusturma_tarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_kullanici_adi_key" ON "users"("kullanici_adi");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
