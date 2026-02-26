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
import { 
  Trophy, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  MapPin,
  Users,
  Clock,
  Target,
  Gamepad2,
  Eye,
  IndianRupee,
  Play,
  Zap,
  Award,
  Star,
  Crown
} from 'lucide-react'

interface Tournament {
  id: string
  name: string
  description?: string
  format: string
  maxTeams: number
  minTeams: number
  entryFee: number
  prizePool: number
  platformFee: number
  status: string
  startDate: string
  endDate: string
  matchFormat: string
  ballType: string
  oversPerMatch: number
  creator: {
    id: string
    name: string
    email: string
  }
  ground?: {
    id: string
    name: string
    address: string
    area: string
  }
  _count: {
    teams: number
    matches: number
  }
  teams?: Array<{
    team: {
      id: string
      name: string
      shortName: string
      area: string
      isVerified: boolean
      rating: number
    }
    status: string
    registeredAt: string
  }>
  matches?: Array<{
    id: string
    title: string
    homeTeam: { id: string; name: string; shortName: string }
    awayTeam: { id: string; name: string; shortName: string }
    scheduledDate: string
    scheduledTime: string
    status: string
    winnerId?: string
    round: number
    matchNumber: number
  }>
  standings?: Array<{
    team: { id: string; name: string; shortName: string }
    played: number
    won: number
    lost: number
    tied: number
    points: number
    runsFor: number
    runsAgainst: number
    netRunRate: number
    runRate: number
  }>
}

interface CreateTournamentData {
  name: string
  description?: string
  format: string
  maxTeams: number
  minTeams: number
  entryFee: number
  startDate: string
  endDate: string
  groundId?: string
  matchFormat: string
  ballType: string
  oversPerMatch: number
}

