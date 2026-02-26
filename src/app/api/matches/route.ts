import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createMatchSchema = z.object({
  title: z.string().optional(),
  homeTeamId: z.string().min(1, 'Home team ID is required'),
  awayTeamId: z.string().min(1, 'Away team ID is required'),
  groundId: z.string().optional(),
  scheduledDate: z.string().transform(val => new Date(val)),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  matchFormat: z.enum(['T10', 'T20', 'T30', 'OD50', 'CUSTOM']),
  ballType: z.enum(['TENNIS', 'LEATHER', 'RUBBER']).default('TENNIS'),
  oversPerInnings: z.number().int().min(5).max(50).default(20),
  entryFee: z.number().int().min(1000).default(10000),
  createdBy: z.string().min(1, 'Creator ID is required'),
})

const updateMatchSchema = z.object({
  title: z.string().optional(),
  groundId: z.string().optional(),
  scheduledDate: z.string().transform(val => new Date(val)).optional(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  status: z.enum(['SCHEDULED', 'ACCEPTED', 'LIVE', 'COMPLETED', 'CANCELLED', 'ABANDONED', 'DISPUTED']).optional(),
  winnerId: z.string().optional(),
  result: z.string().optional(),
  scorecard: z.string().optional(),
  liveScoreUrl: z.string().optional(),
})

// GET /api/matches - Get all matches with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const teamId = searchParams.get('teamId')
    const area = searchParams.get('area')
    const format = searchParams.get('format')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (teamId) {
      where.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId }
      ]
    }
    
    if (format) {
      where.matchFormat = format
    }
    
    if (dateFrom || dateTo) {
      where.scheduledDate = {}
      if (dateFrom) where.scheduledDate.gte = new Date(dateFrom)
      if (dateTo) where.scheduledDate.lte = new Date(dateTo)
    }

    const matches = await db.match.findMany({
      where,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            area: true,
            rating: true,
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            area: true,
            rating: true,
          }
        },
        ground: {
          select: {
            id: true,
            name: true,
            address: true,
            area: true,
            hasFloodlights: true,
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            shortName: true,
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            players: true,
            payments: true,
          }
        }
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { scheduledTime: 'asc' }
      ],
      take: limit,
      skip: offset,
    })

    // Filter by area if specified (needs to be done after include)
    let filteredMatches = matches
    if (area) {
      filteredMatches = matches.filter(match => 
        match.homeTeam.area?.toLowerCase().includes(area.toLowerCase()) ||
        match.awayTeam.area?.toLowerCase().includes(area.toLowerCase()) ||
        match.ground?.area?.toLowerCase().includes(area.toLowerCase())
      )
    }

    const total = await db.match.count({ where })

    return NextResponse.json({
      matches: filteredMatches,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

// POST /api/matches - Create a new match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createMatchSchema.parse(body)

    // Check if teams exist
    const [homeTeam, awayTeam] = await Promise.all([
      db.team.findUnique({ where: { id: validatedData.homeTeamId } }),
      db.team.findUnique({ where: { id: validatedData.awayTeamId } })
    ])

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: 'One or both teams not found' },
        { status: 404 }
      )
    }

    if (homeTeam.id === awayTeam.id) {
      return NextResponse.json(
        { error: 'Home and away teams cannot be the same' },
        { status: 400 }
      )
    }

    // Check if ground exists (if provided)
    if (validatedData.groundId) {
      const ground = await db.ground.findUnique({
        where: { id: validatedData.groundId }
      })

      if (!ground) {
        return NextResponse.json(
          { error: 'Ground not found' },
          { status: 404 }
        )
      }
    }

    // Check for scheduling conflicts
    const scheduledDateTime = new Date(validatedData.scheduledDate)
    const timeParts = validatedData.scheduledTime.split(':')
    scheduledDateTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0)

    const conflictMatch = await db.match.findFirst({
      where: {
        AND: [
          { scheduledDate: scheduledDateTime },
          {
            OR: [
              { homeTeamId: validatedData.homeTeamId },
              { awayTeamId: validatedData.homeTeamId },
              { homeTeamId: validatedData.awayTeamId },
              { awayTeamId: validatedData.awayTeamId }
            ]
          },
          { status: { in: ['SCHEDULED', 'ACCEPTED', 'LIVE'] } }
        ]
      }
    })

    if (conflictMatch) {
      return NextResponse.json(
        { error: 'One or both teams already have a match scheduled at this time' },
        { status: 409 }
      )
    }

    // Calculate prize pool and platform fee
    const prizePool = validatedData.entryFee * 2
    const platformFee = Math.round(prizePool * 0.1) // 10% commission

    // Create the match
    const match = await db.match.create({
      data: {
        ...validatedData,
        prizePool,
        platformFee,
        status: 'SCHEDULED',
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            area: true,
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            area: true,
          }
        },
        ground: {
          select: {
            id: true,
            name: true,
            address: true,
            area: true,
          }
        }
      }
    })

    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    console.error('Error creating match:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    )
  }
}