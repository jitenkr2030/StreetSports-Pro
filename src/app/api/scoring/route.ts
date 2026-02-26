import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const ballEventSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  inning: z.enum(['1', '2']),
  over: z.number().int().min(1),
  ball: z.number().int().min(1),
  batsmanId: z.string().min(1, 'Batsman ID is required'),
  bowlerId: z.string().min(1, 'Bowler ID is required'),
  nonStrikerId: z.string().optional(),
  event: z.enum(['0', '1', '2', '3', '4', '5', '6', 'W', 'WD', 'NB', 'LB', 'BY', 'CB']),
  runs: z.number().int().default(0),
  wickets: z.number().int().default(0),
  extras: z.number().int().default(0),
  commentary: z.string().optional(),
})

const updateInningSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  inning: z.enum(['1', '2']),
  runs: z.number().int().default(0),
  wickets: z.number().int().default(0),
  overs: z.number().default(0),
  balls: z.number().int().default(0),
  strikerId: z.string().optional(),
  nonStrikerId: z.string().optional(),
  bowlerId: z.string().optional(),
})

// POST /api/scoring/ball - Record a ball event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ballEventSchema.parse(body)

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

    // Check if match is in LIVE status
    if (match.status !== 'LIVE') {
      return NextResponse.json(
        { error: 'Match is not in LIVE status' },
        { status: 400 }
      )
    }

    // Get or create inning
    let inning = await db.inning.findUnique({
      where: {
        matchId_inning: {
          matchId: validatedData.matchId,
          inning: validatedData.inning
        }
      }
    })

    if (!inning) {
      // Create new inning
      inning = await db.inning.create({
        data: {
          matchId: validatedData.matchId,
          inning: validatedData.inning,
          battingTeamId: validatedData.inning === '1' ? match.homeTeamId : match.awayTeamId,
          bowlingTeamId: validatedData.inning === '1' ? match.awayTeamId : match.homeTeamId,
          runs: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
        }
      })
    }

    // Create ball event
    const ballEvent = await db.ballEvent.create({
      data: {
        ...validatedData,
        inningId: inning.id,
      }
    })

    // Update batting stats
    await updateBattingStats(validatedData.batsmanId, validatedData)
    
    // Update bowling stats
    await updateBowlingStats(validatedData.bowlerId, validatedData)

    // Update inning totals
    await updateInningTotals(inning.id, validatedData)

    // Update match scorecard
    await updateMatchScorecard(validatedData.matchId)

    return NextResponse.json({
      ballEvent,
      message: 'Ball event recorded successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error recording ball event:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to record ball event' },
      { status: 500 }
    )
  }
}

// PUT /api/scoring/innning - Update inning totals
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = updateInningSchema.parse(body)

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

    // Get or create inning
    let inning = await db.inning.findUnique({
      where: {
        matchId_inning: {
          matchId: validatedData.matchId,
          inning: validatedData.inning
        }
      }
    })

    if (!inning) {
      return NextResponse.json(
        { error: 'Inning not found' },
        { status: 404 }
      )
    }

    // Update inning
    const updatedInning = await db.inning.update({
      where: { id: inning.id },
      data: {
        runs: validatedData.runs,
        wickets: validatedData.wickets,
        overs: validatedData.overs,
        balls: validatedData.balls,
        strikerId: validatedData.strikerId,
        nonStrikerId: validatedData.nonStrikerId,
        bowlerId: validatedData.bowlerId,
      }
    })

    // Update match scorecard
    await updateMatchScorecard(validatedData.matchId)

    return NextResponse.json({
      inning: updatedInning,
      message: 'Inning updated successfully'
    })

  } catch (error) {
    console.error('Error updating inning:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update inning' },
      { status: 500 }
    )
  }
}

// GET /api/scoring/match/[matchId] - Get match scoring data
export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const match = await db.match.findUnique({
      where: { id: params.matchId },
      include: {
        homeTeam: {
          select: { id: true, name: true, shortName: true }
        },
        awayTeam: {
          select: { id: true, name: true, shortName: true }
        },
        innings: {
          include: {
            battingTeam: {
              select: { id: true, name: true, shortName: true }
            },
            bowlingTeam: {
              select: { id: true, name: true, shortName: true }
            },
            ballEvents: {
              orderBy: { id: 'asc' }
            }
          },
          orderBy: { inning: 'asc' }
        }
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error('Error fetching match scoring data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match scoring data' },
      { status: 500 }
    )
  }
}

