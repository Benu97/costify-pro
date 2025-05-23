import { Suspense } from 'react';
import { getPackets } from '@/app/actions/packets';
import PacketsDataTable from './components/packets-data-table';
import { Packet } from '@/app/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function PacketsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Packets Management</h1>
      <Suspense fallback={<p>Loading packets...</p>}>
        <PacketsContent />
      </Suspense>
    </div>
  );
}

async function PacketsContent() {
  const packets = await getPackets();
  
  return (
    <PacketsDataTable initialPackets={packets as Packet[]} />
  );
}
