import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  shortName: z.string().min(2, 'Short name must be at least 2 characters').max(10),
  description: z.string().optional(),
  area: z.string().min(1, 'Area is required'),
  city: z.string().default('Delhi'),
  managerId: z.string().min(1, 'Manager ID is required'),
  logo: z.string().optional(),
})

// GET /api/teams - Get all teams with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const area = searchParams.get('area')
    const isVerified = searchParams.get('verified')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (area) {
      where.area = { contains: area, mode: 'insensitive' }
    }
    
    if (isVerified === 'true') {
      where.isVerified = true
    }

    const teams = await db.team.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        players: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            role: true,
            jerseyNumber: true,
          }
        },
        _count: {
          select: {
            homeMatches: {
              where: { status: { in: ['SCHEDULED', 'ACCEPTED', 'LIVE'] } }
            },
            awayMatches: {
              where: { status: { in: ['SCHEDULED', 'ACCEPTED', 'LIVE'] } }
            }
          }
        }
      },
      orderBy: [
        { isVerified: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset,
    })

    const total = await db.team.count({ where })

    return NextResponse.json({
      teams,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTeamSchema.parse(body)

    // Check if manager exists and is a team manager
    const manager = await db.user.findUnique({
      where: { id: validatedData.managerId }
    })

    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      )
    }

    if (manager.role !== 'TEAM_MANAGER' && manager.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'User must be a team manager or admin to create a team' },
        { status: 403 }
      )
    }

    // Check if team name already exists
    const existingTeam = await db.team.findFirst({
      where: {
        OR: [
          { name: { equals: validatedData.name, mode: 'insensitive' } },
          { shortName: { equals: validatedData.shortName, mode: 'insensitive' } }
        ]
      }
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team with this name or short name already exists' },
        { status: 409 }
      )
    }

    // Create the team
    const team = await db.team.create({
      data: {
        ...validatedData,
        rating: 1200, // Default ELO rating
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}