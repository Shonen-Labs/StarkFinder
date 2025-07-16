import { NextRequest, NextResponse } from 'next/server';
import { ContractCacheService } from '@/lib/services/contractCacheService';

// GET: Fetch contract by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing contract id' }, { status: 400 });
  }
  const contract = await ContractCacheService.getContract(id);
  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }
  return NextResponse.json({ contract });
}

// PATCH: Update contract name
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing contract id' }, { status: 400 });
  }
  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  }
  const success = await ContractCacheService.updateContractName(id, name);
  if (!success) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
} 