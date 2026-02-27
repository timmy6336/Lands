// ─────────────────────────────────────────────────────────────────────────────
// client/src/hooks/useBGMusic.ts
//
// Synthesizes two looping background music tracks with the Web Audio API.
// No audio files required — PCM data is procedurally generated into buffers.
//
//   'menu'  — peaceful Dm7 ambient pad (8-bar, ~6.9s loop)
//   'game'  — tense Em rhythmic drone (4-bar, ~5.3s loop)
//
// Usage:
//   const { playBGM, stopBGM } = useBGMusic();
//   playBGM('menu'); // fades in over 1.5s
//   stopBGM();       // fades out over 1s
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef } from 'react';
import { useUISettings } from './useUISettings';

export type BGMTrack = 'menu' | 'game' | null;

// ─── tiny helpers ────────────────────────────────────────────────────────────

function sin(hz: number, t: number, phase = 0): number {
  return Math.sin(2 * Math.PI * hz * t + phase);
}

/** Cosine fade-in/out window so the buffer loops without a click */
function loopWindow(t: number, dur: number, fade = 0.06): number {
  if (t < fade)        return 0.5 - 0.5 * Math.cos(Math.PI * t / fade);
  if (t > dur - fade)  return 0.5 - 0.5 * Math.cos(Math.PI * (dur - t) / fade);
  return 1;
}

// ─── Menu theme ──────────────────────────────────────────────────────────────
// Dm7 ambient pad (D3 F3 A3 C4) + gentle arpeggio, BPM 68, 8-bar loop

function buildMenuBuffer(ctx: AudioContext): AudioBuffer {
  const sr  = ctx.sampleRate;
  const bpm = 68;
  // 8 bars of 4/4 = 32 beats
  const dur = (60 / bpm) * 32;
  const len = Math.ceil(sr * dur);
  const buf = ctx.createBuffer(2, len, sr);
  const L   = buf.getChannelData(0);
  const R   = buf.getChannelData(1);

  // Chord voicings across the 8-bar progression
  // Dm7 → Am7 → Gm7 → Dm7 (2 bars each)
  const barBeats  = 4;
  const beatSec   = 60 / bpm;
  const barSec    = barBeats * beatSec;
  const chords: number[][] = [
    [146.83, 174.61, 220.00, 261.63],  // Dm7  (bars 1-2)
    [220.00, 261.63, 329.63, 392.00],  // Am7  (bars 3-4)
    [196.00, 233.08, 293.66, 349.23],  // Gm7  (bars 5-6)
    [146.83, 174.61, 220.00, 261.63],  // Dm7  (bars 7-8)
  ];

  // Arpeggio pattern per chord (8th notes up, then down)
  const arpMult  = [1, 1.25, 1.5, 2.0, 1.5, 1.25]; // ratio offsets from root
  const eighthSec = beatSec / 2;

  for (let i = 0; i < len; i++) {
    const t    = i / sr;
    const win  = loopWindow(t, dur);
    const bar  = Math.floor(t / barSec);
    const chord = chords[Math.min(Math.floor(bar / 2), chords.length - 1)];

    // ── Pad (soft sine with slight triangle harmonic for warmth) ──
    let pad = 0;
    const slowLFO = 1 + 0.03 * sin(0.25, t);              // gentle tremolo
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      const detune1 = 1 + 0.0008 * sin(0.18, t, c * 1.3);  // per-voice drift
      const detune2 = 1 - 0.0008 * sin(0.18, t, c * 0.8);
      pad += 0.055 * sin(f * detune1, t);                   // fundamental
      pad += 0.018 * sin(f * 2 * detune2, t);               // octave
      pad += 0.007 * sin(f * 3, t);                         // 5th harmonic
    }
    pad *= slowLFO;

    // ── Arpeggio (soft triangle wave) ──
    const root = chord[0];
    const arpStep = Math.floor((t % (eighthSec * 6)) / eighthSec) % arpMult.length;
    const arpFreq = root * arpMult[arpStep];
    const arpPhase = (t % eighthSec) / eighthSec;
    const arpEnv = Math.min(arpPhase * 18, 1) * Math.pow(1 - arpPhase, 1.2);
    let arp = 0;
    // Triangle approximation
    arp  = 0.10 * arpEnv * sin(arpFreq, t);
    arp += 0.025 * arpEnv * sin(arpFreq * 3, t) / 9;
    arp += 0.011 * arpEnv * sin(arpFreq * 5, t) / 25;

    // ── Sub bass pulse (root D2) ──
    const bassPhase = (t % barSec) / barSec;
    const bassEnv   = Math.pow(1 - bassPhase, 0.8) * Math.min(bassPhase * 10, 1);
    const bass = 0.07 * bassEnv * sin(73.42, t);  // D2

    // Combine + stereo width
    const mono  = (pad + arp + bass) * win;
    const width = 0.025 * sin(217.46, t) * win;   // very slight detune only on L
    L[i] = mono + width;
    R[i] = mono - width;
  }

  return buf;
}

