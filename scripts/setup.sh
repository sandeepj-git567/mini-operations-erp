#!/usr/bin/env bash
# ==============================================================================
# Mini Operations ERP — Linux / Unix / macOS Setup Script
# ==============================================================================

set -e

echo "🚀 [ERP Setup] Initializing Mini Operations ERP environment..."

# 1. Check Node.js Version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v20 LTS or higher."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Detected Node.js version: ${NODE_VERSION}"

# 2. Setup Environment Variables
if [ ! -f "backend/.env" ]; then
    echo "📋 Copying backend/.env.example to backend/.env..."
    cp backend/.env.example backend/.env
fi

if [ ! -f "frontend/.env" ]; then
    echo "📋 Copying frontend/.env.example to frontend/.env..."
    cp frontend/.env.example frontend/.env
fi

# 3. Install Backend Dependencies
echo "📦 Installing Backend dependencies..."
cd backend
npm install
npx prisma generate
cd ..

# 4. Install Frontend Dependencies
echo "📦 Installing Frontend dependencies..."
cd frontend
npm install
cd ..

echo "🎉 [ERP Setup] Setup completed successfully!"
echo "👉 Update backend/.env with your DATABASE_URL and JWT_SECRET, then run ./scripts/dev.sh"
