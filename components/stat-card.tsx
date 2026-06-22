import type { LucideIcon } from 'lucide-react';
import { Card } from './ui/card';

export function StatCard({
  label, value, icon: Icon, accent,
}: { label: string; value: string | number; icon: LucideIcon; accent?: boolean }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular tracking-tight">{value}</p>
        </div>
        <span className={`rounded-md p-2 ${accent ? 'bg-amber/15 text-amber' : 'bg-panel2 text-muted'}`}>
          <Icon size={20} />
        </span>
      </div>
    </Card>
  );
}
