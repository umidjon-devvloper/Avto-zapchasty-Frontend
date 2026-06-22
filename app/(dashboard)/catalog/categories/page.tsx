'use client';
import { api } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { ResourceManager, type Column, type Field } from '@/components/resource-manager';
import type { PartCategory } from '@/lib/types';

const columns: Column<PartCategory>[] = [
  { header: 'Nomi (RU)', accessor: 'name.ru' },
  { header: 'Nomi (UZ)', render: (r) => r.name.uz || '—' },
  { header: 'Slug', render: (r) => <span className="font-mono text-xs text-muted">{r.slug}</span> },
  { header: 'Tartib', accessor: 'order', className: 'tabular' },
];

const fields: Field[] = [
  { key: 'name.ru', label: 'Nomi (ruscha)', type: 'text', placeholder: 'Ходовая часть' },
  { key: 'name.uz', label: 'Nomi (o\'zbekcha)', type: 'text', placeholder: 'Yurish qismi' },
  { key: 'icon', label: 'Ikona', type: 'text', placeholder: 'package' },
  { key: 'order', label: 'Tartib', type: 'number' },
];

export default function CategoriesPage() {
  return (
    <>
      <Topbar title="Kategoriyalar" />
      <main className="p-6">
        <ResourceManager<PartCategory>
          title="Kategoriyalar"
          singular="Kategoriya"
          resource="categories"
          queryKey="categories"
          fetcher={api.categories}
          columns={columns}
          fields={fields}
          makeEmpty={() => ({ name: { ru: '', uz: '' }, icon: 'package', order: 100 })}
        />
      </main>
    </>
  );
}
