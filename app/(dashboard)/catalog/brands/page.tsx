'use client';
import { api } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { ResourceManager, type Column, type Field } from '@/components/resource-manager';
import { Badge } from '@/components/ui/badge';
import type { Brand } from '@/lib/types';

const columns: Column<Brand>[] = [
  { header: 'Brend', accessor: 'name' },
  { header: 'Slug', render: (r) => <span className="font-mono text-xs text-muted">{r.slug}</span> },
  { header: 'Davlat', accessor: 'country' },
  { header: 'Mashhur', render: (r) => (r.popular ? <Badge tone="amber">Ha</Badge> : <span className="text-muted">—</span>) },
];

const fields: Field[] = [
  { key: 'name', label: 'Brend nomi', type: 'text', placeholder: 'Chevrolet' },
  { key: 'country', label: 'Davlat', type: 'text', placeholder: 'USA/UZ' },
  { key: 'order', label: 'Tartib', type: 'number' },
  { key: 'popular', label: 'Bosh ekranda ko\'rsatish (mashhur)', type: 'boolean' },
];

export default function BrandsPage() {
  return (
    <>
      <Topbar title="Brendlar" />
      <main className="p-6">
        <ResourceManager<Brand>
          title="Brendlar"
          singular="Brend"
          resource="brands"
          queryKey="brands"
          fetcher={api.brands}
          columns={columns}
          fields={fields}
          makeEmpty={() => ({ name: '', country: '', popular: false, order: 100 })}
        />
      </main>
    </>
  );
}
