-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "kullanici_adi" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sifre_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'uye',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturma_tarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movies" (
    "id" SERIAL NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "baslik" TEXT NOT NULL,
    "orijinal_baslik" TEXT NOT NULL,
    "ozet" TEXT NOT NULL DEFAULT '',
    "yayin_tarihi" TIMESTAMP(3),
    "sure_dakika" INTEGER,
    "poster_yolu" TEXT,
    "yonetmen" TEXT NOT NULL DEFAULT '',
    "oyuncular" TEXT NOT NULL DEFAULT '',
    "tmdb_puan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "arama_metni" TEXT NOT NULL DEFAULT '',
    "yayinda" BOOLEAN NOT NULL DEFAULT true,
    "olusturma_tarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tmdb_guncelleme_tarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turler" (
    "id" SERIAL NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "ad" TEXT NOT NULL,

    CONSTRAINT "turler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "film_turleri" (
    "film_id" INTEGER NOT NULL,
    "tur_id" INTEGER NOT NULL,

    CONSTRAINT "film_turleri_pkey" PRIMARY KEY ("film_id","tur_id")
);

-- CreateTable
CREATE TABLE "user_lists" (
    "id" SERIAL NOT NULL,
    "kullanici_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,
    "durum" TEXT NOT NULL,
    "olusturma_tarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" SERIAL NOT NULL,
    "kullanici_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,
    "puan" INTEGER NOT NULL,
    "guncelleme_tarihi" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "kullanici_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "olusturma_tarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_tarihi" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_kullanici_adi_key" ON "users"("kullanici_adi");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdb_id_key" ON "movies"("tmdb_id");

-- CreateIndex
CREATE INDEX "movies_yayin_tarihi_idx" ON "movies"("yayin_tarihi");

-- CreateIndex
CREATE UNIQUE INDEX "turler_tmdb_id_key" ON "turler"("tmdb_id");

-- CreateIndex
CREATE INDEX "film_turleri_tur_id_idx" ON "film_turleri"("tur_id");

-- CreateIndex
CREATE INDEX "user_lists_film_id_idx" ON "user_lists"("film_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_lists_kullanici_id_film_id_key" ON "user_lists"("kullanici_id", "film_id");

-- CreateIndex
CREATE INDEX "ratings_film_id_idx" ON "ratings"("film_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_kullanici_id_film_id_key" ON "ratings"("kullanici_id", "film_id");

-- CreateIndex
CREATE INDEX "reviews_film_id_tur_idx" ON "reviews"("film_id", "tur");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_kullanici_id_film_id_tur_key" ON "reviews"("kullanici_id", "film_id", "tur");

-- AddForeignKey
ALTER TABLE "film_turleri" ADD CONSTRAINT "film_turleri_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "film_turleri" ADD CONSTRAINT "film_turleri_tur_id_fkey" FOREIGN KEY ("tur_id") REFERENCES "turler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
