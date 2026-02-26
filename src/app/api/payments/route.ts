import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createPaymentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  teamId: z.string().optional(),
  matchId: z.string().optional(),
  tournamentId: z.string().optional(),
  groundBookingId: z.string().optional(),
  type: z.enum(['MATCH_ENTRY', 'TOURNAMENT_ENTRY', 'GROUND_BOOKING', 'PLATFORM_FEE', 'PRIZE_PAYOUT', 'REFUND']),
  amount: z.number().int().positive('Amount must be positive'),
  method: z.string().optional(),
})

// GET /api/payments - Get all payments with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const teamId = searchParams.get('teamId')
    const matchId = searchParams.get('matchId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (userId) where.userId = userId
    if (teamId) where.teamId = teamId
    if (matchId) where.matchId = matchId
    if (type) where.type = type
    if (status) where.status = status

    const payments = await db.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
          }
        },
        match: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            status: true,
            homeTeam: {
              select: { id: true, name: true, shortName: true }
            },
            awayTeam: {
              select: { id: true, name: true, shortName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.payment.count({ where })

    return NextResponse.json({
      payments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate related entities exist
    if (validatedData.teamId) {
      const team = await db.team.findUnique({
        where: { id: validatedData.teamId }
      })
      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        )
      }
    }

    if (validatedData.matchId) {
      const match = await db.match.findUnique({
        where: { id: validatedData.matchId }
      })
      if (!match) {
        return NextResponse.json(
          { error: 'Match not found' },
          { status: 404 }
        )
      }
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        ...validatedData,
        status: 'PENDING',
        escrowReleased: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
          }
        }
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}