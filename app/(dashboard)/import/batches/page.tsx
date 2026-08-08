'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Undo2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/modal';
import { Empty } from '@/components/empty';
import { useToast } from '@/components/toast';
import { formatDate, CONDITION_LABELS } from '@/lib/utils';
import type { ImportBatch } from '@/lib/types';

/**
 * Import partiyalari tarixi. Har bir partiyani butunlay qaytarib olish mumkin —
 * xato fayl yuklansa, bazani qo'lda tozalash shart emas.
 */
export default function ImportBatchesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<ImportBatch | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['import-batches', page],
    queryFn: () => api.importBatches({ page, limit: 20 }),
  });

  const rollback = useMutation({
    mutationFn: (id: string) => api.importRollback(id),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['import-batches'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.show(`${r.deleted} ta e'lon o'chirildi`, 'success');
      setConfirm(null);
    },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  return (
    <>
      <Topbar title="Import tarixi" />
      <main className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/import">
            <Button variant="ghost" size="sm"><ArrowLeft size={15} /> Import sahifasi</Button>
          </Link>
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-lg border border-line bg-panel2/50 px-4 py-3 text-sm text-muted">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>
            Partiyani qaytarib olish — o'sha import bilan yaratilgan <strong>barcha e'lonlarni o'chiradi</strong>.
            Sotuvchi keyin qo'lda qo'shgan e'lonlarga tegilmaydi.
          </span>
        </div>

        <Card>
          {isLoading || !data ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : data.items.length === 0 ? (
            <Empty text="Hali import qilinmagan" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Fayl</th>
                    <th className="px-5 py-3 font-medium">Sotuvchi</th>
                    <th className="px-5 py-3 font-medium">Sozlamalar</th>
                    <th className="px-5 py-3 text-right font-medium">Yaratildi</th>
                    <th className="px-5 py-3 text-right font-medium">Hozir bazada</th>
                    <th className="px-5 py-3 font-medium">Sana</th>
                    <th className="px-5 py-3 font-medium">Holat</th>
                    <th className="px-5 py-3 text-right font-medium">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((b) => (
                    <tr key={b._id} className="border-b border-line/60 last:border-0 hover:bg-panel2/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium">{b.fileName || '—'}</div>
                        <div className="font-mono text-[11px] text-muted">{b._id}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-xs">{b.sellerId?.name || '—'}</div>
                        <div className="font-mono text-[11px] text-muted">{b.sellerId?.phone}</div>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">
                        {b.defaults?.condition && <div>{CONDITION_LABELS[b.defaults.condition] || b.defaults.condition}</div>}
                        {b.defaults?.currency && <div>{b.defaults.currency}</div>}
                        {b.defaults?.descriptionNote && <div className="line-clamp-1">{b.defaults.descriptionNote}</div>}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular">{b.created}</td>
                      <td className="px-5 py-3 text-right font-mono tabular">
                        {b.status === 'committed' ? b.liveCount : <span className="text-muted">0</span>}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-muted">{formatDate(b.createdAt)}</td>
                      <td className="px-5 py-3">
                        {b.status === 'committed' ? (
                          <Badge tone="success">Kiritilgan</Badge>
                        ) : (
                          <Badge tone="muted">Qaytarilgan</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {b.status === 'committed' && (
                          <Button variant="danger" size="sm" onClick={() => setConfirm(b)}>
                            <Undo2 size={14} /> Qaytarish
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {data && data.pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <span className="font-mono text-sm tabular text-muted">{page} / {data.pages}</span>
            <Button variant="outline" size="icon" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </main>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Partiyani qaytarish">
        {confirm && (
          <>
            <p className="text-sm">
              <strong>{confirm.fileName}</strong> partiyasi bilan yaratilgan{' '}
              <strong className="text-danger">{confirm.liveCount} ta e'lon</strong> butunlay o'chiriladi.
            </p>
            <p className="mt-2 text-sm text-muted">
              Sotuvchi: {confirm.sellerId?.name} ({confirm.sellerId?.phone}). Buni qaytarib bo'lmaydi.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirm(null)}>Bekor</Button>
              <Button variant="danger" disabled={rollback.isPending} onClick={() => rollback.mutate(confirm._id)}>
                {rollback.isPending && <Spinner className="h-3.5 w-3.5" />}
                <Undo2 size={15} /> Ha, o'chirilsin
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
