"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const fs = __importStar(require("fs"));
// Initialize Prisma
const prisma = new client_1.PrismaClient();
async function checkDbConnection() {
    try {
        await prisma.$connect();
        console.log("Local SQLite Database Online");
        // Ensure default settings exist
        const count = await prisma.settings.count();
        if (count === 0) {
            await prisma.settings.create({
                data: {
                    id: "singleton",
                    churchName: "Nairobi Hope Chapel",
                    branch: "Westlands",
                    currency: "KES"
                }
            });
        }
    }
    catch (e) {
        console.error("Database connection failed. Run 'npx prisma migrate dev'.");
    }
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
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
    }
    else {
        win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
}
electron_1.app.whenReady().then(async () => {
    await checkDbConnection();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', async () => {
    await prisma.$disconnect();
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// --- AUTH HANDLERS ---
electron_1.ipcMain.handle('auth:register', async (_, { email, password, fullName, role }) => {
    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing)
            return { error: 'Account already registered.' };
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name: fullName, role: role || 'ADMIN' }
        });
        return { user: { id: user.id, email: user.email, role: user.role, name: user.name } };
    }
    catch (err) {
        return { error: err.message };
    }
});
electron_1.ipcMain.handle('auth:login', async (_, { email, password }) => {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return { error: 'User not found.' };
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return { error: 'Invalid password.' };
        return { user: { id: user.id, email: user.email, role: user.role, name: user.name } };
    }
    catch (err) {
        return { error: 'Login Error' };
    }
});
// --- DATA HANDLERS ---
electron_1.ipcMain.handle('db:getStats', async () => {
    try {
        const members = await prisma.member.count();
        const visitors = await prisma.pastoralCare.count({ where: { type: 'VISITOR' } });
        const finances = await prisma.finance.findMany();
        let income = 0;
        let expenses = 0;
        finances.forEach(f => {
            if (f.type === 'EXPENSE')
                expenses += f.amount;
            else
                income += f.amount;
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
    }
    catch (err) {
        return { members: 0, visitors: 0, totalIncome: 0, totalExpenses: 0, chartData: [], incomeTrend: '0%', memberTrend: '0%' };
    }
});
electron_1.ipcMain.handle('db:getMembers', async (_, query = '') => {
    return await prisma.member.findMany({
        where: { name: { contains: query } },
        orderBy: { createdAt: 'desc' }
    });
});
electron_1.ipcMain.handle('db:addMember', async (_, data) => {
    return await prisma.member.create({ data });
});
electron_1.ipcMain.handle('db:getFinances', async () => {
    return await prisma.finance.findMany({ orderBy: { date: 'desc' } });
});
electron_1.ipcMain.handle('db:addFinance', async (_, data) => {
    return await prisma.finance.create({ data });
});
electron_1.ipcMain.handle('db:getEvents', async () => {
    return await prisma.event.findMany({ orderBy: { date: 'asc' } });
});
electron_1.ipcMain.handle('db:addEvent', async (_, data) => {
    return await prisma.event.create({ data });
});
electron_1.ipcMain.handle('db:getBaptisms', async () => {
    return await prisma.baptism.findMany({ orderBy: { createdAt: 'desc' } });
});
electron_1.ipcMain.handle('db:addBaptism', async (_, data) => {
    return await prisma.baptism.create({ data });
});
electron_1.ipcMain.handle('db:getPastoralCare', async () => {
    return await prisma.pastoralCare.findMany({ orderBy: { createdAt: 'desc' } });
});
electron_1.ipcMain.handle('db:addPastoralRecord', async (_, data) => {
    return await prisma.pastoralCare.create({ data });
});
electron_1.ipcMain.handle('db:getAttendance', async () => {
    return await prisma.attendance.findMany({ orderBy: { date: 'desc' } });
});
electron_1.ipcMain.handle('db:saveAttendance', async (_, data) => {
    return await prisma.attendance.create({ data });
});
electron_1.ipcMain.handle('db:getSettings', async () => {
    return await prisma.settings.findUnique({ where: { id: "singleton" } });
});
electron_1.ipcMain.handle('db:updateSettings', async (_, data) => {
    return await prisma.settings.update({ where: { id: "singleton" }, data });
});
electron_1.ipcMain.handle('db:backup', async () => {
    const { filePath } = await electron_1.dialog.showSaveDialog({
        title: 'Backup Database',
        defaultPath: `CMS_Backup_${Date.now()}.db`
    });
    if (filePath) {
        const src = path.join(electron_1.app.getPath('userData'), 'dev.db');
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, filePath);
            return { success: true };
        }
    }
    return { success: false };
});
