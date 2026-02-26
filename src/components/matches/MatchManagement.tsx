'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LiveScoring } from '@/components/scoring/LiveScoring'
import { 
  Calendar, 
  Plus, 
  Search, 
  MapPin, 
  Clock,
  Trophy,
  Target,
  Users,
  Gamepad2,
  Filter,
  Eye,
  IndianRupee,
  Play,
  Zap
} from 'lucide-react'

interface Match {
  id: string
  title?: string
  homeTeam: {
    id: string
    name: string
    shortName: string
    logo?: string
    area: string
    rating: number
  }
  awayTeam: {
    id: string
    name: string
    shortName: string
    logo?: string
    area: string
    rating: number
  }
  ground?: {
    id: string
    name: string
    address: string
    area: string
    hasFloodlights: boolean
  }
  scheduledDate: string
  scheduledTime: string
  matchFormat: string
  ballType: string
  oversPerInnings: number
  status: string
  entryFee: number
  prizePool: number
  platformFee: number
  winner?: {
    id: string
    name: string
    shortName: string
  }
  creator: {
    id: string
    name: string
    email: string
  }
}

interface CreateMatchData {
  title?: string
  homeTeamId: string
  awayTeamId: string
  groundId?: string
  scheduledDate: string
  scheduledTime: string
  matchFormat: string
  ballType: string
  oversPerInnings: number
  entryFee: number
}

const MATCH_FORMATS = [
  { value: 'T10', label: 'T10', overs: 10 },
  { value: 'T20', label: 'T20', overs: 20 },
  { value: 'T30', label: 'T30', overs: 30 },
  { value: 'OD50', label: 'OD50', overs: 50 },
]

const BALL_TYPES = [
  { value: 'TENNIS', label: 'Tennis Ball' },
  { value: 'LEATHER', label: 'Leather Ball' },
  { value: 'RUBBER', label: 'Rubber Ball' },
]

