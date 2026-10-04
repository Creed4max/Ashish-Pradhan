/**
 * Web Audio API ambient sound generator and session notification chimes.
 * Operates purely locally without external MP3 files.
 */

class AudioController {
  private ctx: AudioContext | null = null;
  private currentAmbientNodes: {
    sources: AudioNode[];
    gain: GainNode;
  } | null = null;
  private currentAmbientType: string | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play pleasant chime for Pomodoro transition
  public playChime(type: 'workEnd' | 'breakEnd' = 'workEnd') {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (type === 'workEnd') {
        // High ascending chime (587.33 D5 -> 880 A5)
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      } else {
        // Soft descending warm chime (659.25 E5 -> 440 A4)
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
      }

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch {
      // Audio might be blocked by browser policy until interaction
    }
  }

  // Start ambient study sound: 'rain', 'whitenoise', 'binaural', or 'off'
  public setAmbientSound(type: 'rain' | 'whitenoise' | 'binaural' | 'off', volume: number = 0.15) {
    this.stopAmbient();
    if (type === 'off') return;

    try {
      const ctx = this.initCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const activeNodes: AudioNode[] = [];

      if (type === 'whitenoise') {
        // Generate pink-ish noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        noise.connect(filter);
        filter.connect(masterGain);
        noise.start();
        activeNodes.push(noise, filter);
      } else if (type === 'rain') {
        // Rain effect: filtered pink noise with modulated lowpass filter
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }

        const rain = ctx.createBufferSource();
        rain.buffer = buffer;
        rain.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        rain.connect(filter);
        filter.connect(masterGain);
        rain.start();
        activeNodes.push(rain, filter);
      } else if (type === 'binaural') {
        // Alpha waves: 210Hz left, 220Hz right (10Hz alpha difference for calm focus)
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        oscL.type = 'sine';
        oscR.type = 'sine';
        oscL.frequency.setValueAtTime(200, ctx.currentTime);
        oscR.frequency.setValueAtTime(210, ctx.currentTime);

        const merger = ctx.createChannelMerger(2);
        oscL.connect(merger, 0, 0); // left channel
        oscR.connect(merger, 0, 1); // right channel

        merger.connect(masterGain);
        oscL.start();
        oscR.start();
        activeNodes.push(oscL, oscR, merger);
      }

      this.currentAmbientNodes = {
        sources: activeNodes,
        gain: masterGain,
      };
      this.currentAmbientType = type;
    } catch {
      // Audio playback initialization failed
    }
  }

  public setVolume(vol: number) {
    if (this.currentAmbientNodes && this.ctx) {
      this.currentAmbientNodes.gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public stopAmbient() {
    if (this.currentAmbientNodes) {
      this.currentAmbientNodes.sources.forEach(node => {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          try {
            (node as AudioScheduledSourceNode).stop();
          } catch {
            // ignore
          }
        }
      });
      this.currentAmbientNodes = null;
      this.currentAmbientType = null;
    }
  }

  public getCurrentAmbientType() {
    return this.currentAmbientType || 'off';
  }
}

export const soundManager = new AudioController();
