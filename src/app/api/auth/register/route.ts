import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['TEAM_MANAGER', 'PLAYER']).default('TEAM_MANAGER'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// POST /api/auth/register - Register a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          validatedData.phone ? { phone: validatedData.phone } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    })

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
      if (existingUser.phone === validatedData.phone) {
        return NextResponse.json(
          { error: 'User with this phone number already exists' },
          { status: 409 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // For now, we'll create user without password (since our schema doesn't have it yet)
    // In a real app, you would add password field to User model
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        role: validatedData.role,
        isVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      }
    })

    // In a real app, you would generate and return a JWT token here
    // For now, we'll return the user data
    return NextResponse.json({
      message: 'User registered successfully',
      user,
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}