export function MatchManagement() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState([])
  const [grounds, setGrounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showScoringDialog, setShowScoringDialog] = useState(false)
  const [selectedMatchForScoring, setSelectedMatchForScoring] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [createMatchData, setCreateMatchData] = useState<CreateMatchData>({
    homeTeamId: '',
    awayTeamId: '',
    scheduledDate: '',
    scheduledTime: '18:00',
    matchFormat: 'T20',
    ballType: 'TENNIS',
    oversPerInnings: 20,
    entryFee: 10000,
  })

  useEffect(() => {
    fetchMatches()
    fetchTeams()
    fetchGrounds()
  }, [searchTerm, selectedFormat, selectedStatus])

  const fetchMatches = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedFormat) params.append('format', selectedFormat)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/matches?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches)
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchGrounds = async () => {
    try {
      const response = await fetch('/api/grounds')
      if (response.ok) {
        const data = await response.json()
        setGrounds(data.grounds)
      }
    } catch (error) {
      console.error('Error fetching grounds:', error)
    }
  }

  const handleCreateMatch = async () => {
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createMatchData),
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setCreateMatchData({
          homeTeamId: '',
          awayTeamId: '',
          scheduledDate: '',
          scheduledTime: '18:00',
          matchFormat: 'T20',
          ballType: 'TENNIS',
          oversPerInnings: 20,
          entryFee: 10000,
        })
        fetchMatches()
      }
    } catch (error) {
      console.error('Error creating match:', error)
    }
  }

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.homeTeam.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.awayTeam.area.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFormat = !selectedFormat || match.matchFormat === selectedFormat
    const matchesStatus = !selectedStatus || match.status === selectedStatus
    
    return matchesSearch && matchesFormat && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'LIVE': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

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
          <h2 className="text-2xl font-bold text-gray-900">Match Management</h2>
          <p className="text-gray-600">Create and manage cricket matches</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Match
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Match</DialogTitle>
              <DialogDescription>
                Set up a new cricket match between two teams
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Match Title (Optional)</Label>
                <Input
                  id="title"
                  value={createMatchData.title}
                  onChange={(e) => setCreateMatchData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Friendly Match"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={createMatchData.scheduledDate}
                  onChange={(e) => setCreateMatchData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={createMatchData.scheduledTime}
                  onChange={(e) => setCreateMatchData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="format">Match Format</Label>
                <Select 
                  value={createMatchData.matchFormat} 
                  onValueChange={(value) => {
                    const format = MATCH_FORMATS.find(f => f.value === value)
                    setCreateMatchData(prev => ({ 
                      ...prev, 
                      matchFormat: value,
                      oversPerInnings: format?.overs || 20
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_FORMATS.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label} ({format.overs} overs)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="homeTeam">Home Team</Label>
                <Select value={createMatchData.homeTeamId} onValueChange={(value) => setCreateMatchData(prev => ({ ...prev, homeTeamId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select home team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team.shortName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="awayTeam">Away Team</Label>
                <Select value={createMatchData.awayTeamId} onValueChange={(value) => setCreateMatchData(prev => ({ ...prev, awayTeamId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team.shortName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ballType">Ball Type</Label>
                <Select value={createMatchData.ballType} onValueChange={(value) => setCreateMatchData(prev => ({ ...prev, ballType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BALL_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="entryFee">Entry Fee per Team (₹)</Label>
                <Input
                  id="entryFee"
                  type="number"
                  value={createMatchData.entryFee}
                  onChange={(e) => setCreateMatchData(prev => ({ ...prev, entryFee: parseInt(e.target.value) }))}
                  min="1000"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMatch} disabled={!createMatchData.homeTeamId || !createMatchData.awayTeamId || !createMatchData.scheduledDate}>
                Create Match
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
              <Label htmlFor="search">Search Matches</Label>
              <Input
                id="search"
                placeholder="Search by teams or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="format-filter">Filter by Format</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All formats</SelectItem>
                  {MATCH_FORMATS.map(format => (
                    <SelectItem key={format.value} value={format.value}>{format.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="LIVE">Live</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="w-full justify-center py-2">
                {filteredMatches.length} matches found
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMatches.map((match) => (
          <Card key={match.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  {match.title && <h3 className="font-semibold text-gray-900 mb-2">{match.title}</h3>}
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getStatusColor(match.status)}>
                      {match.status}
                    </Badge>
                    <Badge variant="outline">{match.matchFormat}</Badge>
                    <Badge variant="outline">{match.ballType}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Prize Pool</p>
                  <p className="text-lg font-bold text-green-600">₹{match.prizePool.toLocaleString()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Teams */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">{match.homeTeam.shortName}</span>
                    </div>
                    <div>
                      <p className="font-medium">{match.homeTeam.name}</p>
                      <p className="text-sm text-gray-600">{match.homeTeam.area}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">VS</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-medium">{match.awayTeam.name}</p>
                      <p className="text-sm text-gray-600">{match.awayTeam.area}</p>
                    </div>
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-red-600">{match.awayTeam.shortName}</span>
                    </div>
                  </div>
                </div>

                {/* Match Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(match.scheduledDate)}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {match.scheduledTime}
                  </div>
                  {match.ground && (
                    <div className="flex items-center text-gray-600 col-span-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      {match.ground.name}, {match.ground.area}
                    </div>
                  )}
                </div>

                {/* Entry Fee */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Entry Fee per Team</p>
                    <p className="font-semibold">₹{match.entryFee.toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {match.status === 'SCHEDULED' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Accept Challenge
                      </Button>
                    )}
                    {match.status === 'ACCEPTED' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        Pay Entry Fee
                      </Button>
                    )}
                    {match.status === 'LIVE' && (
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => {
                          setSelectedMatchForScoring(match.id)
                          setShowScoringDialog(true)
                        }}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Live Scoring
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedFormat || selectedStatus
                ? 'Try adjusting your filters or search terms'
                : 'Get started by creating your first match'
              }
            </p>
            {!searchTerm && !selectedFormat && !selectedStatus && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Match
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Scoring Dialog */}
      <Dialog open={showScoringDialog} onOpenChange={setShowScoringDialog}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Live Scoring
            </DialogTitle>
            <DialogDescription>
              Record ball-by-ball events and manage the match in real-time
            </DialogDescription>
          </DialogHeader>
          {selectedMatchForScoring && (
            <LiveScoring matchId={selectedMatchForScoring} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}