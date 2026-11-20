-- CreateTable
CREATE TABLE "movies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdb_id" INTEGER NOT NULL,
    "baslik" TEXT NOT NULL,
    "orijinal_baslik" TEXT NOT NULL,
    "ozet" TEXT NOT NULL DEFAULT '',
    "yayin_tarihi" DATETIME,
    "sure_dakika" INTEGER,
    "poster_yolu" TEXT,
    "yonetmen" TEXT NOT NULL DEFAULT '',
    "oyuncular" TEXT NOT NULL DEFAULT '',
    "tmdb_puan" REAL NOT NULL DEFAULT 0,
    "arama_metni" TEXT NOT NULL DEFAULT '',
    "yayinda" BOOLEAN NOT NULL DEFAULT true,
    "olusturma_tarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tmdb_guncelleme_tarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "turler" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdb_id" INTEGER NOT NULL,
    "ad" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "film_turleri" (
    "film_id" INTEGER NOT NULL,
    "tur_id" INTEGER NOT NULL,

    PRIMARY KEY ("film_id", "tur_id"),
    CONSTRAINT "film_turleri_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "movies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "film_turleri_tur_id_fkey" FOREIGN KEY ("tur_id") REFERENCES "turler" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdb_id_key" ON "movies"("tmdb_id");

-- CreateIndex
CREATE INDEX "movies_yayin_tarihi_idx" ON "movies"("yayin_tarihi");

-- CreateIndex
CREATE UNIQUE INDEX "turler_tmdb_id_key" ON "turler"("tmdb_id");

-- CreateIndex
CREATE INDEX "film_turleri_tur_id_idx" ON "film_turleri"("tur_id");
