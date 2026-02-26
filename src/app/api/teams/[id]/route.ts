import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateTeamSchema = z.object({
  name: z.string().min(2).optional(),
  shortName: z.string().min(2).max(10).optional(),
  description: z.string().optional(),
  area: z.string().min(1).optional(),
  logo: z.string().optional(),
  isVerified: z.boolean().optional(),
})

// GET /api/teams/[id] - Get a specific team
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        players: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              }
            }
          },
          orderBy: [
            { role: 'asc' },
            { jerseyNumber: 'asc' }
          ]
        },
        homeMatches: {
          where: { status: { in: ['SCHEDULED', 'ACCEPTED', 'LIVE'] } },
          include: {
            awayTeam: {
              select: { id: true, name: true, shortName: true, logo: true }
            },
            ground: {
              select: { id: true, name: true, address: true, area: true }
            }
          },
          orderBy: { scheduledDate: 'asc' }
        },
        awayMatches: {
          where: { status: { in: ['SCHEDULED', 'ACCEPTED', 'LIVE'] } },
          include: {
            homeTeam: {
              select: { id: true, name: true, shortName: true, logo: true }
            },
            ground: {
              select: { id: true, name: true, address: true, area: true }
            }
          },
          orderBy: { scheduledDate: 'asc' }
        },
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true,
            players: true,
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Calculate team statistics
    const allMatches = [...team.homeMatches, ...team.awayMatches]
    const completedMatches = allMatches.filter(match => match.status === 'COMPLETED')
    const wonMatches = completedMatches.filter(match => match.winnerId === team.id)
    
    const teamStats = {
      totalMatches: completedMatches.length,
      wonMatches: wonMatches.length,
      lostMatches: completedMatches.length - wonMatches.length,
      winRate: completedMatches.length > 0 ? (wonMatches.length / completedMatches.length) * 100 : 0,
      currentRating: team.rating,
    }

    return NextResponse.json({
      ...team,
      stats: teamStats,
      upcomingMatches: allMatches.filter(match => 
        ['SCHEDULED', 'ACCEPTED', 'LIVE'].includes(match.status)
      )
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

// PUT /api/teams/[id] - Update a team
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateTeamSchema.parse(body)

    // Check if team exists
    const existingTeam = await db.team.findUnique({
      where: { id: params.id }
    })

    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Check for duplicate names/short names (excluding current team)
    if (validatedData.name || validatedData.shortName) {
      const duplicateTeam = await db.team.findFirst({
        where: {
          AND: [
            { id: { not: params.id } },
            {
              OR: [
                validatedData.name ? { name: { equals: validatedData.name, mode: 'insensitive' } } : {},
                validatedData.shortName ? { shortName: { equals: validatedData.shortName, mode: 'insensitive' } } : {}
              ].filter(condition => Object.keys(condition).length > 0)
            }
          ]
        }
      })

      if (duplicateTeam) {
        return NextResponse.json(
          { error: 'Team with this name or short name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedTeam = await db.team.update({
      where: { id: params.id },
      data: validatedData,
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

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error('Error updating team:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id] - Delete a team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if team exists
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true,
            tournamentTeams: true,
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Check if team has active matches or tournaments
    const hasActiveMatches = team._count.homeMatches > 0 || team._count.awayMatches > 0
    const hasActiveTournaments = team._count.tournamentTeams > 0

    if (hasActiveMatches || hasActiveTournaments) {
      return NextResponse.json(
        { 
          error: 'Cannot delete team with active matches or tournaments',
          details: {
            hasActiveMatches,
            hasActiveTournaments,
            totalMatches: team._count.homeMatches + team._count.awayMatches,
            totalTournaments: team._count.tournamentTeams
          }
        },
        { status: 400 }
      )
    }

    // Soft delete by deactivating all players first
    await db.player.updateMany({
      where: { teamId: params.id },
      data: { isActive: false }
    })

    // Delete the team
    await db.team.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Team deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}