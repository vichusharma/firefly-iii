# Firefly III Docker-Based Development - Quick Reference

**Status**: ✅ Docker setup configured for Angular frontend

---

## 🚀 START DEVELOPMENT IN 3 COMMANDS

```bash
# 1. Navigate to project root
cd C:\Vishnu\Code\firefly-iii

# 2. Start Docker containers
docker-compose up -d

# 3. Open in browser
# Frontend (Dev):    http://localhost:4200
# Backend API:       http://localhost:8081
# Data Importer:     http://localhost:8888
```

---

## 📋 DOCKER SETUP SUMMARY

### Updated Files

✅ **docker-compose.yml** (Completely rewritten)
- `firefly-db` - MySQL database
- `firefly-app` - Laravel backend (port 8081)
- `firefly-ui-dev` - Angular dev server (port 4200) ← DEFAULT
- `firefly-ui` - Angular production (port 80) - requires `--profile prod`
- `firefly-importer` - Data importer (port 8888)

✅ **docker/Dockerfile.angular.dev** (NEW)
- Development container with hot-reload
- Source code mounted via volume
- npm ci + ng serve
- Health checks enabled

✅ **docker/Dockerfile.angular** (UPDATED)
- Production build (multi-stage)
- Nginx runtime
- Optimized bundle
- Security hardened

✅ **DOCKER_DEVELOPMENT_GUIDE.md** (NEW)
- 15KB comprehensive guide
- All Docker commands
- Troubleshooting section
- Best practices

### Volume Mounts

```
Development Mode:
  • ./resources/angular/src/ → /app/src       (code changes)
  • angular-node-modules → /app/node_modules  (cached)

Production Mode:
  • Built into image (no mounts)
```

---

## 💻 COMMON DOCKER COMMANDS

### View Status
```bash
docker-compose ps                          # See all services
docker-compose logs -f firefly-ui-dev      # Watch dev logs
```

### Development Workflow
```bash
# Make changes in resources/angular/src/
# → Browser auto-refreshes (hot-reload)

# Add npm package
docker-compose exec firefly-ui-dev npm install package-name

# Run tests
docker-compose exec firefly-ui-dev npm test

# Generate component
docker-compose exec firefly-ui-dev ng generate component features/X/comp
```

### Stop/Restart
```bash
docker-compose down                        # Stop (keeps data)
docker-compose down -v                     # Stop + delete data
docker-compose restart firefly-ui-dev      # Restart one service
```

### Production Build
```bash
docker-compose build firefly-ui            # Build prod image
docker-compose --profile prod up -d        # Start production
```

---

## 🔌 SERVICE CONNECTIVITY

### From Angular Container to Backend
```
http://firefly-app:8080
```

### From Browser to Services
```
Frontend (dev):     http://localhost:4200
Frontend (prod):    http://localhost:80
Backend:            http://localhost:8081
API:                http://localhost:8081/api
Importer:           http://localhost:8888
```

### Network Diagram
```
Browser
  ↓
nginx (production) or Angular dev server
  ↓
Docker Network (firefly-network)
  ├── firefly-ui-dev:4200 (Angular)
  ├── firefly-app:8080 (Backend API)
  ├── firefly-db:3306 (MySQL)
  └── firefly-importer:8080 (Importer)
```

---

## 📦 DEVELOPMENT MODES

### Mode 1: Development (Default)

```bash
docker-compose up -d
```

**Running Services**:
- Angular dev server (4200) with hot-reload ✅
- Laravel backend (8081)
- MySQL database
- Data Importer (8888)

**Use For**: Active development, coding

**Access**: http://localhost:4200

**Features**:
- Live code reloading
- Source maps for debugging
- Full TypeScript errors
- Unminified bundles

---

### Mode 2: Production

```bash
docker-compose build firefly-ui
docker-compose --profile prod up -d
```

**Running Services**:
- Angular production app (80) ✅
- Laravel backend (8081)
- MySQL database
- Data Importer (8888)

**Use For**: Testing production build, deployment

**Access**: http://localhost:80

**Features**:
- Optimized bundle
- Minified code
- Gzip compression
- Security headers

---

## ✅ EVERYTHING RUNS IN DOCKER

### No Local Installation Needed
```
❌ DON'T install Node.js locally
❌ DON'T install npm locally
❌ DON'T run npm start locally
✅ DO use Docker containers
```

### Your Setup
```
Machine:
  • Docker Desktop (running)
  • Text editor (VS Code)
  • Git CLI
  • Browser

Container:
  • Node.js 18 (Alpine)
  • npm 10
  • Angular CLI 18
  • All dependencies
```

---

## 🎯 DEVELOPMENT WORKFLOW

### 1. Before You Start
```bash
# Start Docker
# (Open Docker Desktop or run: systemctl start docker)

# Clone repository (if not done)
git clone https://github.com/vichusharma/firefly-iii.git
cd firefly-iii

# Switch to feature branch
git checkout feat/angular-material3-ui-rewrite
```

