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
    const id = uuidv4();
    const createdAt = new Date().toISOString();
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
    const contractKey = getContractKey(id);
    await redis.set(contractKey, JSON.stringify(contract), 'EX', CONTRACT_CACHE_TTL);
    if (userId) {
      await redis.lpush(getUserContractsKey(userId), id);
      await redis.expire(getUserContractsKey(userId), CONTRACT_CACHE_TTL);
    }
    if (sessionId) {
      await redis.lpush(getSessionContractsKey(sessionId), id);
      await redis.expire(getSessionContractsKey(sessionId), CONTRACT_CACHE_TTL);
    }
    return contract;
  }

  static async getContract(id: string): Promise<CachedContract | null> {
    const data = await redis.get(getContractKey(id));
    return data ? JSON.parse(data) : null;
  }

  static async listContractsByUser(userId: string): Promise<CachedContract[]> {
    const ids = await redis.lrange(getUserContractsKey(userId), 0, -1);
    const contracts = await Promise.all(ids.map((id: string) => this.getContract(id)));
    return contracts.filter(Boolean) as CachedContract[];
  }

  static async listContractsBySession(sessionId: string): Promise<CachedContract[]> {
    const ids = await redis.lrange(getSessionContractsKey(sessionId), 0, -1);
    const contracts = await Promise.all(ids.map((id: string) => this.getContract(id)));
    return contracts.filter(Boolean) as CachedContract[];
  }

  static async deleteContract(id: string): Promise<boolean> {
    const contract = await this.getContract(id);
    if (!contract) return false;
    if (contract.isDeployed) return false;
    await redis.del(getContractKey(id));
    if (contract.userId) await redis.lrem(getUserContractsKey(contract.userId), 0, id);
    if (contract.sessionId) await redis.lrem(getSessionContractsKey(contract.sessionId), 0, id);
    return true;
  }

  static async markDeployed(id: string, deployedContractId: string): Promise<boolean> {
    const contract = await this.getContract(id);
    if (!contract) return false;
    contract.isDeployed = true;
    contract.deployedContractId = deployedContractId;
    contract.deployedAt = new Date().toISOString();
    await redis.set(getContractKey(id), JSON.stringify(contract), 'EX', CONTRACT_CACHE_TTL);
    return true;
  }

  static async updateContractName(id: string, name: string): Promise<boolean> {
    const contract = await this.getContract(id);
    if (!contract) return false;
    contract.name = name;
    await redis.set(getContractKey(id), JSON.stringify(contract), 'EX', CONTRACT_CACHE_TTL);
    return true;
  }
} 