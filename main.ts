// Gobble Dash — entrypoint: hands the game in.
//
// Copies game/ and screenshots/ from this repository into the grader's output
// directory and writes /output/dossier.json with buildDossier from the vendored
// make.fun library. Runs twice on the grader and must write identical bytes
// both times, so every step here is deterministic: fixed file order, no
// timestamps, no randomness. The output directory itself is never removed —
// only the entries this program owns inside it (game/, screenshots/,
// dossier.json) are cleared before the copy, because the grader mounts that
// directory as a volume and deleting it fails with a busy device error.
//
//   MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
//   node main.ts            (writes to /output)

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// The scorer's caps for this bounty, from the vendored library's header:
// at most 4 screenshots of 256 KiB each, text cap 160 KiB, 993 game entries.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

function clearOwnedEntries(dir: string): void {
  // Remove only the entries this program writes, never the directory itself.
  for (const name of ['game', 'screenshots', 'dossier.json']) {
    const target = join(dir, name);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
    }
  }
}

function main(): void {
  const gameDir = join(REPO_ROOT, 'game');
  const shotsDir = join(REPO_ROOT, 'screenshots');
  if (!existsSync(gameDir)) {
    throw new Error('game/ is missing from the repository root');
  }
  if (!existsSync(shotsDir)) {
    throw new Error('screenshots/ is missing from the repository root');
  }

  mkdirSync(OUT_DIR, { recursive: true });
  clearOwnedEntries(OUT_DIR);

  // Copy in a fixed order so the two grader runs see the same bytes.
  cpSync(gameDir, join(OUT_DIR, 'game'), { recursive: true });
  cpSync(shotsDir, join(OUT_DIR, 'screenshots'), { recursive: true });

  const dossier = buildDossier(OUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUT_DIR, 'dossier.json'), dossier);

  console.log(`Gobble Dash handed in: game/ + screenshots/ + dossier.json (${dossier.length} bytes) -> ${OUT_DIR}`);
}

main();