// Helper functions
async function updateBattingStats(playerId: string, ballEvent: any) {
  const stats = await db.playerStat.findUnique({
    where: { playerId }
  })

  if (!stats) {
    // Create new stats record
    await db.playerStat.create({
      data: {
        playerId,
        matches: 1,
        innings: 1,
        totalRuns: ballEvent.runs,
        totalBalls: ballEvent.event !== 'WD' && ballEvent.event !== 'NB' ? 1 : 0,
        totalWickets: ballEvent.wickets,
      }
    })
  } else {
    // Update existing stats
    const isWicketBall = ballEvent.event === 'W'
    const isDotBall = ballEvent.event === '0' || ballEvent.event === 'WD' || ballEvent.event === 'NB' || ballEvent.event === 'LB'
    const isScoringBall = ballEvent.runs > 0

    await db.playerStat.update({
      where: { playerId },
      data: {
        totalRuns: { increment: ballEvent.runs },
        totalBalls: { increment: ballEvent.event !== 'WD' && ballEvent.event !== 'NB' ? 1 : 0 },
        totalWickets: { increment: ballEvent.wickets },
        // Update other stats as needed
      }
    })
  }
}

async function updateBowlingStats(playerId: string, ballEvent: any) {
  const stats = await db.playerStat.findUnique({
    where: { playerId }
  })

  if (!stats) {
    // Create new stats record
    await db.playerStat.create({
      data: {
        playerId,
        matches: 1,
        totalWickets: ballEvent.wickets,
        totalRuns: ballEvent.runs,
        totalBalls: 1,
      }
    })
  } else {
    // Update existing stats
    await db.playerStat.update({
      where: { playerId },
      data: {
        totalWickets: { increment: ballEvent.wickets },
        totalRuns: { increment: ballEvent.runs },
        totalBalls: { increment: 1 },
      }
    })
  }
}

async function updateInningTotals(inningId: string, ballEvent: any) {
  const inning = await db.inning.findUnique({
    where: { id: inningId }
  })

  if (!inning) return

  const isWicketBall = ballEvent.event === 'W'
  const isScoringBall = ballEvent.runs > 0
  const isExtraBall = ['WD', 'NB', 'LB', 'BY', 'CB'].includes(ballEvent.event)
  
  let newBalls = inning.balls + 1
  let newOvers = inning.overs

  // Only count legitimate balls for overs calculation
  if (!['WD', 'NB'].includes(ballEvent.event)) {
    newBalls = inning.balls + 1
    if (newBalls % 6 === 0) {
      newOvers = inning.overs + 1
    }
  }

  await db.inning.update({
    where: { id: inningId },
    data: {
      runs: inning.runs + ballEvent.runs,
      wickets: inning.wickets + ballEvent.wickets,
      overs: newOvers,
      balls: newBalls,
      strikerId: ballEvent.event === 'W' ? ballEvent.nonStrikerId : ballEvent.batsmanId,
      nonStrikerId: ballEvent.event === 'W' ? ballEvent.batsmanId : ballEvent.nonStrikerId,
    }
  })
}

async function updateMatchScorecard(matchId: string) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      innings: {
        orderBy: { inning: 'asc' }
      }
    }
  })

  if (!match) return

  // Calculate total score
  const totalRuns = match.innings.reduce((sum, inning) => sum + inning.runs, 0)
  const totalWickets = match.innings.reduce((sum, inning) => sum + inning.wickets, 0)
  
  // Create scorecard JSON
  const scorecard = {
    innings: match.innings.map(inning => ({
      inning: inning.inning,
      battingTeam: inning.battingTeam,
      bowlingTeam: inning.bowlingTeam,
      runs: inning.runs,
      wickets: inning.wickets,
      overs: inning.overs,
      balls: inning.balls,
      runRate: inning.balls > 0 ? (inning.runs / (inning.balls / 6)) * 6 : 0,
    })),
    totalRuns,
    totalWickets,
    totalOvers: match.innings.reduce((sum, inning) => sum + inning.overs, 0),
    totalBalls: match.innings.reduce((sum, inning) => sum + inning.balls, 0),
  }

  await db.match.update({
    where: { id: matchId },
    data: {
      scorecard: JSON.stringify(scorecard),
      result: totalWickets >= 10 ? `All Out for ${totalRuns}` : `${totalRuns}/${totalWickets}`,
    }
  })
}