### 2. Start Development
```bash
# Start all services
docker-compose up -d

# Verify healthy
docker-compose ps
# All should show: Up (X seconds) 

# View dev logs (optional)
docker-compose logs -f firefly-ui-dev
```

### 3. Edit Code
```bash
# Open text editor/IDE
code .

# Edit files in: resources/angular/src/

# Changes auto-reload in browser
# http://localhost:4200
```

### 4. Test Changes
```bash
# Run unit tests
docker-compose exec firefly-ui-dev npm test

# Run E2E tests
docker-compose exec firefly-ui-dev npm run e2e

# Check linting
docker-compose exec firefly-ui-dev npm run lint
```

### 5. Commit Work
```bash
git add .
git commit -m "feat: implement accounts module"
git push origin feat/angular-material3-ui-rewrite
```

### 6. End of Day
```bash
# Keep running (keeps data)
docker-compose ps

# OR stop if not working tomorrow
docker-compose down
```

---

## 🐛 TROUBLESHOOTING

### "Cannot connect to Docker daemon"
```
• Windows: Start Docker Desktop from Start menu
• Linux: sudo systemctl start docker
• Mac: Open Docker app
```

### "Port 4200 already in use"
```bash
# Change port in docker-compose.yml
# Change: 4200:4200
# To:     4201:4200

# Then rebuild
docker-compose up -d
```

### "Cannot GET /" at localhost:4200
```bash
# Angular dev server still starting
docker-compose logs firefly-ui-dev

# Look for: "Application bundle generated successfully"
# Then refresh browser
```

### "API calls failing"
```bash
# Test connectivity
docker-compose exec firefly-ui-dev curl http://firefly-app:8080

# Check backend health
docker-compose ps firefly-app
# Should show: Up (X seconds) 

# Check firefly-app logs
docker-compose logs firefly-app
```

### "Changes not showing in browser"
```bash
# Hard refresh (Ctrl+Shift+R)
# Or rebuild image
docker-compose build --no-cache firefly-ui-dev
docker-compose up -d
```

### More Help
See: **DOCKER_DEVELOPMENT_GUIDE.md** (comprehensive troubleshooting)

---

## 📊 SERVICES TABLE

| Service | Port | Container | Status | Use |
|---------|------|-----------|--------|-----|
| Angular Dev | 4200 | firefly-ui-dev | ✅ Default | Development |
| Angular Prod | 80 | firefly-ui | -- | Production only |
| Backend API | 8081 | firefly-app | ✅ Running | API calls |
| Database | 3306 | firefly-db | ✅ Running | Data storage |
| Importer | 8888 | firefly-importer | ✅ Running | Import tool |

---

## 📁 KEY FILES

- ✅ `docker-compose.yml` - All service definitions
- ✅ `docker/Dockerfile.angular.dev` - Dev server build
- ✅ `docker/Dockerfile.angular` - Production build
- ✅ `DOCKER_DEVELOPMENT_GUIDE.md` - Full Docker guide
- ✅ `resources/angular/` - Source code (mounted in dev)

---

## 🔄 QUICK COMMANDS REFERENCE

```bash
# Start development
docker-compose up -d

# Stop development
docker-compose down

# View logs
docker-compose logs -f firefly-ui-dev

# Run tests
docker-compose exec firefly-ui-dev npm test

# Generate component
docker-compose exec firefly-ui-dev ng generate component features/name

# Build production
docker-compose build firefly-ui

# Deploy production
docker-compose --profile prod up -d

# Clean rebuild
docker-compose down -v
docker-compose build --no-cache firefly-ui-dev
docker-compose up -d

# Shell access
docker-compose exec firefly-ui-dev sh

# Full cleanup
docker system prune -a --volumes
```

---

## ✨ NEXT STEPS

1. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

2. **Wait for health checks** (1-2 minutes)
   ```bash
   docker-compose ps
   ```

3. **Open http://localhost:4200**
   - Angular dev server running
   - Connected to backend API (8081)

4. **Create first feature module**
   ```bash
   docker-compose exec firefly-ui-dev ng generate module features/dashboard
   ```

5. **Build dashboard component**
   ```bash
   docker-compose exec firefly-ui-dev ng generate component features/dashboard/dashboard
   ```

6. **Start coding!**
   - Edit files in `resources/angular/src/`
   - Changes auto-reload
   - Browser shows live updates

---

## 🎯 REMEMBER

✅ All development happens in Docker
✅ No Node.js needed on your machine
✅ Source code edited locally, runs in Docker
✅ Hot-reload works via volume mounts
✅ Backend API always accessible (firefly-app:8080)
✅ Database persisted in named volume
✅ Production build separate from development

---

**Ready to start? Run:** `docker-compose up -d`

Created: 2026-05-21 19:27 UTC+02:00
Branch: feat/angular-material3-ui-rewrite
