'use client';

/**
 * NoteCell — Grid-based not angka cell dengan 7 layer fixed-height.
 *
 * Setiap NoteCell memiliki tinggi total yang KONSTAN,
 * sehingga semua cell selalu sejajar secara vertikal, bahkan saat
 * cells dengan konten berbeda berada dalam baris yang sama.
 *
 *  Layer        Height  Konten
 *  ──────────────────────────────────────────────
 *  chord          18px  "Am", "G7", "F#m", dll.
 *  accent         14px  Fermata (𝄐) / Accent (>) / Staccato (·)
 *  octave-high     8px  Titik atas untuk oktaf tinggi
 *  overlines       8px  Garis atas (half=1, whole=2)
 *  note           26px  Angka not: 1–7, 0 (rest), atau . (titik/dot)
 *  octave-low      8px  Titik bawah untuk oktaf rendah
 *  lyric          22px  Suku kata lagu (contentEditable inline)
 *  ──────────────────────────────────────────────
 *  Total:        104px
 */

import React from 'react';
import { NoteAngka } from '@/types';
import { useEditorStore } from '@/store/editorStore';

// ─── Layer height constants ───────────────────────────────────────────────────
export const LAYER_H = {
  chord:      18,
  accent:     14,
  octaveHigh:  8,
  overlines:  10,
  note:       26,
  octaveLow:   8,
  lyric:      22,
} as const;

export const CELL_TOTAL_HEIGHT =
  LAYER_H.chord + LAYER_H.accent + LAYER_H.octaveHigh + LAYER_H.overlines +
  LAYER_H.note  + LAYER_H.octaveLow + LAYER_H.lyric;
