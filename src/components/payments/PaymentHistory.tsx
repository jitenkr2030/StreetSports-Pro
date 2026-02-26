'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  IndianRupee, 
  Search, 
  Filter,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Trophy,
  Shield
} from 'lucide-react'

interface Payment {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  team?: {
    id: string
    name: string
    shortName: string
  }
  match?: {
    id: string
    title: string
    scheduledDate: string
    status: string
    homeTeam: { id: string; name: string; shortName: string }
    awayTeam: { id: string; name: string; shortName: string }
  }
  type: string
  amount: number
  status: string
  method?: string
  transactionId?: string
  escrowReleased: boolean
  createdAt: string
  releasedAt?: string
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showDetails, setShowDetails] = useState<Payment | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [searchTerm, selectedType, selectedStatus])

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedType) params.append('type', selectedType)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/payments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.match?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !selectedType || payment.type === selectedType
    const matchesStatus = !selectedStatus || payment.status === selectedStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MATCH_ENTRY': return 'bg-blue-100 text-blue-800'
      case 'TOURNAMENT_ENTRY': return 'bg-purple-100 text-purple-800'
      case 'GROUND_BOOKING': return 'bg-green-100 text-green-800'
      case 'PLATFORM_FEE': return 'bg-orange-100 text-orange-800'
      case 'PRIZE_PAYOUT': return 'bg-yellow-100 text-yellow-800'
      case 'REFUND': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const downloadReceipt = (payment: Payment) => {
    // Generate receipt content
    const receiptContent = `
STREETCRICKET PRO - PAYMENT RECEIPT
=====================================
Receipt ID: ${payment.id}
Date: ${formatDate(payment.createdAt)}
Status: ${payment.status}

PAYMENT DETAILS:
- Type: ${payment.type.replace('_', ' ')}
- Amount: ₹${payment.amount.toLocaleString()}
- Method: ${payment.method || 'N/A'}
- Transaction ID: ${payment.transactionId || 'N/A'}

USER INFORMATION:
- Name: ${payment.user.name}
- Email: ${payment.user.email}

${payment.team ? `TEAM INFORMATION:
- Team: ${payment.team.name} (${payment.team.shortName})` : ''}

${payment.match ? `MATCH INFORMATION:
- Match: ${payment.match.title}
- Date: ${new Date(payment.match.scheduledDate).toLocaleDateString('en-IN')}
- Teams: ${payment.match.homeTeam.shortName} vs ${payment.match.awayTeam.shortName}` : ''}

ESCROW STATUS: ${payment.escrowReleased ? 'Released' : 'Held'}
${payment.releasedAt ? `Released On: ${formatDate(payment.releasedAt)}` : ''}

=====================================
Thank you for using StreetCricket Pro!
This is a computer-generated receipt.
    `.trim()

    // Create and download file
    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt_${payment.id}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED' && p.type !== 'PRIZE_PAYOUT')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPrizePayouts = payments
    .filter(p => p.status === 'COMPLETED' && p.type === 'PRIZE_PAYOUT')
    .reduce((sum, p) => sum + p.amount, 0)

  const escrowBalance = payments
    .filter(p => p.status === 'COMPLETED' && !p.escrowReleased)
    .reduce((sum, p) => sum + p.amount, 0)

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
          <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
          <p className="text-gray-600">Manage all transactions and payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">
              From completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prize Payouts</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ₹{totalPrizePayouts.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">
              Paid to winners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escrow Balance</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{escrowBalance.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">
              Held in escrow
            </p>
          </CardContent>
        </Card>
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
              <Label htmlFor="search">Search Payments</Label>
              <Input
                id="search"
                placeholder="Search by user, team, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type-filter">Filter by Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="MATCH_ENTRY">Match Entry</SelectItem>
                  <SelectItem value="TOURNAMENT_ENTRY">Tournament Entry</SelectItem>
                  <SelectItem value="GROUND_BOOKING">Ground Booking</SelectItem>
                  <SelectItem value="PLATFORM_FEE">Platform Fee</SelectItem>
                  <SelectItem value="PRIZE_PAYOUT">Prize Payout</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
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
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="w-full justify-center py-2">
                {filteredPayments.length} payments found
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.map((payment) => (
          <Card key={payment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge className={getTypeColor(payment.type)}>
                      {payment.type.replace('_', ' ')}
                    </Badge>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                    {payment.escrowReleased && (
                      <Badge variant="outline" className="text-green-600">
                        Escrow Released
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-lg font-semibold text-green-600">
                        ₹{payment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="text-sm font-medium">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">User</p>
                      <p className="font-medium">{payment.user.name}</p>
                      <p className="text-gray-500">{payment.user.email}</p>
                    </div>
                    
                    {payment.team && (
                      <div>
                        <p className="text-gray-600">Team</p>
                        <p className="font-medium">
                          {payment.team.name} ({payment.team.shortName})
                        </p>
                      </div>
                    )}
                    
                    {payment.match && (
                      <div className="md:col-span-2">
                        <p className="text-gray-600">Match</p>
                        <p className="font-medium">{payment.match.title}</p>
                        <p className="text-gray-500">
                          {payment.match.homeTeam.shortName} vs {payment.match.awayTeam.shortName}
                        </p>
                      </div>
                    )}
                  </div>

                  {payment.transactionId && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                      <p className="font-mono text-sm">{payment.transactionId}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(payment)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  {payment.status === 'COMPLETED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReceipt(payment)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Receipt
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedType || selectedStatus
                ? 'Try adjusting your filters or search terms'
                : 'No payments have been processed yet'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment ID</p>
                  <p className="font-medium">{showDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(showDetails.status)}>
                    {showDetails.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <Badge className={getTypeColor(showDetails.type)}>
                    {showDetails.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium text-green-600">
                    ₹{showDetails.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-medium">{formatDate(showDetails.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Escrow Status</p>
                  <p className="font-medium">
                    {showDetails.escrowReleased ? 'Released' : 'Held'}
                  </p>
                </div>
              </div>

              {showDetails.transactionId && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Transaction ID</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-mono text-sm">{showDetails.transactionId}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(null)}
                >
                  Close
                </Button>
                {showDetails.status === 'COMPLETED' && (
                  <Button onClick={() => downloadReceipt(showDetails)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}