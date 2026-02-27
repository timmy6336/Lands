// ─────────────────────────────────────────────────────────────────────────────
// client/src/hooks/useSound.ts
//
// Synthesizes game sound effects using the Web Audio API.
// No audio files are loaded — every sound is generated in real time via
// oscillators, noise buffers, and gain envelopes.
//
// A single AudioContext is shared for the lifetime of the component
// (stored in a ref).  It’s lazily created on first use and resumed on each
// call to work around browser autoplay policies that suspend AudioContext
// until the user interacts with the page.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useRef } from 'react';
import { useUISettings } from './useUISettings';

function getCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext {
  if (!ref.current || ref.current.state === 'closed') {
    ref.current = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (ref.current.state === 'suspended') {
    ref.current.resume();
  }
  return ref.current;
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const { sfxVolume, sfxMuted } = useUISettings();

  /** Soft ascending whoosh — card drawn from deck */
  const playDraw = useCallback(() => {
    try {
      if (sfxMuted) return;
      const ctx = getCtx(ctxRef);
      const vol = 0.18 * sfxVolume;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (_) { /* ignore if AudioContext unavailable */ }
  }, [sfxVolume, sfxMuted]);

  /** Low resonant thud — land played onto field */
  const playPlay = useCallback(() => {
    try {
      if (sfxMuted) return;
      const ctx = getCtx(ctxRef);
      const vol = 0.42 * sfxVolume;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(52, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.32);
    } catch (_) { /* ignore */ }
  }, [sfxVolume, sfxMuted]);

  /** Sharp high-pass noise burst — counter clash */
  const playCounter = useCallback(() => {
    try {
      if (sfxMuted) return;
      if (sfxMuted) return;
      const ctx = getCtx(ctxRef);
      const sampleRate = ctx.sampleRate;
      const duration = 0.09;
      const bufferSize = Math.ceil(sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      filter.Q.value = 1.2;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.55 * sfxVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch (_) { /* ignore */ }
  }, [sfxVolume, sfxMuted]);

  return { playDraw, playPlay, playCounter };
}
