# Fleet Management System - Deployment Guide

## Backend Setup - Fixed Issues

### Issues Resolved ✅

1. **Redis Connection Error**
   - **Problem**: Backend crashed with `ECONNREFUSED` on local development
   - **Solution**: Installed Redis locally and configured proper connection
   - **Command**: `sudo apt install redis-server && sudo service redis-server restart`

2. **Database Connection** 
   - **Status**: ✅ Working - Automatic table creation on startup
   - **Verification**: Database tables created successfully

3. **Queue & Workers**
   - **Status**: ✅ Working - BullMQ queues initialized
   - **Workers**: GPS, Alert, Notification workers running

### Current Status ✅
```
✅ Redis: Connected and ready
✅ Database: Connected and tables created
✅ Queues: Initialized successfully
✅ Workers: GPS, Alert, Notification workers running
✅ API Server: Running on port 5000
```

---

## Deployment Scenarios

### Option 1: Railway (Recommended for Full-Featured Deployment)

**Pros:**
- Full support for Redis and PostgreSQL via built-in services
- Workers and queues fully operational
- Better for real-time features

**Setup Steps:**
1. Connect repository to Railway
2. Set environment variables:
   ```
   DATABASE_URL=postgresql://...  (Railway provides)
   REDIS_URL=redis://...           (Railway provides)
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```
3. Railway automatically detects and uses Dockerfile
4. Deploy on push

**Connection String Example:**
```
DATABASE_URL: postgresql://user:password@host:5432/convoy
REDIS_URL: redis://:password@host:6379
```

---

### Option 2: Vercel (Static Frontend)

This repository includes a static frontend app in `public/`.

**Recommended use:** Deploy just the frontend to Vercel, and host the backend API separately on a platform like Railway or Render.

**Notes:**
- ✅ The static frontend can be served directly by Vercel
- ✅ Use `public/config.js` to set `window.API_ROOT` to your backend API URL
- ❌ The frontend alone does not provide login/auth without a backend API

**Vercel Frontend Deployment Steps:**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy the frontend
vercel --prod
```

**Set Backend API URL:**
Edit `public/config.js` and set:
```js
window.API_ROOT = 'https://your-backend.example.com/api';
```

**If you want the full backend/API deployed too:**
Use Railway or Render for the Node.js backend, because Vercel does not support persistent Redis-backed workers and long-running socket services.

**Environment Variables for the backend host:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=production
```

If the backend is deployed on the same domain as the frontend, leave `window.API_ROOT = '/api'`.

---

## Environment Variables Setup

### Development (.env)
```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/convoy
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=supersecret
NODE_ENV=development
```

### Railway Production
```
DATABASE_URL=postgresql://user:password@railway-host:5432/db
REDIS_URL=redis://:password@railway-host:6379
JWT_SECRET=your-production-secret
NODE_ENV=production
```

### Vercel Production
```
DATABASE_URL=postgresql://user:password@db-host:5432/db
DISABLE_REDIS=true
JWT_SECRET=your-production-secret
NODE_ENV=production
```

---

## Testing Endpoints

### Health Check
```bash
curl http://localhost:5000/
# Response: {"status":"OK","message":"Fleet Management API is running"}
```

### Get Vehicles
```bash
curl http://localhost:5000/api/vehicles
```

### Get GPS Data
```bash
curl http://localhost:5000/api/gps
```

### Create Vehicle (requires auth)
```bash
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"plate":"ABC123","driver":"John","type":"sedan"}'
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>
```

### Redis Connection Fails
```bash
# Check if Redis is running
ps aux | grep redis

# Start Redis
sudo service redis-server restart

# Test connection
redis-cli ping
# Should respond: PONG
```

### Database Not Found
```bash
# Check PostgreSQL connection
psql -h localhost -U postgres -d convoy

# Create database if not exists
createdb -h localhost -U postgres convoy
```

### Vercel Build Fails
1. Check `vercel.json` configuration
2. Ensure all environment variables are set
3. Verify `package.json` has all dependencies
4. Check `package-lock.json` is committed
5. Ensure `REDIS_URL` is not set to `redis://127.0.0.1:6379` in production unless Redis is available in the same runtime
6. If no Redis service exists in deployment, set `DISABLE_REDIS=true`

---

## Frontend & Backend Integration

> Note: This repository is backend-only. If you have a frontend application, keep it in a separate repository or folder named `frontend/`.

When deploying frontend separately (e.g., on Vercel):

Configure API base URL based on environment:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

**Environment Variables for Frontend:**
```
# .env.local (development)
REACT_APP_API_URL=http://localhost:5000

# .env.production (Vercel)
REACT_APP_API_URL=https://your-railway-backend.com
#  or
REACT_APP_API_URL=https://your-vercel-backend.vercel.app
```

---

## Production Checklist

- [ ] Redis running and accessible
- [ ] PostgreSQL database created and migrations run
- [ ] Environment variables configured
- [ ] JWT_SECRET set to secure value
- [ ] CORS configured correctly for frontend domain
- [ ] Docker image builds successfully
- [ ] Health endpoint responds (`/`)
- [ ] API endpoints tested
- [ ] Workers initializing without errors
- [ ] Logs being written correctly
- [ ] Database backups configured
- [ ] Error monitoring enabled (optional)

---

## Deployment Commands

### Local Development
```bash
npm install
npm run dev
```

### Docker Build
```bash
docker build -t fleet-management .
docker run -p 5000:5000 fleet-management
```

### Docker Compose
```bash
docker-compose up app
```

### Railway Deploy
```bash
# Just push to GitHub
.git push origin main
# Railway auto-deploys
```

### Vercel Deploy
```bash
npm i -g vercel
vercel
# Follow prompts to configure
```

---

## API Documentation

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/vehicles/:id` - Get vehicle details
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### GPS Tracking
- `POST /api/gps` - Submit GPS data
- `GET /api/gps/:vehicleId` - Get GPS history

### Convoys
- `GET /api/convoys` - List convoys
- `POST /api/convoys` - Create convoy
- `GET /api/convoys/:id` - Get convoy details

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

---

## Support & Documentation

For more information:
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Node.js Deployment](https://nodejs.org/en/docs/guides/nodejs-web-app/)
- [Express.js Guide](https://expressjs.com)
