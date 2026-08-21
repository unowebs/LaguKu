'use client';

/**
 * LyricLineComponent — Grid-based renderer untuk satu baris lagu.
 *
 * Layout:
 *   ‖  [Measure 1]  |  [Measure 2]  |  [Measure 3]  |  …  [+]
 *
 * Setiap Measure adalah flex nowrap (tidak bisa terpotong saat wrap).
 * Baris secara keseluruhan adalah flex wrap, sehingga jika lebar
 * editor habis, measure berikutnya pindah ke baris baru.
 *
 * Semua NoteCell memiliki tinggi konstan (112px) sehingga:
 * - Chord, not, garis, dan lirik selalu sejajar
 * - Wrap tidak merusak alignment
 * - Zoom mengubah cellWidth saja, tidak merusak struktur
 */

import React, { useMemo, useEffect, useState } from 'react';
import { LyricLine as LyricLineType, NoteAngka } from '@/types';
import { NoteCell, BarLineCell, CELL_TOTAL_HEIGHT } from './NoteCell';
import { useEditorStore } from '@/store/editorStore';
import { getNoteDurationInBeats, getMeasureSizeInBeats } from '@/utils/noteAngka';

interface LyricLineProps {
  line: LyricLineType;
  lineIndex: number;
}

// ─── Measure data type ────────────────────────────────────────────────────────

interface MeasureData {
  notes: Array<{ note: NoteAngka; noteIndex: number }>;
  isComplete: boolean;
  isOverflow: boolean;   // birama kelebihan ketukan
  totalBeats: number;
  diff?: number;
  spaceRemaining?: number;
  lastNotePitch?: string;
  /** Manual bar types from barPositions (repeat-start, repeat-end, final) */
  endBarType?: 'single' | 'double' | 'repeat-start' | 'repeat-end' | 'final';
}

