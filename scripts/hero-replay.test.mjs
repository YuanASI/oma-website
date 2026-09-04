// Unit test for the hero DAG replay timing (src/lib/hero-replay.ts).
//
// The replay is animation, so it cannot be verified by looking at a build. What
// can be verified is the arithmetic: that the schedule is derived from the
// captured durationMs / dependsOn and from nothing else, and that the elapsed
// readout lands on the captured wallMs. That is what this file pins.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  REPLAY_TARGET_MS,
  computeReplaySchedule,
  replaySpeed,
  replayStatusAt,
} from '../src/lib/hero-replay.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const capture = async (file) => JSON.parse(await readFile(root + file, 'utf8'));

test('roots start at 0 and a dependent starts on its slowest dependency', () => {
  const schedule = computeReplaySchedule(
    [
      { id: 'a', dependsOn: [], durationMs: 1000 },
      { id: 'b', dependsOn: [], durationMs: 2500 },
      { id: 'c', dependsOn: ['a', 'b'], durationMs: 500 },
    ],
    4000,
  );
  assert.deepEqual(schedule.segments, [
    { id: 'a', startMs: 0, endMs: 1000 },
    { id: 'b', startMs: 0, endMs: 2500 },
    { id: 'c', startMs: 2500, endMs: 3000 },
  ]);
  assert.equal(schedule.totalMs, 4000, 'timeline is at least the captured wall clock');
  assert.equal(schedule.wallMs, 4000);
});

test('the timeline stretches past wallMs when the tasks do', () => {
  const schedule = computeReplaySchedule([{ id: 'a', dependsOn: [], durationMs: 9000 }], 4000);
  assert.equal(schedule.totalMs, 9000);
});

test('missing durations and unknown dependency ids do not break the schedule', () => {
  const schedule = computeReplaySchedule(
    [
      { id: 'a', dependsOn: null, durationMs: null },
      { id: 'b', dependsOn: ['a', 'ghost'], durationMs: 100 },
    ],
    0,
  );
  assert.deepEqual(schedule.segments, [
    { id: 'a', startMs: 0, endMs: 0 },
    { id: 'b', startMs: 0, endMs: 100 },
  ]);
});

test('a dependency cycle terminates instead of recursing forever', () => {
  const schedule = computeReplaySchedule(
    [
      { id: 'a', dependsOn: ['b'], durationMs: 10 },
      { id: 'b', dependsOn: ['a'], durationMs: 10 },
    ],
    0,
  );
  assert.equal(schedule.segments.length, 2);
  for (const seg of schedule.segments) assert.ok(Number.isFinite(seg.endMs));
});

test('statuses walk queued → running → done', () => {
  const schedule = computeReplaySchedule(
    [
      { id: 'a', dependsOn: [], durationMs: 1000 },
      { id: 'b', dependsOn: ['a'], durationMs: 1000 },
    ],
    2000,
  );
  assert.deepEqual(replayStatusAt(schedule, 0), { a: 'running', b: 'queued' });
  assert.deepEqual(replayStatusAt(schedule, 999), { a: 'running', b: 'queued' });
  assert.deepEqual(replayStatusAt(schedule, 1000), { a: 'done', b: 'running' });
  assert.deepEqual(replayStatusAt(schedule, 2000), { a: 'done', b: 'done' });
});

for (const [locale, file] of [
  ['en', 'src/data/hero-run.json'],
  ['zh', 'src/data/hero-run.zh.json'],
]) {
  test(`the ${locale} capture replays inside the target window and ends on its wall clock`, async () => {
    const run = await capture(file);
    const schedule = computeReplaySchedule(run.tasks, run.wallMs);

    // Every task the capture recorded gets a segment, and every duration is the
    // captured one — the replay never invents a task or stretches a duration.
    assert.equal(schedule.segments.length, run.tasks.length);
    for (const task of run.tasks) {
      const seg = schedule.segments.find((s) => s.id === task.id);
      assert.equal(seg.endMs - seg.startMs, task.durationMs);
    }

    // The three roots of this capture ran in parallel under maxConcurrency: 3.
    const roots = run.tasks.filter((t) => (t.dependsOn ?? []).length === 0);
    assert.equal(roots.length, 3);
    for (const root of roots) {
      assert.equal(schedule.segments.find((s) => s.id === root.id).startMs, 0);
    }

    // The synthesizer waits for the slowest of them.
    const leaf = run.tasks.find((t) => (t.dependsOn ?? []).length > 0);
    const slowest = Math.max(...roots.map((t) => t.durationMs));
    assert.equal(schedule.segments.find((s) => s.id === leaf.id).startMs, slowest);

    // Nothing is left running when the counter reaches the captured wall clock.
    const final = replayStatusAt(schedule, schedule.totalMs);
    assert.ok(Object.values(final).every((s) => s === 'done'));
    assert.equal(schedule.wallMs, run.wallMs);

    // And a pass takes about REPLAY_TARGET_MS of real time.
    assert.ok(Math.abs(schedule.totalMs / replaySpeed(schedule) - REPLAY_TARGET_MS) < 1);
  });
}
