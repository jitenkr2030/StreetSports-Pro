import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createGroundSchema = z.object({
  name: z.string().min(2, 'Ground name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  area: z.string().min(1, 'Area is required'),
  pricePerSlot: z.number().int().min(100, 'Price must be at least ₹100'),
  pitchType: z.string().min(1, 'Pitch type is required'),
  hasFloodlights: z.boolean().default(false),
  hasPavilion: z.boolean().default(false),
  capacity: z.number().int().positive().optional(),
  description: z.string().optional(),
  images: z.string().optional(), // JSON string of image URLs
})

const updateGroundSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  area: z.string().min(1).optional(),
  pricePerSlot: z.number().int().min(100).optional(),
  pitchType: z.string().min(1).optional(),
  hasFloodlights: z.boolean().optional(),
  hasPavilion: z.boolean().optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().optional(),
  images: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/grounds - Get all grounds with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const area = searchParams.get('area')
    const hasFloodlights = searchParams.get('floodlights')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const pitchType = searchParams.get('pitchType')
    const isActive = searchParams.get('active')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (area) {
      where.area = { contains: area, mode: 'insensitive' }
    }
    
    if (hasFloodlights === 'true') {
      where.hasFloodlights = true
    }
    
    if (pitchType) {
      where.pitchType = { contains: pitchType, mode: 'insensitive' }
    }
    
    if (minPrice || maxPrice) {
      where.pricePerSlot = {}
      if (minPrice) where.pricePerSlot.gte = parseInt(minPrice)
      if (maxPrice) where.pricePerSlot.lte = parseInt(maxPrice)
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const grounds = await db.ground.findMany({
      where,
      include: {
        _count: {
          select: {
            matches: {
              where: { 
                scheduledDate: { gte: new Date() },
                status: { in: ['SCHEDULED', 'ACCEPTED'] }
              }
            },
            groundBookings: {
              where: { 
                date: { gte: new Date() },
                status: 'BOOKED'
              }
            }
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { hasFloodlights: 'desc' },
        { pricePerSlot: 'asc' },
        { name: 'asc' }
      ],
      take: limit,
      skip: offset,
    })

    const total = await db.ground.count({ where })

    // Parse images JSON if present
    const groundsWithParsedImages = grounds.map(ground => ({
      ...ground,
      images: ground.images ? JSON.parse(ground.images) : []
    }))

    return NextResponse.json({
      grounds: groundsWithParsedImages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching grounds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grounds' },
      { status: 500 }
    )
  }
}

// POST /api/grounds - Create a new ground
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createGroundSchema.parse(body)

    // Check if ground with same name and address already exists
    const existingGround = await db.ground.findFirst({
      where: {
        OR: [
          { 
            name: { equals: validatedData.name, mode: 'insensitive' },
            address: { equals: validatedData.address, mode: 'insensitive' }
          }
        ]
      }
    })

    if (existingGround) {
      return NextResponse.json(
        { error: 'Ground with this name and address already exists' },
        { status: 409 }
      )
    }

    // Create the ground
    const ground = await db.ground.create({
      data: {
        ...validatedData,
        isActive: true,
      }
    })

    // Parse images if present
    const responseGround = {
      ...ground,
      images: ground.images ? JSON.parse(ground.images) : []
    }

    return NextResponse.json(responseGround, { status: 201 })
  } catch (error) {
    console.error('Error creating ground:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create ground' },
      { status: 500 }
    )
  }
}