'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, X, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, STATUS_TONE } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/modal';
import { Empty } from '@/components/empty';
import { useToast } from '@/components/toast';
import { CONDITION_LABELS, STATUS_LABELS, formatPrice, formatDate } from '@/lib/utils';
import type { Listing } from '@/lib/types';

function PendingCountdown({ scheduledActivateAt }: { scheduledActivateAt?: string }) {
  if (!scheduledActivateAt) return null;
  const msLeft = new Date(scheduledActivateAt).getTime() - Date.now();
  if (msLeft <= 0) return <span className="text-xs text-green-600 font-medium">Tez orada faollashadi</span>;
  const secLeft = Math.ceil(msLeft / 1000);
  const min = Math.floor(secLeft / 60);
  const sec = secLeft % 60;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
      <Clock size={11} />
      {min > 0 ? `${min} daq ${sec} s` : `${sec} s`} qoldi
    </span>
  );
}

const TABS = [
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'active', label: 'Faol' },
  { key: 'rejected', label: 'Rad etilgan' },
  { key: '', label: 'Barchasi' },
];

export default function ListingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings', status, page],
    queryFn: () => api.listings({ ...(status ? { status } : {}), page, limit: 15 }),
  });

  const moderate = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.moderate(id, 'reject', reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-listings'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.show('Rad etildi', 'success');
      setRejectId(null);
      setReason('');
    },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  const setTab = (key: string) => { setStatus(key); setPage(1); };

  return (
    <>
      <Topbar title="E'lonlar" />
      <main className="p-6">
        {/* Auto-activate haqida izoh */}
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber-800">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <span>
            E'lonlar joylangandan <strong>2 daqiqa</strong> so'ng avtomatik faollashadi.
            Faqat muammolik e'lonlarni <strong>rad eting</strong>.
          </span>
        </div>

        {/* Filtr tablari */}
        <div className="mb-5 inline-flex rounded-md border border-line bg-panel p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded px-3.5 py-1.5 text-sm transition-colors ${
                status === t.key ? 'bg-amber text-ink font-medium' : 'text-muted hover:text-fg'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card>
          {isLoading || !data ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : data.items.length === 0 ? (
            <Empty text="E'lon topilmadi" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">E'lon</th>
                    <th className="px-5 py-3 font-medium">Holat</th>
                    <th className="px-5 py-3 font-medium">Narx</th>
                    <th className="px-5 py-3 font-medium">Sotuvchi</th>
                    <th className="px-5 py-3 font-medium">Sana</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((l: Listing) => (
                    <tr key={l._id} className="border-b border-line/60 last:border-0 hover:bg-panel2/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium">{l.title}</div>
                        <div className="text-xs text-muted">{l.partTypeId?.name}</div>
                        {l.oemNumbers?.length > 0 && (
                          <div className="mt-0.5 font-mono text-[11px] text-amber/80">OEM: {l.oemNumbers.join(', ')}</div>
                        )}
                      </td>
                      <td className="px-5 py-3"><Badge tone="neutral">{CONDITION_LABELS[l.condition] || l.condition}</Badge></td>
                      <td className="px-5 py-3 font-mono tabular whitespace-nowrap">{formatPrice(l.price.amount, l.price.currency)}</td>
                      <td className="px-5 py-3">
                        <div className="text-xs">{l.sellerId?.name || '—'}</div>
                        <div className="font-mono text-[11px] text-muted">{l.sellerId?.phone}</div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-muted">{formatDate(l.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge tone={STATUS_TONE[l.status] || 'neutral'}>{STATUS_LABELS[l.status]}</Badge>
                          {l.status === 'pending' && (
                            <PendingCountdown scheduledActivateAt={(l as any).scheduledActivateAt} />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          {l.status !== 'rejected' && (
                            <Button variant="danger" size="sm" onClick={() => setRejectId(l._id)}>
                              <X size={15} /> Rad etish
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
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

      {/* Rad etish sababi */}
      <Modal open={!!rejectId} onClose={() => setRejectId(null)} title="E'lonni rad etish">
        <Label>Sabab (ixtiyoriy)</Label>
        <Textarea
          autoFocus
          placeholder="Masalan: rasm sifatsiz, ma'lumot to'liq emas..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRejectId(null)}>Bekor</Button>
          <Button variant="danger" disabled={moderate.isPending}
            onClick={() => rejectId && moderate.mutate({ id: rejectId, reason })}>
            {moderate.isPending && <Spinner className="h-3.5 w-3.5" />} Rad etish
          </Button>
        </div>
      </Modal>
    </>
  );
}
