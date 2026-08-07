'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Music, Play, Users, Download, Zap, Globe,
  ArrowRight, Star, ChevronRight
} from 'lucide-react';

const features = [
  {
    icon: Music,
    title: 'Editor Not Angka',
    desc: 'Tulis not angka 1–7 dengan oktaf, durasi, dan simbol lengkap seperti buku lagu rohani Indonesia.',
    color: '#6366f1',
  },
  {
    icon: Play,
    title: 'Playback Otomatis',
    desc: 'Dengarkan langsung lagu yang Anda buat dengan 8 pilihan instrumen menggunakan Tone.js.',
    color: '#8b5cf6',
  },
  {
    icon: Users,
    title: 'Kolaborasi Real-time',
    desc: 'Edit bersama teman secara bersamaan seperti Google Docs. Buat room dengan kode unik.',
    color: '#06b6d4',
  },
  {
    icon: Download,
    title: 'Export Lengkap',
    desc: 'Simpan lagu sebagai PDF, PNG, SVG, MusicXML, atau JSON. Siap cetak rapi seperti buku lagu.',
    color: '#10b981',
  },
  {
    icon: Zap,
    title: 'Transpose Otomatis',
    desc: 'Transpose nada dasar dengan satu klik. Semua not berubah otomatis mengikuti kunci baru.',
    color: '#f59e0b',
  },
  {
    icon: Globe,
    title: 'Versi History',
    desc: 'Lacak setiap perubahan seperti Google Docs. Kembalikan versi sebelumnya kapan saja.',
    color: '#ef4444',
  },
];

