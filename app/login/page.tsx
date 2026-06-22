'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, ArrowRight } from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/toast';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    setBusy(true);
    try {
      const r = await api.sendOtp(phone);
      setStep('code');
      toast.show(r.devCode ? `DEV kod: ${r.devCode}` : 'Kod yuborildi', 'info');
    } catch (e) {
      toast.show(errMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      const r = await api.verifyOtp(phone, code);
      if (r.user.role !== 'admin' && r.user.role !== 'superadmin') {
        toast.show("Sizda admin huquqi yo'q", 'error');
        return;
      }
      auth.setSession(r.accessToken, r.refreshToken, r.user);
      router.replace('/');
    } catch (e) {
      toast.show(errMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-amber text-ink">
            <Wrench size={26} strokeWidth={2.5} />
          </span>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">AvtoEhtiyot</h1>
            <p className="text-xs uppercase tracking-widest text-muted">Admin panel</p>
          </div>
        </div>

        <div className="rounded-md border border-line bg-panel p-6 shadow-panel">
          {step === 'phone' ? (
            <>
              <Label>Telefon raqami</Label>
              <Input
                autoFocus
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && phone && sendOtp()}
              />
              <Button className="mt-4 w-full" onClick={sendOtp} disabled={busy || !phone}>
                {busy ? <Spinner className="h-4 w-4" /> : <>Kod olish <ArrowRight size={16} /></>}
              </Button>
            </>
          ) : (
            <>
              <Label>Tasdiqlash kodi</Label>
              <Input
                autoFocus
                inputMode="numeric"
                placeholder="6 xonali kod"
                className="font-mono text-center text-lg tracking-[0.4em]"
                value={code}
                maxLength={6}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && verify()}
              />
              <Button className="mt-4 w-full" onClick={verify} disabled={busy || code.length !== 6}>
                {busy ? <Spinner className="h-4 w-4" /> : 'Kirish'}
              </Button>
              <button
                className="mt-3 w-full text-center text-xs text-muted hover:text-fg transition-colors"
                onClick={() => { setStep('phone'); setCode(''); }}
              >
                ← Raqamni o'zgartirish
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted/60">
          Faqat admin huquqiga ega foydalanuvchilar kira oladi
        </p>
      </div>
    </div>
  );
}
