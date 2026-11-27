// Gobble Dash — boot, game loop and state machine.
//
// The loop runs on requestAnimationFrame with a clamped fixed timestep, so
// the run plays the same on a fast or a slow machine. States: title, play,
// paused, caught, escaped. The best distance is kept in localStorage. A
// ?shot= URL prepares a deterministic screenshot state instead of the title
// screen, and the page then reports window.__shotReady once drawn.

(function (global) {
  'use strict';

  const CFG = global.GOBBLE_CFG;
  const BEST_KEY = 'gobble-dash-best-metres';

  function loadBest() {
    try {
      return Number(global.localStorage.getItem(BEST_KEY) || 0) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(m) {
    try {
      global.localStorage.setItem(BEST_KEY, String(m));
    } catch (e) {
      // Private mode or no storage: the run still counts.
    }
  }

  function boot() {
    const canvas = global.document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const audio = global.GobbleAudio.makeAudio();

    let world = global.GobbleWorld.makeWorld(20261127);
    world.best = loadBest();
    const isShot = new URLSearchParams(global.location.search).has('shot');
    if (isShot) {
      world = global.GobbleShots.applyShot(world, global.location.search);
      world.best = world.best || loadBest();
    }

    const input = global.GobbleInput.makeInput(canvas, {
      onFirstGesture: function () {
        audio.unlock();
      },
      onStart: function () {
        if (world.state === 'title') startRun();
      },
      onTap: function () {
        if (world.state === 'title') startRun();
        else if (world.state === 'caught' || world.state === 'escaped') restart();
      },
      onPause: function () {
        if (world.state === 'play') world.state = 'paused';
        else if (world.state === 'paused') world.state = 'play';
      },
      onMute: function () {
        audio.toggleMute();
      },
      onRestart: function () {
        if (world.state !== 'title') restart();
      },
    });

    function startRun() {
      const best = world.best;
      world = global.GobbleWorld.makeWorld((Math.random() * 1e9) | 0);
      world.best = best;
      world.state = 'play';
      audio.gobble();
    }

    function restart() {
      startRun();
    }

    function endRun() {
      const m = global.GobbleWorld.metres(world);
      if (m > world.best) {
        world.best = m;
        saveBest(m);
      }
    }

    let last = global.performance.now();
    let firstFrame = true;

    function frame(now) {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; // clamp: a stalled tab never leaps the run
      if (dt < 0) dt = 0;

      // Drain the world event queue into sounds.
      const before = world.events ? world.events.length : 0;
      if (world.state === 'play') {
        global.GobbleWorld.update(world, dt, input.frame());
      } else if (world.state === 'title' || world.state === 'paused' ||
        world.state === 'caught' || world.state === 'escaped') {
        global.GobbleWorld.update(world, dt, { jump: false, slide: false });
      }
      if (world.events) {
        for (let i = before; i < world.events.length; i++) {
          const ev = world.events[i];
          if (ev === 'jump') audio.jump();
          else if (ev === 'double') audio.doubleJump();
          else if (ev === 'pickup') audio.pickup();
          else if (ev === 'feather') audio.feather();
          else if (ev === 'milestone') audio.milestone();
          else if (ev === 'hit') audio.hit();
          // 'caught' and 'escaped' are sounded once by the _ended block
          // below, whichever path ended the run.
        }
        world.events.length = 0;
      }
      // Caught by lives hitting zero inside hitTurkey() also ends the run.
      if ((world.state === 'caught' || world.state === 'escaped') && !world._ended) {
        world._ended = true;
        endRun();
        if (world.state === 'caught') audio.caught();
        else audio.escaped();
      }

      global.GobbleRender.draw(ctx, world, audio);

      if (firstFrame) {
        firstFrame = false;
        if (isShot) global.__shotReady = true;
      }
      global.requestAnimationFrame(frame);
    }

    // Resize the canvas element to fit the window while keeping 16:9.
    function fit() {
      const w = global.innerWidth;
      const h = global.innerHeight - 28;
      const scale = Math.min(w / CFG.WIDTH, h / CFG.HEIGHT);
      canvas.style.width = Math.floor(CFG.WIDTH * scale) + 'px';
      canvas.style.height = Math.floor(CFG.HEIGHT * scale) + 'px';
    }
    global.addEventListener('resize', fit);
    fit();

    global.requestAnimationFrame(frame);
  }

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
