// Razorpay integration service for StreetCricket Pro

export interface RazorpayOrderOptions {
  amount: number // in paise
  currency: string
  receipt: string
  notes?: Record<string, string>
}

export interface RazorpayOrderResponse {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  offer_id: string | null
  status: string
  attempts: number
  notes: Record<string, string>
  created_at: number
}

class RazorpayService {
  private keyId: string
  private keySecret: string

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890'
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_1234567890'
  }

  // Create a new order
  async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResponse> {
    try {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`,
        },
        body: JSON.stringify({
          amount: options.amount,
          currency: options.currency || 'INR',
          receipt: options.receipt,
          notes: options.notes || {},
          payment_capture: 1,
        }),
      })

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.statusText}`)
      }

      const order = await response.json()
      return order
    } catch (error) {
      console.error('Error creating Razorpay order:', error)
      throw error
    }
  }

  // Verify payment signature
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = `${orderId}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body.toString())
      .digest('hex')

    return expectedSignature === signature
  }

  // Get payment details
  async getPayment(paymentId: string) {
    try {
      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching payment details:', error)
      throw error
    }
  }

  // Initialize Razorpay in browser
  initializeRazorpay(options: {
    key: string
    amount: number
    currency: string
    name: string
    description: string
    order_id: string
    handler: (response: any) => void
    prefill?: {
      name?: string
      email?: string
      contact?: string
    }
    notes?: Record<string, string>
    theme?: {
      color: string
    }
    modal?: {
      ondismiss: () => void
      escape: boolean
      handleback: boolean
      confirmclose: boolean
      animation: string
    }
  }) {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
      return razorpay
    }
    throw new Error('Razorpay SDK not loaded')
  }

  // Load Razorpay SDK
  loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
      document.body.appendChild(script)
    })
  }
}

export const razorpayService = new RazorpayService()

// UPI Payment handling
export class UPIService {
  // Generate UPI payment link
  generateUPILink(options: {
    upiId: string
    amount: number
    note: string
    transactionRef: string
  }): string {
    const { upiId, amount, note, transactionRef } = options
    
    const params = new URLSearchParams({
      pa: upiId,
      pn: 'StreetCricket Pro',
      am: amount.toString(),
      cu: 'INR',
      tn: note,
      tr: transactionRef,
      mc: '5899', // Merchant category code for sports/recreation
    })

    return `upi://pay?${params.toString()}`
  }

  // Validate UPI ID format
  validateUPIId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/
    return upiRegex.test(upiId)
  }

  // Common UPI apps deep links
  getUPIAppLinks(upiLink: string): Record<string, string> {
    return {
      phonepe: `phonepe://pay?${upiLink.split('?')[1]}`,
      paytm: `paytmmp://pay?${upiLink.split('?')[1]}`,
      gpay: `gpay://upi/pay?${upiLink.split('?')[1]}`,
      bhim: `bhim://upi/pay?${upiLink.split('?')[1]}`,
    }
  }
}

export const upiService = new UPIService()

