
# Church OS: Blue Engine Edition (Desktop CMS)

A high-performance Desktop Application built with **Electron**, **React**, and **Prisma SQLite**. This system is designed for professional church management with full offline capabilities.

## 🚀 Prerequisites

Before starting, ensure you have the following installed on your Windows machine:

1. **Node.js (v18 or higher)**: [Download here](https://nodejs.org/)
2. **VS Code**: [Download here](https://code.visualstudio.com/)
3. **C++ Build Tools** (Optional, but recommended for SQLite native modules): Usually installed via `npm install --global windows-build-tools` or through Visual Studio Installer.

## 🛠️ Installation & Setup

1. **Extract/Download** this project folder to your local drive.
2. **Open in VS Code**: Right-click the folder and select "Open with Code".
3. **Open Terminal**: Press ``Ctrl + ` `` in VS Code.
4. **Install Dependencies**:
   ```bash
   npm install
   ```
5. **Initialize Database**:
   Run the following to set up your local SQLite database:
   ```bash
   npx prisma migrate dev --name init
   ```
   *This creates a local `dev.db` file which stores all your church data offline.*

## 🏃 Running the App

### Development Mode (Recommended for testing)
To run the app in a live-reload window:
```bash
npm run electron:dev
```

### Web Preview
To see just the UI in your browser:
```bash
npm run dev
```

## 📦 Building the Windows EXE

To generate a standalone `.exe` file that you can install on any Windows computer:

1. **Build the Production Frontend**:
   ```bash
   npm run build
   ```
2. **Package as EXE**:
   ```bash
   npm run dist
   ```
3. Your installer will be generated in the `dist_electron/` folder.

## 🔑 Access Credentials
- **Master Admin Access Code**: `39759298`
- **Demo Mode Code**: `40759399`

## 📁 System Architecture
- `electron/`: Contains the desktop shell logic and database IPC handlers.
- `prisma/`: Database schema and SQLite storage.
- `src/pages/`: Modular UI for Membership, Finance, Baptism, etc.
- `App.tsx`: Main navigation and routing engine.
