import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  Song,
  SongContent,
  LyricLine,
  NoteAngka,
  NotePitch,
  NoteDuration,
  MusicalKey,
  EditorSelection,
  InstrumentName,
  CollaboratorInfo,
  BarLine,
} from '@/types';
import {
  createNote,
  createLine,
  createEmptySong,
  transposeKey,
} from '@/utils/noteAngka';
import { v4 as uuidv4 } from 'uuid';

interface EditorStore {
  // Song state
  song: Song | null;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;

  // Collaboration
  collaborators: CollaboratorInfo[];
  setCollaborators: (collabs: CollaboratorInfo[]) => void;

  // Editor selection
  selection: EditorSelection | null;

  // Playback
  isPlaying: boolean;
  playbackLineIdx: number | null;
  playbackNoteIdx: number | null;

  // UI
  zoom: number;
  showMetronome: boolean;
  instrument: InstrumentName;
  defaultDuration: NoteDuration;

  // Actions — Song
  setSong: (song: Song) => void;
  setSongData: (song: Song) => void; // alias for external use (import)
  updateSongMeta: (meta: Partial<Pick<Song, 'title' | 'composer' | 'key' | 'timeSignature' | 'tempo' | 'genre' | 'isPublic'>>) => void;
  markSaved: () => void;
  markSaving: (saving: boolean) => void;

  // Actions — Lines
  addLine: () => void;
  deleteLine: (lineId: string) => void;
  updateLineLabel: (lineId: string, label: string) => void;

  // Actions — Notes
  setSelection: (sel: EditorSelection | null) => void;
  insertNote: (lineId: string, noteIndex: number, pitch: NotePitch, syllable?: string, duration?: NoteDuration) => void;
  insertDotNote: (lineId: string, noteIndex: number) => void;
  updateNote: (lineId: string, noteIndex: number, updates: Partial<NoteAngka>) => void;
  updateNoteRange: (lineId: string, startIndex: number, endIndex: number, updates: Partial<NoteAngka> | ((note: NoteAngka, idx: number) => Partial<NoteAngka>)) => void;
  deleteNote: (lineId: string, noteIndex: number) => void;
  updateSyllable: (lineId: string, noteIndex: number, syllable: string) => void;

  // Actions — Bar lines
  insertBarLine: (lineId: string, position: number, type?: BarLine['type']) => void;
  removeBarLine: (lineId: string, position: number) => void;

  // Actions — Playback
  setPlaying: (playing: boolean) => void;
  setPlaybackPosition: (lineIdx: number | null, noteIdx: number | null) => void;

  // Actions — UI
  setZoom: (zoom: number) => void;
  setInstrument: (instrument: InstrumentName) => void;
  setShowMetronome: (show: boolean) => void;
  setDefaultDuration: (duration: NoteDuration) => void;

  // Actions — Transpose
  transposeUp: () => void;
  transposeDown: () => void;

