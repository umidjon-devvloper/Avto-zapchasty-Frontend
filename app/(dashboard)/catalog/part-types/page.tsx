'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/modal';
import { Empty } from '@/components/empty';
import { useToast } from '@/components/toast';
import type { PartTypeAdmin } from '@/lib/types';

interface Form {
  name: string;
  categoryId: string;
  subcategory: string;
  synonyms: string[];
}
const empty: Form = { name: '', categoryId: '', subcategory: '', synonyms: [] };

export default function PartTypesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.categories });
  const { data, isLoading } = useQuery({
    queryKey: ['admin-parttypes', q, categoryId, page],
    queryFn: () => api.adminPartTypes({ ...(q ? { q } : {}), ...(categoryId ? { categoryId } : {}), page, limit: 20 }),
  });

  const save = useMutation({
    mutationFn: () => (editId ? api.update('part-types', editId, form) : api.create('part-types', form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-parttypes'] });
      toast.show(editId ? 'Yangilandi' : "Qo'shildi", 'success');
      setOpen(false);
    },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.remove('part-types', id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-parttypes'] }); toast.show("O'chirildi", 'success'); },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  const openCreate = () => { setEditId(null); setForm({ ...empty, categoryId: categoryId || '' }); setOpen(true); };
  const openEdit = (r: PartTypeAdmin) => {
    setEditId(r._id);
    setForm({ name: r.name, categoryId: r.categoryId?._id || '', subcategory: r.subcategory || '', synonyms: r.synonyms || [] });
    setOpen(true);
  };

  return (
    <>
      <Topbar title="Detal turlari" />
      <main className="p-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input className="pl-9" placeholder="Detal nomi yoki sinonim..." value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
          <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
            <option value="">Barcha kategoriyalar</option>
            {categories?.map((c) => <option key={c._id} value={c._id}>{c.name.ru}</option>)}
          </Select>
          <div className="ml-auto">
            <Button size="sm" onClick={openCreate}><Plus size={16} /> Yangi detal</Button>
          </div>
        </div>

        <Card>
          {isLoading || !data ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : data.items.length === 0 ? (
            <Empty text="Detal topilmadi" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Nomi</th>
                    <th className="px-5 py-3 font-medium">Kategoriya</th>
                    <th className="px-5 py-3 font-medium">Kichik bo'lim</th>
                    <th className="px-5 py-3 font-medium">Sinonimlar</th>
                    <th className="px-5 py-3 text-right font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r: PartTypeAdmin) => (
                    <tr key={r._id} className="border-b border-line/60 last:border-0 hover:bg-panel2/50 transition-colors">
                      <td className="px-5 py-3 font-medium">{r.name}</td>
                      <td className="px-5 py-3 text-muted">{r.categoryId?.name.ru || '—'}</td>
                      <td className="px-5 py-3 text-muted">{r.subcategory || '—'}</td>
                      <td className="px-5 py-3 text-xs text-muted">{r.synonyms.join(', ') || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil size={15} /></Button>
                          <Button variant="ghost" size="icon" className="hover:text-danger"
                            onClick={() => window.confirm("Detal o'chirilsinmi?") && del.mutate(r._id)}>
                            <Trash2 size={15} />
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

        {data && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted">{data.total} ta detal</span>
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

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Detalni tahrirlash' : 'Yangi detal'}>
        <div className="space-y-4">
          <div>
            <Label>Nomi (ruscha)</Label>
            <Input autoFocus placeholder="Шаровая опора" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Kategoriya</Label>
            <Select className="w-full" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— tanlang —</option>
              {categories?.map((c) => <option key={c._id} value={c._id}>{c.name.ru}</option>)}
            </Select>
          </div>
          <div>
            <Label>Kichik bo'lim (ixtiyoriy)</Label>
            <Input placeholder="Передняя подвеска" value={form.subcategory}
              onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
          </div>
          <div>
            <Label>Sinonimlar (vergul bilan)</Label>
            <Input placeholder="шаровой, шаровая" value={form.synonyms.join(', ')}
              onChange={(e) => setForm({ ...form, synonyms: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Bekor</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name || !form.categoryId}>
              {save.isPending && <Spinner className="h-3.5 w-3.5" />} Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
