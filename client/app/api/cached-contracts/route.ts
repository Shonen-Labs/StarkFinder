import { NextRequest, NextResponse } from 'next/server';
import { ContractCacheService } from '@/lib/services/contractCacheService';

// GET: List contracts for a user (expects ?userId=...)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  const contracts = await ContractCacheService.listContractsByUser(userId);
  return NextResponse.json({ contracts });
}

// DELETE: Delete a contract by ID (expects ?id=...)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing contract id' }, { status: 400 });
  }
  const success = await ContractCacheService.deleteContract(id);
  if (!success) {
    return NextResponse.json({ error: 'Cannot delete contract (not found or already deployed)' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
} 