  // Helpers
  getLine: (lineId: string) => LyricLine | undefined;
  getNote: (lineId: string, noteIndex: number) => NoteAngka | undefined;
}

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    song: null,
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    collaborators: [],
    selection: null,
    isPlaying: false,
    playbackLineIdx: null,
    playbackNoteIdx: null,
    zoom: 100,
    showMetronome: false,
    instrument: 'piano',
    defaultDuration: 'quarter',

    setCollaborators: (collabs) =>
      set((state) => {
        state.collaborators = collabs;
      }),

    setSong: (song) =>
      set((state) => {
        state.song = song;
        state.isDirty = false;
      }),

    setSongData: (song) =>
      set((state) => {
        state.song = song;
        state.isDirty = true; // mark dirty so it will be saved
      }),

    updateSongMeta: (meta) =>
      set((state) => {
        if (!state.song) return;
        Object.assign(state.song, meta);
        state.isDirty = true;
      }),

    markSaved: () =>
      set((state) => {
        state.isDirty = false;
        state.isSaving = false;
        state.lastSaved = new Date();
      }),

    markSaving: (saving) =>
      set((state) => {
        state.isSaving = saving;
      }),

    addLine: () =>
      set((state) => {
        if (!state.song) return;
        state.song.content.lines.push(createLine());
        state.isDirty = true;
      }),

    deleteLine: (lineId) =>
      set((state) => {
        if (!state.song) return;
        const idx = state.song.content.lines.findIndex((l) => l.id === lineId);
        if (idx >= 0) {
          state.song.content.lines.splice(idx, 1);
          state.isDirty = true;
        }
      }),

    updateLineLabel: (lineId, label) =>
      set((state) => {
        if (!state.song) return;
        const line = state.song.content.lines.find((l) => l.id === lineId);
        if (line) {
          line.label = label;
          state.isDirty = true;
        }
      }),

    setSelection: (sel) =>
      set((state) => {
        state.selection = sel;
      }),

    insertNote: (lineId, noteIndex, pitch, syllable = '', duration) =>
      set((state) => {
        if (!state.song) return;
        const line = state.song.content.lines.find((l) => l.id === lineId);
        if (line) {
          const dur = duration ?? state.defaultDuration;
          const overlines  = dur === 'half'  ? 1 : dur === 'whole' ? 2 : 0;
          const note = createNote(pitch, syllable, {
            duration: dur,
            isDot: false,
            overlines: overlines as 0|1|2,
          });
          line.notes.splice(noteIndex, 0, note);

          // Geser barPositions yang >= noteIndex agar tetap menunjuk ke not yang benar
          line.barPositions = line.barPositions.map((pos) =>
            pos >= noteIndex ? pos + 1 : pos
          );

          state.isDirty = true;
        }
      }),

    insertDotNote: (lineId, noteIndex) =>
      set((state) => {
        if (!state.song) return;
        const line = state.song.content.lines.find((l) => l.id === lineId);
        if (line) {
          const dur = state.defaultDuration;
          const overlines = dur === 'eighth' ? 1 : dur === 'sixteenth' ? 2 : 0;
          const dot = createNote('0', '', {
            isDot: true,
            isRest: false,
            duration: dur,
            overlines: overlines as 0|1|2,
          });
          line.notes.splice(noteIndex, 0, dot);

          line.barPositions = line.barPositions.map((pos) =>
            pos >= noteIndex ? pos + 1 : pos
          );

          state.isDirty = true;
        }
      }),

    updateNote: (lineId, noteIndex, updates) =>
      set((state) => {
        if (!state.song) return;
        const line = state.song.content.lines.find((l) => l.id === lineId);
        if (line && line.notes[noteIndex]) {
          Object.assign(line.notes[noteIndex], updates);
          state.isDirty = true;
        }
      }),

    updateNoteRange: (lineId, startIndex, endIndex, updates) =>
      set((state) => {
        if (!state.song) return;
        const line = state.song.content.lines.find((l) => l.id === lineId);
        if (line) {
          const minIdx = Math.min(startIndex, endIndex);
          const maxIdx = Math.max(startIndex, endIndex);
          for (let i = minIdx; i <= maxIdx; i++) {
            if (line.notes[i]) {
              const u = typeof updates === 'function' ? updates(line.notes[i], i) : updates;
              Object.assign(line.notes[i], u);
            }
          }
          state.isDirty = true;
        }
      }),

    deleteNote: (lineId, noteIndex) =>
      set((state) => {
        if (!state.song) return;
        const line = state.song.content.lines.find((l) => l.id === lineId);
        if (line) {
          line.notes.splice(noteIndex, 1);
          state.isDirty = true;
        }
      }),

    updateSyllable: (lineId, noteIndex, syllable) =>
      set((state) => {
        if (!state.song) return;
        const line = state.song.content.lines.find((l) => l.id === lineId);
        if (line && line.notes[noteIndex]) {
          line.notes[noteIndex].syllable = syllable;
          state.isDirty = true;
        }
      }),

    insertBarLine: (lineId: string, position: number, type: BarLine['type'] = 'single') =>
      set((state) => {
        if (!state.song) return;
        const line = state.song.content.lines.find((l) => l.id === lineId);
        if (line) {
          const idx = line.barPositions.indexOf(position);
          if (idx >= 0) {
            // Already exists at position
            if (line.barTypes[idx]?.type === type) {
              // Same type, remove it (toggle off)
              line.barPositions.splice(idx, 1);
              line.barTypes.splice(idx, 1);
            } else {
              // Different type, update its type
              line.barTypes[idx] = { type };
            }
          } else {
            // Insert new bar line
            line.barPositions.push(position);
            line.barTypes.push({ type });

            // Sort both arrays in sync using zipped elements
            const zipped = line.barPositions.map((pos, i) => ({
              pos,
              t: line.barTypes[i],
            }));
            zipped.sort((a, b) => a.pos - b.pos);
            line.barPositions = zipped.map((z) => z.pos);
            line.barTypes = zipped.map((z) => z.t);
          }
          state.isDirty = true;
        }
      }),

    removeBarLine: (lineId, position) =>
      set((state) => {
        if (!state.song) return;
        const line = state.song.content.lines.find((l) => l.id === lineId);
        if (line) {
          const idx = line.barPositions.indexOf(position);
          if (idx >= 0) {
            line.barPositions.splice(idx, 1);
            line.barTypes.splice(idx, 1);
            state.isDirty = true;
          }
        }
      }),

    setPlaying: (playing) =>
      set((state) => {
        state.isPlaying = playing;
        if (!playing) {
          state.playbackLineIdx = null;
          state.playbackNoteIdx = null;
        }
      }),

    setPlaybackPosition: (lineIdx, noteIdx) =>
      set((state) => {
        state.playbackLineIdx = lineIdx;
        state.playbackNoteIdx = noteIdx;
      }),

    setZoom: (zoom) =>
      set((state) => {
        state.zoom = Math.max(50, Math.min(200, zoom));
      }),

    setInstrument: (instrument) =>
      set((state) => {
        state.instrument = instrument;
      }),

    setShowMetronome: (show) =>
      set((state) => {
        state.showMetronome = show;
      }),

    setDefaultDuration: (duration) =>
      set((state) => {
        state.defaultDuration = duration;
      }),

    transposeUp: () =>
      set((state) => {
        if (!state.song) return;
        state.song.key = transposeKey(state.song.key, 1);
        state.isDirty = true;
      }),

    transposeDown: () =>
      set((state) => {
        if (!state.song) return;
        state.song.key = transposeKey(state.song.key, -1);
        state.isDirty = true;
      }),

    getLine: (lineId) => {
      return get().song?.content.lines.find((l) => l.id === lineId);
    },

    getNote: (lineId, noteIndex) => {
      return get().getLine(lineId)?.notes[noteIndex];
    },
  }))
);
