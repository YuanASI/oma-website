// Ecosystem entries — the single source for both the landing "production proof"
// section (the `featured` subset) and the /showcase page (all of them). Mirrors
// the framework README "## Ecosystem" section; each entry was checked with
// `gh api` (repo exists + actually uses OMA) per the §5 honesty discipline.
//
// The `practitioner` kind (Mark Galyan / apollo-mg) is not a project but a named
// deployment + core contributor; it renders as a dedicated spotlight OUTSIDE the
// two project grids — on both the landing proof section and /showcase. Public
// display is authorized by the person (this was decision D4 "no authorization",
// now cleared), so `pkg`/`by` here name a person, not a package.
//
// Not listed: ChetanSai / ParisMolver (PRD §4.4: debunked / signal not
// triggered), and the MiniMax provider offer (a promo, not a user).
export type ShowcaseEntry = {
  pkg: string;
  by: string;
  href: string;
  desc: string;
  tone: 'accent' | 'info' | 'neutral';
  tag: string;
  status: string;
  kind: 'built-with' | 'integration' | 'practitioner';
  /** Shown in the landing proof section (a curated subset); /showcase shows all. */
  featured?: boolean;
};

export const SHOWCASE: ShowcaseEntry[] = [
  {
    pkg: 'Mark Galyan', by: '@apollo-mg', href: 'https://github.com/apollo-mg',
    desc: 'Runs OMA fully offline on local quantized models — no cloud, no API key. The Coordinator and context compaction keep autonomous agent loops alive under tight VRAM limits.',
    tone: 'accent', tag: 'offline · local models',
    status: "Contributor since the framework's first month — across compaction, sampling, and tool-call parsing.",
    kind: 'practitioner', featured: true,
  },
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
    pkg: 'StuFlow', by: 'by znc15', href: 'https://github.com/znc15/StuFlow',
    desc: 'Terminal AI coding assistant. Drives an OMA team through runAgent / runTasks / runTeam with a custom RunTeamOptions coordinator, paired with DeepSeek.',
    tone: 'neutral', tag: 'coding agent', status: 'built with OMA', kind: 'built-with',
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
  {
    pkg: 'CodingScaffold', by: 'JRS1986/CodingScaffold', href: 'https://github.com/JRS1986/CodingScaffold',
    desc: 'Agentic-coding scaffold that lists OMA as an optional orchestration backend, with a runTeam workflow template.',
    tone: 'info', tag: 'scaffold', status: 'optional backend', kind: 'integration',
  },
];