// = 106px

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoteCellProps {
  note: NoteAngka;
  noteIndex: number;
  lineId: string;
  /** Computed from zoom: default 40px */
  cellWidth: number;
  isActive?: boolean;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

// ─── NoteCell ─────────────────────────────────────────────────────────────────

export function NoteCell({
  note,
  noteIndex,
  lineId,
  cellWidth,
  isActive = false,
  isSelected = false,
  onClick,
}: NoteCellProps) {
  const noteColor = isActive
    ? '#facc15'
    : isSelected
    ? '#818cf8'
    : 'var(--music-note)';

  const bgColor = isActive
    ? 'rgba(250,204,21,0.10)'
    : isSelected
    ? 'rgba(99,102,241,0.15)'
    : 'transparent';

  // Font size scales with cellWidth (min 12, max 22)
  const noteFontSize = Math.max(12, Math.min(22, cellWidth * 0.48));
  const lyricFontSize = Math.max(9, Math.min(13, cellWidth * 0.30));
  const chordFontSize = Math.max(8, Math.min(11, cellWidth * 0.26));

  const layer = (height: number, children: React.ReactNode, extra?: React.CSSProperties) => (
    <div
      style={{
        height,
        minHeight: height,
        maxHeight: height,
        flexBasis: height,
        width: '100%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...extra,
      }}
    >
      {children}
    </div>
  );

  return (
    <div
      style={{
        width: 'fit-content',
        minWidth: cellWidth,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        userSelect: 'none',
        background: bgColor,
        borderRadius: 3,
        transition: 'background 0.1s',
        color: noteColor,
        position: 'relative',
        boxSizing: 'border-box',
      }}
      onClick={onClick}
    >
      {/* ── Layer 1: Chord ─────────────────────────────────────────────────── */}
      {layer(LAYER_H.chord,
        note.chord ? (
          <span style={{
            fontSize: chordFontSize,
            fontWeight: 700,
            color: 'var(--music-chord)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}>
            {note.chord}
          </span>
        ) : null
      )}

      {/* ── Layer 2: Accent / Fermata / Staccato ───────────────────────────── */}
      {layer(LAYER_H.accent,
        note.fermata
          ? <span style={{ fontSize: 13, color: 'var(--music-accent)' }}>𝄐</span>
          : note.accent
          ? <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--music-accent)' }}>&gt;</span>
          : note.staccato
          ? <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--music-accent)' }}>·</span>
          : null
      )}

      {/* ── Layer 3: Octave-high dot ────────────────────────────────────────── */}
      {layer(LAYER_H.octaveHigh,
        note.octave === 'high' && !note.isRest
          ? <span style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
          : null
      )}

      {/* ── Layer 4: Overlines (1 line = setengah ketuk, 2 lines = seperempat ketuk) ── */}
      {layer(LAYER_H.overlines,
        note.overlines > 0 && !note.isRest ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            justifyContent: 'flex-end',
            paddingBottom: 5,
            gap: 1.5,
          }}>
            {Array.from({ length: note.overlines }).map((_, i) => (
              <div key={i} style={{
                display: 'block',
                width: '100%',
                height: 1.5,
                background: 'currentColor',
                flexShrink: 0,
              }} />
            ))}
          </div>
        ) : null
      )}

      {/* ── Layer 5: Note digit / Dot ──────────────────────────────────────── */}
      {layer(LAYER_H.note,
        note.isDot ? (
          // Not titik — elemen tersendiri, tampil sebagai '.'
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'JetBrains Mono', 'Inter', 'Courier New', monospace",
            fontWeight: 700,
            fontSize: noteFontSize * 1.1,
            lineHeight: 1,
            color: 'currentColor',
            opacity: 0.85,
            paddingBottom: 6,
          }}>
            <span>.</span>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'JetBrains Mono', 'Inter', 'Courier New', monospace",
            fontWeight: 700,
            fontSize: noteFontSize,
            lineHeight: 1,
            color: 'currentColor',
            paddingBottom: 6,
          }}>
            <span>{note.isRest ? '0' : note.pitch}</span>
            {note.dotted && (
              <span style={{
                fontSize: noteFontSize * 0.7,
                marginLeft: 1,
              }}>
                .
              </span>
            )}
          </div>
        )
      )}

      {/* ── Layer 6: Octave-low dot ─────────────────────────────────────────── */}
      {layer(LAYER_H.octaveLow,
        note.octave === 'low' && !note.isRest && !note.isDot
          ? <span style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
          : null
      )}

      {/* ── Layer 8: Lyric / Syllable (contentEditable) ─────────────────────── */}
      {layer(LAYER_H.lyric,
        <SyllableCell
          syllable={note.syllable}
          lineId={lineId}
          noteIndex={noteIndex}
          isActive={isActive}
          fontSize={lyricFontSize}
        />
      )}

      {/* ── Tie ⌒ — busur di ATAS not (between chord/accent & overlines) ─────── */}
      {note.tied && (
        <div
          style={{
            position: 'absolute',
            top: LAYER_H.chord + LAYER_H.accent - 1,
            left: '5%',
            width: '90%',
            height: 7,
            borderTop: '2px solid #6366f1',
            borderRadius: '50% 50% 0 0',
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}

      {/* ── Slur ⌣ — busur di BAWAH not (between octaveLow & lyric) ─────────── */}
      {note.slurred && (
        <div
          style={{
            position: 'absolute',
            top: LAYER_H.chord + LAYER_H.accent + LAYER_H.octaveHigh + LAYER_H.overlines + LAYER_H.note + LAYER_H.octaveLow - 3,
            left: '5%',
            width: '90%',
            height: 7,
            borderBottom: '2px solid #3b82f6',
            borderRadius: '0 0 50% 50%',
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  );
}

// ─── BarLineCell ──────────────────────────────────────────────────────────────

const BAR_SYMBOLS: Record<string, string> = {
  single:         '|',
  double:         '‖',
  'repeat-start': '𝄆',
  'repeat-end':   '𝄇',
  final:          '𝄂',
  warning:        '┆',
};

interface BarLineCellProps {
  type: string;
  warning?: boolean;
  tooltip?: string;
}

/**
 * BarLineCell — matches the exact same layer structure as NoteCell
 * so the bar line symbol is always at the same vertical position as note digits.
 */
export function BarLineCell({ type, warning = false, tooltip }: BarLineCellProps) {
  const symbol = BAR_SYMBOLS[type] ?? '|';
  const color = warning
    ? '#f87171'
    : type === 'double'
    ? 'var(--music-accent)'
    : 'var(--music-barline)';

  return (
    <div
      style={{
        width: warning ? 18 : 16,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        pointerEvents: warning ? 'auto' : 'none',
        cursor: warning ? 'help' : 'default',
      }}
      title={tooltip || (warning ? 'Birama tidak lengkap / kelebihan ketukan' : undefined)}
    >
      {/* Mirror layers 1-3 (empty) so bar symbol aligns with note digit */}
      <div style={{ height: LAYER_H.chord }} />
      <div style={{ height: LAYER_H.accent }} />
      <div style={{ height: LAYER_H.octaveHigh }} />
      <div style={{ height: LAYER_H.overlines }} />

      {/* The bar symbol, aligned with the note digit layer */}
      <div style={{
        height: LAYER_H.note,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 20,
          fontWeight: 700,
          lineHeight: 1,
          color,
          animation: warning ? 'pulse 1.5s infinite' : undefined,
        }}>
          {symbol}
        </span>
      </div>

      {/* Mirror layers 6-7 (empty) for consistent height */}
      <div style={{ height: LAYER_H.octaveLow }} />
      <div style={{ height: LAYER_H.lyric }} />
    </div>
  );
}

// ─── SyllableCell ─────────────────────────────────────────────────────────────

function SyllableCell({
  syllable,
  lineId,
  noteIndex,
  isActive,
  fontSize,
}: {
  syllable: string;
  lineId: string;
  noteIndex: number;
  isActive: boolean;
  fontSize: number;
}) {
  const { updateSyllable } = useEditorStore();
  const [isFocused, setIsFocused] = React.useState(false);
  const spanRef = React.useRef<HTMLSpanElement>(null);

  const hasText = !!syllable && syllable.trim().length > 0;

  return (
    <div
      style={{
        width: '92%',
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        padding: '0 2px',
        transition: 'all 0.15s ease',
        background: isFocused
          ? 'rgba(99, 102, 241, 0.22)'
          : hasText
          ? 'transparent'
          : 'rgba(99, 102, 241, 0.08)',
        border: isFocused
          ? '1.5px solid #818cf8'
          : hasText
          ? '1px solid transparent'
          : '1px dashed rgba(129, 140, 248, 0.25)',
        boxShadow: isFocused ? '0 0 8px rgba(99, 102, 241, 0.45)' : 'none',
        cursor: 'text',
      }}
      onClick={(e) => {
        e.stopPropagation();
        spanRef.current?.focus();
      }}
    >
      <span
        ref={spanRef}
        contentEditable
        suppressContentEditableWarning
        style={{
          fontSize: hasText || isFocused ? fontSize : Math.max(9, fontSize - 1),
          color: isFocused
            ? '#ffffff'
            : isActive
            ? '#facc15'
            : hasText
            ? 'var(--music-lyric)'
            : '#818cf8',
          fontWeight: isFocused || isActive ? 600 : 400,
          fontStyle: !hasText && !isFocused ? 'italic' : 'normal',
          outline: 'none',
          minWidth: 10,
          textAlign: 'center',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          width: '100%',
        }}
        onFocus={(e) => {
          e.stopPropagation();
          setIsFocused(true);
          if (!hasText) {
            // Clear placeholder text on focus so user can type immediately
            e.currentTarget.textContent = '';
          }
        }}
        onBlur={(e) => {
          setIsFocused(false);
          const text = e.currentTarget.textContent?.trim() ?? '';
          if (text !== syllable) {
            updateSyllable(lineId, noteIndex, text);
          }
          if (!text) {
            e.currentTarget.textContent = '';
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
          }
        }}
      >
        {syllable || ''}
      </span>
    </div>
  );
}
