# 🚀 Fleet & Convoy Management System

**Military-grade tactical operations platform** for real-time fleet coordination and security convoy management across regions like Kenya, DRC, Tanzania, and Mali.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Node](https://img.shields.io/badge/node-18%2B-green)
![React](https://img.shields.io/badge/react-18-blue)
![License](https://img.shields.io/badge/license-ISC-blue)

## ⚡ Quick Deploy to Production

### 🚂 Railway (Easiest - 5 minutes)

```bash
# 1. Go to railway.app
# 2. New Project → Import GitHub repo
# 3. Select OnyariDEV/Fleet-Management
# 4. Add PostgreSQL & Redis plugins
# 5. Set ENV variables (see below)
# 6. Deploy!

# Post-deploy:
# Initialize database automatically (runs on startup)
# Frontend at: https://your-app.railway.app
# Backend at: https://your-app-api.railway.app
```

**Environment Variables:**
```
NODE_ENV=production
JWT_SECRET=<generate: openssl rand -base64 32>
FRONTEND_URL=https://your-frontend-domain.com
```

### 🌐 Vercel (Frontend) + Railway (Backend)

```bash
# Frontend on Vercel
vercel --prod

# Then set:
VITE_API_URL=https://your-railway-backend.railway.app/api/v1
VITE_SOCKET_URL=https://your-railway-backend.railway.app
```

## 🎯 Features

### Core Capabilities
- ✅ **Real-Time Tracking**: Live GPS tracking with Socket.IO
- ✅ **Convoy Management**: Mission planning, assignment, execution
- ✅ **Alert System**: Critical incident detection and escalation
- ✅ **Fleet Analytics**: Utilization, metrics, heatmaps
- ✅ **Role-Based Access**: Admin, Dispatcher, Operator, Analyst
- ✅ **Internal Comms**: Broadcast alerts, team messaging
- ✅ **Background Workers**: GPS processing, alert routing, notifications
- ✅ **Audit Logs**: Full compliance trail for all mutations

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| Backend | Node.js 18 + Express + PostgreSQL 15 + Redis 7 |
| Auth | JWT + bcryptjs + httpOnly cookies |
| Real-time | Socket.IO + BullMQ workers |
| Deploy | Docker + Railway/Vercel + Cloud databases |
| Security | Helmet, CORS, Rate-Limit, SQL-parameterized |

## 📦 Project Structure

```
Fleet-Management/
├── frontend/                      # React app
│   ├── src/
│   │   ├── pages/                # DashboardPage, FleetPage, ConvoysPage, etc.
│   │   ├── components/           # UI components (Button, Card, Modal, etc.)
│   │   ├── services/             # API client, Socket.IO
│   │   ├── store/                # Zustand state management
│   │   ├── hooks/                # useSocket, useAsync, useDebounce
│   │   └── utils/                # Alert colors, date formatting
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                       # Express API
│   ├── src/
│   │   ├── app.js                # Express app + Socket.IO
│   │   ├── controllers/          # authController, vehicleController, etc.
│   │   ├── routes/               # /auth, /vehicles, /convoys, /alerts, /messages
│   │   ├── middleware/           # authenticate, authorize, errorHandler
│   │   ├── config/
│   │   │   ├── database.js       # PostgreSQL pool + schema init
│   │   │   └── redis.js          # Redis client
│   │   └── utils/
│   │       └── logger.js         # Winston logger
│   ├── scripts/
│   │   ├── migrate.js            # Database initialization
│   │   ├── seed.js               # Demo data (users, vehicles, convoys)
│   │   └── start-workers.js      # BullMQ workers
│   └── package.json
│
├── Dockerfile                     # Multi-stage build
├── docker-compose.yml             # Local dev setup
├── railway.json                  # Railway deployment config
└── README.md
```

### Local Development with Docker Compose

```bash
# Clone
git clone https://github.com/OnyariDEV/Fleet-Management.git
cd Fleet-Management

# Backend + Frontend + PostgreSQL + Redis (all-in-one)
docker-compose up

# In new terminal, initialize database
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed

# Access:
# Frontend:  http://localhost:5173
# Backend:   http://localhost:5000
# Database:  localhost:5432
# Redis:     localhost:6379
```

### Local Development without Docker

```bash
# Terminal 1: Database & Redis
brew install postgresql redis  # macOS
# or: sudo apt install postgresql redis-server  # Linux
brew services start postgresql && brew services start redis

# Terminal 2: Backend
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev    # Runs on :5000

# Terminal 3: Frontend
cd frontend
npm install
cp .env.example .env
npm run dev    # Runs on :5173
```

### Demo Credentials

```
Email:    admin@convoy.local
Password: password123

Also created:
- dispatcher@convoy.local
- operator@convoy.local
```

## 🔌 API Reference

All endpoints require `Authorization: Bearer {token}` header.

### Authentication
```
POST   /api/v1/auth/login          # Get JWT token
POST   /api/v1/auth/logout         # Logout
GET    /api/v1/auth/me             # Current user profile
```

### Fleet Management
```
GET    /api/v1/vehicles            # List (paginated, filterable)
POST   /api/v1/vehicles            # Create
GET    /api/v1/vehicles/:id        # Get one
PUT    /api/v1/vehicles/:id        # Update
PATCH  /api/v1/vehicles/:id/status # Update status
DELETE /api/v1/vehicles/:id        # Soft delete
GET    /api/v1/vehicles/:id/history
```

### Convoy Operations
```
GET    /api/v1/convoys             # List
POST   /api/v1/convoys             # Create
GET    /api/v1/convoys/:id         # Get
PUT    /api/v1/convoys/:id         # Update
PATCH  /api/v1/convoys/:id/status  # Update status
POST   /api/v1/convoys/:id/assign  # Assign vehicles
DELETE /api/v1/convoys/:id
GET    /api/v1/convoys/:id/events  # Events for convoy
```

### Alerts & Incidents
```
GET    /api/v1/alerts              # List
POST   /api/v1/alerts              # Create
GET    /api/v1/alerts/:id
PATCH  /api/v1/alerts/:id/acknowledge
PATCH  /api/v1/alerts/:id/resolve
```

### Messaging
```
GET    /api/v1/messages/channels              # Get available channels
GET    /api/v1/messages/channels/:id          # Get messages
POST   /api/v1/messages/channels/:id          # Send message
POST   /api/v1/messages/broadcast             # System broadcast
```

### Analytics
```
GET    /api/v1/analytics/dashboard            # KPIs
GET    /api/v1/analytics/fleet-utilization   # By region
GET    /api/v1/analytics/convoy-metrics      # Trends
GET    /api/v1/analytics/incident-heatmap    # Geographic
```

### Health Check
```
GET    /health                     # System status
```

## 🔄 Real-Time Events (Socket.IO)

```javascript
// Client connects with JWT
const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});

// Listen to events
socket.on('convoy:update', (data) => {
  console.log('Convoy status changed:', data);
});

socket.on('alert:new', (data) => {
  console.log('New critical alert:', data);
});

socket.on('vehicle:update', (data) => {
  console.log('Vehicle moved:', data);
});

socket.on('message:new', (data) => {
  console.log('New message:', data);
});
```

## 🧙 Database Schema

**Core Tables:**
- `users` - User accounts with roles (admin, dispatcher, operator, analyst)
- `vehicles` - Fleet vehicles with GPS coordinates, status, driver assignment
- `convoys` - Security missions/route plans
- `convoy_assignments` - Which vehicles assigned to which convoys
- `alerts` - System-generated or user-reported alerts (severity levels)
- `incidents` - Reported incidents with status tracking
- `messages` - Chat messages by channel
- `channels` - Communication channels
- `audit_logs` - Complete history of all data mutations

All tables include: `id`, `created_at`, `updated_at`, `deleted_at` (soft deletes).

## 🔐 Security Features

- **JWT Authentication**: Tokens in httpOnly cookies (configurable)
- **Role-Based Authorization**: Admin, Dispatcher, Operator, Analyst
- **Helmet.js**: Security headers (CSP, X-Frame-Options, etc.)
- **CORS**: Restricted to frontend domain only
- **Rate Limiting**: 100 req/15min per IP on auth routes
- **SQL Injection Prevention**: All queries parameterized with Pg lib
- **Password Hashing**: bcryptjs with salt rounds
- **Soft Deletes**: Data never hard-deleted for compliance
- **Audit Logs**: Every mutation tracked (who, when, what changed)
- **Request Validation**: Joi schema validation on all inputs
- **No Secrets in Code**: All env-based configuration

## 📊 Deployment Platforms

### Railway (Recommended)
- ✅ Built-in PostgreSQL & Redis
- ✅ Auto-deploys on git push
- ✅ Zero-config Socket.IO
- ✅ Workers run in same project
- ✅ Free tier covers small apps

### Vercel + External Backend
- ✅ Frontend: Vercel (fast CDN)
- ✅ Backend: Railway/Render (full features)
- ✅ API: Custom domain or proxy

### Self-Hosted
- Docker Compose on any Linux server
- Configure PostgreSQL & Redis externally
- Use Nginx as reverse proxy
- SSL with Let's Encrypt

## 🛠️ Environment Variables

**Backend (`backend/.env`):**
```env
DATABASE_URL=postgresql://user:pass@host:5432/convoy
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=<your-secret>
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourfrontend.com
LOG_LEVEL=info
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=https://your-backend.com/api/v1
VITE_SOCKET_URL=https://your-backend.com
```

## 📝 Example: Create a Convoy

```bash
curl -X POST http://localhost:5000/api/v1/convoys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Operation Alpha",
    "region": "Kenya",
    "priority": "high",
    "description": "VIP transport convoy",
    "departureTime": "2024-02-15T10:00:00Z"
  }'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Operation Alpha",
  "region": "Kenya",
  "status": "planned",
  "priority": "high",
  "created_at": "2024-02-14T15:30:00Z"
}
```

## 🧪 Testing

```bash
# Run API test script
bash ./test-api.sh

# Manual curl: Get all vehicles
curl http://localhost:5000/api/v1/vehicles?page=1&limit=20 \
  -H "Authorization: Bearer TOKEN"

# Check health
curl http://localhost:5000/health
```

## 🔄 Background Workers

**BullMQ processes run separately:**

```bash
# All workers
npm run workers

# Or individually
npm run worker:gps          # GPS location updates
npm run worker:alert        # Alert processing
npm run worker:notification # Email/SMS notifications
```

## 📚 File Structure Deep Dive

### Frontend
```
frontend/src/
├── pages/
│   ├── LoginPage.jsx          # Auth entry point
│   ├── DashboardPage.jsx      # KPIs, charts, events
│   ├── FleetPage.jsx          # Vehicle list/table
│   ├── ConvoysPage.jsx        # Convoy pipeline view
│   └── PlaceholderPages.jsx   # Alerts, Messages, Analytics, Settings
│
├── components/
│   ├── UI.jsx                 # Button, Input, Modal, Card, Badge, etc.
│   ├── Layout.jsx             # Sidebar + Header
│   ├── ProtectedRoute.jsx     # Route guards
│   └── ...other components
│
├── services/
│   ├── api.js                 # Axios client + endpoints
│   └── socket.js              # Socket.IO setup
│
├── store/
│   └── index.js               # Zustand stores (auth, vehicles, convoys, alerts, etc.)
│
├── hooks/
│   └── index.js               # useSocket, useAsync, useDebounce, useLocalStorage
│
├── utils/
│   └── helpers.js             # formatDate, statusColor, validators, etc.
│
└── App.jsx                    # Router setup
```

### Backend
```
backend/src/
├── app.js                     # Express + Socket.IO setup

├── controllers/
│   ├── authController.js      # login, getCurrentUser, logout
│   ├── vehicleController.js   # CRUD + filtering
│   ├── convoyController.js    # CRUD + assignment
│   └── alertController.js     # CRUD + resolve

├── routes/
│   ├── auth.js
│   ├── vehicles.js
│   ├── convoys.js
│   ├── alerts.js
│   ├── messages.js
│   └── analytics.js

├── middleware/
│   ├── auth.js                # authenticate, authorize
│   └── error.js               # errorHandler, asyncHandler

├── config/
│   ├── database.js            # PostgreSQL pool + schema init
│   └── redis.js               # Redis client

└── utils/
    └── logger.js              # Winston logger
```

## 🚀 Production Checklist

Before deploying:

- [ ] Remove all `console.log()` (use logger only)
- [ ] Set strong `JWT_SECRET` (32+ chars)
- [ ] Configure HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Enable security headers (Helmet)
- [ ] Configure CORS for your domain
- [ ] Set up database backups
- [ ] Monitor logs and errors
- [ ] Test auth flow end-to-end
- [ ] Verify Socket.IO reconnection
- [ ] Load test convoy updates
- [ ] Document API for team

## 🐛 Troubleshooting

**"Database connection failed"**
```bash
# Check PostgreSQL
psql $DATABASE_URL
# Run migrations
npm run migrate
```

**"Redis connection refused"**
```bash
# Check Redis
redis-cli ping
# Output: PONG
```

**"Socket.IO not connecting"**
```javascript
// In browser console
socket.on('connect_error', (error) => console.error(error));
```

**"401 Unauthorized"**
```bash
# Ensure token is in Authorization header
Authorization: Bearer eyJhbGc...
```

## 📞 Support

- Issues: [GitHub Issues](https://github.com/OnyariDEV/Fleet-Management/issues)
- Discussions: [GitHub Discussions](https://github.com/OnyariDEV/Fleet-Management/discussions)

## 📄 License

ISC - Use freely in personal and commercial projects.

## 👨‍💻 Author

**OnyariDEV** - Fullstack engineer specializing in real-time systems

---

## ⭐ Next Steps to Go Live

1. **Deploy Backend to Railway** (5 min)
   - Connect GitHub
   - Add PostgreSQL + Redis
   - Set JWT_SECRET
   - Deploy

2. **Deploy Frontend to Vercel** (3 min)
   - Connect GitHub
   - Set VITE_API_URL env
   - Deploy

3. **Verify**
   - Test login
   - Create a vehicle
   - Create a convoy
   - Check real-time updates

4. **Scale** (when needing more)
   - Add additional workers
   - Upgrade database tier
   - Configure CDN cache
   - Add monitoring/alerts

**You're now ready for production!** 🎉

### Easiest Setup (Recommended)
```bash
./setup.sh
```

### Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services:**
   ```bash
   # Using Docker Compose
   docker-compose up

   # Or directly with npm
   npm run dev
   ```

## Testing

Run the automated test suite:
```bash
./test-api.sh
```

Expected output:
```
✅ PASS - Health check returned 200
✅ PASS - Vehicles endpoint returned 200
✅ PASS - Invalid endpoint properly handled
✅ PASS - Response time: 14ms
✅ PASS - All 10 requests succeeded
```

## API Endpoints

### Health Check
- `GET /` - Server status

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
- `GET /api/convoys` - List all convoys
- `POST /api/convoys` - Create convoy
- `GET /api/convoys/:id` - Get convoy details

## Deployment

### Railway (Recommended)

Best for full-featured deployment with workers and real-time features.

```bash
# 1. Connect to Railway
# Import repository at https://railway.app

# 2. Set environment variables in Railway dashboard
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key

# 3. Railway auto-deploys on push
git push origin main
```

### Vercel (Static Frontend)

This repository includes a static frontend in `public/` that can be deployed to Vercel.
If you want the full API backend too, host the backend separately on Railway or Render.

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy the frontend
vercel --prod
```

Then set the backend API URL in `public/config.js`:
```js
window.API_ROOT = 'https://your-backend.example.com/api';
```

If the backend is hosted on the same domain, keep `window.API_ROOT = '/api'`.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

## Configuration

### Environment Variables

**Required:**
```env
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/convoy
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

**Optional:**
```env
DISABLE_REDIS=false          # Set to 'true' for Vercel or when no Redis service is available
GOOGLE_MAPS_API_KEY=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
```

> Note: In production, do not leave `REDIS_URL=redis://127.0.0.1:6379` unless Redis is running in the same runtime. If Redis is unavailable, set `DISABLE_REDIS=true`.

See `.env.example` for all options.

## Docker Setup

### Using Docker Compose

```bash
# Start all services (app, postgres, redis)
docker-compose up

# Start background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t fleet-management .

# Run container
docker run -p 5000:5000 fleet-management
```

## Known Issues - FIXED ✅

### ✅ Redis Connection Error (RESOLVED)
**Problem**: `ECONNREFUSED 127.0.0.1:6379`
**Solution**: 
- Installed Redis locally: `sudo apt install redis-server`
- Configured proper connection string
- Added graceful fallback for Vercel deployments

### ✅ Database Connection (VERIFIED)
**Status**: Working - automatic table creation on startup

### ✅ Port Conflicts (RESOLVED)
**Solution**: Proper process cleanup and port management

## Troubleshooting

### Redis Not Running
```bash
sudo service redis-server restart
redis-cli ping  # Should respond: PONG
```

### Port 5000 Already in Use
```bash
lsof -i :5000
kill -9 <PID>
```

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -h localhost -U postgres

# Create database
createdb -h localhost -U postgres convoy
```

### Clear Everything and Start Fresh
```bash
# Kill all node processes
pkill -f "node"

# Remove logs
rm -f *.log

# Restart services
npm run dev
```

## Performance

- **API Response Time**: ~14ms average
- **Throughput**: 10+ requests/second sustained
- **Database Connections**: Connection pooling with 20 max connections
- **Redis Connections**: Optimized for BullMQ with retry logic

## Production Checklist

- [ ] Redis running and accessible
- [ ] PostgreSQL backups configured
- [ ] JWT_SECRET set to secure value
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Health endpoint responding
- [ ] API tests passing
- [ ] Workers initializing
- [ ] Logs configured and monitored
- [ ] CORS configured for frontend
- [ ] Error monitoring enabled

## Getting Help

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
2. Review logs: `docker-compose logs -f`
3. Test API: `./test-api.sh`
4. Review `.env` configuration

## License

ISC
   - `JWT_SECRET` (generate a secure secret)
   - `NODE_ENV=production`
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` (for email alerts)

3. **Deploy:**
   Railway will build and deploy automatically on push.

## Testing

### GPS Pipeline Test
```bash
curl -X POST http://localhost:5000/api/gps \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "1",
    "lat": 40.7128,
    "lng": -74.0060,
    "speed": 130,
    "timestamp": "2024-01-01T12:00:00Z"
  }'
```

### WebSocket Test
Connect to `ws://localhost:5000` and listen for real-time updates.

## Architecture

### Pipeline Flow
1. **Input**: GPS data received via API
2. **Validation**: Joi schema validation
3. **Queue**: Job added to BullMQ queue
4. **Worker**: Background processing
5. **Decision Logic**: Alert generation
6. **Output**: Database storage + WebSocket broadcast + Notifications

### Reliability Features
- Queue retries with exponential backoff
- Database connection pooling
- Error logging and monitoring
- Graceful failure handling
- Health checks for deployment

## Contributing

1. Follow the pipeline-first architecture
2. Add proper error handling and logging
3. Test thoroughly before committing
4. Update documentation as needed

## License

ISC