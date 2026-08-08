'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, FileSpreadsheet, X, Check, Search, ArrowLeft, History, AlertTriangle, Package,
} from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/toast';
import { PreviewTable } from '@/components/import/preview-table';
import { RowEditor } from '@/components/import/row-editor';
import { CONDITION_LABELS } from '@/lib/utils';
import type { Condition, ImportAnalysis, ImportItem, User } from '@/lib/types';

type Step = 'upload' | 'preview' | 'done';

export default function ImportPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Sotuvchi
  const [sellerQuery, setSellerQuery] = useState('');
  const [seller, setSeller] = useState<User | null>(null);

  // Sozlamalar
  const [condition, setCondition] = useState<Condition>('new');
  const [currency, setCurrency] = useState('');          // bo'sh = avtomatik aniqlansin
  const [status, setStatus] = useState<'active' | 'pending' | 'draft'>('active');
  const [descriptionNote, setDescriptionNote] = useState('');

  // Tahlil natijasi
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<ImportItem | null>(null);
  const [result, setResult] = useState<{ batchId: string; created: number; skippedTotal: number } | null>(null);

  // Qo'lda tuzatish uchun ro'yxatlar — bir marta yuklanadi
  const { data: reference } = useQuery({
    queryKey: ['import-reference'],
    queryFn: api.importReference,
    staleTime: 10 * 60 * 1000,
  });

  // Sotuvchi qidirish
  const { data: sellers } = useQuery({
    queryKey: ['import-sellers', sellerQuery],
    queryFn: () => api.users({ q: sellerQuery, limit: 10 }),
    enabled: sellerQuery.trim().length >= 3,
  });

  const analyze = useMutation({
    mutationFn: (f: File) => api.importAnalyze(f, currency ? { currency } : undefined),
    onSuccess: (r) => {
      setAnalysis(r);
      setItems(r.items);
      // Dublikatlar boshidan belgilanmagan bo'lsin — odatda ular kerak emas
      setExcluded(new Set(r.items.filter((i) => i.duplicate).map((i) => i.row)));
      setStep('preview');
    },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  const commit = useMutation({
    mutationFn: () => {
      if (!seller || !analysis) throw new Error('Sotuvchi tanlanmagan');
      const chosen = items.filter((i) => !excluded.has(i.row) && i.partTypeId);
      return api.importCommit({
        sellerId: seller._id,
        fileName: analysis.fileName,
        sheet: analysis.sheet,
        columns: analysis.columns,
        defaults: {
          condition,
          currency: currency || analysis.currency,
          descriptionNote,
          status,
        },
        items: chosen,
      });
    },
    onSuccess: (r) => {
      setResult(r);
      setStep('done');
      qc.invalidateQueries({ queryKey: ['import-batches'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.show(`${r.created} ta e'lon kiritildi`, 'success');
    },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
      toast.show('Faqat Excel fayl (.xlsx, .xls, .csv)', 'error');
      return;
    }
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] || null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRow = (row: number) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row); else next.add(row);
      return next;
    });

  const toggleMany = (rows: number[], include: boolean) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      rows.forEach((r) => (include ? next.delete(r) : next.add(r)));
      return next;
    });

  const saveRow = (patch: Partial<ImportItem>) => {
    if (!editing) return;
    setItems((prev) => prev.map((it) => (it.row === editing.row ? { ...it, ...patch } : it)));
    setEditing(null);
    toast.show('Qator yangilandi', 'success');
  };

  const selected = useMemo(
    () => items.filter((i) => !excluded.has(i.row) && i.partTypeId),
    [items, excluded]
  );
  const blocked = useMemo(
    () => items.filter((i) => !excluded.has(i.row) && !i.partTypeId).length,
    [items, excluded]
  );

  const reset = () => {
    setStep('upload'); setFile(null); setAnalysis(null); setItems([]);
    setExcluded(new Set()); setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <Topbar title="Excel import" />
      <main className="p-6">
        {/* ---------- 1-QADAM: fayl va sozlamalar ---------- */}
        {step === 'upload' && (
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber-800">
              <FileSpreadsheet size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <span>
                Prays-listni yuklang — tizim har bir qatorni <strong>kategoriya va detal turiga</strong> bog'laydi,
                nom ichidan <strong>OEM raqam, avtomobil modeli va ishlab chiqaruvchini</strong> ajratadi.
                Bazaga yozishdan oldin hammasini ko'rib chiqasiz.
              </span>
            </div>

            <Card className="p-5">
              <Label>Excel fayl</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-10 transition-colors ${
                  dragOver ? 'border-amber bg-amber/5' : 'border-line hover:border-muted'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <>
                    <FileSpreadsheet size={28} className="text-amber" />
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    >
                      <X size={14} /> Boshqa fayl
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="text-muted" />
                    <div className="text-sm">Faylni shu yerga tashlang yoki bosing</div>
                    <div className="text-xs text-muted">.xlsx, .xls, .csv — 25 MB gacha</div>
                  </>
                )}
              </div>
            </Card>

            <Card className="space-y-4 p-5">
              <div>
                <Label>Sotuvchi</Label>
                {seller ? (
                  <div className="mt-1.5 flex items-center justify-between rounded border border-line bg-panel2 px-3 py-2">
                    <div>
                      <div className="text-sm font-medium">{seller.name || '—'}</div>
                      <div className="font-mono text-xs text-muted">{seller.phone}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSeller(null); setSellerQuery(''); }}>
                      <X size={14} /> O'zgartirish
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative mt-1.5">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                      <Input
                        className="pl-8"
                        value={sellerQuery}
                        onChange={(e) => setSellerQuery(e.target.value)}
                        placeholder="Telefon raqam bo'yicha qidiring: 998901234567"
                      />
                    </div>
                    {sellerQuery.trim().length >= 3 && (
                      <div className="mt-1.5 max-h-52 overflow-y-auto rounded border border-line">
                        {(sellers?.items || []).length === 0 ? (
                          <div className="px-3 py-3 text-sm text-muted">Topilmadi</div>
                        ) : (
                          (sellers?.items || []).map((u) => (
                            <button
                              key={u._id}
                              onClick={() => setSeller(u)}
                              className="flex w-full items-center justify-between border-b border-line/60 px-3 py-2 text-left last:border-0 hover:bg-panel2"
                            >
                              <span>
                                <span className="text-sm">{u.name || '—'}</span>
                                <span className="ml-2 font-mono text-xs text-muted">{u.phone}</span>
                              </span>
                              <Badge tone={u.role === 'buyer' ? 'muted' : 'success'}>{u.role}</Badge>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Holati</Label>
                  <Select className="w-full" value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
                    {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Valyuta</Label>
                  <Select className="w-full" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="">Avtomatik</option>
                    <option value="UZS">so'm (UZS)</option>
                    <option value="USD">dollar (USD)</option>
                  </Select>
                </div>
                <div>
                  <Label>E'lon holati</Label>
                  <Select className="w-full" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                    <option value="active">Faol (darhol ko'rinadi)</option>
                    <option value="pending">Tekshiruvda</option>
                    <option value="draft">Qoralama</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Tavsif matni (barcha e'lonlarga qo'shiladi)</Label>
                <Input
                  value={descriptionNote}
                  onChange={(e) => setDescriptionNote(e.target.value)}
                  placeholder="Masalan: Xitoy mahsulotlari"
                />
              </div>
            </Card>

            <div className="flex items-center justify-between">
              <Link href="/import/batches">
                <Button variant="ghost"><History size={16} /> Import tarixi</Button>
              </Link>
              <Button
                disabled={!file || !seller || analyze.isPending}
                onClick={() => file && analyze.mutate(file)}
              >
                {analyze.isPending && <Spinner className="h-3.5 w-3.5" />}
                Tahlil qilish
              </Button>
            </div>
          </div>
        )}

        {/* ---------- 2-QADAM: oldindan ko'rish ---------- */}
        {step === 'preview' && analysis && (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={reset}><ArrowLeft size={15} /> Orqaga</Button>
                <div>
                  <div className="text-sm font-medium">{analysis.fileName}</div>
                  <div className="text-xs text-muted">
                    varaq «{analysis.sheet}» · ustunlar: nom {analysis.columns.nameCol + 1}
                    {analysis.columns.priceCol != null && `, narx ${analysis.columns.priceCol + 1}`}
                    {analysis.columns.modelCol != null && `, model ${analysis.columns.modelCol + 1}`}
                    {' · '}valyuta {currency || analysis.currency}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">
                  <strong className="text-fg">{selected.length}</strong> ta e'lon yoziladi
                </span>
                <Button
                  disabled={!selected.length || commit.isPending}
                  onClick={() => commit.mutate()}
                >
                  {commit.isPending && <Spinner className="h-3.5 w-3.5" />}
                  <Check size={16} /> Bazaga kiritish
                </Button>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Jami qator" value={analysis.stats.total} />
              <Stat label="Yoziladi" value={selected.length} tone="success" />
              <Stat label="Turi topilmadi" value={analysis.stats.noPartType} tone={analysis.stats.noPartType ? 'danger' : undefined} />
              <Stat label="Model topilmadi" value={analysis.stats.noModel} />
              <Stat label="Dublikat" value={analysis.stats.duplicates} />
            </div>

            {blocked > 0 && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>
                  <strong>{blocked}</strong> ta belgilangan qatorda detal turi tanlanmagan — ular yozilmaydi.
                  «Turi yo'q» filtriga o'tib qo'lda tanlang yoki belgini olib tashlang.
                </span>
              </div>
            )}

            <PreviewTable
              items={items}
              excluded={excluded}
              onToggle={toggleRow}
              onToggleMany={toggleMany}
              onEdit={setEditing}
            />
          </>
        )}

        {/* ---------- 3-QADAM: natija ---------- */}
        {step === 'done' && result && (
          <div className="mx-auto max-w-lg">
            <Card className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                <Check size={28} />
              </div>
              <h2 className="text-lg font-semibold">Import tugadi</h2>
              <p className="mt-1 text-sm text-muted">
                <strong className="text-fg">{result.created}</strong> ta e'lon yaratildi
                {result.skippedTotal > 0 && ` · ${result.skippedTotal} ta o'tkazib yuborildi`}
              </p>
              <p className="mt-3 font-mono text-xs text-muted">partiya: {result.batchId}</p>
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" onClick={reset}>Yana import qilish</Button>
                <Link href="/import/batches"><Button><History size={16} /> Tarixga o'tish</Button></Link>
              </div>
            </Card>
          </div>
        )}
      </main>

      <RowEditor item={editing} reference={reference} onSave={saveRow} onClose={() => setEditing(null)} />
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'danger' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-fg';
  return (
    <Card className="px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-0.5 text-xl font-semibold tabular ${color}`}>{value}</div>
    </Card>
  );
}
