'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEditorStore } from '@/store/editorStore';
import { MainToolbar } from '@/components/toolbar/MainToolbar';
import { SongEditor } from '@/components/editor/SongEditor';
import { SidePanel } from '@/components/editor/SidePanel';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useCollaboration } from '@/hooks/useCollaboration';
import { Song } from '@/types';
import toast from 'react-hot-toast';
import { Settings, History, MessageSquare, Users } from 'lucide-react';

type PanelTab = 'settings' | 'versions' | 'comments' | 'collab';

export default function EditorPage() {
  const params = useParams();
  const songId = params.id as string;
  const { data: session } = useSession();
  const { song, setSong, isDirty, setCollaborators } = useEditorStore();
  const { debouncedSave, error: saveError } = useAutoSave();

  // Mobile panel state
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mobilePanelTab, setMobilePanelTab] = useState<PanelTab>('settings');

  const roomCode = song?.room?.code;
  const collabUser = session?.user
    ? { id: session.user.id, name: session.user.name || 'Anonymous' }
    : null;

  const { collaborators } = useCollaboration(roomCode, collabUser);

  useEffect(() => {
    setCollaborators(collaborators);
  }, [collaborators, setCollaborators]);

  // Load song
  useEffect(() => {
    async function loadSong() {
      try {
        const res = await fetch(`/api/songs/${songId}`);
        if (!res.ok) {
          toast.error('Lagu tidak ditemukan');
          return;
        }
        const data = await res.json();
        if (data.success) {
          setSong(data.data as Song);
        }
      } catch {
        toast.error('Gagal memuat lagu');
      }
    }
    if (songId) loadSong();
  }, [songId, setSong]);

  // Auto-save on changes
  useEffect(() => {
    if (song && isDirty) {
      debouncedSave(song);
    }
  }, [song, isDirty, debouncedSave]);

  // Show save error
  useEffect(() => {
    if (saveError) toast.error(saveError);
  }, [saveError]);

  const { selection, deleteNote, setSelection, updateNote } = useEditorStore();

  // Keyboard shortcut to delete/modify note
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selection) return;

      // Ignore if user is typing in input or contenteditable
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.hasAttribute('contenteditable') ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      if (isTyping) return;

      // Delete note
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteNote(selection.lineId, selection.noteIndex);
        setSelection(null);
        toast.success('Not dihapus', { id: 'delete-note' });
        return;
      }

      // Replace pitch (0-7 keys)
      if (['0', '1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        e.preventDefault();
        updateNote(selection.lineId, selection.noteIndex, {
          pitch: e.key as any,
          isRest: e.key === '0',
        });
        toast.success(`Not diubah ke ${e.key === '0' ? 'Rest (0)' : e.key}`, { id: 'change-note' });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, deleteNote, setSelection, updateNote]);

  const openMobilePanel = (tab: PanelTab) => {
    setMobilePanelTab(tab);
    setMobilePanelOpen(true);
  };

  const mobileNavItems: { tab: PanelTab; icon: React.ReactNode; label: string }[] = [
    { tab: 'settings', icon: <Settings size={20} />, label: 'Pengaturan' },
    { tab: 'versions', icon: <History size={20} />, label: 'Riwayat' },
    { tab: 'comments', icon: <MessageSquare size={20} />, label: 'Komentar' },
    { tab: 'collab', icon: <Users size={20} />, label: 'Kolaborasi' },
  ];

  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--music-bg)' }}
        suppressHydrationWarning>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--music-accent)', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--music-muted)' }}>Memuat lagu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--music-bg)' }}
      suppressHydrationWarning>
      {/* Toolbar */}
      <MainToolbar />

      {/* Editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main editor — add padding-bottom on mobile for bottom nav */}
        <SongEditor className="flex-1 min-w-0 mobile-editor-content" />

        {/* Side panel — visible on desktop */}
        <div className="hidden md:block">
          <SidePanel songId={songId} />
        </div>
      </div>

      {/* ── Mobile bottom navigation bar ─────────────────────────── */}
      <nav className="mobile-bottom-nav md:hidden" style={{
        background: 'var(--music-surface)',
        borderTop: '1px solid var(--music-border)',
      }}>
        {mobileNavItems.map((item) => (
          <button
            key={item.tab}
            onClick={() => openMobilePanel(item.tab)}
            className="mobile-bottom-nav-btn"
            style={{
              color: mobilePanelOpen && mobilePanelTab === item.tab
                ? 'var(--music-accent)'
                : 'var(--music-muted)',
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Mobile drawer backdrop ────────────────────────────────── */}
      {mobilePanelOpen && (
        <div
          className="mobile-panel-backdrop md:hidden"
          onClick={() => setMobilePanelOpen(false)}
        />
      )}

      {/* ── Mobile SidePanel drawer ───────────────────────────────── */}
      <div className="md:hidden">
        <SidePanel
          songId={songId}
          mobileOpen={mobilePanelOpen}
          mobileInitialTab={mobilePanelTab}
          onMobileClose={() => setMobilePanelOpen(false)}
        />
      </div>
    </div>
  );
}
}
