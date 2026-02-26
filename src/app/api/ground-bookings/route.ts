import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createBookingSchema = z.object({
  groundId: z.string().min(1, 'Ground ID is required'),
  teamId: z.string().min(1, 'Team ID is required'),
  date: z.string().transform(val => new Date(val)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  totalAmount: z.number().int().positive('Amount must be positive'),
})

const updateBookingSchema = z.object({
  status: z.enum(['BOOKED', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  paymentId: z.string().optional(),
})

// GET /api/ground-bookings - Get all ground bookings with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groundId = searchParams.get('groundId')
    const teamId = searchParams.get('teamId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (groundId) where.groundId = groundId
    if (teamId) where.teamId = teamId
    if (date) {
      const searchDate = new Date(date)
      const nextDay = new Date(searchDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      where.date = {
        gte: searchDate,
        lt: nextDay
      }
    }
    if (status) where.status = status

    const bookings = await db.groundBooking.findMany({
      where,
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
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ],
      take: limit,
      skip: offset,
    })

    const total = await db.groundBooking.count({ where })

    return NextResponse.json({
      bookings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching ground bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ground bookings' },
      { status: 500 }
    )
  }
}

// POST /api/ground-bookings - Create a new ground booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    // Check if ground exists
    const ground = await db.ground.findUnique({
      where: { id: validatedData.groundId }
    })

    if (!ground) {
      return NextResponse.json(
        { error: 'Ground not found' },
        { status: 404 }
      )
    }

    // Check if team exists
    const team = await db.team.findUnique({
      where: { id: validatedData.teamId }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Check for booking conflicts
    const bookingDate = new Date(validatedData.date)
    const bookingStart = validatedData.startTime.split(':')
    const bookingEnd = validatedData.endTime.split(':')
    
    const bookingStartMinutes = parseInt(bookingStart[0]) * 60 + parseInt(bookingStart[1])
    const bookingEndMinutes = parseInt(bookingEnd[0]) * 60 + parseInt(bookingEnd[1])

    // Check for existing bookings on the same date
    const existingBookings = await db.groundBooking.findMany({
      where: {
        groundId: validatedData.groundId,
        date: bookingDate,
        status: { in: ['BOOKED', 'CONFIRMED'] }
      }
    })

    // Check for time conflicts
    for (const existingBooking of existingBookings) {
      const existingStart = existingBooking.startTime.split(':')
      const existingEnd = existingBooking.endTime.split(':')
      
      const existingStartMinutes = parseInt(existingStart[0]) * 60 + parseInt(existingStart[1])
      const existingEndMinutes = parseInt(existingEnd[0]) * 60 + parseInt(existingEnd[1])

      // Check if time ranges overlap
      if (
        (bookingStartMinutes < existingEndMinutes && bookingEndMinutes > existingStartMinutes)
      ) {
        return NextResponse.json(
          { 
            error: 'Time slot already booked',
            details: {
              existingBooking: {
                startTime: existingBooking.startTime,
                endTime: existingBooking.endTime,
                team: existingBooking.team?.name
              }
            }
          },
          { status: 409 }
        )
      }
    }

    // Validate time logic
    if (bookingEndMinutes <= bookingStartMinutes) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Calculate duration and validate amount
    const durationHours = (bookingEndMinutes - bookingStartMinutes) / 60
    const expectedAmount = Math.round(ground.pricePerSlot * durationHours)

    if (validatedData.totalAmount !== expectedAmount) {
      return NextResponse.json(
        { 
          error: 'Invalid amount',
          details: {
            expectedAmount,
            durationHours,
            pricePerSlot: ground.pricePerSlot
          }
        },
        { status: 400 }
      )
    }

    // Create the booking
    const booking = await db.groundBooking.create({
      data: {
        ...validatedData,
        status: 'BOOKED',
      },
      include: {
        ground: {
          select: {
            id: true,
            name: true,
            address: true,
            area: true,
            pricePerSlot: true,
            hasFloodlights: true,
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

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Error creating ground booking:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create ground booking' },
      { status: 500 }
    )
  }
}