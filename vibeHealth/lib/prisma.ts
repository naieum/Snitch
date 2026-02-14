// VULN [Cat 17]: Database URL exposed to client bundle
export const NEXT_PUBLIC_DATABASE_URL = process.env.DATABASE_URL;

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
