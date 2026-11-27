// Gobble Dash — tuning and constants.
//
// Every number that shapes how the game feels lives here, so the run can be
// retuned without touching the simulation or the drawing code. Distances are
// in metres; the world scrolls in pixels and one metre is 50 pixels of travel.

(function (global) {
  'use strict';

  const CFG = {
    // Canvas.
    WIDTH: 1280,
    HEIGHT: 720,
    GROUND_Y: 612,

    // Movement.
    PX_PER_METRE: 50,
    BASE_SPEED: 7.0,
    MAX_SPEED: 14.5,
    SPEED_RAMP_PER_100M: 0.42,
    GRAVITY: 0.85,
    JUMP_VELOCITY: -17.5,
    DOUBLE_JUMP_VELOCITY: -14.5,
    SLIDE_TIME: 0.7,

    // The run.
    GOAL_METRES: 1500,
    START_LIVES: 3,
    FARMER_GAP_START: 300,
    FARMER_GAP_MAX: 340,
    FARMER_GAP_HIT: -78,
    FARMER_GAP_PICKUP: 14,
    FARMER_GAP_MILESTONE: 26,
    FARMER_CATCH_GAP: 8,

    // Scoring.
    SCORE_PER_METRE: 10,
    SCORE_CORN: 50,
    SCORE_PIE: 150,
    SCORE_MILESTONE: 100,

    // Spawning (pixels of travel between spawns, shrinking as speed rises).
    SPAWN_MIN: 430,
    SPAWN_MAX: 760,
    SPAWN_MIN_FAST: 380,

    // Pickups.
    CORN_ARC_CHANCE: 0.55,
    FEATHER_CHANCE: 0.10,
    PIE_CHANCE: 0.07,
    SHIELD_SECONDS: 6,

    // Milestones every 250 m.
    MILESTONE_EVERY_M: 250,

    // Colours — a Thanksgiving dusk: pumpkin sky, plum dusk, warm straw.
    SKY_TOP: '#ff9a3c',
    SKY_MID: '#ff6b4a',
    SKY_BOT: '#7a2e5e',
    SUN_COLOR: '#ffd76a',
    HILL_FAR: '#8a3d63',
    HILL_NEAR: '#5e2447',
    GROUND_TOP: '#c98a3d',
    GROUND_BOT: '#8a5420',
    GRASS: '#7fae4c',
    FENCE: '#6b4423',
    TURKEY_BODY: '#8a5a2b',
    TURKEY_WING: '#6e4520',
    TURKEY_HEAD: '#a06a33',
    TURKEY_WATTLE: '#d9382b',
    TURKEY_BEAK: '#f2a007',
    TURKEY_TAIL: '#5e3a1a',
    FARMER_SHIRT: '#3f6fb5',
    FARMER_HAT: '#e8c96a',
    FARMER_SKIN: '#e8b98a',
    OVEN_GLOW: '#ff5a1f',
    KNIFE: '#dfe6ee',
    CORN: '#ffd23f',
    PIE: '#e86a92',
    FEATHER_GOLD: '#ffe066',
    HUD_BG: 'rgba(43, 22, 8, 0.55)',
    HUD_TEXT: '#fff3d6',
    HUD_ACCENT: '#ffd23f',
  };

  global.GOBBLE_CFG = CFG;
})(typeof window !== 'undefined' ? window : globalThis);
