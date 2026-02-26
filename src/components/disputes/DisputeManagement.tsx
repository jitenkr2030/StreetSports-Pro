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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  Scale, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Plus, 
  Send,
  FileText,
  Users,
  Calendar,
  MapPin,
  Gavel,
  Flag,
  TrendingUp,
  Shield,
  Search,
  Filter
} from 'lucide-react'

interface Dispute {
  id: string
  match: {
    id: string
    title: string
    scheduledDate: string
    scheduledTime: string
    status: string
    homeTeam: { id: string; name: string; shortName: string; area: string }
    awayTeam: { id: string; name: string; shortName: string; area: string }
    ground?: { id: string; name: string; address: string; area: string }
  }
  raisedByTeam: {
    id: string
    name: string
    shortName: string
    area: string
    manager?: { id: string; name: string; email: string; phone: string }
  }
  againstTeam: {
    id: string
    name: string
    shortName: string
    area: string
    manager?: { id: string; name: string; email: string; phone: string }
  }
  category: string
  title: string
  description: string
  evidence: string[]
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  messages?: Array<{
    id: string
    senderId: string
    senderType: string
    message: string
    isPrivate: boolean
    createdAt: string
    sender: {
      id: string
      name: string
      email: string
    }
  }>
  resolution?: {
    id: string
    resolution: string
    adminNotes: string
    resolvedBy: { id: string; name: string; email: string }
    resolvedAt: string
  }
}

interface CreateDisputeData {
  matchId: string
  againstTeamId: string
  category: string
  title: string
  description: string
  evidence: string[]
  priority: string
}

