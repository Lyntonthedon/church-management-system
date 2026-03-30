import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function checkData() {
  console.log('Checking Supabase database...\n')
  
  try {
    await prisma.$connect()
    console.log('✅ Connected to database\n')
    
    const userCount = await prisma.user.count()
    const memberCount = await prisma.member.count()
    const financeCount = await prisma.finance.count()
    const sessionCount = await prisma.session.count()
    
    console.log('📊 Database Statistics:')
    console.log(`   Users: ${userCount}`)
    console.log(`   Members: ${memberCount}`)
    console.log(`   Finances: ${financeCount}`)
    console.log(`   Sessions: ${sessionCount}`)
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        take: 3,
        select: { email: true, name: true, role: true }
      })
      console.log('\n👥 Users:')
      users.forEach(u => console.log(`   - ${u.email} (${u.role})`))
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()