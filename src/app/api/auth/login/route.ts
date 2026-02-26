import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: validatedData.email },
      include: {
        managedTeams: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
            isVerified: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // In a real app, you would verify the password here
    // For now, we'll skip password verification since our schema doesn't have password field
    // const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)
    // if (!isPasswordValid) {
    //   return NextResponse.json(
    //     { error: 'Invalid email or password' },
    //     { status: 401 }
    //   )
    // }

    // In a real app, you would generate a JWT token here
    // For now, we'll return user data without sensitive information
    const { createdAt, updatedAt, ...userWithoutTimestamps } = user

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutTimestamps,
      // token: jwtToken, // In real app
    })

  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}