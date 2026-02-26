import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createPlayerSchema = z.object({
  name: z.string().min(2, 'Player name must be at least 2 characters'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.enum(['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER']),
  teamId: z.string().min(1, 'Team ID is required'),
  userId: z.string().optional().nullable(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
})

const updatePlayerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.enum(['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER']).optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/players - Get all players with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const role = searchParams.get('role')
    const isActive = searchParams.get('active')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (teamId) {
      where.teamId = teamId
    }
    
    if (role) {
      where.role = role
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const players = await db.player.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            matchPlayers: {
              where: { isPlaying: true }
            }
          }
        }
      },
      orderBy: [
        { team: { name: 'asc' } },
        { role: 'asc' },
        { jerseyNumber: 'asc' },
        { name: 'asc' }
      ],
      take: limit,
      skip: offset,
    })

    const total = await db.player.count({ where })

    return NextResponse.json({
      players,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}

// POST /api/players - Create a new player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createPlayerSchema.parse(body)

    // Check if team exists
    const team = await db.team.findUnique({
      where: { id: validatedData.teamId }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Check if user exists and is not already a player
    if (validatedData.userId) {
      const existingUserPlayer = await db.player.findUnique({
        where: { userId: validatedData.userId }
      })

      if (existingUserPlayer) {
        return NextResponse.json(
          { error: 'User is already a player in another team' },
          { status: 409 }
        )
      }
    }

    // Check for duplicate email in the same team
    if (validatedData.email) {
      const existingEmailPlayer = await db.player.findFirst({
        where: {
          email: validatedData.email,
          teamId: validatedData.teamId
        }
      })

      if (existingEmailPlayer) {
        return NextResponse.json(
          { error: 'Player with this email already exists in the team' },
          { status: 409 }
        )
      }
    }

    // Check for duplicate jersey number in the same team
    if (validatedData.jerseyNumber) {
      const existingJerseyPlayer = await db.player.findFirst({
        where: {
          jerseyNumber: validatedData.jerseyNumber,
          teamId: validatedData.teamId,
          isActive: true
        }
      })

      if (existingJerseyPlayer) {
        return NextResponse.json(
          { error: 'Jersey number already taken in this team' },
          { status: 409 }
        )
      }
    }

    // Create the player
    const player = await db.player.create({
      data: {
        ...validatedData,
        battingAvg: 0,
        strikeRate: 0,
        totalRuns: 0,
        totalWickets: 0,
        economy: 0,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    console.error('Error creating player:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    )
  }
}