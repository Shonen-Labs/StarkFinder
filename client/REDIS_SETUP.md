# Redis Setup for StarkFinder Contract Caching

## Overview
StarkFinder uses Redis to cache recently generated contracts for each user and session. This enables fast access, management, and deletion of contracts before deployment.

---

## Environment Variables
- `REDIS_URL`: The connection string for your Redis instance (e.g., `redis://localhost:6379`).
- `CONTRACT_CACHE_TTL`: Cache expiration time in seconds (optional, defaults to 604800 = 7 days).

Add these to your `.env` file:
```
REDIS_URL=redis://localhost:6379
# Optional: Configure cache TTL (in seconds)
# CONTRACT_CACHE_TTL=604800  # 7 days (default)
# CONTRACT_CACHE_TTL=86400   # 1 day (for development)
# CONTRACT_CACHE_TTL=3600    # 1 hour (for testing)
```

---

## Local Redis Setup (Docker)
To run Redis locally using Docker:
```
docker run --name starkfinder-redis -p 6379:6379 -d redis
```

Or install Redis directly:
```
sudo apt-get install redis-server
redis-server
```

---

## Cache Key Structure
- **User contracts list:** `user:{userId}:contracts` (Redis list of contract IDs)
- **Session contracts list:** `session:{sessionId}:contracts` (Redis list of contract IDs)
- **Contract object:** `contract:{contractId}` (Redis string, JSON-encoded contract)

---

## TTLs (Time-to-Live)
- All cached contracts and lists: **7 days by default** (configurable via `CONTRACT_CACHE_TTL` environment variable)
- Configurable values:
  - Production: `604800` (7 days) - recommended for production environments
  - Development: `86400` (1 day) - faster iteration during development
  - Testing: `3600` (1 hour) - quick cleanup for automated tests

---

## API Endpoints
- `GET /api/cached-contracts?userId=...` — List cached contracts for a user
- `DELETE /api/cached-contracts?id=...` — Delete a cached contract (only if not deployed)
- `GET /api/cached-contracts/[id]` — Fetch a cached contract by ID
- `PATCH /api/cached-contracts/[id]` — Update contract name
- `GET /api/session-contracts?sessionId=...` — List cached contracts for a session

---

## Enhanced Logging & Monitoring

The Redis cache service includes comprehensive logging for all operations:

### Connection Logging
- ✅ **Connection established**: `Redis: Connected successfully`
- ✅ **Ready state**: `Redis: Ready to accept commands`
- ❌ **Connection errors**: `Redis: Connection error: [details]`
- ⚠️ **Connection closed**: `Redis: Connection closed`
- 🔄 **Reconnecting**: `Redis: Attempting to reconnect...`

### Operation Logging
- **Cache operations**: SET, GET, DELETE with timing (e.g., `Redis SET: contract:abc123 (45ms)`)
- **List operations**: LPUSH, LRANGE, LREM with timing
- **Bulk operations**: Multiple contract retrievals with count and timing
- **Contract lifecycle**: Creation, deployment marking, name updates

### Performance Monitoring
- Individual operation timing in milliseconds
- Total operation time for complex multi-step operations
- Bulk operation performance tracking

### Error Handling
- Detailed error messages with context
- Graceful degradation (e.g., contract caching continues even if user/session list updates fail)
- Operation-specific error logging with timing

---

## Troubleshooting
- **Redis connection errors:**
  - Ensure `REDIS_URL` is set and Redis is running.
  - Check Docker container status: `docker ps`.
- **Cache not updating:**
  - TTL may have expired; contracts are removed after 7 days.
  - Check logs for errors in contract caching or deletion.
- **API errors:**
  - Ensure backend is restarted after changing environment variables or Redis setup.

---

## Environment-Specific Configuration Examples

### Production (.env.production)
```bash
REDIS_URL=redis://your-production-redis:6379
CONTRACT_CACHE_TTL=604800  # 7 days - optimal for production
```

### Development (.env.local)
```bash
REDIS_URL=redis://localhost:6379
CONTRACT_CACHE_TTL=86400   # 1 day - faster iteration
```

### Testing (.env.test)
```bash
REDIS_URL=redis://localhost:6379
CONTRACT_CACHE_TTL=3600    # 1 hour - quick cleanup
```

### Docker Compose
```yaml
services:
  app:
    environment:
      - REDIS_URL=redis://redis:6379
      - CONTRACT_CACHE_TTL=604800
  redis:
    image: redis:alpine
```

---

## Advanced Configuration

### Custom TTL Values
The `CONTRACT_CACHE_TTL` environment variable accepts any positive integer representing seconds:
- `1800` = 30 minutes
- `3600` = 1 hour  
- `86400` = 1 day
- `604800` = 7 days (default)
- `2592000` = 30 days

If an invalid value is provided, the system will default to 7 days and log a warning.
- For production, use a managed Redis service and secure your connection with authentication and TLS.

---

## Contact
For further help, contact the StarkFinder maintainers or check the README for more details. 