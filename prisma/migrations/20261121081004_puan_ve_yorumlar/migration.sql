-- CreateTable
CREATE TABLE "ratings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kullanici_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,
    "puan" INTEGER NOT NULL,
    "guncelleme_tarihi" DATETIME NOT NULL,
    CONSTRAINT "ratings_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ratings_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "movies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kullanici_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "olusturma_tarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_tarihi" DATETIME NOT NULL,
    CONSTRAINT "reviews_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "movies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ratings_film_id_idx" ON "ratings"("film_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_kullanici_id_film_id_key" ON "ratings"("kullanici_id", "film_id");

-- CreateIndex
CREATE INDEX "reviews_film_id_tur_idx" ON "reviews"("film_id", "tur");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_kullanici_id_film_id_tur_key" ON "reviews"("kullanici_id", "film_id", "tur");
