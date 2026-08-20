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
        {note.octave === 'high' && !note.isRest && !note.isDot && (
          <span className="block w-1 h-1 rounded-full bg-current mb-[1px]" />
        )}

        {/* Overlines (garis atas — 1/2 ketuk di atas, 1/4 ketuk di bawahnya) */}
        {note.overlines > 0 && (
          <div className="flex flex-col items-center w-full mb-[3px] gap-[2px]">
            {/* Garis 1/2 ketuk (Atas) */}
            <span className="block h-[1.5px] bg-current w-full" style={{ minWidth: '14px' }} />
            {/* Garis 1/4 ketuk (Bawah garis 1/2 ketuk) */}
            {note.overlines >= 2 && (
              <span className="block h-[1.5px] bg-current w-full" style={{ minWidth: '14px' }} />
            )}
          </div>
        )}

        {/* Main note pitch / Dot */}
        <span
          className={cn(
            'note-digit font-mono font-bold leading-none',
            note.isRest && 'text-music-muted',
            note.isDot && 'opacity-85',
            isActive && 'text-yellow-300',
            isSelected && 'text-blue-400',
            !isActive && !isSelected && 'text-music-note'
          )}
        >
          {note.isDot ? '.' : note.isRest ? '0' : note.pitch}
          {!note.isDot && note.dotted && (
            <span className="ml-[1px] text-[0.7em]">.</span>
          )}
        </span>

        {/* Staccato */}
        {!note.isDot && note.staccato && (
          <span className="block w-1 h-1 rounded-full bg-current mt-[1px]" />
        )}

        {/* Octave low dot — dot below */}
        {note.octave === 'low' && !note.isRest && !note.isDot && (
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
