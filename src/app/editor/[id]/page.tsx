'use client';

import { useEffect, useCallback } from 'react';
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

export default function EditorPage() {
  const params = useParams();
  const songId = params.id as string;
  const { data: session } = useSession();
  const { song, setSong, isDirty, setCollaborators } = useEditorStore();
  const { debouncedSave, error: saveError } = useAutoSave();

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
        {/* Main editor */}
        <SongEditor className="flex-1" />

        {/* Side panel */}
        <SidePanel songId={songId} />
      </div>
    </div>
  );
}
