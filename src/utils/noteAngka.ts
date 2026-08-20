import {
  NoteAngka,
  NotePitch,
  MusicalKey,
  LyricLine,
  SongContent,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ===========================
// Note Frequency Mapping
// ===========================

// Maps not angka (1-7) to semitone offset from root note
const SCALE_SEMITONES: Record<NotePitch, number> = {
  '0': -1, // rest — no pitch
  '1': 0,
  '2': 2,
  '3': 4,
  '4': 5,
  '5': 7,
  '6': 9,
  '7': 11,
};

// Key to MIDI base note (middle C4 = 60)
const KEY_BASE_MIDI: Record<MusicalKey, number> = {
  C: 60,
  'C#': 61,
  Db: 61,
  D: 62,
  'D#': 63,
  Eb: 63,
  E: 64,
  F: 65,
  'F#': 66,
  Gb: 66,
  G: 67,
  'G#': 68,
  Ab: 68,
  A: 69,
  'A#': 70,
  Bb: 70,
  B: 71,
};

export function noteToMidi(note: NoteAngka, key: MusicalKey): number | null {
  if (note.isRest || note.pitch === '0') return null;

  const base = KEY_BASE_MIDI[key];
  const semitone = SCALE_SEMITONES[note.pitch];
  if (semitone === -1) return null;

  let midi = base + semitone;

  if (note.octave === 'high') midi += 12;
  if (note.octave === 'low') midi -= 12;

  return midi;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteToFrequency(note: NoteAngka, key: MusicalKey): number | null {
  const midi = noteToMidi(note, key);
  if (midi === null) return null;
  return midiToFrequency(midi);
}

// ===========================
// Duration in seconds
// ===========================

export function getDurationInSeconds(note: NoteAngka, bpm: number): number {
  const beatDuration = 60 / bpm; // quarter note duration in seconds (1 beat)
  const beats = getNoteDurationInBeats(note);
  return beatDuration * beats;
}

/**
 * Returns the duration of a note in beats (1 beat = 1 ketuk / quarter note).
 * Overlines (garis di atas):
 * - 1 overline (garis atas = 1) -> 0.5 beat (½ ketuk)
 * - 2 overlines (garis atas = 2) -> 0.25 beat (¼ ketuk)
 * - 0 overlines -> 1 beat (1 ketuk)
 */
export function getNoteDurationInBeats(note: NoteAngka): number {
  let beats = 1;
  if (note.overlines === 1 || note.duration === 'eighth') {
    beats = 0.5;
  } else if (note.overlines === 2 || note.duration === 'sixteenth') {
    beats = 0.25;
  } else if (note.duration === 'half') {
    beats = 2;
  } else if (note.duration === 'whole') {
    beats = 4;
  }

  if (note.dotted) beats *= 1.5;

  return beats;
}

/**
 * Returns the number of beats per measure given a time signature string.
 * E.g. "4/4" → 4, "3/4" → 3, "6/8" → 6 (the numerator defines count).
 */
export function getMeasureSizeInBeats(timeSignature: string): number {
  const parts = timeSignature.split('/');
  if (parts.length !== 2) return 4;
  const num = parseInt(parts[0], 10);
  const denom = parseInt(parts[1], 10);
  if (isNaN(num) || isNaN(denom)) return 4;
  // Beat unit = quarter note. Convert: beats = (num / denom) * 4
  return (num / denom) * 4;
}

// ===========================
// Transpose
// ===========================

const KEYS: MusicalKey[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

export function transposeKey(key: MusicalKey, semitones: number): MusicalKey {
  const idx = KEYS.indexOf(key);
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return KEYS[newIdx];
}

// Transpose does not change the note numbers, only the key.
// The not angka system is relative — changing key automatically transposes all audio.
// But if user explicitly wants to change note numbers, we do chromatic transposition:
export function transposeNote(note: NoteAngka, semitones: number): NoteAngka {
  if (note.isRest || note.pitch === '0') return note;

  const pitchOrder: NotePitch[] = ['1', '2', '3', '4', '5', '6', '7'];
  const chromatic = [0, 2, 4, 5, 7, 9, 11]; // C major semitones

  const currentPitchIdx = pitchOrder.indexOf(note.pitch);
  if (currentPitchIdx === -1) return note;

  const currentSemitone = chromatic[currentPitchIdx];
  let newSemitone = currentSemitone + semitones;
  let octaveShift = 0;

  // Normalize to 0-11 range
  while (newSemitone < 0) { newSemitone += 12; octaveShift--; }
  while (newSemitone >= 12) { newSemitone -= 12; octaveShift++; }

  // Find nearest scale degree
  let nearestIdx = 0;
  let minDiff = Infinity;
  chromatic.forEach((s, i) => {
    const diff = Math.abs(s - newSemitone);
    if (diff < minDiff) { minDiff = diff; nearestIdx = i; }
  });

  const newPitch = pitchOrder[nearestIdx];
  const octaveMap: Record<string, NoteAngka['octave']> = {
    high: 'high',
    normal: 'normal',
    low: 'low',
  };

  let newOctave = note.octave;
  if (octaveShift > 0) newOctave = newOctave === 'low' ? 'normal' : 'high';
  if (octaveShift < 0) newOctave = newOctave === 'high' ? 'normal' : 'low';

  return { ...note, pitch: newPitch, octave: newOctave };
}

// ===========================
// Note Creation Helpers
// ===========================

export function createNote(
  pitch: NotePitch,
  syllable = '',
  overrides: Partial<NoteAngka> = {}
): NoteAngka {
  return {
    id: uuidv4(),
    pitch,
    octave: 'normal',
    duration: 'quarter',
    isDot: false,
    overlines: 0,
    dotted: false,
    tied: false,
    slurred: false,
    staccato: false,
    accent: false,
    fermata: false,
    isRest: pitch === '0',
    syllable,
    ...overrides,
  };
}

export function createRestNote(): NoteAngka {
  return createNote('0', '', { isRest: true });
}

export function createLine(notes: NoteAngka[] = []): LyricLine {
  return {
    id: uuidv4(),
    notes,
    barPositions: [],
    barTypes: [],
  };
}

export function createEmptySong(): SongContent {
  return {
    lines: [createLine()],
  };
}

// ===========================
// Display Helpers
// ===========================

export function formatNoteDisplay(note: NoteAngka): string {
  if (note.isRest) return '0';
  return note.pitch;
}

export function getNoteLabel(note: NoteAngka): string {
  const pitchNames: Record<NotePitch, string> = {
    '0': 'rest',
    '1': 'Do',
    '2': 'Re',
    '3': 'Mi',
    '4': 'Fa',
    '5': 'Sol',
    '6': 'La',
    '7': 'Si',
  };
  return pitchNames[note.pitch];
}

export function getKeyDisplayName(key: MusicalKey): string {
  return key;
}

export function getTempoLabel(bpm: number): string {
  if (bpm < 60) return 'Larghetto';
  if (bpm < 76) return 'Adagio';
  if (bpm < 108) return 'Andante';
  if (bpm < 120) return 'Moderato';
  if (bpm < 156) return 'Allegro';
  if (bpm < 176) return 'Vivace';
  return 'Presto';
}

// ===========================
// Import / Export Text Format
// ===========================

export function songToTextFormat(content: SongContent): string {
  return content.lines
    .map((line) => {
      const noteLine = line.notes
        .map((n) => {
          let s: string = n.pitch;
          if (n.octave === 'high') s = `·${s}`;
          if (n.octave === 'low') s = `${s}.`;
          if (n.dotted) s = `${s}.`;
          return s;
        })
        .join(' ');
      const lyricLine = line.notes.map((n) => n.syllable || '-').join(' ');
      return `${noteLine}\n${lyricLine}`;
    })
    .join('\n\n');
}

