import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize Redis with error handling and logging
export const redis = new Redis(redisUrl);

// Redis connection event logging
redis.on('connect', () => {
  console.log('✅ Redis: Connected successfully');
});

redis.on('ready', () => {
  console.log('✅ Redis: Ready to accept commands');
});

redis.on('error', (error) => {
  console.error('❌ Redis: Connection error:', error);
});

redis.on('close', () => {
  console.log('⚠️ Redis: Connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis: Attempting to reconnect...');
});

// Key helpers
export const getUserContractsKey = (userId: string) => `user:${userId}:contracts`;
export const getSessionContractsKey = (sessionId: string) => `session:${sessionId}:contracts`;
export const getContractKey = (contractId: string) => `contract:${contractId}`;

// Configurable TTLs (in seconds)
// Default: 7 days, but can be overridden via environment variables
const DEFAULT_TTL = 60 * 60 * 24 * 7; // 7 days
const configuredTTL = parseInt(process.env.CONTRACT_CACHE_TTL || DEFAULT_TTL.toString());

export const CONTRACT_CACHE_TTL = (isNaN(configuredTTL) || configuredTTL <= 0) ? DEFAULT_TTL : configuredTTL;

// Validate TTL configuration
if (isNaN(configuredTTL) || configuredTTL <= 0) {
  console.warn(`⚠️ Redis: Invalid CONTRACT_CACHE_TTL value: ${process.env.CONTRACT_CACHE_TTL}. Using default ${Math.round(DEFAULT_TTL / 86400)} days.`);
}

console.log(`📋 Redis: CONTRACT_CACHE_TTL set to ${CONTRACT_CACHE_TTL} seconds (${Math.round(CONTRACT_CACHE_TTL / 86400)} days)`); 