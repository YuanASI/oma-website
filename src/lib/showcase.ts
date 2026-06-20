// Ecosystem entries — the single source for both the landing "production proof"
// section (the `featured` subset) and the /showcase page (all of them). Mirrors
// the framework README "## Ecosystem" section; each entry was checked with
// `gh api` (repo exists + actually uses OMA) per the §5 honesty discipline.
//
// Not listed: apollo-mg (no public-display authorization — decision D4),
// ChetanSai / ParisMolver (PRD §4.4: debunked / signal not triggered), and the
// MiniMax provider offer (a promo, not a user).
export type ShowcaseEntry = {
  pkg: string;
  by: string;
  href: string;
  desc: string;
  tone: 'accent' | 'info' | 'neutral';
  tag: string;
  status: string;
  kind: 'built-with' | 'integration';
  /** Shown in the landing proof section (a curated subset); /showcase shows all. */
  featured?: boolean;
};

export const SHOWCASE: ShowcaseEntry[] = [
  {
    pkg: 'temodar-agent', by: 'by xeloxa', href: 'https://github.com/xeloxa/temodar-agent',
    desc: 'WordPress security analysis platform. Runs OMA built-in tools (bash, file ops, grep) inside a Docker runtime.',
    tone: 'accent', tag: 'security', status: 'on Docker Hub', kind: 'built-with', featured: true,
  },
  {
    pkg: 'PR-Copilot', by: 'by kidoom', href: 'https://github.com/kidoom/PR-Copilot',
    desc: 'AI pull-request review assistant. Runs an OMA review team — a coordinator plus scoped reviewer agents — with custom tools and token-aware diff compression.',
    tone: 'info', tag: 'code review', status: 'built with OMA', kind: 'built-with',
  },
  {
    pkg: 'Engram', by: 'engram-memory.com', href: 'https://github.com/Agentscreator/engram-memory',
    desc: '“Git for AI memory” — shared memory across agents with conflict detection, via an OMA MemoryStore + ToolRegistry toolkit.',
    tone: 'info', tag: 'memory', status: 'toolkit', kind: 'integration', featured: true,
  },
  {
    pkg: '@agentsonar/oma', by: 'agentsonar/agentsonar-oma', href: 'https://github.com/agentsonar/agentsonar-oma',
    desc: 'Sidecar that detects cross-run delegation cycles, repetition, and rate bursts.',
    tone: 'neutral', tag: 'observability', status: 'integration', kind: 'integration', featured: true,
  },
];
