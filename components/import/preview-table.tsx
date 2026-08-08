'use client';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, AlertTriangle, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Empty } from '@/components/empty';
import type { ImportItem } from '@/lib/types';

const PER_PAGE = 50;

export const ISSUE_LABELS: Record<string, string> = {
  'no-part-type': 'Detal turi topilmadi',
  'no-price': 'Narx yo\'q',
  'no-model': 'Model topilmadi',
  duplicate: 'Dublikat',
};

type Filter = 'all' | 'issues' | 'no-part-type' | 'duplicate';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Barchasi' },
  { key: 'issues', label: 'Muammoli' },
  { key: 'no-part-type', label: 'Turi yo\'q' },
  { key: 'duplicate', label: 'Dublikat' },
];

/**
 * Tahlil natijasi jadvali: har qator qaysi kategoriyaga tushgani ko'rinadi,
 * muammoli qatorlar ajratilgan, har birini qo'lda tuzatish mumkin.
 * Belgilanmagan (checkbox o'chirilgan) qatorlar bazaga yozilmaydi.
 */
export function PreviewTable({
  items,
  excluded,
  onToggle,
  onToggleMany,
  onEdit,
}: {
  items: ImportItem[];
  excluded: Set<number>;
  onToggle: (row: number) => void;
  onToggleMany: (rows: number[], include: boolean) => void;
  onEdit: (item: ImportItem) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (filter === 'issues' && !it.issues.length) return false;
      if (filter === 'no-part-type' && !it.issues.includes('no-part-type')) return false;
      if (filter === 'duplicate' && !it.duplicate) return false;
      if (needle && !`${it.rawName} ${it.title} ${it.oemNumbers.join(' ')}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, filter, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const view = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const setF = (f: Filter) => { setFilter(f); setPage(1); };
  const counts = useMemo(() => ({
    all: items.length,
    issues: items.filter((i) => i.issues.length).length,
    'no-part-type': items.filter((i) => i.issues.includes('no-part-type')).length,
    duplicate: items.filter((i) => i.duplicate).length,
  }), [items]);

  const visibleRows = filtered.map((i) => i.row);
  const allVisibleIncluded = visibleRows.length > 0 && visibleRows.every((r) => !excluded.has(r));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-line bg-panel p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setF(f.key)}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                filter === f.key ? 'bg-amber text-ink font-medium' : 'text-muted hover:text-fg'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-70">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        <div className="w-64">
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Nom yoki OEM bo'yicha qidirish"
          />
        </div>

        {filtered.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleMany(visibleRows, !allVisibleIncluded)}
          >
            {allVisibleIncluded ? 'Ko\'rinayotganlarni chiqarish' : 'Ko\'rinayotganlarni qo\'shish'}
          </Button>
        )}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <Empty text="Bu filtrga mos qator yo'q" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="w-10 px-3 py-3" />
                  <th className="w-14 px-2 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Sarlavha / Excel matni</th>
                  <th className="px-3 py-3 font-medium">Kategoriya · Detal turi</th>
                  <th className="px-3 py-3 font-medium">Model</th>
                  <th className="px-3 py-3 font-medium">OEM</th>
                  <th className="px-3 py-3 text-right font-medium">Narx</th>
                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {view.map((it) => {
                  const off = excluded.has(it.row);
                  const bad = it.issues.length > 0;
                  return (
                    <tr
                      key={it.row}
                      className={`border-b border-line/60 last:border-0 transition-colors ${
                        off ? 'opacity-40' : bad ? 'bg-danger/5' : 'hover:bg-panel2/50'
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={!off}
                          onChange={() => onToggle(it.row)}
                          className="h-4 w-4 accent-amber cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-2.5 font-mono text-xs text-muted">{it.row}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium">{it.title || <span className="text-danger">— sarlavha yo'q —</span>}</div>
                        <div className="text-xs text-muted line-clamp-1">{it.rawName}</div>
                        {bad && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {it.issues.map((s) => (
                              <Badge key={s} tone={s === 'duplicate' ? 'muted' : 'danger'} className="gap-1">
                                {s === 'duplicate' ? <Copy size={10} /> : <AlertTriangle size={10} />}
                                {ISSUE_LABELS[s] || s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {it.partTypeId ? (
                          <>
                            <div className="text-xs text-muted">
                              {it.categoryName ? it.categoryName.uz || it.categoryName.ru : '—'}
                            </div>
                            <div>{it.partTypeName}</div>
                          </>
                        ) : (
                          <span className="text-danger">tanlanmagan</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {it.modelName ? (
                          <>
                            <div className="text-xs text-muted">{it.brandName}</div>
                            <div>{it.modelName}</div>
                            {it.compatible.length > 0 && (
                              <div className="text-[11px] text-muted">
                                +{it.compatible.map((c) => c.modelName).join(', ')}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-amber/80">
                        {it.oemNumbers.join(', ') || <span className="text-muted">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular whitespace-nowrap">
                        {it.price ? `${it.price} ${it.currency === 'USD' ? '$' : "so'm"}` : <span className="text-danger">0</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(it)} title="Tuzatish">
                          <Pencil size={15} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} />
          </Button>
          <span className="font-mono text-sm tabular text-muted">
            {safePage} / {pages}
            <span className="ml-2 opacity-60">({filtered.length} qator)</span>
          </span>
          <Button variant="outline" size="icon" disabled={safePage >= pages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </>
  );
}
