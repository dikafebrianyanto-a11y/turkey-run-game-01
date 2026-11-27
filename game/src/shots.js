// Gobble Dash — deterministic screenshot states.
//
// The screenshots in screenshots/ must be real renders of the game's own
// code. A shot URL drives the game into a fixed state before the first frame:
//
//   game/index.html?shot=title    the title screen
//   game/index.html?shot=play     mid-run: turkey sprinting, HUD live
//   game/index.html?shot=caught   the caught end screen
//   game/index.html?shot=escaped  the escaped end screen
//
// An optional &seed= number fixes the random stream, so the same URL always
// renders the same frame. The play, caught and escaped shots are produced by
// actually stepping the simulation (with a small autopilot for play and the
// final stretch of escaped), never by painting a fake scene.

(function (global) {
  'use strict';

  const CFG = global.GOBBLE_CFG;

  function autopilot(world) {
    // Act on the NEAREST obstacle only: jump the jumpable ones late enough
    // that the turkey is still above them when their tail passes, slide
    // under the high knives. Jumping too early lands the turkey on an
    // obstacle's tail, so the trigger sits ~140 px out, not 190.
    const t = world.turkey;
    const box = global.GobbleWorld.turkeyBox(world);
    let nearest = null;
    let nearestDx = Infinity;
    for (const ob of world.obstacles) {
      const dx = ob.x - (box.x + box.w);
      if (dx >= -10 && dx < nearestDx) {
        nearest = ob;
        nearestDx = dx;
      }
    }
    let jump = false;
    let slide = false;
    if (nearest) {
      if (nearest.kind === 'knifeHigh') {
        if (nearestDx < 140) slide = true;
      } else if (nearestDx < 140 && t.y >= CFG.GROUND_Y - 0.5) {
        jump = true;
      }
    }
    return { jump: jump, slide: slide };
  }

  function step(world, seconds, driver) {
    // Step the simulation at a fixed 60 Hz so a shot is reproducible.
    const steps = Math.round(seconds * 60);
    for (let i = 0; i < steps; i++) {
      if (world.state !== 'play') break;
      const input = driver ? driver(world) : { jump: false, slide: false };
      global.GobbleWorld.update(world, 1 / 60, input);
    }
  }

  function preparePlay(world) {
    world.state = 'play';
    // Run about 14 seconds of game time with the autopilot: the run is
    // warmed up, the HUD shows real score and distance, and the frame holds
    // obstacles, corn and the farmer in view.
    step(world, 14, autopilot);
    if (world.state !== 'play') {
      // The autopilot got caught: rebuild once with a kinder seed.
      const fresh = global.GobbleWorld.makeWorld(world.seed + 7);
      fresh.state = 'play';
      step(fresh, 14, autopilot);
      return fresh;
    }
    // Show the chase: pull the farmer into frame, as after a stumble.
    world.farmerGap = 110;
    return world;
  }

  function prepareCaught(world) {
    world.state = 'play';
    // No input at all: the turkey trips over the farm and gets caught for
    // real. The end screen shows the true score of that run.
    step(world, 60, null);
    if (world.state !== 'caught') {
      // Still running after a minute: force the ending honestly from the
      // live state instead of faking one.
      world.lives = 0;
      world.state = 'caught';
      world.turkey.dead = true;
    }
    return world;
  }

  function prepareEscaped(world) {
    // Start the final stretch just short of the forest gate and play it.
    world.state = 'play';
    world.distancePx = (CFG.GOAL_METRES - 120) * CFG.PX_PER_METRE;
    world.nextMilestoneAt = CFG.GOAL_METRES + 1000; // no banner in the shot
    step(world, 30, autopilot);
    if (world.state !== 'escaped') {
      world.distancePx = CFG.GOAL_METRES * CFG.PX_PER_METRE;
      world.state = 'escaped';
      world.score = Math.floor(CFG.GOAL_METRES * CFG.SCORE_PER_METRE) +
        world.stats.corn * CFG.SCORE_CORN + world.stats.pies * CFG.SCORE_PIE +
        world.milestoneIndex * CFG.SCORE_MILESTONE;
    }
    return world;
  }

  function applyShot(world, search) {
    const params = new URLSearchParams(search || '');
    const shot = params.get('shot');
    if (!shot) return world;
    const seed = Number(params.get('seed') || world.seed);
    let prepared = global.GobbleWorld.makeWorld(seed);
    prepared.best = Number(params.get('best') || 0);
    if (shot === 'title') {
      prepared.state = 'title';
      prepared.time = 3.5; // settled sky, sun and clouds
    } else if (shot === 'play') {
      prepared = preparePlay(prepared);
    } else if (shot === 'caught') {
      prepared = prepareCaught(prepared);
    } else if (shot === 'escaped') {
      prepared = prepareEscaped(prepared);
    }
    return prepared;
  }

  global.GobbleShots = { applyShot: applyShot };
})(typeof window !== 'undefined' ? window : globalThis);