function getDurationHint(beats: number): string {
  if (beats <= 0) return '';
  if (beats === 4) return 'Not Penuh (whole)';
  if (beats === 3) return 'Not Setengah + Titik (dotted half)';
  if (beats === 2) return 'Not Setengah (half)';
  if (beats === 1.5) return 'Not Seperempat + Titik (dotted quarter)';
  if (beats === 1) return 'Not Seperempat (quarter)';
  if (beats === 0.75) return 'Not Seperdelapan + Titik (dotted eighth)';
  if (beats === 0.5) return 'Not Seperdelapan (eighth)';
  if (beats === 0.375) return 'Not Seperenambelas + Titik (dotted sixteenth)';
  if (beats === 0.25) return 'Not Seperenambelas (sixteenth)';
  return `${beats} ketukan`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LyricLineComponent({ line, lineIndex }: LyricLineProps) {
  const {
    selection,
    playbackLineIdx,
    playbackNoteIdx,
    setSelection,
    song,
    zoom,
    collaborators,
  } = useEditorStore();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const baseCellWidth = isMobile ? 34 : 40;
  const cellWidth = Math.max(isMobile ? 28 : 32, Math.round(baseCellWidth * (zoom / 100)));
  const measureSize = song ? getMeasureSizeInBeats(song.timeSignature) : 4;
  const isPlaybackLine = playbackLineIdx === lineIndex;

  // ── Group notes into measures ──────────────────────────────────────────────
  const measures = useMemo<MeasureData[]>(() => {
    if (line.notes.length === 0) return [];
    const result: MeasureData[] = [];
    let current: MeasureData = {
      notes: [],
      isComplete: false,
      isOverflow: false,
      totalBeats: 0,
    };

    line.notes.forEach((note, noteIdx) => {
      current.notes.push({ note, noteIndex: noteIdx });
      const beats = getNoteDurationInBeats(note);
      current.totalBeats += beats;

      const diff = current.totalBeats - measureSize;

      if (Math.abs(diff) < 0.001) {
        // Exactly complete
        current.isComplete = true;
        result.push(current);
        current = { notes: [], isComplete: false, isOverflow: false, totalBeats: 0 };
      } else if (diff > 0) {
        // Overflow — push and start fresh
        current.isOverflow = true;
        current.diff = diff;
        const beatsBeforeLast = current.totalBeats - beats;
        current.spaceRemaining = measureSize - beatsBeforeLast;
        current.lastNotePitch = note.isRest ? '0' : note.pitch;
        result.push(current);
        current = { notes: [], isComplete: false, isOverflow: false, totalBeats: 0 };
      }
    });

    // Tail (incomplete final measure)
    if (current.notes.length > 0) {
      result.push(current);
    }

    // Apply manual bar types from barPositions
    // (barPositions stores the note index before which a bar appears)
    // We translate these to the measure that ends before that note.
    // For now we just propagate repeat/final bar types to the nearest measure boundary.
    if (line.barPositions && line.barTypes) {
      line.barPositions.forEach((pos, i) => {
        const barType = line.barTypes[i];
        if (!barType || barType.type === 'single' || barType.type === 'double') return;
        // Find which measure ends just before note `pos`
        let accumulated = 0;
        for (let mi = 0; mi < result.length; mi++) {
          const m = result[mi];
          if (pos <= accumulated + m.notes.length) {
            result[mi].endBarType = barType.type;
            break;
          }
          accumulated += m.notes.length;
        }
      });
    }

    return result;
  }, [line.notes, line.barPositions, line.barTypes, measureSize]);

  // ── Selection helper ───────────────────────────────────────────────────────
  const isNoteSelected = (noteIndex: number) => {
    if (!selection || selection.lineId !== line.id || selection.noteIndex === undefined) return false;
    if (selection.noteIndexEnd !== undefined) {
      return noteIndex >= Math.min(selection.noteIndex, selection.noteIndexEnd) &&
             noteIndex <= Math.max(selection.noteIndex, selection.noteIndexEnd);
    }
    return selection.noteIndex === noteIndex;
  };

  // ── Collaborator cursors ───────────────────────────────────────────────────
  const collabsAtNote = (noteIndex: number) =>
    (collaborators ?? []).filter(
      (c) => c.cursor?.lineId === line.id && c.cursor?.noteIndex === noteIndex
    );

  // ── Final incomplete measure warning ───────────────────────────────────────
  const lastMeasure = measures[measures.length - 1];
  const showIncompleteWarning =
    lastMeasure &&
    !lastMeasure.isComplete &&
    !lastMeasure.isOverflow &&
    lastMeasure.notes.length > 0;

  const getWarningTooltip = (m: MeasureData) => {
    if (!m.isOverflow || m.diff === undefined || m.spaceRemaining === undefined) return undefined;
    const diffStr = m.diff.toFixed(2).replace(/\.?0+$/, '');
    const totalStr = m.totalBeats.toFixed(2).replace(/\.?0+$/, '');
    const spaceStr = m.spaceRemaining.toFixed(2).replace(/\.?0+$/, '');
    const lastPitch = m.lastNotePitch ?? '';
    const hint = getDurationHint(m.spaceRemaining);
    const hintStr = hint ? ` (${hint})` : '';

    return `⚠️ Birama Kelebihan Ketukan!\n` +
      `Total: ${totalStr} dari maksimal ${measureSize} ketukan (kelebihan ${diffStr} ketukan).\n\n` +
      `Cara memperbaiki agar garis merah hilang:\n` +
      `- Ubah durasi not terakhir '${lastPitch}' menjadi ${spaceStr} ketukan${hintStr}, ATAU\n` +
      `- Kurangi total durasi pada birama ini sebesar ${diffStr} ketukan.`;
  };

  return (
    <div
      className="song-line group relative"
      style={{ marginBottom: 32 }}
    >
      {/* Line label */}
      {line.label && (
        <span style={{
          display: 'block',
          fontSize: 11,
          color: 'var(--music-muted)',
          fontStyle: 'italic',
          marginBottom: 4,
        }}>
          {line.label}
        </span>
      )}

      {/* ── Note grid row ──────────────────────────────────────────────────── */}
      {/* paddingLeft: BAR_WIDTH (18) + marginLeft: -BAR_WIDTH on ALL measures   */}
      {/* ensures every visual row (including wrapped rows) starts at the same   */}
      {/* horizontal position as row 1. Adjacent bars overlap on the same row.   */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        rowGap: 8,
        paddingLeft: 18,
      }}>

        {/* Measures */}
        {measures.map((measure, mi) => {
          const firstNoteItem = measure.notes[0];
          const lastNoteItem = measure.notes[measure.notes.length - 1];
          const startNoteIdx = firstNoteItem ? firstNoteItem.noteIndex : 0;
          const endNoteIdx = lastNoteItem ? lastNoteItem.noteIndex + 1 : 0;

          // Start bar
          const startManualBarIdx = line.barPositions ? line.barPositions.indexOf(startNoteIdx) : -1;
          const startManualBar = startManualBarIdx >= 0 ? line.barTypes[startManualBarIdx] : null;
          const startBarType = mi === 0 ? (line.startBarType ?? 'single') : (startManualBar?.type ?? 'single');
          const isStartBarSelected = selection?.lineId === line.id && (
            mi === 0 ? !!selection?.isStartBar : selection?.barPosition === startNoteIdx
          );

          // End bar
          const endManualBarIdx = line.barPositions ? line.barPositions.indexOf(endNoteIdx) : -1;
          const endManualBar = endManualBarIdx >= 0 ? line.barTypes[endManualBarIdx] : null;
          const endBarType = measure.isOverflow ? 'warning' : (endManualBar?.type ?? (measure.endBarType ?? 'single'));
          const isEndBarSelected = selection?.lineId === line.id && selection?.barPosition === endNoteIdx;

          // BAR_WIDTH must match BarLineCell width (18px).
          // ALL measures (including mi=0) have marginLeft: -BAR_WIDTH.
          // Container paddingLeft: BAR_WIDTH compensates, so every row
          // (and every wrapped row) starts at the same left position.
          const BAR_WIDTH = 18;

          return (
            <React.Fragment key={mi}>
              {/* Atomic measure block: [start-bar][notes][end-bar]
                  marginLeft: -BAR_WIDTH applied to ALL measures so that:
                  - Same row: start bar overlaps previous end bar (looks like one bar) ✓
                  - Wrapped row: paddingLeft(18) - marginLeft(-18) = 0 → aligns with row 1 ✓ */}
              <div style={{
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'flex-start',
                position: 'relative',
                marginLeft: -BAR_WIDTH,
              }}>
                {/* Start bar line */}
                <BarLineCell
                  type={startBarType}
                  isSelected={isStartBarSelected}
                  repeatCount={mi > 0 ? startManualBar?.repeatCount : undefined}
                  repeatLabel={mi > 0 ? startManualBar?.repeatLabel : undefined}
                  onClick={() => {
                    if (mi === 0) {
                      setSelection({ lineId: line.id, isStartBar: true });
                    } else {
                      useEditorStore.getState().insertBarLine(line.id, startNoteIdx, startManualBar?.type ?? 'single');
                      setSelection({ lineId: line.id, barPosition: startNoteIdx });
                    }
                  }}
                />

                {/* Notes in measure */}
                {measure.notes.map(({ note, noteIndex }, idxInMeasure) => {
                  const isActive = isPlaybackLine && playbackNoteIdx === noteIndex;
                  const isSelected = isNoteSelected(noteIndex);
                  const noteCollabs = collabsAtNote(noteIndex);

                  const prevNote = idxInMeasure > 0 ? measure.notes[idxInMeasure - 1].note : null;
                  const nextNote = idxInMeasure < measure.notes.length - 1 ? measure.notes[idxInMeasure + 1].note : null;

                  return (
                    <React.Fragment key={note.id}>
                      <div style={{ position: 'relative', width: 'fit-content', minWidth: cellWidth, flexShrink: 0 }}>
                        {/* Collaborator cursors */}
                        {noteCollabs.map((c) => (
                          <span
                            key={c.userId}
                            style={{
                              position: 'absolute',
                              top: -20,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: 8,
                              fontWeight: 700,
                              color: '#fff',
                              background: c.color,
                              padding: '1px 4px',
                              borderRadius: 4,
                              whiteSpace: 'nowrap',
                              zIndex: 10,
                              pointerEvents: 'none',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            }}
                          >
                            {c.name}
                          </span>
                        ))}

                        <NoteCell
                          note={note}
                          noteIndex={noteIndex}
                          lineId={line.id}
                          cellWidth={cellWidth}
                          isActive={isActive}
                          isSelected={isSelected}
                          prevNote={prevNote}
                          nextNote={nextNote}
                          onClick={(e) => {
                            if (e.shiftKey && selection?.lineId === line.id && selection?.noteIndex !== undefined) {
                              setSelection({
                                lineId: line.id,
                                noteIndex: selection.noteIndex,
                                noteIndexEnd: noteIndex,
                              });
                            } else {
                              setSelection({ lineId: line.id, noteIndex });
                            }
                          }}
                        />
                      </div>

                      {/* Independent Repeat Symbol (𝄆 or 𝄇) attached after this note */}
                      {note.repeatAfter && (
                        <BarLineCell
                          type={note.repeatAfter}
                          repeatCount={note.repeatCount}
                          repeatLabel={note.repeatLabel}
                          isSelected={isSelected}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelection({ lineId: line.id, noteIndex });
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

                {/* End bar line — always rendered so every row (including wrapped) ends with | */}
                <BarLineCell
                  type={endBarType}
                  warning={measure.isOverflow}
                  tooltip={getWarningTooltip(measure)}
                  isSelected={isEndBarSelected}
                  repeatCount={endManualBar?.repeatCount}
                  repeatLabel={endManualBar?.repeatLabel}
                  onClick={() => {
                    useEditorStore.getState().insertBarLine(line.id, endNoteIdx, endManualBar?.type ?? 'single');
                    setSelection({ lineId: line.id, barPosition: endNoteIdx });
                  }}
                />
              </div>
            </React.Fragment>
          );
        })}

        {/* Empty line placeholder */}
        {line.notes.length === 0 && (
          <div style={{
            height: CELL_TOTAL_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 8,
            color: 'var(--music-muted)',
            fontSize: 12,
            fontStyle: 'italic',
            opacity: 0.5,
          }}>
            Klik tombol + untuk menambah not…
          </div>
        )}

        {/* + Add note button */}
        <AddNoteButton
          lineId={line.id}
          noteCount={line.notes.length}
          cellHeight={CELL_TOTAL_HEIGHT}
        />
      </div>

      {/* ── Incomplete measure warning ──────────────────────────────────────── */}
      {showIncompleteWarning && song && (
        <div style={{
          marginTop: 4,
          fontSize: 10,
          color: '#fbbf24',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontWeight: 500,
          userSelect: 'none',
        }}>
          ⚠️ Birama belum lengkap: {lastMeasure.totalBeats.toFixed(2).replace(/\.?0+$/, '')}
          {' '}/{' '}{measureSize} ketukan
        </div>
      )}
    </div>
  );
}

// ─── AddNoteButton ────────────────────────────────────────────────────────────

function AddNoteButton({
  lineId,
  noteCount,
  cellHeight,
}: {
  lineId: string;
  noteCount: number;
  cellHeight: number;
}) {
  const { insertNote } = useEditorStore();

  return (
    <button
      style={{
        height: cellHeight,
        width: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        cursor: 'pointer',
        border: '1px dashed var(--music-muted)',
        borderRadius: 4,
        background: 'transparent',
        color: 'var(--music-muted)',
        fontSize: 16,
        transition: 'opacity 0.15s, color 0.15s, border-color 0.15s',
        flexShrink: 0,
        marginLeft: 4,
      }}
      className="add-note-btn"
      onClick={() => insertNote(lineId, noteCount, '0')}
      title="Tambah rest (0) di akhir baris"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '1';
        (e.currentTarget as HTMLElement).style.color = 'var(--music-accent)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--music-accent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '0';
        (e.currentTarget as HTMLElement).style.color = 'var(--music-muted)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--music-muted)';
      }}
    >
      +
    </button>
  );
}
