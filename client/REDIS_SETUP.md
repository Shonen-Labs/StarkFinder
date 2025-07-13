# Redis Setup for Contract Caching

This project uses Redis for caching recently generated contracts as requested in GitHub issue #385.

## Environment Variables

Add the following Redis configuration to your `.env.local` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Local Redis Setup

### Option 1: Using Docker (Recommended)

```bash
# Start Redis with Docker
docker run -d \
  --name starkfinder-redis \
  -p 6379:6379 \
  redis:7-alpine

# Or using docker-compose
docker-compose up -d redis
```

### Option 2: Local Installation

#### macOS (using Homebrew)
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Windows
Download and install from: https://redis.io/docs/getting-started/installation/install-redis-on-windows/

## Production Setup

For production, consider using managed Redis services:

- **Redis Cloud**: https://redis.com/redis-enterprise-cloud/
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/
- **Google Cloud Memorystore**: https://cloud.google.com/memorystore
- **Azure Cache for Redis**: https://azure.microsoft.com/en-us/services/cache/

## Cache Structure

The Redis cache uses the following key patterns:

- `contract:generated:{userId}:{contractId}` - Individual contract data
- `user:contracts:{userId}` - List of contract IDs for a user
- `session:contracts:{sessionId}` - List of contract IDs for a session
- `contract:deployed:{contractId}` - Deployment status markers

## Cache TTL (Time To Live)

- **Generated Contracts**: 30 days
- **User Contract Lists**: 1 hour (refreshed on access)
- **Session Contracts**: 7 days

## API Endpoints

### User-based Access
- `GET /api/cached-contracts?userId={userId}` - Get user's contracts
- `DELETE /api/cached-contracts?contractId={id}&userId={userId}` - Delete contract
- `GET /api/cached-contracts/{id}?userId={userId}` - Get specific contract
- `PATCH /api/cached-contracts/{id}` - Update contract name

### Session-based Access
- `GET /api/session-contracts?sessionId={sessionId}` - Get session contracts

## Features

✅ **Redis-based caching** as requested by maintainer  
✅ **User ID linking** for user-specific contract access  
✅ **Session ID support** for session-based access control  
✅ **Deployment restrictions** - deployed contracts cannot be deleted  
✅ **Automatic deployment tracking** when contracts are deployed  
✅ **Pagination and filtering** for contract lists  
✅ **Search functionality** in the frontend  

## Testing Redis Connection

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# View cached contracts
redis-cli keys "contract:*"

# View user contract lists
redis-cli keys "user:contracts:*"
```

## Troubleshooting

1. **Connection Refused**: Make sure Redis is running on the configured port
2. **Authentication Failed**: Check REDIS_PASSWORD in environment variables
3. **Cache Miss**: Contracts have TTL - they expire after 30 days
4. **Performance**: Consider Redis clustering for high-traffic scenarios

## Migration from Database

The system maintains backward compatibility. Existing database contracts will continue to work, while new contracts are cached in Redis. You can run both systems in parallel during migration. 