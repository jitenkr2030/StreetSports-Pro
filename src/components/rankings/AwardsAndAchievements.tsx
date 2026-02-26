'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  Award,
  Calendar,
  Users,
  Target,
  Shield,
  Gamepad2,
  TrendingUp
} from 'lucide-react'

interface Award {
  type: 'player' | 'team' | 'tournament'
  category: string
  period: string
  data: any
}

export function AwardsAndAchievements() {
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all-time')

  const PERIODS = [
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'yearly', label: 'This Year' },
    { value: 'all-time', label: 'All Time' },
  ]

  const TYPES = [
    { value: '', label: 'All Categories' },
    { value: 'player', label: 'Player Awards' },
    { value: 'team', label: 'Team Awards' },
    { value: 'tournament', label: 'Tournament Awards' },
  ]

  useEffect(() => {
    fetchAwards()
  }, [selectedType, selectedPeriod])

  const fetchAwards = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType) params.append('type', selectedType)
      if (selectedPeriod) params.append('period', selectedPeriod)

      const response = await fetch(`/api/awards?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAwards(data.awards)
      }
    } catch (error) {
      console.error('Error fetching awards:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAwardIcon = (category: string) => {
    switch (category) {
      case 'Orange Cap':
        return <Trophy className="w-6 h-6 text-orange-500" />
      case 'Purple Cap':
        return <Trophy className="w-6 h-6 text-purple-500" />
      case 'Man of the Match':
        return <Star className="w-6 h-6 text-yellow-500" />
      case 'Most Sixes':
        return <Target className="w-6 h-6 text-blue-500" />
      case 'Best Bowling':
        return <Shield className="w-6 h-6 text-green-500" />
      case 'Best Team':
        return <Crown className="w-6 h-6 text-yellow-600" />
      case 'Most Wins':
        return <TrendingUp className="w-6 h-6 text-blue-600" />
      case 'Tournament Winner':
        return <Award className="w-6 h-6 text-purple-600" />
      case 'Player of Tournament':
        return <Star className="w-6 h-6 text-orange-600" />
      default:
        return <Medal className="w-6 h-6 text-gray-500" />
    }
  }

  const getAwardColor = (category: string) => {
    switch (category) {
      case 'Orange Cap':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'Purple Cap':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Man of the Match':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Most Sixes':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Best Bowling':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Best Team':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Most Wins':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Tournament Winner':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Player of Tournament':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const renderPlayerAward = (award: Award) => {
    const { player, stats } = award.data
    
    return (
      <Card key={`${award.category}-${award.period}`} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${getAwardColor(award.category)}`}>
                {getAwardIcon(award.category)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{award.category}</h3>
                <p className="text-sm text-gray-600 capitalize">{award.period}</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              Player
            </Badge>
          </div>

          {player && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">
                    {player.jerseyNumber || '#'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-sm text-gray-600">
                    {player.role} • {player.team.name}
                  </p>
                  <p className="text-xs text-gray-500">{player.team.area}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {award.category === 'Orange Cap' && (
                  <>
                    <div>
                      <p className="text-gray-600">Runs</p>
                      <p className="font-semibold text-lg text-orange-600">{stats.runs}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Average</p>
                      <p className="font-semibold">{stats.average}</p>
                    </div>
                  </>
                )}
                {award.category === 'Purple Cap' && (
                  <>
                    <div>
                      <p className="text-gray-600">Wickets</p>
                      <p className="font-semibold text-lg text-purple-600">{stats.wickets}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Economy</p>
                      <p className="font-semibold">{stats.economy}</p>
                    </div>
                  </>
                )}
                {award.category === 'Man of the Match' && (
                  <>
                    <div>
                      <p className="text-gray-600">Runs</p>
                      <p className="font-semibold text-lg text-yellow-600">{stats.runs}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Wickets</p>
                      <p className="font-semibold text-lg text-yellow-600">{stats.wickets}</p>
                    </div>
                  </>
                )}
                {award.category === 'Most Sixes' && (
                  <>
                    <div>
                      <p className="text-gray-600">Runs</p>
                      <p className="font-semibold text-lg text-blue-600">{stats.runs}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Sixes</p>
                      <p className="font-semibold">{stats.estimatedSixes}</p>
                    </div>
                  </>
                )}
                {award.category === 'Best Bowling' && (
                  <>
                    <div>
                      <p className="text-gray-600">Wickets</p>
                      <p className="font-semibold text-lg text-green-600">{stats.wickets}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Economy</p>
                      <p className="font-semibold">{stats.economy}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderTeamAward = (award: Award) => {
    const { team, stats } = award.data
    
    return (
      <Card key={`${award.category}-${award.period}`} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${getAwardColor(award.category)}`}>
                {getAwardIcon(award.category)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{award.category}</h3>
                <p className="text-sm text-gray-600 capitalize">{award.period}</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Team
            </Badge>
          </div>

          {team && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{team.name}</h3>
                <p className="text-sm text-gray-600">{team.area}</p>
                <p className="text-xs text-gray-500">Short: {team.shortName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {award.category === 'Best Team' && (
                  <>
                    <div>
                      <p className="text-gray-600">Rating</p>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-semibold">{stats.rating}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600">Matches</p>
                      <p className="font-semibold">{stats.matches}</p>
                    </div>
                  </>
                )}
                {award.category === 'Most Wins' && (
                  <>
                    <div>
                      <p className="text-gray-600">Wins</p>
                      <p className="font-semibold text-lg text-blue-600">{stats.wins}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Win Rate</p>
                      <p className="font-semibold">{stats.winRate}%</p>
                    </div>
                  </>
                )}
                {award.category === 'Highest Score' && (
                  <>
                    <div>
                      <p className="text-gray-600">Total Runs</p>
                      <p className="font-semibold text-lg text-orange-600">{stats.totalRuns}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg/Player</p>
                      <p className="font-semibold">{stats.averagePerPlayer}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderTournamentAward = (award: Award) => {
    const { tournament, winnerTeam, playerOfTournament } = award.data
    
    return (
      <Card key={`${award.category}-${award.period}`} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${getAwardColor(award.category)}`}>
                {getAwardIcon(award.category)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{award.category}</h3>
                <p className="text-sm text-gray-600 capitalize">{award.period}</p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-800">
              Tournament
            </Badge>
          </div>

          {tournament && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{tournament.name}</h3>
                <p className="text-sm text-gray-600">Format: {tournament.format}</p>
              </div>

              {award.category === 'Tournament Winner' && winnerTeam && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Winning Team:</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">
                        {winnerTeam.shortName}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{winnerTeam.name}</p>
                      <p className="text-xs text-gray-600">{winnerTeam.area}</p>
                    </div>
                  </div>
                </div>
              )}

              {award.category === 'Player of Tournament' && playerOfTournament && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Player of Tournament:</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-green-600">
                        {playerOfTournament.jerseyNumber || '#'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{playerOfTournament.name}</p>
                      <p className="text-xs text-gray-600">
                        {playerOfTournament.role} • {playerOfTournament.team.name}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div>
                      <p className="text-gray-600">Runs</p>
                      <p className="font-semibold">{playerOfTournament.runs}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Wickets</p>
                      <p className="font-semibold">{playerOfTournament.wickets}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                <div>
                  <p className="text-gray-600">Prize Pool</p>
                  <p className="font-semibold text-green-600">₹{tournament.prizePool.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Teams</p>
                  <p className="font-semibold">{tournament.teams}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const filteredAwards = selectedType 
    ? awards.filter(award => award.type === selectedType)
    : awards

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Awards & Achievements</h2>
          <p className="text-gray-600">Celebrate outstanding performances and achievements</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Filter Awards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Award Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="period">Time Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map(period => (
                    <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Awards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAwards.map((award) => {
          if (award.type === 'player') return renderPlayerAward(award)
          if (award.type === 'team') return renderTeamAward(award)
          if (award.type === 'tournament') return renderTournamentAward(award)
          return null
        })}
      </div>

      {/* Empty State */}
      {filteredAwards.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No awards found</h3>
            <p className="text-gray-600">
              Awards will appear once matches and tournaments are completed
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}