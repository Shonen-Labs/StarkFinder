import { redis, getUserContractsKey, getSessionContractsKey, getContractKey, CONTRACT_CACHE_TTL } from '../redis';
import { v4 as uuidv4 } from 'uuid';

export interface CachedContract {
  id: string;
  name: string;
  sourceCode: string;
  scarbConfig?: string;
  userId?: string;
  sessionId?: string;
  createdAt: string;
  isDeployed?: boolean;
  deployedContractId?: string;
  deployedAt?: string;
  blockchain?: string;
}

// Logger utility for Redis operations
class RedisLogger {
  static logOperation(operation: string, key: string, startTime: number, success: boolean, error?: Error) {
    const duration = Date.now() - startTime;
    const logPrefix = success ? '✅' : '❌';
    
    if (success) {
      console.log(`${logPrefix} Redis ${operation}: ${key} (${duration}ms)`);
    } else {
      console.error(`${logPrefix} Redis ${operation} FAILED: ${key} (${duration}ms) - ${error?.message || 'Unknown error'}`);
    }
  }

  static logBulkOperation(operation: string, count: number, startTime: number, success: boolean, error?: Error) {
    const duration = Date.now() - startTime;
    const logPrefix = success ? '✅' : '❌';
    
    if (success) {
      console.log(`${logPrefix} Redis ${operation}: ${count} operations (${duration}ms)`);
    } else {
      console.error(`${logPrefix} Redis ${operation} FAILED: ${count} operations (${duration}ms) - ${error?.message || 'Unknown error'}`);
    }
  }
}

export class ContractCacheService {
  static async cacheContract({
    name,
    sourceCode,
    scarbConfig,
    userId,
    sessionId,
    blockchain
  }: {
    name: string;
    sourceCode: string;
    scarbConfig?: string;
    userId?: string;
    sessionId?: string;
    blockchain?: string;
  }): Promise<CachedContract> {
    const operationStartTime = Date.now();
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    console.log(`🔄 Redis: Starting contract caching - ID: ${id}, Name: ${name}, User: ${userId || 'anonymous'}, Session: ${sessionId || 'none'}`);
    
    const contract: CachedContract = {
      id,
      name,
      sourceCode,
      scarbConfig,
      userId,
      sessionId,
      createdAt,
      isDeployed: false,
      blockchain
    };
    
    try {
      const contractKey = getContractKey(id);
      
      // Cache the contract
      const setStartTime = Date.now();
      await redis.set(contractKey, JSON.stringify(contract), 'EX', CONTRACT_CACHE_TTL);
      RedisLogger.logOperation('SET', contractKey, setStartTime, true);
      
      // Add to user's contract list if userId provided
      if (userId) {
        const userKeyStartTime = Date.now();
        try {
          const userKey = getUserContractsKey(userId);
          await redis.lpush(userKey, id);
          await redis.expire(userKey, CONTRACT_CACHE_TTL);
          RedisLogger.logOperation('LPUSH+EXPIRE', userKey, userKeyStartTime, true);
        } catch (userError) {
          RedisLogger.logOperation('LPUSH+EXPIRE', getUserContractsKey(userId), userKeyStartTime, false, userError as Error);
          console.warn(`⚠️ Redis: Failed to add contract to user list for userId ${userId}: ${(userError as Error).message}`);
        }
      }
      
      // Add to session's contract list if sessionId provided
      if (sessionId) {
        const sessionKeyStartTime = Date.now();
        try {
          const sessionKey = getSessionContractsKey(sessionId);
          await redis.lpush(sessionKey, id);
          await redis.expire(sessionKey, CONTRACT_CACHE_TTL);
          RedisLogger.logOperation('LPUSH+EXPIRE', sessionKey, sessionKeyStartTime, true);
        } catch (sessionError) {
          RedisLogger.logOperation('LPUSH+EXPIRE', getSessionContractsKey(sessionId), sessionKeyStartTime, false, sessionError as Error);
          console.warn(`⚠️ Redis: Failed to add contract to session list for sessionId ${sessionId}: ${(sessionError as Error).message}`);
        }
      }
      
      console.log(`✅ Redis: Contract caching completed successfully - ID: ${id} (${Date.now() - operationStartTime}ms total)`);
      return contract;
    } catch (error) {
      RedisLogger.logOperation('SET', getContractKey(id), operationStartTime, false, error as Error);
      console.error(`❌ Redis: Contract caching failed for ID ${id}:`, error);
      throw new Error(`Failed to cache contract: ${(error as Error).message}`);
    }
  }