export function DisputeManagement() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [message, setMessage] = useState('')
  const [createData, setCreateData] = useState<CreateDisputeData>({
    matchId: '',
    againstTeamId: '',
    category: 'SCORE_ERROR',
    title: '',
    description: '',
    evidence: [],
    priority: 'MEDIUM',
  })

  const DISPUTE_CATEGORIES = [
    { value: 'SCORE_ERROR', label: 'Score Error', icon: <FileText className="w-4 h-4" /> },
    { value: 'RULE_VIOLATION', label: 'Rule Violation', icon: <Gavel className="w-4 h-4" /> },
    { value: 'CONDUCT', label: 'Player Conduct', icon: <Users className="w-4 h-4" /> },
    { value: 'GROUND_ISSUE', label: 'Ground Issue', icon: <MapPin className="w-4 h-4" /> },
    { value: 'PAYMENT', label: 'Payment Issue', icon: <AlertTriangle className="w-4 h-4" /> },
    { value: 'OTHER', label: 'Other', icon: <Flag className="w-4 h-4" /> },
  ]

  const PRIORITIES = [
    { value: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ]

  const STATUSES = [
    { value: 'OPEN', label: 'Open', color: 'bg-blue-100 text-blue-800' },
    { value: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800' },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'CLOSED', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
  ]

  useEffect(() => {
    fetchDisputes()
    fetchMatches()
    fetchTeams()
  }, [searchTerm, selectedStatus, selectedCategory, selectedPriority])

  const fetchDisputes = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedPriority) params.append('priority', selectedPriority)

      const response = await fetch(`/api/disputes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDisputes(data.disputes)
      }
    } catch (error) {
      console.error('Error fetching disputes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches')
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches)
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
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

  const handleCreateDispute = async () => {
    try {
      // Mock team ID - in real app, this would come from auth context
      const mockTeamId = '1'
      
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createData,
          raisedByTeamId: mockTeamId,
        }),
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setCreateData({
          matchId: '',
          againstTeamId: '',
          category: 'SCORE_ERROR',
          title: '',
          description: '',
          evidence: [],
          priority: 'MEDIUM',
        })
        fetchDisputes()
      }
    } catch (error) {
      console.error('Error creating dispute:', error)
    }
  }

  const handleSendMessage = async (disputeId: string) => {
    if (!message.trim()) return

    try {
      // Mock user ID and type - in real app, this would come from auth context
      const mockSenderId = '1'
      const mockSenderType = 'TEAM'
      
      const response = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: mockSenderId,
          senderType: mockSenderType,
          message: message.trim(),
          isPrivate: false,
        }),
      })

      if (response.ok) {
        setMessage('')
        if (selectedDispute && selectedDispute.id === disputeId) {
          // Refresh the selected dispute to show new message
          const updatedResponse = await fetch(`/api/disputes/${disputeId}`)
          if (updatedResponse.ok) {
            const updatedData = await updatedResponse.json()
            setSelectedDispute(updatedData)
          }
        }
        fetchDisputes()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleEscalateDispute = async (disputeId: string) => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Escalated by user',
          newPriority: 'HIGH'
        }),
      })

      if (response.ok) {
        fetchDisputes()
      }
    } catch (error) {
      console.error('Error escalating dispute:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    const categoryData = DISPUTE_CATEGORIES.find(c => c.value === category)
    return categoryData?.icon || <Flag className="w-4 h-4" />
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SCORE_ERROR': return 'bg-blue-100 text-blue-800'
      case 'RULE_VIOLATION': return 'bg-red-100 text-red-800'
      case 'CONDUCT': return 'bg-orange-100 text-orange-800'
      case 'GROUND_ISSUE': return 'bg-green-100 text-green-800'
      case 'PAYMENT': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    const priorityData = PRIORITIES.find(p => p.value === priority)
    return priorityData?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const statusData = STATUSES.find(s => s.value === status)
    return statusData?.color || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = 
      dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.raisedByTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.againstTeam.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !selectedStatus || dispute.status === selectedStatus
    const matchesCategory = !selectedCategory || dispute.category === selectedCategory
    const matchesPriority = !selectedPriority || dispute.priority === selectedPriority
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority
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
          <h2 className="text-2xl font-bold text-gray-900">Dispute Management</h2>
          <p className="text-gray-600">Handle disputes and ensure fair play</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Raise Dispute
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Raise a Dispute
              </DialogTitle>
              <DialogDescription>
                Report an issue or violation for review by our admin team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="match">Match</Label>
                  <Select value={createData.matchId} onValueChange={(value) => setCreateData(prev => ({ ...prev, matchId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select match" />
                    </SelectTrigger>
                    <SelectContent>
                      {matches.map((match: any) => (
                        <SelectItem key={match.id} value={match.id}>
                          {match.homeTeam.shortName} vs {match.awayTeam.shortName} - {new Date(match.scheduledDate).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="against-team">Against Team</Label>
                  <Select value={createData.againstTeamId} onValueChange={(value) => setCreateData(prev => ({ ...prev, againstTeamId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select opposing team" />
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
                  <Label htmlFor="category">Category</Label>
                  <Select value={createData.category} onValueChange={(value) => setCreateData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPUTE_CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            {category.icon}
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={createData.priority} onValueChange={(value) => setCreateData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={createData.title}
                  onChange={(e) => setCreateData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createData.description}
                  onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the dispute..."
                  className="h-24"
                />
              </div>

              <div>
                <Label htmlFor="evidence">Evidence (Optional)</Label>
                <Input
                  id="evidence"
                  placeholder="Enter evidence URLs or references (comma separated)"
                  value={createData.evidence.join(', ')}
                  onChange={(e) => setCreateData(prev => ({ 
                    ...prev, 
                    evidence: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateDispute}
                  disabled={!createData.matchId || !createData.againstTeamId || !createData.title || !createData.description}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Raise Dispute
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
            Search & Filter Disputes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search Disputes</Label>
              <Input
                id="search"
                placeholder="Search by title, teams, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category-filter">Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {DISPUTE_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority-filter">Filter by Priority</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  {PRIORITIES.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="w-full justify-center py-2">
                {filteredDisputes.length} disputes found
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disputes List */}
      <div className="space-y-4">
        {filteredDisputes.map((dispute) => (
          <Card key={dispute.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge className={getCategoryColor(dispute.category)}>
                      {getCategoryIcon(dispute.category)}
                      <span className="ml-1">{dispute.category.replace('_', ' ')}</span>
                    </Badge>
                    <Badge className={getPriorityColor(dispute.priority)}>
                      {dispute.priority}
                    </Badge>
                    <Badge className={getStatusColor(dispute.status)}>
                      {dispute.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{dispute.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{dispute.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Raised</p>
                  <p className="text-sm font-medium">{formatDate(dispute.createdAt)}</p>
                </div>
              </div>

              {/* Match Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{dispute.match.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{dispute.match.ground?.name || 'TBD'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {dispute.match.homeTeam.shortName}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">vs</span>
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-red-600">
                          {dispute.match.awayTeam.shortName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(dispute.match.scheduledDate).toLocaleDateString('en-IN')} at {dispute.match.scheduledTime}
                  </div>
                </div>
              </div>

              {/* Teams Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Raised By</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-green-600">
                        {dispute.raisedByTeam.shortName}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{dispute.raisedByTeam.name}</p>
                      <p className="text-xs text-gray-500">{dispute.raisedByTeam.area}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Against</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-red-600">
                        {dispute.againstTeam.shortName}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{dispute.againstTeam.name}</p>
                      <p className="text-xs text-gray-500">{dispute.againstTeam.area}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence */}
              {dispute.evidence.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Evidence</p>
                  <div className="flex flex-wrap gap-2">
                    {dispute.evidence.map((evidence, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {evidence}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {dispute.resolution && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Resolution</span>
                  </div>
                  <p className="text-sm text-gray-700">{dispute.resolution.resolution}</p>
                  {dispute.resolution.adminNotes && (
                    <p className="text-xs text-gray-600 mt-1">Admin: {dispute.resolution.adminNotes}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Resolved by {dispute.resolution.resolvedBy.name} on {formatDate(dispute.resolution.resolvedAt)}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedDispute(dispute)
                      setShowViewDialog(true)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  {dispute.status === 'OPEN' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEscalateDispute(dispute.id)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Escalate
                    </Button>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Updated {formatDate(dispute.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDisputes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedStatus || selectedCategory || selectedPriority
                ? 'Try adjusting your filters or search terms'
                : 'No disputes have been raised yet'
              }
            </p>
            {!searchTerm && !selectedStatus && !selectedCategory && !selectedPriority && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Raise First Dispute
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Dispute Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Dispute Details
            </DialogTitle>
            <DialogDescription>
              Full dispute information and communication history
            </DialogDescription>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-6">
              {/* Dispute Info */}
              <Card>
                <CardHeader>
                  <CardTitle>{selectedDispute.title}</CardTitle>
                  <CardDescription>
                    {selectedDispute.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <Badge className={getCategoryColor(selectedDispute.category)}>
                        {getCategoryIcon(selectedDispute.category)}
                        <span className="ml-1">{selectedDispute.category.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Priority</p>
                      <Badge className={getPriorityColor(selectedDispute.priority)}>
                        {selectedDispute.priority}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={getStatusColor(selectedDispute.status)}>
                        {selectedDispute.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-sm font-medium">{formatDate(selectedDispute.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Communication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {selectedDispute.messages && selectedDispute.messages.length > 0 ? (
                      selectedDispute.messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start space-x-3 ${msg.senderType === 'ADMIN' ? 'bg-blue-50' : 'bg-gray-50'} p-3 rounded-lg`}>
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">
                              {msg.sender.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">{msg.sender.name}</p>
                              <p className="text-xs text-gray-500">{formatDate(msg.createdAt)}</p>
                            </div>
                            <p className="text-sm text-gray-700">{msg.message}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No messages yet</p>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="flex space-x-2 mt-4">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(selectedDispute.id)}
                    />
                    <Button 
                      onClick={() => handleSendMessage(selectedDispute.id)}
                      disabled={!message.trim()}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

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