const instruments = ['🎹 Piano', '🎸 Organ', '🎻 Strings', '🎵 Choir Pad', '🪈 Flute', '🎻 Violin', '🎸 Guitar', '🎼 Music Box'];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--music-bg)' }} suppressHydrationWarning>
      {/* Nav */}
      <nav className="glass sticky top-0 z-50 border-b" style={{ borderColor: 'var(--music-border)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm">L</span>
            <span className="font-bold text-lg gradient-text">LaguKu</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">
              Masuk
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
              Mulai Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--music-accent)' }} />
          <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#8b5cf6' }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium mb-6"
              style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', color: 'var(--music-accent)' }}>
              <Star size={12} />
              Editor Not Angka Indonesia #1
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Buat Lagu dengan{' '}
              <span className="gradient-text">Not Angka</span>{' '}
              Secara Kolaboratif
            </h1>

            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--music-muted)' }}>
              Platform modern untuk menulis, mengedit, dan memainkan lagu not angka Indonesia.
              Kolaborasi real-time, playback otomatis, ekspor ke PDF. Seperti Google Docs untuk musik rohani.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/auth/register" className="btn-primary text-base py-3 px-8">
                Mulai Gratis <ArrowRight size={18} />
              </Link>
              <Link href="/auth/login" className="btn-secondary text-base py-3 px-8">
                <Play size={18} /> Lihat Demo
              </Link>
            </div>

            <p className="mt-4 text-xs" style={{ color: 'var(--music-muted)' }}>
              Gratis selamanya • Tidak perlu kartu kredit • Setup dalam 30 detik
            </p>
          </motion.div>

          {/* Preview image area */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="rounded-2xl overflow-hidden border shadow-2xl"
              style={{ borderColor: 'var(--music-border)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
              {/* Fake editor preview */}
              <div className="h-12 flex items-center px-4 gap-3 border-b" style={{ background: 'var(--music-surface)', borderColor: 'var(--music-border)' }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-xs" style={{ color: 'var(--music-muted)' }}>LaguKu Editor — Pribadi Yang Mengenal Hatiku</div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-[9px] flex items-center justify-center font-bold">A</div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-teal-500 text-white text-[9px] flex items-center justify-center font-bold">B</div>
                </div>
              </div>
              <SampleEditorPreview />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Semua yang Anda Butuhkan
            </h2>
            <p style={{ color: 'var(--music-muted)' }}>
              Dirancang khusus untuk pengguna not angka Indonesia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="song-card"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}20` }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--music-muted)' }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Instruments */}
      <section className="py-16" style={{ background: 'var(--music-surface)' }}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">8 Instrumen Tersedia</h2>
          <p className="mb-8 text-sm" style={{ color: 'var(--music-muted)' }}>Mainkan lagu dengan instrumen pilihan Anda</p>
          <div className="flex flex-wrap justify-center gap-3">
            {instruments.map((inst) => (
              <div key={inst} className="px-4 py-2 rounded-full border text-sm"
                style={{ borderColor: 'var(--music-border)', background: 'var(--music-surface-2)' }}>
                {inst}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siap Membuat Lagu Pertama Anda?
          </h2>
          <p className="mb-8" style={{ color: 'var(--music-muted)' }}>
            Bergabung dengan ribuan musisi dan pemimpin pujian yang telah menggunakan LaguKu
          </p>
          <Link href="/auth/register" className="btn-primary text-base py-3 px-10 inline-flex">
            Mulai Sekarang <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: 'var(--music-border)' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md gradient-bg flex items-center justify-center text-white font-bold text-xs">L</span>
            <span className="font-bold gradient-text">LaguKu</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--music-muted)' }}>
            © 2026 LaguKu. Editor Not Angka Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ——— Sample Editor Preview Component ———
function SampleEditorPreview() {
  const sampleLines = [
    { notes: ['5', '5', '1', '1', '2', '.', '3', '1', '3', '.'], lyric: 'S\'per-ti ru-sa yang ha-us rin-du' },
    { notes: ['0', '0', '0', '0', '2', '6', '2', '3', '.', '4', '3', '2', '2', '.'], lyric: 'ha-ti-ku tak ta-han me-nunggu-Mu' },
  ];

  return (
    <div className="p-8" style={{ background: 'var(--music-surface-2)' }}>
      {/* Fake song header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--music-muted)' }}>
          <span>Do = C</span>
          <span>Lagu: <span style={{ color: 'var(--music-text)' }}>Jacqlien Celosse</span></span>
        </div>
        <h3 className="text-center text-xl font-bold uppercase tracking-wider mb-3" style={{ fontFamily: 'serif', color: 'var(--music-title)' }}>
          PRIBADI YANG MENGENAL HATIKU
        </h3>
        <div className="flex gap-4 text-xs mb-4" style={{ color: 'var(--music-muted)' }}>
          <span>Style: <span style={{ color: 'var(--music-text)' }}>Love Song</span></span>
          <span>Birama: <span style={{ color: 'var(--music-text)' }}>4/4</span></span>
          <span>Tempo: <span style={{ color: 'var(--music-text)' }}>70 BPM</span></span>
        </div>
        <div className="border-b-2 mb-4" style={{ borderColor: 'var(--music-border)' }} />

        {/* Sample note lines */}
        {sampleLines.map((line, i) => (
          <div key={i} className="mb-4">
            <div className="flex flex-wrap gap-2 mb-1">
              {line.notes.map((n, j) => (
                <div key={j} className="flex flex-col items-center">
                  <span className="font-mono font-bold text-sm" style={{ color: n === '.' ? 'var(--music-muted)' : 'var(--music-note)' }}>
                    {n}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: 'var(--music-lyric)' }}>{line.lyric}</p>
          </div>
        ))}

        {/* Fake playback bar */}
        <div className="mt-6 flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--music-border)', background: 'var(--music-surface)' }}>
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <Play size={14} className="text-white ml-0.5" />
          </div>
          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--music-surface-2)' }}>
            <div className="h-full w-1/3 rounded-full gradient-bg" />
          </div>
          <span className="text-xs" style={{ color: 'var(--music-muted)' }}>0:12 / 0:36</span>
          <select className="text-xs rounded-lg px-2 py-1 outline-none" style={{ background: 'var(--music-surface-2)', border: '1px solid var(--music-border)', color: 'var(--music-text)' }}>
            <option>🎹 Piano</option>
          </select>
        </div>
      </div>
    </div>
  );
}
