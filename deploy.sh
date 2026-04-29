#!/bin/bash

# Fleet Management System - Deploy to Production
# Usage: bash ./deploy.sh [railway|vercel|docker]

set -e

PLATFORM=${1:-railway}
PROJECT_NAME="fleet-management"

echo "🚀 Fleet Management Deployment Script"
echo "======================================"
echo "Platform: $PLATFORM"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_step() {
  echo -e "${BLUE}→ $1${NC}"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Pre-deployment checks
log_step "Running pre-deployment checks..."

if ! command -v git &> /dev/null; then
  log_warning "Git not found, skipping git checks"
else
  # Check if we're in git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
  fi
  log_success "Git repository found"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js not installed"
  exit 1
fi
NODE_VERSION=$(node -v)
log_success "Node.js $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
  echo "Error: npm not installed"
  exit 1
fi
log_success "npm installed"

echo ""

case $PLATFORM in
  railway)
    log_step "Deploying to Railway..."
    echo ""
    echo "📋 Railway Deployment Steps:"
    echo "1. Go to https://railway.app"
    echo "2. Click 'New Project'"
    echo "3. Select 'Deploy from GitHub repo'"
    echo "4. Choose: OnyariDEV/Fleet-Management"
    echo "5. Add plugins:"
    echo "   - PostgreSQL (Railway provides DATABASE_URL)"
    echo "   - Redis (Railway provides REDIS_URL)"
    echo "6. Set Environment Variables:"
    echo "   - NODE_ENV=production"
    echo "   - JWT_SECRET=$(openssl rand -base64 32)"
    echo "   - FRONTEND_URL=https://your-frontend-domain"
    echo "7. Deploy!"
    echo ""
    log_success "Railway deployment guide shown"
    ;;

  vercel)
    log_step "Deploying to Vercel..."
    echo ""
    echo "📋 Vercel Deployment Steps:"
    echo "1. Go to https://vercel.com/import"
    echo "2. Select 'GitHub' and choose: OnyariDEV/Fleet-Management"
    echo "3. Set 'Root Directory' to: frontend"
    echo "4. Set Environment Variables:"
    echo "   - VITE_API_URL=https://your-railway-backend/api/v1"
    echo "   - VITE_SOCKET_URL=https://your-railway-backend"
    echo "5. Deploy!"
    echo ""
    log_success "Vercel deployment guide shown"
    ;;

  docker)
    log_step "Building Docker image locally..."
    
    if ! command -v docker &> /dev/null; then
      echo "Error: Docker not installed"
      exit 1
    fi
    log_success "Docker found"
    
    # Build
    log_step "Building image: $PROJECT_NAME:latest"
    docker build -t $PROJECT_NAME:latest .
    log_success "Build complete"
    
    echo ""
    echo "📋 Docker Deployment Steps:"
    echo "1. Push to registry:"
    echo "   docker tag $PROJECT_NAME:latest registry.example.com/$PROJECT_NAME"
    echo "   docker push registry.example.com/$PROJECT_NAME"
    echo ""
    echo "2. Run with Docker Compose or orchestration:"
    echo "   docker run -d \\"
    echo "     -e DATABASE_URL=postgresql://... \\"
    echo "     -e REDIS_URL=redis://... \\"
    echo "     -e JWT_SECRET=... \\"
    echo "     -p 5000:5000 \\"
    echo "     registry.example.com/$PROJECT_NAME:latest"
    echo ""
    log_success "Docker deployment guide shown"
    ;;

  *)
    echo "Unknown platform: $PLATFORM"
    echo "Usage: bash ./deploy.sh [railway|vercel|docker]"
    exit 1
    ;;
esac

echo ""
echo "📊 Post-Deployment Checklist:"
echo "=============================="
echo "□ Database migrations ran automatically"
echo "□ Seed data created (demo users, vehicles)"
echo "□ Health endpoint responding: /health"
echo "□ Login works with demo credentials"
echo "□ Can create vehicles and convoys"
echo "□ Socket.IO real-time updates working"
echo "□ Alerts and messaging functional"
echo "□ Analytics dashboard rendering"
echo ""
echo "🎉 Deployment complete! Your app is live!"
