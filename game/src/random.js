// Gobble Dash — a small seeded random number generator.
//
// The whole run is driven by one mulberry32 stream, so a screenshot state or
// a replay with the same seed always plays out the same way. Nothing here
// reads Math.random: the seed is the only source of chance in the game.

(function (global) {
  'use strict';

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seed) {
    const next = mulberry32(seed);
    return {
      next: next,
      // Float in [min, max).
      range: function (min, max) {
        return min + next() * (max - min);
      },
      // Integer in [min, max] inclusive.
      int: function (min, max) {
        return min + Math.floor(next() * (max - min + 1));
      },
      // True with probability p.
      chance: function (p) {
        return next() < p;
      },
      // One element of an array.
      pick: function (arr) {
        return arr[Math.floor(next() * arr.length)];
      },
    };
  }

  global.GobbleRng = { makeRng: makeRng };
})(typeof window !== 'undefined' ? window : globalThis);
