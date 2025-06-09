import { Contract, Provider, Account } from 'starknet';

interface PolicyData {
  type: string;
  coverage: string;
  duration: number;
  conditions: TriggerCondition[];
}

interface TriggerCondition {
  dataType: string;
  operator: string;
  threshold: string;
  duration: number;
}

interface OracleData {
  dataType: string;
  value: number;
  timestamp: number;
  isFresh: boolean;
}

export class InsuranceAgent {
  private provider: Provider;
  private insurancePool: Contract | null = null;
  private oracle: Contract | null = null;
  private token: Contract | null = null;
  private contractAddresses: any;
  
  constructor(providerUrl: string, contractAddresses: any) {
    this.provider = new Provider({ rpc: { nodeUrl: providerUrl } });
    this.contractAddresses = contractAddresses;
  }

  async initialize() {
    try {
      // Load contract ABIs and initialize contracts
      const poolAbi = await this.loadABI('insurance_pool');
      const oracleAbi = await this.loadABI('oracle');
      const tokenAbi = await this.loadABI('token');

      this.insurancePool = new Contract(
        poolAbi,
        this.contractAddresses.insurance_pool,
        this.provider
      );

      this.oracle = new Contract(
        oracleAbi,
        this.contractAddresses.oracle,
        this.provider
      );

      this.token = new Contract(
        tokenAbi,
        this.contractAddresses.token,
        this.provider
      );

      console.log('🤖 Insurance Agent initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Insurance Agent:', error);
      throw error;
    }
  }

  async loadABI(contractName: string): Promise<any> {
    // In a real implementation, load ABIs from files or API
    // For now, return mock ABI structure
    return [
      {
        "name": "mock_function",
        "type": "function",
        "inputs": [],
        "outputs": []
      }
    ];
  }

  // AI-powered policy recommendations
  async recommendPolicy(userProfile: any, riskPreferences: any): Promise<PolicyData> {
    console.log('🤖 Analyzing user profile for policy recommendations...');
    
    // AI logic to analyze user needs and recommend appropriate policy
    const location = userProfile.location || 'unknown';
    const occupation = userProfile.occupation || 'unknown';
    const riskTolerance = riskPreferences.riskTolerance || 'medium';
    
    let recommendedPolicy: PolicyData;
    
    // Location-based recommendations
    if (location.toLowerCase().includes('florida') || location.toLowerCase().includes('hurricane')) {
      recommendedPolicy = {
        type: 'Hurricane',
        coverage: this.calculateOptimalCoverage(userProfile.assets, 'hurricane'),
        duration: 180, // Hurricane season duration
        conditions: [
          {
            dataType: 'WeatherData',
            operator: '>=',
            threshold: '3', // Category 3 or higher
            duration: 3600 // 1 hour
          }
        ]
      };
    } else if (location.toLowerCase().includes('california') || location.toLowerCase().includes('earthquake')) {
      recommendedPolicy = {
        type: 'Earthquake',
        coverage: this.calculateOptimalCoverage(userProfile.assets, 'earthquake'),
        duration: 365, // 1 year
        conditions: [
          {
            dataType: 'SeismicActivity',
            operator: '>=',
            threshold: '60', // Magnitude 6.0+
            duration: 0 // Immediate
          }
        ]
      };
    } else if (occupation.toLowerCase().includes('farmer') || occupation.toLowerCase().includes('agriculture')) {
      recommendedPolicy = {
        type: 'Crop',
        coverage: this.calculateOptimalCoverage(userProfile.assets, 'crop'),
        duration: 120, // Growing season
        conditions: [
          {
            dataType: 'Rainfall',
            operator: '<',
            threshold: '50', // Less than 50mm
            duration: 86400 // 24 hours
          },
          {
            dataType: 'Temperature',
            operator: '>',
            threshold: '35', // Above 35°C
            duration: 86400 // 24 hours
          }
        ]
      };
    } else if (userProfile.travelFrequency === 'high') {
      recommendedPolicy = {
        type: 'Flight',
        coverage: this.calculateOptimalCoverage(userProfile.assets, 'flight'),
        duration: 1, // Per trip
        conditions: [
          {
            dataType: 'FlightStatus',
            operator: '>=',
            threshold: '1', // Delayed or cancelled
            duration: 0 // Immediate
          }
        ]
      };
    } else {
      // Default temperature insurance for general users
      recommendedPolicy = {
        type: 'Temperature',
        coverage: this.calculateOptimalCoverage(userProfile.assets, 'temperature'),
        duration: 90, // 3 months
        conditions: [
          {
            dataType: 'Temperature',
            operator: '>',
            threshold: '38', // Extreme heat
            duration: 43200 // 12 hours
          }
        ]
      };
    }

    console.log('🎯 Policy recommendation generated:', recommendedPolicy);
    return recommendedPolicy;
  }

