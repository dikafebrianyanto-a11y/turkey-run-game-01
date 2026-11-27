// Gobble Dash — the world simulation.
//
// One object owns the whole run: the turkey, the chasing farmer, the
// obstacles and pickups scrolling in from the right, the particles and the
// score. update() is pure simulation — it never draws — so the same world can
// be stepped deterministically for a screenshot or played live frame by frame.
//
// The run: the turkey sprints right through the farm at dusk while the
// farmer chases from behind. Jump the hay bales and fences, slide under the
// high carving knives, jump the low ones, grab corn for points. Every hit
// costs a heart and lets the farmer close in; three hits — or the farmer
// catching up — and dinner is served. Reach the forest gate at 1500 m and
// the turkey escapes.

(function (global) {
  'use strict';

  const CFG = global.GOBBLE_CFG;

  // Obstacle shapes: w/h in pixels, and how the turkey beats them.
  const OBSTACLES = {
    hay: { w: 64, h: 62, beat: 'jump', score: 0 },
    fence: { w: 48, h: 84, beat: 'jump', score: 0 },
    oven: { w: 88, h: 78, beat: 'jump', score: 0 },
    scarecrow: { w: 52, h: 118, beat: 'jump', score: 0 },
    puddle: { w: 120, h: 18, beat: 'jump', score: 0 },
    knifeHigh: { w: 92, h: 26, beat: 'slide', y: 'high', score: 0 },
    knifeLow: { w: 92, h: 26, beat: 'jump', y: 'low', score: 0 },
  };

  const MILESTONE_TEXT = [
    'The barn is behind you!',
    'Past the pumpkin patch!',
    'The cornfield is yours!',
    'Halfway to the forest!',
    'The farmer is puffing!',
    'Almost to the trees!',
  ];

  function makeWorld(seed) {
    const rng = global.GobbleRng.makeRng(seed || 20261127);
    return {
      seed: seed || 20261127,
      rng: rng,
      state: 'title', // title | play | paused | caught | escaped
      time: 0,
      distancePx: 0,
      speed: CFG.BASE_SPEED,
      score: 0,
      lives: CFG.START_LIVES,
      farmerGap: CFG.FARMER_GAP_START,
      shieldUntil: 0,
      invincibleUntil: 0,
      milestoneIndex: 0,
      banner: null,
      bannerUntil: 0,
      shake: 0,
      best: 0,
      // The turkey: fixed screen x, physics on y.
      turkey: {
        x: 220,
        y: CFG.GROUND_Y,
        vy: 0,
        jumps: 0,
        sliding: false,
        slideUntil: 0,
        runPhase: 0,
        dead: false,
      },
      obstacles: [],
      pickups: [],
      particles: [],
      popups: [],
      decor: [],
      nextSpawnAt: 900,
      nextMilestoneAt: CFG.MILESTONE_EVERY_M,
      stats: { jumps: 0, corn: 0, feathers: 0, pies: 0, hits: 0 },
    };
  }

  function metres(world) {
    return Math.floor(world.distancePx / CFG.PX_PER_METRE);
  }

  function speedFor(world) {
    const m = metres(world);
    return Math.min(CFG.MAX_SPEED, CFG.BASE_SPEED + (m / 100) * CFG.SPEED_RAMP_PER_100M);
  }

  function addPopup(world, x, y, text, color) {
    world.popups.push({ x: x, y: y, text: text, color: color || '#ffd23f', life: 1 });
  }

  function burst(world, x, y, color, n, spread) {
    for (let i = 0; i < n; i++) {
      const a = world.rng.range(0, Math.PI * 2);
      const v = world.rng.range(1.5, spread || 5);
      world.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5,
        life: world.rng.range(0.4, 0.9), maxLife: 0.9,
        size: world.rng.range(3, 8),
        color: color,
      });
    }
  }

  function spawnObstacle(world, x) {
    const m = metres(world);
    // The oven and the knives only appear once the run has warmed up.
    const table = ['hay', 'hay', 'fence', 'fence', 'puddle', 'scarecrow'];
    if (m > 120) table.push('knifeHigh', 'knifeLow');
    if (m > 260) table.push('oven', 'oven');
    const kind = world.rng.pick(table);
    const def = OBSTACLES[kind];
    let y = CFG.GROUND_Y - def.h;
    if (kind === 'knifeHigh') y = CFG.GROUND_Y - 118;
    if (kind === 'knifeLow') y = CFG.GROUND_Y - 26;
    const ob = { kind: kind, x: x, y: y, w: def.w, h: def.h, passed: false, seed: world.rng.next() };
    world.obstacles.push(ob);

    // A corn arc over jumpable obstacles rewards the jump.
    if (def.beat === 'jump' && world.rng.chance(CFG.CORN_ARC_CHANCE)) {
      const n = 3;
      for (let i = 0; i < n; i++) {
        world.pickups.push({
          kind: 'corn',
          x: x + def.w / 2 - 44 + i * 44,
          y: y - 46 - Math.sin((i / (n - 1)) * Math.PI) * 42,
          taken: false, bob: world.rng.next() * Math.PI * 2,
        });
      }
    }
    // Rare treats float high, asking for a double jump.
    if (world.rng.chance(CFG.PIE_CHANCE)) {
      world.pickups.push({
        kind: 'pie', x: x + world.rng.range(120, 220), y: CFG.GROUND_Y - 250,
        taken: false, bob: world.rng.next() * Math.PI * 2,
      });
    }
    if (world.rng.chance(CFG.FEATHER_CHANCE)) {
      world.pickups.push({
        kind: 'feather', x: x + world.rng.range(160, 300), y: CFG.GROUND_Y - 170,
        taken: false, bob: world.rng.next() * Math.PI * 2,
      });
    }
  }

  function turkeyBox(world) {
    const t = world.turkey;
    // Sliding halves the hitbox height; jumping keeps the full body.
    const h = t.sliding ? 44 : 78;
    return { x: t.x - 24, y: t.y - h, w: 50, h: h };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function hitTurkey(world, ob) {
    const t = world.turkey;
    if (world.time < world.invincibleUntil) return;
    if (world.time < world.shieldUntil) {
      // The golden feather eats the hit in a burst of sparks.
      burst(world, t.x, t.y - 40, CFG.FEATHER_GOLD, 18, 6);
      addPopup(world, t.x, t.y - 110, 'SHIELD!', CFG.FEATHER_GOLD);
      world.shieldUntil = 0;
      world.invincibleUntil = world.time + 1.0;
      return;
    }
    world.lives -= 1;
    world.stats.hits += 1;
    world.farmerGap += CFG.FARMER_GAP_HIT;
    world.shake = 14;
    world.invincibleUntil = world.time + 1.4;
    world.events = world.events || [];
    world.events.push('hit');
    burst(world, t.x, t.y - 40, '#ffffff', 16, 6);
    burst(world, t.x, t.y - 40, CFG.TURKEY_BODY, 10, 4);
    addPopup(world, t.x, t.y - 110, 'OUCH!', '#ff5a4a');
    if (world.lives <= 0 || world.farmerGap <= CFG.FARMER_CATCH_GAP) {
      world.state = 'caught';
      t.dead = true;
    }
  }

  function doJump(world) {
    const t = world.turkey;
    if (world.state !== 'play') return false;
    if (t.y >= CFG.GROUND_Y - 0.5 && t.jumps === 0) {
      t.vy = CFG.JUMP_VELOCITY;
      t.jumps = 1;
      t.sliding = false;
      world.stats.jumps += 1;
      return 'jump';
    }
    if (t.jumps === 1 && t.vy > -6) {
      // Double jump: a flap mid-air, only once per leap.
      t.vy = CFG.DOUBLE_JUMP_VELOCITY;
      t.jumps = 2;
      burst(world, t.x, t.y, '#ffffff', 6, 3);
      world.stats.jumps += 1;
      return 'double';
    }
    return false;
  }

  function doSlide(world) {
    const t = world.turkey;
    if (world.state !== 'play') return;
    if (t.y < CFG.GROUND_Y - 0.5) return; // cannot slide mid-air
    t.sliding = true;
    t.slideUntil = world.time + CFG.SLIDE_TIME;
  }

  function update(world, dt, input) {
    // dt is seconds since the last frame; the loop clamps it.
    if (world.state === 'paused' || world.state === 'title') {
      world.time += dt;
      return;
    }
    if (world.state === 'caught' || world.state === 'escaped') {
      world.time += dt;
      updateParticles(world, dt);
      return;
    }

    world.time += dt;
    const t = world.turkey;
    world.speed = speedFor(world);
    const step = world.speed * dt * 60;
    world.distancePx += step;
    world.score = Math.floor(metres(world) * CFG.SCORE_PER_METRE) + world.stats.corn * CFG.SCORE_CORN + world.stats.pies * CFG.SCORE_PIE + world.milestoneIndex * CFG.SCORE_MILESTONE;

    // Milestones: a banner and a breather for the farmer gap.
    if (metres(world) >= world.nextMilestoneAt && world.milestoneIndex < MILESTONE_TEXT.length) {
      world.banner = MILESTONE_TEXT[world.milestoneIndex];
      world.bannerUntil = world.time + 2.2;
      world.milestoneIndex += 1;
      world.nextMilestoneAt += CFG.MILESTONE_EVERY_M;
      world.farmerGap = Math.min(CFG.FARMER_GAP_MAX, world.farmerGap + CFG.FARMER_GAP_MILESTONE);
      world.events = world.events || [];
      world.events.push('milestone');
    }

    // The forest gate: reaching it ends the run in an escape.
    if (metres(world) >= CFG.GOAL_METRES) {
      world.state = 'escaped';
      world.events = world.events || [];
      world.events.push('escaped');
      burst(world, t.x, t.y - 40, CFG.FEATHER_GOLD, 30, 7);
      return;
    }

    // Input.
    if (input.jump) {
      const res = doJump(world);
      if (res) {
        world.events = world.events || [];
        world.events.push(res);
      }
    }
    if (input.slide) doSlide(world);
    if (t.sliding && world.time > t.slideUntil) t.sliding = false;

    // Turkey physics.
    t.vy += CFG.GRAVITY;
    t.y += t.vy;
    if (t.y >= CFG.GROUND_Y) {
      t.y = CFG.GROUND_Y;
      t.vy = 0;
      t.jumps = 0;
    }
    t.runPhase += world.speed * dt * 1.4;

    // The farmer gains a little whenever the turkey dawdles in the air.
    if (t.y < CFG.GROUND_Y - 120) {
      world.farmerGap -= 0.06;
    } else {
      world.farmerGap = Math.min(CFG.FARMER_GAP_MAX, world.farmerGap + 0.12);
    }
    if (world.farmerGap <= CFG.FARMER_CATCH_GAP) {
      world.state = 'caught';
      t.dead = true;
      world.events = world.events || [];
      world.events.push('caught');
      return;
    }

    // Spawning.
    world.nextSpawnAt -= step;
    if (world.nextSpawnAt <= 0) {
      spawnObstacle(world, CFG.WIDTH + 80);
      const span = world.rng.range(CFG.SPAWN_MIN, CFG.SPAWN_MAX);
      world.nextSpawnAt = Math.max(CFG.SPAWN_MIN_FAST, span - world.speed * 8);
    }

    // Move and cull the world.
    const box = turkeyBox(world);
    for (const ob of world.obstacles) {
      ob.x -= step;
      if (!ob.passed && ob.x + ob.w < t.x) {
        ob.passed = true;
      }
      if (!ob.passed && overlap(box, ob)) hitTurkey(world, ob);
    }
    world.obstacles = world.obstacles.filter(function (o) { return o.x + o.w > -140; });

    for (const p of world.pickups) {
      p.x -= step;
      p.bob += dt * 4;
      if (!p.taken) {
        const pb = { x: p.x - 16, y: p.y - 16 + Math.sin(p.bob) * 4, w: 32, h: 32 };
        if (overlap(box, pb)) {
          p.taken = true;
          if (p.kind === 'corn') {
            world.stats.corn += 1;
            addPopup(world, p.x, p.y - 20, '+50', CFG.CORN);
            burst(world, p.x, p.y, CFG.CORN, 8, 4);
            world.farmerGap = Math.min(CFG.FARMER_GAP_MAX, world.farmerGap + CFG.FARMER_GAP_PICKUP);
            world.events = world.events || [];
            world.events.push('pickup');
          } else if (p.kind === 'pie') {
            world.stats.pies += 1;
            addPopup(world, p.x, p.y - 20, '+150 PIE!', CFG.PIE);
            burst(world, p.x, p.y, CFG.PIE, 12, 5);
            world.events = world.events || [];
            world.events.push('pickup');
          } else if (p.kind === 'feather') {
            world.stats.feathers += 1;
            world.shieldUntil = world.time + CFG.SHIELD_SECONDS;
            addPopup(world, p.x, p.y - 20, 'GOLDEN FEATHER!', CFG.FEATHER_GOLD);
            burst(world, p.x, p.y, CFG.FEATHER_GOLD, 14, 5);
            world.events = world.events || [];
            world.events.push('feather');
          }
        }
      }
    }
    world.pickups = world.pickups.filter(function (p) { return !p.taken && p.x > -60; });

    // Dust kicked up while running on the ground.
    if (t.y >= CFG.GROUND_Y - 0.5 && world.rng.chance(0.35)) {
      world.particles.push({
        x: t.x - 24, y: CFG.GROUND_Y + 2,
        vx: -world.speed * 0.4, vy: -world.rng.range(0.2, 1),
        life: 0.5, maxLife: 0.5, size: world.rng.range(3, 6), color: '#d9b380',
      });
    }

    if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 40);
    updateParticles(world, dt);

    for (const p of world.popups) {
      p.y -= dt * 40;
      p.life -= dt * 1.1;
    }
    world.popups = world.popups.filter(function (p) { return p.life > 0; });
  }

  function updateParticles(world, dt) {
    for (const p of world.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= dt;
    }
    world.particles = world.particles.filter(function (p) { return p.life > 0; });
  }

  global.GobbleWorld = {
    makeWorld: makeWorld,
    update: update,
    metres: metres,
    doJump: doJump,
    doSlide: doSlide,
    turkeyBox: turkeyBox,
    OBSTACLES: OBSTACLES,
  };
})(typeof window !== 'undefined' ? window : globalThis);
