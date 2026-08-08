'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/store/editorStore';
import {
  History, MessageSquare, Settings, ChevronRight, ChevronLeft,
  Users, Clock, Send, Copy, Check, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Song } from '@/types';
import toast from 'react-hot-toast';

type PanelTab = 'versions' | 'comments' | 'collab' | 'settings';

interface SidePanelProps {
  songId: string;
  /** Tab to open when panel is opened from mobile bottom nav */
  mobileInitialTab?: PanelTab;
  /** Whether the panel is open in mobile drawer mode */
  mobileOpen?: boolean;
  /** Callback to close mobile drawer */
  onMobileClose?: () => void;
}

export function SidePanel({ songId, mobileInitialTab, mobileOpen, onMobileClose }: SidePanelProps) {
  const [activeTabState, setActiveTab] = useState<PanelTab>('settings');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { song, updateSongMeta } = useEditorStore();

  const activeTab = (mobileOpen && mobileInitialTab) ? mobileInitialTab : activeTabState;

  // Desktop collapsed state — on mobile this is ignored
  if (isCollapsed) {
    return (
      <div className="w-10 flex-shrink-0 border-l flex flex-col items-center py-3 gap-3"
        style={{ background: 'var(--music-surface)', borderColor: 'var(--music-border)' }}>
        <button onClick={() => setIsCollapsed(false)}
          className="toolbar-icon-btn w-7 h-7" title="Buka panel">
          <ChevronLeft size={14} />
        </button>
        {[
          { tab: 'settings', icon: <Settings size={14} />, title: 'Pengaturan' },
          { tab: 'versions', icon: <History size={14} />, title: 'Riwayat' },
          { tab: 'comments', icon: <MessageSquare size={14} />, title: 'Komentar' },
          { tab: 'collab', icon: <Users size={14} />, title: 'Kolaborasi' },
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => { setActiveTab(item.tab as PanelTab); setIsCollapsed(false); }}
            className="toolbar-icon-btn w-7 h-7"
            title={item.title}
          >
            {item.icon}
          </button>
        ))}
      </div>
    );
  }

  const panelTabs = [
    { tab: 'settings' as PanelTab, icon: <Settings size={13} />, label: 'Pengaturan' },
    { tab: 'versions' as PanelTab, icon: <History size={13} />, label: 'Riwayat' },
    { tab: 'comments' as PanelTab, icon: <MessageSquare size={13} />, label: 'Komentar' },
    { tab: 'collab' as PanelTab, icon: <Users size={13} />, label: 'Kolaborasi' },
  ];

  return (
    <div className={cn('sidebar flex-shrink-0 flex flex-col', mobileOpen && 'open mobile-drawer')}>
      {/* Mobile drag handle */}
      {mobileOpen && (
        <div className="flex justify-center pt-2 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--music-border)' }} />
        </div>
      )}

      {/* Panel header */}
      <div className="flex items-center justify-between px-4 h-10 border-b flex-shrink-0"
        style={{ borderColor: 'var(--music-border)' }}>
        <div className="flex gap-1">
          {panelTabs.map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
              title={item.label}
              style={{
                color: activeTab === item.tab ? 'var(--music-accent)' : 'var(--music-muted)',
                background: activeTab === item.tab ? 'rgba(99,102,241,0.1)' : undefined,
              }}
            >
              {item.icon}
            </button>
          ))}
        </div>
        {/* Active tab label */}
        <span className="text-xs font-medium flex-1 text-center" style={{ color: 'var(--music-text)' }}>
          {panelTabs.find(t => t.tab === activeTab)?.label}
        </span>
        {/* Close button — on mobile calls onMobileClose, on desktop collapses */}
        <button
          onClick={() => mobileOpen ? onMobileClose?.() : setIsCollapsed(true)}
          className="toolbar-icon-btn w-6 h-6"
          title="Tutup panel"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'settings' && song && (
          <SettingsPanel song={song} updateSongMeta={updateSongMeta} />
        )}
        {activeTab === 'versions' && (
          <VersionsPanel songId={songId} />
        )}
        {activeTab === 'comments' && (
          <CommentsPanel songId={songId} />
        )}
        {activeTab === 'collab' && (
          <CollabPanel songId={songId} />
        )}
      </div>
    </div>
  );
}

