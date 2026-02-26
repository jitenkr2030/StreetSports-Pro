'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Star, 
  Calendar,
  Trophy,
  Edit,
  Eye,
  Gamepad2,
  Shield
} from 'lucide-react'

interface Team {
  id: string
  name: string
  shortName: string
  description?: string
  area: string
  city: string
  isVerified: boolean
  rating: number
  logo?: string
  manager: {
    id: string
    name: string
    email: string
  }
  players: Array<{
    id: string
    name: string
    role: string
    jerseyNumber?: number
  }>
  _count: {
    homeMatches: number
    awayMatches: number
    players: number
  }
}

interface CreateTeamData {
  name: string
  shortName: string
  description?: string
  area: string
  city: string
  managerId: string
  logo?: string
}

const AREAS = [
  'Janakpuri', 'Tilak Nagar', 'Dwarka', 'Rohini', 'Pitampura',
  'Lajpat Nagar', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi',
  'Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad'
]

export function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
  const [createTeamData, setCreateTeamData] = useState<CreateTeamData>({
    name: '',
    shortName: '',
    description: '',
    area: '',
    city: 'Delhi',
    managerId: '1', // Mock manager ID
  })

  // Mock current user (in real app, this would come from auth)
  const currentUser = {
    id: '1',
    name: 'Admin User',
    email: 'admin@streetcricket.pro',
    role: 'ADMIN'
  }

  useEffect(() => {
    fetchTeams()
  }, [searchTerm, selectedArea, showVerifiedOnly])

  const fetchTeams = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedArea) params.append('area', selectedArea)
      if (showVerifiedOnly) params.append('verified', 'true')

      const response = await fetch(`/api/teams?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createTeamData),
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setCreateTeamData({
          name: '',
          shortName: '',
          description: '',
          area: '',
          city: 'Delhi',
          managerId: '1',
        })
        fetchTeams()
      }
    } catch (error) {
      console.error('Error creating team:', error)
    }
  }

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.area.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesArea = !selectedArea || team.area === selectedArea
    const matchesVerified = !showVerifiedOnly || team.isVerified
    
    return matchesSearch && matchesArea && matchesVerified
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
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600">Manage cricket teams and their players</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Add a new cricket team to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={createTeamData.name}
                  onChange={(e) => setCreateTeamData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <Label htmlFor="shortName">Short Name</Label>
                <Input
                  id="shortName"
                  value={createTeamData.shortName}
                  onChange={(e) => setCreateTeamData(prev => ({ ...prev, shortName: e.target.value }))}
                  placeholder="e.g., DDC, JPC"
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="area">Area</Label>
                <Select value={createTeamData.area} onValueChange={(value) => setCreateTeamData(prev => ({ ...prev, area: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map(area => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createTeamData.description}
                  onChange={(e) => setCreateTeamData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Team description (optional)"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam} disabled={!createTeamData.name || !createTeamData.shortName || !createTeamData.area}>
                  Create Team
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
            <Search className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Teams</Label>
              <Input
                id="search"
                placeholder="Search by name or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="area-filter">Filter by Area</Label>
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
            <div className="flex items-end">
              <Button
                variant={showVerifiedOnly ? "default" : "outline"}
                onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                className="w-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                Verified Only
              </Button>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="w-full justify-center py-2">
                {filteredTeams.length} teams found
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Gamepad2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <p className="text-sm text-gray-600">{team.shortName}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {team.isVerified && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Rating: {team.rating}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {team.area}, {team.city}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {team._count.players} players
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {team._count.homeMatches + team._count.awayMatches} active matches
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 mr-2" />
                  Manager: {team.manager.name}
                </div>

                {team.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="pt-3 flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedArea || showVerifiedOnly 
                ? 'Try adjusting your filters or search terms'
                : 'Get started by creating your first team'
              }
            </p>
            {!searchTerm && !selectedArea && !showVerifiedOnly && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}