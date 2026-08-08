'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Users, Tag, Layers, MapPin, Wrench,
  Boxes, Repeat, Car, Flag, Bell, FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { section: null, items: [
    { href: '/', label: 'Boshqaruv paneli', icon: LayoutDashboard },
    { href: '/listings', label: "E'lonlar", icon: ClipboardList },
    { href: '/users', label: 'Foydalanuvchilar', icon: Users },
    { href: '/reports', label: 'Shikoyatlar', icon: Flag },
    { href: '/notifications', label: 'Bildirishnomalar', icon: Bell },
    { href: '/import', label: 'Excel import', icon: FileSpreadsheet },
  ]},
  { section: 'Katalog', items: [
    { href: '/catalog/categories', label: 'Kategoriyalar', icon: Layers },
    { href: '/catalog/part-types', label: 'Detal turlari', icon: Boxes },
    { href: '/catalog/synonyms', label: 'Sinonimlar', icon: Repeat },
    { href: '/catalog/brands', label: 'Brendlar', icon: Tag },
    { href: '/catalog/vehicles', label: 'Mashinalar', icon: Car },
    { href: '/catalog/cities', label: 'Shaharlar', icon: MapPin },
  ]},
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 w-60 border-r border-line bg-panel/60 backdrop-blur-sm flex flex-col">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-line">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-amber text-ink">
          <Wrench size={18} strokeWidth={2.5} />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">AvtoEhtiyot</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">Admin</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted/70">
                {group.section}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === '/' ? path === '/' : path.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-amber/10 text-amber font-medium'
                        : 'text-muted hover:text-fg hover:bg-panel2'
                    )}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-line text-[10px] text-muted/60">
        v1.0 · {new Date().getFullYear()}
      </div>
    </aside>
  );
}
