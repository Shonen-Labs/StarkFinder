import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Droplets, 
  Thermometer, 
  Plane, 
  Wind, 
  TrendingUp, 
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';

// Types
interface TriggerCondition {
  dataType: number;
  operator: number;
  threshold: string;
  duration: number;
}

interface PolicyFormData {
  policyType: number;
  coverageAmount: string;
  duration: number;
  triggerConditions: TriggerCondition[];
}

interface Policy {
  id: string;
  policyType: number;
  coverageAmount: string;
  premium: string;
  isActive: boolean;
  premiumPaid: boolean;
  payoutClaimed: boolean;
  createdAt: number;
  expiresAt: number;
  triggerConditions: TriggerCondition[];
}

interface LiquidityStats {
  totalLiquidity: string;
  userLiquidity: string;
  pendingRewards: string;
  utilizationRate: number;
}

// Constants
const POLICY_TYPES = {
  0: { name: 'Crop Insurance', icon: Droplets, color: 'text-green-600', bgColor: 'bg-green-50' },
  1: { name: 'Flight Delay', icon: Plane, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  2: { name: 'Hurricane', icon: Wind, color: 'text-red-600', bgColor: 'bg-red-50' },
  3: { name: 'Earthquake', icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  4: { name: 'Temperature', icon: Thermometer, color: 'text-purple-600', bgColor: 'bg-purple-50' }
};

const DATA_TYPES = {
  0: 'Weather Data',
  1: 'Flight Status', 
  2: 'Seismic Activity',
  3: 'Temperature',
  4: 'Rainfall'
};

const OPERATORS = {
  0: '>',
  1: '<', 
  2: '=',
  3: '>=',
  4: '<='
};

const ParametricInsurance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'liquidity'>('create');
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [liquidityStats, setLiquidityStats] = useState<LiquidityStats | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Policy creation form state
  const [policyForm, setPolicyForm] = useState<PolicyFormData>({
    policyType: 0,
    coverageAmount: '',
    duration: 30,
    triggerConditions: []
  });

  // Liquidity form state
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [liquidityAction, setLiquidityAction] = useState<'provide' | 'withdraw'>('provide');

  // Load data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserPolicies(),
        loadLiquidityStats()
      ]);
    } catch (error) {
      console.error('Failed to load user data:', error);
      addNotification('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPolicies = async () => {
    // Mock data - replace with actual contract calls
    const mockPolicies: Policy[] = [
      {
        id: '1',
        policyType: 0,
        coverageAmount: '10000',
        premium: '750',
        isActive: true,
        premiumPaid: true,
        payoutClaimed: false,
        createdAt: Date.now() - 86400000,
        expiresAt: Date.now() + 2592000000,
        triggerConditions: [{
          dataType: 4,
          operator: 1,
          threshold: '50',
          duration: 86400
        }]
      }
    ];
    setPolicies(mockPolicies);
  };

  const loadLiquidityStats = async () => {
    // Mock data - replace with actual contract calls
    const mockStats: LiquidityStats = {
      totalLiquidity: '500000',
      userLiquidity: '25000',
      pendingRewards: '125',
      utilizationRate: 65
    };
    setLiquidityStats(mockStats);
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const handleCreatePolicy = async () => {
    if (!policyForm.coverageAmount || policyForm.triggerConditions.length === 0) {
      addNotification('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Here you would integrate with your Starknet contract calls
      addNotification('Policy created successfully!');
      setPolicyForm({
        policyType: 0,
        coverageAmount: '',
        duration: 30,
        triggerConditions: []
      });
      
      await loadUserPolicies();
    } catch (error) {
      console.error('Failed to create policy:', error);
      addNotification('Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  const addTriggerCondition = () => {
    setPolicyForm(prev => ({
      ...prev,
      triggerConditions: [
        ...prev.triggerConditions,
        {
          dataType: 3,
          operator: 0,
          threshold: '',
          duration: 86400
        }
      ]
    }));
  };

  const updateTriggerCondition = (index: number, field: keyof TriggerCondition, value: any) => {
    setPolicyForm(prev => ({
      ...prev,
      triggerConditions: prev.triggerConditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const removeTriggerCondition = (index: number) => {
    setPolicyForm(prev => ({
      ...prev,
      triggerConditions: prev.triggerConditions.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(parseFloat(amount));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out"
          >
            {notification}
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Parametric Insurance</h1>
          </div>
          <p className="text-xl text-gray-600">
            Automated insurance with instant payouts based on real-world data
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            {[
              { id: 'create', label: 'Create Policy', icon: Plus },
              { id: 'manage', label: 'My Policies', icon: Shield },
              { id: 'liquidity', label: 'Liquidity Pool', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {activeTab === 'create' && (
            <CreatePolicyTab
              policyForm={policyForm}
              setPolicyForm={setPolicyForm}
              addTriggerCondition={addTriggerCondition}
              updateTriggerCondition={updateTriggerCondition}
              removeTriggerCondition={removeTriggerCondition}
              handleCreatePolicy={handleCreatePolicy}
              loading={loading}
            />
          )}
          
          {activeTab === 'manage' && (
            <ManagePoliciesTab
              policies={policies}
              loading={loading}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              addNotification={addNotification}
            />
          )}
          
          {activeTab === 'liquidity' && (
            <LiquidityTab
              liquidityStats={liquidityStats}
              liquidityAmount={liquidityAmount}
              setLiquidityAmount={setLiquidityAmount}
              liquidityAction={liquidityAction}
              setLiquidityAction={setLiquidityAction}
              loading={loading}
              formatCurrency={formatCurrency}
              addNotification={addNotification}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Create Policy Tab Component
const CreatePolicyTab: React.FC<{
  policyForm: PolicyFormData;
  setPolicyForm: React.Dispatch<React.SetStateAction<PolicyFormData>>;
  addTriggerCondition: () => void;
  updateTriggerCondition: (index: number, field: keyof TriggerCondition, value: any) => void;
  removeTriggerCondition: (index: number) => void;
  handleCreatePolicy: () => void;
  loading: boolean;
}> = ({
  policyForm,
  setPolicyForm,
  addTriggerCondition,
  updateTriggerCondition,
  removeTriggerCondition,
  handleCreatePolicy,
  loading
}) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Insurance Policy</h2>
      
      {/* Policy Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Policy Type</label>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(POLICY_TYPES).map(([key, { name, icon: Icon, color, bgColor }]) => (
            <button
              key={key}
              onClick={() => setPolicyForm(prev => ({ ...prev, policyType: parseInt(key) }))}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                policyForm.policyType === parseInt(key)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div className="text-sm font-medium text-gray-900">{name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Coverage Amount and Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Amount (USDC)</label>
          <input
            type="number"
            value={policyForm.coverageAmount}
            onChange={(e) => setPolicyForm(prev => ({ ...prev, coverageAmount: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="10000"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
          <input
            type="number"
            value={policyForm.duration}
            onChange={(e) => setPolicyForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="30"
          />
        </div>
      </div>

      {/* Trigger Conditions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">Trigger Conditions</label>
          <button
            onClick={addTriggerCondition}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </button>
        </div>
        
        {policyForm.triggerConditions.map((condition, index) => (
          <div key={index} className="flex items-center space-x-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <select
              value={condition.dataType}
              onChange={(e) => updateTriggerCondition(index, 'dataType', parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(DATA_TYPES).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
            
            <select
              value={condition.operator}
              onChange={(e) => updateTriggerCondition(index, 'operator', parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(OPERATORS).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
            
            <input
              type="number"
              value={condition.threshold}
              onChange={(e) => updateTriggerCondition(index, 'threshold', e.target.value)}
              placeholder="Threshold value"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={() => removeTriggerCondition(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Create Policy Button */}
      <button
        onClick={handleCreatePolicy}
        disabled={loading || !policyForm.coverageAmount || policyForm.triggerConditions.length === 0}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {loading ? (
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <Shield className="h-5 w-5 mr-2" />
        )}
        {loading ? 'Creating Policy...' : 'Create Policy'}
      </button>
    </div>
  );
};

// Manage Policies Tab Component
const ManagePoliciesTab: React.FC<{
  policies: Policy[];
  loading: boolean;
  formatCurrency: (amount: string) => string;
  formatDate: (timestamp: number) => string;
  addNotification: (message: string) => void;
}> = ({ policies, loading, formatCurrency, formatDate, addNotification }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Insurance Policies</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : policies.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No policies yet</h3>
          <p className="text-gray-500">Create your first parametric insurance policy to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {policies.map((policy) => {
            const { name, icon: Icon, color } = POLICY_TYPES[policy.policyType as keyof typeof POLICY_TYPES];
            
            return (
              <div key={policy.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                      <p className="text-sm text-gray-500">Policy #{policy.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {policy.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Coverage</p>
                    <p className="font-semibold">{formatCurrency(policy.coverageAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Premium</p>
                    <p className="font-semibold">{formatCurrency(policy.premium)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-semibold">{formatDate(policy.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expires</p>
                    <p className="font-semibold">{formatDate(policy.expiresAt)}</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  {!policy.premiumPaid && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Pay Premium
                    </button>
                  )}
                  
                  {policy.isActive && !policy.payoutClaimed && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Check Payout
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Liquidity Tab Component
const LiquidityTab: React.FC<{
  liquidityStats: LiquidityStats | null;
  liquidityAmount: string;
  setLiquidityAmount: React.Dispatch<React.SetStateAction<string>>;
  liquidityAction: 'provide' | 'withdraw';
  setLiquidityAction: React.Dispatch<React.SetStateAction<'provide' | 'withdraw'>>;
  loading: boolean;
  formatCurrency: (amount: string) => string;
  addNotification: (message: string) => void;
}> = ({
  liquidityStats,
  liquidityAmount,
  setLiquidityAmount,
  liquidityAction,
  setLiquidityAction,
  loading,
  formatCurrency,
  addNotification
}) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Liquidity Pool</h2>
      
      {liquidityStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Liquidity</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(liquidityStats.totalLiquidity)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Your Liquidity</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(liquidityStats.userLiquidity)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending Rewards</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(liquidityStats.pendingRewards)}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Utilization Rate</p>
                <p className="text-2xl font-bold text-purple-900">{liquidityStats.utilizationRate}%</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                <div className="text-xs font-bold text-purple-700">{liquidityStats.utilizationRate}%</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Liquidity Actions */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Liquidity</h3>
        
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setLiquidityAction('provide')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              liquidityAction === 'provide'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Provide Liquidity
          </button>
          <button
            onClick={() => setLiquidityAction('withdraw')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              liquidityAction === 'withdraw'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Withdraw Liquidity
          </button>
        </div>
        
        <div className="flex space-x-4">
          <input
            type="number"
            value={liquidityAmount}
            onChange={(e) => setLiquidityAmount(e.target.value)}
            placeholder="Amount in USDC"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            disabled={loading || !liquidityAmount}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : liquidityAction === 'provide' ? 'Provide' : 'Withdraw'}
          </button>
        </div>
      </div>
      
      {/* Claim Rewards */}
      {liquidityStats && parseFloat(liquidityStats.pendingRewards) > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Rewards Available</h3>
              <p className="text-green-700">You have {formatCurrency(liquidityStats.pendingRewards)} in unclaimed rewards</p>
            </div>
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
              Claim Rewards
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParametricInsurance;