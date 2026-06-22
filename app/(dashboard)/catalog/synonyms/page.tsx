'use client';
import { api } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { ResourceManager, type Column, type Field } from '@/components/resource-manager';
import { Badge } from '@/components/ui/badge';
import type { Synonym } from '@/lib/types';

const columns: Column<Synonym>[] = [
  { header: 'Asosiy atama', render: (r) => <span className="font-medium">{r.canonical}</span> },
  { header: 'Variantlar (sinonim)', render: (r) => (
    <span className="text-muted">{r.aliases.join(', ') || '—'}</span>
  ) },
  { header: "Ko'p ma'noli", render: (r) => (r.ambiguous ? <Badge tone="amber">Ha</Badge> : <span className="text-muted">—</span>) },
  { header: 'Izoh', render: (r) => <span className="text-xs text-muted">{r.note || '—'}</span> },
];

const fields: Field[] = [
  { key: 'canonical', label: 'Asosiy (formal) atama', type: 'text', placeholder: 'аккумулятор' },
  { key: 'aliases', label: 'Variantlar', type: 'tags', placeholder: 'аккум, акб, battery' },
  { key: 'note', label: 'Izoh (ixtiyoriy)', type: 'text', placeholder: "ko'p ma'noli bo'lsa..." },
  { key: 'ambiguous', label: "Ko'p ma'noli (disk, filtr kabi)", type: 'boolean' },
];

export default function SynonymsPage() {
  return (
    <>
      <Topbar title="Sinonimlar (qidiruv lug'ati)" />
      <main className="p-6">
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Qidiruvni kengaytirish lug'ati. Foydalanuvchi guruhdagi istalgan so'zni yozsa, barcha
          variantlar bo'yicha qidiriladi (masalan «колодка» → «тормозные колодки»).
        </p>
        <ResourceManager<Synonym>
          title="Sinonimlar"
          singular="Sinonim"
          resource="synonyms"
          queryKey="synonyms-admin"
          fetcher={() => api.adminSynonyms({ limit: 100 }).then((r) => r.items)}
          columns={columns}
          fields={fields}
          makeEmpty={() => ({ canonical: '', aliases: [], note: '', ambiguous: false })}
        />
      </main>
    </>
  );
}
