import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  method: z.string().optional(),
  transactionId: z.string().optional(),
  escrowReleased: z.boolean().optional(),
})

// GET /api/payments/[id] - Get a specific payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await db.payment.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
        match: {
          select: {
            id: true,
            title: true,
            scheduledDate: true,
            scheduledTime: true,
            status: true,
            entryFee: true,
            prizePool: true,
            homeTeam: {
              select: { id: true, name: true, shortName: true }
            },
            awayTeam: {
              select: { id: true, name: true, shortName: true }
            },
            ground: {
              select: { id: true, name: true, address: true, area: true }
            }
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    )
  }
}

// PUT /api/payments/[id] - Update payment status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updatePaymentSchema.parse(body)

    // Check if payment exists
    const existingPayment = await db.payment.findUnique({
      where: { id: params.id }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // If transaction ID is being updated, check for uniqueness
    if (validatedData.transactionId) {
      const existingTransaction = await db.payment.findFirst({
        where: {
          transactionId: validatedData.transactionId,
          id: { not: params.id }
        }
      })

      if (existingTransaction) {
        return NextResponse.json(
          { error: 'Transaction ID already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = { ...validatedData }
    
    // If status is being set to COMPLETED, set releasedAt
    if (validatedData.status === 'COMPLETED' && !existingPayment.releasedAt) {
      updateData.releasedAt = new Date()
    }

    // If escrow is being released, set escrowReleased and releasedAt
    if (validatedData.escrowReleased && !existingPayment.escrowReleased) {
      updateData.escrowReleased = true
      updateData.releasedAt = new Date()
    }

    const updatedPayment = await db.payment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
          }
        },
        match: {
          select: {
            id: true,
            title: true,
            status: true,
            entryFee: true,
            homeTeam: {
              select: { id: true, name: true, shortName: true }
            },
            awayTeam: {
              select: { id: true, name: true, shortName: true }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Error updating payment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}

// POST /api/payments/[id]/release-escrow - Release escrow payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await db.payment.findUnique({
      where: { id: params.id },
      include: {
        match: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.escrowReleased) {
      return NextResponse.json(
        { error: 'Escrow already released' },
        { status: 400 }
      )
    }

    // For match entry payments, check if match is completed
    if (payment.type === 'MATCH_ENTRY' && payment.match) {
      if (payment.match.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Cannot release escrow until match is completed' },
          { status: 400 }
        )
      }
    }

    const updatedPayment = await db.payment.update({
      where: { id: params.id },
      data: {
        escrowReleased: true,
        releasedAt: new Date(),
        status: 'COMPLETED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Escrow released successfully',
      payment: updatedPayment
    })
  } catch (error) {
    console.error('Error releasing escrow:', error)
    return NextResponse.json(
      { error: 'Failed to release escrow' },
      { status: 500 }
    )
  }
}