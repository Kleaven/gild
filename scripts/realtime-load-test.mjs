import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CONCURRENT_SUBSCRIBERS = 20;
const TEST_DURATION_MS = 15000;
const FAKE_SPACE_ID = '00000000-0000-0000-0000-000000000001';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const metrics = {
  connectionsAttempted: 0,
  connectionsEstablished: 0,
  connectionsFailed: 0,
  messagesReceived: 0,
  connectionTimes: [],
  errors: [],
};

// Hard timeout — ensures the process never hangs after teardown.
const hardTimeout = setTimeout(() => {
  console.error('\nHard timeout reached — forcing exit');
  process.exit(1);
}, TEST_DURATION_MS + 10000);
hardTimeout.unref();

console.log(`Starting Realtime load test — ${CONCURRENT_SUBSCRIBERS} concurrent subscribers`);
console.log(`Target: ${SUPABASE_URL}`);
console.log(`Hold duration: ${TEST_DURATION_MS / 1000}s\n`);

const clients = [];

// ── RAMP UP ────────────────────────────────────────────────────────────────────

await Promise.all(
  Array.from({ length: CONCURRENT_SUBSCRIBERS }, (_, i) => {
    return new Promise((resolve) => {
      metrics.connectionsAttempted++;
      const start = Date.now();

      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        realtime: { timeout: 10000 },
      });
      clients.push(client);

      const channel = client
        .channel(`posts:${FAKE_SPACE_ID}-${i}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'posts',
            filter: `space_id=eq.${FAKE_SPACE_ID}`,
          },
          () => {
            metrics.messagesReceived++;
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            const elapsed = Date.now() - start;
            metrics.connectionsEstablished++;
            metrics.connectionTimes.push(elapsed);
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            metrics.connectionsFailed++;
            metrics.errors.push(`Subscriber ${i}: ${status}`);
            resolve();
          }
        });

      // Per-subscriber safety resolve — avoids Promise.all hanging if
      // subscribe callback never fires.
      setTimeout(() => {
        if (!metrics.connectionTimes[i] && !metrics.errors.find((e) => e.startsWith(`Subscriber ${i}`))) {
          metrics.connectionsFailed++;
          metrics.errors.push(`Subscriber ${i}: timeout waiting for status`);
          resolve();
        }
      }, 12000);
    });
  }),
);

console.log(`Ramp-up complete. Holding for ${TEST_DURATION_MS / 1000}s...`);

// ── HOLD ───────────────────────────────────────────────────────────────────────

await new Promise((resolve) => setTimeout(resolve, TEST_DURATION_MS));

// ── TEARDOWN ───────────────────────────────────────────────────────────────────

await Promise.all(clients.map((c) => c.removeAllChannels()));
clearTimeout(hardTimeout);

// ── REPORT ────────────────────────────────────────────────────────────────────

console.log('\n━━━ Realtime Load Test Results ━━━');
console.log(`Concurrent subscribers: ${CONCURRENT_SUBSCRIBERS}`);
console.log(`Test duration:           ${TEST_DURATION_MS / 1000}s`);
console.log(`Connections attempted:   ${metrics.connectionsAttempted}`);
console.log(`Connections established: ${metrics.connectionsEstablished}`);
console.log(`Connections failed:      ${metrics.connectionsFailed}`);
console.log(`Messages received:       ${metrics.messagesReceived}`);

const sortedTimes = [...metrics.connectionTimes].sort((a, b) => a - b);

if (sortedTimes.length > 0) {
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const max = sortedTimes[sortedTimes.length - 1];
  console.log(`Connection time p50:     ${p50}ms`);
  console.log(`Connection time p95:     ${p95}ms`);
  console.log(`Connection time max:     ${max}ms`);
}

if (metrics.errors.length > 0) {
  console.log(`\nErrors (${metrics.errors.length}):`);
  metrics.errors.slice(0, 5).forEach((e) => console.log(' -', e));
}

const successRate =
  metrics.connectionsAttempted > 0
    ? metrics.connectionsEstablished / metrics.connectionsAttempted
    : 0;

const p95Time =
  sortedTimes.length > 0
    ? (sortedTimes[Math.floor(sortedTimes.length * 0.95)] ?? 9999)
    : 9999;

console.log('\n━━━ Pass/Fail ━━━');
const checks = [
  {
    name: 'Success rate ≥ 95%',
    pass: successRate >= 0.95,
    value: `${(successRate * 100).toFixed(1)}%`,
  },
  {
    name: 'p95 connection time < 3000ms',
    pass: p95Time < 3000,
    value: `${p95Time}ms`,
  },
];

let allPassed = true;
checks.forEach((c) => {
  const icon = c.pass ? '✅' : '❌';
  console.log(`${icon} ${c.name}: ${c.value}`);
  if (!c.pass) allPassed = false;
});

console.log(allPassed ? '\nRESULT: PASS' : '\nRESULT: FAIL');
process.exit(allPassed ? 0 : 1);
