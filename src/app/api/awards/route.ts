import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/awards - Get awards and achievements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // player, team, tournament
    const period = searchParams.get('period') // weekly, monthly, yearly, all-time
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let awards: any[] = []

    // Player Awards
    if (!type || type === 'player') {
      const orangeCap = await getOrangeCap(period)
      const purpleCap = await getPurpleCap(period)
      const manOfTheMatch = await getManOfTheMatch(period)
      const mostSixes = await getMostSixes(period)
      const bestBowling = await getBestBowling(period)

      awards.push(
        { type: 'player', category: 'Orange Cap', period, data: orangeCap },
        { type: 'player', category: 'Purple Cap', period, data: purpleCap },
        { type: 'player', category: 'Man of the Match', period, data: manOfTheMatch },
        { type: 'player', category: 'Most Sixes', period, data: mostSixes },
        { type: 'player', category: 'Best Bowling', period, data: bestBowling }
      )
    }

    // Team Awards
    if (!type || type === 'team') {
      const bestTeam = await getBestTeam(period)
      const mostWins = await getMostWins(period)
      const highestScore = await getHighestTeamScore(period)

      awards.push(
        { type: 'team', category: 'Best Team', period, data: bestTeam },
        { type: 'team', category: 'Most Wins', period, data: mostWins },
        { type: 'team', category: 'Highest Score', period, data: highestScore }
      )
    }

    // Tournament Awards
    if (!type || type === 'tournament') {
      const tournamentWinner = await getTournamentWinner(period)
      const playerOfTournament = await getPlayerOfTournament(period)

      awards.push(
        { type: 'tournament', category: 'Tournament Winner', period, data: tournamentWinner },
        { type: 'tournament', category: 'Player of Tournament', period, data: playerOfTournament }
      )
    }

    // Filter by type if specified
    const filteredAwards = type ? awards.filter(award => award.type === type) : awards

    return NextResponse.json({
      awards: filteredAwards.slice(offset, offset + limit),
      total: filteredAwards.length
    })
  } catch (error) {
    console.error('Error fetching awards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch awards' },
      { status: 500 }
    )
  }
}

// Helper functions to calculate awards
async function getOrangeCap(period: string) {
  const where = buildPeriodWhere(period)
  
  const topScorer = await db.playerStat.findFirst({
    where,
    include: {
      player: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              area: true,
            }
          }
        }
      }
    },
    orderBy: { totalRuns: 'desc' }
  })

  return topScorer ? {
    player: topScorer.player,
    runs: topScorer.totalRuns,
    matches: topScorer.matches,
    average: topScorer.totalBalls > 0 ? (topScorer.totalRuns / topScorer.totalBalls * 100).toFixed(2) : '0.00'
  } : null
}

async function getPurpleCap(period: string) {
  const where = buildPeriodWhere(period)
  
  const topWicketTaker = await db.playerStat.findFirst({
    where,
    include: {
      player: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              area: true,
            }
          }
        }
      }
    },
    orderBy: { totalWickets: 'desc' }
  })

  return topWicketTaker ? {
    player: topWicketTaker.player,
    wickets: topWicketTaker.totalWickets,
    matches: topWicketTaker.matches,
    average: topWicketTaker.totalWickets > 0 ? (topWicketTaker.totalRuns / topWicketTaker.totalWickets).toFixed(2) : '0.00',
    economy: topWicketTaker.totalBalls > 0 ? ((topWicketTaker.totalRuns / topWicketTaker.totalBalls) * 6).toFixed(2) : '0.00'
  } : null
}

async function getManOfTheMatch(period: string) {
  // In a real implementation, this would come from match awards
  // For now, we'll return the player with the best all-round performance
  const where = buildPeriodWhere(period)
  
  const bestAllRounder = await db.playerStat.findFirst({
    where,
    include: {
      player: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              area: true,
            }
          }
        }
      }
    },
    orderBy: [
      { totalRuns: 'desc' },
      { totalWickets: 'desc' }
    ]
  })

  return bestAllRounder ? {
    player: bestAllRounder.player,
    runs: bestAllRounder.totalRuns,
    wickets: bestAllRounder.totalWickets,
    matches: bestAllRounder.matches
  } : null
}

async function getMostSixes(period: string) {
  // Mock implementation - in real app, this would track sixes per match
  const where = buildPeriodWhere(period)
  
  const topSixHitter = await db.playerStat.findFirst({
    where,
    include: {
      player: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              area: true,
            }
          }
        }
      }
    },
    orderBy: { totalRuns: 'desc' }
  })

  return topSixHitter ? {
    player: topSixHitter.player,
    runs: topSixHitter.totalRuns,
    estimatedSixes: Math.floor(topSixHitter.totalRuns / 6), // Mock calculation
    matches: topSixHitter.matches
  } : null
}