// ——— Settings Panel ———
function SettingsPanel({
  song,
  updateSongMeta,
}: {
  song: Song;
  updateSongMeta: (meta: Partial<Song>) => void;
}) {
  if (!song) return null;

  const sectionStyle = { borderColor: 'var(--music-border)' };
  const labelStyle = { color: 'var(--music-muted)' };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={labelStyle}>
        Pengaturan Lagu
      </h3>

      <div>
        <label className="block text-xs mb-1" style={labelStyle}>Judul</label>
        <input
          type="text"
          defaultValue={song.title}
          onBlur={(e) => updateSongMeta({ title: e.target.value })}
          className="input-field text-sm py-2"
        />
      </div>

      <div>
        <label className="block text-xs mb-1" style={labelStyle}>Nama Pencipta</label>
        <input
          type="text"
          defaultValue={song.composer}
          onBlur={(e) => updateSongMeta({ composer: e.target.value })}
          className="input-field text-sm py-2"
        />
      </div>

      <div>
        <label className="block text-xs mb-1" style={labelStyle}>Genre</label>
        <input
          type="text"
          defaultValue={song.genre ?? ''}
          onBlur={(e) => updateSongMeta({ genre: e.target.value })}
          className="input-field text-sm py-2"
          placeholder="Love Song, Ballad, dll"
        />
      </div>

      <div>
        <label className="block text-xs mb-1" style={labelStyle}>Tempo (BPM)</label>
        <input
          type="number"
          min={40} max={240}
          defaultValue={song.tempo}
          onBlur={(e) => updateSongMeta({ tempo: parseInt(e.target.value) })}
          className="input-field text-sm py-2"
        />
      </div>

      <div>
        <label className="block text-xs mb-1" style={labelStyle}>Visibilitas</label>
        <select
          defaultValue={song.isPublic ? 'public' : 'private'}
          onChange={(e) => updateSongMeta({ isPublic: e.target.value === 'public' })}
          className="input-field text-sm py-2"
        >
          <option value="private">🔒 Privat</option>
          <option value="public">🌐 Publik</option>
        </select>
      </div>

      <div className="pt-2 border-t" style={sectionStyle}>
        <p className="text-xs" style={labelStyle}>
          Terakhir diubah: {formatDate(song.updatedAt)}
        </p>
      </div>
    </div>
  );
}

