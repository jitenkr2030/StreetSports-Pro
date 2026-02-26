import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateBookingSchema = z.object({
  status: z.enum(['BOOKED', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  paymentId: z.string().optional(),
})

// GET /api/ground-bookings/[id] - Get a specific ground booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await db.groundBooking.findUnique({
      where: { id: params.id },
      include: {
        ground: {
          select: {
            id: true,
            name: true,
            address: true,
            area: true,
            pricePerSlot: true,
            hasFloodlights: true,
            hasPavilion: true,
            capacity: true,
            images: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            transactionId: true,
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Ground booking not found' },
        { status: 404 }
      )
    }

    // Parse images if present
    const responseBooking = {
      ...booking,
      ground: {
        ...booking.ground,
        images: booking.ground.images ? JSON.parse(booking.ground.images) : []
      }
    }

    return NextResponse.json(responseBooking)
  } catch (error) {
    console.error('Error fetching ground booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ground booking' },
      { status: 500 }
    )
  }
}

// PUT /api/ground-bookings/[id] - Update a ground booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateBookingSchema.parse(body)

    // Check if booking exists
    const existingBooking = await db.groundBooking.findUnique({
      where: { id: params.id }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Ground booking not found' },
        { status: 404 }
      )
    }

    // If payment ID is being updated, check if payment exists
    if (validatedData.paymentId) {
      const payment = await db.payment.findUnique({
        where: { id: validatedData.paymentId }
      })

      if (!payment) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        )
      }
    }

    const updatedBooking = await db.groundBooking.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        ground: {
          select: {
            id: true,
            name: true,
            address: true,
            area: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
          }
        }
      }
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error('Error updating ground booking:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update ground booking' },
      { status: 500 }
    )
  }
}

// DELETE /api/ground-bookings/[id] - Cancel a ground booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await db.groundBooking.findUnique({
      where: { id: params.id }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Ground booking not found' },
        { status: 404 }
      )
    }

    // Can only cancel bookings that are not completed
    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed booking' },
        { status: 400 }
      )
    }

    // Update status to cancelled
    const cancelledBooking = await db.groundBooking.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: cancelledBooking
    })
  } catch (error) {
    console.error('Error cancelling ground booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel ground booking' },
      { status: 500 }
    )
  }
}

// GET /api/ground-bookings/[id]/availability - Check availability for a ground
export async function GET_AVAILABILITY(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const searchDate = new Date(date)
    const nextDay = new Date(searchDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Get all bookings for the ground on the specified date
    const bookings = await db.groundBooking.findMany({
      where: {
        groundId: params.id,
        date: {
          gte: searchDate,
          lt: nextDay
        },
        status: { in: ['BOOKED', 'CONFIRMED'] }
      },
      select: {
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: { startTime: 'asc' }
    })

    // Generate available time slots
    const timeSlots = []
    const openingTime = 6 * 60 // 6:00 AM in minutes
    const closingTime = 23 * 60 // 11:00 PM in minutes
    const slotDuration = 60 // 1 hour slots

    for (let time = openingTime; time < closingTime; time += slotDuration) {
      const startTimeStr = `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`
      const endTimeStr = `${Math.floor((time + slotDuration) / 60).toString().padStart(2, '0')}:${((time + slotDuration) % 60).toString().padStart(2, '0')}`
      
      // Check if this slot is booked
      const isBooked = bookings.some(booking => {
        const bookingStart = booking.startTime.split(':')
        const bookingEnd = booking.endTime.split(':')
        
        const bookingStartMinutes = parseInt(bookingStart[0]) * 60 + parseInt(bookingStart[1])
        const bookingEndMinutes = parseInt(bookingEnd[0]) * 60 + parseInt(bookingEnd[1])
        
        return time < bookingEndMinutes && (time + slotDuration) > bookingStartMinutes
      })

      timeSlots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        available: !isBooked,
        booked: isBooked
      })
    }

    return NextResponse.json({
      groundId: params.id,
      date: date,
      timeSlots
    })
  } catch (error) {
    console.error('Error checking ground availability:', error)
    return NextResponse.json(
      { error: 'Failed to check ground availability' },
      { status: 500 }
    )
  }
}