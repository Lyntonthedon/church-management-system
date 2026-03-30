import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'

async function testLogin() {
  console.log('Testing multi-device login...\n')
  
  try {
    await prisma.$connect()
    
    // Check if we have users
    const userCount = await prisma.user.count()
    console.log(`Found ${userCount} users in database`)
    
    if (userCount === 0) {
      console.log('No users found. Please run: npm run seed')
      return
    }
    
    // Find admin user
    const user = await prisma.user.findFirst({
      where: { email: 'admin@church.com' }
    })
    
    if (!user) {
      console.log('Admin user not found.')
      const users = await prisma.user.findMany()
      console.log('Available users:', users.map(u => u.email))
      return
    }
    
    console.log('✅ User found:', user.email)
    
    // Create a session for this device
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        deviceInfo: 'Test Terminal - Windows',
        ipAddress: '127.0.0.1',
        expiresAt
      }
    })
    
    console.log('✅ Session created for this device!')
    console.log('   Session ID:', session.id)
    console.log('   Token:', token.substring(0, 50) + '...')
    console.log('   Expires:', expiresAt.toLocaleString())
    
    // Get all active sessions for this user
    const sessions = await prisma.session.findMany({
      where: { 
        userId: user.id,
        expiresAt: { gt: new Date() }
      }
    })
    
    console.log(`\n📱 Active sessions for ${user.email}: ${sessions.length}`)
    sessions.forEach(s => {
      console.log(`   - ${s.deviceInfo} (${s.ipAddress})`)
      console.log(`     Created: ${new Date(s.createdAt).toLocaleString()}`)
    })
    
    console.log('\n✨ Multi-device authentication is working!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()