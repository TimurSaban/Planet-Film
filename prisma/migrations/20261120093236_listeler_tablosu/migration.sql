-- CreateTable
CREATE TABLE "user_lists" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kullanici_id" INTEGER NOT NULL,
    "film_id" INTEGER NOT NULL,
    "durum" TEXT NOT NULL,
    "olusturma_tarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_lists_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_lists_film_id_fkey" FOREIGN KEY ("film_id") REFERENCES "movies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "user_lists_film_id_idx" ON "user_lists"("film_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_lists_kullanici_id_film_id_key" ON "user_lists"("kullanici_id", "film_id");
