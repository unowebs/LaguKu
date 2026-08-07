'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useEditorStore } from '@/store/editorStore';
import {
  noteToFrequency,
  getDurationInSeconds,
} from '@/utils/noteAngka';
import { InstrumentName, NoteAngka, LyricLine } from '@/types';

// Piano synth preset
function createInstrument(name: InstrumentName): Tone.PolySynth | Tone.Synth {
  switch (name) {
    case 'piano':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.5 },
        volume: -6,
      }).toDestination();

    case 'organ':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0, sustain: 1, release: 0.5 },
        volume: -8,
      }).toDestination();

    case 'strings':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.4, decay: 0.1, sustain: 0.9, release: 2 },
        volume: -10,
      }).toDestination();

    case 'flute':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.8 },
        volume: -8,
      }).toDestination();

    case 'violin':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 1.2 },
        volume: -9,
      }).toDestination();

    case 'guitar':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.8 },
        volume: -7,
      }).toDestination();

    case 'musicBox':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
        volume: -6,
      }).toDestination();

    case 'choirPad':
    default:
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.8, decay: 0.3, sustain: 0.9, release: 2 },
        volume: -8,
      }).toDestination();
  }
}

export function usePlayer() {
  const {
    song,
    isPlaying,
    instrument: instrumentName,
    setPlaying,
    setPlaybackPosition,
  } = useEditorStore();

  const synthRef = useRef<Tone.PolySynth | Tone.Synth | null>(null);
  const metronomeSynthRef = useRef<Tone.Synth | null>(null);
  const scheduledEventsRef = useRef<number[]>([]);
  const isInitialized = useRef(false);

  // Initialize Tone.js
  const initialize = useCallback(async () => {
    if (!isInitialized.current) {
      await Tone.start();
      isInitialized.current = true;
    }
  }, []);

  // Update instrument when changed
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.dispose();
    }
    synthRef.current = createInstrument(instrumentName);
  }, [instrumentName]);

  // Flatten all notes into a sequence
  // Flatten all notes into a sequence
  const buildSequence = useCallback(() => {
    if (!song) return [];

    const seq: Array<{
      lineIdx: number;
      noteIdx: number;
      note: NoteAngka;
      time: number;
      playDuration: number;
      skipSound: boolean;
    }> = [];

    let currentTime = 0;
    const bpm = song.tempo;

    song.content.lines.forEach((line, lineIdx) => {
      const notes = line.notes;
      const skipSoundMap = new Map<number, boolean>();
      const playDurationMap = new Map<number, number>();

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const dur = getDurationInSeconds(note, bpm);
        playDurationMap.set(i, dur);
      }

      // Resolve tie chains
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        if (note.tied && !note.isRest && note.pitch !== '0') {
          // Find the tie chain
          let chainDuration = playDurationMap.get(i) || 0;
          let nextIdx = i + 1;
          while (nextIdx < notes.length) {
            const nextNote = notes[nextIdx];
            if (nextNote.pitch === note.pitch && !nextNote.isRest) {
              chainDuration += getDurationInSeconds(nextNote, bpm);
              skipSoundMap.set(nextIdx, true);
              if (nextNote.tied) {
                nextIdx++;
              } else {
                break;
              }
            } else {
              break;
            }
          }
          playDurationMap.set(i, chainDuration);
        }
      }

      notes.forEach((note, noteIdx) => {
        const time = currentTime;
        const dur = getDurationInSeconds(note, bpm);
        const playDuration = playDurationMap.get(noteIdx) || dur;
        const skipSound = skipSoundMap.get(noteIdx) || false;

        seq.push({
          lineIdx,
          noteIdx,
          note,
          time,
          playDuration,
          skipSound,
        });

        currentTime += dur;
      });
    });

    return seq;
  }, [song]);

  const play = useCallback(async () => {
    if (!song || isPlaying) return;
    await initialize();

    const sequence = buildSequence();
    if (sequence.length === 0) return;

    setPlaying(true);
    Tone.getTransport().bpm.value = song.tempo;
    Tone.getTransport().cancel();
    Tone.getTransport().stop();

    const synth = synthRef.current;
    if (!synth) return;

    const startTime = Tone.now() + 0.1;

    sequence.forEach(({ lineIdx, noteIdx, note, time, playDuration, skipSound }) => {
      // Update playback cursor
      Tone.getTransport().schedule(() => {
        setPlaybackPosition(lineIdx, noteIdx);
      }, `+${time}`);

      // Play note
      if (!note.isRest && note.pitch !== '0' && !skipSound) {
        const freq = noteToFrequency(note, song.key);
        if (freq) {
          // Legato/slur notes overlap slightly for smooth transition, regular notes are slightly shorter
          const dur = note.slurred ? playDuration * 1.05 : playDuration * 0.9;
          const durStr = `${dur}`;
          if (synth instanceof Tone.PolySynth) {
            Tone.getTransport().schedule(() => {
              (synth as Tone.PolySynth).triggerAttackRelease(freq, durStr);
            }, `+${time}`);
          }
        }
      }
    });

    // End of song
    const totalTime = sequence[sequence.length - 1].time +
      getDurationInSeconds(sequence[sequence.length - 1].note, song.tempo);

    Tone.getTransport().schedule(() => {
      setPlaying(false);
      setPlaybackPosition(null, null);
    }, `+${totalTime + 0.2}`);

    Tone.getTransport().start();
  }, [song, isPlaying, initialize, buildSequence, setPlaying, setPlaybackPosition]);

  const stop = useCallback(() => {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    setPlaying(false);
    setPlaybackPosition(null, null);
  }, [setPlaying, setPlaybackPosition]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (synthRef.current) synthRef.current.dispose();
      if (metronomeSynthRef.current) metronomeSynthRef.current.dispose();
    };
  }, [stop]);

  return {
    isPlaying,
    play,
    stop,
    togglePlay,
    initialize,
  };
}
