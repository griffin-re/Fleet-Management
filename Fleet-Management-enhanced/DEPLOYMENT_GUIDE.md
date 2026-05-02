# DEPLOYMENT GUIDE

## 🚀 Quick Deploy (Choose One)

### 1️⃣ Railway (Recommended - Easiest)

**Pros:** Managed PostgreSQL + Redis, auto-deploy on push, WebSocket support  
**Time:** ~5 minutes

```bash
# 1. Go to railway.app and sign up
# 2. Click "New Project" → "Deploy from GitHub"
# 3. Connect your GitHub account and authorize
# 4. Select: OnyariDEV/Fleet-Management
# 5. Railway auto-detects your Dockerfile
# 6. Click "Deploy"
```

**Environment Variables to Set on Railway:**
```
NODE_ENV=production
JWT_SECRET=<generate new: openssl rand -base64 32>
FRONTEND_URL=https://your-app.railway.app
```

**PostgreSQL & Redis:**
- Click "New"
- Add "PostgreSQL" plugin
- Add "Redis" plugin
- Railway auto-provides DATABASE_URL and REDIS_URL

**Result:** Your backend is live at `https://your-app-{random}.railway.app`

---

### 2️⃣ Vercel (Frontend) + Railway (Backend)

**Best for:** Fast frontend CDN + scalable backend

**Frontend on Vercel:**
```bash
cd frontend
npm run build        # Creates dist/
vercel --prod        # Deploy
```

Set Environment Variable on Vercel:
```
VITE_API_URL=https://your-railway-backend.railway.app/api/v1
VITE_SOCKET_URL=https://your-railway-backend.railway.app
```

**Backend on Railway** (see option 1 above)

**Result:** Frontend at `https://your-project.vercel.app`, Backend at Railway URL

---

### 3️⃣ Docker (Self-Hosted)

**For:** AWS EC2, DigitalOcean, Linode, or any Linux VPS

**Build & Push to Docker Hub:**
```bash
docker build -t yourusername/fleet-management:latest .
docker tag yourusername/fleet-management:latest yourusername/fleet-management:prod
docker login   # Enter DockerHub credentials
docker push yourusername/fleet-management:prod
```

**Deploy to VPS:**
```bash
# SSH into your server
ssh user@your-vps-ip

# Pull and run
docker run -d \
  --name fleet-management \
  -e DATABASE_URL=postgresql://user:pass@your-db:5432/convoy \
  -e REDIS_URL=redis://your-redis:6379 \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  -e NODE_ENV=production \
  -e FRONTEND_URL=https://your-domain.com \
  -p 5000:5000 \
  yourusername/fleet-management:prod
```

**OR use Docker Compose on your server:**
```bash
# Update docker-compose.yml with production credentials
docker-compose -f docker-compose.yml up -d
```

---

## ✅ Post-Deployment Verification

### Test Health Endpoint
```bash
curl https://your-backend.railway.app/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-02-15T10:30:00Z",
#   "database": "connected",
#   "redis": "connected",
#   "uptime": 123.456
# }
```

### Test Login
```bash
curl -X POST https://your-backend.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@convoy.local",
    "password": "password123"
  }'

# Expected: JWT token in response
```

### Test Frontend Connection
1. Open `https://your-frontend-domain.com`
2. Login with demo credentials
3. Create a vehicle
4. Verify real-time updates work
5. Check browser console for Socket.IO connection

---

## 🔧 Production Environment Variables

### Backend Required Variables

```env
# Database (Railway provides this if using PostgreSQL plugin)
DATABASE_URL=postgresql://user:password@host:5432/convoy

# Redis (Railway provides this if using Redis plugin)
REDIS_HOST=cache.railway.internal   # or REDIS_URL=redis://...
REDIS_PORT=6379
REDIS_PASSWORD=                      # If needed

# Security
JWT_SECRET=<generate-random-32-chars>
NODE_ENV=production

# API Configuration
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

### Frontend Required Variables

```env
# Backend API URL
VITE_API_URL=https://your-backend-domain.com/api/v1

# WebSocket URL
VITE_SOCKET_URL=https://your-backend-domain.com
```

---

## 🔐 Security Checklist

Before going live, ensure:

- [ ] JWT_SECRET is strong (32+ random characters)
- [ ] DATABASE_URL uses secure password
- [ ] FRONTEND_URL configured correctly
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS allows only your frontend domain
- [ ] Database backups configured
- [ ] Logs monitored and retained
- [ ] Rate limiting active on auth endpoints
- [ ] No console.log() in production code
- [ ] Helmet.js security headers enabled

---

## 📊 Monitoring & Logs

### Railway Dashboard
- Monitor CPU, Memory, Network usage
- View real-time logs
- Auto-restarts on crash

### Local Logs
```bash
# Docker
docker-compose logs -f backend

# Production
tail -f /var/log/fleet-management/combined.log
```

### Common Log Patterns

```
✓ Connected to database
✓ Redis connected
✓ Server running on port 5000
✓ Migrations completed
! User login attempt
x Database connection error
x Redis connection failed
```

---

## 🆘 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432

Solution:
- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Re-run migrations: npm run migrate
```

### Redis Connection Error
```
Error: Redis connection failed

Solution:
- Check REDIS_URL/REDIS_HOST settings
- Verify Redis is running
- Check firewall rules
```

### Socket.IO Not Connecting
```
Browser console error: WebSocket connection failed

Solution:
- Ensure VITE_SOCKET_URL is set correctly
- Check CORS is allowing your frontend domain
- Verify Socket.IO port (5000) is accessible
```

### High Memory Usage
```
Solution:
- Check for memory leaks
- Review connected Socket.IO clients
- Scale vertically (more RAM) or horizontally (more replicas)
```

---

## 📈 Scaling for Production

### After Day 1 (Traffic Increasing)

1. **Increase Database**
   - Railway: Upgrade PostgreSQL plan
   - Set up automated backups

2. **Increase Cache**
   - Railway: Upgrade Redis plan
   - Monitor cache hit ratio

3. **Add Workers**
   ```bash
   npm run workers &
   npm run worker:gps &
   npm run worker:alert &
   ```

4. **CDN for Frontend**
   - Vercel: Auto-CDN enabled
   - Railway: Use Cloudflare Free tier

### After Week 1 (High Load)

1. **Database Replication**
   - Read replicas for analytics queries
   - Regular backup snapshots

2. **Caching Strategy**
   - Redis: Cache vehicle list, convoy list
   - TTL: 5-10 minutes for most data

3. **Rate Limiting**
   - Increase limits from 100/15min to 1000/15min
   - By endpoint, by user role

4. **Monitoring**
   - Set up alerts for CPU > 80%
   - Alert on error rate > 1%
   - Track p99 response times

---

## 🎯 Next Steps

1. **First Deploy**
   - Choose Railway for easiest path
   - Set variables, click deploy
   - Test login and vehicles

2. **Monitor**
   - Watch logs for first 24 hours
   - Monitor error rates
   - Check response times

3. **Optimize**
   - Add indices to frequently queried columns
   - Implement query caching
   - Use connection pooling

4. **Maintain**
   - Weekly database backups
   - Review and clean audit logs
   - Update dependencies monthly

---

## 📞 Support

- Issues: https://github.com/OnyariDEV/Fleet-Management/issues
- Email: contact@example.com

**Your app is production-ready! 🚀**
