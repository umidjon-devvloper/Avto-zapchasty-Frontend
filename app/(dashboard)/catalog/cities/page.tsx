'use client';
import { api } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { ResourceManager, type Column, type Field } from '@/components/resource-manager';
import type { City } from '@/lib/types';

const columns: Column<City>[] = [
  { header: 'Shahar (UZ)', accessor: 'name.uz' },
  { header: 'Shahar (RU)', render: (r) => r.name.ru || '—' },
  { header: 'Slug', render: (r) => <span className="font-mono text-xs text-muted">{r.slug}</span> },
  { header: 'Markaz', accessor: 'region' },
];

const fields: Field[] = [
  { key: 'name.uz', label: 'Nomi (o\'zbekcha)', type: 'text', placeholder: 'Buxoro' },
  { key: 'name.ru', label: 'Nomi (ruscha)', type: 'text', placeholder: 'Бухара' },
  { key: 'region', label: 'Markaz/tuman', type: 'text', placeholder: 'Buxoro' },
  { key: 'order', label: 'Tartib', type: 'number' },
];

export default function CitiesPage() {
  return (
    <>
      <Topbar title="Shaharlar" />
      <main className="p-6">
        <ResourceManager<City>
          title="Shaharlar"
          singular="Shahar"
          resource="cities"
          queryKey="cities"
          fetcher={api.cities}
          columns={columns}
          fields={fields}
          makeEmpty={() => ({ name: { uz: '', ru: '' }, region: '', order: 100 })}
        />
      </main>
    </>
  );
}
