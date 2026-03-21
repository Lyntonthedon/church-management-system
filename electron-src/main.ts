import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';

// Initialize Prisma
const prisma = new PrismaClient();

async function checkDbConnection() {
  try {
    await prisma.$connect();
    console.log("Local SQLite Database Online");
    
    // Ensure default settings exist
    const count = await (prisma as any).settings.count();
    if (count === 0) {
      await (prisma as any).settings.create({
        data: {
          id: "singleton",
          churchName: "Nairobi Hope Chapel",
          branch: "Westlands",
          currency: "KES"
        }
      });
    }
  } catch (e) {
    console.error("Database connection failed. Run 'npx prisma migrate dev'.");
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'electron', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Church OS - Professional CMS",
    icon: path.join(__dirname, 'public', 'icon.ico')
  });

  // Remove menu bar for clean "app" feel
  win.setMenuBarVisibility(false);

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  await checkDbConnection();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  await prisma.$disconnect();
  if (process.platform !== 'darwin') app.quit();
});

// --- AUTH HANDLERS ---
ipcMain.handle('auth:register', async (_, { email, password, fullName, role }) => {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: 'Account already registered.' };
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: fullName, role: role || 'ADMIN' }
    });
    return { user: { id: user.id, email: user.email, role: user.role, name: user.name } };
  } catch (err: any) {
    return { error: err.message };
  }
});

ipcMain.handle('auth:login', async (_, { email, password }) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: 'User not found.' };
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { error: 'Invalid password.' };
    return { user: { id: user.id, email: user.email, role: user.role, name: user.name } };
  } catch (err: any) {
    return { error: 'Login Error' };
  }
});

// --- DATA HANDLERS ---
ipcMain.handle('db:getStats', async () => {
  try {
    const members = await prisma.member.count();
    const visitors = await (prisma as any).pastoralCare.count({ where: { type: 'VISITOR' } });
    const finances = await prisma.finance.findMany();
    
    let income = 0;
    let expenses = 0;
    finances.forEach(f => {
      if (f.type === 'EXPENSE') expenses += f.amount;
      else income += f.amount;
    });

    return { 
      members, 
      visitors, 
      totalIncome: income, 
      totalExpenses: expenses,
      chartData: [],
      incomeTrend: '+10%',
      memberTrend: '+2%'
    };
  } catch (err) {
    return { members: 0, visitors: 0, totalIncome: 0, totalExpenses: 0, chartData: [], incomeTrend: '0%', memberTrend: '0%' };
  }
});

ipcMain.handle('db:getMembers', async (_, query = '') => {
  return await prisma.member.findMany({
    where: { name: { contains: query } },
    orderBy: { createdAt: 'desc' }
  });
});

ipcMain.handle('db:addMember', async (_, data) => {
  return await prisma.member.create({ data });
});

ipcMain.handle('db:getFinances', async () => {
  return await prisma.finance.findMany({ orderBy: { date: 'desc' } });
});

ipcMain.handle('db:addFinance', async (_, data) => {
  return await prisma.finance.create({ data });
});

ipcMain.handle('db:getEvents', async () => {
  return await (prisma as any).event.findMany({ orderBy: { date: 'asc' } });
});

ipcMain.handle('db:addEvent', async (_, data) => {
  return await (prisma as any).event.create({ data });
});

ipcMain.handle('db:getBaptisms', async () => {
  return await (prisma as any).baptism.findMany({ orderBy: { createdAt: 'desc' } });
});

ipcMain.handle('db:addBaptism', async (_, data) => {
  return await (prisma as any).baptism.create({ data });
});

ipcMain.handle('db:getPastoralCare', async () => {
  return await (prisma as any).pastoralCare.findMany({ orderBy: { createdAt: 'desc' } });
});

ipcMain.handle('db:addPastoralRecord', async (_, data) => {
  return await (prisma as any).pastoralCare.create({ data });
});

ipcMain.handle('db:getAttendance', async () => {
  return await (prisma as any).attendance.findMany({ orderBy: { date: 'desc' } });
});

ipcMain.handle('db:saveAttendance', async (_, data) => {
  return await (prisma as any).attendance.create({ data });
});

ipcMain.handle('db:getSettings', async () => {
  return await (prisma as any).settings.findUnique({ where: { id: "singleton" } });
});

ipcMain.handle('db:updateSettings', async (_, data) => {
  return await (prisma as any).settings.update({ where: { id: "singleton" }, data });
});

ipcMain.handle('db:backup', async () => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Backup Database',
    defaultPath: `CMS_Backup_${Date.now()}.db`
  });
  if (filePath) {
    const src = path.join(app.getPath('userData'), 'dev.db');
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, filePath);
      return { success: true };
    }
  }
  return { success: false };
});