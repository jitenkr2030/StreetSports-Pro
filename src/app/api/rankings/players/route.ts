import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/rankings/players - Get player rankings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'batting' // batting, bowling, all-rounder
    const area = searchParams.get('area')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let rankings: any[] = []

    if (type === 'batting' || type === 'all') {
      const battingRankings = await db.playerStat.findMany({
        where: {
          player: {
            isActive: true,
            ...(area && { team: { area } })
          }
        },
        include: {
          player: {
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
          }
        },
        orderBy: [
          { totalRuns: 'desc' },
          { matches: 'desc' }
        ],
        take: type === 'batting' ? limit : Math.ceil(limit / 2),
        skip: type === 'batting' ? offset : 0,
      })

      rankings.push(...battingRankings.map((stat, index) => ({
        rank: index + 1,
        type: 'batting',
        player: stat.player,
        stats: {
          matches: stat.matches,
          totalRuns: stat.totalRuns,
          totalBalls: stat.totalBalls,
          average: stat.totalBalls > 0 ? (stat.totalRuns / stat.totalBalls * 100).toFixed(2) : '0.00',
          strikeRate: stat.totalBalls > 0 ? ((stat.totalRuns / stat.totalBalls) * 100).toFixed(2) : '0.00',
          highestScore: stat.highestScore || 0,
          centuries: stat.centuries || 0,
          halfCenturies: stat.halfCenturies || 0,
        }
      })))
    }

    if (type === 'bowling' || type === 'all') {
      const bowlingRankings = await db.playerStat.findMany({
        where: {
          player: {
            isActive: true,
            ...(area && { team: { area } })
          }
        },
        include: {
          player: {
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
          }
        },
        orderBy: [
          { totalWickets: 'desc' },
          { economy: 'asc' }
        ],
        take: type === 'bowling' ? limit : Math.ceil(limit / 2),
        skip: type === 'bowling' ? offset : type === 'batting' ? Math.ceil(limit / 2) : 0,
      })

      rankings.push(...bowlingRankings.map((stat, index) => ({
        rank: index + 1,
        type: 'bowling',
        player: stat.player,
        stats: {
          matches: stat.matches,
          totalWickets: stat.totalWickets,
          totalRuns: stat.totalRuns,
          totalBalls: stat.totalBalls,
          average: stat.totalWickets > 0 ? (stat.totalRuns / stat.totalWickets).toFixed(2) : '0.00',
          economy: stat.totalBalls > 0 ? ((stat.totalRuns / stat.totalBalls) * 6).toFixed(2) : '0.00',
          bestFigures: stat.bestFigures || '0/0',
          fiveWickets: stat.fiveWickets || 0,
        }
      })))
    }

    // Sort by rank if mixed type
    if (type === 'all') {
      rankings.sort((a, b) => a.rank - b.rank)
    }

    const total = await db.playerStat.count({
      where: {
        player: {
          isActive: true,
          ...(area && { team: { area } })
        }
      }
    })

    return NextResponse.json({
      rankings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching player rankings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player rankings' },
      { status: 500 }
    )
  }
}