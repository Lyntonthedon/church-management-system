// minimal-test.js
console.log('Starting...')

try {
  const { PrismaClient } = require('@prisma/client')
  console.log('PrismaClient loaded')
  
  const prisma = new PrismaClient()
  console.log('PrismaClient created')
  
  async function test() {
    try {
      await prisma.$connect()
      console.log('✅ Database connected!')
      
      const count = await prisma.user.count()
      console.log(`Users count: ${count}`)
      
    } catch (err) {
      console.error('Database error:', err.message)
    } finally {
      await prisma.$disconnect()
    }
  }
  
  test()
} catch (err) {
  console.error('Load error:', err.message)
}