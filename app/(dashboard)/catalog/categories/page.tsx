'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Eye, EyeOff, Layers, FolderOpen,
} from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { Topbar } from '@/components/topbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/toast';
import type { PartCategory } from '@/lib/types';

// ── helpers ──────────────────────────────────────────────────────────
function parentId(cat: PartCategory): string | null {
  if (!cat.parentId) return null;
  if (typeof cat.parentId === 'string') return cat.parentId;
  return cat.parentId._id;
}

type FormState = {
  'name.ru': string;
  'name.uz': string;
  icon: string;
  order: number;
  level: 1 | 2;
  parentId: string;
  hidden: boolean;
};

const EMPTY_FORM: FormState = {
  'name.ru': '',
  'name.uz': '',
  icon: 'package',
  order: 100,
  level: 1,
  parentId: '',
  hidden: false,
};

// ── Category form modal ───────────────────────────────────────────────
function CategoryModal({
  open, onClose, editData, level1List,
}: {
  open: boolean;
  onClose: () => void;
  editData: PartCategory | null;
  level1List: PartCategory[];
}) {
  const qc = useQueryClient();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(() => {
    if (editData) {
      return {
        'name.ru': editData.name.ru,
        'name.uz': editData.name.uz || '',
        icon: editData.icon,
        order: editData.order,
        level: editData.level,
        parentId: parentId(editData) || '',
        hidden: !!editData.hidden,
      };
    }
    return { ...EMPTY_FORM };
  });

  // sync when editData changes
  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        name: { ru: form['name.ru'], uz: form['name.uz'] },
        icon: form.icon,
        order: form.order,
        level: form.level,
        hidden: form.hidden,
        parentId: form.level === 2 && form.parentId ? form.parentId : null,
      };
      if (editData) return api.update('categories', editData._id, body);
      return api.create('categories', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.show(editData ? 'Yangilandi' : "Qo'shildi", 'success');
      onClose();
    },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editData ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
    >
      <div className="space-y-4">
        {/* Level selector */}
        <div>
          <Label>Daraja</Label>
          <Select
            className="w-full"
            value={String(form.level)}
            onChange={(e) => {
              const lv = Number(e.target.value) as 1 | 2;
              setField('level', lv);
              if (lv === 1) setField('parentId', '');
            }}
          >
            <option value="1">Level 1 — Bosh kategoriya</option>
            <option value="2">Level 2 — Pastki kategoriya</option>
          </Select>
        </div>

        {/* Parent selector (only for level 2) */}
        {form.level === 2 && (
          <div>
            <Label>Ota-kategoriya *</Label>
            <Select
              className="w-full"
              value={form.parentId}
              onChange={(e) => setField('parentId', e.target.value)}
            >
              <option value="">— tanlang —</option>
              {level1List.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name.ru}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Name RU */}
        <div>
          <Label>Nomi (ruscha) *</Label>
          <Input
            placeholder="Кузовная часть"
            value={form['name.ru']}
            onChange={(e) => setField('name.ru', e.target.value)}
          />
        </div>

        {/* Name UZ */}
        <div>
          <Label>Nomi (o'zbekcha)</Label>
          <Input
            placeholder="Kuzov qismi"
            value={form['name.uz']}
            onChange={(e) => setField('name.uz', e.target.value)}
          />
        </div>

        {/* Icon + Order row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Ikona</Label>
            <Input
              placeholder="car"
              value={form.icon}
              onChange={(e) => setField('icon', e.target.value)}
            />
          </div>
          <div>
            <Label>Tartib raqami</Label>
            <Input
              type="number"
              value={form.order}
              onChange={(e) => setField('order', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Hidden toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.hidden}
            onChange={(e) => setField('hidden', e.target.checked)}
            className="h-4 w-4 accent-amber"
          />
          <span className="text-sm">Yashirin (ilovada ko'rsatilmaydi)</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Bekor</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Spinner className="h-3.5 w-3.5" />} Saqlash
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Level 2 sub-row ───────────────────────────────────────────────────
function SubRow({
  cat, onEdit, onDelete, onToggle,
}: {
  cat: PartCategory;
  onEdit: (c: PartCategory) => void;
  onDelete: (c: PartCategory) => void;
  onToggle: (c: PartCategory) => void;
}) {
  return (
    <tr className="border-b border-line/40 last:border-0 hover:bg-panel2/40 transition-colors">
      <td className="py-2.5 pl-12 pr-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">└</span>
          <span className={`font-medium ${cat.hidden ? 'opacity-40 line-through' : ''}`}>{cat.name.ru}</span>
          {cat.name.uz && (
            <span className="text-xs text-muted">/ {cat.name.uz}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <code className="text-xs text-muted bg-panel2 px-1.5 py-0.5 rounded">{cat.slug}</code>
      </td>
      <td className="px-4 py-2.5">
        <Badge tone="neutral" className="text-xs">L2</Badge>
      </td>
      <td className="px-4 py-2.5 tabular-nums text-sm text-muted">{cat.order}</td>
      <td className="px-4 py-2.5">
        <Button
          variant="ghost" size="icon"
          title={cat.hidden ? "Ko'rsatish" : "Yashirish"}
          onClick={() => onToggle(cat)}
        >
          {cat.hidden
            ? <EyeOff size={14} className="text-muted" />
            : <Eye size={14} className="text-green-500" />}
        </Button>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(cat)} title="Tahrirlash">
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost" size="icon" title="O'chirish"
            className="hover:text-danger"
            onClick={() => window.confirm(`"${cat.name.ru}" o'chirilsinmi?`) && onDelete(cat)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ── Level 1 row ───────────────────────────────────────────────────────
function Level1Row({
  cat, children, onEdit, onDelete, onToggle,
}: {
  cat: PartCategory;
  children: PartCategory[];
  onEdit: (c: PartCategory) => void;
  onDelete: (c: PartCategory) => void;
  onToggle: (c: PartCategory) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <tr className="border-b border-line/60 hover:bg-panel2/50 transition-colors">
        <td className="px-5 py-3">
          <button
            className="flex items-center gap-2 text-left w-full"
            onClick={() => setOpen((v) => !v)}
          >
            {children.length > 0
              ? open
                ? <ChevronDown size={15} className="text-muted flex-shrink-0" />
                : <ChevronRight size={15} className="text-muted flex-shrink-0" />
              : <span className="w-[15px]" />
            }
            <span className={`font-semibold text-sm ${cat.hidden ? 'opacity-40 line-through' : ''}`}>{cat.name.ru}</span>
            {cat.name.uz && (
              <span className="text-xs text-muted">/ {cat.name.uz}</span>
            )}
            {children.length > 0 && (
              <span className="ml-1 text-xs text-muted bg-panel2 px-1.5 rounded-full">
                {children.length}
              </span>
            )}
          </button>
        </td>
        <td className="px-4 py-3">
          <code className="text-xs text-muted bg-panel2 px-1.5 py-0.5 rounded">{cat.slug}</code>
        </td>
        <td className="px-4 py-3">
          <Badge tone="amber" className="text-xs">L1</Badge>
        </td>
        <td className="px-4 py-3 tabular-nums text-sm text-muted">{cat.order}</td>
        <td className="px-4 py-3">
          <Button
            variant="ghost" size="icon"
            title={cat.hidden ? "Ko'rsatish" : "Yashirish"}
            onClick={() => onToggle(cat)}
          >
            {cat.hidden
              ? <EyeOff size={14} className="text-muted" />
              : <Eye size={14} className="text-green-500" />}
          </Button>
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(cat)} title="Tahrirlash">
              <Pencil size={15} />
            </Button>
            <Button
              variant="ghost" size="icon" title="O'chirish"
              className="hover:text-danger"
              onClick={() => window.confirm(`"${cat.name.ru}" va uning barcha pastki kategoriyalari o'chirilsinmi?`) && onDelete(cat)}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </td>
      </tr>

      {/* Level 2 children */}
      {open && children.map((child) => (
        <SubRow key={child._id} cat={child} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />
      ))}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<PartCategory | null>(null);
  const [defaultLevel, setDefaultLevel] = useState<1 | 2>(1);

  const { data: all, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.adminCategories(),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.remove('categories', id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.show("O'chirildi", 'success');
    },
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  const toggle = useMutation({
    mutationFn: (cat: PartCategory) => api.update('categories', cat._id, { hidden: !cat.hidden }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
    onError: (e) => toast.show(errMessage(e), 'error'),
  });

  const level1 = (all ?? []).filter((c) => c.level === 1).sort((a, b) => a.order - b.order);
  const level2 = (all ?? []).filter((c) => c.level === 2);

  const childrenOf = (id: string) =>
    level2.filter((c) => parentId(c) === id).sort((a, b) => a.order - b.order);

  const openCreate = (lv: 1 | 2) => {
    setEditData(null);
    setDefaultLevel(lv);
    setModalOpen(true);
  };

  const openEdit = (cat: PartCategory) => {
    setEditData(cat);
    setModalOpen(true);
  };

  return (
    <>
      <Topbar title="Kategoriyalar" />
      <main className="p-6">

        {/* Header actions */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-muted">
            {all
              ? `${level1.length} ta bosh + ${level2.length} ta pastki kategoriya`
              : ' '}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openCreate(2)}>
              <FolderOpen size={15} /> Pastki kategoriya
            </Button>
            <Button size="sm" onClick={() => openCreate(1)}>
              <Layers size={15} /> Bosh kategoriya
            </Button>
          </div>
        </div>

        <Card>
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : !all || all.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted">
              <Layers size={32} className="opacity-30" />
              <p className="text-sm">Hozircha kategoriya yo'q</p>
              <Button size="sm" onClick={() => openCreate(1)}>
                <Plus size={15} /> Birinchi kategoriyani yarating
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Nomi</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Daraja</th>
                    <th className="px-4 py-3 font-medium">Tartib</th>
                    <th className="px-4 py-3 font-medium">Ko'rinish</th>
                    <th className="px-4 py-3 text-right font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {level1.map((cat) => (
                    <Level1Row
                      key={cat._id}
                      cat={cat}
                      children={childrenOf(cat._id)}
                      onEdit={openEdit}
                      onDelete={(c) => del.mutate(c._id)}
                      onToggle={(c) => toggle.mutate(c)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Orphan level 2 categories (parentId not found) */}
        {(() => {
          const orphans = level2.filter((c) => {
            const pid = parentId(c);
            return !pid || !level1.find((p) => p._id === pid);
          });
          if (!orphans.length) return null;
          return (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Ota-kategoriyasiz ({orphans.length})
              </p>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {orphans.map((cat) => (
                        <SubRow
                          key={cat._id}
                          cat={cat}
                          onEdit={openEdit}
                          onDelete={(c) => del.mutate(c._id)}
                          onToggle={(c) => toggle.mutate(c)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          );
        })()}
      </main>

      {/* Form modal */}
      {modalOpen && (
        <CategoryModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editData={editData}
          level1List={level1}
        />
      )}
    </>
  );
}
