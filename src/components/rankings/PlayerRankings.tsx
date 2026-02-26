'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  TrendingUp, 
  Users, 
  Target, 
  Shield, 
  Award,
  Search,
  Filter,
  MapPin,
  Calendar,
  ChevronUp,
  ChevronDown,
  Eye,
  Gamepad2
} from 'lucide-react'

interface PlayerRanking {
  rank: number
  type: 'batting' | 'bowling'
  player: {
    id: string
    name: string
    role: string
    jerseyNumber?: number
    team: {
      id: string
      name: string
      shortName: string
      area: string
      isVerified: boolean
    }
  }
  stats: {
    matches: number
    totalRuns?: number
    totalBalls?: number
    average?: string
    strikeRate?: string
    highestScore?: number
    centuries?: number
    halfCenturies?: number
    totalWickets?: number
    economy?: string
    bestFigures?: string
    fiveWickets?: number
  }
}

interface TeamRanking {
  rank: number
  team: {
    id: string
    name: string
    shortName: string
    area: string
    isVerified: boolean
  }
  stats: {
    totalMatches: number
    wins: number
    losses: number
    winRate: string
    rating: number
    isVerified: boolean
  }
}

export function PlayerRankings() {
  const [playerRankings, setPlayerRankings] = useState<PlayerRanking[]>([])
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [period, setPeriod] = useState('all-time')

  const AREAS = [
    'Janakpuri', 'Tilak Nagar', 'Dwarka', 'Rohini', 'Pitampura',
    'Lajpat Nagar', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi',
    'Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad'
  ]

  const PERIODS = [
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'yearly', label: 'This Year' },
    { value: 'all-time', label: 'All Time' },
  ]

  useEffect(() => {
    fetchPlayerRankings()
    fetchTeamRankings()
  }, [searchTerm, selectedArea, selectedType, period])

  const fetchPlayerRankings = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType !== 'all') params.append('type', selectedType)
      if (selectedArea) params.append('area', selectedArea)
      params.append('limit', '20')

      const response = await fetch(`/api/rankings/players?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPlayerRankings(data.rankings)
      }
    } catch (error) {
      console.error('Error fetching player rankings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamRankings = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedArea) params.append('area', selectedArea)
      params.append('limit', '20')

      const response = await fetch(`/api/rankings/teams?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTeamRankings(data.rankings)
      }
    } catch (error) {
      console.error('Error fetching team rankings:', error)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />
    return <Trophy className="w-5 h-5 text-gray-300" />
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300'
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300'
    return 'bg-gray-50 text-gray-600 border-gray-200'
  }

  const filteredPlayerRankings = playerRankings.filter(ranking => {
    const matchesSearch = 
      ranking.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ranking.player.team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ranking.player.team.area.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesArea = !selectedArea || ranking.player.team.area === selectedArea
    
    return matchesSearch && matchesArea
  })

  const filteredTeamRankings = teamRankings.filter(ranking => {
    const matchesSearch = 
      ranking.team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ranking.team.area.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesArea = !selectedArea || ranking.team.area === selectedArea
    
    return matchesSearch && matchesArea
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rankings & Awards</h2>
          <p className="text-gray-600">Player and team performance rankings</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="area">Filter by Area</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="All areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All areas</SelectItem>
                  {AREAS.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="period">Time Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="w-full justify-center py-2">
                {filteredPlayerRankings.length + filteredTeamRankings.length} rankings
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rankings Tabs */}
      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="players">Player Rankings</TabsTrigger>
          <TabsTrigger value="teams">Team Rankings</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-6">
          {/* Player Type Filter */}
          <div className="flex justify-center">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Players</SelectItem>
                <SelectItem value="batting">Batting Rankings</SelectItem>
                <SelectItem value="bowling">Bowling Rankings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Player Rankings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPlayerRankings.map((ranking) => (
              <Card key={`${ranking.type}-${ranking.player.id}`} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${getRankBadge(ranking.rank)}`}>
                        <span className="text-lg font-bold">#{ranking.rank}</span>
                      </div>
                      {getRankIcon(ranking.rank)}
                    </div>
                    <Badge className={ranking.type === 'batting' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                      {ranking.type === 'batting' ? 'Batting' : 'Bowling'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {/* Player Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">
                          {ranking.player.jerseyNumber || '#'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{ranking.player.name}</h3>
                        <p className="text-sm text-gray-600">
                          {ranking.player.role} • {ranking.player.team.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{ranking.player.team.area}</span>
                          {ranking.player.team.isVerified && (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {ranking.type === 'batting' ? (
                        <>
                          <div>
                            <p className="text-gray-600">Runs</p>
                            <p className="font-semibold text-lg text-blue-600">
                              {ranking.stats.totalRuns}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Average</p>
                            <p className="font-semibold">{ranking.stats.average}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Strike Rate</p>
                            <p className="font-semibold">{ranking.stats.strikeRate}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Matches</p>
                            <p className="font-semibold">{ranking.stats.matches}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-gray-600">Wickets</p>
                            <p className="font-semibold text-lg text-green-600">
                              {ranking.stats.totalWickets}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Average</p>
                            <p className="font-semibold">{ranking.stats.average}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Economy</p>
                            <p className="font-semibold">{ranking.stats.economy}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Matches</p>
                            <p className="font-semibold">{ranking.stats.matches}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Additional Stats */}
                    {ranking.type === 'batting' && (
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex space-x-4 text-xs text-gray-600">
                          <span>HS: {ranking.stats.highestScore || 0}</span>
                          <span>50s: {ranking.stats.halfCenturies || 0}</span>
                          <span>100s: {ranking.stats.centuries || 0}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {ranking.type === 'bowling' && (
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex space-x-4 text-xs text-gray-600">
                          <span>Best: {ranking.stats.bestFigures}</span>
                          <span>5W: {ranking.stats.fiveWickets || 0}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          {/* Team Rankings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTeamRankings.map((ranking) => (
              <Card key={ranking.team.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${getRankBadge(ranking.rank)}`}>
                        <span className="text-lg font-bold">#{ranking.rank}</span>
                      </div>
                      {getRankIcon(ranking.rank)}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-semibold">{ranking.stats.rating}</span>
                      </div>
                      {ranking.stats.isVerified && (
                        <Badge className="text-xs bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Team Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{ranking.team.name}</h3>
                      <p className="text-sm text-gray-600">{ranking.team.area}</p>
                      <p className="text-xs text-gray-500">Short: {ranking.team.shortName}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Matches</p>
                        <p className="font-semibold">{ranking.stats.totalMatches}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Wins</p>
                        <p className="font-semibold text-green-600">{ranking.stats.wins}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Losses</p>
                        <p className="font-semibold text-red-600">{ranking.stats.losses}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Win Rate</p>
                        <p className="font-semibold text-blue-600">{ranking.stats.winRate}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Win Rate</span>
                        <span>{ranking.stats.winRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${ranking.stats.winRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredPlayerRankings.length === 0 && filteredTeamRankings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedArea
                ? 'Try adjusting your filters or search terms'
                : 'Rankings will appear once matches are played'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}