// Payment processing service
export class PaymentService {
  // Process match entry payment
  async processMatchEntryPayment(matchId: string, userId: string, teamId: string, method: 'RAZORPAY' | 'UPI') {
    try {
      // Get match details
      const matchResponse = await fetch(`/api/matches/${matchId}`)
      if (!matchResponse.ok) throw new Error('Match not found')
      const match = await matchResponse.json()

      // Create payment record
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          teamId,
          matchId,
          type: 'MATCH_ENTRY',
          amount: match.entryFee,
          method: method === 'RAZORPAY' ? 'RAZORPAY' : 'UPI',
        }),
      })

      if (!paymentResponse.ok) throw new Error('Failed to create payment record')
      const payment = await paymentResponse.json()

      if (method === 'RAZORPAY') {
        // Create Razorpay order
        const order = await razorpayService.createOrder({
          amount: match.entryFee * 100, // Convert to paise
          currency: 'INR',
          receipt: `match_${matchId}_${payment.id}`,
          notes: {
            matchId,
            userId,
            teamId,
            paymentType: 'MATCH_ENTRY',
          },
        })

        return { payment, order }
      } else {
        // Generate UPI payment link
        const upiLink = upiService.generateUPILink({
          upiId: 'streetcricket@upi',
          amount: match.entryFee,
          note: `Match Entry - ${match.homeTeam.name} vs ${match.awayTeam.name}`,
          transactionRef: `SC_${payment.id}`,
        })

        return { payment, upiLink }
      }
    } catch (error) {
      console.error('Error processing match entry payment:', error)
      throw error
    }
  }

  // Process tournament entry payment
  async processTournamentEntryPayment(tournamentId: string, userId: string, teamId: string, method: 'RAZORPAY' | 'UPI') {
    try {
      // Get tournament details
      const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`)
      if (!tournamentResponse.ok) throw new Error('Tournament not found')
      const tournament = await tournamentResponse.json()

      // Create payment record
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          teamId,
          tournamentId,
          type: 'TOURNAMENT_ENTRY',
          amount: tournament.entryFee,
          method: method === 'RAZORPAY' ? 'RAZORPAY' : 'UPI',
        }),
      })

      if (!paymentResponse.ok) throw new Error('Failed to create payment record')
      const payment = await paymentResponse.json()

      if (method === 'RAZORPAY') {
        // Create Razorpay order
        const order = await razorpayService.createOrder({
          amount: tournament.entryFee * 100,
          currency: 'INR',
          receipt: `tournament_${tournamentId}_${payment.id}`,
          notes: {
            tournamentId,
            userId,
            teamId,
            paymentType: 'TOURNAMENT_ENTRY',
          },
        })

        return { payment, order }
      } else {
        // Generate UPI payment link
        const upiLink = upiService.generateUPILink({
          upiId: 'streetcricket@upi',
          amount: tournament.entryFee,
          note: `Tournament Entry - ${tournament.name}`,
          transactionRef: `SC_${payment.id}`,
        })

        return { payment, upiLink }
      }
    } catch (error) {
      console.error('Error processing tournament entry payment:', error)
      throw error
    }
  }

  // Release prize money after match completion
  async releasePrizeMoney(matchId: string, winnerTeamId: string) {
    try {
      // Get all match entry payments for this match
      const paymentsResponse = await fetch(`/api/payments?matchId=${matchId}&type=MATCH_ENTRY&status=COMPLETED`)
      if (!paymentsResponse.ok) throw new Error('Failed to fetch payments')
      const { payments } = await paymentsResponse.json()

      // Calculate prize distribution
      const totalPrizePool = payments.reduce((sum: number, p: any) => sum + p.amount, 0)
      const platformFee = Math.round(totalPrizePool * 0.1)
      const winnerPrize = totalPrizePool - platformFee

      // Get winner team details
      const winnerTeamResponse = await fetch(`/api/teams/${winnerTeamId}`)
      if (!winnerTeamResponse.ok) throw new Error('Winner team not found')
      const winnerTeam = await winnerTeamResponse.json()

      // Create prize payout payment
      const payoutResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: winnerTeam.managerId,
          teamId: winnerTeamId,
          matchId,
          type: 'PRIZE_PAYOUT',
          amount: winnerPrize,
          method: 'BANK_TRANSFER',
        }),
      })

      if (!payoutResponse.ok) throw new Error('Failed to create prize payout')
      const payout = await payoutResponse.json()

      // Release escrow for all entry payments
      for (const payment of payments) {
        await fetch(`/api/payments/${payment.id}/release-escrow`, {
          method: 'POST',
        })
      }

      return { payout, totalPrizePool, platformFee, winnerPrize }
    } catch (error) {
      console.error('Error releasing prize money:', error)
      throw error
    }
  }
}

export const paymentService = new PaymentService()