'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldCheck, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Empty } from '@/components/empty';
import { useToast } from '@/components/toast';
import { ROLE_LABELS, formatDate } from '@/lib/utils';
import type { User } from '@/lib/types';

const ROLES = ['buyer', 'seller', 'admin', 'superadmin'];

export default function UsersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, role, page],
    queryFn: () => api.users({ ...(q ? { q } : {}), ...(role ? { role } : {}), page, limit: 15 }),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ role: string; verified: boolean; blocked: boolean }> }) =>
      api.updateUser(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.show('Yangilandi', 'success');
    },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  return (
    <>
      <Topbar title="Foydalanuvchilar" />
      <main className="p-6">
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder="Telefon bo'yicha qidirish..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">Barcha rollar</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </div>

        <Card>
          {isLoading || !data ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : data.items.length === 0 ? (
            <Empty text="Foydalanuvchi topilmadi" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Telefon</th>
                    <th className="px-5 py-3 font-medium">Ism / Do'kon</th>
                    <th className="px-5 py-3 font-medium">Rol</th>
                    <th className="px-5 py-3 font-medium">Holat</th>
                    <th className="px-5 py-3 font-medium">Ro'yxatdan</th>
                    <th className="px-5 py-3 text-right font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u: User) => (
                    <tr key={u._id} className="border-b border-line/60 last:border-0 hover:bg-panel2/50 transition-colors">
                      <td className="px-5 py-3 font-mono">{u.phone}</td>
                      <td className="px-5 py-3">
                        <div>{u.name || '—'}</div>
                        {u.sellerProfile?.shopName && <div className="text-xs text-muted">{u.sellerProfile.shopName}</div>}
                      </td>
                      <td className="px-5 py-3">
                        <Select
                          className="h-8 text-xs"
                          value={u.role}
                          onChange={(e) => update.mutate({ id: u._id, body: { role: e.target.value } })}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </Select>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          {u.sellerProfile?.verified && <Badge tone="success">Tasdiqlangan</Badge>}
                          {u.blocked && <Badge tone="danger">Bloklangan</Badge>}
                          {!u.sellerProfile?.verified && !u.blocked && <span className="text-xs text-muted">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-muted">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" title="Tasdiqlash"
                            className={u.sellerProfile?.verified ? 'text-success' : ''}
                            onClick={() => update.mutate({ id: u._id, body: { verified: !u.sellerProfile?.verified } })}
                          >
                            <ShieldCheck size={16} />
                          </Button>
                          <Button
                            variant="ghost" size="icon" title="Bloklash"
                            className={u.blocked ? 'text-danger' : 'hover:text-danger'}
                            onClick={() => update.mutate({ id: u._id, body: { blocked: !u.blocked } })}
                          >
                            <Ban size={16} />
                          </Button>
                        </div>
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
    </>
  );
}
