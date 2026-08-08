'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Music, Clock, Users, Search, MoreHorizontal,
  Trash2, Copy, Share2, LogOut, Moon, Sun, FileText,
  Menu, X, ChevronLeft,
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  async function duplicateSong(song: SongSummary) {
    try {
      // Fetch details of original song
      const res = await fetch(`/api/songs/${song.id}`);
      const data = await res.json();
      if (!data.success) throw new Error();

      const orig = data.data;
      const createRes = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${orig.title || 'Lagu'} (Salinan)`,
          composer: orig.composer || '',
          key: orig.key || 'C',
          timeSignature: orig.timeSignature || '4/4',
          tempo: orig.tempo || 80,
          genre: orig.genre || '',
          content: orig.content,
        }),
      });
      const createData = await createRes.json();
      if (createData.success) {
        toast.success('Lagu berhasil diduplikat');
        fetchSongs();
      } else {
        toast.error('Gagal menduplikat lagu');
      }
    } catch {
      toast.error('Gagal menduplikat lagu');
    }
  }

  function shareSong(songId: string) {
    const url = `${window.location.origin}/editor/${songId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link editor disalin ke clipboard');
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

  const handleNavClick = (tab: 'all' | 'collaboration' | 'recent') => {
    setCurrentTab(tab);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--music-bg)' }} suppressHydrationWarning>
      <div className="flex h-screen overflow-hidden relative">

        {/* ── Mobile backdrop ── */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar ── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              className="flex-shrink-0 border-r flex flex-col overflow-hidden"
              style={{
                background: 'var(--music-surface)',
                borderColor: 'var(--music-border)',
                position: isMobile ? 'fixed' : 'relative',
                top: 0,
                left: 0,
                height: '100%',
                zIndex: isMobile ? 30 : 'auto',
                width: 224,
              }}
              initial={{ x: -224, opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -224, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              {/* Logo row */}
              <div className="h-16 flex items-center justify-between px-5 border-b flex-shrink-0"
                style={{ borderColor: 'var(--music-border)' }}>
                <Link href="/" className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                    <Music size={14} className="text-white" />
                  </div>
                  <span className="font-bold gradient-text truncate">LaguKu</span>
                </Link>
                {/* Close chevron button inside sidebar */}
                <button
                  id="sidebar-close-btn"
                  onClick={() => setSidebarOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 flex-shrink-0"
                  style={{ color: 'var(--music-muted)' }}
                  title="Tutup sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                <NavItem
                  icon={<FileText size={15} />}
                  label="Lagu Saya"
                  active={currentTab === 'all'}
                  onClick={() => handleNavClick('all')}
                />
                <NavItem
                  icon={<Users size={15} />}
                  label="Kolaborasi"
                  active={currentTab === 'collaboration'}
                  onClick={() => handleNavClick('collaboration')}
                />
                <NavItem
                  icon={<Clock size={15} />}
                  label="Terbaru"
                  active={currentTab === 'recent'}
                  onClick={() => handleNavClick('recent')}
                />
              </nav>

              {/* Bottom actions */}
              <div className="p-3 border-t space-y-1 flex-shrink-0" style={{ borderColor: 'var(--music-border)' }}>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
                  style={{ color: 'var(--music-muted)' }}
                  suppressHydrationWarning
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                  <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
                </button>
                <button
                  onClick={async () => {
                    const { signOut } = await import('next-auth/react');
                    await signOut({ callbackUrl: '/' });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-red-500/10"
                  style={{ color: 'var(--music-muted)' }}
                >
                  <LogOut size={15} />
                  Keluar
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-auto min-w-0">
          {/* Header */}
          <div
            className="h-16 flex items-center justify-between px-4 md:px-6 border-b sticky top-0 z-10 glass"
            style={{ borderColor: 'var(--music-border)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger / close toggle */}
              <button
                id="sidebar-toggle-btn"
                onClick={() => setSidebarOpen((v) => !v)}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 flex-shrink-0"
                style={{ color: 'var(--music-muted)' }}
                title={sidebarOpen ? 'Tutup menu' : 'Buka menu'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={sidebarOpen ? 'x' : 'menu'}
                    initial={{ rotate: -60, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 60, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                  </motion.span>
                </AnimatePresence>
              </button>

              <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--music-text)' }}>
                {currentTab === 'all' && 'Lagu Saya'}
                {currentTab === 'collaboration' && 'Lagu Kolaborasi'}
                {currentTab === 'recent' && 'Lagu Terbaru'}
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {/* Search — hidden on mobile (shown below header) */}
              <div className="relative hidden sm:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--music-muted)' }} />
                <input
                  type="text"
                  placeholder="Cari lagu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field !pl-9 py-2 w-44 md:w-56 text-sm"
                />
              </div>
              {/* New song button */}
              <button onClick={createNewSong} className="btn-primary py-2 px-3 md:px-4 text-sm">
                <Plus size={16} />
                <span className="hidden sm:inline">Lagu Baru</span>
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="sm:hidden px-4 pt-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--music-muted)' }} />
              <input
                type="text"
                placeholder="Cari lagu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !pl-9 py-2 w-full text-sm"
              />
            </div>
          </div>

          {/* Songs grid */}
          <div className="p-4 md:p-8">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="song-card h-36 animate-pulse"
                    style={{ background: 'var(--music-surface-2)' }} />
                ))}
              </div>
            ) : displayedSongs.length === 0 ? (
              <EmptyState onCreate={createNewSong} hasSearch={!!search} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      onDuplicate={() => duplicateSong(song)}
                      onShare={() => shareSong(song.id)}
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

// ── Sub-components ────────────────────────────────────────────

function NavItem({
  icon, label, active, href, onClick,
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
    return <Link href={href} className={cls} style={style} onClick={onClick}>{icon} {label}</Link>;
  }
  return <button className={cls} style={style} onClick={onClick}>{icon} {label}</button>;
}

function SongCard({ song, onDelete, onDuplicate, onShare, onOpen }: {
  song: SongSummary;
  onDelete: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onOpen: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="song-card group" onClick={onOpen}>
      {/* Click outside overlay to close dropdown */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
          }}
        />
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {song.key}
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--music-muted)' }}>
            {song.timeSignature} • {song.tempo} BPM
          </div>
        </div>

        {/* 3-Dots Menu button */}
        <div className="relative z-40" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              menuOpen ? 'opacity-100 bg-white/10' : 'opacity-0 group-hover:opacity-100 hover:bg-white/10'
            }`}
            style={{ color: 'var(--music-muted)' }}
          >
            <MoreHorizontal size={14} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-8 w-44 rounded-xl border shadow-2xl z-40 py-1 overflow-hidden backdrop-blur-md"
                style={{ background: 'var(--music-surface)', borderColor: 'var(--music-border)' }}
              >
                <MenuItem
                  icon={<Copy size={13} />}
                  label="Duplikat"
                  onClick={() => { setMenuOpen(false); onDuplicate(); }}
                />
                <MenuItem
                  icon={<Share2 size={13} />}
                  label="Bagikan Link"
                  onClick={() => { setMenuOpen(false); onShare(); }}
                />
                <div className="h-px my-1" style={{ background: 'var(--music-border)' }} />
                <MenuItem
                  icon={<Trash2 size={13} />}
                  label="Hapus Lagu"
                  danger
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <h3 className="font-semibold text-base leading-tight mb-1 truncate" style={{ color: 'var(--music-text)' }}>
        {song.title || 'Tanpa Judul'}
      </h3>
      <p className="text-xs truncate mb-3" style={{ color: 'var(--music-muted)' }}>
        {song.composer || 'Tanpa Pencipta'}
      </p>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <span className="text-xs" style={{ color: 'var(--music-muted)' }}>
          <Clock size={10} className="inline mr-1" />
          {formatDate(song.updatedAt)}
        </span>
        {song.room && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--music-accent)' }}>
            <Users size={10} className="inline mr-1" />
            {song.room.code}
          </span>
        )}
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all hover:bg-white/10"
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
