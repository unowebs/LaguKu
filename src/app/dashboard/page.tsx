'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus, Music, Clock, Users, Search, MoreHorizontal,
  Trash2, Copy, Share2, LogOut, Moon, Sun, FileText
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SongSummary {
  id: string;
  title: string;
  composer: string;
  key: string;
  timeSignature: string;
  tempo: number;
  updatedAt: string;
  isPublic: boolean;
  room?: { code: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [currentTab, setCurrentTab] = useState<'all' | 'collaboration' | 'recent'>('all');

  const fetchSongs = async () => {
    try {
      const res = await fetch('/api/songs');
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      const data = await res.json();
      if (data.success) setSongs(data.data);
    } catch {
      toast.error('Gagal memuat lagu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  async function createNewSong() {
    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Lagu Baru',
          composer: '',
          key: 'C',
          timeSignature: '4/4',
          tempo: 80,
          content: { lines: [{ id: crypto.randomUUID(), notes: [], barPositions: [], barTypes: [] }] },
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/editor/${data.data.id}`);
      } else {
        toast.error('Gagal membuat lagu baru');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
  }

  async function deleteSong(id: string) {
    if (!confirm('Hapus lagu ini?')) return;
    try {
      await fetch(`/api/songs/${id}`, { method: 'DELETE' });
      setSongs((prev) => prev.filter((s) => s.id !== id));
      toast.success('Lagu dihapus');
    } catch {
      toast.error('Gagal menghapus');
    }
  }

  const filtered = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.composer.toLowerCase().includes(search.toLowerCase())
  );

  const displayedSongs = (() => {
    let result = filtered;
    if (currentTab === 'collaboration') {
      result = filtered.filter((s) => s.room != null);
    } else if (currentTab === 'recent') {
      result = [...filtered]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6);
    }
    return result;
  })();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--music-bg)' }} suppressHydrationWarning>
      {/* Sidebar */}
      <div className="flex h-screen overflow-hidden">
        <aside className="w-56 flex-shrink-0 border-r flex flex-col"
          style={{ background: 'var(--music-surface)', borderColor: 'var(--music-border)' }}>
          {/* Logo */}
          <div className="h-16 flex items-center px-5 border-b"
            style={{ borderColor: 'var(--music-border)' }}>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
                <Music size={14} className="text-white" />
              </div>
              <span className="font-bold gradient-text">LaguKu</span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            <NavItem 
              icon={<FileText size={15} />} 
              label="Lagu Saya" 
              active={currentTab === 'all'} 
              onClick={() => setCurrentTab('all')} 
            />
            <NavItem 
              icon={<Users size={15} />} 
              label="Kolaborasi" 
              active={currentTab === 'collaboration'} 
              onClick={() => setCurrentTab('collaboration')} 
            />
            <NavItem 
              icon={<Clock size={15} />} 
              label="Terbaru" 
              active={currentTab === 'recent'} 
              onClick={() => setCurrentTab('recent')} 
            />
          </nav>

          {/* Bottom */}
          <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--music-border)' }}>
            <button onClick={toggleTheme}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
              style={{ color: 'var(--music-muted)' }}
              suppressHydrationWarning>
              <span className="flex items-center gap-2">
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
              </span>
            </button>
            <button
              onClick={async () => {
                const { signOut } = await import('next-auth/react');
                await signOut({ callbackUrl: '/' });
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-red-500/10"
              style={{ color: 'var(--music-muted)' }}>
              <LogOut size={15} />
              Keluar
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-8 border-b sticky top-0 z-10 glass"
            style={{ borderColor: 'var(--music-border)' }}>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--music-text)' }}>
              {currentTab === 'all' && 'Lagu Saya'}
              {currentTab === 'collaboration' && 'Lagu Kolaborasi'}
              {currentTab === 'recent' && 'Lagu Terbaru'}
            </h1>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--music-muted)' }} />
                <input
                  type="text"
                  placeholder="Cari lagu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field !pl-9 py-2 w-56 text-sm"
                />
              </div>
              {/* New song */}
              <button onClick={createNewSong} className="btn-primary py-2 px-4 text-sm">
                <Plus size={16} /> Lagu Baru
              </button>
            </div>
          </div>

          {/* Songs grid */}
          <div className="p-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="song-card h-36 animate-pulse"
                    style={{ background: 'var(--music-surface-2)' }} />
                ))}
              </div>
            ) : displayedSongs.length === 0 ? (
              <EmptyState onCreate={createNewSong} hasSearch={!!search} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedSongs.map((song, i) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <SongCard
                      song={song}
                      onDelete={() => deleteSong(song.id)}
                      onOpen={() => router.push(`/editor/${song.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon, label, active, href, onClick
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const cls = `w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
    active ? 'font-medium' : 'hover:bg-white/5'
  }`;
  const style = {
    color: active ? 'var(--music-accent)' : 'var(--music-muted)',
    background: active ? 'rgba(99,102,241,0.1)' : undefined,
  };

  if (href) {
    return (
      <Link href={href} className={cls} style={style} onClick={onClick}>
        {icon} {label}
      </Link>
    );
  }
  return (
    <button className={cls} style={style} onClick={onClick}>
      {icon} {label}
    </button>
  );
}

function SongCard({
  song, onDelete, onOpen
}: {
  song: SongSummary;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="song-card group" onClick={onOpen}>
      {/* Key badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white text-xs font-bold">
            {song.key}
          </div>
          <div className="text-xs" style={{ color: 'var(--music-muted)' }}>
            {song.timeSignature} • {song.tempo} BPM
          </div>
        </div>

        {/* Menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--music-muted)', background: 'var(--music-surface-2)' }}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-40 rounded-xl border shadow-xl z-20 py-1"
              style={{ background: 'var(--music-surface)', borderColor: 'var(--music-border)' }}>
              <MenuItem icon={<Copy size={13} />} label="Duplikat" onClick={() => {}} />
              <MenuItem icon={<Share2 size={13} />} label="Bagikan" onClick={() => {}} />
              <div className="h-px my-1" style={{ background: 'var(--music-border)' }} />
              <MenuItem
                icon={<Trash2 size={13} />}
                label="Hapus"
                danger
                onClick={() => { setMenuOpen(false); onDelete(); }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base leading-tight mb-1 truncate"
        style={{ color: 'var(--music-text)' }}>
        {song.title || 'Tanpa Judul'}
      </h3>
      <p className="text-xs truncate mb-3" style={{ color: 'var(--music-muted)' }}>
        {song.composer || 'Tanpa Pencipta'}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs" style={{ color: 'var(--music-muted)' }}>
          <Clock size={10} className="inline mr-1" />
          {formatDate(song.updatedAt)}
        </span>
        {song.room && (
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--music-accent)' }}>
            <Users size={10} className="inline mr-1" />
            {song.room.code}
          </span>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  icon, label, onClick, danger
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-all hover:bg-white/5"
      style={{ color: danger ? '#ef4444' : 'var(--music-text)' }}
    >
      {icon} {label}
    </button>
  );
}

function EmptyState({ onCreate, hasSearch }: { onCreate: () => void; hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--music-muted)' }}>
        <Music size={40} className="mx-auto mb-4 opacity-30" />
        <p>Tidak ada lagu yang ditemukan</p>
      </div>
    );
  }
  return (
    <div className="text-center py-20">
      <Music size={48} className="mx-auto mb-4" style={{ color: 'var(--music-accent)', opacity: 0.5 }} />
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--music-text)' }}>
        Belum ada lagu
      </h3>
      <p className="mb-6 text-sm" style={{ color: 'var(--music-muted)' }}>
        Mulai buat lagu not angka pertama Anda
      </p>
      <button onClick={onCreate} className="btn-primary mx-auto">
        <Plus size={16} /> Buat Lagu Baru
      </button>
    </div>
  );
}