  static async getContract(id: string): Promise<CachedContract | null> {
    const startTime = Date.now();
    const contractKey = getContractKey(id);
    
    try {
      const data = await redis.get(contractKey);
      RedisLogger.logOperation('GET', contractKey, startTime, true);
      
      if (!data) {
        console.log(`📭 Redis: Contract not found - ID: ${id}`);
        return null;
      }
      
      const contract = JSON.parse(data);
      console.log(`📄 Redis: Contract retrieved - ID: ${id}, Name: ${contract.name}, Deployed: ${contract.isDeployed}`);
      return contract;
    } catch (error) {
      RedisLogger.logOperation('GET', contractKey, startTime, false, error as Error);
      console.error(`❌ Redis: Failed to get contract ${id}:`, error);
      throw new Error(`Failed to retrieve contract: ${(error as Error).message}`);
    }
  }

  static async listContractsByUser(userId: string): Promise<CachedContract[]> {
    const operationStartTime = Date.now();
    const userKey = getUserContractsKey(userId);
    
    console.log(`🔍 Redis: Listing contracts for user: ${userId}`);
    
    try {
      // Get contract IDs for user
      const lrangeStartTime = Date.now();
      const ids = await redis.lrange(userKey, 0, -1);
      RedisLogger.logOperation('LRANGE', userKey, lrangeStartTime, true);
      
      if (ids.length === 0) {
        console.log(`📭 Redis: No contracts found for user: ${userId}`);
        return [];
      }
      
      // Fetch all contracts
      const bulkStartTime = Date.now();
      try {
        const contracts = await Promise.all(ids.map((id: string) => this.getContract(id)));
        const validContracts = contracts.filter(Boolean) as CachedContract[];
        
        RedisLogger.logBulkOperation('GET_BULK', ids.length, bulkStartTime, true);
        console.log(`📋 Redis: Retrieved ${validContracts.length}/${ids.length} contracts for user: ${userId} (${Date.now() - operationStartTime}ms total)`);
        
        return validContracts;
      } catch (bulkError) {
        RedisLogger.logBulkOperation('GET_BULK', ids.length, bulkStartTime, false, bulkError as Error);
        throw bulkError;
      }
    } catch (error) {
      RedisLogger.logOperation('LRANGE', userKey, operationStartTime, false, error as Error);
      console.error(`❌ Redis: Failed to list contracts for user ${userId}:`, error);
      throw new Error(`Failed to list user contracts: ${(error as Error).message}`);
    }
  }

  static async listContractsBySession(sessionId: string): Promise<CachedContract[]> {
    const operationStartTime = Date.now();
    const sessionKey = getSessionContractsKey(sessionId);
    
    console.log(`🔍 Redis: Listing contracts for session: ${sessionId}`);
    
    try {
      // Get contract IDs for session
      const lrangeStartTime = Date.now();
      const ids = await redis.lrange(sessionKey, 0, -1);
      RedisLogger.logOperation('LRANGE', sessionKey, lrangeStartTime, true);
      
      if (ids.length === 0) {
        console.log(`📭 Redis: No contracts found for session: ${sessionId}`);
        return [];
      }
      
      // Fetch all contracts
      const bulkStartTime = Date.now();
      try {
        const contracts = await Promise.all(ids.map((id: string) => this.getContract(id)));
        const validContracts = contracts.filter(Boolean) as CachedContract[];
        
        RedisLogger.logBulkOperation('GET_BULK', ids.length, bulkStartTime, true);
        console.log(`📋 Redis: Retrieved ${validContracts.length}/${ids.length} contracts for session: ${sessionId} (${Date.now() - operationStartTime}ms total)`);
        
        return validContracts;
      } catch (bulkError) {
        RedisLogger.logBulkOperation('GET_BULK', ids.length, bulkStartTime, false, bulkError as Error);
        throw bulkError;
      }
    } catch (error) {
      RedisLogger.logOperation('LRANGE', sessionKey, operationStartTime, false, error as Error);
      console.error(`❌ Redis: Failed to list contracts for session ${sessionId}:`, error);
      throw new Error(`Failed to list session contracts: ${(error as Error).message}`);
    }
  }

  static async deleteContract(id: string): Promise<boolean> {
    const operationStartTime = Date.now();
    console.log(`🗑️ Redis: Starting contract deletion - ID: ${id}`);
    
    try {
      // First, get the contract to check if it exists and get metadata
      const contract = await this.getContract(id);
      if (!contract) {
        console.log(`📭 Redis: Contract not found for deletion - ID: ${id}`);
        return false;
      }
      
      if (contract.isDeployed) {
        console.log(`🔒 Redis: Cannot delete deployed contract - ID: ${id}`);
        return false;
      }
      
      const contractKey = getContractKey(id);
      
      // Delete the contract
      const delStartTime = Date.now();
      await redis.del(contractKey);
      RedisLogger.logOperation('DEL', contractKey, delStartTime, true);
      
      // Remove from user's contract list
      if (contract.userId) {
        const userRemoveStartTime = Date.now();
        try {
          const userKey = getUserContractsKey(contract.userId);
          await redis.lrem(userKey, 0, id);
          RedisLogger.logOperation('LREM', userKey, userRemoveStartTime, true);
        } catch (userError) {
          RedisLogger.logOperation('LREM', getUserContractsKey(contract.userId), userRemoveStartTime, false, userError as Error);
          console.warn(`⚠️ Redis: Failed to remove contract from user list for userId ${contract.userId}: ${(userError as Error).message}`);
        }
      }
      
      // Remove from session's contract list
      if (contract.sessionId) {
        const sessionRemoveStartTime = Date.now();
        try {
          const sessionKey = getSessionContractsKey(contract.sessionId);
          await redis.lrem(sessionKey, 0, id);
          RedisLogger.logOperation('LREM', sessionKey, sessionRemoveStartTime, true);
        } catch (sessionError) {
          RedisLogger.logOperation('LREM', getSessionContractsKey(contract.sessionId), sessionRemoveStartTime, false, sessionError as Error);
          console.warn(`⚠️ Redis: Failed to remove contract from session list for sessionId ${contract.sessionId}: ${(sessionError as Error).message}`);
        }
      }
      
      console.log(`✅ Redis: Contract deletion completed - ID: ${id} (${Date.now() - operationStartTime}ms total)`);
      return true;
    } catch (error) {
      console.error(`❌ Redis: Contract deletion failed for ID ${id}:`, error);
      throw new Error(`Failed to delete contract: ${(error as Error).message}`);
    }
  }

  static async markDeployed(id: string, deployedContractId: string): Promise<boolean> {
    const operationStartTime = Date.now();
    console.log(`🚀 Redis: Marking contract as deployed - ID: ${id}, DeployedID: ${deployedContractId}`);
    
    try {
      const contract = await this.getContract(id);
      if (!contract) {
        console.log(`📭 Redis: Contract not found for deployment marking - ID: ${id}`);
        return false;
      }
      
      contract.isDeployed = true;
      contract.deployedContractId = deployedContractId;
      contract.deployedAt = new Date().toISOString();
      
      const contractKey = getContractKey(id);
      const setStartTime = Date.now();
      await redis.set(contractKey, JSON.stringify(contract), 'EX', CONTRACT_CACHE_TTL);
      RedisLogger.logOperation('SET', contractKey, setStartTime, true);
      
      console.log(`✅ Redis: Contract marked as deployed - ID: ${id} (${Date.now() - operationStartTime}ms total)`);
      return true;
    } catch (error) {
      console.error(`❌ Redis: Failed to mark contract as deployed for ID ${id}:`, error);
      throw new Error(`Failed to mark contract as deployed: ${(error as Error).message}`);
    }
  }

  static async updateContractName(id: string, name: string): Promise<boolean> {
    const operationStartTime = Date.now();
    console.log(`📝 Redis: Updating contract name - ID: ${id}, NewName: ${name}`);
    
    try {
      const contract = await this.getContract(id);
      if (!contract) {
        console.log(`📭 Redis: Contract not found for name update - ID: ${id}`);
        return false;
      }
      
      const oldName = contract.name;
      contract.name = name;
      
      const contractKey = getContractKey(id);
      const setStartTime = Date.now();
      await redis.set(contractKey, JSON.stringify(contract), 'EX', CONTRACT_CACHE_TTL);
      RedisLogger.logOperation('SET', contractKey, setStartTime, true);
      
      console.log(`✅ Redis: Contract name updated - ID: ${id}, OldName: "${oldName}" -> NewName: "${name}" (${Date.now() - operationStartTime}ms total)`);
      return true;
    } catch (error) {
      console.error(`❌ Redis: Failed to update contract name for ID ${id}:`, error);
      throw new Error(`Failed to update contract name: ${(error as Error).message}`);
    }
  }
} 