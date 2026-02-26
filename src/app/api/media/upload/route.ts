import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const uploadMediaSchema = z.object({
  type: z.enum(['MATCH_HIGHLIGHT', 'MATCH_PHOTO', 'TEAM_LOGO', 'PLAYER_PHOTO', 'GROUND_PHOTO', 'TOURNAMENT_BANNER']),
  entityId: z.string().min(1, 'Entity ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
})

// POST /api/media/upload - Upload media file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = JSON.parse(formData.get('metadata') as string)

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate metadata
    const validatedData = uploadMediaSchema.parse(metadata)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: ' + allowedTypes.join(', ') },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size: 50MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${validatedData.type}_${timestamp}_${randomString}.${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create media record
    const media = await db.media.create({
      data: {
        type: validatedData.type,
        entityId: validatedData.entityId,
        title: validatedData.title,
        description: validatedData.description,
        fileName,
        filePath: `/uploads/${fileName}`,
        mimeType: file.type,
        fileSize: file.size,
        tags: validatedData.tags || [],
        isPublic: validatedData.isPublic,
        uploadedBy: 'system', // In real app, this would come from auth
      }
    })

    return NextResponse.json({
      message: 'File uploaded successfully',
      media
    }, { status: 201 })

  } catch (error) {
    console.error('Error uploading file:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// GET /api/media/upload - Get media with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const entityId = searchParams.get('entityId')
    const isPublic = searchParams.get('isPublic')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (type) where.type = type
    if (entityId) where.entityId = entityId
    if (isPublic !== null) where.isPublic = isPublic === 'true'

    const media = await db.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.media.count({ where })

    return NextResponse.json({
      media,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}