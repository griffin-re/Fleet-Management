#!/bin/bash
# Quick Setup and Run Script for Fleet Management System

set -e

echo "🚀 Fleet Management System - Setup Script"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm is installed${NC}"

# Check if Redis is installed
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis CLI not found${NC}"
    read -p "Install Redis? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing Redis..."
        sudo apt-get update > /dev/null
        sudo apt-get install -y redis-server > /dev/null
        echo -e "${GREEN}✅ Redis installed${NC}"
    fi
fi

# Check if Redis is running
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${YELLOW}⚠️  Redis is not running${NC}"
    read -p "Start Redis? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo service redis-server restart
        echo -e "${GREEN}✅ Redis started${NC}"
    fi
fi

# Install Node dependencies
echo ""
echo "Installing Node dependencies..."
npm install

# Load environment variables
if [ ! -f .env ]; then
    echo ""
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env created${NC}"
    echo ""
    echo "⚠️  Please fill in .env with your configuration!"
fi

# Create database if needed
echo ""
echo "Database Setup"
echo "--------------"
read -p "Do you have PostgreSQL set up? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ Database configuration will be used${NC}"
else
    echo -e "${YELLOW}⚠️  Database may not be available${NC}"
    echo "   Set DATABASE_URL in .env to connect"
fi

# Start application
echo ""
echo -e "${GREEN}==========================================="
echo "Starting Fleet Management System..."
echo "==========================================${NC}"
echo ""
echo "Server will run on: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
