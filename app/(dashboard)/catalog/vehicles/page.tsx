'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CascadeCrud } from '@/components/cascade-crud';
import type { Column } from '@/components/resource-manager';
import type { Field } from '@/components/form-fields';
import type { CarModel, Generation, Engine } from '@/lib/types';
import { Layers, Calendar, Fuel } from 'lucide-react';

type Tab = 'models' | 'generations' | 'engines';

const TABS: { key: Tab; label: string }[] = [
  { key: 'models', label: 'Modellar' },
  { key: 'generations', label: 'Avlodlar' },
  { key: 'engines', label: 'Dvigatellar' },
];

const BODY_TYPES = ['sedan', 'hatchback', 'suv', 'crossover', 'wagon', 'coupe', 'pickup', 'minivan', 'van', 'liftback'];
const FUEL_TYPES = [
  { value: 'petrol', label: 'Benzin' },
  { value: 'diesel', label: 'Dizel' },
  { value: 'hybrid', label: 'Gibrid' },
  { value: 'electric', label: 'Elektr' },
  { value: 'gas', label: 'Gaz' },
];
const FUEL_LABEL: Record<string, string> = Object.fromEntries(FUEL_TYPES.map((f) => [f.value, f.label]));

// Ustun va maydon konfiguratsiyalari
const modelColumns: Column<CarModel>[] = [
  { header: 'Model', accessor: 'name' },
  { header: 'Slug', render: (r) => <span className="font-mono text-xs text-muted">{r.slug}</span> },
  { header: 'Mashhur', render: (r) => (r.popular ? <Badge tone="amber">Ha</Badge> : <span className="text-muted">—</span>) },
];
const modelFields: Field[] = [
  { key: 'name', label: 'Model nomi', type: 'text', placeholder: 'Cobalt' },
  { key: 'popular', label: 'Mashhur model', type: 'boolean' },
];

const genColumns: Column<Generation>[] = [
  { header: 'Avlod', accessor: 'name' },
  { header: 'Yillar', render: (r) => <span className="font-mono tabular">{`${r.yearFrom || '?'}–${r.yearTo || ''}`}</span> },
  { header: 'Kuzov', accessor: 'bodyType' },
];
const genFields: Field[] = [
  { key: 'name', label: 'Avlod nomi', type: 'text', placeholder: 'XV70 / 70 kuzov' },
  { key: 'yearFrom', label: 'Boshlanish yili', type: 'number', placeholder: '2017' },
  { key: 'yearTo', label: 'Tugash yili', type: 'number', placeholder: '2024' },
  { key: 'bodyType', label: 'Kuzov turi', type: 'select', options: BODY_TYPES.map((b) => ({ value: b, label: b })) },
];

const engineColumns: Column<Engine>[] = [
  { header: 'Dvigatel', accessor: 'name' },
  { header: 'Hajm', render: (r) => <span className="font-mono tabular">{r.volume ?? '—'}</span> },
  { header: 'Yoqilg\'i', render: (r) => <Badge tone="neutral">{FUEL_LABEL[r.fuelType] || r.fuelType}</Badge> },
  { header: 'Quvvat', render: (r) => <span className="font-mono tabular">{r.power ?? '—'}</span> },
];
const engineFields: Field[] = [
  { key: 'name', label: 'Dvigatel nomi', type: 'text', placeholder: '2.5 benzin' },
  { key: 'volume', label: 'Hajm (l)', type: 'number', placeholder: '2.5' },
  { key: 'fuelType', label: "Yoqilg'i turi", type: 'select', options: FUEL_TYPES },
  { key: 'power', label: 'Quvvat (o.k.)', type: 'number', placeholder: '200' },
];

export default function VehiclesPage() {
  const [tab, setTab] = useState<Tab>('models');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [generationId, setGenerationId] = useState('');

  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: api.brands });
  const { data: models } = useQuery({
    queryKey: ['models', brandId], queryFn: () => api.brandModels(brandId), enabled: !!brandId,
  });
  const { data: generations } = useQuery({
    queryKey: ['generations', modelId], queryFn: () => api.modelGenerations(modelId), enabled: !!modelId,
  });

  const selectBrand = (id: string) => { setBrandId(id); setModelId(''); setGenerationId(''); };
  const selectModel = (id: string) => { setModelId(id); setGenerationId(''); };

  return (
    <>
      <Topbar title="Mashina ierarxiyasi" />
      <main className="p-6">
        {/* Tablar */}
        <div className="mb-5 inline-flex rounded-md border border-line bg-panel p-1">
          {TABS.map((t) => {
            const Icon = t.key === 'models' ? Layers : t.key === 'generations' ? Calendar : Fuel;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 rounded px-3.5 py-1.5 text-sm transition-colors ${
                  tab === t.key ? 'bg-amber text-ink font-medium' : 'text-muted hover:text-fg'
                }`}>
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Kaskadli tanlovlar */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <Label>Brend</Label>
            <Select value={brandId} onChange={(e) => selectBrand(e.target.value)} className="min-w-[180px]">
              <option value="">— brend tanlang —</option>
              {brands?.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </Select>
          </div>

          {(tab === 'generations' || tab === 'engines') && (
            <div>
              <Label>Model</Label>
              <Select value={modelId} onChange={(e) => selectModel(e.target.value)} className="min-w-[180px]" disabled={!brandId}>
                <option value="">— model tanlang —</option>
                {models?.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </Select>
            </div>
          )}

          {tab === 'engines' && (
            <div>
              <Label>Avlod</Label>
              <Select value={generationId} onChange={(e) => setGenerationId(e.target.value)} className="min-w-[180px]" disabled={!modelId}>
                <option value="">— avlod tanlang —</option>
                {generations?.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
              </Select>
            </div>
          )}
        </div>

        {/* CRUD */}
        {tab === 'models' && (
          brandId ? (
            <CascadeCrud<CarModel>
              parentId={brandId} parentKey="brandId" resource="models" queryKey="models"
              singular="Model" fetcher={api.brandModels} columns={modelColumns} fields={modelFields}
              makeEmpty={() => ({ name: '', popular: false })}
            />
          ) : <Hint text="Modellarni ko'rish uchun brend tanlang" />
        )}

        {tab === 'generations' && (
          modelId ? (
            <CascadeCrud<Generation>
              parentId={modelId} parentKey="modelId" resource="generations" queryKey="generations"
              singular="Avlod" fetcher={api.modelGenerations} columns={genColumns} fields={genFields}
              makeEmpty={() => ({ name: '', yearFrom: undefined, yearTo: undefined, bodyType: 'sedan' })}
            />
          ) : <Hint text="Avlodlarni ko'rish uchun brend va model tanlang" />
        )}

        {tab === 'engines' && (
          generationId ? (
            <CascadeCrud<Engine>
              parentId={generationId} parentKey="generationId" resource="engines" queryKey="engines"
              singular="Dvigatel" fetcher={api.generationEngines} columns={engineColumns} fields={engineFields}
              makeEmpty={() => ({ name: '', volume: undefined, fuelType: 'petrol', power: undefined })}
            />
          ) : <Hint text="Dvigatellarni ko'rish uchun brend, model va avlod tanlang" />
        )}
      </main>
    </>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-line2 bg-panel/40 py-12 text-center text-sm text-muted">
      {text}
    </div>
  );
}
