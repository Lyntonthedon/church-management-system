// test-db.js
const { PrismaClient } = require('@prisma/client')

async function test() {
  console.log('Testing database connection...')
  
  try {
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log('✅ Connected to database!')
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT NOW() as time`
    console.log('Database time:', result[0].time)
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

test()