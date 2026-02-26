import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sports - List all available sports
export async function GET() {
  try {
    const sports = await db.sport.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: sports,
      count: sports.length
    })
  } catch (error) {
    console.error('Error fetching sports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sports' },
      { status: 500 }
    )
  }
}

// POST /api/sports - Create a new sport (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, icon, description, minPlayers, maxPlayers, phase } = body

    // Validate required fields
    if (!name || !icon || !minPlayers || !maxPlayers) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if sport already exists
    const existingSport = await db.sport.findUnique({
      where: { name }
    })

    if (existingSport) {
      return NextResponse.json(
        { success: false, error: 'Sport already exists' },
        { status: 409 }
      )
    }

    const sport = await db.sport.create({
      data: {
        name,
        icon,
        description,
        minPlayers,
        maxPlayers,
        phase: phase || 'PHASE_1'
      }
    })

    return NextResponse.json({
      success: true,
      data: sport,
      message: 'Sport created successfully'
    })
  } catch (error) {
    console.error('Error creating sport:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create sport' },
      { status: 500 }
    )
  }
}