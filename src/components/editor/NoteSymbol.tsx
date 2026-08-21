'use client';

import React from 'react';
import { NoteAngka } from '@/types';
import { cn } from '@/lib/utils';

interface NoteSymbolProps {
  note: NoteAngka;
  isActive?: boolean;
  isSelected?: boolean;
  prevNote?: NoteAngka | null;
  nextNote?: NoteAngka | null;
  onClick?: () => void;
  className?: string;
}

export function NoteSymbol({
  note,
  isActive = false,
  isSelected = false,
  prevNote = null,
  nextNote = null,
  onClick,
  className,
}: NoteSymbolProps) {
  const hasLeft1 = prevNote ? prevNote.overlines >= 1 || prevNote.duration === 'eighth' || prevNote.duration === 'sixteenth' : false;
  const hasRight1 = nextNote ? nextNote.overlines >= 1 || nextNote.duration === 'eighth' || nextNote.duration === 'sixteenth' : false;

  const hasLeft2 = prevNote ? prevNote.overlines >= 2 || prevNote.duration === 'sixteenth' : false;
  const hasRight2 = nextNote ? nextNote.overlines >= 2 || nextNote.duration === 'sixteenth' : false;

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
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[7px] font-extrabold uppercase tracking-wider text-music-accent whitespace-nowrap">
          {note.dynamics === 'crescendo' ? 'cresc.' : 'dim.'}
        </span>
      )}

      {/* Fermata */}
      {note.fermata && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] leading-none font-bold text-music-accent">
          𝄐
        </span>
      )}

      {/* Accent */}
      {note.accent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] leading-none font-black text-music-accent">
          &gt;
        </span>
      )}

      {/* Note body */}
      <div className="relative flex flex-col items-center w-full">
        {/* Octave high dot — dot above */}
        {note.octave === 'high' && !note.isRest && !note.isDot && (
          <span className="block w-1.5 h-1.5 rounded-full bg-current mb-[1px]" />
        )}

        {/* Overlines (garis atas) */}
        {note.overlines > 0 && (
          <div className="flex flex-col w-full mb-[3px] gap-[2px] overflow-visible">
            {/* Garis 1/2 ketuk (Atas) */}
            <span
              className="block h-[2px] bg-current"
              style={{
                marginLeft: !hasLeft1 ? '42%' : '-2px',
                marginRight: !hasRight1 ? '42%' : '-2px',
                borderTopLeftRadius: !hasLeft1 ? 1 : 0,
                borderBottomLeftRadius: !hasLeft1 ? 1 : 0,
                borderTopRightRadius: !hasRight1 ? 1 : 0,
                borderBottomRightRadius: !hasRight1 ? 1 : 0,
              }}
            />
            {/* Garis 1/4 ketuk (Bawah garis 1/2 ketuk) */}
            {note.overlines >= 2 && (
              <span
                className="block h-[2px] bg-current"
                style={{
                  marginLeft: !hasLeft2 ? '42%' : '-2px',
                  marginRight: !hasRight2 ? '42%' : '-2px',
                  borderTopLeftRadius: !hasLeft2 ? 1 : 0,
                  borderBottomLeftRadius: !hasLeft2 ? 1 : 0,
                  borderTopRightRadius: !hasRight2 ? 1 : 0,
                  borderBottomRightRadius: !hasRight2 ? 1 : 0,
                }}
              />
            )}
          </div>
        )}

        {/* Main note pitch / Dot */}
        <span
          className={cn(
            'note-digit font-mono font-black leading-none',
            note.isRest && 'text-music-muted',
            note.isDot && 'opacity-95 font-black',
            isActive && 'text-yellow-300',
            isSelected && 'text-blue-400',
            !isActive && !isSelected && 'text-music-note'
          )}
        >
          {note.isDot ? '.' : note.isRest ? '0' : note.pitch}
          {!note.isDot && note.dotted && (
            <span className="ml-[1px] text-[0.75em] font-black">.</span>
          )}
        </span>

        {/* Staccato */}
        {!note.isDot && note.staccato && (
          <span className="block w-1.5 h-1.5 rounded-full bg-current mt-[1px]" />
        )}

        {/* Octave low dot — dot below */}
        {note.octave === 'low' && !note.isRest && !note.isDot && (
          <span className="block w-1.5 h-1.5 rounded-full bg-current mt-[1px]" />
        )}
      </div>

      {/* Tie indicator */}
      {note.tied && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-music-accent">
          ⌒
        </span>
      )}

      {/* Slur indicator */}
      {note.slurred && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-music-accent">
          ⌣
        </span>
      )}
    </div>
  );
}
