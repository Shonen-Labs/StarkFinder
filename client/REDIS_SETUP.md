# Redis Setup for StarkFinder Contract Caching

## Overview
StarkFinder uses Redis to cache recently generated contracts for each user and session. This enables fast access, management, and deletion of contracts before deployment.

---

## Environment Variables
- `REDIS_URL`: The connection string for your Redis instance (e.g., `redis://localhost:6379`).

Add this to your `.env` file:
```
REDIS_URL=redis://localhost:6379
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
- All cached contracts and lists: **7 days** (configurable in `client/lib/redis.ts`)

---

## API Endpoints
- `GET /api/cached-contracts?userId=...` — List cached contracts for a user
- `DELETE /api/cached-contracts?id=...` — Delete a cached contract (only if not deployed)
- `GET /api/cached-contracts/[id]` — Fetch a cached contract by ID
- `PATCH /api/cached-contracts/[id]` — Update contract name
- `GET /api/session-contracts?sessionId=...` — List cached contracts for a session

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

## Advanced
- You can adjust TTLs in `client/lib/redis.ts`.
- For production, use a managed Redis service and secure your connection with authentication and TLS.

---

## Contact
For further help, contact the StarkFinder maintainers or check the README for more details. 