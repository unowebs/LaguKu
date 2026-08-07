'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Pendaftaran gagal');
        return;
      }

      toast.success('Akun berhasil dibuat! Silakan masuk.');
      router.push('/auth/login');
    } catch {
      toast.error('Terjadi kesalahan, coba lagi');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--music-bg)' }}
      suppressHydrationWarning>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--music-accent)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: '#06b6d4' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Music size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">LaguKu</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold" style={{ color: 'var(--music-text)' }}>
            Buat akun gratis
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--music-muted)' }}>
            Mulai membuat dan berbagi lagu not angka
          </p>
        </div>

        <div className="rounded-2xl border p-8"
          style={{ background: 'var(--music-surface)', borderColor: 'var(--music-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--music-text)' }}>
                Nama Lengkap
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--music-muted)' }} />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  required
                  className="input-field !pl-10"
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--music-text)' }}>
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--music-muted)' }} />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="input-field !pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--music-text)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--music-muted)' }} />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  required
                  minLength={6}
                  className="input-field !pl-10 !pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--music-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength */}
              {password && (
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-colors"
                      style={{
                        background: password.length >= i * 4
                          ? i === 1 ? '#ef4444' : i === 2 ? '#f59e0b' : '#10b981'
                          : 'var(--music-border)'
                      }} />
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Mendaftar...</>
              ) : 'Daftar Gratis'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs" style={{ color: 'var(--music-muted)' }}>
            Dengan mendaftar, Anda menyetujui syarat dan ketentuan kami.
          </p>

          <div className="mt-5 text-center text-sm" style={{ color: 'var(--music-muted)' }}>
            Sudah punya akun?{' '}
            <Link href="/auth/login"
              className="font-medium hover:underline"
              style={{ color: 'var(--music-accent)' }}>
              Masuk
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
