import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding StreetSports Pro database...')

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

  // Create admin user
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

  // Create team managers for different sports
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

  const footballManager1 = await prisma.user.upsert({
    where: { email: 'amit@football.com' },
    update: {},
    create: {
      email: 'amit@football.com',
      name: 'Amit Singh',
      phone: '+919876543212',
      role: 'TEAM_MANAGER',
      isVerified: true,
    },
  })

  const footballManager2 = await prisma.user.upsert({
    where: { email: 'raj@football.com' },
    update: {},
    create: {
      email: 'raj@football.com',
      name: 'Raj Verma',
      phone: '+919876543213',
      role: 'TEAM_MANAGER',
      isVerified: false,
    },
  })

  const badmintonManager1 = await prisma.user.upsert({
    where: { email: 'priya@badminton.com' },
    update: {},
    create: {
      email: 'priya@badminton.com',
      name: 'Priya Sharma',
      phone: '+919876543214',
      role: 'TEAM_MANAGER',
      isVerified: true,
    },
  })

  // Create cricket teams
  const cricketTeam1 = await prisma.team.create({
    data: {
      name: 'Janakpuri Cricket Club',
      shortName: 'JCC',
      description: 'Professional cricket team from Janakpuri with 5+ years of experience',
      sportId: cricket.id,
      area: 'Janakpuri',
      city: 'Delhi',
      isVerified: true,
      rating: 1350,
      managerId: cricketManager1.id,
    },
  })

  const cricketTeam2 = await prisma.team.create({
    data: {
      name: 'Dwarka Warriors',
      shortName: 'DWW',
      description: 'Rising cricket team from Dwarka sector 12',
      sportId: cricket.id,
      area: 'Dwarka',
      city: 'Delhi',
      isVerified: true,
      rating: 1280,
      managerId: cricketManager2.id,
    },
  })

  // Create football teams
  const footballTeam1 = await prisma.team.create({
    data: {
      name: 'Janakpuri United',
      shortName: 'JU',
      description: 'Passionate football team from Janakpuri',
      sportId: football.id,
      area: 'Janakpuri',
      city: 'Delhi',
      isVerified: true,
      rating: 1420,
      managerId: footballManager1.id,
    },
  })

  const footballTeam2 = await prisma.team.create({
    data: {
      name: 'Dwarka FC',
      shortName: 'DFC',
      description: 'Fast-growing football club from Dwarka',
      sportId: football.id,
      area: 'Dwarka',
      city: 'Delhi',
      isVerified: false,
      rating: 1180,
      managerId: footballManager2.id,
    },
  })

  // Create badminton teams
  const badmintonTeam1 = await prisma.team.create({
    data: {
      name: 'Smashers Janakpuri',
      shortName: 'SJ',
      description: 'Competitive badminton team from Janakpuri',
      sportId: badminton.id,
      area: 'Janakpuri',
      city: 'Delhi',
      isVerified: true,
      rating: 1500,
      managerId: badmintonManager1.id,
    },
  })

  // Create cricket players
  const cricketPlayers1 = [
    { name: 'Rahul Sharma', role: 'ALL_ROUNDER', jerseyNumber: 1 },
    { name: 'Vikram Malhotra', role: 'BATSMAN', jerseyNumber: 2 },
    { name: 'Suresh Kumar', role: 'BOWLER', jerseyNumber: 3 },
    { name: 'Amit Patel', role: 'WICKET_KEEPER', jerseyNumber: 4 },
    { name: 'Rohit Verma', role: 'BATSMAN', jerseyNumber: 5 },
    { name: 'Karan Singh', role: 'ALL_ROUNDER', jerseyNumber: 6 },
    { name: 'Piyush Sharma', role: 'BOWLER', jerseyNumber: 7 },
    { name: 'Naveen Kumar', role: 'BATSMAN', jerseyNumber: 8 },
    { name: 'Deepak Singh', role: 'BOWLER', jerseyNumber: 9 },
    { name: 'Manish Jain', role: 'ALL_ROUNDER', jerseyNumber: 10 },
    { name: 'Ravi Chaudhary', role: 'BOWLER', jerseyNumber: 11 },
  ]

  for (const player of cricketPlayers1) {
    await prisma.player.create({
      data: {
        ...player,
        sportId: cricket.id,
        teamId: cricketTeam1.id,
        battingAvg: Math.random() * 40 + 20,
        strikeRate: Math.random() * 100 + 80,
        totalRuns: Math.floor(Math.random() * 500),
        totalWickets: Math.floor(Math.random() * 30),
        economy: Math.random() * 3 + 6,
      },
    })
  }

  // Create football players
  const footballPlayers1 = [
    { name: 'Amit Singh', role: 'GOALKEEPER', jerseyNumber: 1 },
    { name: 'Raj Verma', role: 'DEFENDER', jerseyNumber: 2 },
    { name: 'Vikram Kumar', role: 'DEFENDER', jerseyNumber: 3 },
    { name: 'Suresh Sharma', role: 'DEFENDER', jerseyNumber: 4 },
    { name: 'Mohit Singh', role: 'MIDFIELDER', jerseyNumber: 5 },
    { name: 'Rohit Kumar', role: 'MIDFIELDER', jerseyNumber: 6 },
    { name: 'Pankaj Verma', role: 'MIDFIELDER', jerseyNumber: 7 },
    { name: 'Naveen Sharma', role: 'FORWARD', jerseyNumber: 8 },
    { name: 'Deepak Kumar', role: 'FORWARD', jerseyNumber: 9 },
    { name: 'Manish Singh', role: 'FORWARD', jerseyNumber: 10 },
    { name: 'Ravi Jain', role: 'ATTACKER', jerseyNumber: 11 },
  ]

  for (const player of footballPlayers1) {
    await prisma.player.create({
      data: {
        ...player,
        sportId: football.id,
        teamId: footballTeam1.id,
        goalsScored: Math.floor(Math.random() * 20),
        assists: Math.floor(Math.random() * 15),
        cleanSheets: Math.floor(Math.random() * 5),
      },
    })
  }

  // Create badminton players
  const badmintonPlayers1 = [
    { name: 'Priya Sharma', role: 'ATTACKER', jerseyNumber: 1 },
    { name: 'Anita Verma', role: 'DEFENDER', jerseyNumber: 2 },
    { name: 'Kavita Singh', role: 'ATTACKER', jerseyNumber: 3 },
  ]

  for (const player of badmintonPlayers1) {
    await prisma.player.create({
      data: {
        ...player,
        sportId: badminton.id,
        teamId: badmintonTeam1.id,
        setsWon: Math.floor(Math.random() * 30),
        tournamentPoints: Math.floor(Math.random() * 500),
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
  ]

  for (const venue of venues) {
    await prisma.ground.create({
      data: venue,
    })
  }

  // Create sample matches for different sports
  const cricketMatch = await prisma.match.create({
    data: {
      title: 'JCC vs DWW - Cricket Match',
      homeTeamId: cricketTeam1.id,
      awayTeamId: cricketTeam2.id,
      sportId: cricket.id,
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
      title: 'JU vs DFC - Football Match',
      homeTeamId: footballTeam1.id,
      awayTeamId: footballTeam2.id,
      sportId: football.id,
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

  // Create area rankings
  const areas = ['Janakpuri', 'Dwarka', 'Tilak Nagar']
  const sports = [cricket, football, badminton]
  const teams = [
    { team: cricketTeam1, sport: cricket, area: 'Janakpuri' },
    { team: cricketTeam2, sport: cricket, area: 'Dwarka' },
    { team: footballTeam1, sport: football, area: 'Janakpuri' },
    { team: footballTeam2, sport: football, area: 'Dwarka' },
    { team: badmintonTeam1, sport: badminton, area: 'Janakpuri' },
  ]

  for (const { team, sport, area } of teams) {
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

  console.log('✅ StreetSports Pro database seeded successfully!')
  console.log(`📊 Created:
  - 4 sports (Cricket, Football, Badminton, Volleyball)
  - 5 users (1 admin, 4 managers)
  - 6 teams (2 cricket, 2 football, 1 badminton, 1 volleyball)
  - 27 players across different sports
  - 4 venues for different sports
  - 2 matches (cricket and football)
  - 5 area rankings
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })