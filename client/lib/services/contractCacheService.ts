import { getRedisClient, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

export interface CachedContract {
  id: string;
  name: string;
  sourceCode: string;
  scarbConfig?: string;
  userId: string;
  sessionId?: string;
  createdAt: string;
  isDeployed: boolean;
  deployedContractId?: string;
  deployedAt?: string;
  blockchain: string;
}

export interface ContractListItem {
  id: string;
  name: string;
  createdAt: string;
  isDeployed: boolean;
  blockchain: string;
}

export class ContractCacheService {
  private redis = getRedisClient();

  /**
   * Cache a newly generated contract
   */
  async cacheContract(contract: Omit<CachedContract, 'id' | 'createdAt' | 'isDeployed'>): Promise<string> {
    const contractId = uuidv4();
    const cachedContract: CachedContract = {
      ...contract,
      id: contractId,
      createdAt: new Date().toISOString(),
      isDeployed: false,
    };

    // Store the contract
    const contractKey = CACHE_KEYS.GENERATED_CONTRACT(contract.userId, contractId);
    await this.redis.setex(
      contractKey,
      CACHE_TTL.GENERATED_CONTRACT,
      JSON.stringify(cachedContract)
    );

    // Add to user's contract list
    await this.addToUserContractsList(contract.userId, contractId, cachedContract);

    // Add to session contracts if sessionId provided
    if (contract.sessionId) {
      await this.addToSessionContractsList(contract.sessionId, contractId);
    }

    // Store reverse index: contractId -> userId
    const ownerKey = `contract:owner:${contractId}`;
    await this.redis.setex(ownerKey, CACHE_TTL.GENERATED_CONTRACT, contract.userId);

    console.log(`✅ Contract cached with ID: ${contractId}`);
    return contractId;
  }

  /**
   * Get a specific cached contract
   */
  async getContract(userId: string, contractId: string): Promise<CachedContract | null> {
    const contractKey = CACHE_KEYS.GENERATED_CONTRACT(userId, contractId);
    const contractData = await this.redis.get(contractKey);
    
    if (!contractData) {
      return null;
    }

    return JSON.parse(contractData) as CachedContract;
  }

  /**
   * Get all contracts for a user with pagination
   */
  async getUserContracts(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      deployedOnly?: boolean;
      undeployedOnly?: boolean;
    } = {}
  ): Promise<{
    contracts: ContractListItem[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const { page = 1, limit = 10, deployedOnly = false, undeployedOnly = false } = options;
    
    const userContractsKey = CACHE_KEYS.USER_CONTRACTS(userId);
    const contractIds = await this.redis.lrange(userContractsKey, 0, -1);
    
    // Fetch contract summaries
    let contracts: ContractListItem[] = [];
    for (const contractId of contractIds) {
      const contractKey = CACHE_KEYS.GENERATED_CONTRACT(userId, contractId);
      const contractData = await this.redis.get(contractKey);
      
      if (contractData) {
        const contract = JSON.parse(contractData) as CachedContract;
        
        // Apply filters
        if (deployedOnly && !contract.isDeployed) continue;
        if (undeployedOnly && contract.isDeployed) continue;
        
        contracts.push({
          id: contract.id,
          name: contract.name,
          createdAt: contract.createdAt,
          isDeployed: contract.isDeployed,
          blockchain: contract.blockchain,
        });
      }
    }

    // Sort by creation date (newest first)
    contracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const totalCount = contracts.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContracts = contracts.slice(startIndex, endIndex);

    return {
      contracts: paginatedContracts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Delete a cached contract (only if not deployed)
   */
  async deleteContract(userId: string, contractId: string): Promise<{ success: boolean; error?: string }> {
    const contract = await this.getContract(userId, contractId);
    
    if (!contract) {
      return { success: false, error: 'Contract not found' };
    }

    if (contract.isDeployed) {
      return { 
        success: false, 
        error: 'Cannot delete deployed contracts. Contract has been deployed and cannot be deleted for security and audit purposes.' 
      };
    }

    // Remove from Redis
    const contractKey = CACHE_KEYS.GENERATED_CONTRACT(userId, contractId);
    await this.redis.del(contractKey);
    // Remove reverse index
    const ownerKey = `contract:owner:${contractId}`;
    await this.redis.del(ownerKey);

    // Remove from user's contract list
    await this.removeFromUserContractsList(userId, contractId);

    // Remove from session if exists
    if (contract.sessionId) {
      await this.removeFromSessionContractsList(contract.sessionId, contractId);
    }

    console.log(`🗑️ Contract deleted: ${contractId}`);
    return { success: true };
  }

  /**
   * Mark a contract as deployed
   */
  async markContractAsDeployed(userId: string, contractId: string, deployedContractId: string): Promise<boolean> {
    const contract = await this.getContract(userId, contractId);
    
    if (!contract) {
      return false;
    }

    const updatedContract: CachedContract = {
      ...contract,
      isDeployed: true,
      deployedContractId,
      deployedAt: new Date().toISOString(),
    };

    const contractKey = CACHE_KEYS.GENERATED_CONTRACT(userId, contractId);
    await this.redis.setex(
      contractKey,
      CACHE_TTL.GENERATED_CONTRACT,
      JSON.stringify(updatedContract)
    );

    // Update user contracts list with new status
    await this.updateUserContractsListItem(userId, contractId, updatedContract);

    console.log(`🚀 Contract marked as deployed: ${contractId}`);
    return true;
  }

  /**
   * Get contracts by session ID
   */
  async getSessionContracts(sessionId: string): Promise<ContractListItem[]> {
    const sessionKey = CACHE_KEYS.SESSION_CONTRACTS(sessionId);
    const contractIds = await this.redis.lrange(sessionKey, 0, -1);
    
    const contracts: ContractListItem[] = [];
    for (const contractId of contractIds) {
      // Use reverse index to get userId
      const ownerKey = `contract:owner:${contractId}`;
      const userId = await this.redis.get(ownerKey);
      if (!userId) continue;
      const contract = await this.getContract(userId, contractId);
      if (contract) {
        contracts.push({
          id: contract.id,
          name: contract.name,
          createdAt: contract.createdAt,
          isDeployed: contract.isDeployed,
          blockchain: contract.blockchain,
        });
      }
    }

    return contracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Find contract by source code (for deployment linking)
   */
  async findContractBySourceCode(userId: string, sourceCode: string): Promise<CachedContract | null> {
    const userContractsKey = CACHE_KEYS.USER_CONTRACTS(userId);
    const contractIds = await this.redis.lrange(userContractsKey, 0, -1);
    
    // Search through user's contracts
    for (const contractId of contractIds) {
      const contract = await this.getContract(userId, contractId);
      if (contract && contract.sourceCode === sourceCode && !contract.isDeployed) {
        return contract;
      }
    }

    return null;
  }

  /**
   * Update contract name
   */
  async updateContractName(userId: string, contractId: string, newName: string): Promise<boolean> {
    const contract = await this.getContract(userId, contractId);
    
    if (!contract) {
      return false;
    }

    const updatedContract: CachedContract = {
      ...contract,
      name: newName,
    };

    const contractKey = CACHE_KEYS.GENERATED_CONTRACT(userId, contractId);
    await this.redis.setex(
      contractKey,
      CACHE_TTL.GENERATED_CONTRACT,
      JSON.stringify(updatedContract)
    );

    await this.updateUserContractsListItem(userId, contractId, updatedContract);

    return true;
  }

  // Private helper methods

  private async addToUserContractsList(userId: string, contractId: string, contract: CachedContract): Promise<void> {
    const userContractsKey = CACHE_KEYS.USER_CONTRACTS(userId);
    await this.redis.lpush(userContractsKey, contractId);
    await this.redis.expire(userContractsKey, CACHE_TTL.GENERATED_CONTRACT);
  }

  private async removeFromUserContractsList(userId: string, contractId: string): Promise<void> {
    const userContractsKey = CACHE_KEYS.USER_CONTRACTS(userId);
    await this.redis.lrem(userContractsKey, 0, contractId);
  }

  private async updateUserContractsListItem(userId: string, contractId: string, contract: CachedContract): Promise<void> {
    // For Redis lists, we just ensure the item exists (no need to update since we fetch details separately)
    const userContractsKey = CACHE_KEYS.USER_CONTRACTS(userId);
    const exists = await this.redis.lpos(userContractsKey, contractId);
    if (exists === null) {
      await this.redis.lpush(userContractsKey, contractId);
      await this.redis.expire(userContractsKey, CACHE_TTL.GENERATED_CONTRACT);
    }
  }

  private async addToSessionContractsList(sessionId: string, contractId: string): Promise<void> {
    const sessionKey = CACHE_KEYS.SESSION_CONTRACTS(sessionId);
    await this.redis.lpush(sessionKey, contractId);
    await this.redis.expire(sessionKey, CACHE_TTL.SESSION_CONTRACTS);
  }

  private async removeFromSessionContractsList(sessionId: string, contractId: string): Promise<void> {
    const sessionKey = CACHE_KEYS.SESSION_CONTRACTS(sessionId);
    await this.redis.lrem(sessionKey, 0, contractId);
  }
}

// Export singleton instance
export const contractCacheService = new ContractCacheService(); 