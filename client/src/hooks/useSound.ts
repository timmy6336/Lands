import { useCallback, useRef } from 'react';
import { useUISettings } from './useUISettings';

function getCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext {
  if (!ref.current || ref.current.state === 'closed') {
    ref.current = new AudioContext();
  }
  if (ref.current.state === 'suspended') {
    ref.current.resume();
  }
  return ref.current;
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const { soundEnabled } = useUISettings();

  const playDraw = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(ctxRef);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (_) { /* ignore */ }
  }, [soundEnabled]);

  const playPlay = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(ctxRef);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(52, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.42, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.32);
    } catch (_) { /* ignore */ }
  }, [soundEnabled]);

  const playCounter = useCallback(() => {
    if (!soundEnabled) return;
    try {
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
      gain.gain.setValueAtTime(0.55, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch (_) { /* ignore */ }
  }, [soundEnabled]);

  const playYourTurn = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(ctxRef);
      [440, 554, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch (_) { /* ignore */ }
  }, [soundEnabled]);

  const playDestroy = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(ctxRef);
      const sampleRate = ctx.sampleRate;
      const duration = 0.35;
      const bufferSize = Math.ceil(sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch (_) { /* ignore */ }
  }, [soundEnabled]);

  const playRetrieve = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(ctxRef);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) { /* ignore */ }
  }, [soundEnabled]);

  const playScry = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(ctxRef);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) { /* ignore */ }
  }, [soundEnabled]);

  const playDiscard = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(ctxRef);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) { /* ignore */ }
  }, [soundEnabled]);

  const playVictory = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(ctxRef);
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch (_) { /* ignore */ }
  }, [soundEnabled]);

  const playDefeat = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx(ctxRef);
      [400, 350, 280, 200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch (_) { /* ignore */ }
  }, [soundEnabled]);

  return {
    playDraw, playPlay, playCounter,
    playYourTurn, playDestroy, playRetrieve,
    playScry, playDiscard, playVictory, playDefeat,
  };
}
