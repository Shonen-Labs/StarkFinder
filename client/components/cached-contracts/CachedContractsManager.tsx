import React, { useEffect, useState } from 'react';

interface CachedContract {
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

interface Props {
  userId: string;
}

const PAGE_SIZE = 6;

export const CachedContractsManager: React.FC<Props> = ({ userId }) => {
  const [contracts, setContracts] = useState<CachedContract[]>([]);
  const [search, setSearch] = useState('');
  const [deploymentFilter, setDeploymentFilter] = useState<'all' | 'deployed' | 'undeployed'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<CachedContract | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/cached-contracts?userId=${userId}`);
        const data = await res.json();
        setContracts(data.contracts || []);
      } catch (err) {
        setError('Failed to load cached contracts');
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [userId]);

  const filtered = contracts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchesDeployment = deploymentFilter === 'all' ||
      (deploymentFilter === 'deployed' && c.isDeployed) ||
      (deploymentFilter === 'undeployed' && !c.isDeployed);
    return matchesSearch && matchesDeployment;
  });
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this contract?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cached-contracts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContracts(contracts.filter(c => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete contract');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleView = (contract: CachedContract) => {
    setSelectedContract(contract);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContract(null);
  };

  return (
    <div className="bg-gray-800 bg-opacity-70 rounded-lg shadow-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <h2 className="text-xl font-bold text-white">Cached Contracts</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="px-3 py-2 rounded bg-gray-900 text-white border border-gray-700"
            value={deploymentFilter}
            onChange={e => setDeploymentFilter(e.target.value as 'all' | 'deployed' | 'undeployed')}
          >
            <option value="all">All Contracts</option>
            <option value="deployed">Deployed Only</option>
            <option value="undeployed">Not Deployed</option>
          </select>
          <input
            className="px-3 py-2 rounded bg-gray-900 text-white border border-gray-700"
            placeholder="Search by name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-white">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : paginated.length === 0 ? (
        <div className="text-gray-400">No cached contracts found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(contract => (
            <div key={contract.id} className="bg-gray-900 rounded-lg p-4 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-gray-400">{contract.id}</span>
                <span className={`px-2 py-1 rounded text-xs ${contract.isDeployed ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'}`}>{contract.isDeployed ? 'Deployed' : 'Not Deployed'}</span>
              </div>
              <div className="font-bold text-white text-lg mb-1">{contract.name}</div>
              <div className="text-xs text-gray-400 mb-1">Created: {new Date(contract.createdAt).toLocaleString()}</div>
              {contract.blockchain && (
                <div className="text-xs text-blue-400 mb-2">
                  Blockchain: {contract.blockchain === 'blockchain1' ? 'Cairo' : contract.blockchain === 'blockchain4' ? 'Dojo' : contract.blockchain}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 rounded text-sm bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={() => handleView(contract)}
                >
                  View
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${contract.isDeployed ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-700 hover:bg-red-800 text-white'}`}
                  onClick={() => handleDelete(contract.id)}
                  disabled={contract.isDeployed}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Prev
          </button>
          <span className="text-white px-2">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
      
      {/* Modal for viewing contract code */}
      {showModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">{selectedContract.name}</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Contract ID: {selectedContract.id}</div>
                <div className="text-sm text-gray-400 mb-2">Created: {new Date(selectedContract.createdAt).toLocaleString()}</div>
                {selectedContract.blockchain && (
                  <div className="text-sm text-blue-400 mb-2">
                    Blockchain: {selectedContract.blockchain === 'blockchain1' ? 'Cairo' : selectedContract.blockchain === 'blockchain4' ? 'Dojo' : selectedContract.blockchain}
                  </div>
                )}
                <div className={`text-sm px-2 py-1 rounded inline-block ${selectedContract.isDeployed ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'}`}>
                  {selectedContract.isDeployed ? 'Deployed' : 'Not Deployed'}
                </div>
              </div>
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-white mb-2">Source Code</h4>
                <pre className="bg-gray-800 p-4 rounded text-gray-300 text-sm overflow-auto">
                  <code>{selectedContract.sourceCode}</code>
                </pre>
              </div>
              {selectedContract.scarbConfig && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Scarb Configuration</h4>
                  <pre className="bg-gray-800 p-4 rounded text-gray-300 text-sm overflow-auto">
                    <code>{selectedContract.scarbConfig}</code>
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