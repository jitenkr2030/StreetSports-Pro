import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/analytics - Get comprehensive platform analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get overview stats
    const [
      totalUsers,
      totalTeams,
      totalMatches,
      totalTournaments,
      totalGrounds,
      totalPayments,
      totalDisputes
    ] = await Promise.all([
      db.user.count(),
      db.team.count(),
      db.match.count(),
      db.tournament.count(),
      db.ground.count(),
      db.payment.count(),
      db.dispute.count()
    ])

    // Get period-based stats
    const [
      newUsers,
      newTeams,
      completedMatches,
      activeTournaments,
      totalRevenue,
      activeDisputes
    ] = await Promise.all([
      db.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      db.team.count({
        where: { createdAt: { gte: startDate } }
      }),
      db.match.count({
        where: { 
          status: 'COMPLETED',
          scheduledDate: { gte: startDate }
        }
      }),
      db.tournament.count({
        where: { 
          status: 'ONGOING',
          startDate: { gte: startDate }
        }
      }),
      db.payment.aggregate({
        where: { 
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { amount: true }
      }),
      db.dispute.count({
        where: { 
          status: { in: ['OPEN', 'UNDER_REVIEW'] },
          createdAt: { gte: startDate }
        }
      })
    ])

    // Get revenue breakdown
    const revenueByType = await db.payment.groupBy({
      by: ['type'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      _sum: { amount: true },
      _count: true
    })

    // Get top performing teams
    const topTeams = await db.team.findMany({
      take: 5,
      orderBy: { rating: 'desc' },
      include: {
        _count: {
          select: {
            matches: true,
            wins: true
          }
        }
      }
    })

    // Get top players
    const topBatsmen = await db.playerStat.findMany({
      take: 5,
      orderBy: { totalRuns: 'desc' },
      include: {
        player: {
          include: {
            team: {
              select: { name: true, shortName: true }
            }
          }
        }
      }
    })

    const topBowlers = await db.playerStat.findMany({
      take: 5,
      orderBy: { totalWickets: 'desc' },
      include: {
        player: {
          include: {
            team: {
              select: { name: true, shortName: true }
            }
          }
        }
      }
    })

    // Get popular grounds
    const popularGrounds = await db.ground.findMany({
      take: 5,
      include: {
        _count: {
          select: {
            matches: true,
            groundBookings: true
          }
        }
      },
      orderBy: {
        groundBookings: {
          _count: 'desc'
        }
      }
    })

    // Get dispute statistics
    const disputeStats = await db.dispute.groupBy({
      by: ['category', 'status'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    })

    // Get match format popularity
    const formatStats = await db.match.groupBy({
      by: ['matchFormat', 'status'],
      where: {
        scheduledDate: { gte: startDate }
      },
      _count: true
    })

    // Get area-wise statistics
    const areaStats = await db.team.groupBy({
      by: ['area'],
      _count: true
    })

    // Calculate growth metrics
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const [
      previousUsers,
      previousTeams,
      previousMatches,
      previousRevenue
    ] = await Promise.all([
      db.user.count({
        where: { 
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      db.team.count({
        where: { 
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      db.match.count({
        where: { 
          scheduledDate: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      db.payment.aggregate({
        where: { 
          status: 'COMPLETED',
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        },
        _sum: { amount: true }
      })
    ])

    const userGrowth = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0
    const teamGrowth = previousTeams > 0 ? ((newTeams - previousTeams) / previousTeams) * 100 : 0
    const matchGrowth = previousMatches > 0 ? ((completedMatches - previousMatches) / previousMatches) * 100 : 0
    const revenueGrowth = previousRevenue._sum.amount ? 
      ((totalRevenue._sum.amount - previousRevenue._sum.amount) / previousRevenue._sum.amount) * 100 : 0

    const analytics = {
      overview: {
        totalUsers,
        totalTeams,
        totalMatches,
        totalTournaments,
        totalGrounds,
        totalPayments,
        totalDisputes
      },
      periodStats: {
        newUsers,
        newTeams,
        completedMatches,
        activeTournaments,
        totalRevenue: totalRevenue._sum.amount || 0,
        activeDisputes
      },
      growth: {
        userGrowth: Math.round(userGrowth * 100) / 100,
        teamGrowth: Math.round(teamGrowth * 100) / 100,
        matchGrowth: Math.round(matchGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      },
      revenue: {
        byType: revenueByType,
        total: totalRevenue._sum.amount || 0,
        commission: Math.round((totalRevenue._sum.amount || 0) * 0.1)
      },
      topPerformers: {
        teams: topTeams.map(team => ({
          ...team,
          winRate: team._count.matches > 0 ? 
            Math.round((team._count.wins / team._count.matches) * 100) / 100 : 0
        })),
        batsmen: topBatsmen.map(stat => ({
          player: stat.player,
          runs: stat.totalRuns,
          matches: stat.matches,
          average: stat.totalBalls > 0 ? 
            Math.round((stat.totalRuns / stat.totalBalls) * 100) / 100 : 0
        })),
        bowlers: topBowlers.map(stat => ({
          player: stat.player,
          wickets: stat.totalWickets,
          matches: stat.matches,
          average: stat.totalWickets > 0 ? 
            Math.round((stat.totalRuns / stat.totalWickets) * 100) / 100 : 0
        }))
      },
      popularGrounds: popularGrounds.map(ground => ({
        ...ground,
        totalBookings: ground._count.groundBookings,
        totalMatches: ground._count.matches
      })),
      disputes: {
        byCategory: Object.groupBy(disputeStats, d => d[0].category),
        byStatus: Object.groupBy(disputeStats, d => d[0].status),
        total: activeDisputes,
        resolved: totalDisputes - activeDisputes
      },
      formats: {
        byType: Object.groupBy(formatStats, d => d[0].matchFormat),
        byStatus: Object.groupBy(formatStats, d => d[0].status)
      },
      areas: areaStats.map(area => ({
        area: area[0],
        teams: area._count
      })).sort((a, b) => b.teams - a.teams).slice(0, 10),
      period
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching admin analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}