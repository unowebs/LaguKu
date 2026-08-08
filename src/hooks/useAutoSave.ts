import { useCallback, useMemo, useRef, useState } from 'react';
import { Song } from '@/types';
import { debounce } from '@/lib/utils';
import { useEditorStore } from '@/store/editorStore';

export function useAutoSave() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveCountRef = useRef(0);

  const { markSaved, markSaving } = useEditorStore();

  const save = useCallback(async (song: Song) => {
    if (!song?.id) return;
    setIsSaving(true);
    setError(null);
    markSaving(true);

    try {
      const res = await fetch(`/api/songs/${song.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: song.title,
          composer: song.composer,
          key: song.key,
          timeSignature: song.timeSignature,
          tempo: song.tempo,
          genre: song.genre,
          content: song.content,
          isPublic: song.isPublic,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan');
      } else {
        setLastSaved(new Date());
        markSaved();

        // Auto-snapshot: save version every 5 saves
        saveCountRef.current += 1;
        if (saveCountRef.current % 5 === 0) {
          fetch(`/api/songs/${song.id}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: `Auto-save ${new Date().toLocaleTimeString('id-ID')}`,
            }),
          }).catch(() => {}); // silently fail snapshot
        }
      }
    } catch {
      setError('Gagal menyimpan — periksa koneksi Anda');
    } finally {
      setIsSaving(false);
      markSaving(false);
    }
  }, [markSaved, markSaving]);

  // Debounce 1.5 seconds using useMemo
  const debouncedSave = useMemo(() => debounce((song: Song) => {
    save(song);
  }, 1500), [save]);

  return { debouncedSave, isSaving, error, lastSaved };
}
