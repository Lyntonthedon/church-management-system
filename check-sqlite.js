const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const path = require('path')

async function checkSqlite() {
  const sqlite = await open({
    filename: path.join(__dirname, 'prisma/dev.db'),
    driver: sqlite3.Database
  })
  
  const users = await sqlite.all('SELECT * FROM User')
  const members = await sqlite.all('SELECT * FROM Member')
  const finances = await sqlite.all('SELECT * FROM Finance')
  
  console.log('SQLite Database:')
  console.log(`Users: ${users.length}`)
  console.log(`Members: ${members.length}`)
  console.log(`Finances: ${finances.length}`)
  
  if (users.length > 0) {
    console.log('\nSample users:')
    users.slice(0, 3).forEach(u => console.log(`  - ${u.email}`))
  }
  
  await sqlite.close()
}

checkSqlite()