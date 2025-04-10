import { PrismaClient } from '@prisma/client';

// Prevenindo múltiplas instâncias do Prisma Client em desenvolvimento
// devido ao Hot Reloading
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;