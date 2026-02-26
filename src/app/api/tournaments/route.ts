import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createTournamentSchema = z.object({
  name: z.string().min(2, 'Tournament name must be at least 2 characters'),
  description: z.string().optional(),
  format: z.enum(['KNOCKOUT', 'LEAGUE', 'DOUBLE_LEAGUE']),
  maxTeams: z.number().int().min(4).max(16),
  minTeams: z.number().int().min(4).default(4),
  entryFee: z.number().int().min(1000, 'Entry fee must be at least ₹1000'),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
  groundId: z.string().optional(),
  matchFormat: z.string().default('T20'),
  ballType: z.string().default('TENNIS'),
  oversPerMatch: z.number().int().default(20),
  prizePool: z.number().optional(),
  createdBy: z.string().min(1, 'Creator ID is required'),
})

const joinTournamentSchema = z.object({
  tournamentId: z.string().min(1, 'Tournament ID is required'),
  teamId: z.string().min(1, 'Team ID is required'),
  paymentId: z.string().optional(),
})

// GET /api/tournaments - Get all tournaments with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (format) where.format = format
    if (status) where.status = status

    const tournaments = await db.tournament.findMany({
      where,
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            icon: true,
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
          }
        },
        _count: {
          select: {
            teams: true,
            matches: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.tournament.count({ where })

    return NextResponse.json({
      tournaments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

// POST /api/tournaments - Create a new tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTournamentSchema.parse(body)

    // Check if creator exists
    const creator = await db.user.findUnique({
      where: { id: validatedData.createdBy }
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Validate dates
    if (new Date(validatedData.endDate) <= new Date(validatedData.startDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Calculate prize pool if not provided
    const prizePool = validatedData.prizePool || (validatedData.entryFee * validatedData.maxTeams)

    // Create tournament
    const tournament = await db.tournament.create({
      data: {
        ...validatedData,
        status: 'UPCOMING',
        prizePool,
        platformFee: Math.round(prizePool * 0.1), // 10% commission
      },
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            icon: true,
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
          }
        }
      }
    })

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    console.error('Error creating tournament:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    )
  }
}