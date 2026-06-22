import { PackageOpen } from 'lucide-react';

export function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <PackageOpen size={32} strokeWidth={1.5} />
      <p className="text-sm">{text}</p>
    </div>
  );
}
