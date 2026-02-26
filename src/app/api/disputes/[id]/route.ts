import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateDisputeSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CLOSED']).optional(),
  resolution: z.string().optional(),
  adminNotes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

const addMessageSchema = z.object({
  senderId: z.string().min(1, 'Sender ID is required'),
  senderType: z.enum(['TEAM', 'ADMIN']),
  message: z.string().min(1, 'Message is required'),
  isPrivate: z.boolean().default(false),
})

// GET /api/disputes/[id] - Get a specific dispute
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dispute = await db.dispute.findUnique({
      where: { id: params.id },
      include: {
        match: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            scheduledTime: true,
            status: true,
            ground: {
              select: { id: true, name: true, address: true, area: true }
            },
            homeTeam: {
              select: { id: true, name: true, shortName: true, area: true }
            },
            awayTeam: {
              select: { id: true, name: true, shortName: true, area: true }
            }
          }
        },
        raisedByTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
            manager: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        },
        againstTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            area: true,
            manager: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        resolution: {
          select: {
            id: true,
            resolution: true,
            adminNotes: true,
            resolvedBy: {
              select: { id: true, name: true, email: true }
            },
            resolvedAt: true,
          }
        }
      }
    })

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(dispute)
  } catch (error) {
    console.error('Error fetching dispute:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dispute' },
      { status: 500 }
    )
  }
}

// PUT /api/disputes/[id] - Update a dispute
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateDisputeSchema.parse(body)

    // Check if dispute exists
    const existingDispute = await db.dispute.findUnique({
      where: { id: params.id }
    })

    if (!existingDispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    const updateData: any = { ...validatedData }
    
    // If resolving the dispute, add resolution details
    if (validatedData.status === 'RESOLVED' && !existingDispute.resolutionId) {
      // In a real app, this would come from authenticated admin
      const adminId = 'admin-1'
      
      const resolution = await db.disputeResolution.create({
        data: {
          disputeId: params.id,
          resolvedBy: adminId,
          resolution: validatedData.resolution || 'Dispute resolved by admin',
          adminNotes: validatedData.adminNotes,
          resolvedAt: new Date(),
        }
      })

      updateData.resolutionId = resolution.id
    }

    const updatedDispute = await db.dispute.update({
      where: { id: params.id },
      data: updateData,
      include: {
        match: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        raisedByTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
          }
        },
        againstTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Dispute updated successfully',
      dispute: updatedDispute
    })
  } catch (error) {
    console.error('Error updating dispute:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update dispute' },
      { status: 500 }
    )
  }
}

// POST /api/disputes/[id]/messages - Add message to dispute
export async function POST_MESSAGE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = addMessageSchema.parse(body)

    // Check if dispute exists
    const dispute = await db.dispute.findUnique({
      where: { id: params.id }
    })

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    // Check if sender is authorized
    if (validatedData.senderType === 'TEAM') {
      const isTeamInvolved = dispute.raisedByTeamId === validatedData.senderId || 
                          dispute.againstTeamId === validatedData.senderId
      
      if (!isTeamInvolved) {
        return NextResponse.json(
          { error: 'You are not authorized to message this dispute' },
          { status: 403 }
        )
      }
    }

    // Create message
    const message = await db.disputeMessage.create({
      data: {
        disputeId: params.id,
        senderId: validatedData.senderId,
        senderType: validatedData.senderType,
        message: validatedData.message,
        isPrivate: validatedData.isPrivate,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Notify relevant parties (in real app, this would send notifications)
    console.log(`New message in dispute ${params.id}: ${message.message}`)

    return NextResponse.json({
      message: 'Message added successfully',
      data: message
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding message:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    )
  }
}

// POST /api/disputes/[id]/escalate - Escalate dispute to higher priority
export async function POST_ESCALATE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { reason, newPriority } = await request.json()

    // Check if dispute exists
    const dispute = await db.dispute.findUnique({
      where: { id: params.id }
    })

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      )
    }

    // Update priority and add escalation note
    const updatedDispute = await db.dispute.update({
      where: { id: params.id },
      data: {
        priority: newPriority,
        status: 'UNDER_REVIEW',
        adminNotes: `Escalated: ${reason}\n${dispute.adminNotes || ''}`,
      }
    })

    // Notify admin (in real app, this would send email/notification)
    console.log(`Dispute escalated: ${params.id} - Priority: ${newPriority}`)

    return NextResponse.json({
      message: 'Dispute escalated successfully',
      dispute: updatedDispute
    })

  } catch (error) {
    console.error('Error escalating dispute:', error)
    return NextResponse.json(
      { error: 'Failed to escalate dispute' },
      { status: 500 }
    )
  }
}