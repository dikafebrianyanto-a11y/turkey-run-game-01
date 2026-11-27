// Gobble Dash — keyboard, mouse and touch input.
//
// Input is edge-triggered: the game loop reads a fresh input frame each tick
// (jumpPressed / slidePressed are consumed once) and the held state for the
// slide. Space, ArrowUp and click/tap jump; ArrowDown slides; Enter starts;
// P pauses; M mutes; R restarts. First gesture also unlocks the audio.

(function (global) {
  'use strict';

  function makeInput(canvas, handlers) {
    const held = { slide: false };
    let jumpQueued = false;
    let slideQueued = false;

    function queueJump() {
      jumpQueued = true;
      if (handlers.onFirstGesture) handlers.onFirstGesture();
    }

    function onKeyDown(e) {
      if (e.repeat) return;
      const code = e.code;
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        e.preventDefault();
        queueJump();
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        e.preventDefault();
        held.slide = true;
        slideQueued = true;
        if (handlers.onFirstGesture) handlers.onFirstGesture();
      } else if (code === 'Enter') {
        if (handlers.onStart) handlers.onStart();
      } else if (code === 'KeyP' || code === 'Escape') {
        if (handlers.onPause) handlers.onPause();
      } else if (code === 'KeyM') {
        if (handlers.onMute) handlers.onMute();
      } else if (code === 'KeyR') {
        if (handlers.onRestart) handlers.onRestart();
      }
    }

    function onKeyUp(e) {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') held.slide = false;
    }

    function onPointer(e) {
      e.preventDefault();
      if (handlers.onFirstGesture) handlers.onFirstGesture();
      // A click on the lower third slides; anywhere else jumps.
      const rect = canvas.getBoundingClientRect();
      const y = (e.clientY - rect.top) / rect.height;
      if (y > 0.72) {
        held.slide = true;
        slideQueued = true;
        setTimeout(function () { held.slide = false; }, 450);
      } else {
        queueJump();
      }
      if (handlers.onTap) handlers.onTap();
    }

    global.addEventListener('keydown', onKeyDown);
    global.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });

    return {
      // The frame's input, consumed once per tick by the loop.
      frame: function () {
        const f = {
          jump: jumpQueued,
          slide: slideQueued || held.slide,
        };
        jumpQueued = false;
        slideQueued = false;
        return f;
      },
      isSliding: function () {
        return held.slide;
      },
    };
  }

  global.GobbleInput = { makeInput: makeInput };
})(typeof window !== 'undefined' ? window : globalThis);
