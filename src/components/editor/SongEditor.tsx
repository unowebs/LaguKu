'use client';

import React, { useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { LyricLineComponent } from './LyricLine';
import { cn } from '@/lib/utils';

interface SongEditorProps {
  className?: string;
}

export function SongEditor({ className }: SongEditorProps) {
  const { song, zoom, addLine } = useEditorStore();
  const editorRef = useRef<HTMLDivElement>(null);

  if (!song) return null;

  const scale = zoom / 100;

  return (
    <div
      className={cn(
        'song-editor-wrapper overflow-auto flex-1',
        className
      )}
    >
      {/* Paper sheet */}
      <div
        ref={editorRef}
        id="song-editor"
        className="song-paper mx-auto my-6 shadow-2xl"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          marginBottom: `${(842 * scale) - 842 + 24}px`,
        }}
      >
        {/* Song header */}
        <SongHeader />

        {/* Divider */}
        <div className="mb-4" style={{ borderBottom: '2px solid var(--music-barline)' }} />

        {/* Song body */}
        <div className="song-body px-8 pb-8">
          {song.content.lines.map((line, idx) => (
            <LyricLineComponent
              key={line.id}
              line={line}
              lineIndex={idx}
            />
          ))}

          {/* Add line button */}
          <button
            onClick={addLine}
            className="mt-4 w-full py-2 text-sm rounded-lg transition-all duration-200"
            style={{
              border: '1px dashed var(--music-muted)',
              color: 'var(--music-muted)',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.borderColor = 'var(--music-accent)';
              (e.target as HTMLElement).style.color = 'var(--music-accent)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.borderColor = 'var(--music-muted)';
              (e.target as HTMLElement).style.color = 'var(--music-muted)';
            }}
          >
            + Tambah Baris
          </button>
        </div>
      </div>
    </div>
  );
}

function SongHeader() {
  const { song, updateSongMeta } = useEditorStore();
  if (!song) return null;

  return (
    <div className="song-header px-8 pt-6 pb-4">
      {/* Top info row */}
      <div className="flex justify-between items-start mb-2 text-xs text-music-muted">
        <span>
          Do = {' '}
          <span className="font-semibold text-music-text">{song.key}</span>
        </span>
        <span>
          Lagu:{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            className="font-semibold text-music-text outline-none focus:bg-white/5 rounded px-1"
            onBlur={(e) =>
              updateSongMeta({ composer: e.currentTarget.textContent ?? '' })
            }
          >
            {song.composer || 'Nama Pencipta'}
          </span>
        </span>
      </div>

      {/* Song title */}
      <h1
        contentEditable
        suppressContentEditableWarning
        className="song-title text-center font-bold text-2xl uppercase tracking-wider
                   text-music-title outline-none focus:bg-white/5 rounded px-2 py-1
                   cursor-text"
        onBlur={(e) =>
          updateSongMeta({ title: e.currentTarget.textContent ?? '' })
        }
      >
        {song.title || 'JUDUL LAGU'}
      </h1>

      {/* Meta row */}
      <div className="flex gap-6 mt-3 text-xs text-music-muted">
        <span>
          Style:{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            className="font-medium text-music-text outline-none focus:bg-white/5 rounded px-1"
            onBlur={(e) =>
              updateSongMeta({ genre: e.currentTarget.textContent ?? '' })
            }
          >
            {song.genre || 'Genre'}
          </span>
        </span>
        <span>
          Birama:{' '}
          <span className="font-medium text-music-text">{song.timeSignature}</span>
        </span>
        <span>
          Tempo:{' '}
          <span className="font-medium text-music-text">{song.tempo} BPM</span>
        </span>
      </div>
    </div>
  );
}
