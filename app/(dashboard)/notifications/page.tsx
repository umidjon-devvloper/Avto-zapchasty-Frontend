'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bell, Send, Users, CheckCircle2, AlertCircle, Megaphone } from 'lucide-react';
import { api, errMessage } from '@/lib/api';

const ROLES = [
  { value: 'all', label: "Barcha foydalanuvchilar" },
  { value: 'seller', label: 'Faqat sotuvchilar' },
  { value: 'buyer', label: 'Faqat xaridorlar' },
];

const TEMPLATES = [
  {
    label: "🎉 Yangi xususiyat",
    title: "Yangilik bor!",
    body: "Ilovamizda yangi imkoniyatlar paydo bo'ldi. Tekshirib ko'ring!",
  },
  {
    label: "🔧 Texnik xizmat",
    title: "Texnik xizmat haqida",
    body: "Bugun soat 02:00–04:00 orasida texnik xizmat olib boriladi.",
  },
  {
    label: "📦 Aksiya",
    title: "Maxsus taklif!",
    body: "Hozir e'lon bering va do'stlaringizga ulashing — eng yaxshi narxlar siz uchun!",
  },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [role, setRole] = useState('all');
  const [lastResult, setLastResult] = useState<{ sent: number; registeredUsers: number; guestDevices: number } | null>(null);

  const send = useMutation({
    mutationFn: () => api.broadcastNotification({ title: title.trim(), body: body.trim(), role }),
    onSuccess: (data) => {
      setLastResult(data);
      setTitle('');
      setBody('');
    },
  });

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !send.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10 text-amber">
          <Megaphone size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-fg">Push Bildirishnomalar</h1>
          <p className="text-sm text-muted">Foydalanuvchilarga push xabar yuborish</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-line bg-panel p-6 space-y-5">

            {/* Auditoriya */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Kimga yuborish
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold border transition-colors ${
                      role === r.value
                        ? 'bg-amber text-ink border-amber'
                        : 'border-line text-muted hover:text-fg hover:bg-panel2'
                    }`}
                  >
                    <Users size={14} />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sarlavha */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Sarlavha <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Bildirishnoma sarlavhasi..."
                className="w-full rounded-lg border border-line bg-panel2 px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-amber transition-colors"
              />
              <div className="mt-1 text-right text-[11px] text-muted">{title.length}/100</div>
            </div>

            {/* Matn */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Xabar matni <span className="text-red-400">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={200}
                rows={4}
                placeholder="Foydalanuvchilarga yuboriladigan xabar..."
                className="w-full rounded-lg border border-line bg-panel2 px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-amber transition-colors resize-none"
              />
              <div className="mt-1 text-right text-[11px] text-muted">{body.length}/200</div>
            </div>

            {/* Xato */}
            {send.isError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <AlertCircle size={16} />
                {errMessage(send.error)}
              </div>
            )}

            {/* Muvaffaqiyat */}
            {lastResult && !send.isPending && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
                <CheckCircle2 size={16} />
                <span>
                  Muvaffaqiyatli yuborildi — jami <strong>{lastResult.sent}</strong> qurilmaga
                  {' '}(<strong>{lastResult.registeredUsers}</strong> ro'yxatdan o'tgan
                  {lastResult.guestDevices > 0 && (
                    <> , <strong>{lastResult.guestDevices}</strong> mehmon</>
                  )})
                </span>
              </div>
            )}

            {/* Yuborish tugmasi */}
            <button
              onClick={() => send.mutate()}
              disabled={!canSend}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-6 py-3 text-sm font-bold text-ink transition-opacity disabled:opacity-40 hover:opacity-90"
            >
              {send.isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                  Yuborilmoqda...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Yuborish
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar: preview + templates */}
        <div className="space-y-4">
          {/* Phone preview */}
          <div className="rounded-xl border border-line bg-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Ko'rinish</p>
            <div className="rounded-2xl bg-[#1c1c1e] p-3">
              <div className="rounded-xl bg-[#2c2c2e] px-3 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md bg-amber/20 flex items-center justify-center">
                    <Bell size={10} className="text-amber" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                    AvtoEhtiyot
                  </span>
                  <span className="ml-auto text-[10px] text-white/30">hozir</span>
                </div>
                <p className="text-[13px] font-bold text-white leading-tight">
                  {title || 'Sarlavha...'}
                </p>
                <p className="text-[12px] text-white/70 leading-snug line-clamp-3">
                  {body || 'Xabar matni...'}
                </p>
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="rounded-xl border border-line bg-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              Tayyor shablonlar
            </p>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => { setTitle(t.title); setBody(t.body); }}
                  className="w-full text-left rounded-lg border border-line bg-panel2 px-3 py-2.5 hover:border-amber/40 hover:bg-amber/5 transition-colors"
                >
                  <p className="text-sm font-semibold text-fg">{t.label}</p>
                  <p className="text-xs text-muted mt-0.5 line-clamp-1">{t.body}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl border border-line bg-panel p-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Eslatma</p>
            <p className="text-xs text-muted leading-relaxed">
              Faqat ilovada push ruxsat bergan foydalanuvchilarga yetib boradi.
              Bloklangan foydalanuvchilar ro'yxatdan chiqariladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
