'use client';
import { useQuery } from '@tanstack/react-query';
import { Users, Store, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { StatCard } from '@/components/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge, STATUS_TONE } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { STATUS_LABELS } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: api.analytics });

  return (
    <>
      <Topbar title="Boshqaruv paneli" />
      <main className="p-6">
        {isLoading || !data ? (
          <div className="flex justify-center py-24"><Spinner className="h-6 w-6" /></div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Foydalanuvchilar" value={data.users.total} icon={Users} />
              <StatCard label="Sotuvchilar" value={data.users.sellers} icon={Store} />
              <StatCard label="Faol e'lonlar" value={data.listings.byStatus.active || 0} icon={CheckCircle2} accent />
              <StatCard label="Kutilayotgan" value={data.listings.byStatus.pending || 0} icon={Clock} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>E'lonlar holati bo'yicha</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(data.listings.byStatus).length === 0 && (
                    <p className="text-sm text-muted">Hozircha e'lon yo'q</p>
                  )}
                  {Object.entries(data.listings.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge tone={STATUS_TONE[status] || 'neutral'}>{STATUS_LABELS[status] || status}</Badge>
                      <span className="font-mono text-sm tabular text-fg">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Top kategoriyalar (faol)</CardTitle></CardHeader>
                <CardContent>
                  {data.topCategories.length === 0 ? (
                    <p className="text-sm text-muted">Ma'lumot yo'q</p>
                  ) : (
                    <div className="space-y-2.5">
                      {data.topCategories.map((c) => (
                        <div key={c.slug} className="flex items-center justify-between text-sm">
                          <span>{c.category?.ru || c.slug}</span>
                          <span className="font-mono tabular text-muted">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
