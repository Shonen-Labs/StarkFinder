export interface Pool {
  name: string;
  apy: number;
  tvl: number;
  riskLevel: string;
  impermanentLoss: string;
  chain: string;
  protocol: string;
}

export interface UserPreferences {
  riskTolerance: "low" | "medium" | "high";
  preferredAssets: string[];
  preferredChains: string[];
  investmentHorizon: "short" | "medium" | "long";
}

export interface InvestmentRecommendation {
  solver: string;
  type: "recommendation";
  extractedParams: {
    riskTolerance: string;
    investmentHorizon: string;
    preferredAssets: string[];
    preferredChains: string[];
  };
  data: {
    description: string;
    pools: Pool[];
    strategy: {
      summary: string;
      steps: string[];
      riskAnalysis: string;
      timeframe: string;
    };
  };
}
