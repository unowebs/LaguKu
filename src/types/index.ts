// ===========================
// Core Note Angka Types
// ===========================

export type NotePitch = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7';
export type NoteOctave = 'high' | 'normal' | 'low';
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
export type NoteDynamics = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff' | 'crescendo' | 'diminuendo';
export type TimeSignature = '2/4' | '3/4' | '4/4' | '6/8';
export type MusicalKey =
  | 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F'
  | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';

export interface NoteAngka {
  id: string;
  pitch: NotePitch;
  octave: NoteOctave;
  duration: NoteDuration;
  isDot: boolean;           // not titik (.) — elemen tersendiri, memperpanjang durasi not sebelumnya
  overlines: 0 | 1 | 2;    // garis atas: 0=quarter, 1=half (2 ketukan), 2=whole (4 ketukan)
  dotted: boolean;          // titik samping = 1.5x durasi
  accidental?: 'sharp' | 'flat' | 'natural'; // coret kanan / (sharp: +1 semitone), coret kiri \ (flat: -1 semitone)
  repeatAfter?: 'repeat-start' | 'repeat-end'; // simbol repeat bebas yang dipasang setelah not ini
  repeatCount?: number;     // jumlah pengulangan (default 1)
  repeatLabel?: string;     // keterangan repeat (misal "Chorus", "Reff")
  tied: boolean;            // not disambung ke not berikutnya
  slurred: boolean;         // legato slur
  staccato: boolean;
  accent: boolean;
  fermata: boolean;
  isRest: boolean;
  dynamics?: NoteDynamics;
  syllable: string;         // suku kata di bawah not ini
  chord?: string;           // akord di atas not (opsional), misal "Am", "G7"
}

export interface BarLine {
  type: 'single' | 'double' | 'repeat-start' | 'repeat-end' | 'final';
  repeatCount?: number;     // jumlah pengulangan jika repeat zone (misal 1 = diulang 1x)
  repeatLabel?: string;     // keterangan zona repeat, misal "Reff", "Chorus", "Intro"
}

export interface StructuralSymbol {
  type: 'DC' | 'DS' | 'Fine' | 'Coda' | 'Segno';
  label?: string;
}

export interface LyricLine {
  id: string;
  notes: NoteAngka[];
  startBarType?: BarLine['type']; // bar type di awal baris (default: 'single')
  barPositions: number[];    // index before which a bar line appears
  barTypes: BarLine[];       // matching bar types for each position
  label?: string;            // e.g., "Intro", "Verse 1", "Chorus"
  structuralSymbols?: Array<{ position: number; symbol: StructuralSymbol }>;
}

// ===========================
// Song Types
// ===========================

export interface SongContent {
  lines: LyricLine[];
}

export interface Song {
  id: string;
  title: string;
  composer: string;
  key: MusicalKey;
  timeSignature: TimeSignature;
  tempo: number;
  genre?: string;
  content: SongContent;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  // Relations (optional — present when loaded from API with includes)
  room?: { code: string; isLocked?: boolean } | null;
  owner?: { id: string; name: string } | null;
}

export interface SongVersion {
  id: string;
  songId: string;
  content: SongContent;
  label: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// ===========================
// Editor State Types
// ===========================

export interface EditorSelection {
  lineId: string;
  noteIndex?: number;
  noteIndexEnd?: number;
  barPosition?: number;      // index where bar line sits
  isStartBar?: boolean;      // true if start-of-line bar line is selected
}

export interface EditorState {
  song: Song;
  selection: EditorSelection | null;
  isPlaying: boolean;
  playbackPosition: number | null; // index of currently playing note
  activeLineId: string | null;
  activeNoteIndex: number | null;
  isDirty: boolean;
  zoom: number;
}

// ===========================
// Playback Types
// ===========================

export type InstrumentName =
  | 'piano'
  | 'organ'
  | 'strings'
  | 'choirPad'
  | 'flute'
  | 'violin'
  | 'guitar'
  | 'musicBox';

export interface PlaybackSettings {
  instrument: InstrumentName;
  tempo: number;
  metronomeOn: boolean;
  metronomeVolume: number;
  accentBeat: boolean;
  volume: number;
}

// ===========================
// Collaboration Types
// ===========================

export type Permission = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface CollaboratorInfo {
  userId: string;
  name: string;
  color: string;
  cursor: EditorSelection | null;
  isTyping: boolean;
}

export interface RoomInfo {
  id: string;
  code: string;
  songId: string;
  isLocked: boolean;
  members: RoomMember[];
}

export interface RoomMember {
  userId: string;
  name: string;
  avatar?: string;
  permission: Permission;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  mentions?: string[];
}

export interface Comment {
  id: string;
  lineIndex: number;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// ===========================
// Export Types
// ===========================

export type ExportFormat = 'pdf' | 'png' | 'jpeg' | 'svg' | 'json' | 'txt' | 'musicxml';

export type PageSize = 'A4' | 'Folio' | 'Letter';

export interface PrintOptions {
  pageSize: PageSize;
  orientation: 'portrait' | 'landscape';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSize: number;
}

// ===========================
// API Response Types
// ===========================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ===========================
// Auth Types
// ===========================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}
