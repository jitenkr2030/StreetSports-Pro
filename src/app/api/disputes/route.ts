import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createDisputeSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  raisedByTeamId: z.string().min(1, 'Team ID is required'),
  againstTeamId: z.string().min(1, 'Opposing team ID is required'),
  category: z.enum(['SCORE_ERROR', 'RULE_VIOLATION', 'CONDUCT', 'GROUND_ISSUE', 'PAYMENT', 'OTHER']),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  evidence: z.array(z.string()).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

const updateDisputeSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CLOSED']).optional(),
  resolution: z.string().optional(),
  adminNotes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

// GET /api/disputes - Get all disputes with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const teamId = searchParams.get('teamId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (status) where.status = status
    if (category) where.category = category
    if (priority) where.priority = priority
    if (teamId) {
      where.OR = [
        { raisedByTeamId: teamId },
        { againstTeamId: teamId }
      ]
    }

    const disputes = await db.dispute.findMany({
      where,
      include: {
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
        },
        raisedByTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
            isVerified: true,
          }
        },
        againstTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
            isVerified: true,
          }
        },
        resolution: {
          select: {
            id: true,
            resolvedBy: {
              select: { id: true, name: true, email: true }
            },
            resolvedAt: true,
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset,
    })

    const total = await db.dispute.count({ where })

    return NextResponse.json({
      disputes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching disputes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    )
  }
}

// POST /api/disputes - Create a new dispute
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createDisputeSchema.parse(body)

    // Check if match exists
    const match = await db.match.findUnique({
      where: { id: validatedData.matchId }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Check if teams exist
    const [raisedByTeam, againstTeam] = await Promise.all([
      db.team.findUnique({ where: { id: validatedData.raisedByTeamId } }),
      db.team.findUnique({ where: { id: validatedData.againstTeamId } })
    ])

    if (!raisedByTeam || !againstTeam) {
      return NextResponse.json(
        { error: 'One or both teams not found' },
        { status: 404 }
      )
    }

    // Check if teams are part of the match
    if (match.homeTeamId !== validatedData.raisedByTeamId && 
        match.awayTeamId !== validatedData.raisedByTeamId) {
      return NextResponse.json(
        { error: 'Your team is not part of this match' },
        { status: 400 }
      )
    }

    if (match.homeTeamId !== validatedData.againstTeamId && 
        match.awayTeamId !== validatedData.againstTeamId) {
      return NextResponse.json(
        { error: 'Opposing team is not part of this match' },
        { status: 400 }
      )
    }

    // Check if similar dispute already exists
    const existingDispute = await db.dispute.findFirst({
      where: {
        matchId: validatedData.matchId,
        raisedByTeamId: validatedData.raisedByTeamId,
        againstTeamId: validatedData.againstTeamId,
        category: validatedData.category,
        status: { in: ['OPEN', 'UNDER_REVIEW'] }
      }
    })

    if (existingDispute) {
      return NextResponse.json(
        { error: 'A similar dispute is already open for this match' },
        { status: 409 }
      )
    }

    // Create dispute
    const dispute = await db.dispute.create({
      data: {
        ...validatedData,
        status: 'OPEN',
      },
      include: {
        match: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            homeTeam: {
              select: { id: true, name: true, shortName: true }
            },
            awayTeam: {
              select: { id: true, name: true, shortName: true }
            }
          }
        },
        raisedByTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
          }
        },
        againstTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
          }
        }
      }
    })

    // Notify admin (in real app, this would send email/notification)
    console.log(`New dispute raised: ${dispute.id} - ${dispute.title}`)

    return NextResponse.json(dispute, { status: 201 })
  } catch (error) {
    console.error('Error creating dispute:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create dispute' },
      { status: 500 }
    )
  }
}