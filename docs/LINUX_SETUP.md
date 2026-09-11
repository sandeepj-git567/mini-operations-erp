# LINUX / UNIX & WSL2 SETUP GUIDE

This guide provides beginner-friendly, step-by-step instructions for setting up, running, testing, and developing the **Mini Operations ERP** application on **Linux (Ubuntu / Debian / Fedora / Arch)**, **macOS**, or **Windows Subsystem for Linux (WSL2)** environments.

---

## 1. Prerequisites & Node.js Installation

### Step 1: Install Node.js LTS via NVM (Node Version Manager)
Using `nvm` is the recommended method to install Node.js on Unix/Linux systems:

```bash
# Download and install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload terminal shell environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js v20 LTS
nvm install 20
nvm use 20

# Confirm Node and NPM versions
node -v   # Should output v20.x.x
npm -v    # Should output v10.x.x
```

### Step 2: Install Git & Build Tools (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y git build-essential curl
```

---

## 2. Environment Configuration

### Step 1: Clone Repository
```bash
git clone https://github.com/sandeepj-git567/mini-operations-erp.git
cd mini-operations-erp
```

### Step 2: Create Environment Files
```bash
# Copy template environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Step 3: Edit Backend Environment File
Open `backend/.env` in your text editor (`nano`, `vim`, or VS Code):

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_erp_db"
JWT_SECRET="your-secure-random-jwt-secret-min-32-chars"
FRONTEND_URL="http://localhost:3000"
```

---

## 3. Dependency Installation & Database Setup

### Step 1: Automated POSIX Setup Script
Run the included setup script:

```bash
# Make script executable
chmod +x scripts/setup.sh scripts/test.sh

# Run setup
./scripts/setup.sh
```

### Step 2: Manual Dependency Installation (Alternative)
```bash
# Install backend dependencies
cd backend
npm install
npx prisma generate
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 3: Local PostgreSQL Setup via Docker (Optional)
If you prefer running a local PostgreSQL database instead of Supabase Cloud:

```bash
# Run PostgreSQL container
docker run --name local-erp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mini_erp_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Step 4: Run Prisma Database Migrations & Seed Data
```bash
cd backend

# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed initial warehouse locations, demo users, categories, items, and inventories
npm run seed

cd ..
```

---

## 4. Development & Running Commands

### Running Backend Server
```bash
cd backend
npm run dev
```
* **Swagger API Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
* **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Running Frontend Application (In a second terminal tab)
```bash
cd frontend
npm run dev
```
* **Web UI**: [http://localhost:3000](http://localhost:3000)

---

## 5. Testing Commands

```bash
# Run automated type checks & Jest integration tests
./scripts/test.sh

# Or run Jest directly inside backend directory:
cd backend
npm test
```

---

## 6. Useful Docker Commands (Preview for Phase 10)

```bash
# Build Backend Container Image
docker build -t mini-operations-erp-backend ./backend

# Run Backend Container
docker run -p 5000:5000 --env-file backend/.env mini-operations-erp-backend
```

---

## 7. Linux Troubleshooting & Common Issues

* **Permission Denied when running scripts**:
  ```bash
  chmod +x scripts/setup.sh scripts/test.sh
  ```
* **`EADDRINUSE: port 5000 already in use`**:
  Find and kill the process occupying port 5000:
  ```bash
  lsof -i :5000
  kill -9 <PID>
  ```
* **EMFILE: Too many open files during `npm run dev`**:
  Increase Linux file watch limits:
  ```bash
  sudo sysctl fs.inotify.max_user_watches=524288
  sudo sysctl -p
  ```