// ——— Versions Panel ———
function VersionsPanel({ songId }: { songId: string }) {
  const [versions, setVersions] = useState<Array<{
    id: string; label: string; userName: string; createdAt: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const { setSong } = useEditorStore();

  React.useEffect(() => {
    fetch(`/api/songs/${songId}/versions`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setVersions(d.data); })
      .finally(() => setIsLoading(false));
  }, [songId]);

  async function restoreVersion(versionId: string) {
    if (!confirm('Pulihkan ke versi ini? Perubahan saat ini akan disimpan sebagai versi baru.')) return;
    setRestoring(versionId);
    try {
      const res = await fetch(`/api/songs/${songId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      const data = await res.json();
      if (data.success) {
        setSong(data.data);
        toast.success('Versi berhasil dipulihkan!');
        // Refresh versions list
        const vRes = await fetch(`/api/songs/${songId}/versions`);
        const vData = await vRes.json();
        if (vData.success) setVersions(vData.data);
      } else {
        toast.error(data.error || 'Gagal memulihkan versi');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--music-muted)' }}>
        Riwayat Versi
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg animate-pulse"
              style={{ background: 'var(--music-surface-2)' }} />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--music-muted)' }}>
          Belum ada riwayat versi
        </p>
      ) : (
        <div className="space-y-2">
          {versions.map((v, i) => (
            <div key={v.id}
              className="p-3 rounded-xl border transition-all"
              style={{ background: 'var(--music-surface-2)', borderColor: 'var(--music-border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--music-text)' }}>
                  {v.label || `Versi ${versions.length - i}`}
                </span>
                <button
                  onClick={() => restoreVersion(v.id)}
                  disabled={restoring === v.id}
                  className="text-xs px-2 py-0.5 rounded-full transition-all hover:opacity-80"
                  style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--music-accent)' }}
                >
                  {restoring === v.id ? 'Memulihkan...' : 'Pulihkan'}
                </button>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--music-muted)' }}>
                <Clock size={10} />
                {formatDate(v.createdAt)} • {v.userName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ——— Comments Panel ———
function CommentsPanel({ songId }: { songId: string }) {
  const [comments, setComments] = useState<Array<{
    id: string; content: string; userId: string; lineIndex: number; createdAt: string;
    user: { name: string };
  }>>([]);
  const [comment, setComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { selection } = useEditorStore();

  React.useEffect(() => {
    fetch(`/api/songs/${songId}/comments`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setComments(d.data); })
      .catch(() => {});
  }, [songId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/songs/${songId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: comment,
          lineIndex: selection?.noteIndex ?? 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [data.data, ...prev]);
        setComment('');
      } else {
        toast.error(data.error || 'Gagal mengirim komentar');
      }
    } catch {
      toast.error('Gagal mengirim komentar');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="p-4 flex flex-col h-full" style={{ minHeight: '300px' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--music-muted)' }}>
        Komentar
      </h3>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {comments.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--music-muted)' }}>
            Belum ada komentar
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-2 rounded-lg"
              style={{ background: 'var(--music-surface-2)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--music-accent)' }}>
                {c.user?.name}
              </p>
              <p className="text-sm" style={{ color: 'var(--music-text)' }}>{c.content}</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--music-muted)' }}>
                {formatDate(c.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tulis komentar..."
          className="input-field text-sm py-2 flex-1"
          disabled={isSending}
        />
        <button type="submit" disabled={isSending}
          className="btn-primary py-2 px-3 text-sm">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

// ——— Collaboration Panel ———
function CollabPanel({ songId }: { songId: string }) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeRoom, setActiveRoom] = useState<{ code: string } | null>(null);

  async function createRoom() {
    setIsCreating(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId, code: roomCode.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveRoom({ code: data.data.code });
        const url = `${window.location.origin}/room/${data.data.code}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        toast.success(`Room dibuat! Kode: ${data.data.code}`);
      } else {
        toast.error(data.error || 'Gagal membuat room');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsCreating(false);
    }
  }

  function joinRoom() {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast.error('Masukkan kode room');
      return;
    }
    router.push(`/room/${code}`);
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--music-muted)' }}>
        Kolaborasi Real-time
      </h3>

      {/* Active room */}
      {activeRoom && (
        <div className="p-3 rounded-xl border"
          style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--music-muted)' }}>Room Aktif</p>
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-lg tracking-widest"
              style={{ color: 'var(--music-accent)' }}>
              {activeRoom.code}
            </span>
            <div className="flex gap-1">
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/room/${activeRoom.code}`;
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success('Link tersalin!');
                }}
                className="toolbar-icon-btn w-7 h-7"
                title="Salin link"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              </button>
              <button
                onClick={() => router.push(`/room/${activeRoom.code}`)}
                className="toolbar-icon-btn w-7 h-7"
                title="Buka halaman room"
              >
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create room */}
      <div className="p-3 rounded-xl border"
        style={{ background: 'var(--music-surface-2)', borderColor: 'var(--music-border)' }}>
        <p className="text-xs mb-3" style={{ color: 'var(--music-muted)' }}>
          Buat room dan bagikan kode ke teman untuk edit bersama
        </p>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Kode room (opsional)"
          className="input-field text-sm py-2 mb-2"
          maxLength={12}
        />
        <button
          onClick={createRoom}
          disabled={isCreating}
          className="btn-primary w-full justify-center text-sm py-2"
        >
          {isCreating ? 'Membuat...' : '+ Buat Room Kolaborasi'}
        </button>
      </div>

      {/* Join room */}
      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--music-muted)' }}>
          Bergabung ke room:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Masukkan kode room"
            className="input-field text-sm py-2 flex-1"
            maxLength={12}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
          />
          <button
            onClick={joinRoom}
            className="btn-primary text-sm py-2 px-3"
          >
            Masuk
          </button>
        </div>
      </div>
    </div>
  );
}
