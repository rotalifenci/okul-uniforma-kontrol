'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { School, Eye, EyeOff, Lock, User as UserIcon, QrCode, ShieldCheck, ArrowRight, Loader2, MapPin, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { QrLoginModal } from '@/components/qr-modal';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Lütfen kullanıcı adı ve şifrenizi giriniz.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          remember_me: rememberMe,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setUser(data.data.user);
        toast.success(`Hoş geldiniz, ${data.data.user.name}`);
        if (data.data.user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/teacher');
        }
      } else {
        toast.error(data.message || 'Kullanıcı adı veya şifre hatalı.');
      }
    } catch (error) {
      toast.error('Bağlantı hatası oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (user: 'admin' | 'teacher') => {
    if (user === 'admin') {
      setUsername('idaremai');
      setPassword('767943');
    } else {
      setUsername('sivasmai');
      setPassword('767943');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 via-slate-100 to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 relative">
      {/* Top Bar with theme toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-300">
        {/* School Logo & Title */}
        <div className="text-center space-y-3 px-2">
          <div className="mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white dark:bg-slate-900 border border-border/80 p-1.5 shadow-xl shadow-blue-500/10 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Sivas Mehmet Akif İnan Ortaokulu Logosu"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-foreground leading-snug">
              Sivas Mehmet Akif İnan Ortaokulu
            </h1>
            <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
              Okul Üniforma & Kılık-Kıyafet Takip Sistemi
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-xl backdrop-blur-sm bg-card/95 rounded-2xl sm:rounded-3xl">
          <CardHeader className="pb-3 pt-5 text-center">
            <CardTitle className="text-lg sm:text-xl font-bold">Sisteme Giriş Yapın</CardTitle>
            <CardDescription className="text-xs">
              Nöbetçi öğretmen veya yönetici hesabınızla giriş yapınız.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                  Kullanıcı Adı
                </label>
                <Input
                  type="text"
                  placeholder="Kullanıcı adınızı girin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-blue-600" />
                  Şifre
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Şifrenizi girin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="h-11 text-base pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Beni Hatırla</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md transition-all rounded-xl"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Giriş Yapılıyor...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Giriş Yap <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Fast Demo Fill Buttons */}
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center">
                Hızlı Demo Girişi (Geliştirme)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('teacher')}
                  className="text-xs h-9 font-medium border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300"
                >
                  👨‍🏫 Nöbetçi Öğretmen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('admin')}
                  className="text-xs h-9 font-medium border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300"
                >
                  👔 Yönetici (Admin)
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0 pb-4 border-t border-border/60">
            <div className="flex items-center justify-center w-full gap-2 text-[11px] text-muted-foreground mt-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>KVKK & Eşzamanlı Çoklu Nöbetçi Desteği</span>
            </div>
          </CardFooter>
        </Card>

        {/* Dynamic QR Login Dialog */}
        <QrLoginModal open={showQrModal} onOpenChange={setShowQrModal} />
      </div>
    </div>
  );
}
