"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Clock, 
  Code, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";

interface CachedContract {
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

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CachedContractsManagerProps {
  userId: string;
}

const CachedContractsManager: React.FC<CachedContractsManagerProps> = ({ 
  userId 
}) => {
  const [contracts, setContracts] = useState<CachedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filter, setFilter] = useState<'all' | 'deployed' | 'undeployed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<CachedContract | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchContracts = useCallback(async (page = 1, filterType = filter) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        userId,
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filterType === 'deployed') {
        params.append('deployedOnly', 'true');
      } else if (filterType === 'undeployed') {
        params.append('undeployedOnly', 'true');
      }

      const response = await fetch(`/api/cached-contracts?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }

      const data = await response.json();
      setContracts(data.contracts);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, filter, pagination.limit]);

  const handleDelete = async (contractId: string) => {
    try {
      setDeleteLoading(contractId);
      
      const response = await fetch(
        `/api/cached-contracts?contractId=${contractId}&userId=${userId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete contract');
      }

      // Refresh the contracts list
      await fetchContracts(pagination.page, filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contract');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleViewContract = async (contractId: string) => {
    try {
      const response = await fetch(
        `/api/cached-contracts/${contractId}?userId=${userId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch contract details');
      }

      const data = await response.json();
      setSelectedContract(data.contract);
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contract');
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [userId, filter, fetchContracts]);

  const filteredContracts = contracts.filter(contract =>
    contract.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading cached contracts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Cached Contracts</h2>
        <button
          onClick={() => fetchContracts(pagination.page, filter)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Contracts</option>
            <option value="undeployed">Undeployed</option>
            <option value="deployed">Deployed</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <div className="text-center p-12 bg-gray-800 rounded-lg">
          <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            No contracts found
          </h3>
          <p className="text-gray-400">
            {searchTerm
              ? "No contracts match your search criteria."
              : filter === 'all'
              ? "You haven't generated any contracts yet."
              : `You don't have any ${filter} contracts.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-white">
                      {contract.name}
                    </h3>
                    {contract.isDeployed ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-900 text-green-200 rounded text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Deployed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-900 text-yellow-200 rounded text-xs">
                        <Clock className="w-3 h-3" />
                        Cached
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Created: {new Date(contract.createdAt).toLocaleDateString()}</span>
                    {contract.deployedAt && (
                      <span>Deployed: {new Date(contract.deployedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleViewContract(contract.id)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title="View contract"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {!contract.isDeployed && (
                    <button
                      onClick={() => handleDelete(contract.id)}
                      disabled={deleteLoading === contract.id}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                      title="Delete contract"
                    >
                      {deleteLoading === contract.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {contracts.length} of {pagination.totalCount} contracts
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchContracts(pagination.page - 1, filter)}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchContracts(pagination.page + 1, filter)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Contract View Modal */}
      {showModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {selectedContract.name}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Source Code</h4>
                <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
                  {selectedContract.sourceCode}
                </pre>
              </div>
              {selectedContract.scarbConfig && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Scarb Configuration</h4>
                  <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
                    {selectedContract.scarbConfig}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CachedContractsManager; 