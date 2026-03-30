// scripts/migrate-to-postgres.js
const { PrismaClient } = require('@prisma/client')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const path = require('path')

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...')
  
  // Connect to SQLite
  const sqlite = await open({
    filename: path.join(__dirname, '../prisma/dev.db'),
    driver: sqlite3.Database
  })
  
  // Connect to PostgreSQL
  const pgPrisma = new PrismaClient()
  
  try {
    // Test PostgreSQL connection
    await pgPrisma.$connect()
    console.log('✅ Connected to PostgreSQL successfully')
    
    // Check if data already exists
    const existingUsers = await pgPrisma.user.count()
    if (existingUsers > 0) {
      console.log('⚠️  Database already has data. Skipping migration.')
      return
    }
    
    // Migrate Users
    console.log('\n📊 Migrating users...')
    const users = await sqlite.all('SELECT * FROM User')
    for (const user of users) {
      await pgPrisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          password: user.password,
          role: user.role,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      })
    }
    console.log(`✅ Migrated ${users.length} users`)
    
    // Migrate Members
    console.log('\n📊 Migrating members...')
    const members = await sqlite.all('SELECT * FROM Member')
    let memberCount = 0
    for (const member of members) {
      try {
        await pgPrisma.member.create({
          data: {
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            address: member.address,
            birthDate: member.birthDate ? new Date(member.birthDate) : null,
            baptismDate: member.baptismDate ? new Date(member.baptismDate) : null,
            status: member.status,
            notes: member.notes,
            createdAt: new Date(member.createdAt),
            updatedAt: new Date(member.updatedAt)
          }
        })
        memberCount++
      } catch (error) {
        console.error(`   ⚠️  Error migrating member ${member.id}: ${error.message}`)
      }
    }
    console.log(`✅ Migrated ${memberCount} members`)
    
    // Migrate Finances
    console.log('\n📊 Migrating finances...')
    const finances = await sqlite.all('SELECT * FROM Finance')
    let financeCount = 0
    for (const finance of finances) {
      try {
        await pgPrisma.finance.create({
          data: {
            id: finance.id,
            type: finance.type,
            amount: finance.amount,
            category: finance.category,
            description: finance.description,
            date: new Date(finance.date),
            createdAt: new Date(finance.createdAt)
          }
        })
        financeCount++
      } catch (error) {
        console.error(`   ⚠️  Error migrating finance ${finance.id}: ${error.message}`)
      }
    }
    console.log(`✅ Migrated ${financeCount} finances`)
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('📋 Summary:')
    console.log(`   - Users: ${users.length}`)
    console.log(`   - Members: ${memberCount}`)
    console.log(`   - Finances: ${financeCount}`)
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
  } finally {
    await pgPrisma.$disconnect()
    await sqlite.close()
  }
}

migrateData()