// ─── Game theme ──────────────────────────────────────────────────────────────
// Em pulse drone + rhythmic hi-hat and kick, BPM 90, 4-bar loop

function buildGameBuffer(ctx: AudioContext): AudioBuffer {
  const sr  = ctx.sampleRate;
  const bpm = 90;
  // 4 bars of 4/4 = 16 beats
  const dur = (60 / bpm) * 16;
  const len = Math.ceil(sr * dur);
  const buf = ctx.createBuffer(2, len, sr);
  const L   = buf.getChannelData(0);
  const R   = buf.getChannelData(1);

  const beatSec      = 60 / bpm;
  const sixteenthSec = beatSec / 4;

  // Em chord voicing: E2 B2 E3 G3 B3 E4
  const droneFreqs = [82.41, 123.47, 164.81, 196.00, 246.94, 329.63];

  // Rhythmic arpeggio: E2 G3 B3 E3 (quarter notes)
  const arpPat = [82.41, 196.00, 246.94, 164.81];

  // 16-step patterns (sixteenth notes)
  // Kick: beats 1 & 3
  const kickPat = [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0];
  // Accent: beat 2 & 4 (snare-like)
  const snarePat = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
  // Hi-hat: eighth notes
  const hihatPat = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0];

  // Pre-generate a noise buffer for hi-hat/snare (deterministic via LCG)
  let lcg = 1337;
  function noise(): number {
    lcg = (lcg * 1664525 + 1013904223) & 0xffffffff;
    return (lcg / 0x80000000) - 1;
  }

  for (let i = 0; i < len; i++) {
    const t    = i / sr;
    const win  = loopWindow(t, dur);

    const step     = Math.floor(t / sixteenthSec) % 16;
    const stepFrac = (t % sixteenthSec) / sixteenthSec;

    // ── Drone pad ──
    let pad = 0;
    const tenseLFO = 1 + 0.02 * sin(4, t);
    for (let d = 0; d < droneFreqs.length; d++) {
      pad += 0.025 * sin(droneFreqs[d], t);
    }
    pad *= tenseLFO;

    // ── Quarter-note pulse on bass ──
    const pulsePhase = (t % beatSec) / beatSec;
    const pulseEnv   = Math.pow(1 - pulsePhase, 0.55) * Math.min(pulsePhase * 12, 1);
    const pulse = 0.10 * pulseEnv * sin(82.41, t);   // E2 punch

    // ── Rhythmic arpeggio ──
    const arpBeat  = Math.floor(t / beatSec) % arpPat.length;
    const arpFrac  = (t % beatSec) / beatSec;
    const arpEnv   = Math.min(arpFrac * 14, 1) * Math.pow(1 - arpFrac, 1.4);
    const arp = 0.07 * arpEnv * sin(arpPat[arpBeat], t);

    // ── Kick (sine with pitch drop) ──
    let kick = 0;
    if (kickPat[step]) {
      const env = Math.pow(1 - stepFrac, 1.8);
      const freq = 80 * Math.pow(0.06, stepFrac * 2);
      kick = 0.18 * env * sin(freq, t);
    }

    // ── Snare-like noise burst ──
    let snare = 0;
    if (snarePat[step] && stepFrac < 0.35) {
      const env = Math.pow(1 - stepFrac / 0.35, 1.5);
      snare = 0.07 * env * noise();
    }

    // ── Hi-hat (short filtered noise) ──
    let hihat = 0;
    if (hihatPat[step] && stepFrac < 0.12) {
      const env = (1 - stepFrac / 0.12) * 0.022;
      hihat = env * noise();
    }

    const mono = (pad + pulse + arp + kick + snare + hihat) * win;
    L[i] = mono;
    R[i] = mono;
  }

  return buf;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBGMusic() {
  const { musicVolume, musicMuted } = useUISettings();
  const ctxRef       = useRef<AudioContext | null>(null);
  const masterRef    = useRef<GainNode | null>(null);
  const sourceRef    = useRef<AudioBufferSourceNode | null>(null);
  const currentRef   = useRef<BGMTrack>(null);
  const menuBufRef   = useRef<AudioBuffer | null>(null);
  const gameBufRef   = useRef<AudioBuffer | null>(null);
  const stoppingRef  = useRef(false);

  function getCtx(): AudioContext {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }

  function killSource() {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (_) { /* already stopped */ }
      sourceRef.current = null;
    }
  }

  const stopBGM = useCallback((immediate = false) => {
    if (!masterRef.current || !ctxRef.current || currentRef.current === null) return;
    currentRef.current = null;
    stoppingRef.current = true;
    const now = ctxRef.current.currentTime;
    if (immediate) {
      masterRef.current.gain.setValueAtTime(0, now);
      killSource();
      stoppingRef.current = false;
    } else {
      masterRef.current.gain.linearRampToValueAtTime(0, now + 1.0);
      const src = sourceRef.current;
      sourceRef.current = null;
      setTimeout(() => {
        try { src?.stop(); } catch (_) {}
        stoppingRef.current = false;
      }, 1200);
    }
  }, []);

  const playBGM = useCallback((track: BGMTrack) => {
    if (track === null) { stopBGM(); return; }
    if (track === currentRef.current && !stoppingRef.current) return;

    let ctx: AudioContext;
    try { ctx = getCtx(); } catch (_) { return; }

    // Set up master gain node (reuse if valid)
    if (!masterRef.current || masterRef.current.context !== ctx) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.connect(ctx.destination);
      masterRef.current = g;
    }

    // Fade out old source quickly before starting new one
    killSource();
    stoppingRef.current = false;
    currentRef.current = track;

    // Build buffer on first use (cached after that)
    if (track === 'menu') {
      if (!menuBufRef.current) menuBufRef.current = buildMenuBuffer(ctx);
    } else {
      if (!gameBufRef.current) gameBufRef.current = buildGameBuffer(ctx);
    }
    const buffer = track === 'menu' ? menuBufRef.current! : gameBufRef.current!;

    const source = ctx.createBufferSource();
    source.buffer  = buffer;
    source.loop    = true;
    source.connect(masterRef.current);
    source.start(ctx.currentTime);
    sourceRef.current = source;

    // Fade in
    const targetVol = (track === 'menu' ? 0.55 : 0.44) * (musicMuted ? 0 : musicVolume);
    const now = ctx.currentTime;
    masterRef.current.gain.cancelScheduledValues(now);
    masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
    masterRef.current.gain.linearRampToValueAtTime(targetVol, now + 1.8);
  }, [stopBGM]);

  // Sync volume / mute changes to the master gain in real time
  useEffect(() => {
    if (!masterRef.current || !ctxRef.current || currentRef.current === null) return;
    const target = (currentRef.current === 'menu' ? 0.55 : 0.44) * (musicMuted ? 0 : musicVolume);
    const now = ctxRef.current.currentTime;
    masterRef.current.gain.cancelScheduledValues(now);
    masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
    masterRef.current.gain.linearRampToValueAtTime(target, now + 0.15);
  }, [musicVolume, musicMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      killSource();
      ctxRef.current?.close();
    };
  }, []);

  return { playBGM, stopBGM };
}
