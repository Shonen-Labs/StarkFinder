import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Create a user
  const user = await prisma.user.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      address: '0x1234567890123456789012345678901234567890',
    },
  });

  // Delete existing contracts
  await prisma.deployedContract.deleteMany();
  await prisma.generatedContract.deleteMany();

  // Create deployed contracts
  await prisma.deployedContract.createMany({
    data: [
      {
        id: uuidv4(),
        name: 'Token Contract',
        sourceCode: '// ERC20 Token implementation',
        userId: user.id,
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        classHash: '0x1234567890abcdef1234567890abcdef1234567890',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
      },
      {
        id: uuidv4(),
        name: 'Voting Contract',
        sourceCode: '// On-chain voting system',
        userId: user.id,
        contractAddress: '0x7890abcdef1234567890abcdef1234567890abcd',
        classHash: '0xabcdef1234567890abcdef1234567890abcdef1234',
        transactionHash: '0x7890abcdef1234567890abcdef1234567890abcd',
      },
      {
        id: uuidv4(),
        name: 'NFT Marketplace',
        sourceCode: '// NFT trading platform',
        userId: user.id,
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        classHash: '0x7890abcdef1234567890abcdef1234567890abcd',
        transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
      },
      {
        id: uuidv4(),
        name: 'Staking Pool',
        sourceCode: '// Token staking mechanism',
        userId: user.id,
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef34',
        classHash: '0xabcdef1234567890abcdef1234567890abcdef5678',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef34',
      },
      {
        id: uuidv4(),
        name: 'Lending Protocol',
        sourceCode: '// DeFi lending platform',
        userId: user.id,
        contractAddress: '0x567890abcdef1234567890abcdef1234567890ab',
        classHash: '0x1234567890abcdef1234567890abcdef1234567890',
        transactionHash: '0x567890abcdef1234567890abcdef1234567890ab',
      },
      {
        id: uuidv4(),
        name: 'DAO Treasury',
        sourceCode: '// DAO fund management',
        userId: user.id,
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef56',
        classHash: '0x7890abcdef1234567890abcdef1234567890abcd',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef56',
      },
      {
        id: uuidv4(),
        name: 'Bridge Contract',
        sourceCode: '// Cross-chain bridge',
        userId: user.id,
        contractAddress: '0x1234567890abcdef1234567890abcdef12345690',
        classHash: '0xabcdef1234567890abcdef1234567890abcdef1234',
        transactionHash: '0x1234567890abcdef1234567890abcdef12345690',
      },
    ],
  });

  // Create generated contracts
  await prisma.generatedContract.createMany({
    data: [
      {
        id: uuidv4(),
        name: 'NFT Contract',
        sourceCode: '// ERC721 implementation',
        userId: user.id,
      },
      {
        id: uuidv4(),
        name: 'DAO Contract',
        sourceCode: '// Governance system',
        userId: user.id,
      },
      {
        id: uuidv4(),
        name: 'Multi-sig Wallet',
        sourceCode: '// Multi-signature wallet',
        userId: user.id,
      },
      {
        id: uuidv4(),
        name: 'Oracle Contract',
        sourceCode: '// Price feed oracle',
        userId: user.id,
      },
      {
        id: uuidv4(),
        name: 'Insurance Pool',
        sourceCode: '// DeFi insurance',
        userId: user.id,
      },
      {
        id: uuidv4(),
        name: 'Yield Aggregator',
        sourceCode: '// Yield farming',
        userId: user.id,
      },
      {
        id: uuidv4(),
        name: 'Options Market',
        sourceCode: '// Options trading',
        userId: user.id,
      },
      {
        id: uuidv4(),
        name: 'Prediction Market',
        sourceCode: '// Event prediction',
        userId: user.id,
      },
    ],
  });

  console.log('Database has been seeded with 15 contracts. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
