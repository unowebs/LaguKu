'use client';

import React, { useState, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { usePlayer } from '@/hooks/usePlayer';
import Link from 'next/link';
import {
  Play, Square, SkipBack, ChevronUp, ChevronDown,
  Download, Upload, ZoomIn, ZoomOut,
  Minus, Plus, FileJson, FileText, FileImage, Trash2, ArrowLeft
} from 'lucide-react';
import { NotePitch, InstrumentName, MusicalKey, Song, NoteDuration, NoteOctave, NoteAngka } from '@/types';
import toast from 'react-hot-toast';
import { getNoteDurationInBeats, getMeasureSizeInBeats } from '@/utils/noteAngka';

const KEYS: MusicalKey[] = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
];

const INSTRUMENTS: { value: InstrumentName; label: string }[] = [
  { value: 'piano', label: '🎹 Piano' },
  { value: 'organ', label: '🎷 Organ' },
  { value: 'strings', label: '🎻 Strings' },
  { value: 'choirPad', label: '🎵 Choir Pad' },
  { value: 'flute', label: '🪈 Flute' },
  { value: 'violin', label: '🎻 Violin' },
  { value: 'guitar', label: '🎸 Guitar' },
  { value: 'musicBox', label: '🎼 Music Box' },
];

type ToolbarTab = 'notes' | 'duration' | 'symbols' | 'structure' | 'playback';

