'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Pause, 
  RotateCcw,
  Plus,
  Minus,
  Gamepad2,
  Target,
  Users,
  Clock,
  Trophy,
  Share2,
  RefreshCw,
  Zap,
  Shield
} from 'lucide-react'

interface Player {
  id: string
  name: string
  role: string
  jerseyNumber?: number
}

interface BallEvent {
  id: string
  over: number
  ball: number
  batsmanId: string
  bowlerId: string
  event: string
  runs: number
  wickets: number
  commentary?: string
}

interface Inning {
  id: string
  inning: string
  runs: number
  wickets: number
  overs: number
  balls: number
  strikerId?: string
  nonStrikerId?: string
  bowlerId?: string
  battingTeam: {
    id: string
    name: string
    shortName: string
  }
  bowlingTeam: {
    id: string
    name: string
    shortName: string
  }
  ballEvents: BallEvent[]
}

interface Match {
  id: string
  title?: string
  homeTeam: {
    id: string
    name: string
    shortName: string
  }
  awayTeam: {
    id: string
    name: string
    shortName: string
  }
  status: string
  scheduledDate: string
  matchFormat: string
  oversPerInnings: number
  innings: Inning[]
}

interface LiveScoringProps {
  matchId: string
}

export function LiveScoring({ matchId }: LiveScoringProps) {
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [currentInning, setCurrentInning] = useState(1)
  const [currentOver, setCurrentOver] = useState(0)
  const [currentBall, setCurrentBall] = useState(0)
  const [selectedEvent, setSelectedEvent] = useState('0')
  const [customRuns, setCustomRuns] = useState(0)
  const [commentary, setCommentary] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [batsmen, setBatsmen] = useState<Player[]>([])
  const [bowlers, setBowlers] = useState<Player[]>([])
  const [striker, setStriker] = useState('')
  const [nonStriker, setNonStriker] = useState('')
  const [bowler, setBowler] = useState('')

  const BALL_EVENTS = [
    { value: '0', label: 'Dot Ball', runs: 0, wickets: 0 },
    { value: '1', label: 'Single', runs: 1, wickets: 0 },
    { value: '2', label: 'Double', runs: 2, wickets: 0 },
    { value: '3', label: 'Triple', runs: 3, wickets: 0 },
    { value: '4', label: 'Boundary', runs: 4, wickets: 0 },
    { value: '6', label: 'Six', runs: 6, wickets: 0 },
    { value: 'W', label: 'Wicket', runs: 0, wickets: 1 },
    { value: 'WD', label: 'Wide', runs: 1, wickets: 0 },
    { value: 'NB', label: 'No Ball', runs: 1, wickets: 0 },
    { value: 'LB', label: 'Leg Bye', runs: 1, wickets: 0 },
    { value: 'BY', label: 'Bye', runs: 1, wickets: 0 },
    { value: 'CB', label: 'Carry', runs: 1, wickets: 0 },
  ]

  useEffect(() => {
    fetchMatchData()
    fetchPlayers()
  }, [matchId])

  const fetchMatchData = async () => {
    try {
      const response = await fetch(`/api/scoring/match/${matchId}`)
      if (response.ok) {
        const data = await response.json()
        setMatch(data)
        if (data.innings.length > 0) {
          const latestInning = data.innings[data.innings.length - 1]
          setCurrentInning(parseInt(latestInning.inning))
          setCurrentOver(latestInning.overs)
          setCurrentBall(latestInning.balls % 6)
          setStriker(latestInning.strikerId || '')
          setNonStriker(latestInning.nonStrikerId || '')
          setBowler(latestInning.bowlerId || '')
        }
      }
    } catch (error) {
      console.error('Error fetching match data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players')
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.players)
        setBatsmen(data.players.filter((p: Player) => p.role !== 'BOWLER'))
        setBowlers(data.players.filter((p: Player) => p.role === 'BOWLER' || p.role === 'ALL_ROUNDER'))
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const recordBall = async () => {
    if (!match || !striker || !bowler) return

    try {
      const eventData = {
        matchId,
        inning: currentInning.toString(),
        over: currentOver,
        ball: currentBall,
        batsmanId: striker,
        bowlerId: bowler,
        nonStrikerId: nonStriker || undefined,
        event: selectedEvent,
        runs: selectedEvent === '0' ? 0 : (selectedEvent === 'W' ? 0 : customRuns),
        wickets: selectedEvent === 'W' ? 1 : 0,
        commentary: commentary || undefined,
      }

      const response = await fetch('/api/scoring/ball', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        // Reset for next ball
        setCurrentBall(currentBall + 1)
        if (currentBall + 1 >= 6) {
          setCurrentOver(currentOver + 1)
          setCurrentBall(0)
        }
        setCommentary('')
        setCustomRuns(0)
        
        // Refresh match data
        fetchMatchData()
      }
    } catch (error) {
      console.error('Error recording ball:', error)
    }
  }

  const toggleLiveStatus = async () => {
    if (!match) return

    try {
      const newStatus = isLive ? 'ACCEPTED' : 'LIVE'
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setIsLive(!isLive)
        fetchMatchData()
      }
    } catch (error) {
      console.error('Error toggling live status:', error)
    }
  }

  const shareScore = async () => {
    if (!match) return

    const currentInningData = match.innings.find(i => i.inning === currentInning.toString())
    const scoreText = currentInningData 
      ? `${currentInningData.battingTeam.shortName}: ${currentInningData.runs}/${currentInningData.wickets} (${currentInningData.overs}.${currentInningData.balls})`
      : 'Match not started'

    const shareText = `🏏 Live Score: ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}\n${scoreText}\n#StreetCricketPro`
    
    if (navigator.share) {
      await navigator.share({
        title: 'Live Cricket Score',
        text: shareText,
      })
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareText)
      alert('Score copied to clipboard!')
    }
  }

  const getRunRate = (runs: number, overs: number, balls: number) => {
    const totalBalls = overs * 6 + balls
    return totalBalls > 0 ? ((runs / totalBalls) * 6).toFixed(2) : '0.00'
  }

  const getProjectedScore = (runs: number, overs: number, balls: number, targetOvers: number) => {
    const totalBalls = overs * 6 + balls
    if (totalBalls === 0) return 0
    const runRate = (runs / totalBalls) * 6
    return Math.round(runRate * targetOvers)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!match) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Match not found</h3>
          <p className="text-gray-600">The match you're looking for doesn't exist.</p>
        </CardContent>
      </Card>
    )
  }

  const currentInningData = match.innings.find(i => i.inning === currentInning.toString())
  const totalRuns = currentInningData?.runs || 0
  const totalWickets = currentInningData?.wickets || 0
  const totalOvers = currentInningData?.overs || 0
  const totalBalls = currentInningData?.balls || 0

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {match.homeTeam.shortName} vs {match.awayTeam.shortName}
              </CardTitle>
              <CardDescription>
                {match.title || 'Live Match'} • {match.matchFormat} • {match.oversPerInnings} overs
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={isLive ? "bg-red-100 text-red-800 animate-pulse" : "bg-gray-100 text-gray-800"}>
                {isLive ? '🔴 LIVE' : match.status}
              </Badge>
              <Button
                variant={isLive ? "destructive" : "default"}
                size="sm"
                onClick={toggleLiveStatus}
              >
                {isLive ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Start Live
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={shareScore}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {currentInningData?.battingTeam.shortName} - Inning {currentInning}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-green-600">
                {totalRuns}/{totalWickets}
              </div>
              <div className="text-lg text-gray-600">
                ({totalOvers}.{totalBalls} ov)
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Run Rate</p>
                  <p className="font-semibold">{getRunRate(totalRuns, totalOvers, totalBalls)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Projected</p>
                  <p className="font-semibold">
                    {getProjectedScore(totalRuns, totalOvers, totalBalls, match.oversPerInnings)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Over</Label>
                  <div className="text-2xl font-bold">{currentOver}.{currentBall}</div>
                </div>
                <div>
                  <Label>Ball</Label>
                  <div className="text-2xl font-bold">{currentBall + 1}/6</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Striker</Label>
                  <Select value={striker} onValueChange={setStriker}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select striker" />
                    </SelectTrigger>
                    <SelectContent>
                      {batsmen.map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name} ({player.jerseyNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Non-Striker</Label>
                  <Select value={nonStriker} onValueChange={setNonStriker}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select non-striker" />
                    </SelectTrigger>
                    <SelectContent>
                      {batsmen.map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name} ({player.jerseyNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bowler</Label>
                  <Select value={bowler} onValueChange={setBowler}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bowler" />
                    </SelectTrigger>
                    <SelectContent>
                      {bowlers.map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name} ({player.jerseyNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scoring Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Ball Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Quick Events */}
            <div className="grid grid-cols-6 gap-2">
              {BALL_EVENTS.filter(event => !['WD', 'NB', 'LB', 'BY', 'CB'].includes(event.value)).map(event => (
                <Button
                  key={event.value}
                  variant={selectedEvent === event.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedEvent(event.value)
                    if (event.value !== '0' && event.value !== 'W') {
                      setCustomRuns(event.runs)
                    }
                  }}
                  className="h-12"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">{event.value}</div>
                    <div className="text-xs">{event.label}</div>
                  </div>
                </Button>
              ))}
            </div>

            {/* Extras */}
            <div className="grid grid-cols-5 gap-2">
              {BALL_EVENTS.filter(event => ['WD', 'NB', 'LB', 'BY', 'CB'].includes(event.value)).map(event => (
                <Button
                  key={event.value}
                  variant={selectedEvent === event.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedEvent(event.value)}
                  className="h-10"
                >
                  <div className="text-center">
                    <div className="font-bold">{event.value}</div>
                    <div className="text-xs">{event.label}</div>
                  </div>
                </Button>
              ))}
            </div>

            {/* Custom Runs */}
            {(selectedEvent === '1' || selectedEvent === '2' || selectedEvent === '3' || selectedEvent === '4' || selectedEvent === '6') && (
              <div className="flex items-center space-x-2">
                <Label>Custom Runs:</Label>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomRuns(Math.max(0, customRuns - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={customRuns}
                    onChange={(e) => setCustomRuns(parseInt(e.target.value) || 0)}
                    className="w-20 text-center"
                    min="0"
                    max="10"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomRuns(customRuns + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Commentary */}
            <div>
              <Label>Commentary (Optional)</Label>
              <Input
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                placeholder="Add commentary for this ball..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button 
                onClick={recordBall}
                disabled={!isLive || !striker || !bowler}
                className="bg-green-600 hover:bg-green-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Record Ball
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedEvent('0')
                  setCustomRuns(0)
                  setCommentary('')
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Balls */}
      {currentInningData && currentInningData.ballEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Balls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {currentInningData.ballEvents.slice(-10).reverse().map((ball, index) => (
                <div key={ball.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600">
                      {ball.over}.{ball.ball}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {ball.event}
                    </Badge>
                    {ball.runs > 0 && (
                      <span className="font-bold text-green-600">+{ball.runs}</span>
                    )}
                    {ball.wickets > 0 && (
                      <span className="font-bold text-red-600">W</span>
                    )}
                  </div>
                  {ball.commentary && (
                    <span className="text-sm text-gray-600 italic">{ball.commentary}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}