async function getBestBowling(period: string) {
  const where = buildPeriodWhere(period)
  
  const bestBowler = await db.playerStat.findFirst({
    where,
    include: {
      player: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              area: true,
            }
          }
        }
      }
    },
    orderBy: [
      { totalWickets: 'desc' },
      { economy: 'asc' }
    ]
  })

  return bestBowler ? {
    player: bestBowler.player,
    wickets: bestBowler.totalWickets,
    economy: bestBowler.totalBalls > 0 ? ((bestBowler.totalRuns / bestBowler.totalBalls) * 6).toFixed(2) : '0.00',
    matches: bestBowler.matches
  } : null
}

async function getBestTeam(period: string) {
  const where = buildTeamPeriodWhere(period)
  
  const bestTeam = await db.team.findFirst({
    where,
    include: {
      _count: {
        select: {
          matches: true,
        }
      }
    },
    orderBy: [
      { rating: 'desc' },
      { isVerified: 'desc' }
    ]
  })

  return bestTeam ? {
    team: bestTeam,
    rating: bestTeam.rating,
    matches: bestTeam._count.matches,
    isVerified: bestTeam.isVerified
  } : null
}

async function getMostWins(period: string) {
  const where = buildTeamPeriodWhere(period)
  
  const teams = await db.team.findMany({
    where,
    include: {
      _count: {
        select: {
          matches: true,
        }
      },
      matches: {
        where: {
          status: 'COMPLETED'
        },
        select: {
          winnerId: true
        }
      }
    }
  })

  const teamWins = teams.map(team => ({
    team,
    wins: team.matches.filter(m => m.winnerId === team.id).length,
    totalMatches: team._count.matches
  })).sort((a, b) => b.wins - a.wins)

  return teamWins.length > 0 ? {
    team: teamWins[0].team,
    wins: teamWins[0].wins,
    totalMatches: teamWins[0].totalMatches,
    winRate: teamWins[0].totalMatches > 0 ? ((teamWins[0].wins / teamWins[0].totalMatches) * 100).toFixed(1) : '0.0'
  } : null
}

async function getHighestTeamScore(period: string) {
  // Mock implementation - in real app, this would come from match scorecards
  const where = buildTeamPeriodWhere(period)
  
  const teams = await db.team.findMany({
    where,
    include: {
      players: {
        select: {
          totalRuns: true
        }
      }
    }
  })

  const teamScores = teams.map(team => ({
    team,
    totalRuns: team.players.reduce((sum, player) => sum + (player.totalRuns || 0), 0)
  })).sort((a, b) => b.totalRuns - a.totalRuns)

  return teamScores.length > 0 ? {
    team: teamScores[0].team,
    totalRuns: teamScores[0].totalRuns,
    averagePerPlayer: Math.round(teamScores[0].totalRuns / teamScores[0].team.players.length)
  } : null
}

async function getTournamentWinner(period: string) {
  const where = buildTournamentPeriodWhere(period)
  
  const winner = await db.tournament.findFirst({
    where: {
      ...where,
      status: 'COMPLETED'
    },
    include: {
      teams: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              area: true,
              isVerified: true,
            }
          }
        }
      },
      _count: {
        select: {
          teams: true
        }
      }
    },
    orderBy: { endDate: 'desc' }
  })

  // In a real implementation, the winner would be determined from tournament results
  return winner ? {
    tournament: winner,
    winnerTeam: winner.teams[0]?.team || null,
    prizePool: winner.prizePool,
    teams: winner._count.teams
  } : null
}

async function getPlayerOfTournament(period: string) {
  // Mock implementation - in real app, this would come from tournament performance
  const where = buildPeriodWhere(period)
  
  const bestPlayer = await db.playerStat.findFirst({
    where,
    include: {
      player: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              shortName: true,
              area: true,
            }
          }
        }
      }
    },
    orderBy: [
      { totalRuns: 'desc' },
      { totalWickets: 'desc' }
    ]
  })

  return bestPlayer ? {
    player: bestPlayer.player,
    runs: bestPlayer.totalRuns,
    wickets: bestPlayer.totalWickets,
    matches: bestPlayer.matches,
    performance: 'All-round excellence'
  } : null
}

// Helper functions to build period-based where clauses
function buildPeriodWhere(period: string) {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'monthly':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'yearly':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      // All-time - no date filter
      return {}
  }

  return {
    createdAt: {
      gte: startDate
    }
  }
}

function buildTeamPeriodWhere(period: string) {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'monthly':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'yearly':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      return {}
  }

  return {
    createdAt: {
      gte: startDate
    }
  }
}

function buildTournamentPeriodWhere(period: string) {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'monthly':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'yearly':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      return {}
  }

  return {
    startDate: {
      gte: startDate
    }
  }
}