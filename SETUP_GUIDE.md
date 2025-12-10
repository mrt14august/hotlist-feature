# Quick Setup & Testing Guide

This document provides step-by-step instructions to set up, run, and test the My List OTT Backend API.

## System Requirements

- **Node.js**: v22 or higher
- **Docker**: 20.10+ (optional but recommended)
- **Docker Compose**: 1.29+ (optional but recommended)
- **MongoDB**: v7.0+ (required if not using Docker)
- **Redis**: v7.0+ (required if not using Docker)

## Quick Start with Docker (Recommended - 2 minutes)

This is the easiest way to get everything running.

### Step 1: Start Services

```bash
cd /path/to/myList-BE
docker-compose up -d
```

This starts:
- **MongoDB** on port 27017 (user: admin, password: password)
- **Redis** on port 6379
- **Node.js API** on port 3000

### Step 2: Verify Services

```bash
# Check all services are running
docker-compose ps

# Expected output:
# NAME       IMAGE          STATUS
# mongodb    mongo:7.0      Up (healthy)
# redis      redis:7-alpine Up (healthy)
# app        mylist-api:... Up

# Test API health
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"2024-..."}
```

### Step 3: Seed Database

```bash
docker-compose exec app npm run seed

# Expected output:
# ✓ Database seeding completed successfully!
# Test User IDs:
#   john_doe: 507f1f77bcf86cd799439011
#   ...
```

**Save the User IDs and Content IDs for testing!**

### Step 4: Run Tests

```bash
docker-compose exec app npm test

# Expected output:
# Test Suites: 1 passed, 1 total
# Tests:       23 passed, 23 total
```

### Step 5: Test with Postman

