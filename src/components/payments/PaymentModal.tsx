'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  IndianRupee, 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  XCircle,
  Clock,
  Shield,
  QrCode,
  Copy,
  ExternalLink
} from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  matchData?: {
    id: string
    homeTeam: { name: string; shortName: string }
    awayTeam: { name: string; shortName: string }
    entryFee: number
    prizePool: number
    scheduledDate: string
  }
  tournamentData?: {
    id: string
    name: string
    entryFee: number
    prizePool: number
    startDate: string
  }
  onPaymentComplete: (paymentId: string) => void
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  matchData, 
  tournamentData, 
  onPaymentComplete 
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'UPI'>('RAZORPAY')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending')
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [upiLink, setUpiLink] = useState('')
  const [copied, setCopied] = useState(false)

  const entryFee = matchData?.entryFee || tournamentData?.entryFee || 0
  const title = matchData 
    ? `${matchData.homeTeam.shortName} vs ${matchData.awayTeam.shortName}`
    : tournamentData?.name || ''

  const handlePayment = async () => {
    setIsProcessing(true)
    setPaymentStatus('processing')

    try {
      // Mock payment processing - in real app, this would call your payment API
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate successful payment
      const mockPaymentId = `pay_${Date.now()}`
      setPaymentDetails({
        id: mockPaymentId,
        amount: entryFee,
        status: 'completed',
        method: paymentMethod,
        createdAt: new Date().toISOString()
      })

      setPaymentStatus('success')
      onPaymentComplete(mockPaymentId)

      // Close modal after success
      setTimeout(() => {
        onClose()
        resetPaymentState()
      }, 2000)

    } catch (error) {
      console.error('Payment error:', error)
      setPaymentStatus('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUPIPayment = () => {
    // Generate UPI link
    const upiId = 'streetcricket@upi'
    const transactionRef = `SC_${Date.now()}`
    const note = `Entry for ${title}`
    
    const params = new URLSearchParams({
      pa: upiId,
      pn: 'StreetCricket Pro',
      am: entryFee.toString(),
      cu: 'INR',
      tn: note,
      tr: transactionRef,
      mc: '5899',
    })

    const link = `upi://pay?${params.toString()}`
    setUpiLink(link)
  }

  const copyUPI = () => {
    if (upiLink) {
      navigator.clipboard.writeText(upiLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const resetPaymentState = () => {
    setPaymentStatus('pending')
    setPaymentDetails(null)
    setUpiLink('')
    setIsProcessing(false)
  }

  const openUPIApps = () => {
    const apps = [
      { name: 'PhonePe', url: `phonepe://pay?${upiLink.split('?')[1]}` },
      { name: 'Paytm', url: `paytmmp://pay?${upiLink.split('?')[1]}` },
      { name: 'Google Pay', url: `gpay://upi/pay?${upiLink.split('?')[1]}` },
      { name: 'BHIM', url: `bhim://upi/pay?${upiLink.split('?')[1]}` },
    ]

    apps.forEach(app => {
      window.open(app.url, '_blank')
    })
  }

  useEffect(() => {
    if (paymentMethod === 'UPI' && isOpen) {
      handleUPIPayment()
    }
  }, [paymentMethod, isOpen])

  useEffect(() => {
    if (!isOpen) {
      resetPaymentState()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5" />
            Complete Payment
          </DialogTitle>
          <DialogDescription>
            Secure payment powered by escrow protection
          </DialogDescription>
        </DialogHeader>

        {paymentStatus === 'pending' && (
          <div className="space-y-4">
            {/* Order Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Event</p>
                  <p className="font-medium">{title}</p>
                </div>
                {matchData && (
                  <div>
                    <p className="text-sm text-gray-600">Match Date</p>
                    <p className="font-medium">
                      {new Date(matchData.scheduledDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Entry Fee</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{entryFee.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Payment Method</label>
              <Tabs value={paymentMethod} onValueChange={(value: 'RAZORPAY' | 'UPI') => setPaymentMethod(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="RAZORPAY" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Card/NetBanking
                  </TabsTrigger>
                  <TabsTrigger value="UPI" className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    UPI
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="RAZORPAY" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                          <CreditCard className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Pay with Razorpay</p>
                          <p className="text-sm text-gray-600">
                            Secure payment via Credit Card, Debit Card, NetBanking, or UPI
                          </p>
                        </div>
                        <Button 
                          onClick={handlePayment} 
                          disabled={isProcessing}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {isProcessing ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Pay ₹{entryFee.toLocaleString()}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="UPI" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Smartphone className="w-8 h-8 text-green-600" />
                          </div>
                          <p className="font-medium mb-2">Pay with UPI</p>
                          <p className="text-sm text-gray-600 mb-4">
                            Scan the QR code or use your UPI app
                          </p>
                        </div>

                        {/* QR Code Placeholder */}
                        <div className="flex justify-center">
                          <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            <QrCode className="w-12 h-12 text-gray-400" />
                          </div>
                        </div>

                        {/* UPI ID */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">UPI ID</p>
                          <div className="flex items-center justify-center space-x-2">
                            <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                              streetcricket@upi
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyUPI}
                              className="h-8"
                            >
                              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* UPI Apps */}
                        <div>
                          <p className="text-sm text-gray-600 mb-2 text-center">Or pay directly using:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {['PhonePe', 'Paytm', 'Google Pay', 'BHIM'].map(app => (
                              <Button
                                key={app}
                                variant="outline"
                                size="sm"
                                onClick={openUPIApps}
                                className="text-xs"
                              >
                                {app}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Button 
                          onClick={handlePayment} 
                          disabled={isProcessing}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              I've Paid
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Security Badge */}
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription className="text-xs">
                <strong>Escrow Protection:</strong> Your payment is securely held until the match is completed. 
                Funds are only released to the winner after confirmation.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {paymentStatus === 'processing' && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
            <p className="text-gray-600">Please wait while we process your payment...</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your entry has been confirmed. Payment ID: {paymentDetails?.id}
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Next:</strong> You will receive match details and updates via email.
              </p>
            </div>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Payment Failed</h3>
            <p className="text-gray-600 mb-4">
              Something went wrong. Please try again or contact support.
            </p>
            <Button onClick={resetPaymentState} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {paymentStatus === 'pending' && (
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}