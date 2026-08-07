'use client';

import React from 'react';
import { NoteAngka } from '@/types';
import { cn } from '@/lib/utils';

interface NoteSymbolProps {
  note: NoteAngka;
  isActive?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function NoteSymbol({
  note,
  isActive = false,
  isSelected = false,
  onClick,
  className,
}: NoteSymbolProps) {
  return (
    <div
      className={cn(
        'relative inline-flex flex-col items-center cursor-pointer select-none',
        'transition-all duration-100',
        isActive && 'note-active',
        isSelected && 'note-selected',
        className
      )}
      onClick={onClick}
    >
      {/* Dynamics indicator */}
      {note.dynamics && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase tracking-wider text-music-accent whitespace-nowrap">
          {note.dynamics === 'crescendo' ? 'cresc.' : 'dim.'}
        </span>
      )}

      {/* Fermata */}
      {note.fermata && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] leading-none text-music-accent">
          𝄐
        </span>
      )}

      {/* Accent */}
      {note.accent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] leading-none font-bold text-music-accent">
          &gt;
        </span>
      )}

      {/* Note body */}
      <div className="relative flex flex-col items-center">
        {/* Octave high dot — dot above */}
        {note.octave === 'high' && !note.isRest && (
          <span className="block w-1 h-1 rounded-full bg-current mb-[1px]" />
        )}

        {/* Overlines (garis atas — nilai nada panjang: half=1 garis, whole=2 garis) */}
        {note.overlines > 0 && Array.from({ length: note.overlines }).map((_, i) => (
          <span
            key={i}
            className="block h-[1.5px] bg-current mb-[1px]"
            style={{ minWidth: '14px', width: '100%' }}
          />
        ))}

        {/* Main note pitch */}
        <span
          className={cn(
            'note-digit font-mono font-bold leading-none',
            note.isRest && 'text-music-muted',
            isActive && 'text-yellow-300',
            isSelected && 'text-blue-400',
            !isActive && !isSelected && 'text-music-note'
          )}
        >
          {note.isRest ? '0' : note.pitch}
          {note.dotted && (
            <span className="ml-[1px] text-[0.7em]">.</span>
          )}
        </span>

        {/* Staccato */}
        {note.staccato && (
          <span className="block w-1 h-1 rounded-full bg-current mt-[1px]" />
        )}

        {/* Underlines (garis bawah — nilai nada pendek: eighth=1 garis, sixteenth=2 garis) */}
        {note.underlines > 0 && (
          <div className="flex flex-col items-center gap-[1px] mt-[5px]">
            {Array.from({ length: note.underlines }).map((_, i) => (
              <span
                key={i}
                className="block h-[1.5px] bg-current"
                style={{ minWidth: '14px' }}
              />
            ))}
          </div>
        )}

        {/* Octave low dot — dot below (after underlines) */}
        {note.octave === 'low' && !note.isRest && (
          <span className="block w-1 h-1 rounded-full bg-current mt-[1px]" />
        )}
      </div>

      {/* Tie indicator */}
      {note.tied && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-music-accent">
          ⌒
        </span>
      )}

      {/* Slur indicator */}
      {note.slurred && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-music-accent">
          ⌣
        </span>
      )}
    </div>
  );
}
