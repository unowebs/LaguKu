'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use NextAuth signIn
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Email atau password salah');
      } else {
        toast.success('Berhasil masuk!');
        router.push('/dashboard');
      }
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
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--music-accent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: '#8b5cf6' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Music size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">LaguKu</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold" style={{ color: 'var(--music-text)' }}>
            Selamat datang kembali
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--music-muted)' }}>
            Masuk untuk melanjutkan membuat lagu
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8"
          style={{ background: 'var(--music-surface)', borderColor: 'var(--music-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: 'var(--music-text)' }}>
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--music-muted)' }} />
                 <input
                  id="login-email"
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: 'var(--music-text)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--music-muted)' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field !pl-10 !pr-10"
                  autoComplete="current-password"
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Memproses...</>
              ) : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: 'var(--music-muted)' }}>
            Belum punya akun?{' '}
            <Link href="/auth/register"
              className="font-medium hover:underline"
              style={{ color: 'var(--music-accent)' }}>
              Daftar gratis
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
