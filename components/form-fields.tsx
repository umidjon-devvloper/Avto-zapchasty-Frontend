'use client';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

export type Field = {
  key: string; // dot-path: "name" yoki "name.ru"
  label: string;
  type: 'text' | 'number' | 'boolean' | 'tags' | 'select' | 'textarea';
  placeholder?: string;
  options?: { value: string; label: string }[];
};

export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);
}

export function setPath(obj: Record<string, unknown>, path: string, val: unknown): Record<string, unknown> {
  const keys = path.split('.');
  const clone = structuredClone(obj);
  let cur = clone as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) cur[keys[i]] = {};
    cur = cur[keys[i]] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = val;
  return clone;
}

export function FormFields({
  fields, form, setForm,
}: {
  fields: Field[];
  form: Record<string, unknown>;
  setForm: (f: Record<string, unknown>) => void;
}) {
  return (
    <>
      {fields.map((f) => {
        const val = getPath(form, f.key);

        if (f.type === 'boolean') {
          return (
            <label key={f.key} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!val}
                onChange={(e) => setForm(setPath(form, f.key, e.target.checked))}
                className="h-4 w-4 accent-amber"
              />
              <span className="text-sm">{f.label}</span>
            </label>
          );
        }

        if (f.type === 'tags') {
          const arr = Array.isArray(val) ? (val as string[]) : [];
          return (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <Input
                placeholder={f.placeholder || 'vergul bilan ajrating'}
                value={arr.join(', ')}
                onChange={(e) =>
                  setForm(setPath(form, f.key, e.target.value.split(',').map((x) => x.trim()).filter(Boolean)))
                }
              />
            </div>
          );
        }

        if (f.type === 'select') {
          return (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <Select
                className="w-full"
                value={val === undefined || val === null ? '' : String(val)}
                onChange={(e) => setForm(setPath(form, f.key, e.target.value))}
              >
                <option value="">— tanlang —</option>
                {(f.options || []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
          );
        }

        if (f.type === 'textarea') {
          return (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <Textarea
                placeholder={f.placeholder}
                value={val === undefined || val === null ? '' : String(val)}
                onChange={(e) => setForm(setPath(form, f.key, e.target.value))}
              />
            </div>
          );
        }

        return (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <Input
              type={f.type}
              placeholder={f.placeholder}
              value={val === undefined || val === null ? '' : String(val)}
              onChange={(e) =>
                setForm(setPath(form, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value))
              }
            />
          </div>
        );
      })}
    </>
  );
}