See [Postman Testing](#postman-testing) section below.

---

## Local Development Setup (Without Docker)

If you prefer to run services locally.

### Prerequisites

Ensure these services are running:

**MongoDB**:
```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or run directly
mongod
```

**Redis**:
```bash
# macOS with Homebrew
brew services start redis

# Linux
redis-server

# Or run in Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB/Redis connection
# Example:
# MONGODB_URI=mongodb://localhost:27017/mylist-ott
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

### Run Application

```bash
# Development mode (with hot reload)
npm run dev

# Or production mode
npm start
```

### Seed Database

```bash
npm run seed
```

### Run Tests

```bash
npm test
```

---

## Postman Testing

### Option 1: Import Collection File

1. Open Postman
2. Click **Import** button
3. Select **Upload Files** or paste JSON
4. Choose `postman_collection.json` from the repo
5. Click Import

The collection includes all endpoints with example requests.

### Option 2: Manual Testing

#### 1. Health Check

```
GET http://localhost:3000/health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

#### 2. Add Movie to List

```
POST http://localhost:3000/api/mylist/add

Headers:
- Content-Type: application/json
- user-id: 507f1f77bcf86cd799439011 (from seed output)

Body:
{
  "contentId": "507f1f77bcf86cd799439012",
  "contentType": "movie"
}

Response (201):
{
  "success": true,
  "message": "Item added to your list",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "contentId": "507f1f77bcf86cd799439012",
    "contentType": "movie",
    "addedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

#### 3. Get List Items

```
GET http://localhost:3000/api/mylist/items?page=1&pageSize=10

Headers:
- user-id: 507f1f77bcf86cd799439011

Response (200):
{
  "success": true,
  "data": {
    "items": [
      {
        "userId": "507f1f77bcf86cd799439011",
        "contentId": "507f1f77bcf86cd799439012",
        "contentType": "movie",
        "addedAt": "2024-01-20T10:30:00.000Z",
        "content": {
          "id": "507f1f77bcf86cd799439012",
          "title": "The Matrix",
          "description": "...",
          "genres": ["SciFi", "Action"],
          "releaseDate": "1999-03-31T00:00:00.000Z",
          "director": "...",
          "actors": [...]
        }
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

#### 4. Remove from List

```
DELETE http://localhost:3000/api/mylist/remove/507f1f77bcf86cd799439012

Headers:
- user-id: 507f1f77bcf86cd799439011

Response (200):
{
  "success": true,
  "message": "Item removed from your list"
}
```

#### 5. Get List Statistics

```
GET http://localhost:3000/api/mylist/stats

Headers:
- user-id: 507f1f77bcf86cd799439011

Response (200):
{
  "success": true,
  "data": {
    "total": 5,
    "byType": {
      "movie": 3,
      "tvshow": 2
    }
  }
}
```

---

## curl Testing Examples

### Add to List

```bash
curl -X POST http://localhost:3000/api/mylist/add \
  -H "Content-Type: application/json" \
  -H "user-id: 507f1f77bcf86cd799439011" \
  -d '{"contentId": "507f1f77bcf86cd799439012", "contentType": "movie"}'
```

### Get List Items

```bash
curl -X GET "http://localhost:3000/api/mylist/items?page=1&pageSize=10" \
  -H "user-id: 507f1f77bcf86cd799439011"
```

### Remove from List

```bash
curl -X DELETE http://localhost:3000/api/mylist/remove/507f1f77bcf86cd799439012 \
  -H "user-id: 507f1f77bcf86cd799439011"
```

### Get Statistics

```bash
curl -X GET http://localhost:3000/api/mylist/stats \
  -H "user-id: 507f1f77bcf86cd799439011"
```

---

## Stopping & Cleanup

### Docker

```bash
# Stop all services
docker-compose down

# Stop and remove all volumes (clears data)
docker-compose down -v
```

### Local

```bash
# Stop development server
Ctrl + C

# Stop MongoDB
brew services stop mongodb-community  # macOS
sudo systemctl stop mongod            # Linux

# Stop Redis
brew services stop redis              # macOS
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check if ports are in use
lsof -i :3000  # API
lsof -i :27017 # MongoDB
lsof -i :6379  # Redis

# Kill process using port
kill -9 <PID>

# Or use different ports
# Edit docker-compose.yml or .env
```

### Database Connection Error

```bash
# Verify MongoDB is running
mongosh "mongodb://admin:password@localhost:27017/mylist-ott?authSource=admin"

# Check connection string in .env
cat .env | grep MONGODB_URI
```

### Redis Connection Error

```bash
# Test Redis connection
redis-cli ping
# Expected: PONG

# Check Redis config
redis-cli info
```

### Tests Failing

```bash
# Make sure services are healthy
docker-compose ps

# Check service logs
docker-compose logs mongodb
docker-compose logs redis
docker-compose logs app

# Clear data and reseed
docker-compose down -v
docker-compose up -d
npm run seed
npm test
```

---

## Performance Testing

### Load Testing (with Apache Bench)

```bash
# Install ab (Apache Bench)
# macOS: brew install httpd
# Linux: sudo apt-get install apache2-utils

# Test GET /api/mylist/items endpoint
# 100 requests, 10 concurrent
ab -n 100 -c 10 -H "user-id: 507f1f77bcf86cd799439011" \
  http://localhost:3000/api/mylist/items

# Expected: Requests per second: ~50-100 (depending on system)
#           Mean time per request: <20ms
```

### Load Testing (with Apache JMeter)

1. Download JMeter
2. Create test plan with:
   - Thread Group: 100 users, 10 second ramp-up
   - HTTP Sampler: GET http://localhost:3000/api/mylist/items
   - Add Header Manager with user-id header
3. Run and check results

---

## File Structure

```
myList-BE/
├── src/                          # Source code
│   ├── __tests__/               # Integration tests
│   ├── controllers/             # Request handlers
│   ├── db/                      # Database connections
│   ├── middleware/              # Express middleware
│   ├── models/                  # Database schemas
│   ├── routes/                  # API routes
│   ├── scripts/                 # Utility scripts (seed)
│   ├── services/                # Business logic
│   ├── types/                   # TypeScript interfaces
│   └── server.ts               # Express app entry point
├── dist/                        # Compiled JavaScript
├── Dockerfile                   # Production Docker image
├── docker-compose.yml          # Full stack (API + MongoDB + Redis)
├── docker-compose.dev.yml      # Dev stack (MongoDB + Redis only)
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── jest.config.js             # Test config
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── postman_collection.json    # Postman API collection
└── README.md                  # Full documentation
```

---

## Next Steps

1. ✅ Setup and run the application
2. ✅ Seed the database
3. ✅ Run integration tests
4. ✅ Test with Postman or curl
5. 📝 Review code in `src/` directory
6. 🚀 Deploy to your infrastructure

---

## Support & Documentation

- Full API documentation: See `README.md`
- Test examples: See `src/__tests__/myList.integration.test.ts`
- Database schemas: See `src/models/`
- Performance optimization: See `src/services/myListService.ts`

Enjoy! 🎉