  private calculateOptimalCoverage(assets: number, insuranceType: string): string {
    if (!assets || assets <= 0) return '5000'; // Default minimum coverage
    
    // Risk-based coverage calculation
    const coverageRatios = {
      hurricane: 0.8,    // 80% of assets for high-risk events
      earthquake: 0.75,  // 75% of assets
      crop: 0.6,         // 60% of assets for seasonal risks
      flight: 0.1,       // 10% for travel inconvenience
      temperature: 0.3   // 30% for moderate risks
    };
    
    const ratio = coverageRatios[insuranceType as keyof typeof coverageRatios] || 0.3;
    const coverage = Math.min(assets * ratio, 100000); // Cap at $100k
    
    return Math.round(coverage).toString();
  }

  // Automated policy creation
  async createPolicy(account: Account, policyData: PolicyData): Promise<string> {
    if (!this.insurancePool) {
      throw new Error('Insurance pool not initialized');
    }

    try {
      console.log('🤖 Creating policy automatically...', policyData);
      
      // Convert policy type to enum value
      const policyTypeMap: { [key: string]: number } = {
        'Crop': 0,
        'Flight': 1,
        'Hurricane': 2,
        'Earthquake': 3,
        'Temperature': 4
      };
      
      const policyType = policyTypeMap[policyData.type];
      const coverageAmount = parseInt(policyData.coverage);
      
      // Calculate premium using contract
      const premium = await this.insurancePool.call('calculate_premium', [
        policyType,
        coverageAmount
      ]);
      
      // Prepare trigger conditions
      const triggerConditions = policyData.conditions.map(condition => ({
        data_type: this.mapDataType(condition.dataType),
        operator: this.mapOperator(condition.operator),
        threshold: parseInt(condition.threshold),
        duration: condition.duration
      }));
      
      // Create policy transaction
      const createPolicyCall = this.insurancePool.populate('create_policy', [
        policyType,
        coverageAmount,
        premium,
        triggerConditions,
        policyData.duration * 86400 // Convert days to seconds
      ]);
      
      const result = await account.execute(createPolicyCall);
      await this.provider.waitForTransaction(result.transaction_hash);
      
      console.log('✅ Policy created successfully:', result.transaction_hash);
      return result.transaction_hash;
      
    } catch (error) {
      console.error('❌ Failed to create policy:', error);
      throw error;
    }
  }

  // Automated premium payment
  async payPremium(account: Account, policyId: string): Promise<string> {
    if (!this.insurancePool || !this.token) {
      throw new Error('Contracts not initialized');
    }

    try {
      console.log('🤖 Paying premium automatically for policy:', policyId);
      
      // Get policy details to determine premium amount
      const policy = await this.insurancePool.call('get_policy', [policyId]);
      const premium = policy.premium;
      
      // Approve token transfer
      const approveCall = this.token.populate('approve', [
        this.contractAddresses.insurance_pool,
        premium
      ]);
      
      // Pay premium
      const payCall = this.insurancePool.populate('pay_premium', [policyId]);
      
      // Execute both transactions
      const result = await account.execute([approveCall, payCall]);
      await this.provider.waitForTransaction(result.transaction_hash);
      
      console.log('✅ Premium paid successfully:', result.transaction_hash);
      return result.transaction_hash;
      
    } catch (error) {
      console.error('❌ Failed to pay premium:', error);
      throw error;
    }
  }

