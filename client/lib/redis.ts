import Redis from 'ioredis';

let redis: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });
  }

  return redis;
};

export const closeRedisConnection = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};

// Contract cache keys
export const CACHE_KEYS = {
  GENERATED_CONTRACT: (userId: string, contractId: string) => 
    `contract:generated:${userId}:${contractId}`,
  USER_CONTRACTS: (userId: string) => 
    `user:contracts:${userId}`,
  DEPLOYED_CONTRACT: (contractId: string) => 
    `contract:deployed:${contractId}`,
  SESSION_CONTRACTS: (sessionId: string) => 
    `session:contracts:${sessionId}`,
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  GENERATED_CONTRACT: 60 * 60 * 24 * 30, // 30 days
  USER_CONTRACTS_LIST: 60 * 60, // 1 hour
  SESSION_CONTRACTS: 60 * 60 * 24 * 7, // 7 days
} as const; 