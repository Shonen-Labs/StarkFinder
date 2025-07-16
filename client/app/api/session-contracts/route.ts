import { NextRequest, NextResponse } from 'next/server';
import { ContractCacheService } from '@/lib/services/contractCacheService';

// GET: List contracts for a session (expects ?sessionId=...)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }
  const contracts = await ContractCacheService.listContractsBySession(sessionId);
  return NextResponse.json({ contracts });
} 