'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Trophy, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Target,
  Shield,
  Eye,
  Download,
  RefreshCw,
  Activity,
  PieChart,
  MapPin,
  Gamepad2,
  Crown,
  Medal,
  Star
} from 'lucide-react'

interface Analytics {
  overview: {
    totalUsers: number
    totalTeams: number
    totalMatches: number
    totalTournaments: number
    totalGrounds: number
    totalPayments: number
    totalDisputes: number
  }
  periodStats: {
    newUsers: number
    newTeams: number
    completedMatches: number
    activeTournaments: number
    totalRevenue: number
    activeDisputes: number
  }
  growth: {
    userGrowth: number
    teamGrowth: number
    matchGrowth: number
    revenueGrowth: number
  }
  revenue: {
    byType: any[]
    total: number
    commission: number
  }
  topPerformers: {
    teams: any[]
    batsmen: any[]
    bowlers: any[]
  }
  popularGrounds: any[]
  disputes: {
    byCategory: Record<string, any[]>
    byStatus: Record<string, any[]>
    total: number
    resolved: number
  }
  formats: {
    byType: Record<string, any[]>
    byStatus: Record<string, any[]>
  }
  areas: Array<{
    area: string
    teams: number
  }>
  period: string
}

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const PERIODS = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ]

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatCurrency = (num: number) => {
    return '₹' + formatNumber(num)
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Failed to load analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600">Platform analytics and business insights</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Last Refresh */}
      <div className="text-xs text-gray-500 text-right">
        Last updated: {lastRefresh.toLocaleString()}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.overview.totalUsers)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(analytics.growth.userGrowth)}
              <span className={getGrowthColor(analytics.growth.userGrowth)}>
                {analytics.growth.userGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.overview.totalTeams)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(analytics.growth.teamGrowth)}
              <span className={getGrowthColor(analytics.growth.teamGrowth)}>
                {analytics.growth.teamGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.revenue.total)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(analytics.growth.revenueGrowth)}
              <span className={getGrowthColor(analytics.growth.revenueGrowth)}>
                {analytics.growth.revenueGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.disputes.total}</div>
            <div className="text-xs text-muted-foreground">
              {analytics.disputes.resolved} resolved this period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.periodStats.newUsers)}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Matches</CardTitle>
            <Gamepad2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.periodStats.completedMatches)}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.periodStats.activeTournaments}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.revenue.commission)}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performers">Top Performers</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.revenue.byType.map((revenue: any, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium capitalize">
                          {revenue[0].replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(revenue._sum.amount)}</p>
                        <p className="text-xs text-gray-500">{revenue._count} transactions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="font-semibold text-lg">{formatCurrency(analytics.revenue.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Platform Commission (10%)</span>
                    <span className="font-semibold text-green-600">{formatCurrency(analytics.revenue.commission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payouts</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(analytics.revenue.total - analytics.revenue.commission)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Top Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topPerformers.teams.map((team, index) => (
                    <div key={team.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {team.shortName}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{team.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>Win Rate: {team.winRate}%</span>
                          <span>•</span>
                          <span>Rating: {team.rating}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={index === 0 ? "bg-yellow-100 text-yellow-800" : index === 1 ? "bg-gray-100 text-gray-800" : index === 2 ? "bg-orange-100 text-orange-800" : "bg-gray-50 text-gray-600"}>
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Batsmen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Top Batsmen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topPerformers.batsmen.map((batsman, index) => (
                    <div key={batsman.player.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">
                          {batsman.player.jerseyNumber || '#'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{batsman.player.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>Runs: {batsman.runs}</span>
                          <span>•</span>
                          <span>Avg: {batsman.average}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={index === 0 ? "bg-yellow-100 text-yellow-800" : index === 1 ? "bg-gray-100 text-gray-800" : index === 2 ? "bg-orange-100 text-orange-800" : "bg-gray-50 text-gray-600"}>
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Bowlers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  Top Bowlers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topPerformers.bowlers.map((bowler, index) => (
                    <div key={bowler.player.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-red-600">
                          {bowler.player.jerseyNumber || '#'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{bowler.player.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>Wickets: {bowler.wickets}</span>
                          <span>•</span>
                          <span>Avg: {bowler.average}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={index === 0 ? "bg-yellow-100 text-yellow-800" : index === 1 ? "bg-gray-100 text-gray-800" : index === 2 ? "bg-orange-100 text-orange-800" : "bg-gray-50 text-gray-600"}>
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Grounds */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-500" />
                Popular Grounds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.popularGrounds.map((ground, index) => (
                  <div key={ground.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{ground.name}</h4>
                      <Badge className="bg-green-100 text-green-800">
                        #{index + 1}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ground.address}</p>
                    <div className="flex justify-between text-xs">
                      <span>Bookings: {ground.totalBookings}</span>
                      <span>Matches: {ground.totalMatches}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Disputes by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Disputes by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.disputes.byCategory).map(([category, disputes]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {category.replace('_', ' ')}
                      </span>
                      <Badge variant="outline">
                        {disputes.reduce((sum, d) => sum + d._count, 0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Disputes by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Disputes by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.disputes.byStatus).map(([status, disputes]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {status.replace('_', ' ')}
                      </span>
                      <Badge variant="outline">
                        {disputes.reduce((sum, d) => sum + d._count, 0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dispute Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dispute Resolution Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{analytics.disputes.total}</p>
                  <p className="text-sm text-gray-600">Active Disputes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{analytics.disputes.resolved}</p>
                  <p className="text-sm text-gray-600">Resolved This Period</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.disputes.total > 0 ? 
                      Math.round((analytics.disputes.resolved / (analytics.disputes.total + analytics.disputes.resolved)) * 100) : 0
                    }%
                  </p>
                  <p className="text-sm text-gray-600">Resolution Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Match Formats */}
            <Card>
              <CardHeader>
                <CardTitle>Match Format Popularity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.formats.byType).map(([format, matches]) => (
                    <div key={format} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{format}</span>
                      <Badge variant="outline">
                        {matches.reduce((sum, m) => sum + m._count, 0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-500" />
                  Top Areas by Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.areas.map((area, index) => (
                    <div key={area.area} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{area.area}</span>
                      <Badge variant="outline">
                        {area.teams} teams
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}