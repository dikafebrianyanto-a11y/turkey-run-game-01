# Gobble Dash — The Great Turkey Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/dikafebrianyanto-a11y/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/dikafebrianyanto-a11y/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Thanksgiving is coming, and one turkey refuses to be dinner. **Gobble Dash** is a
fast side-scrolling escape through a farm at dusk: sprint past the barn, jump the
hay bales and fences, slide under the high carving knives, leap the low ones, and
stay ahead of the farmer — while the oven glows hot behind every fence. Grab corn
for points, catch a golden feather for a shield, and reach the forest gate at
1500 m to escape for good.

An entry for the [make.fun](https://make.fun) bounty
[turkey-run-game-01](https://make.fun/bounty/turkey-run-game-01) — $250, top 20
share the prize.

## Run it

```sh
node serve.ts        # serves game/ at http://127.0.0.1:8080/
```

Or open `game/index.html` directly in a desktop browser. No build step, no
network requests, no assets to download — the game is static files and
synthesized WebAudio sound.

## How to play

| Key / gesture | Action |
| --- | --- |
| Space / ↑ / click | Jump (press again mid-air to flap — double jump) |
| ↓ / click low | Slide under the high carving knives |
| Enter | Start the run |
| P | Pause |
| M | Mute |
| R | Restart |

- **3 hearts.** Every hit costs one and lets the farmer close in. Lose them
  all — or let the farmer catch up — and you are Thanksgiving dinner.
- **Corn** +50, **pumpkin pie** +150, **golden feather** a 6-second shield.
- **Milestones** every 250 m push the farmer back and pay +100.
- **1500 m** reaches the forest gate: ESCAPED.
- Best distance is saved on your machine.

## What is in the repo

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to the output
  directory and writes `dossier.json` with the vendored make.fun library.
- `serve.ts` — a tiny static server for play-testing.
- `game/` — the playable game: `index.html` plus `src/` (config, seeded RNG,
  synthesized audio, world simulation, rendering, input, screenshot states,
  game loop). Canvas 2D only, zero external requests.
- `screenshots/` — four real renders of the game's own code: title, mid-run,
  caught, escaped (see `shots.json` for the exact shot URLs).
- `vendor/makefun-game.ts` — the make.fun dossier library, copied unchanged
  from the kit.