  // Automated payout claims with condition checking
  async checkAndClaimPayout(account: Account, policyId: string): Promise<{
    claimed: boolean;
    transactionHash?: string;
    reason?: string;
  }> {
    if (!this.insurancePool) {
      throw new Error('Insurance pool not initialized');
    }

    try {
      console.log('🤖 Checking conditions and claiming payout for policy:', policyId);
      
      // Check if trigger conditions are met
      const conditionsMet = await this.insurancePool.call('check_trigger_conditions', [policyId]);
      
      if (!conditionsMet) {
        return {
          claimed: false,
          reason: 'Trigger conditions not met'
        };
      }
      
      // Attempt to claim payout
      const claimCall = this.insurancePool.populate('claim_payout', [policyId]);
      const result = await account.execute(claimCall);
      await this.provider.waitForTransaction(result.transaction_hash);
      
      console.log('✅ Payout claimed successfully:', result.transaction_hash);
      return {
        claimed: true,
        transactionHash: result.transaction_hash
      };
      
    } catch (error) {
      console.error('❌ Failed to claim payout:', error);
      return {
        claimed: false,
        reason: error.message
      };
    }
  }

  // Monitor oracle data and alert users
  async monitorOracleData(): Promise<OracleData[]> {
    if (!this.oracle) {
      throw new Error('Oracle not initialized');
    }

    try {
      console.log('🤖 Monitoring oracle data...');
      
      const dataTypes = [1, 2, 3, 4, 10, 20, 30]; // All supported data types
      const oracleData: OracleData[] = [];
      
      for (const dataType of dataTypes) {
        try {
          const [value, timestamp] = await this.oracle.call('get_latest_data', [dataType]);
          const isFresh = await this.oracle.call('is_data_fresh', [dataType, 3600]); // 1 hour freshness
          
          oracleData.push({
            dataType: this.getDataTypeName(dataType),
            value: parseInt(value.toString()),
            timestamp: parseInt(timestamp.toString()),
            isFresh
          });
        } catch (error) {
          console.warn(`Failed to get data for type ${dataType}:`, error);
        }
      }
      
      console.log('📊 Oracle data retrieved:', oracleData);
      return oracleData;
      
    } catch (error) {
      console.error('❌ Failed to monitor oracle data:', error);
      return [];
    }
  }

  // Automated liquidity management
  async optimizeLiquidity(account: Account, strategy: 'conservative' | 'moderate' | 'aggressive'): Promise<string> {
    if (!this.insurancePool || !this.token) {
      throw new Error('Contracts not initialized');
    }

    try {
      console.log('🤖 Optimizing liquidity with strategy:', strategy);
      
      // Get current liquidity stats
      const totalLiquidity = await this.insurancePool.call('get_total_liquidity');
      const userRewards = await this.insurancePool.call('get_liquidity_rewards', [account.address]);
      const userBalance = await this.token.call('balance_of', [account.address]);
      
      const calls = [];
      
      // Claim existing rewards first
      if (parseInt(userRewards.toString()) > 0) {
        calls.push(this.insurancePool.populate('claim_rewards'));
      }
      
      // Determine liquidity action based on strategy
      const liquidityStrategies = {
        conservative: 0.1, // 10% of balance
        moderate: 0.25,    // 25% of balance
        aggressive: 0.5    // 50% of balance
      };
      
      const liquidityRatio = liquidityStrategies[strategy];
      const optimalLiquidity = parseInt(userBalance.toString()) * liquidityRatio;
      
      if (optimalLiquidity > 1000) { // Minimum threshold
        // Approve and provide liquidity
        calls.push(this.token.populate('approve', [
          this.contractAddresses.insurance_pool,
          Math.floor(optimalLiquidity)
        ]));
        
        calls.push(this.insurancePool.populate('provide_liquidity', [
          Math.floor(optimalLiquidity)
        ]));
      }
      
      if (calls.length > 0) {
        const result = await account.execute(calls);
        await this.provider.waitForTransaction(result.transaction_hash);
        
        console.log('✅ Liquidity optimized successfully:', result.transaction_hash);
        return result.transaction_hash;
      } else {
        console.log('ℹ️  No liquidity optimization needed');
        return '';
      }
      
    } catch (error) {
      console.error('❌ Failed to optimize liquidity:', error);
      throw error;
    }
  }