export function MainToolbar() {
  const [activeTab, setActiveTab] = useState<ToolbarTab>('notes');
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [insertMode, setInsertMode] = useState<'replace' | 'insert-before' | 'insert-after'>('replace');
  const importRef = useRef<HTMLInputElement>(null);

  const {
    song,
    selection,
    zoom,
    instrument,
    isDirty,
    isSaving,
    lastSaved,
    defaultDuration,
    setZoom,
    setInstrument,
    setDefaultDuration,
    insertNote,
    insertDotNote,
    updateNote,
    updateNoteRange,
    deleteNote,
    insertBarLine,
    transposeUp,
    transposeDown,
    updateSongMeta,
    setSongData,
    setSelection,
  } = useEditorStore();



  const { isPlaying, togglePlay, stop } = usePlayer();

  const tabs: { id: ToolbarTab; label: string }[] = [
    { id: 'notes', label: 'Not' },
    { id: 'duration', label: 'Durasi' },
    { id: 'symbols', label: 'Simbol' },
    { id: 'structure', label: 'Struktur' },
    { id: 'playback', label: 'Playback' },
  ];

  // Insert/Replace note
  // - replace      : ubah nada not yang sedang dipilih
  // - insert-before: sisipkan not baru SEBELUM not yang dipilih
  // - insert-after : sisipkan not baru SESUDAH not yang dipilih
  // Jika tidak ada selection → append ke akhir baris terakhir
  const insertNoteAtSelection = (pitch: NotePitch) => {
    if (!song) return;
    if (selection && selection.noteIndex !== undefined) {
      if (insertMode === 'replace') {
        updateNote(selection.lineId, selection.noteIndex, {
          pitch,
          isRest: pitch === '0',
          isDot: false,
        });
        toast.success(`Not diubah ke ${pitch === '0' ? 'Rest (0)' : pitch}`, { id: 'change-note' });
      } else if (insertMode === 'insert-before') {
        insertNote(selection.lineId, selection.noteIndex, pitch);
        toast.success(`Not ${pitch === '0' ? 'Rest' : pitch} disisipkan sebelum not terpilih`, { id: 'insert-note' });
      } else {
        // insert-after
        insertNote(selection.lineId, selection.noteIndex + 1, pitch);
        setSelection({ lineId: selection.lineId, noteIndex: selection.noteIndex + 1 });
        toast.success(`Not ${pitch === '0' ? 'Rest' : pitch} disisipkan setelah not terpilih`, { id: 'insert-note' });
      }
    } else {
      const lines = song.content.lines;
      if (lines.length === 0) return;
      const lastLine = lines[lines.length - 1];
      insertNote(lastLine.id, lastLine.notes.length, pitch);
    }
  };

  const insertDotAtSelection = () => {
    if (!song) return;
    if (selection && selection.noteIndex !== undefined) {
      if (insertMode === 'insert-before') {
        insertDotNote(selection.lineId, selection.noteIndex);
        toast.success('Not titik (.) disisipkan sebelum not terpilih', { id: 'insert-dot' });
      } else {
        // default: insert after (titik umumnya mengikuti not sebelumnya)
        insertDotNote(selection.lineId, selection.noteIndex + 1);
        setSelection({ lineId: selection.lineId, noteIndex: selection.noteIndex + 1 });
        toast.success('Not titik (.) disisipkan setelah not terpilih', { id: 'insert-dot' });
      }
    } else {
      const lines = song.content.lines;
      if (lines.length === 0) return;
      const lastLine = lines[lines.length - 1];
      insertDotNote(lastLine.id, lastLine.notes.length);
    }
  };

  const applyToSelection = (updates: Parameters<typeof updateNote>[2]) => {
    if (!song || !selection || selection.noteIndex === undefined) return;
    updateNote(selection.lineId, selection.noteIndex, updates);
  };

  const deleteSelectedNote = () => {
    if (!song || !selection || selection.noteIndex === undefined) return;
    deleteNote(selection.lineId, selection.noteIndex);
    useEditorStore.getState().setSelection(null);
  };

  const applyOctave = (octave: NoteOctave) => {
    if (!song || !selection || selection.noteIndex === undefined) return;
    updateNote(selection.lineId, selection.noteIndex, { octave });
  };

  const addBarAtSelection = (type: 'single' | 'double' | 'repeat-start' | 'repeat-end' | 'final' = 'single') => {
    if (!song || !selection) return;
    if (selection.isStartBar) {
      updateStartBarType(selection.lineId, type);
    } else {
      const pos = selection.barPosition !== undefined ? selection.barPosition : (selection.noteIndex !== undefined ? selection.noteIndex + 1 : 0);
      insertBarLine(selection.lineId, pos, type);
      setSelection({ lineId: selection.lineId, barPosition: pos });
    }
  };

  const getSelectedNote = (): NoteAngka | null => {
    if (!song || !selection || selection.noteIndex === undefined) return null;
    const line = song.content.lines.find((l) => l.id === selection.lineId);
    return line?.notes[selection.noteIndex] || null;
  };

  const toggleSelectionProperty = (property: 'tied' | 'slurred' | 'staccato' | 'accent' | 'fermata') => {
    if (!song || !selection || selection.noteIndex === undefined) return;

    const line = song.content.lines.find((l) => l.id === selection.lineId);
    if (!line) return;

    const minIdx = selection.noteIndexEnd !== undefined ? Math.min(selection.noteIndex, selection.noteIndexEnd) : selection.noteIndex;
    const maxIdx = selection.noteIndexEnd !== undefined ? Math.max(selection.noteIndex, selection.noteIndexEnd) : selection.noteIndex;

    const isRange = minIdx !== maxIdx;

    if (isRange && (property === 'tied' || property === 'slurred')) {
      const rangeNotes = line.notes.slice(minIdx, maxIdx + 1);

      if (property === 'tied') {
        // Tie must connect notes of the same pitch
        const firstPitch = rangeNotes[0].pitch;
        const allSamePitch = rangeNotes.every((n) => n.pitch === firstPitch);
        if (!allSamePitch) {
          toast.error('Tie hanya boleh menghubungkan not dengan nada yang sama');
          return;
        }

        // Toggle logic: if already tied, untie
        const alreadyTied = rangeNotes[0].tied;
        updateNoteRange(selection.lineId, minIdx, maxIdx, (n, idx) => {
          if (alreadyTied) {
            return { tied: false };
          } else {
            return {
              tied: idx < maxIdx, // all but the last note are tied to the next one
              slurred: false, // mutually exclusive
            };
          }
        });
        toast.success(alreadyTied ? 'Tie dihapus' : 'Tie berhasil dipasang');
      } else {
        // Slur connects different notes (or any sequential notes)
        const alreadySlurred = rangeNotes[0].slurred;
        updateNoteRange(selection.lineId, minIdx, maxIdx, (n, idx) => {
          if (alreadySlurred) {
            return { slurred: false };
          } else {
            return {
              slurred: idx < maxIdx, // slurs connect from idx to next
              tied: false, // mutually exclusive
            };
          }
        });
        toast.success(alreadySlurred ? 'Slur dihapus' : 'Slur/Legato berhasil dipasang');
      }
    } else {
      // Single selection or other properties
      const note = line.notes[selection.noteIndex];
      if (!note) return;
      updateNote(selection.lineId, selection.noteIndex, { [property]: !note[property] });
    }
  };

  const toggleSelectionDynamics = (dynamics: 'crescendo' | 'diminuendo') => {
    if (!song || !selection || selection.noteIndex === undefined) return;
    const note = getSelectedNote();
    if (!note) return;
    updateNote(selection.lineId, selection.noteIndex, {
      dynamics: note.dynamics === dynamics ? undefined : dynamics
    });
  };

  const generateAlignedLinesText = () => {
    if (!song) return '';
    const resultLines: string[] = [];
    const measureSize = getMeasureSizeInBeats(song.timeSignature);

    song.content.lines.forEach((line) => {
      if (line.label) {
        resultLines.push(`[${line.label}]`);
      }

      interface AlignedCell {
        chord: string;
        accent: string;         // fermata / accent / staccato marker
        octaveDotAbove: string;  // dot above for high octave
        overline1: string;       // overline for half note
        overline2: string;       // second overline for whole note
        note: string;            // pitch digit (or '.') + dotted dot only
        octaveDotBelow: string;  // dot below for low octave
        tieSlur: string;         // tie/slur indicator below
        lyric: string;
        isBarLine: boolean;
      }

      const emptyCell = (): AlignedCell => ({
        chord: '', accent: '', octaveDotAbove: '', overline1: '', overline2: '',
        note: '', octaveDotBelow: '', tieSlur: '', lyric: '', isBarLine: false,
      });

      const barCell = (sym: string): AlignedCell => ({
        ...emptyCell(), note: sym, isBarLine: true,
      });

      const cells: AlignedCell[] = [];

      // Initial single bar line
      if (line.notes.length > 0) {
        cells.push(barCell('|'));
      }

      let cumulativeBeats = 0;

      line.notes.forEach((note, noteIdx) => {
        const cell = emptyCell();

        // Note character — not titik tampil sebagai '.', otherwise digit
        if (note.isDot) {
          cell.note = '.';
        } else {
          let noteStr: string = note.isRest ? '0' : note.pitch;
          if (note.dotted) noteStr = `${noteStr}.`;
          cell.note = noteStr;
        }

        // Accent row (fermata > accent > staccato priority) — skip for dot notes
        if (!note.isDot) {
          if (note.fermata) cell.accent = 'f';
          else if (note.accent) cell.accent = '>';
          else if (note.staccato) cell.accent = '.';
        }

        // Octave indicators — skip for dot notes
        if (!note.isRest && !note.isDot) {
          if (note.octave === 'high') cell.octaveDotAbove = '.';
          if (note.octave === 'low') cell.octaveDotBelow = '.';
        }

        // Overlines (1 line = setengah ketuk / eighth, 2 lines = seperempat ketuk / sixteenth)
        if (note.overlines >= 1 || note.duration === 'eighth') {
          cell.overline1 = '-';
        }
        if (note.overlines >= 2 || note.duration === 'sixteenth') {
          cell.overline2 = '-';
        }

        // Tie / Slur
        if (note.tied) cell.tieSlur = '~';
        else if (note.slurred) cell.tieSlur = '^';

        cell.chord = note.chord || '';
        cell.lyric = note.isDot ? '' : (note.syllable || '');

        cells.push(cell);

        const beats = getNoteDurationInBeats(note);
        cumulativeBeats += beats;

        // Bar lines
        const hasManualBarNext = line.barPositions?.includes(noteIdx + 1);
        const nextBarType = hasManualBarNext ? line.barTypes[line.barPositions.indexOf(noteIdx + 1)]?.type : null;

        if (nextBarType && nextBarType !== 'single' && nextBarType !== 'double') {
          const barSymbols: Record<string, string> = {
            'repeat-start': '||:',
            'repeat-end': ':||',
            final: '||',
          };
          cells.push(barCell(barSymbols[nextBarType] || '|'));
        } else if (Math.abs(cumulativeBeats - measureSize) < 0.01) {
          cells.push(barCell('|'));
          cumulativeBeats = 0;
        } else if (cumulativeBeats > measureSize) {
          cells.push(barCell('|'));
          cumulativeBeats = 0;
        }
      });

      if (cells.length > 0) {
        // Calculate padded widths based on all row content
        const paddedCells = cells.map((cell) => {
          const maxLen = Math.max(
            cell.chord.length, cell.accent.length,
            cell.octaveDotAbove.length, cell.overline1.length, cell.overline2.length,
            cell.note.length,
            cell.octaveDotBelow.length, cell.tieSlur.length,
            cell.lyric.length, 1
          );
          return {
            chord:          cell.chord.padEnd(maxLen, ' '),
            accent:         cell.accent.padEnd(maxLen, ' '),
            octaveDotAbove: cell.octaveDotAbove.padEnd(maxLen, ' '),
            overline1:      cell.overline1.padEnd(maxLen, ' '),
            overline2:      cell.overline2.padEnd(maxLen, ' '),
            note:           cell.note.padEnd(maxLen, ' '),
            octaveDotBelow: cell.octaveDotBelow.padEnd(maxLen, ' '),
            tieSlur:        cell.tieSlur.padEnd(maxLen, ' '),
            lyric:          cell.lyric.padEnd(maxLen, ' '),
            isBarLine:      cell.isBarLine,
          };
        });

        let chordRow = '', accentRow = '', dotAboveRow = '';
        let over1Row = '', over2Row = '';
        let noteRow = '';
        let dotBelowRow = '', tieSlurRow = '', lyricRow = '';

        paddedCells.forEach((c) => {
          const sep = c.isBarLine ? '' : '  ';
          chordRow     += c.chord + sep;
          accentRow    += c.accent + sep;
          dotAboveRow  += c.octaveDotAbove + sep;
          over1Row     += c.overline1 + sep;
          over2Row     += c.overline2 + sep;
          noteRow      += c.note + sep;
          dotBelowRow  += c.octaveDotBelow + sep;
          tieSlurRow   += c.tieSlur + sep;
          lyricRow     += c.lyric + sep;
        });

        const has = (field: keyof AlignedCell) => cells.some((c) => c[field]);

        // Output rows top-to-bottom matching editor layer order:
        // chord → accent → dot above → overlines → NOTE → dot below → tie/slur → lyric
        if (has('chord'))          resultLines.push(chordRow.trimEnd());
        if (has('accent'))         resultLines.push(accentRow.trimEnd());
        if (has('octaveDotAbove')) resultLines.push(dotAboveRow.trimEnd());
        if (has('overline2'))      resultLines.push(over2Row.trimEnd());
        if (has('overline1'))      resultLines.push(over1Row.trimEnd());
        resultLines.push(noteRow.trimEnd());
        if (has('octaveDotBelow')) resultLines.push(dotBelowRow.trimEnd());
        if (has('tieSlur'))        resultLines.push(tieSlurRow.trimEnd());
        if (has('lyric'))          resultLines.push(lyricRow.trimEnd());
        resultLines.push('');
      }
    });

    return resultLines.join('\n');
  };

  // Helper to trigger showSaveFilePicker if available, falling back to standard link download
  const saveFilePickerDownload = async (
    suggestedName: string,
    content: BlobPart | Blob,
    mimeType: string,
    extension: string,
    description: string
  ) => {
    // Avoid double wrapping if content is already a Blob
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });

    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const win = window as unknown as {
          showSaveFilePicker: (opts: unknown) => Promise<{
            createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }>;
          }>;
        };
        const handle = await win.showSaveFilePicker({
          suggestedName,
          types: [{
            description,
            accept: {
              [mimeType]: [extension],
            },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (err: unknown) {
        const error = err as { name?: string; message?: string };
        if (error.name === 'AbortError') {
          // User cancelled the save dialog
          return false;
        }
        console.error('SaveFilePicker error:', err);
        toast.error(`Metode simpan langsung gagal: ${error.message || String(err)}`);
        // Attempt fallback, but notify user in case browser blocks the async click
        toast.loading('Mencoba mengunduh otomatis ke folder Downloads...', { id: 'fallback-dl', duration: 3000 });
      }
    }

    // Fallback to classic link download
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Fallback download error:', err);
      toast.error(`Gagal mengunduh berkas: ${error.message || String(err)}`);
      return false;
    }
  };

  // Export JSON
  const exportJSON = async () => {
    if (!song) return;
    const jsonStr = JSON.stringify(song, null, 2);
    const success = await saveFilePickerDownload(
      `${song.title || 'lagu'}.json`,
      jsonStr,
      'application/json',
      '.json',
      'JSON Backup File (.json)'
    );
    if (success) {
      toast.success('Backup proyek (.json) berhasil diunduh!');
    }
  };

  // Export as Text (.txt)
  const exportText = async () => {
    if (!song) return;
    const textContent = generateAlignedLinesText();
    let text = `${song.title}\n`;
    text += `Pencipta: ${song.composer}\n`;
    text += `Nada Dasar: Do = ${song.key}\n`;
    text += `Birama: ${song.timeSignature}  Tempo: ${song.tempo} BPM\n`;
    text += `${'─'.repeat(50)}\n\n`;
    text += textContent;

    const success = await saveFilePickerDownload(
      `${song.title || 'lagu'}.txt`,
      text,
      'text/plain',
      '.txt',
      'Text File (.txt)'
    );
    if (success) {
      toast.success('Berkas teks (.txt) berhasil diunduh!');
    }
  };

  // Export as Word Document (.doc)
  const exportWord = async () => {
    if (!song) return;
    const textContent = generateAlignedLinesText();
    
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${song.title}</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11pt;
            line-height: 1.3;
            margin: 1in;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .title {
            font-size: 18pt;
            font-weight: bold;
            text-transform: uppercase;
          }
          .meta {
            font-size: 10pt;
            color: #555555;
            margin-bottom: 4px;
          }
          .divider {
            border-bottom: 1.5pt solid #000000;
            margin-bottom: 20px;
          }
          pre {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11pt;
            margin: 0;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${song.title}</div>
          <div class="meta">Pencipta: ${song.composer || 'Anonim'} | Nada Dasar: Do = ${song.key}</div>
          <div class="meta">Birama: ${song.timeSignature} | Tempo: ${song.tempo} BPM</div>
        </div>
        <div class="divider"></div>
        <pre>${textContent}</pre>
      </body>
      </html>
    `;

    const success = await saveFilePickerDownload(
      `${song.title || 'lagu'}.doc`,
      '\ufeff' + htmlContent,
      'application/msword',
      '.doc',
      'Word Document (.doc)'
    );
    if (success) {
      toast.success('Word document (.doc) berhasil diunduh!');
    }
  };

  // Helper to prepare clean paper canvas snapshot for PDF/Image export
  const captureCleanPaperCanvas = async () => {
    const editorElement = document.getElementById('song-editor');
    if (!editorElement) {
      throw new Error('Elemen editor tidak ditemukan');
    }

    const htmlEl = document.documentElement;
    const originalTheme = htmlEl.getAttribute('data-theme') || 'dark';
    const originalZoom = useEditorStore.getState().zoom;
    const originalSelection = useEditorStore.getState().selection;

    // Temporarily adjust settings for clean, high-fidelity capture
    useEditorStore.getState().setSelection(null);
    useEditorStore.getState().setZoom(100);
    htmlEl.setAttribute('data-theme', 'light');

    // Add exporting class to strip shadow, rounded corners, outer borders, and hide action buttons
    editorElement.classList.add('exporting');

    const prevTransform = editorElement.style.transform;
    const prevMarginBottom = editorElement.style.marginBottom;
    editorElement.style.transform = 'none';
    editorElement.style.marginBottom = '0px';

    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(editorElement, {
        scale: 3, // Render 3x crisp resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
        ignoreElements: (el) => {
          return (
            (el.tagName === 'BUTTON' && el.textContent?.includes('Tambah Baris')) ||
            el.classList?.contains('add-note-btn')
          );
        },
      });
      return canvas;
    } finally {
      // Revert styles & classes
      editorElement.classList.remove('exporting');
      editorElement.style.transform = prevTransform;
      editorElement.style.marginBottom = prevMarginBottom;

      htmlEl.setAttribute('data-theme', originalTheme);
      useEditorStore.getState().setZoom(originalZoom);
      if (originalSelection) {
        useEditorStore.getState().setSelection(originalSelection);
      }
    }
  };

  // Export as PDF Document (.pdf) - Full A4 1 Lembar 0-margin
  const exportPDF = async () => {
    if (!song) return;
    const loadingToast = toast.loading('Sedang menyiapkan dokumen PDF...');
    try {
      const canvas = await captureCleanPaperCanvas();
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);

      const pageWidth = 210;  // A4 width in mm
      const pageHeight = 297; // A4 height in mm

      const imgWidth = pageWidth; // Full 210mm page width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Page 1 — full edge-to-edge 0 margin
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add extra pages seamlessly if song height exceeds 1 page
      while (heightLeft > 0) {
        position -= pageHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = doc.output('blob');
      const success = await saveFilePickerDownload(
        `${song.title || 'lagu'}.pdf`,
        pdfBlob,
        'application/pdf',
        '.pdf',
        'PDF Document (.pdf)'
      );

      toast.dismiss(loadingToast);
      if (success) {
        toast.success('Dokumen PDF berhasil diunduh (Full 1 Lembar A4)!');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(`Gagal mengunduh PDF: ${error.message || String(err)}`);
    }
  };

  // Export as PNG or JPEG Image
  const exportImage = async (format: 'png' | 'jpeg') => {
    if (!song) return;
    const formatName = format === 'png' ? 'PNG' : 'JPEG';
    const loadingToast = toast.loading(`Sedang menyiapkan gambar ${formatName}...`);
    try {
      const canvas = await captureCleanPaperCanvas();
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const extension = format === 'png' ? '.png' : '.jpg';

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            toast.dismiss(loadingToast);
            toast.error(`Gagal membuat gambar ${formatName}`);
            return;
          }
          const success = await saveFilePickerDownload(
            `${song.title || 'lagu'}${extension}`,
            blob,
            mimeType,
            extension,
            `Gambar ${formatName} (*${extension})`
          );
          toast.dismiss(loadingToast);
          if (success) {
            toast.success(`Gambar ${formatName} berhasil diunduh!`);
          }
        },
        mimeType,
        0.98
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(`Gagal mengunduh gambar: ${error.message || String(err)}`);
    }
  };

  // Import JSON — load into store
  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Song;
        if (parsed?.content?.lines) {
          setSongData(parsed);

          import('react-hot-toast').then(({ default: toast }) =>
            toast.success('Lagu berhasil diimpor!')
          );
        } else {
          throw new Error('Invalid format');
        }
      } catch {
        import('react-hot-toast').then(({ default: toast }) =>
          toast.error('Format file tidak valid')
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Save status label
  const saveLabel = isSaving
    ? '● Menyimpan...'
    : isDirty
      ? '● Belum disimpan'
      : lastSaved
        ? `✓ Tersimpan`
        : '✓ Tersimpan';

  return (
    <div className="toolbar-container border-b" style={{ borderColor: 'var(--music-border)', background: 'var(--music-surface)' }}>
      {/* Top action bar */}
      <div className="toolbar-top-bar flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {/* Back Button */}
        <Link href="/dashboard" className="toolbar-btn flex items-center gap-1.5 px-3 py-1 text-xs" style={{ background: 'rgba(255,255,255,0.03)' }} title="Kembali ke Dashboard">
          <ArrowLeft size={13} />
          <span>Kembali</span>
        </Link>

        <div className="w-px h-4 mx-1" style={{ background: 'var(--music-border)' }} />

        {/* Save status */}
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: isDirty ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)',
            color: isDirty ? '#facc15' : '#4ade80',
          }}>
          {saveLabel}
        </span>

        <div className="flex-1" />

        {/* Zoom */}
        <div className="toolbar-zoom-controls flex items-center gap-1">
          <button onClick={() => setZoom(zoom - 10)} className="toolbar-btn" title="Perkecil">
            <ZoomOut size={14} />
          </button>
          <span className="text-xs w-10 text-center" style={{ color: 'var(--music-muted)' }}>{zoom}%</span>
          <button onClick={() => setZoom(zoom + 10)} className="toolbar-btn" title="Perbesar">
            <ZoomIn size={14} />
          </button>
        </div>

        <div className="w-px h-5" style={{ background: 'var(--music-border)' }} />

        {/* Export / Download Dropdown */}
        <div className="relative">
          <button 
            className="toolbar-btn flex items-center gap-1" 
            title="Download Lagu"
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
            style={{ 
              color: showDownloadDropdown ? 'var(--music-accent)' : undefined,
              borderColor: showDownloadDropdown ? 'var(--music-accent)' : undefined 
            }}
          >
            <Download size={14} />
            <ChevronDown size={10} />
          </button>
          
          {showDownloadDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDownloadDropdown(false)} 
              />
              <div 
                className="absolute right-0 mt-1 w-52 rounded-md shadow-lg z-50 border flex flex-col overflow-hidden"
                style={{ 
                  background: 'var(--music-surface)', 
                  borderColor: 'var(--music-border)',
                }}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-music-muted uppercase border-b" style={{ borderColor: 'var(--music-border)' }}>
                  Pilih Format Unduhan
                </div>
                
                <button
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-white/5 transition-colors text-music-text"
                  onClick={() => {
                    exportText();
                    setShowDownloadDropdown(false);
                  }}
                >
                  <FileText size={14} className="text-blue-400 shrink-0" />
                  <span>Berkas Teks (.txt)</span>
                </button>

                <button
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-white/5 transition-colors text-music-text"
                  onClick={() => {
                    exportWord();
                    setShowDownloadDropdown(false);
                  }}
                >
                  <span className="text-[11px] font-bold text-blue-500 w-3.5 text-center shrink-0 leading-none">W</span>
                  <span>Dokumen Word (.doc)</span>
                </button>

                <button
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-white/5 transition-colors text-music-text"
                  onClick={() => {
                    exportPDF();
                    setShowDownloadDropdown(false);
                  }}
                >
                  <span className="text-[11px] font-bold text-red-500 w-3.5 text-center shrink-0 leading-none">P</span>
                  <span>Dokumen PDF (.pdf)</span>
                </button>

                <button
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-white/5 transition-colors text-music-text"
                  onClick={() => {
                    exportImage('png');
                    setShowDownloadDropdown(false);
                  }}
                >
                  <FileImage size={14} className="text-emerald-400 shrink-0" />
                  <span>Gambar PNG (.png)</span>
                </button>

                <button
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-white/5 transition-colors text-music-text"
                  onClick={() => {
                    exportImage('jpeg');
                    setShowDownloadDropdown(false);
                  }}
                >
                  <FileImage size={14} className="text-purple-400 shrink-0" />
                  <span>Gambar JPEG (.jpg)</span>
                </button>

                <button
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-white/5 transition-colors text-music-text border-t"
                  style={{ borderColor: 'var(--music-border)' }}
                  onClick={() => {
                    exportJSON();
                    setShowDownloadDropdown(false);
                  }}
                >
                  <FileJson size={14} className="text-amber-400 shrink-0" />
                  <span>Backup Proyek (.json)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Import */}
        <button className="toolbar-btn" title="Import JSON" onClick={() => importRef.current?.click()}>
          <Upload size={14} />
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={importJSON}
        />
      </div>

      {/* Tab navigation */}
      <div className="toolbar-tabs-row flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          className="px-4 py-1.5 text-xs font-medium transition-all flex-shrink-0 whitespace-nowrap"
            style={{
              color: activeTab === tab.id ? 'var(--music-accent)' : 'var(--music-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--music-accent)' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="toolbar-tab-content px-4 py-2 min-h-[60px] flex items-center flex-wrap gap-1">
        {activeTab === 'notes' && (
          <NotesTab
            onInsert={insertNoteAtSelection}
            onInsertDot={insertDotAtSelection}
            onOctave={applyOctave}
            onDelete={deleteSelectedNote}
            onApply={applyToSelection}
            hasSelection={!!selection}
            insertMode={insertMode}
            onToggleInsertMode={setInsertMode}
          />
        )}
        {activeTab === 'duration' && (
          <DurationTab
            onApply={applyToSelection}
            defaultDuration={defaultDuration}
            onSetDefault={setDefaultDuration}
            hasSelection={!!selection}
          />
        )}
        {activeTab === 'symbols' && (
          <SymbolsTab
            onApply={applyToSelection}
            onBarLine={addBarAtSelection}
            onToggleProp={toggleSelectionProperty}
            onToggleDynamics={toggleSelectionDynamics}
            selectedNote={getSelectedNote()}
            hasSelection={!!selection}
          />
        )}
        {activeTab === 'structure' && (
          <StructureTab
            song={song}
            updateSongMeta={updateSongMeta}
            transposeUp={transposeUp}
            transposeDown={transposeDown}
          />
        )}
        {activeTab === 'playback' && (
          <PlaybackTab
            isPlaying={isPlaying}
            onToggle={togglePlay}
            onStop={stop}
            song={song}
            instrument={instrument}
            setInstrument={setInstrument}
            updateSongMeta={updateSongMeta}
          />
        )}
      </div>
    </div>
  );
}

// ——— Notes Tab ———
function NotesTab({
  onInsert,
  onInsertDot,
  onOctave,
  onDelete,
  onApply,
  hasSelection,
  insertMode,
  onToggleInsertMode,
}: {
  onInsert: (p: NotePitch) => void;
  onInsertDot: () => void;
  onOctave: (o: NoteOctave) => void;
  onDelete: () => void;
  onApply: (u: Partial<NoteAngka>) => void;
  hasSelection: boolean;
  insertMode: 'replace' | 'insert-before' | 'insert-after';
  onToggleInsertMode: (m: 'replace' | 'insert-before' | 'insert-after') => void;
}) {
  const notes: NotePitch[] = ['1', '2', '3', '4', '5', '6', '7', '0'];
  const labels = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Rest'];

  const modes: { id: 'replace' | 'insert-before' | 'insert-after'; label: string; title: string }[] = [
    { id: 'replace',       label: '✎',  title: 'Ganti not terpilih' },
    { id: 'insert-before', label: '←+', title: 'Sisipkan not SEBELUM not terpilih' },
    { id: 'insert-after',  label: '+→', title: 'Sisipkan not SESUDAH not terpilih' },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Mode selector */}
      <div className="flex items-center rounded-md overflow-hidden border mr-1" style={{ borderColor: 'var(--music-border)' }}>
        {modes.map((m) => (
          <button
            key={m.id}
            title={m.title}
            onClick={() => onToggleInsertMode(m.id)}
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '3px 7px',
              height: 28,
              letterSpacing: '0.02em',
              background: insertMode === m.id ? 'var(--music-accent)' : 'transparent',
              color: insertMode === m.id ? '#fff' : 'var(--music-muted)',
              borderRight: m.id !== 'insert-after' ? '1px solid var(--music-border)' : 'none',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <span className="text-xs mr-1" style={{ color: 'var(--music-muted)' }}>
        {insertMode === 'replace'       ? 'Ganti:'    :
         insertMode === 'insert-before' ? 'Sisip ←:'  : 'Sisip →:'}
      </span>

      {notes.map((n, i) => (
        <button
          key={n}
          onClick={() => onInsert(n)}
          className="note-insert-btn"
          title={`${labels[i]}${insertMode === 'replace' ? '' : insertMode === 'insert-before' ? ' (sisip sebelum)' : ' (sisip sesudah)'}`}
          style={{
            borderColor: insertMode !== 'replace' ? 'rgba(99,102,241,0.4)' : undefined,
          }}
        >
          <span className="text-base font-bold font-mono">{n}</span>
          <span className="text-[9px]" style={{ color: 'var(--music-muted)' }}>{labels[i]}</span>
        </button>
      ))}

      {/* Tombol not titik (.) — elemen tersendiri */}
      <button
        onClick={onInsertDot}
        className="note-insert-btn"
        title={`Titik — perpanjang durasi not sebelumnya${insertMode === 'insert-before' ? ' (sisip sebelum)' : ' (sisip sesudah)'}`}
        style={{
          borderColor: 'rgba(148,163,184,0.4)',
          minWidth: 36,
        }}
      >
        <span className="text-base font-bold font-mono" style={{ opacity: 0.85 }}>.</span>
        <span className="text-[9px]" style={{ color: 'var(--music-muted)' }}>titik</span>
      </button>

      <div className="w-px h-8 mx-1" style={{ background: 'var(--music-border)' }} />

      {/* Octave — hanya aktif jika ada selection */}
      <span className="text-xs mr-1" style={{ color: 'var(--music-muted)' }}>Oktaf:</span>
      <button
        className="toolbar-icon-btn"
        title="Oktaf Tinggi (titik atas)"
        onClick={() => onOctave('high')}
        disabled={!hasSelection}
        style={{ opacity: hasSelection ? 1 : 0.4 }}
      >
        <span className="flex flex-col items-center leading-none">
          <span className="w-1 h-1 rounded-full bg-current mb-0.5" />
          <span className="font-mono text-sm font-bold">1</span>
        </span>
      </button>
      <button
        className="toolbar-icon-btn"
        title="Oktaf Normal"
        onClick={() => onOctave('normal')}
        disabled={!hasSelection}
        style={{ opacity: hasSelection ? 1 : 0.4 }}
      >
        <span className="font-mono text-sm font-bold">1</span>
      </button>
      <button
        className="toolbar-icon-btn"
        title="Oktaf Rendah (titik bawah)"
        onClick={() => onOctave('low')}
        disabled={!hasSelection}
        style={{ opacity: hasSelection ? 1 : 0.4 }}
      >
        <span className="flex flex-col items-center leading-none">
          <span className="font-mono text-sm font-bold">1</span>
          <span className="w-1 h-1 rounded-full bg-current mt-0.5" />
        </span>
      </button>

      <div className="w-px h-8 mx-1" style={{ background: 'var(--music-border)' }} />

      {/* Accidental / Coret — hanya aktif jika ada selection */}
      <div className="w-px h-8 mx-1" style={{ background: 'var(--music-border)' }} />
      <span className="text-xs mr-1" style={{ color: 'var(--music-muted)' }}>Coret:</span>
      <button
        className="toolbar-icon-btn"
        title="Coret Kanan / (Sharp: Naik 1/2 nada)"
        onClick={() => onApply({ accidental: 'sharp' })}
        disabled={!hasSelection}
        style={{
          opacity: hasSelection ? 1 : 0.4,
          borderColor: 'rgba(99,102,241,0.4)',
        }}
      >
        <span className="font-mono text-sm font-bold">1̸</span>
      </button>
      <button
        className="toolbar-icon-btn"
        title="Coret Kiri \ (Flat: Turun 1/2 nada)"
        onClick={() => onApply({ accidental: 'flat' })}
        disabled={!hasSelection}
        style={{
          opacity: hasSelection ? 1 : 0.4,
          borderColor: 'rgba(99,102,241,0.4)',
        }}
      >
        <span className="font-mono text-sm font-bold">1\</span>
      </button>
      <button
        className="toolbar-icon-btn"
        title="Hapus Coret (Nada Normal)"
        onClick={() => onApply({ accidental: undefined })}
        disabled={!hasSelection}
        style={{ opacity: hasSelection ? 1 : 0.4 }}
      >
        <span className="font-mono text-xs font-bold">1</span>
      </button>

      <div className="w-px h-8 mx-1" style={{ background: 'var(--music-border)' }} />

      {/* Hapus Not — hanya aktif jika ada selection */}
      <button
        className="toolbar-icon-btn"
        title="Hapus Not Terpilih"
        onClick={onDelete}
        disabled={!hasSelection}
        style={{
          opacity: hasSelection ? 1 : 0.4,
          borderColor: hasSelection ? 'rgba(239,68,68,0.3)' : undefined,
          color: hasSelection ? '#f87171' : 'var(--music-muted)',
        }}
      >
        <Trash2 size={14} />
      </button>

      {!hasSelection && (
        <span className="text-[10px] ml-2" style={{ color: 'var(--music-muted)' }}>
          Klik not atau garis birama untuk pilih & ubah
        </span>
      )}
    </div>
  );
}

// ——— Duration Tab ———
function DurationTab({
  onApply,
  defaultDuration,
  onSetDefault,
  hasSelection,
}: {
  onApply: (u: { duration?: NoteDuration; overlines?: 0 | 1 | 2; dotted?: boolean }) => void;
  defaultDuration: NoteDuration;
  onSetDefault: (dur: NoteDuration) => void;
  hasSelection: boolean;
}) {
  const durations: {
    label: string;
    value: NoteDuration;
    beats: number;
    title: string;
    overlines: 0|1|2;
  }[] = [
    { label: '1', value: 'quarter',   beats: 1,    title: '1 Ketuk (Tanpa garis atas)',   overlines: 0 },
    { label: '½', value: 'eighth',    beats: 0.5,  title: '½ Ketuk (1 garis atas)',       overlines: 1 },
    { label: '¼', value: 'sixteenth', beats: 0.25, title: '¼ Ketuk (2 garis atas)',       overlines: 2 },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs mr-1" style={{ color: 'var(--music-muted)' }}>Durasi Not:</span>
      {durations.map((d) => {
        const isActive = defaultDuration === d.value;
        return (
          <button
            key={d.value}
            className="toolbar-icon-btn flex flex-col items-center min-w-[40px] py-1 gap-[1px]"
            title={d.title}
            onClick={() => {
              onSetDefault(d.value);
              if (hasSelection) {
                onApply({ duration: d.value, overlines: d.overlines });
              }
            }}
            style={{
              background: isActive ? 'rgba(99,102,241,0.2)' : undefined,
              color: isActive ? 'var(--music-accent)' : undefined,
              borderColor: isActive ? 'var(--music-accent)' : undefined,
            }}
          >
            {/* Visual overlines (garis atas) */}
            {Array.from({ length: d.overlines }).map((_, i) => (
              <span key={i} className="block w-4 h-[1.5px] bg-current" />
            ))}
            {/* Pitch number */}
            <span className="font-mono text-sm font-bold">{d.label}</span>
          </button>
        );
      })}

      <div className="w-px h-8 mx-2" style={{ background: 'var(--music-border)' }} />

      {/* Dotted note */}
      <button
        className="toolbar-icon-btn flex flex-col items-center min-w-[40px] py-1"
        title="Titik (1.5× durasi)"
        onClick={() => hasSelection && onApply({ dotted: true })}
        disabled={!hasSelection}
        style={{ opacity: hasSelection ? 1 : 0.4 }}
      >
        <span className="font-mono text-sm font-bold">1</span>
        <span className="text-[10px]" style={{ color: 'var(--music-muted)' }}>titik</span>
      </button>

      <div className="text-[10px] ml-2" style={{ color: 'var(--music-muted)' }}>
        {hasSelection ? 'Klik untuk ubah not terpilih' : `Default: ${defaultDuration}`}
      </div>
    </div>
  );
}

// ——— Symbols Tab ———
function SymbolsTab({
  onApply,
  onBarLine,
  onToggleProp,
  onToggleDynamics,
  selectedNote,
  hasSelection,
}: {
  onApply: (u: Partial<NoteAngka>) => void;
  onBarLine: (type: 'single' | 'double' | 'repeat-start' | 'repeat-end' | 'final') => void;
  onToggleProp: (prop: 'tied' | 'slurred' | 'staccato' | 'accent' | 'fermata') => void;
  onToggleDynamics: (dyn: 'crescendo' | 'diminuendo') => void;
  selectedNote: NoteAngka | null;
  hasSelection: boolean;
}) {
  const { selection, song, updateBarLineMeta, updateStartBarType, removeBarLine } = useEditorStore();

  const selectedLine = selection ? song?.content.lines.find((l) => l.id === selection.lineId) : null;
  const barIdx = selectedLine && selection?.barPosition !== undefined ? selectedLine.barPositions.indexOf(selection.barPosition) : -1;
  const currentBar = barIdx >= 0 && selectedLine ? selectedLine.barTypes[barIdx] : null;

  const isBarSelected = !!selection && (selection.barPosition !== undefined || !!selection.isStartBar);

  const symbols = [
    { label: '⌒', title: 'Tie (Sambung)', active: !!selectedNote?.tied, action: () => onToggleProp('tied'), requiresSelection: true },
    { label: '⌣', title: 'Slur (Legato)', active: !!selectedNote?.slurred, action: () => onToggleProp('slurred'), requiresSelection: true },
    { label: '·', title: 'Staccato', active: !!selectedNote?.staccato, action: () => onToggleProp('staccato'), requiresSelection: true },
    { label: '>', title: 'Accent', active: !!selectedNote?.accent, action: () => onToggleProp('accent'), requiresSelection: true },
    { label: '𝄐', title: 'Fermata', active: !!selectedNote?.fermata, action: () => onToggleProp('fermata'), requiresSelection: true },
    {
      label: '𝄆',
      title: 'Repeat Start (||:) Bebas di Sebelah Not',
      active: selectedNote?.repeatAfter === 'repeat-start',
      action: () => onApply({ repeatAfter: selectedNote?.repeatAfter === 'repeat-start' ? undefined : 'repeat-start', repeatCount: selectedNote?.repeatCount ?? 1 }),
      requiresSelection: true,
    },
    {
      label: '𝄇',
      title: 'Repeat End (:||) Bebas di Sebelah Not',
      active: selectedNote?.repeatAfter === 'repeat-end',
      action: () => onApply({ repeatAfter: selectedNote?.repeatAfter === 'repeat-end' ? undefined : 'repeat-end', repeatCount: selectedNote?.repeatCount ?? 1 }),
      requiresSelection: true,
    },
    { label: '|', title: 'Bar Line (Garis Birama)', active: false, action: () => onBarLine('single'), requiresSelection: true },
    { label: '‖', title: 'Double Bar', active: false, action: () => onBarLine('double'), requiresSelection: true },
    { label: 'cresc.', title: 'Crescendo', active: selectedNote?.dynamics === 'crescendo', action: () => onToggleDynamics('crescendo'), requiresSelection: true },
    { label: 'dim.', title: 'Diminuendo', active: selectedNote?.dynamics === 'diminuendo', action: () => onToggleDynamics('diminuendo'), requiresSelection: true },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* If a Bar Line is selected, show Bar Line Editing controls */}
      {isBarSelected && selection ? (
        <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/30">
          <span className="text-xs font-semibold text-indigo-400">Garis Birama Terpilih:</span>

          {['single', 'double', 'repeat-start', 'repeat-end', 'final'].map((t) => (
            <button
              key={t}
              className="toolbar-icon-btn min-w-[32px] text-sm font-mono font-bold"
              style={{
                borderColor: (selection.isStartBar ? selectedLine?.startBarType === t : currentBar?.type === t) ? 'var(--music-accent)' : undefined,
                background: (selection.isStartBar ? selectedLine?.startBarType === t : currentBar?.type === t) ? 'rgba(99,102,241,0.2)' : undefined,
              }}
              onClick={() => {
                if (selection.isStartBar) {
                  updateStartBarType(selection.lineId, t as any);
                } else if (selection.barPosition !== undefined) {
                  useEditorStore.getState().insertBarLine(selection.lineId, selection.barPosition, t as any);
                }
              }}
            >
              {t === 'single' ? '|' : t === 'double' ? '‖' : t === 'repeat-start' ? '𝄆' : t === 'repeat-end' ? '𝄇' : '𝄂'}
            </button>
          ))}

          {/* Repeat count & label controls if repeat bar */}
          {(currentBar?.type === 'repeat-start' || currentBar?.type === 'repeat-end') && selection.barPosition !== undefined && (
            <>
              <div className="w-px h-6 mx-1 bg-white/10" />
              <span className="text-xs text-muted-foreground">Ulang:</span>
              <select
                className="toolbar-select text-xs"
                value={currentBar.repeatCount ?? 1}
                onChange={(e) => updateBarLineMeta(selection.lineId, selection.barPosition!, { repeatCount: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((c) => (
                  <option key={c} value={c}>{c}x</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Keterangan (mis: Chorus)…"
                defaultValue={currentBar.repeatLabel ?? ''}
                className="w-32 px-2 py-0.5 text-xs rounded bg-surface-2 border border-music-border text-music-text"
                onBlur={(e) => updateBarLineMeta(selection.lineId, selection.barPosition!, { repeatLabel: e.target.value.trim() || undefined })}
              />
            </>
          )}

          {!selection.isStartBar && selection.barPosition !== undefined && (
            <button
              className="toolbar-icon-btn text-red-400 border-red-500/30"
              title="Hapus Garis Birama"
              onClick={() => {
                removeBarLine(selection.lineId, selection.barPosition!);
                useEditorStore.getState().setSelection(null);
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ) : (
        <>
          <span className="text-xs mr-1" style={{ color: 'var(--music-muted)' }}>Simbol:</span>
          {symbols.map((sym) => {
            const disabled = sym.requiresSelection && !hasSelection;
            return (
              <button
                key={sym.title}
                className="toolbar-icon-btn min-w-[36px]"
                title={sym.title}
                onClick={sym.action}
                disabled={disabled}
                style={{
                  opacity: disabled ? 0.4 : 1,
                  background: sym.active ? 'rgba(99,102,241,0.15)' : undefined,
                  color: sym.active ? 'var(--music-accent)' : undefined,
                  borderColor: sym.active ? 'var(--music-accent)' : undefined,
                }}
              >
                <span className="text-sm font-mono">{sym.label}</span>
              </button>
            );
          })}

          {/* If selected note has repeatAfter symbol, show settings controls */}
          {hasSelection && selectedNote?.repeatAfter && (
            <div className="flex items-center gap-2 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30 ml-1">
              <span className="text-[11px] font-semibold text-indigo-400">Repeat ({selectedNote.repeatAfter === 'repeat-start' ? '𝄆' : '𝄇'}):</span>
              <span className="text-[11px] text-muted-foreground">Ulang:</span>
              <select
                className="toolbar-select text-xs py-0.5 px-1"
                value={selectedNote.repeatCount ?? 1}
                onChange={(e) => onApply({ repeatCount: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((c) => (
                  <option key={c} value={c}>{c}x</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Keterangan…"
                defaultValue={selectedNote.repeatLabel ?? ''}
                className="w-24 px-1.5 py-0.5 text-xs rounded bg-surface-2 border border-music-border text-music-text"
                onBlur={(e) => onApply({ repeatLabel: e.target.value.trim() || undefined })}
              />
            </div>
          )}
          {!hasSelection && (
            <span className="text-[10px] ml-2" style={{ color: 'var(--music-muted)' }}>
              Klik not atau garis birama untuk pilih
            </span>
          )}

          {/* Chord input */}
          {hasSelection && (
            <>
              <div className="w-px h-8 mx-2" style={{ background: 'var(--music-border)' }} />
              <span className="text-xs mr-1" style={{ color: 'var(--music-muted)' }}>Akord:</span>
              <input
                type="text"
                placeholder="Am, G7…"
                defaultValue={selectedNote?.chord ?? ''}
                className="w-16 px-2 py-0.5 text-xs rounded"
                style={{
                  background: 'var(--music-surface-2)',
                  border: '1px solid var(--music-border)',
                  color: 'var(--music-chord)',
                  outline: 'none',
                  fontWeight: 700,
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  onApply({ chord: val || undefined } as Partial<NoteAngka>);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ——— Structure Tab ———
function StructureTab({
  song,
  updateSongMeta,
  transposeUp,
  transposeDown,
}: {
  song: Song | null;
  updateSongMeta: (meta: Partial<Song>) => void;
  transposeUp: () => void;
  transposeDown: () => void;
}) {
  if (!song) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Key signature */}
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--music-muted)' }}>Nada:</span>
        <select
          value={song.key}
          onChange={(e) => updateSongMeta({ key: e.target.value as MusicalKey })}
          className="toolbar-select text-xs"
        >
          {KEYS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* Time signature */}
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--music-muted)' }}>Birama:</span>
        <select
          value={song.timeSignature}
          onChange={(e) => updateSongMeta({ timeSignature: e.target.value as '4/4' })}
          className="toolbar-select text-xs"
        >
          {['2/4', '3/4', '4/4', '6/8'].map((ts) => (
            <option key={ts} value={ts}>{ts}</option>
          ))}
        </select>
      </div>

      <div className="w-px h-8" style={{ background: 'var(--music-border)' }} />

      {/* Transpose */}
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--music-muted)' }}>Transpose:</span>
        <button onClick={transposeDown} className="toolbar-icon-btn" title="Transpose Turun">
          <ChevronDown size={14} />
        </button>
        <span className="text-xs font-semibold w-8 text-center" style={{ color: 'var(--music-text)' }}>{song.key}</span>
        <button onClick={transposeUp} className="toolbar-icon-btn" title="Transpose Naik">
          <ChevronUp size={14} />
        </button>
      </div>

      <div className="w-px h-8" style={{ background: 'var(--music-border)' }} />

      {/* Structural symbols */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs" style={{ color: 'var(--music-muted)' }}>Tanda:</span>
        {['D.C.', 'D.S.', 'Fine', '𝄋 Coda', '§ Segno'].map((s) => (
          <button key={s} className="toolbar-icon-btn text-xs px-2" title={s}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ——— Playback Tab ———
function PlaybackTab({
  isPlaying,
  onToggle,
  onStop,
  song,
  instrument,
  setInstrument,
  updateSongMeta,
}: {
  isPlaying: boolean;
  onToggle: () => void;
  onStop: () => void;
  song: Song | null;
  instrument: InstrumentName;
  setInstrument: (i: InstrumentName) => void;
  updateSongMeta: (meta: Partial<Song>) => void;
}) {
  if (!song) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Play/Stop */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: isPlaying ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)',
            color: isPlaying ? '#f87171' : 'var(--music-accent)',
          }}
        >
          {isPlaying ? <Square size={14} /> : <Play size={14} />}
          {isPlaying ? 'Berhenti' : 'Mainkan'}
        </button>
        <button onClick={onStop} className="toolbar-icon-btn" title="Mulai Ulang">
          <SkipBack size={14} />
        </button>
      </div>

      <div className="w-px h-8" style={{ background: 'var(--music-border)' }} />

      {/* Tempo */}
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--music-muted)' }}>Tempo:</span>
        <button
          onClick={() => updateSongMeta({ tempo: Math.max(40, song.tempo - 5) })}
          className="toolbar-icon-btn"
        >
          <Minus size={12} />
        </button>
        <span className="text-xs font-semibold w-14 text-center" style={{ color: 'var(--music-text)' }}>
          {song.tempo} BPM
        </span>
        <button
          onClick={() => updateSongMeta({ tempo: Math.min(240, song.tempo + 5) })}
          className="toolbar-icon-btn"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="w-px h-8" style={{ background: 'var(--music-border)' }} />

      {/* Instrument */}
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--music-muted)' }}>Instrumen:</span>
        <select
          value={instrument}
          onChange={(e) => setInstrument(e.target.value as InstrumentName)}
          className="toolbar-select text-xs"
        >
          {INSTRUMENTS.map((i) => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
