import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating comprehensive demo data for StreetSports Pro...')

  // Create sports
  const cricket = await prisma.sport.upsert({
    where: { name: 'Cricket' },
    update: {},
    create: {
      name: 'Cricket',
      icon: '🏏',
      description: 'Professional cricket with T10, T20, T30 formats',
      minPlayers: 11,
      maxPlayers: 15,
      phase: 'PHASE_1',
    },
  })

  const football = await prisma.sport.upsert({
    where: { name: 'Football' },
    update: {},
    create: {
      name: 'Football',
      icon: '⚽',
      description: '5-a-side, 7-a-side, 11-a-side football',
      minPlayers: 5,
      maxPlayers: 11,
      phase: 'PHASE_1',
    },
  })

  const badminton = await prisma.sport.upsert({
    where: { name: 'Badminton' },
    update: {},
    create: {
      name: 'Badminton',
      icon: '🏸',
      description: 'Singles, doubles, and mixed doubles badminton',
      minPlayers: 1,
      maxPlayers: 2,
      phase: 'PHASE_1',
    },
  })

  const volleyball = await prisma.sport.upsert({
    where: { name: 'Volleyball' },
    update: {},
    create: {
      name: 'Volleyball',
      icon: '🏐',
      description: 'Indoor and beach volleyball',
      minPlayers: 6,
      maxPlayers: 6,
      phase: 'PHASE_1',
    },
  })

  // Create admin and manager users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@streetsports.pro' },
    update: {},
    create: {
      email: 'admin@streetsports.pro',
      name: 'Admin User',
      role: 'ADMIN',
      isVerified: true,
    },
  })

  // Cricket managers
  const cricketManager1 = await prisma.user.upsert({
    where: { email: 'rahul@cricket.com' },
    update: {},
    create: {
      email: 'rahul@cricket.com',
      name: 'Rahul Sharma',
      phone: '+919876543210',
      role: 'TEAM_MANAGER',
      isVerified: true,
    },
  })

  const cricketManager2 = await prisma.user.upsert({
    where: { email: 'vijay@cricket.com' },
    update: {},
    create: {
      email: 'vijay@cricket.com',
      name: 'Vijay Kumar',
      phone: '+919876543211',
      role: 'TEAM_MANAGER',
      isVerified: true,
    },
  })

  const cricketManager3 = await prisma.user.upsert({
    where: { email: 'amit@cricket.com' },
    update: {},
    create: {
      email: 'amit@cricket.com',
      name: 'Amit Singh',
      phone: '+919876543222',
      role: 'TEAM_MANAGER',
      isVerified: false,
    },
  })

  // Football managers
  const footballManager1 = await prisma.user.upsert({
    where: { email: 'raj@football.com' },
    update: {},
    create: {
      email: 'raj@football.com',
      name: 'Raj Verma',
      phone: '+919876543223',
      role: 'TEAM_MANAGER',
      isVerified: true,
    },
  })

  const footballManager2 = await prisma.user.upsert({
    where: { email: 'karim@football.com' },
    update: {},
    create: {
      email: 'karim@football.com',
      name: 'Karim Khan',
      phone: '+919876543224',
      role: 'TEAM_MANAGER',
      isVerified: true,
    },
  })

  // Badminton managers
  const badmintonManager1 = await prisma.user.upsert({
    where: { email: 'priya@badminton.com' },
    update: {},
    create: {
      email: 'priya@badminton.com',
      name: 'Priya Sharma',
      phone: '+919876543225',
      role: 'TEAM_MANAGER',
      isVerified: true,
    },
  })

  const badmintonManager2 = await prisma.user.upsert({
    where: { email: 'sneha@badminton.com' },
    update: {},
    create: {
      email: 'sneha@badminton.com',
      name: 'Sneha Patel',
      phone: '+919876543226',
      role: 'TEAM_MANAGER',
      isVerified: false,
    },
  })

  // Volleyball managers
  const volleyballManager1 = await prisma.user.upsert({
    where: { email: 'anil@volleyball.com' },
    update: {},
    create: {
      email: 'anil@volleyball.com',
      name: 'Anil Kumar',
      phone: '+919876543227',
      role: 'TEAM_MANAGER',
      isVerified: true,
    },
  })

  // Create Cricket Teams
  const cricketTeams = [
    {
      name: 'Janakpuri Cricket Club',
      shortName: 'JCC',
      description: 'Professional cricket team from Janakpuri with 5+ years of experience',
      area: 'Janakpuri',
      isVerified: true,
      rating: 1350,
      managerId: cricketManager1.id,
    },
    {
      name: 'Dwarka Warriors',
      shortName: 'DWW',
      description: 'Rising cricket team from Dwarka sector 12',
      area: 'Dwarka',
      isVerified: true,
      rating: 1280,
      managerId: cricketManager2.id,
    },
    {
      name: 'Tilak Nagar Titans',
      shortName: 'TNT',
      description: 'Aggressive young team from Tilak Nagar',
      area: 'Tilak Nagar',
      isVerified: false,
      rating: 1150,
      managerId: cricketManager3.id,
    },
  ]

  const createdCricketTeams = []
  for (const teamData of cricketTeams) {
    const team = await prisma.team.create({
      data: {
        ...teamData,
        sportId: cricket.id,
        city: 'Delhi',
      },
    })
    createdCricketTeams.push(team)
  }

  // Create Football Teams
  const footballTeams = [
    {
      name: 'Janakpuri United',
      shortName: 'JU',
      description: 'Passionate football team from Janakpuri',
      area: 'Janakpuri',
      isVerified: true,
      rating: 1420,
      managerId: footballManager1.id,
    },
    {
      name: 'Dwarka FC',
      shortName: 'DFC',
      description: 'Fast-growing football club from Dwarka',
      area: 'Dwarka',
      isVerified: false,
      rating: 1180,
      managerId: footballManager2.id,
    },
  ]

  const createdFootballTeams = []
  for (const teamData of footballTeams) {
    const team = await prisma.team.create({
      data: {
        ...teamData,
        sportId: football.id,
        city: 'Delhi',
      },
    })
    createdFootballTeams.push(team)
  }

  // Create Badminton Teams
  const badmintonTeams = [
    {
      name: 'Smashers Janakpuri',
      shortName: 'SJ',
      description: 'Competitive badminton team from Janakpuri',
      area: 'Janakpuri',
      isVerified: true,
      rating: 1500,
      managerId: badmintonManager1.id,
    },
    {
      name: 'Dwarka Racquets',
      shortName: 'DR',
      description: 'Skilled badminton players from Dwarka',
      area: 'Dwarka',
      isVerified: false,
      rating: 1250,
      managerId: badmintonManager2.id,
    },
  ]

  const createdBadmintonTeams = []
  for (const teamData of badmintonTeams) {
    const team = await prisma.team.create({
      data: {
        ...teamData,
        sportId: badminton.id,
        city: 'Delhi',
      },
    })
    createdBadmintonTeams.push(team)
  }

  // Create Volleyball Teams
  const volleyballTeams = [
    {
      name: 'Janakpuri Spikers',
      shortName: 'JS',
      description: 'Powerful volleyball team from Janakpuri',
      area: 'Janakpuri',
      isVerified: true,
      rating: 1380,
      managerId: volleyballManager1.id,
    },
  ]

  const createdVolleyballTeams = []
  for (const teamData of volleyballTeams) {
    const team = await prisma.team.create({
      data: {
        ...teamData,
        sportId: volleyball.id,
        city: 'Delhi',
      },
    })
    createdVolleyballTeams.push(team)
  }

  // Create Cricket Players
  const cricketPlayers1 = [
    { name: 'Rahul Sharma', role: 'ALL_ROUNDER', jerseyNumber: 1, battingAvg: 45.2, strikeRate: 135.5, totalRuns: 1250, totalWickets: 45, economy: 7.2 },
    { name: 'Vikram Malhotra', role: 'BATSMAN', jerseyNumber: 2, battingAvg: 38.5, strikeRate: 125.3, totalRuns: 980, totalWickets: 0, economy: 0 },
    { name: 'Suresh Kumar', role: 'BOWLER', jerseyNumber: 3, battingAvg: 15.2, strikeRate: 85.5, totalRuns: 320, totalWickets: 68, economy: 6.8 },
    { name: 'Amit Patel', role: 'WICKET_KEEPER', jerseyNumber: 4, battingAvg: 42.1, strikeRate: 118.9, totalRuns: 1100, totalWickets: 0, economy: 0 },
    { name: 'Rohit Verma', role: 'BATSMAN', jerseyNumber: 5, battingAvg: 35.8, strikeRate: 142.1, totalRuns: 890, totalWickets: 0, economy: 0 },
    { name: 'Karan Singh', role: 'ALL_ROUNDER', jerseyNumber: 6, battingAvg: 28.5, strikeRate: 128.7, totalRuns: 650, totalWickets: 35, economy: 7.5 },
    { name: 'Piyush Sharma', role: 'BOWLER', jerseyNumber: 7, battingAvg: 12.3, strikeRate: 78.2, totalRuns: 180, totalWickets: 72, economy: 6.5 },
    { name: 'Naveen Kumar', role: 'BATSMAN', jerseyNumber: 8, battingAvg: 32.1, strikeRate: 135.8, totalRuns: 720, totalWickets: 0, economy: 0 },
    { name: 'Deepak Singh', role: 'BOWLER', jerseyNumber: 9, battingAvg: 18.7, strikeRate: 92.3, totalRuns: 280, totalWickets: 58, economy: 7.8 },
    { name: 'Manish Jain', role: 'ALL_ROUNDER', jerseyNumber: 10, battingAvg: 25.4, strikeRate: 118.5, totalRuns: 580, totalWickets: 28, economy: 8.1 },
    { name: 'Ravi Chaudhary', role: 'BOWLER', jerseyNumber: 11, battingAvg: 8.9, strikeRate: 65.4, totalRuns: 120, totalWickets: 85, economy: 6.2 },
  ]

  for (const player of cricketPlayers1) {
    await prisma.player.create({
      data: {
        ...player,
        sportId: cricket.id,
        teamId: createdCricketTeams[0].id,
      },
    })
  }

  // Create Football Players
  const footballPlayers1 = [
    { name: 'Raj Verma', role: 'GOALKEEPER', jerseyNumber: 1, goalsScored: 0, assists: 0, cleanSheets: 12 },
    { name: 'Vikram Kumar', role: 'DEFENDER', jerseyNumber: 2, goalsScored: 3, assists: 2, cleanSheets: 0 },
    { name: 'Suresh Sharma', role: 'DEFENDER', jerseyNumber: 3, goalsScored: 2, assists: 4, cleanSheets: 0 },
    { name: 'Mohit Singh', role: 'DEFENDER', jerseyNumber: 4, goalsScored: 1, assists: 3, cleanSheets: 0 },
    { name: 'Rohit Kumar', role: 'MIDFIELDER', jerseyNumber: 5, goalsScored: 8, assists: 12, cleanSheets: 0 },
    { name: 'Pankaj Verma', role: 'MIDFIELDER', jerseyNumber: 6, goalsScored: 6, assists: 8, cleanSheets: 0 },
    { name: 'Naveen Sharma', role: 'MIDFIELDER', jerseyNumber: 7, goalsScored: 10, assists: 15, cleanSheets: 0 },
    { name: 'Deepak Kumar', role: 'FORWARD', jerseyNumber: 8, goalsScored: 18, assists: 6, cleanSheets: 0 },
    { name: 'Manish Singh', role: 'FORWARD', jerseyNumber: 9, goalsScored: 22, assists: 4, cleanSheets: 0 },
    { name: 'Ravi Jain', role: 'ATTACKER', jerseyNumber: 10, goalsScored: 25, assists: 8, cleanSheets: 0 },
    { name: 'Amit Kumar', role: 'FORWARD', jerseyNumber: 11, goalsScored: 15, assists: 10, cleanSheets: 0 },
  ]

  for (const player of footballPlayers1) {
    await prisma.player.create({
      data: {
        ...player,
        sportId: football.id,
        teamId: createdFootballTeams[0].id,
      },
    })
  }

  // Create Badminton Players
  const badmintonPlayers1 = [
    { name: 'Priya Sharma', role: 'ATTACKER', jerseyNumber: 1, setsWon: 45, tournamentPoints: 890 },
    { name: 'Anita Verma', role: 'DEFENDER', jerseyNumber: 2, setsWon: 38, tournamentPoints: 720 },
  ]

  for (const player of badmintonPlayers1) {
    await prisma.player.create({
      data: {
        ...player,
        sportId: badminton.id,
        teamId: createdBadmintonTeams[0].id,
      },
    })
  }

  // Create Volleyball Players
  const volleyballPlayers1 = [
    { name: 'Anil Kumar', role: 'MIDDLE_BLOCKER', jerseyNumber: 1, setsWon: 28, tournamentPoints: 450 },
    { name: 'Rajesh Singh', role: 'OUTSIDE_HITTER', jerseyNumber: 2, setsWon: 32, tournamentPoints: 520 },
    { name: 'Vikram Sharma', role: 'SETTER', jerseyNumber: 3, setsWon: 25, tournamentPoints: 380 },
    { name: 'Mohit Kumar', role: 'OPPONENT', jerseyNumber: 4, setsWon: 30, tournamentPoints: 480 },
    { name: 'Amit Verma', role: 'LIBERO', jerseyNumber: 5, setsWon: 22, tournamentPoints: 320 },
    { name: 'Suresh Singh', role: 'MIDDLE_BLOCKER', jerseyNumber: 6, setsWon: 26, tournamentPoints: 410 },
  ]

  for (const player of volleyballPlayers1) {
    await prisma.player.create({
      data: {
        ...player,
        sportId: volleyball.id,
        teamId: createdVolleyballTeams[0].id,
      },
    })
  }

  // Create venues for different sports
  const venues = [
    // Cricket venues
    {
      name: 'Janakpuri Sports Complex - Cricket',
      address: 'Block C2, Janakpuri, New Delhi',
      area: 'Janakpuri',
      sportId: cricket.id,
      pricePerSlot: 1500,
      surfaceType: 'Turf',
      hasFloodlights: true,
      hasPavilion: true,
      hasNets: true,
      hasGoals: false,
      hasNet: false,
      capacity: 200,
      description: 'Premium turf cricket ground with floodlights and pavilion',
    },
    {
      name: 'Dwarka Sector 12 Cricket Ground',
      address: 'Sector 12, Dwarka, New Delhi',
      area: 'Dwarka',
      sportId: cricket.id,
      pricePerSlot: 1200,
      surfaceType: 'Matting',
      hasFloodlights: false,
      hasPavilion: true,
      hasNets: true,
      hasGoals: false,
      hasNet: false,
      capacity: 150,
      description: 'Well-maintained matting cricket pitch with pavilion',
    },
    // Football venues
    {
      name: 'Janakpuri Football Turf',
      address: 'Block A3, Janakpuri, New Delhi',
      area: 'Janakpuri',
      sportId: football.id,
      pricePerSlot: 1200,
      surfaceType: 'Turf',
      hasFloodlights: true,
      hasPavilion: false,
      hasNets: false,
      hasGoals: true,
      hasNet: false,
      capacity: 100,
      description: 'Professional football turf with floodlights',
    },
    {
      name: 'Dwarka Football Arena',
      address: 'Sector 8, Dwarka, New Delhi',
      area: 'Dwarka',
      sportId: football.id,
      pricePerSlot: 1000,
      surfaceType: 'Artificial Grass',
      hasFloodlights: true,
      hasPavilion: false,
      hasNets: false,
      hasGoals: true,
      hasNet: false,
      capacity: 80,
      description: 'Modern football arena with artificial grass',
    },
    // Badminton venues
    {
      name: 'Janakpuri Badminton Court',
      address: 'Community Center, Janakpuri, New Delhi',
      area: 'Janakpuri',
      sportId: badminton.id,
      pricePerSlot: 800,
      surfaceType: 'Hard Court',
      hasFloodlights: true,
      hasPavilion: false,
      hasNets: false,
      hasGoals: false,
      hasNet: true,
      capacity: 50,
      description: 'Indoor badminton court with proper lighting',
    },
    {
      name: 'Dwarka Badminton Hall',
      address: 'Sports Complex, Dwarka, New Delhi',
      area: 'Dwarka',
      sportId: badminton.id,
      pricePerSlot: 900,
      surfaceType: 'Wooden',
      hasFloodlights: true,
      hasPavilion: false,
      hasNets: false,
      hasGoals: false,
      hasNet: true,
      capacity: 60,
      description: 'Professional wooden badminton hall',
    },
    // Volleyball venues
    {
      name: 'Janakpuri Volleyball Court',
      address: 'Sports Ground, Janakpuri, New Delhi',
      area: 'Janakpuri',
      sportId: volleyball.id,
      pricePerSlot: 1000,
      surfaceType: 'Sand',
      hasFloodlights: true,
      hasPavilion: false,
      hasNets: false,
      hasGoals: false,
      hasNet: true,
      capacity: 100,
      description: 'Beach volleyball court with floodlights',
    },
  ]

  const createdVenues = []
  for (const venue of venues) {
    const ground = await prisma.ground.create({
      data: venue,
    })
    createdVenues.push(ground)
  }

  // Create sample matches
  const cricketMatch = await prisma.match.create({
    data: {
      title: 'JCC vs DWW - T20 Championship',
      homeTeamId: createdCricketTeams[0].id,
      awayTeamId: createdCricketTeams[1].id,
      sportId: cricket.id,
      groundId: createdVenues[0].id,
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      scheduledTime: '18:00',
      matchFormat: 'T20',
      status: 'SCHEDULED',
      entryFee: 10000,
      prizePool: 20000,
      platformFee: 2000,
      createdBy: adminUser.id,
    },
  })

  const footballMatch = await prisma.match.create({
    data: {
      title: 'JU vs DFC - Football Derby',
      homeTeamId: createdFootballTeams[0].id,
      awayTeamId: createdFootballTeams[1].id,
      sportId: football.id,
      groundId: createdVenues[2].id,
      scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      scheduledTime: '17:00',
      matchFormat: 'FOOTBALL_7',
      status: 'SCHEDULED',
      entryFee: 8000,
      prizePool: 16000,
      platformFee: 1600,
      createdBy: adminUser.id,
    },
  })

  const badmintonMatch = await prisma.match.create({
    data: {
      title: 'SJ vs DR - Badminton Singles',
      homeTeamId: createdBadmintonTeams[0].id,
      awayTeamId: createdBadmintonTeams[1].id,
      sportId: badminton.id,
      groundId: createdVenues[4].id,
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      scheduledTime: '19:00',
      matchFormat: 'BADMINTON_SINGLES',
      status: 'SCHEDULED',
      entryFee: 3000,
      prizePool: 6000,
      platformFee: 600,
      createdBy: adminUser.id,
    },
  })

  const volleyballMatch = await prisma.match.create({
    data: {
      title: 'JS vs JS - Volleyball Practice Match',
      homeTeamId: createdVolleyballTeams[0].id,
      awayTeamId: createdVolleyballTeams[0].id, // Same team for practice
      sportId: volleyball.id,
      groundId: createdVenues[6].id,
      scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      scheduledTime: '16:00',
      matchFormat: 'VOLLEYBALL_INDOOR',
      status: 'SCHEDULED',
      entryFee: 5000,
      prizePool: 10000,
      platformFee: 1000,
      createdBy: adminUser.id,
    },
  })

  // Create area rankings
  const allTeams = [
    ...createdCricketTeams.map(team => ({ team, sport: cricket, area: team.area })),
    ...createdFootballTeams.map(team => ({ team, sport: football, area: team.area })),
    ...createdBadmintonTeams.map(team => ({ team, sport: badminton, area: team.area })),
    ...createdVolleyballTeams.map(team => ({ team, sport: volleyball, area: team.area })),
  ]

  for (const { team, sport, area } of allTeams) {
    await prisma.areaRanking.create({
      data: {
        area,
        sportId: sport.id,
        teamId: team.id,
        rank: Math.floor(Math.random() * 10) + 1,
        points: Math.floor(Math.random() * 1000) + 500,
        matchesPlayed: Math.floor(Math.random() * 20) + 5,
        matchesWon: Math.floor(Math.random() * 15),
        matchesLost: Math.floor(Math.random() * 10),
        winRate: Math.random() * 0.8 + 0.2,
      },
    })
  }

  // Create tournaments
  const cricketTournament = await prisma.tournament.create({
    data: {
      name: 'Delhi Cricket Championship 2024',
      description: 'Premier cricket tournament for Delhi teams',
      sportId: cricket.id,
      format: 'KNOCKOUT',
      maxTeams: 8,
      entryFee: 15000,
      prizePool: 120000,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: 'UPCOMING',
      createdBy: adminUser.id,
    },
  })

  const footballTournament = await prisma.tournament.create({
    data: {
      name: 'NCR Football League 2024',
      description: 'Competitive football league for NCR teams',
      sportId: football.id,
      format: 'LEAGUE',
      maxTeams: 6,
      entryFee: 10000,
      prizePool: 60000,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: 'UPCOMING',
      createdBy: adminUser.id,
    },
  })

  // Create challenges
  await prisma.challenge.create({
    data: {
      challengingTeamId: createdCricketTeams[0].id,
      challengedTeamId: createdCricketTeams[1].id,
      matchId: cricketMatch.id,
      message: 'Want to play a competitive T20 match this weekend?',
      proposedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      proposedTime: '18:00',
      proposedFormat: 'T20',
      status: 'ACCEPTED',
      respondedAt: new Date(),
    },
  })

  await prisma.challenge.create({
    data: {
      challengingTeamId: createdFootballTeams[0].id,
      message: 'Open challenge for any 7-a-side football team',
      proposedDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      proposedTime: '17:00',
      proposedFormat: 'FOOTBALL_7',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  })

  // Create payments
  await prisma.payment.create({
    data: {
      userId: cricketManager1.id,
      teamId: createdCricketTeams[0].id,
      matchId: cricketMatch.id,
      type: 'MATCH_ENTRY',
      amount: 10000,
      status: 'COMPLETED',
      method: 'UPI',
      transactionId: 'TXN_CRICKET_001',
    },
  })

  await prisma.payment.create({
    data: {
      userId: footballManager1.id,
      teamId: createdFootballTeams[0].id,
      matchId: footballMatch.id,
      type: 'MATCH_ENTRY',
      amount: 8000,
      status: 'COMPLETED',
      method: 'RAZORPAY',
      transactionId: 'TXN_FOOTBALL_001',
    },
  })

  // Create media coverage
  await prisma.mediaCoverage.create({
    data: {
      matchId: cricketMatch.id,
      journalistId: adminUser.id,
      title: 'JCC vs DWW: The Ultimate Cricket Showdown',
      content: 'An exciting match between two top cricket teams in Janakpuri. Both teams have been performing exceptionally well this season.',
      mediaType: 'ARTICLE',
      isPublished: true,
      publishedAt: new Date(),
    },
  })

  console.log('✅ Comprehensive demo data created successfully!')
  console.log(`📊 Created:
  - 4 sports (Cricket, Football, Badminton, Volleyball)
  - 9 users (1 admin, 8 managers)
  - 8 teams (3 cricket, 2 football, 2 badminton, 1 volleyball)
  - 32 players across different sports
  - 7 venues for different sports
  - 4 matches (cricket, football, badminton, volleyball)
  - 2 tournaments
  - 2 challenges
  - 2 payments
  - 1 media coverage
  - 8 area rankings
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error creating demo data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })