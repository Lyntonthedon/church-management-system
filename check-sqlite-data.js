// check-sqlite-data.js
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const path = require('path')

async function checkSqlite() {
  console.log('📂 Opening SQLite database...')
  
  const sqlite = await open({
    filename: path.join(__dirname, 'prisma/dev.db'),
    driver: sqlite3.Database
  })
  
  // Get all tables
  const tables = await sqlite.all(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `)
  
  console.log('\n📊 Tables found:', tables.map(t => t.name).join(', '))
  
  // Check each table
  for (const table of tables) {
    const count = await sqlite.get(`SELECT COUNT(*) as count FROM ${table.name}`)
    console.log(`   ${table.name}: ${count.count} records`)
    
    // Show sample data if there are records
    if (count.count > 0) {
      const sample = await sqlite.all(`SELECT * FROM ${table.name} LIMIT 2`)
      console.log(`   Sample ${table.name}:`, JSON.stringify(sample, null, 2))
    }
  }
  
  await sqlite.close()
}

checkSqlite().catch(console.error)