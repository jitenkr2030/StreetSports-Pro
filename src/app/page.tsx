'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  IndianRupee, 
  Target,
  TrendingUp,
  Video,
  Gamepad2
} from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">StreetSports Pro</h1>
                <p className="text-sm text-gray-600">Multi-Sport Challenge Marketplace</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                Login
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Register Team
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
            🏆 Multi-Sport Challenge Marketplace
          </Badge>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Challenge Any Team. Play Any Sport.
            <span className="text-blue-600"> Win Real Money.</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Just like Uber connects drivers & riders, StreetSports Pro connects Team vs Team in any sport. 
            Cricket, Football, Badminton, Volleyball & more with real cash prizes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Trophy className="w-5 h-5 mr-2" />
              Create Your Team
            </Button>
            <Button size="lg" variant="outline">
              <Calendar className="w-5 h-5 mr-2" />
              Browse Matches
            </Button>
          </div>
        </div>
      </section>

      {/* Sports Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Sports You Can Play</h3>
            <p className="text-gray-600">Professional competition across multiple sports</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <div className="text-4xl mb-2">🏏</div>
                <CardTitle className="text-lg">Cricket</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">T10, T20, T30 formats</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="text-4xl mb-2">⚽</div>
                <CardTitle className="text-lg">Football</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">5-a-side, 7-a-side, 11-a-side</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="text-4xl mb-2">🏸</div>
                <CardTitle className="text-lg">Badminton</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Singles, Doubles, Mixed</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="text-4xl mb-2">🏐</div>
                <CardTitle className="text-lg">Volleyball</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Indoor & Beach</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Core Features</h3>
            <p className="text-gray-600">Everything you need for professional sports management</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Multi-Sport Teams</CardTitle>
                <CardDescription>Create professional team profiles for any sport</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Sport-specific player stats</li>
                  <li>• Team verification badges</li>
                  <li>• Area-based rankings</li>
                  <li>• Cross-sport leaderboards</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Target className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>Sport Challenges</CardTitle>
                <CardDescription>Challenge teams in any sport or accept open challenges</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Cricket, Football, Badminton, Volleyball</li>
                  <li>• Set date, time & venue</li>
                  <li>• Sport-specific formats</li>
                  <li>• Instant accept option</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <IndianRupee className="w-8 h-8 text-yellow-600 mb-2" />
                <CardTitle>Sport Prize Pools</CardTitle>
                <CardDescription>Real cash prizes for all sports with secure payments</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Cricket: ₹10,000 entry</li>
                  <li>• Football: ₹8,000 entry</li>
                  <li>• Badminton: ₹3,000 entry</li>
                  <li>• 10% platform commission</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle>Multi-Sport Venues</CardTitle>
                <CardDescription>Cricket grounds, football turfs, badminton courts & more</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• All sport venue types</li>
                  <li>• Real-time availability</li>
                  <li>• Best price guarantee</li>
                  <li>• 5-15% commission earnings</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-red-600 mb-2" />
                <CardTitle>Live Scoring</CardTitle>
                <CardDescription>Sport-specific live scoring with real-time updates</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Cricket: Ball-by-ball</li>
                  <li>• Football: Goals & assists</li>
                  <li>• Badminton: Set scoring</li>
                  <li>• WhatsApp sharing</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Trophy className="w-8 h-8 text-orange-600 mb-2" />
                <CardTitle>Multi-Sport Rankings</CardTitle>
                <CardDescription>Cross-sport leaderboards and area rankings</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Janakpuri Sports Ranking</li>
                  <li>• Dwarka Sports Ranking</li>
                  <li>• Cross-sport leaderboards</li>
                  <li>• Tournament championships</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Media & Coverage Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Media & Coverage System</h3>
            <p className="text-gray-600">Professional coverage for all sports</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Video className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Independent Journalists</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Local journalists can cover matches across all sports - Cricket, Football, Badminton, Volleyball.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-green-600 font-bold">📸</span>
                </div>
                <CardTitle>Local Creator Partnerships</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Content creators can produce match highlights, tournament coverage, and team profiles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-red-600 mb-2" />
                <CardTitle>Viral Content Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Local rivalries, women's tournaments, and league matches create shareable content.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Challenge Any Team in Any Sport?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join serious sports teams in your area, compete in professional matches across Cricket, Football, 
            Badminton, Volleyball, and win real cash prizes. This is not recreational sports - this is professional competition.
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
            Register Your Team Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Gamepad2 className="w-6 h-6" />
                <span className="font-bold">StreetSports Pro</span>
              </div>
              <p className="text-gray-400 text-sm">
                Multi-sport challenge marketplace for serious teams in Delhi NCR.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Create Team</a></li>
                <li><a href="#" className="hover:text-white">Browse Matches</a></li>
                <li><a href="#" className="hover:text-white">Tournaments</a></li>
                <li><a href="#" className="hover:text-white">Venues</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Rules & Guidelines</a></li>
                <li><a href="#" className="hover:text-white">Dispute Resolution</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Payment Policy</a></li>
                <li><a href="#" className="hover:text-white">Fair Play Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 StreetSports Pro. All rights reserved. Challenge Any Team. Play Any Sport. Win Real Money.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}