# IMS Desktop Application

A complete desktop inventory management system built with:
- **Frontend**: Next.js + React + TypeScript
- **Backend**: .NET 7.0 Web API + Entity Framework Core
- **Database**: SQL Server / LocalDB
- **Desktop**: Electron

## Quick Start

### Prerequisites
- Node.js 18+
- .NET 7.0 SDK
- SQL Server (Development) or LocalDB (Production)

### Installation

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Development

Run all services concurrently:

```bash
# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Frontend + Electron
cd frontend
npm run dev:all
```

Or run individually:

```bash
# Backend only
cd backend/ImsServer
dotnet run

# Frontend only
cd frontend
npm run dev

# Electron only (requires frontend running)
cd electron
npm start
```

## Building Desktop Installer

### Step 1: Configure for Production

Update `backend/ImsServer/appsettings.json` with LocalDB connection:

```json
{
  "ConnectionStrings": {
    "DBCONNECTION": "Server=(localdb)\\IMS_Instance;Database=IMS;Integrated Security=true;TrustServerCertificate=True;"
  }
}
```

### Step 2: Create Build Assets

Create `build` folder with:
- `icon.ico` (256x256 application icon)
- `installer-header.bmp` (150x57 NSIS header)
- `installer-sidebar.bmp` (164x314 NSIS sidebar)

### Step 3: Build Installer

```bash
# Build everything and create Windows installer
npm run dist:win
```

Find installer in `release/IMS Desktop Setup X.X.X.exe`

## Project Structure

```
IMS2.0/
├── electron/              # Electron main process
│   ├── main.js           # Entry point, backend spawner
│   └── preload.js        # Preload script
├── frontend/             # Next.js application
│   ├── src/
│   │   ├── app/         # Pages & routes
│   │   ├── components/  # React components
│   │   ├── store/       # Zustand state management
│   │   └── Utils/       # Utilities & API client
│   └── package.json
├── backend/              # .NET API
│   └── ImsServer/
│       ├── Controllers/ # API endpoints
│       ├── Models/      # EF Core models
│       ├── Migrations/  # Database migrations
│       └── Program.cs   # API entry point
├── build/                # Build assets for installer
└── package.json          # Root package & build config
```

## Features

- ✅ User Management (Admin/Normal roles)
- ✅ Store Management
- ✅ Category Management
- ✅ Customer Management
- ✅ Supplier Management
- ✅ Product Management
- ✅ Excel Export
- ✅ Dark/Light Theme
- ✅ Desktop Application
- ✅ Custom Installer

## Configuration

### Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5184
```

### Database Setup

The installer automatically:
1. Installs SQL Server LocalDB (if needed)
2. Creates `IMS_Instance` instance
3. Runs migrations on first launch

Manual setup:
```bash
cd backend/ImsServer
dotnet ef database update
```

## Building Components Separately

```bash
# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend

# Build all without installer
npm run build:all
```

## Troubleshooting

**Backend won't start:**
- Check port 5184 is not in use
- Verify .NET 7.0 is installed: `dotnet --version`

**Database connection fails:**
- Verify LocalDB: `SqlLocalDB info IMS_Instance`
- Check connection string in `appsettings.json`

**Electron shows blank screen:**
- Ensure frontend is built: check `dist/frontend/`
- Check Electron console: Ctrl+Shift+I

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm start` | Run Electron in dev mode |
| `npm run dev:app` | Run frontend dev server |
| `npm run dev:backend` | Run .NET API with hot reload |
| `npm run build:frontend` | Build & export Next.js |
| `npm run build:backend` | Publish .NET as self-contained |
| `npm run build:all` | Build frontend + backend |
| `npm run pack` | Create unpacked app (test) |
| `npm run dist` | Create installer (all platforms) |
| `npm run dist:win` | Create Windows installer only |

## Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Material-UI
- Zustand (State)
- Axios (HTTP)

### Backend
- .NET 7.0
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- AutoMapper

### Desktop
- Electron 27
- ExcelJS
- electron-builder

## License

See `LICENSE.txt` for details.

## Support

For issues or questions, please contact the development team.
