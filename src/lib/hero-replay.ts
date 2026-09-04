// Replay timing for the hero's captured runTeam() DAG.
//
// Every number here comes out of src/data/hero-run.json — a real run captured by
// scripts/capture-hero-dag.mjs. Nothing is invented: the schedule is derived
// from each task's own `durationMs` and its `dependsOn` edges, and the elapsed
// readout ends on the captured `wallMs`.
//
// The model, stated in full:
//   • A task with no dependencies starts at t = 0. The capture ran with
//     maxConcurrency: 3 and produced exactly three roots, so all three of them
//     really did start together; no queueing needs to be modelled.
//   • A dependent task starts when its slowest dependency finishes, which is
//     what the event-driven scheduler does.
//   • The timeline is at least `wallMs` long. The captured wall clock is longer
//     than the last task's finish because a runTeam() wall clock also covers
//     work that is not inside any task (planning the DAG, dispatch, assembling
//     the result). That remainder is left as a tail rather than attributed to a
//     task it did not belong to.
//
// This module is pure and dependency-free so it can be unit-tested with
// `node --test` (scripts/hero-replay.test.mjs) and evaluated at build time; the
// browser only walks the segments it produces.

export interface ReplayTaskInput {
  id: string;
  dependsOn?: readonly string[] | null;
  durationMs?: number | null;
}

export interface ReplaySegment {
  id: string;
  /** Milliseconds into the captured run when the task started. */
  startMs: number;
  /** Milliseconds into the captured run when the task finished. */
  endMs: number;
}

export interface ReplaySchedule {
  segments: ReplaySegment[];
  /** Length of the replayed timeline, in captured-run milliseconds. */
  totalMs: number;
  /** The captured wall clock the elapsed counter must land on. */
  wallMs: number;
  /** Wall-clock target for one replay pass, in real milliseconds. */
  targetMs: number;
}

export type ReplayStatus = 'queued' | 'running' | 'done';

/** One replay pass takes about this long, whatever the captured run took. */
export const REPLAY_TARGET_MS = 4000;

const positive = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

/**
 * Turn captured tasks into a start/end segment each.
 *
 * Unknown dependency ids are ignored (they cannot constrain a start time), and
 * a dependency cycle — which a captured DAG cannot contain, but a future
 * capture format could — resolves to a 0 start instead of recursing forever.
 */
export function computeReplaySchedule(
  tasks: readonly ReplayTaskInput[],
  wallMs: number,
  targetMs: number = REPLAY_TARGET_MS,
): ReplaySchedule {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const ends = new Map<string, number>();
  const visiting = new Set<string>();

  const endOf = (task: ReplayTaskInput): number => {
    const cached = ends.get(task.id);
    if (cached !== undefined) return cached;
    if (visiting.has(task.id)) return 0;
    visiting.add(task.id);
    const end = startOf(task) + positive(task.durationMs);
    visiting.delete(task.id);
    ends.set(task.id, end);
    return end;
  };

  const startOf = (task: ReplayTaskInput): number => {
    const deps = (task.dependsOn ?? [])
      .map((id) => byId.get(id))
      .filter((dep): dep is ReplayTaskInput => dep !== undefined && dep.id !== task.id);
    return deps.length === 0 ? 0 : Math.max(...deps.map(endOf));
  };

  const segments = tasks.map((task) => {
    const startMs = startOf(task);
    return { id: task.id, startMs, endMs: startMs + positive(task.durationMs) };
  });

  const lastEnd = segments.reduce((max, seg) => Math.max(max, seg.endMs), 0);
  return {
    segments,
    totalMs: Math.max(lastEnd, positive(wallMs)),
    wallMs: positive(wallMs),
    targetMs,
  };
}

/** Status of every task at `atMs` milliseconds into the captured run. */
export function replayStatusAt(
  schedule: ReplaySchedule,
  atMs: number,
): Record<string, ReplayStatus> {
  const out: Record<string, ReplayStatus> = {};
  for (const seg of schedule.segments) {
    out[seg.id] = atMs < seg.startMs ? 'queued' : atMs < seg.endMs ? 'running' : 'done';
  }
  return out;
}

/**
 * Captured milliseconds per real millisecond of playback — the compression the
 * replay applies so a two-minute run reads in about four seconds.
 */
export function replaySpeed(schedule: ReplaySchedule): number {
  return schedule.targetMs > 0 ? schedule.totalMs / schedule.targetMs : 0;
}
