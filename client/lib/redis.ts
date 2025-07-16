import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redis = new Redis(redisUrl);

// Key helpers
export const getUserContractsKey = (userId: string) => `user:${userId}:contracts`;
export const getSessionContractsKey = (sessionId: string) => `session:${sessionId}:contracts`;
export const getContractKey = (contractId: string) => `contract:${contractId}`;

// TTLs (in seconds)
export const CONTRACT_CACHE_TTL = 60 * 60 * 24 * 7; // 7 days 