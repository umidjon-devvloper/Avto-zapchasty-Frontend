'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Ban, Check, ShieldX } from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Empty } from '@/components/empty';
import { useToast } from '@/components/toast';
import { formatDate } from '@/lib/utils';
import type { AdminReport } from '@/lib/types';

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam / reklama', fraud: 'Firibgarlik', prohibited: 'Taqiqlangan mahsulot',
  wrong_category: "Noto'g'ri kategoriya", duplicate: 'Takroriy e\'lon', offensive: 'Haqoratli kontent', other: 'Boshqa',
};
const STATUS_LABELS: Record<string, string> = {
  open: 'Yangi', reviewing: "Ko'rilmoqda", resolved: 'Hal qilindi', dismissed: 'Rad etildi',
};
const TABS: { key: string; label: string }[] = [
  { key: 'open', label: 'Yangi' },
  { key: 'resolved', label: 'Hal qilingan' },
  { key: 'dismissed', label: 'Rad etilgan' },
  { key: '', label: 'Barchasi' },
];

export default function ReportsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', status, page],
    queryFn: () => api.adminReports({ ...(status ? { status } : {}), page, limit: 20 }),
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'dismiss' | 'resolve' | 'reject_listing' }) =>
      api.resolveReport(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.show('Bajarildi', 'success');
    },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  const statusTone = (s: string): 'amber' | 'success' | 'danger' | 'neutral' =>
    s === 'open' ? 'amber' : s === 'resolved' ? 'success' : s === 'dismissed' ? 'danger' : 'neutral';

  return (
    <>
      <Topbar title="Shikoyatlar" />
      <main className="p-6">
        <div className="mb-5 inline-flex rounded-md border border-line bg-panel p-1">
          {TABS.map((t) => (
            <button
              key={t.key || 'all'}
              onClick={() => { setStatus(t.key); setPage(1); }}
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
            <Empty text="Shikoyat yo'q" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">E'lon</th>
                    <th className="px-5 py-3 font-medium">Sabab</th>
                    <th className="px-5 py-3 font-medium">Izoh</th>
                    <th className="px-5 py-3 font-medium">Shikoyatchi</th>
                    <th className="px-5 py-3 font-medium">Sana</th>
                    <th className="px-5 py-3 text-right font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r: AdminReport) => (
                    <tr key={r._id} className="border-b border-line/60 last:border-0 align-top hover:bg-panel2/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium">{r.listingId?.title || '— o\'chirilgan —'}</div>
                        {r.listingId && <Badge tone="neutral">{r.listingId.status}</Badge>}
                      </td>
                      <td className="px-5 py-3">{REASON_LABELS[r.reason] || r.reason}</td>
                      <td className="px-5 py-3 max-w-[220px] text-muted">{r.comment || '—'}</td>
                      <td className="px-5 py-3">
                        <div>{r.reporterId?.name || '—'}</div>
                        <div className="font-mono text-xs text-muted">{r.reporterId?.phone}</div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-muted">{formatDate(r.createdAt)}</td>
                      <td className="px-5 py-3">
                        {r.status === 'open' ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <Button size="sm" variant="outline" className="text-danger border-danger/40 hover:bg-danger/10"
                              disabled={act.isPending || !r.listingId}
                              onClick={() => window.confirm("E'lon rad etilsinmi?") && act.mutate({ id: r._id, action: 'reject_listing' })}>
                              <ShieldX size={14} /> E'lonni rad etish
                            </Button>
                            <div className="flex gap-1.5">
                              <Button size="sm" variant="ghost" disabled={act.isPending}
                                onClick={() => act.mutate({ id: r._id, action: 'resolve' })}>
                                <Check size={14} /> Hal qilindi
                              </Button>
                              <Button size="sm" variant="ghost" disabled={act.isPending}
                                onClick={() => act.mutate({ id: r._id, action: 'dismiss' })}>
                                <Ban size={14} /> Bekor
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <Badge tone={statusTone(r.status)}>{STATUS_LABELS[r.status] || r.status}</Badge>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {data && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted">{data.total} ta shikoyat</span>
            {data.pages > 1 && (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={16} />
                </Button>
                <span className="font-mono text-sm tabular text-muted">{page} / {data.pages}</span>
                <Button variant="outline" size="icon" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
