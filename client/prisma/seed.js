/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      name: 'User One',
      address: '0x123',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      name: 'User Two',
      address: '0x456',
    },
  });

  // Seed Chats
  const chat1 = await prisma.chat.create({
    data: {
      title: 'General Chat',
      userId: user1.id,
      type: 'GENERAL',
    },
  });

  // Seed Messages
  await prisma.message.create({
    data: {
      content: [{ text: 'Hello!' }],
      chatId: chat1.id,
      userId: user1.id,
    },
  });

  // Seed Transactions
  await prisma.transaction.create({
    data: {
      type: 'TRANSFER',
      userId: user1.id,
    },
  });

  // Seed GeneratedContracts
  await prisma.generatedContract.create({
    data: {
      name: 'Sample Contract',
      sourceCode: 'contract Sample {}',
      userId: user1.id,
    },
  });

  // Seed DeployedContracts
  await prisma.deployedContract.create({
    data: {
      name: 'Deployed Sample',
      sourceCode: 'contract DeployedSample {}',
      contractAddress: '0x789',
      classHash: '0xabc',
      transactionHash: '0xdef',
      userId: user1.id,
    },
  });

  // Seed Agents
  const agent1 = await prisma.agent.create({
    data: {
      name: 'Agent Alpha',
      configJson: { role: 'analyzer', settings: { active: true } },
      status: 'active',
    },
  });

  const agent2 = await prisma.agent.create({
    data: {
      name: 'Agent Beta',
      configJson: { role: 'generator', settings: { active: false } },
      status: 'inactive',
    },
  });

  // Seed CharacterFiles
  await prisma.characterFile.create({
    data: {
      agentId: agent1.id,
      jsonSchema: { type: 'character', attributes: { name: 'Hero' } },
    },
  });

  await prisma.characterFile.create({
    data: {
      agentId: agent2.id,
      jsonSchema: { type: 'character', attributes: { name: 'Sidekick' } },
    },
  });

  // Seed MemoryEntries
  await prisma.memoryEntry.create({
    data: {
      agentId: agent1.id,
      vector: [0.1, 0.2, 0.3],
      metadata: { source: 'conversation', timestamp: '2025-05-02' },
    },
  });

  await prisma.memoryEntry.create({
    data: {
      agentId: agent2.id,
      vector: [0.4, 0.5, 0.6],
      metadata: { source: 'observation', timestamp: '2025-05-02' },
    },
  });

  // Seed ActionLogs
  await prisma.actionLog.create({
    data: {
      agentId: agent1.id,
      actionType: 'start',
      payload: { details: 'Agent started processing' },
    },
  });

  await prisma.actionLog.create({
    data: {
      agentId: agent2.id,
      actionType: 'stop',
      payload: { details: 'Agent stopped processing' },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });