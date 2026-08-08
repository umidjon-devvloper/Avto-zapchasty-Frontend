'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '@/components/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { ImportItem, ImportReference } from '@/lib/types';

/**
 * Bitta qatorni qo'lda tuzatish.
 * Avtomatik aniqlash xato bo'lgan yoki umuman topilmagan qatorlar uchun:
 * detal turi, avtomobil modeli, narx va sarlavhani qo'lda o'zgartirish.
 */
export function RowEditor({
  item,
  reference,
  onSave,
  onClose,
}: {
  item: ImportItem | null;
  reference?: ImportReference;
  onSave: (patch: Partial<ImportItem>) => void;
  onClose: () => void;
}) {
  const [ptQuery, setPtQuery] = useState('');
  const [partTypeId, setPartTypeId] = useState(item?.partTypeId || '');
  const [brandId, setBrandId] = useState(item?.brandId || '');
  const [modelId, setModelId] = useState(item?.modelId || '');
  const [price, setPrice] = useState(String(item?.price ?? ''));
  const [title, setTitle] = useState(item?.title || '');

  // Modal har ochilganda qiymatlarni tanlangan qatordan olamiz
  const key = item?.row ?? -1;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setPartTypeId(item?.partTypeId || '');
    setBrandId(item?.brandId || '');
    setModelId(item?.modelId || '');
    setPrice(String(item?.price ?? ''));
    setTitle(item?.title || '');
    setPtQuery('');
  }

  const catById = useMemo(
    () => new Map((reference?.categories || []).map((c) => [c._id, c])),
    [reference]
  );

  // Detal turlarini qidiruv bo'yicha filtrlaymiz (758 ta — hammasini ko'rsatib bo'lmaydi)
  const partTypes = useMemo(() => {
    const all = reference?.partTypes || [];
    const q = ptQuery.trim().toLowerCase();
    const list = q
      ? all.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.nameUz || '').toLowerCase().includes(q) ||
            p.slug.includes(q)
        )
      : all;
    return list.slice(0, 200);
  }, [reference, ptQuery]);

  const models = useMemo(
    () => (reference?.models || []).filter((m) => !brandId || m.brandId === brandId),
    [reference, brandId]
  );

  if (!item) return null;

  const save = () => {
    const pt = (reference?.partTypes || []).find((p) => p._id === partTypeId);
    const cat = pt ? catById.get(pt.categoryId) : null;
    const brand = (reference?.brands || []).find((b) => b._id === brandId);
    const model = models.find((m) => m._id === modelId);

    onSave({
      partTypeId: pt ? pt._id : null,
      partTypeName: pt ? pt.name : null,
      partTypeNameUz: pt ? pt.nameUz : null,
      partTypeSlug: pt ? pt.slug : null,
      categoryId: cat ? cat._id : null,
      categoryName: cat ? cat.name : null,
      categorySlug: cat ? cat.slug : null,
      brandId: brand ? brand._id : null,
      brandName: brand ? brand.name : '',
      modelId: model ? model._id : null,
      modelName: model ? model.name : '',
      price: Number(price) || 0,
      title: title.trim(),
      // Tuzatilgandan keyin qaysi muammolar qolganini qayta hisoblaymiz
      issues: [
        !pt && 'no-part-type',
        !(Number(price) || 0) && 'no-price',
        !model && 'no-model',
        item.duplicate && 'duplicate',
      ].filter(Boolean) as string[],
    });
  };

  return (
    <Modal open={!!item} onClose={onClose} title={`Qator ${item.row} — tuzatish`}>
      <div className="space-y-4">
        <div className="rounded border border-line bg-panel2 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-muted">Excel'dagi matn</div>
          <div className="mt-0.5 text-sm">{item.rawName}</div>
          {item.oemNumbers.length > 0 && (
            <div className="mt-1 font-mono text-[11px] text-amber/80">OEM: {item.oemNumbers.join(', ')}</div>
          )}
        </div>

        <div>
          <Label>Sarlavha</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E'lon sarlavhasi" />
        </div>

        <div>
          <Label>Detal turi</Label>
          <div className="relative mb-1.5">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              className="pl-8"
              value={ptQuery}
              onChange={(e) => setPtQuery(e.target.value)}
              placeholder="Qidirish: амортизатор, tormoz, fara..."
            />
          </div>
          <Select className="w-full" value={partTypeId} onChange={(e) => setPartTypeId(e.target.value)}>
            <option value="">— tanlanmagan —</option>
            {partTypes.map((p) => {
              const cat = catById.get(p.categoryId);
              return (
                <option key={p._id} value={p._id}>
                  {p.name}
                  {p.nameUz ? ` / ${p.nameUz}` : ''}
                  {cat ? `  ·  ${cat.name.uz || cat.name.ru}` : ''}
                </option>
              );
            })}
          </Select>
          {ptQuery && partTypes.length === 0 && (
            <p className="mt-1 text-xs text-danger">Topilmadi — boshqacha yozib ko'ring</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Marka</Label>
            <Select
              className="w-full"
              value={brandId}
              onChange={(e) => { setBrandId(e.target.value); setModelId(''); }}
            >
              <option value="">— yo'q —</option>
              {(reference?.brands || []).map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Model</Label>
            <Select className="w-full" value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={!brandId}>
              <option value="">— yo'q —</option>
              {models.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Narx</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Bekor</Button>
          <Button onClick={save}>Saqlash</Button>
        </div>
      </div>
    </Modal>
  );
}
