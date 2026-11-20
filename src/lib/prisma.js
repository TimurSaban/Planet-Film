import { PrismaClient } from "@prisma/client";

// Geliştirmede hot reload sırasında birden fazla bağlantı açılmaması için
// Prisma istemcisi tek bir örnek olarak tutulur.
export const prisma = new PrismaClient();