export function TournamentManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [teams, setTeams] = useState([])
  const [grounds, setGrounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [createData, setCreateData] = useState<CreateTournamentData>({
    name: '',
    description: '',
    format: 'KNOCKOUT',
    maxTeams: 8,
    minTeams: 4,
    entryFee: 10000,
    startDate: '',
    endDate: '',
    matchFormat: 'T20',
    ballType: 'TENNIS',
    oversPerMatch: 20,
  })

  const TOURNAMENT_FORMATS = [
    { value: 'KNOCKOUT', label: 'Knockout', description: 'Single elimination tournament' },
    { value: 'LEAGUE', label: 'League', description: 'Round-robin tournament' },
    { value: 'DOUBLE_LEAGUE', label: 'Double League', description: 'Home and away round-robin' },
  ]

  const TEAM_SIZES = [
    { value: 4, label: '4 Teams' },
    { value: 6, label: '6 Teams' },
    { value: 8, label: '8 Teams' },
    { value: 10, label: '10 Teams' },
    { value: 12, label: '12 Teams' },
    { value: 14, label: '14 Teams' },
    { value: 16, label: '16 Teams' },
  ]

  useEffect(() => {
    fetchTournaments()
    fetchTeams()
    fetchGrounds()
  }, [searchTerm, selectedFormat, selectedStatus])

  const fetchTournaments = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedFormat) params.append('format', selectedFormat)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/tournaments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTournaments(data.tournaments)
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
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

  const handleCreateTournament = async () => {
    try {
      // Mock creator ID - in real app, this would come from auth context
      const mockCreatorId = '1'
      
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createData,
          createdBy: mockCreatorId,
        }),
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setCreateData({
          name: '',
          description: '',
          format: 'KNOCKOUT',
          maxTeams: 8,
          minTeams: 4,
          entryFee: 10000,
          startDate: '',
          endDate: '',
          matchFormat: 'T20',
          ballType: 'TENNIS',
          oversPerMatch: 20,
        })
        fetchTournaments()
      }
    } catch (error) {
      console.error('Error creating tournament:', error)
    }
  }

  const handleJoinTournament = async (tournamentId: string) => {
    try {
      // Mock team ID - in real app, this would come from auth context
      const mockTeamId = '1'
      
      const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          teamId: mockTeamId,
        }),
      })

      if (response.ok) {
        setShowJoinDialog(false)
        fetchTournaments()
      }
    } catch (error) {
      console.error('Error joining tournament:', error)
    }
  }

  const handleStartTournament = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/start`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchTournaments()
      }
    } catch (error) {
      console.error('Error starting tournament:', error)
    }
  }

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = 
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFormat = !selectedFormat || tournament.format === selectedFormat
    const matchesStatus = !selectedStatus || tournament.status === selectedStatus
    
    return matchesSearch && matchesFormat && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-100 text-blue-800'
      case 'REGISTRATION': return 'bg-purple-100 text-purple-800'
      case 'ONGOING': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'KNOCKOUT': return 'bg-red-100 text-red-800'
      case 'LEAGUE': return 'bg-blue-100 text-blue-800'
      case 'DOUBLE_LEAGUE': return 'bg-purple-100 text-purple-800'
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

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'KNOCKOUT': return <Target className="w-4 h-4" />
      case 'LEAGUE': return <Trophy className="w-4 h-4" />
      case 'DOUBLE_LEAGUE': return <Award className="w-4 h-4" />
      default: return <Trophy className="w-4 h-4" />
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Tournament Mode</h2>
          <p className="text-gray-600">Organize and participate in cricket tournaments</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
              <DialogDescription>
                Set up a new cricket tournament with multiple teams
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tournament Name</Label>
                  <Input
                    id="name"
                    value={createData.name}
                    onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Summer Championship 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="format">Tournament Format</Label>
                  <Select value={createData.format} onValueChange={(value) => setCreateData(prev => ({ ...prev, format: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_FORMATS.map(format => (
                        <SelectItem key={format.value} value={format.value}>
                          <div className="flex items-center gap-2">
                            {getFormatIcon(format.value)}
                            <div>
                              <div className="font-medium">{format.label}</div>
                              <div className="text-xs text-gray-500">{format.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxTeams">Maximum Teams</Label>
                  <Select value={createData.maxTeams.toString()} onValueChange={(value) => setCreateData(prev => ({ ...prev, maxTeams: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZES.map(size => (
                        <SelectItem key={size.value} value={size.value.toString()}>{size.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entryFee">Entry Fee per Team (₹)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    value={createData.entryFee}
                    onChange={(e) => setCreateData(prev => ({ ...prev, entryFee: parseInt(e.target.value) }))}
                    min="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={createData.startDate}
                    onChange={(e) => setCreateData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={createData.endDate}
                    onChange={(e) => setCreateData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  value={createData.description}
                  onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your tournament..."
                  className="w-full h-20 p-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="matchFormat">Match Format</Label>
                  <Select value={createData.matchFormat} onValueChange={(value) => setCreateData(prev => ({ ...prev, matchFormat: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T10">T10</SelectItem>
                      <SelectItem value="T20">T20</SelectItem>
                      <SelectItem value="T30">T30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ballType">Ball Type</Label>
                  <Select value={createData.ballType} onValueChange={(value) => setCreateData(prev => ({ ...prev, ballType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TENNIS">Tennis Ball</SelectItem>
                      <SelectItem value="LEATHER">Leather Ball</SelectItem>
                      <SelectItem value="RUBBER">Rubber Ball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="oversPerMatch">Overs per Match</Label>
                  <Input
                    id="oversPerMatch"
                    type="number"
                    value={createData.oversPerMatch}
                    onChange={(e) => setCreateData(prev => ({ ...prev, oversPerMatch: parseInt(e.target.value) }))}
                    min="5"
                    max="50"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTournament} disabled={!createData.name || !createData.startDate || !createData.endDate}>
                  Create Tournament
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filter Tournaments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Tournaments</Label>
              <Input
                id="search"
                placeholder="Search by name or description..."
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
                  {TOURNAMENT_FORMATS.map(format => (
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
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="REGISTRATION">Registration</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="w-full justify-center py-2">
                {filteredTournaments.length} tournaments found
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getFormatColor(tournament.format)}>
                      {getFormatIcon(tournament.format)}
                      <span className="ml-1">{tournament.format}</span>
                    </Badge>
                    <Badge className={getStatusColor(tournament.status)}>
                      {tournament.status}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                  {tournament.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{tournament.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Prize Pool</div>
                  <div className="text-lg font-bold text-green-600">
                    ₹{tournament.prizePool.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Teams</p>
                    <p className="font-medium">{tournament._count.teams}/{tournament.maxTeams}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Entry Fee</p>
                    <p className="font-medium">₹{tournament.entryFee.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Format</p>
                    <p className="font-medium">{tournament.matchFormat}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-medium">
                      {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                    </p>
                  </div>
                </div>

                {tournament.ground && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {tournament.ground.name}, {tournament.ground.area}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-gray-600">
                    <p>Created by {tournament.creator.name}</p>
                    <p>{tournament._count.matches} matches scheduled</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedTournament(tournament)
                        setShowViewDialog(true)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {tournament.status === 'UPCOMING' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedTournament(tournament)
                          setShowJoinDialog(true)
                        }}
                      >
                        Join
                      </Button>
                    )}
                    {tournament.status === 'REGISTRATION' && tournament._count.teams >= tournament.minTeams && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleStartTournament(tournament.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {tournament.status === 'ONGOING' && (
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        <Zap className="w-4 h-4 mr-1" />
                        Live
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTournaments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedFormat || selectedStatus
                ? 'Try adjusting your filters or search terms'
                : 'Get started by creating your first tournament'
              }
            </p>
            {!searchTerm && !selectedFormat && !selectedStatus && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Join Tournament Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Tournament</DialogTitle>
            <DialogDescription>
              Register your team for this tournament
            </DialogDescription>
          </DialogHeader>
          {selectedTournament && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{selectedTournament.name}</CardTitle>
                  <p className="text-sm text-gray-600">{selectedTournament.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Entry Fee</p>
                      <p className="font-semibold text-green-600">
                        ₹{selectedTournament.entryFee.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Prize Pool</p>
                      <p className="font-semibold text-yellow-600">
                        ₹{selectedTournament.prizePool.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleJoinTournament(selectedTournament.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Join Tournament
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Tournament Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {selectedTournament?.name}
            </DialogTitle>
            <DialogDescription>
              Tournament details and standings
            </DialogDescription>
          </DialogHeader>
          {selectedTournament && (
            <div className="space-y-6">
              {/* Tournament Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Format</p>
                      <p className="font-medium">{selectedTournament.format}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teams</p>
                      <p className="font-medium">{selectedTournament._count.teams}/{selectedTournament.maxTeams}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Entry Fee</p>
                      <p className="font-medium">₹{selectedTournament.entryFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prize Pool</p>
                      <p className="font-medium text-green-600">₹{selectedTournament.prizePool.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Teams */}
              {selectedTournament.teams && selectedTournament.teams.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Registered Teams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedTournament.teams.map((tournamentTeam) => (
                        <div key={tournamentTeam.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">
                                {tournamentTeam.team.shortName}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{tournamentTeam.team.name}</p>
                              <p className="text-sm text-gray-600">{tournamentTeam.team.area}</p>
                            </div>
                          </div>
                          <Badge className={tournamentTeam.team.isVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {tournamentTeam.team.isVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Standings */}
              {selectedTournament.standings && selectedTournament.standings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Standings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">#</th>
                            <th className="text-left p-2">Team</th>
                            <th className="text-center p-2">P</th>
                            <th className="text-center p-2">W</th>
                            <th className="text-center p-2">L</th>
                            <th className="text-center p-2">D</th>
                            <th className="text-center p-2">RR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTournament.standings.map((standing, index) => (
                            <tr key={standing.team.id} className="border-b">
                              <td className="p-2">{index + 1}</td>
                              <td className="p-2">
                                <div>
                                  <p className="font-medium">{standing.team.name}</p>
                                  <p className="text-sm text-gray-600">{standing.team.shortName}</p>
                                </div>
                              </td>
                              <td className="text-center p-2">{standing.points}</td>
                              <td className="text-center p-2">{standing.won}</td>
                              <td className="text-center p-2">{standing.lost}</td>
                              <td className="text-center p-2">{standing.tied}</td>
                              <td className="text-center p-2">{standing.runRate.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}