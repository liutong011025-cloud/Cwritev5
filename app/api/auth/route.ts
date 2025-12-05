import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 检查数据库连接配置
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not configured')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not configured',
          hint: 'DATABASE_URL environment variable is missing. Please configure it in Vercel project settings.'
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // 从数据库查询用户
    const user = await prisma.user.findUnique({
      where: { username },
    })
    
    if (user && user.password === password) {
      // 用户存在且密码正确
      return NextResponse.json({
        success: true,
        user: {
          username: user.username,
          role: user.role as 'teacher' | 'student',
          noAi: user.noAi || false, // 标记是否为无AI版本
        },
      })
    }

    // 用户名或密码错误
    return NextResponse.json(
      { success: false, error: 'Invalid username or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    
    // 提供更详细的错误信息用于调试
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const isDatabaseError = errorMessage.includes('Prisma') || 
                           errorMessage.includes('database') || 
                           errorMessage.includes('connection') ||
                           errorMessage.includes('P1001') || // Prisma connection error code
                           errorMessage.includes('Can\'t reach database')
    
    // 检查 DATABASE_URL 是否配置
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDatabaseError 
          ? 'Database connection failed' 
          : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        hint: isDatabaseError 
          ? (hasDatabaseUrl 
              ? 'Database connection issue. Please check if the database server is running and accessible.'
              : 'DATABASE_URL environment variable is not configured. Please set it in your .env file.')
          : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}

