# Docker Development Setup for Firefly III Angular UI

## Overview

This guide explains how to develop and deploy the Angular Material 3 frontend using Docker containers. There are two modes:

1. **Development Mode** (`firefly-ui-dev`): Hot-reload, live changes
2. **Production Mode** (`firefly-ui`): Optimized build, served by nginx

---

## Quick Start

### Option 1: Development Mode (Recommended for Coding)

```bash
# From repository root
cd C:\Vishnu\Code\firefly-iii

# Start all services in development mode
docker-compose up -d

# This starts:
#  - MySQL database (firefly-db)
#  - Laravel backend API (firefly-app) 
#  - Angular dev server (firefly-ui-dev) with hot-reload
#  - Data Importer (firefly-importer)

# Access the application
# - Frontend (dev): http://localhost:4200
# - Backend API: http://localhost:8081/api
# - Data Importer: http://localhost:8888
```

### Option 2: Production Mode (Full Deployment)

```bash
# Build production image
docker-compose build firefly-ui

# Start with production profile
docker-compose --profile prod up -d

# Access the application
# - Frontend (prod): http://localhost:80
# - Backend API: http://localhost:8081/api
# - Data Importer: http://localhost:8888
```

---

## Development Workflow with Docker

### 1. Start Development Environment

```bash
docker-compose up -d

# View logs
docker-compose logs -f firefly-ui-dev

# Frontend will be available at http://localhost:4200
# Changes to src/ files auto-reload
```

### 2. Make Code Changes

```bash
# Edit files in resources/angular/src/
# Changes automatically reflect in browser via hot-reload
vim resources/angular/src/app/app.component.ts
```

### 3. Add Dependencies

```bash
# If you need new npm packages
docker-compose exec firefly-ui-dev npm install <package-name>

# This modifies package.json inside container
# Update your local package.json to match

# Or rebuild the container
docker-compose down
docker-compose build --no-cache firefly-ui-dev
docker-compose up -d
```

### 4. Run Tests

```bash
# Run unit tests inside container
docker-compose exec firefly-ui-dev npm test

# Run E2E tests
docker-compose exec firefly-ui-dev npm run e2e
```

### 5. Build for Production

```bash
# Inside the dev container
docker-compose exec firefly-ui-dev npm run build:prod

# Or rebuild the production image
docker-compose build firefly-ui

# Production bundle will be at:
# resources/angular/dist/firefly-ui/
```

---

## Docker Compose Services

### firefly-db (MySQL Database)
```yaml
- Image: mysql:8.0
- Port: 3306
- Volume: firefly-db (persistent)
- Status: Essential (all services depend on it)
```

### firefly-app (Laravel Backend API)
```yaml
- Image: fireflyiii/core:latest
- Port: 8081 (internal: 8080)
- Volume: firefly-app (uploads)
- Status: Running, health checks enabled
- Role: Provides REST API endpoints
```

### firefly-ui-dev (Angular Development Server)
```yaml
- Build: Dockerfile.angular.dev
- Port: 4200
- Volumes:
  - src/ mounted for hot-reload
  - node_modules cached
- Role: Development with live reloading
- Status: Default in docker-compose.yml
```

### firefly-ui (Angular Production Build)
```yaml
- Build: Dockerfile.angular
- Port: 80
- Image: Multi-stage build (production optimized)
- Role: Production deployment
- Status: Only enabled with --profile prod
```

### firefly-importer (Data Importer)
```yaml
- Image: fireflyiii/data-importer:latest
- Port: 8888
- Volume: firefly-importer (uploads)
- Status: Running, health checks enabled
```

---

## Development Commands

### Container Management

```bash
# Start all services
docker-compose up -d

# Stop all services (keeps volumes)
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# View service status
docker-compose ps

# View logs for specific service
docker-compose logs -f firefly-ui-dev

# View logs for all services
docker-compose logs -f

# Rebuild specific service
docker-compose build --no-cache firefly-ui-dev

# Restart specific service
docker-compose restart firefly-ui-dev
```

### Inside Container (Exec Commands)

```bash
# Access Angular development container shell
docker-compose exec firefly-ui-dev sh

# Run npm commands
docker-compose exec firefly-ui-dev npm test
docker-compose exec firefly-ui-dev npm run lint
docker-compose exec firefly-ui-dev npm run build:prod

# Run Angular CLI commands
docker-compose exec firefly-ui-dev ng generate component features/accounts/account-list
docker-compose exec firefly-ui-dev ng serve --help
```

### Network & Connectivity

```bash
# Test connectivity from Angular to Backend API
docker-compose exec firefly-ui-dev curl -v http://firefly-app:8080/api/v1/about

# Check DNS resolution
docker-compose exec firefly-ui-dev nslookup firefly-app

# Test database connectivity from app
docker-compose exec firefly-app mysql -h firefly-db -u firefly -p firefly
```

---

## Dockerfile Specifications

