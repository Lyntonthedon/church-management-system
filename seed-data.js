// seed-data.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database with sample data...')
  
  try {
    // Check if data already exists
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      console.log('✅ Database already has data.')
      console.log(`   Users: ${userCount}`)
      return
    }
    
    // Create an admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@church.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin'
      }
    })
    console.log('✅ Created admin user (admin@church.com / admin123)')
    
    // Create a regular user
    const user = await prisma.user.create({
      data: {
        email: 'user@church.com',
        name: 'Regular User',
        password: await bcrypt.hash('user123', 10),
        role: 'user'
      }
    })
    console.log('✅ Created regular user (user@church.com / user123)')
    
    // Create members
    const members = await prisma.member.createMany({
      data: [
        { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', address: '123 Main St', status: 'active' },
        { name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', address: '456 Oak Ave', status: 'active' },
        { name: 'Bob Johnson', email: 'bob@example.com', phone: '555-123-4567', address: '789 Pine St', status: 'active' },
        { name: 'Sarah Williams', email: 'sarah@example.com', phone: '555-987-6543', address: '321 Elm St', status: 'inactive' }
      ]
    })
    console.log(`✅ Created ${members.count} members`)
    
    // Create finances
    const finances = await prisma.finance.createMany({
      data: [
        { type: 'income', amount: 5000, category: 'Tithe', description: 'Sunday service tithes', date: new Date('2024-03-01') },
        { type: 'income', amount: 1200, category: 'Offering', description: 'Sunday offering', date: new Date('2024-03-08') },
        { type: 'income', amount: 800, category: 'Donation', description: 'Anonymous donation', date: new Date('2024-03-15') },
        { type: 'expense', amount: 800, category: 'Utilities', description: 'Electricity bill', date: new Date('2024-03-05') },
        { type: 'expense', amount: 1500, category: 'Charity', description: 'Community outreach', date: new Date('2024-03-12') },
        { type: 'expense', amount: 200, category: 'Maintenance', description: 'Building repairs', date: new Date('2024-03-20') }
      ]
    })
    console.log(`✅ Created ${finances.count} finance records`)
    
    console.log('\n🎉 Seeding completed!')
    console.log('\n📋 Login credentials:')
    console.log('   Admin: admin@church.com / admin123')
    console.log('   User:  user@church.com / user123')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

seed()