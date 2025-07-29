export type SidebarOption = 'details' | 'generated' | 'deployed' | 'cached' | 'edit' | 'settings' | 'analytics' | 'security';

export interface Contract {
  id: string;
  name: string;
  description?: string;
  contractAddress?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserData {
  name: string;
  email: string;
  address?: string;
  createdAt: string;
  deployedContracts: Contract[];
  generatedContracts: Contract[];
} 