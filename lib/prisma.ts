// Prisma 客户端单例
// 防止在开发环境中创建多个 Prisma Client 实例

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 优先使用环境变量，如果环境变量不存在则使用 .env 文件
// 构建时如果 DATABASE_URL 不存在，使用占位符（仅用于生成 Prisma Client）
const databaseUrl = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL

// 在生产环境中，如果没有 DATABASE_URL，应该抛出错误而不是使用占位符
if (!databaseUrl && process.env.NODE_ENV === 'production') {
  console.error('DATABASE_URL is not configured in production environment')
}

// 使用占位符仅用于开发环境的类型生成
const finalDatabaseUrl = databaseUrl || 'postgresql://placeholder:placeholder@localhost:5432/placeholder'

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: finalDatabaseUrl,
      },
    },
  })

// 在生产环境中也使用全局单例，避免创建多个实例
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}



