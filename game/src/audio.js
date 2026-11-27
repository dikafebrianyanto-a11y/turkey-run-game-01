// Gobble Dash — synthesized sound effects.
//
// No audio files: every sound is built from WebAudio oscillators and filtered
// noise at play time, so the game ships zero audio assets and works offline.
// The context is created lazily on the first user gesture (browsers refuse
// audio before one), and M toggles mute at any time.

(function (global) {
  'use strict';

  function makeAudio() {
    let ctx = null;
    let muted = false;
    let master = null;

    function ensure() {
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
      }
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return ctx;
    }

    function tone(freq, dur, type, vol, slideTo) {
      if (muted) return;
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
      gain.gain.setValueAtTime(vol || 0.2, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    function noiseBurst(dur, vol, lowpass) {
      if (muted) return;
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime;
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass || 1200;
      const gain = c.createGain();
      gain.gain.setValueAtTime(vol || 0.25, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(t0);
    }

    return {
      unlock: function () {
        ensure();
      },
      toggleMute: function () {
        muted = !muted;
        return muted;
      },
      isMuted: function () {
        return muted;
      },
      jump: function () {
        tone(320, 0.16, 'sine', 0.22, 640);
      },
      doubleJump: function () {
        tone(420, 0.14, 'triangle', 0.2, 840);
      },
      pickup: function () {
        tone(880, 0.09, 'sine', 0.2);
        setTimeout(function () { tone(1318, 0.12, 'sine', 0.18); }, 70);
      },
      feather: function () {
        tone(523, 0.12, 'triangle', 0.2, 784);
        setTimeout(function () { tone(1046, 0.2, 'triangle', 0.18, 1568); }, 90);
      },
      hit: function () {
        noiseBurst(0.22, 0.3, 900);
        tone(140, 0.3, 'sawtooth', 0.22, 60);
      },
      gobble: function () {
        // Two quick descending clucks, the turkey's signature.
        tone(300, 0.09, 'square', 0.12, 180);
        setTimeout(function () { tone(280, 0.09, 'square', 0.12, 170); }, 110);
        setTimeout(function () { tone(340, 0.16, 'square', 0.14, 200); }, 230);
      },
      milestone: function () {
        tone(659, 0.1, 'triangle', 0.18);
        setTimeout(function () { tone(880, 0.14, 'triangle', 0.18); }, 90);
      },
      caught: function () {
        tone(220, 0.5, 'sawtooth', 0.2, 55);
        setTimeout(function () { tone(165, 0.7, 'sawtooth', 0.18, 40); }, 200);
      },
      escaped: function () {
        const notes = [523, 659, 784, 1046];
        notes.forEach(function (f, i) {
          setTimeout(function () { tone(f, 0.22, 'triangle', 0.2); }, i * 120);
        });
      },
    };
  }

  global.GobbleAudio = { makeAudio: makeAudio };
})(typeof window !== 'undefined' ? window : globalThis);
