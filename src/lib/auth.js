// src/lib/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'church-management-secret-key-2024';

// Create a new session on login
async function createSession(userId, deviceInfo, ipAddress) {
  const token = jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      deviceInfo: deviceInfo || 'Unknown device',
      ipAddress: ipAddress || 'Unknown IP',
      expiresAt
    }
  });
  
  return { token, sessionId: session.id };
}

// Login user
async function loginUser(email, password, deviceInfo, ipAddress) {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error('Invalid password');
  }
  
  const { token, sessionId } = await createSession(user.id, deviceInfo, ipAddress);
  
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    token,
    sessionId
  };
}

// Get all active sessions for a user
async function getUserSessions(userId) {
  return await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() }
    },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Logout from specific device
async function logoutSession(sessionId) {
  await prisma.session.delete({ where: { id: sessionId } });
}

// Logout from all devices
async function logoutAllSessions(userId) {
  await prisma.session.deleteMany({ where: { userId } });
}

module.exports = {
  createSession,
  loginUser,
  getUserSessions,
  logoutSession,
  logoutAllSessions
};