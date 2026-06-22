'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Spinner } from './ui/spinner';
import { Modal } from './modal';
import { Empty } from './empty';
import { useToast } from './toast';
import { FormFields, getPath, type Field } from './form-fields';
import type { Column } from './resource-manager';

interface Props<T> {
  parentId: string;
  parentKey: string; // create paytida qo'shiladigan maydon (brandId/modelId/generationId)
  resource: string;
  queryKey: string;
  fetcher: (parentId: string) => Promise<T[]>;
  columns: Column<T>[];
  fields: Field[];
  makeEmpty: () => Record<string, unknown>;
  singular: string;
}

export function CascadeCrud<T extends { _id: string }>({
  parentId, parentKey, resource, queryKey, fetcher, columns, fields, makeEmpty, singular,
}: Props<T>) {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(makeEmpty());

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, parentId],
    queryFn: () => fetcher(parentId),
    enabled: !!parentId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey, parentId] });

  const save = useMutation({
    mutationFn: () =>
      editId
        ? api.update(resource, editId, form)
        : api.create(resource, { ...form, [parentKey]: parentId }),
    onSuccess: () => { invalidate(); toast.show(editId ? 'Yangilandi' : "Qo'shildi", 'success'); setOpen(false); },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.remove(resource, id),
    onSuccess: () => { invalidate(); toast.show("O'chirildi", 'success'); },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  const openCreate = () => { setEditId(null); setForm(makeEmpty()); setOpen(true); };
  const openEdit = (row: T) => { setEditId(row._id); setForm(structuredClone(row) as Record<string, unknown>); setOpen(true); };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{data ? `${data.length} ta` : ' '}</p>
        <Button size="sm" onClick={openCreate}><Plus size={16} /> Yangi {singular.toLowerCase()}</Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !data || data.length === 0 ? (
          <Empty text={`${singular} yo'q — qo'shing`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  {columns.map((c, i) => <th key={i} className="px-5 py-3 font-medium">{c.header}</th>)}
                  <th className="px-5 py-3 text-right font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row._id} className="border-b border-line/60 last:border-0 hover:bg-panel2/50 transition-colors">
                    {columns.map((c, i) => (
                      <td key={i} className="px-5 py-3">
                        {c.render ? c.render(row) : String(getPath(row, c.accessor || '') ?? '—')}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil size={15} /></Button>
                        <Button variant="ghost" size="icon" className="hover:text-danger"
                          onClick={() => window.confirm(`${singular} o'chirilsinmi?`) && del.mutate(row._id)}>
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

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? `${singular}ni tahrirlash` : `Yangi ${singular.toLowerCase()}`}>
        <div className="space-y-4">
          <FormFields fields={fields} form={form} setForm={setForm} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Bekor</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Spinner className="h-3.5 w-3.5" />} Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