### Dockerfile.angular.dev (Development)

**Purpose**: Local development with hot-reload

**Stages**: Single stage (small image for development)

**Key Features**:
- Node 18 Alpine (small base)
- Angular CLI installed globally
- npm ci for reproducible installs
- Volume mounts for source code
- Health check enabled
- Poll-based file watching (for Docker volume compatibility)

**Build Time**: ~3-5 minutes
**Image Size**: ~500MB

### Dockerfile.angular (Production)

**Purpose**: Optimized production deployment

**Stages**: Two stages (multi-stage build)
1. **Builder Stage**: Builds Angular app for production
2. **Runtime Stage**: nginx + built app

**Key Features**:
- Node 18 Alpine for building
- Production build optimizations
- nginx Alpine runtime (small)
- Security hardening (non-root user)
- Health check enabled
- Gzip compression enabled
- Cache control headers

**Build Time**: ~5-10 minutes
**Final Image Size**: ~50MB (vs 500MB for dev)

---

## API Connectivity

### Development Mode

The Angular container can reach the backend API via:

```
http://firefly-app:8080
```

Inside the Angular container, all requests to `/api/*` should be proxied to:

```
http://firefly-app:8080/api/*
```

**Configure in environment.dev.ts**:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://firefly-app:8080'
};
```

### Production Mode

From the browser, requests to `/api/*` will be handled by nginx proxy:

```
http://localhost/api/* → http://firefly-app:8080/api/*
```

**nginx.conf handles the routing**:
```nginx
location /api/ {
  proxy_pass http://firefly-app:8080;
}
```

---

## Volumes Explained

### Volume: firefly-db
- **Type**: Named Docker volume
- **Purpose**: MySQL database persistence
- **Location**: `/var/lib/mysql` inside container
- **Lifecycle**: Persists across container restarts
- **Cleanup**: `docker-compose down -v` removes it

### Volume: firefly-app
- **Type**: Named Docker volume
- **Purpose**: User uploads storage
- **Location**: `/var/www/html/storage/upload`
- **Lifecycle**: Persists across container restarts

### Volume: angular-node-modules
- **Type**: Named Docker volume
- **Purpose**: Cache npm dependencies
- **Location**: `/app/node_modules`
- **Benefit**: Faster restarts (node_modules already installed)

### Volume: src/ (Development Only)
- **Type**: Bind mount
- **Purpose**: Live code editing
- **Local Path**: `./resources/angular/src`
- **Container Path**: `/app/src`
- **Behavior**: Changes on local machine appear in container immediately

---

## Docker Network

### Network: firefly-network

All services are connected on a custom bridge network:

```
firefly-network (bridge)
├── firefly-db (MySQL)
├── firefly-app (Laravel API)
├── firefly-ui-dev (Angular dev)
├── firefly-ui (Angular prod)
└── firefly-importer (Data Importer)
```

### Service Discovery

Services can reach each other by hostname:

```
firefly-app:8080        (from Angular)
firefly-db:3306         (from Laravel)
firefly-ui:80           (from browser)
firefly-ui-dev:4200     (from browser)
firefly-importer:8080   (from Angular)
```

---

## Health Checks

Each service has a health check:

```yaml
firefly-db:
  test: mysqladmin ping

firefly-app:
  test: curl /api/v1/about

firefly-ui-dev:
  test: wget /

firefly-ui:
  test: wget /

firefly-importer:
  test: curl /health
```

Check health status:

```bash
docker-compose ps
# Healthy = green circle
# Unhealthy = red circle
```

---

## Troubleshooting

### Issue: "Cannot connect to Docker daemon"

```bash
# Ensure Docker Desktop is running
# On Windows: Open Docker Desktop from Start menu

# Or start Docker service
systemctl start docker  # Linux
```

### Issue: Port Already in Use

```bash
# Check what's using the port
netstat -ano | findstr :4200  # Windows
lsof -i :4200               # Mac/Linux

# Change port in docker-compose.yml
# Change 4200:4200 to 4201:4200
```

### Issue: "Cannot GET /" at localhost:4200

```bash
# Development server may still be starting
docker-compose logs -f firefly-ui-dev

# Wait for "Application bundle generated successfully"
# Then refresh browser
```

### Issue: API calls failing from Angular

```bash
# Test connectivity
docker-compose exec firefly-ui-dev curl http://firefly-app:8080

# Check if backend is healthy
docker-compose ps firefly-app
# Should show "healthy"

# Review environment.dev.ts
cat resources/angular/src/environments/environment.dev.ts
```

### Issue: Changes not reflecting in browser

```bash
# Hard refresh browser (Ctrl+Shift+R)

# Check file watching is working
docker-compose logs -f firefly-ui-dev

# Rebuild image if necessary
docker-compose build --no-cache firefly-ui-dev
docker-compose up -d firefly-ui-dev
```

### Issue: Node modules version conflicts

```bash
# Delete and rebuild
docker-compose exec firefly-ui-dev rm -rf node_modules
docker-compose exec firefly-ui-dev npm ci

# Or rebuild entire container
docker-compose down
docker volume rm firefly-iii_angular-node-modules
docker-compose up -d
```

---

## Production Deployment

### Step 1: Build Production Image

```bash
# From repository root
docker-compose build firefly-ui

# Verify build succeeded
docker images | grep firefly-ui
```

### Step 2: Start Production Stack

```bash
# Start with production profile
docker-compose --profile prod up -d

# Verify all services are healthy
docker-compose ps

# Check Angular production app
curl http://localhost/
```

### Step 3: Verify Functionality

```bash
# Test API connectivity
curl http://localhost/api/v1/about

# Check bundle size
curl -I http://localhost/main.*.js | grep content-length

# Monitor logs
docker-compose logs -f firefly-ui
```

### Step 4: Backup Before Switching

```bash
# Backup database
docker-compose exec firefly-db mysqldump -u firefly -pfirely_password firefly > firefly_backup.sql

# Backup volumes
docker run --rm \
  -v firefly-iii_firefly-db:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/firefly-db-backup.tar.gz -C /data .
```

---

## Performance Optimization

### Development Container

```bash
# Increase memory allocation if needed
# In docker-compose.yml under firefly-ui-dev:
# Add:
# deploy:
#   resources:
#     limits:
#       memory: 2G
```

### Production Container

```bash
# Use nginx caching headers
# Already configured in nginx.conf

# Verify compression is enabled
docker-compose exec firefly-ui curl -I http://localhost/
# Should show: Content-Encoding: gzip
```

### Build Cache

```bash
# Use build cache for faster rebuilds
docker-compose build firefly-ui

# Force rebuild without cache
docker-compose build --no-cache firefly-ui

# Build specific target
docker-compose build --no-cache firefly-ui-dev
```

---

## Useful Docker Commands

### General

```bash
# List all images
docker images

# List all containers
docker ps -a

# Remove unused images
docker image prune

# Remove all containers
docker container prune

# Show disk usage
docker system df

# Full cleanup (WARNING: deletes everything)
docker system prune -a
```

### Debugging

```bash
# Inspect container details
docker inspect firefly-iii-firefly-ui-dev-1

# View container processes
docker top firefly-iii-firefly-ui-dev-1

# View container resource usage
docker stats firefly-iii-firefly-ui-dev-1

# Copy file from container
docker cp firefly-iii-firefly-ui-dev-1:/app/dist ./dist-backup
```

### Development

```bash
# Open shell in running container
docker exec -it firefly-iii-firefly-ui-dev-1 sh

# Run one-off command
docker-compose run firefly-ui-dev npm test

# Build without starting
docker-compose build firefly-ui-dev

# Kill all containers
docker-compose kill
```

---

## Migration Path: From Local to Docker

### If Already Developing Locally

```bash
# 1. Save local work
git add .
git commit -m "Save local development work"

# 2. Delete local node_modules
rm -rf resources/angular/node_modules

# 3. Switch to Docker development
docker-compose up -d firefly-ui-dev

# 4. Development continues in Docker
docker-compose exec firefly-ui-dev npm test
```

---

## FAQ

**Q: Do I need to install Node.js locally?**
A: No! Everything runs in Docker. Docker includes Node 18 and npm.

**Q: Can I still use my local IDE?**
A: Yes! Edit files in `resources/angular/src/` and changes appear in Docker container via volume mounts.

**Q: How do I debug TypeScript errors?**
A: Angular CLI runs in container, errors appear in terminal and browser console.

**Q: What if I want to use npm for a quick test?**
A: Use `docker-compose exec firefly-ui-dev npm <command>`

**Q: Can I run both dev and prod simultaneously?**
A: Yes! Dev runs on 4200, prod on 80. They don't conflict.

**Q: How much disk space do these containers take?**
A: ~2-3GB for all volumes + images combined.

**Q: Is Docker development as fast as local development?**
A: With bind mounts for source code, performance is nearly identical. File polling might add slight latency on Windows.

---

## Summary

| Aspect | Development | Production |
|--------|------------|-----------|
| Docker Compose Service | `firefly-ui-dev` | `firefly-ui` |
| Dockerfile | `Dockerfile.angular.dev` | `Dockerfile.angular` |
| Port | 4200 | 80 |
| Base Image | Node 18 Alpine | nginx Alpine |
| Volumes | Bind mounts (src/), named (node_modules) | None (image built-in) |
| Build Time | N/A (development) | 5-10 min |
| Image Size | 500MB | 50MB |
| Hot-Reload | Yes | No |
| Optimization | None | Production build |
| Use Case | Active development | Deployment |

---

**All development and deployment happens in Docker containers. No local npm/node required.**

Created: 2026-05-21 19:27 UTC+02:00
