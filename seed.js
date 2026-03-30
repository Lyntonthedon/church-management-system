// prisma/seed.js (or seed.js in root)
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// ✅ CRITICAL: No arguments here in Prisma 7!
const prisma = new PrismaClient()

async function seed() {
  try {
    console.log('🌱 Starting seeding...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Your existing seeding logic here
    // Example:
    // const adminPassword = await bcrypt.hash('admin123', 10)
    // await prisma.user.upsert({
    //   where: { email: 'admin@example.com' },
    //   update: {},
    //   create: {
    //     email: 'admin@example.com',
    //     password: adminPassword,
    //     role: 'ADMIN',
    //   },
    // })
    
    console.log('✅ Seeding completed successfully')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seed()
  .catch((error) => {
    console.error('Fatal error during seeding:', error)
    process.exit(1)
  })