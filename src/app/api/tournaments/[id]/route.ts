import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateTournamentSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['UPCOMING', 'REGISTRATION', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().transform(val => new Date(val)).optional(),
  endDate: z.string().transform(val => new Date(val)).optional(),
  groundId: z.string().optional(),
  prizePool: z.number().optional(),
})

// GET /api/tournaments/[id] - Get a specific tournament
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        ground: {
          select: {
            id: true,
            name: true,
            address: true,
            area: true,
            pricePerSlot: true,
          }
        },
        teams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                shortName: true,
                area: true,
                isVerified: true,
                rating: true,
                manager: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        matches: {
          include: {
            homeTeam: {
              select: {
                id: true,
                name: true,
                shortName: true,
              }
            },
            awayTeam: {
              select: {
                id: true,
                name: true,
                shortName: true,
              }
            },
            ground: {
              select: {
                id: true,
                name: true,
                address: true,
                area: true,
              }
            },
            scheduledDate: true,
            scheduledTime: true,
            status: true,
            winnerId: true,
          },
          orderBy: { scheduledDate: 'asc' }
        },
        _count: {
          select: {
            teams: true,
            matches: true,
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Calculate tournament standings if league format
    let standings = []
    if (tournament.format === 'LEAGUE' || tournament.format === 'DOUBLE_LEAGUE') {
      standings = await calculateTournamentStandings(params.id)
    }

    return NextResponse.json({
      ...tournament,
      standings
    })
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}

// PUT /api/tournaments/[id] - Update a tournament
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateTournamentSchema.parse(body)

    // Check if tournament exists
    const existingTournament = await db.tournament.findUnique({
      where: { id: params.id }
    })

    if (!existingTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Validate dates if provided
    if (validatedData.startDate && validatedData.endDate) {
      if (new Date(validatedData.endDate) <= new Date(validatedData.startDate)) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    const updatedTournament = await db.tournament.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(updatedTournament)
  } catch (error) {
    console.error('Error updating tournament:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    )
  }
}

// POST /api/tournaments/[id]/join - Join a tournament
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { teamId, paymentId } = body

    // Check if tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      include: {
        teams: {
          include: {
            team: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check if tournament is accepting registrations
    if (tournament.status !== 'UPCOMING' && tournament.status !== 'REGISTRATION') {
      return NextResponse.json(
        { error: 'Tournament is not accepting registrations' },
        { status: 400 }
      )
    }

    // Check if team is already registered
    const existingTeam = tournament.teams.find(t => t.teamId === teamId)
    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team is already registered for this tournament' },
        { status: 409 }
      )
    }

    // Check if tournament has reached max teams
    if (tournament.teams.length >= tournament.maxTeams) {
      return NextResponse.json(
        { error: 'Tournament has reached maximum team limit' },
        { status: 400 }
      )
    }

    // Check if team exists
    const team = await db.team.findUnique({
      where: { id: teamId }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Create tournament team entry
    const tournamentTeam = await db.tournamentTeam.create({
      data: {
        tournamentId: params.id,
        teamId,
        paymentId,
        status: 'REGISTERED',
        registeredAt: new Date(),
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
            isVerified: true,
            rating: true,
          }
        }
      }
    })

    // Update tournament status if min teams reached
    if (tournament.teams.length + 1 >= tournament.minTeams) {
      await db.tournament.update({
        where: { id: params.id },
        data: { status: 'REGISTRATION' }
      })
    }

    // Auto-start tournament if max teams reached
    if (tournament.teams.length + 1 >= tournament.maxTeams) {
      await startTournament(params.id)
    }

    return NextResponse.json({
      message: 'Successfully joined tournament',
      tournamentTeam
    }, { status: 201 })

  } catch (error) {
    console.error('Error joining tournament:', error)
    return NextResponse.json(
      { error: 'Failed to join tournament' },
      { status: 500 }
    )
  }
}

// POST /api/tournaments/[id]/start - Start a tournament
export async function POST_START(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await startTournament(params.id)
    
    if (success) {
      return NextResponse.json({
        message: 'Tournament started successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to start tournament' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error starting tournament:', error)
    return NextResponse.json(
      { error: 'Failed to start tournament' },
      { status: 500 }
    )
  }
}

// Helper function to start tournament and generate matches
async function startTournament(tournamentId: string): Promise<boolean> {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        teams: {
          include: {
            team: {
              select: { id: true, name: true, shortName: true }
            }
          }
        }
      }
    })

    if (!tournament || tournament.teams.length < tournament.minTeams) {
      return false
    }

    // Update tournament status
    await db.tournament.update({
      where: { id: tournamentId },
      data: { status: 'ONGOING' }
    })

    const teams = tournament.teams

    if (tournament.format === 'KNOCKOUT') {
      // Generate knockout matches
      await generateKnockoutMatches(tournamentId, teams)
    } else if (tournament.format === 'LEAGUE') {
      // Generate league matches
      await generateLeagueMatches(tournamentId, teams)
    } else if (tournament.format === 'DOUBLE_LEAGUE') {
      // Generate double league matches
      await generateDoubleLeagueMatches(tournamentId, teams)
    }

    return true
  } catch (error) {
    console.error('Error starting tournament:', error)
    return false
  }
}

// Helper function to generate knockout matches
async function generateKnockoutMatches(tournamentId: string, teams: any[]): Promise<void> {
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
  const matches = []

  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      const match = await db.match.create({
        data: {
          title: `Round 1 - ${shuffledTeams[i].team.name} vs ${shuffledTeams[i + 1].team.name}`,
          homeTeamId: shuffledTeams[i].teamId,
          awayTeamId: shuffledTeams[i + 1].teamId,
          tournamentId,
          scheduledDate: new Date(),
          scheduledTime: '18:00',
          matchFormat: 'T20',
          ballType: 'TENNIS',
          oversPerInnings: 20,
          status: 'SCHEDULED',
          entryFee: 0, // Tournament matches have no entry fee
          prizePool: 0,
          platformFee: 0,
          round: 1,
          matchNumber: Math.floor(i / 2) + 1,
          createdBy: 'system',
        }
      })
      matches.push(match)
    }
  }
}

// Helper function to generate league matches
async function generateLeagueMatches(tournamentId: string, teams: any[]): Promise<void> {
  const matches = []
  let matchNumber = 1

  // Generate round-robin matches
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const match = await db.match.create({
        data: {
          title: `${teams[i].team.name} vs ${teams[j].team.name}`,
          homeTeamId: teams[i].teamId,
          awayTeamId: teams[j].teamId,
          tournamentId,
          scheduledDate: new Date(),
          scheduledTime: '18:00',
          matchFormat: 'T20',
          ballType: 'TENNIS',
          oversPerInnings: 20,
          status: 'SCHEDULED',
          entryFee: 0,
          prizePool: 0,
          platformFee: 0,
          round: Math.floor(matchNumber / (teams.length - 1)) + 1,
          matchNumber,
          createdBy: 'system',
        }
      })
      matches.push(match)
      matchNumber++
    }
  }
}

// Helper function to generate double league matches
async function generateDoubleLeagueMatches(tournamentId: string, teams: any[]): Promise<void> {
  // Generate two rounds of league matches
  await generateLeagueMatches(tournamentId, teams)
  
  // Second round with swapped home/away
  const matches = []
  let matchNumber = teams.length * (teams.length - 1) + 1

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const match = await db.match.create({
        data: {
          title: `${teams[j].team.name} vs ${teams[i].team.name} (Round 2)`,
          homeTeamId: teams[j].teamId,
          awayTeamId: teams[i].teamId,
          tournamentId,
          scheduledDate: new Date(),
          scheduledTime: '18:00',
          matchFormat: 'T20',
          ballType: 'TENNIS',
          oversPerInnings: 20,
          status: 'SCHEDULED',
          entryFee: 0,
          prizePool: 0,
          platformFee: 0,
          round: Math.floor(matchNumber / (teams.length - 1)) + 1,
          matchNumber,
          createdBy: 'system',
        }
      })
      matches.push(match)
      matchNumber++
    }
  }
}

// Helper function to calculate tournament standings
async function calculateTournamentStandings(tournamentId: string) {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: {
        include: {
          team: {
            select: { id: true, name: true, shortName: true }
          }
        }
      },
      matches: {
        where: { status: 'COMPLETED' },
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true } },
          awayTeam: { select: { id: true, name: true, shortName: true } },
          winnerId: true
        }
      }
    }
  })

  if (!tournament) return []

  const standings = tournament.teams.map(tournamentTeam => {
    const team = tournamentTeam.team
    const matches = tournament.matches.filter(
      m => m.homeTeamId === team.id || m.awayTeamId === team.id
    )

    let played = 0
    let won = 0
    let lost = 0
    let tied = 0
    let runsFor = 0
    let runsAgainst = 0

    matches.forEach(match => {
      const isHome = match.homeTeamId === team.id
      const wonMatch = match.winnerId === team.id

      played++
      
      if (wonMatch) {
        won++
      } else if (match.winnerId) {
        lost++
      } else {
        tied++
      }

      // In a real implementation, you'd calculate runs from match scorecards
      // For now, we'll use mock data
      const mockRunsFor = Math.floor(Math.random() * 50) + 20
      const mockRunsAgainst = Math.floor(Math.random() * 40) + 15
      
      runsFor += mockRunsFor
      runsAgainst += mockRunsAgainst
    })

    const netRunRate = runsFor - runsAgainst
    const points = won * 2 + tied

    return {
      team,
      played,
      won,
      lost,
      tied,
      points,
      runsFor,
      runsAgainst,
      netRunRate,
      runRate: runsFor > 0 ? (runsFor / played) * 6 : 0
    }
  })

  // Sort by points, then by net run rate
  return standings.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points
    }
    return b.netRunRate - a.netRunRate
  })
}