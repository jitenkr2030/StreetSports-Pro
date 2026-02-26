'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  Plus, 
  Search, 
  Filter,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Sun,
  Moon,
  CheckCircle,
  XCircle,
  Eye,
  IndianRupee,
  Camera,
  Star
} from 'lucide-react'

interface Ground {
  id: string
  name: string
  address: string
  area: string
  pricePerSlot: number
  pitchType: string
  hasFloodlights: boolean
  hasPavilion: boolean
  capacity?: number
  description?: string
  images: string[]
  isActive: boolean
  _count: {
    matches: number
    groundBookings: number
  }
}

interface BookingData {
  groundId: string
  date: Date
  startTime: string
  endTime: string
  totalAmount: number
}

export function GroundBooking() {
  const [grounds, setGrounds] = useState<Ground[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedPitchType, setSelectedPitchType] = useState('')
  const [hasFloodlights, setHasFloodlights] = useState('')
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [selectedGround, setSelectedGround] = useState<Ground | null>(null)
  const [bookingData, setBookingData] = useState<BookingData>({
    groundId: '',
    date: new Date(),
    startTime: '18:00',
    endTime: '20:00',
    totalAmount: 0,
  })
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  const AREAS = [
    'Janakpuri', 'Tilak Nagar', 'Dwarka', 'Rohini', 'Pitampura',
    'Lajpat Nagar', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi',
    'Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad'
  ]

  const PITCH_TYPES = [
    'Turf', 'Matting', 'Concrete', 'Artificial'
  ]

  useEffect(() => {
    fetchGrounds()
  }, [searchTerm, selectedArea, selectedPitchType, hasFloodlights])

  const fetchGrounds = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedArea) params.append('area', selectedArea)
      if (selectedPitchType) params.append('pitchType', selectedPitchType)
      if (hasFloodlights === 'true') params.append('floodlights', 'true')
      if (hasFloodlights === 'false') params.append('floodlights', 'false')

      const response = await fetch(`/api/grounds?${params}`)
      if (response.ok) {
        const data = await response.json()
        setGrounds(data.grounds)
      }
    } catch (error) {
      console.error('Error fetching grounds:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAvailability = async (groundId: string, date: Date) => {
    setIsLoadingSlots(true)
    try {
      const dateStr = date.toISOString().split('T')[0]
      const response = await fetch(`/api/ground-bookings/${groundId}/availability?date=${dateStr}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.timeSlots)
      }
    } catch (error) {
      console.error('Error checking availability:', error)
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleBookingClick = (ground: Ground) => {
    setSelectedGround(ground)
    setBookingData(prev => ({
      ...prev,
      groundId: ground.id,
      totalAmount: ground.pricePerSlot * 2 // Default 2 hours
    }))
    checkAvailability(ground.id, bookingData.date)
    setShowBookingDialog(true)
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date && selectedGround) {
      setBookingData(prev => ({ ...prev, date }))
      checkAvailability(selectedGround.id, date)
    }
  }

  const handleTimeSlotSelect = (startTime: string, endTime: string, pricePerSlot: number) => {
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1])
    const durationHours = (endMinutes - startMinutes) / 60
    
    setBookingData(prev => ({
      ...prev,
      startTime,
      endTime,
      totalAmount: Math.round(pricePerSlot * durationHours)
    }))
  }

  const handleBooking = async () => {
    try {
      // Mock team ID - in real app, this would come from auth context
      const mockTeamId = '1'
      
      const response = await fetch('/api/ground-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          teamId: mockTeamId,
          date: bookingData.date.toISOString(),
        }),
      })

      if (response.ok) {
        setShowBookingDialog(false)
        // Reset form
        setBookingData({
          groundId: '',
          date: new Date(),
          startTime: '18:00',
          endTime: '20:00',
          totalAmount: 0,
        })
        fetchGrounds()
      }
    } catch (error) {
      console.error('Error creating booking:', error)
    }
  }

  const filteredGrounds = grounds.filter(ground => {
    const matchesSearch = 
      ground.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ground.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ground.area.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesArea = !selectedArea || ground.area === selectedArea
    const matchesPitchType = !selectedPitchType || ground.pitchType === selectedPitchType
    const matchesFloodlights = hasFloodlights === '' || 
      (hasFloodlights === 'true' && ground.hasFloodlights) ||
      (hasFloodlights === 'false' && !ground.hasFloodlights)
    
    return matchesSearch && matchesArea && matchesPitchType && matchesFloodlights
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
          <h2 className="text-2xl font-bold text-gray-900">Ground Booking</h2>
          <p className="text-gray-600">Book cricket grounds for your matches</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filter Grounds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search Grounds</Label>
              <Input
                id="search"
                placeholder="Search by name or address..."
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
            <div>
              <Label htmlFor="pitch-filter">Filter by Pitch Type</Label>
              <Select value={selectedPitchType} onValueChange={setSelectedPitchType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {PITCH_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="floodlights">Floodlights</Label>
              <Select value={hasFloodlights} onValueChange={setHasFloodlights}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="true">Available</SelectItem>
                  <SelectItem value="false">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="secondary" className="w-full justify-center py-2">
                {filteredGrounds.length} grounds found
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grounds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGrounds.map((ground) => (
          <Card key={ground.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <div className="relative h-48 bg-gray-200">
              {ground.images.length > 0 ? (
                <img 
                  src={ground.images[0]} 
                  alt={ground.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge className={ground.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {ground.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {ground.hasFloodlights && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Moon className="w-3 h-3 mr-1" />
                    Floodlights
                  </Badge>
                </div>
              )}
            </div>
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{ground.name}</CardTitle>
                  <p className="text-sm text-gray-600">{ground.area}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">per hour</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{ground.pricePerSlot}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {ground.address}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {ground.pitchType}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {ground.capacity || 'N/A'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ground.hasFloodlights && (
                    <Badge variant="outline" className="text-xs">
                      <Moon className="w-3 h-3 mr-1" />
                      Floodlights
                    </Badge>
                  )}
                  {ground.hasPavilion && (
                    <Badge variant="outline" className="text-xs">
                      Pavilion
                    </Badge>
                  )}
                </div>

                {ground.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {ground.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-gray-600">
                    <p>{ground._count.groundBookings} bookings</p>
                    <p>{ground._count.matches} matches</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleBookingClick(ground)}
                      disabled={!ground.isActive}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGrounds.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No grounds found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedArea || selectedPitchType || hasFloodlights
                ? 'Try adjusting your filters or search terms'
                : 'No grounds are available at the moment'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book Ground</DialogTitle>
            <DialogDescription>
              Select date and time slot for your booking
            </DialogDescription>
          </DialogHeader>
          
          {selectedGround && (
            <div className="space-y-6">
              {/* Ground Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{selectedGround.name}</CardTitle>
                  <p className="text-sm text-gray-600">{selectedGround.address}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Price per hour</p>
                      <p className="font-semibold text-green-600">₹{selectedGround.pricePerSlot}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Pitch type</p>
                      <p className="font-semibold">{selectedGround.pitchType}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <div>
                <Label htmlFor="booking-date">Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bookingData.date.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={bookingData.date}
                      onSelect={handleDateChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slots */}
              <div>
                <Label>Available Time Slots</Label>
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {availableSlots.map((slot: any, index: number) => (
                      <Button
                        key={index}
                        variant={slot.available ? "outline" : "secondary"}
                        className={`h-auto p-3 ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!slot.available}
                        onClick={() => slot.available && handleTimeSlotSelect(
                          slot.startTime, 
                          slot.endTime, 
                          selectedGround.pricePerSlot
                        )}
                      >
                        <div className="text-center">
                          <div className="font-medium">{slot.startTime}</div>
                          <div className="text-xs text-gray-600">to {slot.endTime}</div>
                          {slot.booked && (
                            <div className="text-xs text-red-600">Booked</div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{bookingData.date.toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{bookingData.startTime} - {bookingData.endTime}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-green-600">₹{bookingData.totalAmount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBooking}
                  disabled={!bookingData.startTime || !bookingData.endTime}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}