  // Generate risk analysis report
  async generateRiskReport(policies: string[]): Promise<{
    totalCoverage: number;
    totalPremiums: number;
    activeRisks: string[];
    recommendations: string[];
  }> {
    if (!this.insurancePool) {
      throw new Error('Insurance pool not initialized');
    }

    try {
      console.log('🤖 Generating risk analysis report...');
      
      let totalCoverage = 0;
      let totalPremiums = 0;
      const activeRisks: string[] = [];
      const recommendations: string[] = [];
      
      for (const policyId of policies) {
        try {
          const policy = await this.insurancePool.call('get_policy', [policyId]);
          
          if (policy.is_active) {
            totalCoverage += parseInt(policy.coverage_amount.toString());
            totalPremiums += parseInt(policy.premium.toString());
            
            const policyTypeName = this.getPolicyTypeName(policy.policy_type);
            activeRisks.push(policyTypeName);
          }
        } catch (error) {
          console.warn(`Failed to get policy ${policyId}:`, error);
        }
      }
      
      // Generate AI-powered recommendations
      if (activeRisks.length === 0) {
        recommendations.push("Consider purchasing insurance policies to protect against unexpected events.");
      }
      
      if (!activeRisks.includes('Hurricane') && !activeRisks.includes('Earthquake')) {
        recommendations.push("Consider natural disaster insurance for comprehensive protection.");
      }
      
      if (totalCoverage < 50000) {
        recommendations.push("Your current coverage may be insufficient. Consider increasing coverage amounts.");
      }
      
      if (activeRisks.length > 5) {
        recommendations.push("You have extensive coverage. Consider consolidating or optimizing your policies.");
      }
      
      const report = {
        totalCoverage,
        totalPremiums,
        activeRisks,
        recommendations
      };
      
      console.log('📋 Risk report generated:', report);
      return report;
      
    } catch (error) {
      console.error('❌ Failed to generate risk report:', error);
      throw error;
    }
  }

  // Command handling for chat interface
  async handleCommand(command: string, params: any[]): Promise<string> {
    try {
      console.log('🤖 Processing command:', command, params);
      
      switch (command.toLowerCase()) {
        case 'recommend':
          const userProfile = params[0] || {};
          const riskPrefs = params[1] || {};
          const recommendation = await this.recommendPolicy(userProfile, riskPrefs);
          return `I recommend a ${recommendation.type} insurance policy with ${recommendation.coverage} coverage. This policy would protect you based on your profile and location.`;
        
        case 'monitor':
          const oracleData = await this.monitorOracleData();
          const freshData = oracleData.filter(data => data.isFresh);
          return `Monitoring ${oracleData.length} data sources. ${freshData.length} have fresh data. Latest values: ${freshData.map(d => `${d.dataType}: ${d.value}`).join(', ')}`;
        
        case 'analyze':
          const policies = params[0] || [];
          const report = await this.generateRiskReport(policies);
          return `Risk Analysis: Total coverage: $${report.totalCoverage.toLocaleString()}, Active risks: ${report.activeRisks.join(', ')}, Recommendations: ${report.recommendations.join(' ')}`;
        
        case 'optimize':
          const strategy = params[0] || 'moderate';
          return `I can help optimize your liquidity with a ${strategy} strategy. This would automatically manage your liquidity provision to maximize returns while managing risk.`;
        
        default:
          return `I can help you with: recommend (get policy recommendations), monitor (check oracle data), analyze (risk analysis), optimize (liquidity management). What would you like to do?`;
      }
    } catch (error) {
      console.error('❌ Command handling failed:', error);
      return `Sorry, I encountered an error while processing your request: ${error.message}`;
    }
  }

  // Utility methods
  private mapDataType(dataType: string): number {
    const mapping: { [key: string]: number } = {
      'WeatherData': 0,
      'FlightStatus': 1,
      'SeismicActivity': 2,
      'Temperature': 3,
      'Rainfall': 4
    };
    return mapping[dataType] || 0;
  }

  private mapOperator(operator: string): number {
    const mapping: { [key: string]: number } = {
      '>': 0,
      '<': 1,
      '=': 2,
      '>=': 3,
      '<=': 4
    };
    return mapping[operator] || 0;
  }

  private getDataTypeName(dataType: number): string {
    const names = ['Weather Data', 'Flight Status', 'Seismic Activity', 'Temperature', 'Rainfall'];
    return names[dataType] || `Type ${dataType}`;
  }

  private getPolicyTypeName(policyType: number): string {
    const names = ['Crop Insurance', 'Flight Delay', 'Hurricane', 'Earthquake', 'Temperature'];
    return names[policyType] || `Type ${policyType}`;
  }
}

export default InsuranceAgent;