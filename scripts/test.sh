#!/usr/bin/env bash
# ==============================================================================
# Mini Operations ERP — Linux / Unix Automated Test Runner
# ==============================================================================

set -e

echo "🔍 [ERP Tester] Running Backend Type Check & Jest Integration Tests..."

cd backend
echo "1. Checking TypeScript Types..."
npx tsc --noEmit

echo "2. Running Jest API Integration Tests..."
npm test

cd ..

echo "🔍 [ERP Tester] Running Frontend Type Check..."
cd frontend
npx tsc --noEmit
cd ..

echo "✅ [ERP Tester] Verification completed!"
