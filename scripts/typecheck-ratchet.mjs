#!/usr/bin/env node
// ============================================================================
// scripts/typecheck-ratchet.mjs
//
// Runs `tsc --noEmit` and compares the error count against a committed
// baseline (.tsc-baseline). The goal is a one-way ratchet — the count can
// only go down. Net-new errors fail CI; cleanup is welcomed without forcing
// a baseline update inside the failing commit (devs can update the baseline
// in a follow-up commit, or run `npm run typecheck:baseline` locally).
//
// Behaviour:
//   - errors >  baseline  →  exit 1 (CI fails; print delta + new errors)
//   - errors == baseline  →  exit 0 (steady-state; no change required)
//   - errors <  baseline  →  exit 0 (improvement; print suggestion to update
//                                   the baseline, do not auto-commit)
//
// Local cleanup workflow:
//   1. Fix some errors
//   2. Run `npm run typecheck:baseline` to write the new lower count
//   3. Commit the updated .tsc-baseline alongside the fix
// ============================================================================

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const baselinePath = resolve(repoRoot, '.tsc-baseline');
const updateMode = process.argv.includes('--update');

// Run tsc. We intentionally don't fail on non-zero exit here — tsc returns
// non-zero when there are errors, which is the whole point of the ratchet.
let tscOutput = '';
try {
  tscOutput = execSync('npx tsc --noEmit', {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (err) {
  // execSync throws on non-zero exit; the diagnostics live on stdout/stderr.
  tscOutput = (err.stdout ?? '') + (err.stderr ?? '');
}

const errorLines = tscOutput.split('\n').filter((line) => /\berror TS\d+\b/.test(line));
const currentCount = errorLines.length;

console.log(`[ratchet] tsc reports ${currentCount} error(s)`);

// ── Update mode: just write the current count and exit ────────────────────
if (updateMode) {
  writeFileSync(baselinePath, `${currentCount}\n`, 'utf8');
  console.log(`[ratchet] baseline updated to ${currentCount}`);
  process.exit(0);
}

// ── No baseline file yet: bootstrap from current count ────────────────────
if (!existsSync(baselinePath)) {
  writeFileSync(baselinePath, `${currentCount}\n`, 'utf8');
  console.log(`[ratchet] no baseline found — created with ${currentCount}`);
  console.log(`[ratchet] commit .tsc-baseline so CI has something to compare against`);
  process.exit(0);
}

const baseline = parseInt(readFileSync(baselinePath, 'utf8').trim(), 10);
if (!Number.isFinite(baseline)) {
  console.error(`[ratchet] .tsc-baseline is malformed; expected an integer`);
  process.exit(2);
}

console.log(`[ratchet] committed baseline: ${baseline}`);

if (currentCount > baseline) {
  const delta = currentCount - baseline;
  console.error(
    `\n[ratchet] FAIL: tsc errors increased by ${delta} (${baseline} → ${currentCount})`,
  );
  console.error(`[ratchet] new errors must be fixed before this change can land.\n`);
  console.error('First 20 errors from this run:');
  for (const line of errorLines.slice(0, 20)) console.error(`  ${line}`);
  if (errorLines.length > 20) console.error(`  …and ${errorLines.length - 20} more`);
  process.exit(1);
}

if (currentCount < baseline) {
  const delta = baseline - currentCount;
  console.log(
    `[ratchet] cleanup detected — ${delta} fewer error(s) than baseline (${baseline} → ${currentCount})`,
  );
  console.log(`[ratchet] run \`npm run typecheck:baseline\` and commit .tsc-baseline to lock the gain.`);
  process.exit(0);
}

console.log(`[ratchet] steady state. nothing to do.`);
process.exit(0);
