const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Testing connection...');
  try {
    await prisma.$connect();
    console.log('Connected!');
  } catch(err) {
    console.log('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
