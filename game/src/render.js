// Gobble Dash — all drawing.
//
// One canvas, one painter: the dusk farm in parallax layers, the turkey and
// the farmer as hand-drawn vector characters, the obstacles and pickups, the
// HUD and the title / pause / end screens. Drawing never touches the
// simulation; it only reads the world, so a screenshot is a faithful render
// of the game's own state.

(function (global) {
  'use strict';

  const CFG = global.GOBBLE_CFG;

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSky(ctx, world, t) {
    const g = ctx.createLinearGradient(0, 0, 0, CFG.HEIGHT);
    g.addColorStop(0, CFG.SKY_TOP);
    g.addColorStop(0.45, CFG.SKY_MID);
    g.addColorStop(1, CFG.SKY_BOT);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CFG.WIDTH, CFG.HEIGHT);

    // Low sun with a warm halo.
    const sx = 980, sy = 250;
    const halo = ctx.createRadialGradient(sx, sy, 10, sx, sy, 190);
    halo.addColorStop(0, 'rgba(255, 215, 106, 0.9)');
    halo.addColorStop(1, 'rgba(255, 215, 106, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(sx - 200, sy - 200, 400, 400);
    ctx.fillStyle = CFG.SUN_COLOR;
    ellipse(ctx, sx, sy, 62, 62);

    // Drifting clouds.
    ctx.fillStyle = 'rgba(255, 236, 210, 0.85)';
    const clouds = [
      { x: ((t * 12) % 1500) - 120, y: 110, s: 1 },
      { x: ((t * 8 + 500) % 1500) - 120, y: 180, s: 0.7 },
      { x: ((t * 15 + 900) % 1500) - 120, y: 70, s: 1.25 },
    ];
    for (const c of clouds) {
      ellipse(ctx, c.x, c.y, 56 * c.s, 18 * c.s);
      ellipse(ctx, c.x + 40 * c.s, c.y + 6, 44 * c.s, 15 * c.s);
      ellipse(ctx, c.x - 42 * c.s, c.y + 7, 38 * c.s, 13 * c.s);
    }

    // Far hills and the barn silhouette.
    ctx.fillStyle = CFG.HILL_FAR;
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.quadraticCurveTo(320, 430, 640, 510);
    ctx.quadraticCurveTo(980, 580, 1280, 470);
    ctx.lineTo(1280, CFG.GROUND_Y);
    ctx.lineTo(0, CFG.GROUND_Y);
    ctx.closePath();
    ctx.fill();
    // Barn with a glowing window.
    ctx.fillStyle = CFG.HILL_NEAR;
    ctx.fillRect(96, 428, 150, 92);
    ctx.beginPath();
    ctx.moveTo(82, 430); ctx.lineTo(171, 388); ctx.lineTo(260, 430); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(158, 462, 26, 26);
    // Windmill turning slowly.
    ctx.strokeStyle = CFG.HILL_NEAR;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(1130, 520); ctx.lineTo(1130, 400);
    ctx.stroke();
    const a = t * 0.5;
    ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      const ang = a + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(1130, 400);
      ctx.lineTo(1130 + Math.cos(ang) * 52, 400 + Math.sin(ang) * 52);
      ctx.stroke();
    }
  }

  function drawGround(ctx, world, t) {
    // The scrolling field: grass strip, dirt, and a fence line.
    const off = (world.distancePx * 1.0) % 96;
    const g = ctx.createLinearGradient(0, CFG.GROUND_Y, 0, CFG.HEIGHT);
    g.addColorStop(0, CFG.GROUND_TOP);
    g.addColorStop(1, CFG.GROUND_BOT);
    ctx.fillStyle = g;
    ctx.fillRect(0, CFG.GROUND_Y, CFG.WIDTH, CFG.HEIGHT - CFG.GROUND_Y);
    ctx.fillStyle = CFG.GRASS;
    ctx.fillRect(0, CFG.GROUND_Y, CFG.WIDTH, 14);

    // Fence posts scrolling past.
    ctx.fillStyle = CFG.FENCE;
    for (let x = -off; x < CFG.WIDTH + 96; x += 96) {
      ctx.fillRect(x, CFG.GROUND_Y - 46, 8, 46);
    }
    ctx.fillRect(0, CFG.GROUND_Y - 40, CFG.WIDTH, 6);
    ctx.fillRect(0, CFG.GROUND_Y - 22, CFG.WIDTH, 6);

    // Grass tufts and pebbles.
    ctx.strokeStyle = '#5d7a35';
    ctx.lineWidth = 2;
    for (let x = -off; x < CFG.WIDTH + 48; x += 48) {
      const sway = Math.sin(t * 2 + x) * 3;
      ctx.beginPath();
      ctx.moveTo(x, CFG.GROUND_Y + 26);
      ctx.lineTo(x + sway, CFG.GROUND_Y + 12);
      ctx.moveTo(x + 8, CFG.GROUND_Y + 26);
      ctx.lineTo(x + 8 + sway, CFG.GROUND_Y + 14);
      ctx.stroke();
    }
    // Pumpkins resting in the field.
    ctx.fillStyle = '#e8722a';
    const pumpkins = [300, 760, 1150];
    for (const px of pumpkins) {
      const x = px - ((world.distancePx * 0.6) % 1400);
      if (x < -60 || x > CFG.WIDTH + 60) continue;
      ellipse(ctx, x, CFG.GROUND_Y + 84, 22, 16);
      ctx.strokeStyle = '#8a5420';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, CFG.GROUND_Y + 68);
      ctx.lineTo(x + 4, CFG.GROUND_Y + 60);
      ctx.stroke();
    }
  }

  function drawTurkey(ctx, world) {
    const t = world.turkey;
    const x = t.x;
    const y = t.y;
    const running = t.y >= CFG.GROUND_Y - 0.5;
    const legSwing = running ? Math.sin(t.runPhase * 6) * 10 : 0;
    const bob = running ? Math.abs(Math.sin(t.runPhase * 6)) * 3 : Math.sin(world.time * 3) * 1.5;
    const blink = world.time < world.invincibleUntil && Math.floor(world.time * 12) % 2 === 0;
    const shield = world.time < world.shieldUntil;

    ctx.save();
    if (blink) ctx.globalAlpha = 0.35;
    ctx.translate(x, y - bob);

    if (t.sliding) {
      // Low slide: body stretched forward, tail up.
      ctx.fillStyle = CFG.TURKEY_BODY;
      ellipse(ctx, 0, -20, 42, 18);
      ctx.fillStyle = CFG.TURKEY_HEAD;
      ellipse(ctx, 34, -30, 16, 14);
      ctx.fillStyle = CFG.TURKEY_BEAK;
      ctx.beginPath();
      ctx.moveTo(46, -34); ctx.lineTo(60, -29); ctx.lineTo(46, -24);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = CFG.TURKEY_WATTLE;
      ellipse(ctx, 40, -18, 5, 8);
      ctx.fillStyle = CFG.TURKEY_TAIL;
      for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.translate(-36, -24);
        ctx.rotate(-0.9 + i * 0.35);
        ellipse(ctx, -14, 0, 20, 7);
        ctx.restore();
      }
      ctx.restore();
      if (shield) drawShield(ctx, x, y - 24);
      return;
    }

    // Tail feathers, fanned.
    ctx.fillStyle = CFG.TURKEY_TAIL;
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(-24, -52);
      ctx.rotate(-0.5 + i * 0.28);
      ellipse(ctx, -18, 0, 26, 9);
      ctx.restore();
    }
    // Legs.
    ctx.strokeStyle = '#f2a007';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-6, -18); ctx.lineTo(-6 + legSwing, 0);
    ctx.moveTo(8, -18); ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();
    // Body.
    ctx.fillStyle = CFG.TURKEY_BODY;
    ellipse(ctx, 0, -38, 34, 30);
    // Wing, flapping a little harder in the air.
    const flap = running ? Math.sin(t.runPhase * 6) * 0.25 : Math.sin(world.time * 6) * 0.5 - 0.4;
    ctx.save();
    ctx.translate(-4, -40);
    ctx.rotate(flap);
    ctx.fillStyle = CFG.TURKEY_WING;
    ellipse(ctx, -6, 0, 22, 13);
    ctx.restore();
    // Head, wattle, beak, eye.
    ctx.fillStyle = CFG.TURKEY_HEAD;
    ellipse(ctx, 28, -62, 17, 15);
    ctx.fillStyle = CFG.TURKEY_WATTLE;
    ellipse(ctx, 34, -50, 6, 10);
    ctx.fillStyle = CFG.TURKEY_BEAK;
    ctx.beginPath();
    ctx.moveTo(42, -66); ctx.lineTo(58, -60); ctx.lineTo(42, -54);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1c1210';
    ellipse(ctx, 32, -66, 3.5, 4.5);
    // A little red comb.
    ctx.fillStyle = CFG.TURKEY_WATTLE;
    ellipse(ctx, 24, -78, 7, 5);

    ctx.restore();
    if (shield) drawShield(ctx, x, y - 40);
  }

  function drawShield(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = CFG.FEATHER_GOLD;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = CFG.FEATHER_GOLD;
    ctx.beginPath();
    ctx.arc(x, y, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFarmer(ctx, world) {
    // The farmer runs in from the left, closing the gap on every mistake.
    const gap = world.farmerGap;
    const x = world.turkey.x - 70 - gap;
    if (x < -120) return;
    const y = CFG.GROUND_Y;
    const ph = world.time * 10;
    const swing = Math.sin(ph) * 8;
    const urgent = gap < 120;

    ctx.save();
    if (urgent && Math.floor(world.time * 6) % 2 === 0) {
      ctx.globalAlpha = 0.9;
    }
    // Legs.
    ctx.strokeStyle = '#2e3a55';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 44); ctx.lineTo(x - 4 + swing, y);
    ctx.moveTo(x + 8, y - 44); ctx.lineTo(x + 8 - swing, y);
    ctx.stroke();
    // Body and shirt.
    ctx.fillStyle = CFG.FARMER_SHIRT;
    rr(ctx, x - 18, y - 92, 40, 52, 8);
    ctx.fill();
    // Overalls straps.
    ctx.fillStyle = '#2e3a55';
    ctx.fillRect(x - 12, y - 92, 6, 30);
    ctx.fillRect(x + 6, y - 92, 6, 30);
    // Head, beard, hat.
    ctx.fillStyle = CFG.FARMER_SKIN;
    ellipse(ctx, x + 2, y - 106, 16, 15);
    ctx.fillStyle = '#e8e0d0';
    ellipse(ctx, x + 4, y - 96, 12, 7);
    ctx.fillStyle = CFG.FARMER_HAT;
    ellipse(ctx, x + 2, y - 118, 22, 7);
    ctx.fillRect(x - 12, y - 138, 28, 22);
    // Pitchfork, raised and ready.
    ctx.strokeStyle = '#8a6a3b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 20, y - 60);
    ctx.lineTo(x + 34, y - 130);
    ctx.stroke();
    ctx.strokeStyle = '#cfd6de';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 34 + i * 7, y - 130);
      ctx.lineTo(x + 34 + i * 7, y - 148);
      ctx.stroke();
    }
    ctx.restore();

    if (urgent) {
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      // Keep the warning on screen even when the farmer hugs the left edge.
      ctx.fillText('HE IS RIGHT BEHIND YOU!', Math.max(x + 40, 175), y - 168);
    }
  }

  function drawObstacle(ctx, ob, world) {
    const x = ob.x, y = ob.y;
    if (ob.kind === 'hay') {
      ctx.fillStyle = '#e8b64c';
      rr(ctx, x, y, ob.w, ob.h, 10);
      ctx.fill();
      ctx.strokeStyle = '#b98a2e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 16); ctx.lineTo(x + ob.w - 8, y + 16);
      ctx.moveTo(x + 8, y + 34); ctx.lineTo(x + ob.w - 8, y + 34);
      ctx.moveTo(x + 8, y + 50); ctx.lineTo(x + ob.w - 8, y + 50);
      ctx.stroke();
      ctx.fillStyle = '#f2cf7a';
      ellipse(ctx, x + ob.w / 2, y + 6, 26, 6);
    } else if (ob.kind === 'fence') {
      ctx.fillStyle = CFG.FENCE;
      ctx.fillRect(x + 6, y, 8, ob.h);
      ctx.fillRect(x + ob.w - 14, y, 8, ob.h);
      ctx.fillRect(x, y + 14, ob.w, 7);
      ctx.fillRect(x, y + 44, ob.w, 7);
      ctx.beginPath();
      ctx.moveTo(x + 6, y); ctx.lineTo(x + 14, y - 10); ctx.lineTo(x + 22, y);
      ctx.moveTo(x + ob.w - 22, y); ctx.lineTo(x + ob.w - 14, y - 10); ctx.lineTo(x + ob.w - 6, y);
      ctx.fill();
    } else if (ob.kind === 'oven') {
      // A glowing Thanksgiving oven, hot and deadly.
      const glow = ctx.createRadialGradient(x + ob.w / 2, y + ob.h / 2, 8, x + ob.w / 2, y + ob.h / 2, 90);
      glow.addColorStop(0, 'rgba(255, 90, 31, 0.55)');
      glow.addColorStop(1, 'rgba(255, 90, 31, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 40, y - 40, ob.w + 80, ob.h + 80);
      ctx.fillStyle = '#3a3a42';
      rr(ctx, x, y, ob.w, ob.h, 8);
      ctx.fill();
      ctx.fillStyle = '#1c1c22';
      rr(ctx, x + 10, y + 12, ob.w - 20, 34, 5);
      ctx.fill();
      ctx.fillStyle = CFG.OVEN_GLOW;
      const flick = 0.7 + Math.sin(world.time * 9 + ob.seed * 20) * 0.3;
      ctx.globalAlpha = flick;
      rr(ctx, x + 16, y + 18, ob.w - 32, 22, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#8a8a96';
      ctx.fillRect(x + 14, y + 52, ob.w - 28, 6);
      ctx.fillStyle = '#ffd76a';
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOT!', x + ob.w / 2, y - 8);
    } else if (ob.kind === 'scarecrow') {
      ctx.strokeStyle = '#6b4423';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + ob.w / 2, y + ob.h);
      ctx.lineTo(x + ob.w / 2, y + 10);
      ctx.moveTo(x + 4, y + 34);
      ctx.lineTo(x + ob.w - 4, y + 34);
      ctx.stroke();
      ctx.fillStyle = '#e8c96a';
      ellipse(ctx, x + ob.w / 2, y + 8, 12, 12);
      ctx.fillStyle = '#3f6fb5';
      ctx.beginPath();
      ctx.moveTo(x + ob.w / 2 - 20, y + 12); ctx.lineTo(x + ob.w / 2 + 20, y + 12);
      ctx.lineTo(x + ob.w / 2 + 20, y + 20); ctx.lineTo(x + ob.w / 2 - 20, y + 20);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a4a2b';
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 34); ctx.lineTo(x + ob.w - 6, y + 34);
      ctx.lineTo(x + ob.w - 14, y + 74); ctx.lineTo(x + 14, y + 74);
      ctx.closePath(); ctx.fill();
    } else if (ob.kind === 'puddle') {
      ctx.fillStyle = '#5a7fb5';
      ellipse(ctx, x + ob.w / 2, y + 9, ob.w / 2, 9);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ellipse(ctx, x + ob.w / 2 - 18, y + 6, 22, 4);
      ctx.fillStyle = '#7a5a2b';
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MUD!', x + ob.w / 2, y - 8);
    } else if (ob.kind === 'knifeHigh' || ob.kind === 'knifeLow') {
      // A carving knife sailing through the air, blade first.
      const bobY = Math.sin(world.time * 6 + ob.seed * 30) * 4;
      ctx.save();
      ctx.translate(x + ob.w / 2, y + ob.h / 2 + bobY);
      ctx.rotate(-0.12);
      ctx.fillStyle = CFG.KNIFE;
      ctx.beginPath();
      ctx.moveTo(-46, -8); ctx.lineTo(18, -13); ctx.lineTo(46, 0); ctx.lineTo(18, 13); ctx.lineTo(-46, 8);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a2a1a';
      rr(ctx, -46, -7, 26, 14, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-30, -6); ctx.lineTo(10, -10); ctx.lineTo(10, -4); ctx.lineTo(-30, -1);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ob.kind === 'knifeHigh' ? 'SLIDE!' : 'JUMP!', x + ob.w / 2, y - 10);
    }
  }

  function drawPickup(ctx, p, world) {
    const bobY = Math.sin(p.bob) * 4;
    const x = p.x, y = p.y + bobY;
    if (p.kind === 'corn') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.5);
      ctx.fillStyle = CFG.CORN;
      ellipse(ctx, 0, 0, 9, 15);
      ctx.fillStyle = '#e8a91c';
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(i * 5 - 1, -10, 2, 20);
      }
      ctx.fillStyle = '#7fae4c';
      ctx.beginPath();
      ctx.moveTo(-6, 12); ctx.lineTo(6, 12); ctx.lineTo(0, 22);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (p.kind === 'pie') {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = CFG.PIE;
      ctx.beginPath();
      ctx.moveTo(-16, 10); ctx.lineTo(16, 10); ctx.lineTo(0, -14);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath();
      ctx.moveTo(-16, 10); ctx.lineTo(16, 10); ctx.lineTo(14, 14); ctx.lineTo(-14, 14);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d9382b';
      ellipse(ctx, 0, -4, 4, 4);
      ctx.restore();
    } else if (p.kind === 'feather') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(world.time * 3 + p.bob) * 0.3);
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
      glow.addColorStop(0, 'rgba(255, 224, 102, 0.7)');
      glow.addColorStop(1, 'rgba(255, 224, 102, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-30, -30, 60, 60);
      ctx.fillStyle = CFG.FEATHER_GOLD;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.quadraticCurveTo(12, 0, 0, 18);
      ctx.quadraticCurveTo(-12, 0, 0, -18);
      ctx.fill();
      ctx.strokeStyle = '#c89b1e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -16); ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawGoalGate(ctx, world) {
    // The forest gate at the end of the run: pines and a wooden arch.
    const m = global.GobbleWorld.metres(world);
    const remaining = CFG.GOAL_METRES - m;
    if (remaining > 90) return;
    const x = CFG.WIDTH - 40 - (90 - remaining) * 14;
    if (x < -80) return;
    ctx.fillStyle = '#2e5d33';
    for (const px of [x - 70, x + 90]) {
      ctx.beginPath();
      ctx.moveTo(px, CFG.GROUND_Y - 150);
      ctx.lineTo(px - 34, CFG.GROUND_Y - 60);
      ctx.lineTo(px + 34, CFG.GROUND_Y - 60);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px, CFG.GROUND_Y - 190);
      ctx.lineTo(px - 26, CFG.GROUND_Y - 120);
      ctx.lineTo(px + 26, CFG.GROUND_Y - 120);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(x - 60, CFG.GROUND_Y - 170, 14, 170);
    ctx.fillRect(x + 46, CFG.GROUND_Y - 170, 14, 170);
    ctx.fillRect(x - 60, CFG.GROUND_Y - 170, 120, 16);
    ctx.fillStyle = '#7fae4c';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FREEDOM', x, CFG.GROUND_Y - 182);
  }

  function drawHud(ctx, world, audio) {
    const m = global.GobbleWorld.metres(world);
    // Top-left panel: score, distance, lives.
    ctx.fillStyle = CFG.HUD_BG;
    rr(ctx, 18, 16, 420, 92, 12);
    ctx.fill();
    ctx.fillStyle = CFG.HUD_TEXT;
    ctx.textAlign = 'left';
    ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
    ctx.fillText('SCORE ' + world.score, 32, 48);
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillStyle = CFG.HUD_ACCENT;
    ctx.fillText(m + ' m  /  ' + CFG.GOAL_METRES + ' m', 32, 76);
    ctx.fillStyle = CFG.HUD_TEXT;
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.fillText('SPEED ' + world.speed.toFixed(1), 32, 98);
    // Hearts.
    for (let i = 0; i < CFG.START_LIVES; i++) {
      const hx = 336 + i * 34;
      const hy = 52;
      ctx.fillStyle = i < world.lives ? '#ff3b30' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 12, hy - 4, hx - 4, hy - 12, hx, hy - 4);
      ctx.bezierCurveTo(hx + 4, hy - 12, hx + 12, hy - 4, hx, hy + 8);
      ctx.fill();
    }
    // Shield timer.
    if (world.time < world.shieldUntil) {
      ctx.fillStyle = CFG.FEATHER_GOLD;
      ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
      ctx.fillText('SHIELD ' + Math.ceil(world.shieldUntil - world.time) + 's', 336, 92);
    }
    // Top-right: mute state.
    ctx.fillStyle = CFG.HUD_BG;
    rr(ctx, CFG.WIDTH - 150, 16, 132, 40, 10);
    ctx.fill();
    ctx.fillStyle = CFG.HUD_TEXT;
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(audio && audio.isMuted() ? 'MUTED (M)' : 'SOUND ON (M)', CFG.WIDTH - 84, 42);

    // Progress bar along the bottom.
    const barW = CFG.WIDTH - 120;
    const progress = Math.min(1, m / CFG.GOAL_METRES);
    ctx.fillStyle = 'rgba(43, 22, 8, 0.55)';
    rr(ctx, 60, CFG.HEIGHT - 30, barW, 14, 7);
    ctx.fill();
    ctx.fillStyle = CFG.HUD_ACCENT;
    rr(ctx, 60, CFG.HEIGHT - 30, Math.max(14, barW * progress), 14, 7);
    ctx.fill();
    // Turkey marker on the bar: a small gold triangle; the gate a green pine.
    const mx = 60 + barW * progress;
    ctx.fillStyle = CFG.HUD_ACCENT;
    ctx.beginPath();
    ctx.moveTo(mx, CFG.HEIGHT - 48);
    ctx.lineTo(mx - 8, CFG.HEIGHT - 34);
    ctx.lineTo(mx + 8, CFG.HEIGHT - 34);
    ctx.closePath(); ctx.fill();
    const gx = 60 + barW + 2;
    ctx.fillStyle = '#2e5d33';
    ctx.beginPath();
    ctx.moveTo(gx, CFG.HEIGHT - 50);
    ctx.lineTo(gx - 9, CFG.HEIGHT - 34);
    ctx.lineTo(gx + 9, CFG.HEIGHT - 34);
    ctx.closePath(); ctx.fill();

    // Milestone banner.
    if (world.banner && world.time < world.bannerUntil) {
      const alpha = Math.min(1, (world.bannerUntil - world.time) * 2);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(43, 22, 8, 0.75)';
      rr(ctx, CFG.WIDTH / 2 - 260, 130, 520, 54, 12);
      ctx.fill();
      ctx.fillStyle = CFG.HUD_ACCENT;
      ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(world.banner, CFG.WIDTH / 2, 166);
      ctx.restore();
    }
  }

  function panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(43, 22, 8, 0.78)';
    rr(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 210, 63, 0.7)';
    ctx.lineWidth = 3;
    rr(ctx, x, y, w, h, 18);
    ctx.stroke();
  }

  function drawTitle(ctx, world) {
    const cx = CFG.WIDTH / 2;
    panel(ctx, cx - 380, 96, 760, 420);
    ctx.textAlign = 'center';
    ctx.fillStyle = CFG.HUD_ACCENT;
    ctx.font = 'bold 76px "Trebuchet MS", sans-serif';
    ctx.fillText('GOBBLE DASH', cx, 190);
    ctx.fillStyle = '#ffb08a';
    ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
    ctx.fillText('The Great Turkey Escape', cx, 232);
    ctx.fillStyle = CFG.HUD_TEXT;
    ctx.font = '20px "Trebuchet MS", sans-serif';
    ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', cx, 272);
    ctx.fillText('Run 1500 m through the farm, dodge the oven and the', cx, 300);
    ctx.fillText('carving knives, grab the corn — and do not get caught.', cx, 328);
    // Controls.
    ctx.fillStyle = CFG.HUD_ACCENT;
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillText('SPACE / CLICK — jump (twice for a flap)    ↓ — slide', cx, 372);
    ctx.fillText('P — pause      M — mute      R — restart', cx, 400);
    // Start prompt, blinking.
    if (Math.floor(world.time * 2) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Trebuchet MS", sans-serif';
      ctx.fillText('▶  PRESS ENTER OR CLICK TO RUN  ◀', cx, 462);
    }
    if (world.best > 0) {
      ctx.fillStyle = CFG.HUD_TEXT;
      ctx.font = '18px "Trebuchet MS", sans-serif';
      ctx.fillText('Best escape so far: ' + world.best + ' m', cx, 496);
    }
  }

  function drawPaused(ctx, world) {
    ctx.fillStyle = 'rgba(20, 8, 4, 0.55)';
    ctx.fillRect(0, 0, CFG.WIDTH, CFG.HEIGHT);
    const cx = CFG.WIDTH / 2;
    panel(ctx, cx - 260, 240, 520, 190);
    ctx.textAlign = 'center';
    ctx.fillStyle = CFG.HUD_ACCENT;
    ctx.font = 'bold 48px "Trebuchet MS", sans-serif';
    ctx.fillText('PAUSED', cx, 320);
    ctx.fillStyle = CFG.HUD_TEXT;
    ctx.font = '22px "Trebuchet MS", sans-serif';
    ctx.fillText('The turkey catches its breath. The farmer waits.', cx, 362);
    ctx.fillText('Press P to keep running.', cx, 394);
  }

  function drawEnd(ctx, world, escaped) {
    const cx = CFG.WIDTH / 2;
    const m = global.GobbleWorld.metres(world);
    panel(ctx, cx - 380, 110, 760, 400);
    ctx.textAlign = 'center';
    if (escaped) {
      ctx.fillStyle = '#8aff9e';
      ctx.font = 'bold 72px "Trebuchet MS", sans-serif';
      ctx.fillText('ESCAPED!', cx, 200);
      ctx.fillStyle = CFG.HUD_TEXT;
      ctx.font = '22px "Trebuchet MS", sans-serif';
      ctx.fillText('Free at last — no dinner table for this turkey.', cx, 244);
      ctx.fillText('The forest welcomes a hero with feathers.', cx, 274);
    } else {
      ctx.fillStyle = '#ff5a4a';
      ctx.font = 'bold 72px "Trebuchet MS", sans-serif';
      ctx.fillText('CAUGHT!', cx, 200);
      ctx.fillStyle = CFG.HUD_TEXT;
      ctx.font = '22px "Trebuchet MS", sans-serif';
      ctx.fillText('The farmer got you. Thanksgiving dinner is served…', cx, 244);
      ctx.fillText('…almost. Turkeys get a rematch.', cx, 274);
    }
    ctx.fillStyle = CFG.HUD_ACCENT;
    ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
    ctx.fillText('SCORE  ' + world.score + '      DISTANCE  ' + m + ' m', cx, 330);
    ctx.fillStyle = CFG.HUD_TEXT;
    ctx.font = '20px "Trebuchet MS", sans-serif';
    ctx.fillText('Corn ' + world.stats.corn + '    Feathers ' + world.stats.feathers +
      '    Pies ' + world.stats.pies + '    Jumps ' + world.stats.jumps, cx, 366);
    if (world.best > 0) {
      ctx.fillText('Best escape: ' + world.best + ' m', cx, 396);
    }
    if (Math.floor(world.time * 2) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
      ctx.fillText('▶  PRESS R OR CLICK TO RUN AGAIN  ◀', cx, 452);
    }
  }

  function drawParticles(ctx, world) {
    for (const p of world.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ellipse(ctx, p.x, p.y, p.size, p.size * 0.7);
    }
    ctx.globalAlpha = 1;
  }

  function drawPopups(ctx, world) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
    for (const p of world.popups) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function draw(ctx, world, audio) {
    ctx.clearRect(0, 0, CFG.WIDTH, CFG.HEIGHT);
    ctx.save();
    if (world.shake > 0) {
      ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
    }
    drawSky(ctx, world, world.time);
    drawGround(ctx, world, world.time);
    drawGoalGate(ctx, world);
    for (const ob of world.obstacles) drawObstacle(ctx, ob, world);
    for (const p of world.pickups) drawPickup(ctx, p, world);
    drawFarmer(ctx, world);
    if (world.state !== 'title') drawTurkey(ctx, world);
    drawParticles(ctx, world);
    drawPopups(ctx, world);
    ctx.restore();

    if (world.state === 'play' || world.state === 'paused') {
      drawHud(ctx, world, audio);
    }
    if (world.state === 'title') {
      // A turkey idles on the title screen.
      drawTurkey(ctx, world);
      drawTitle(ctx, world);
    }
    if (world.state === 'paused') drawPaused(ctx, world);
    if (world.state === 'caught') drawEnd(ctx, world, false);
    if (world.state === 'escaped') drawEnd(ctx, world, true);
  }

  global.GobbleRender = { draw: draw };
})(typeof window !== 'undefined' ? window : globalThis);
