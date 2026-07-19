export const EXAMPLE_GOALS = [
  'start-here',
  'use-case-recipes',
  'orchestration',
  'production-controls',
  'connect-your-stack',
] as const;

export type ExampleGoal = (typeof EXAMPLE_GOALS)[number];
export type ExampleSection = 'goal' | 'models-providers';
export type ExampleFormat = 'script' | 'multi-file' | 'app';
export type ExampleLevel = 'beginner' | 'intermediate' | 'advanced';

export interface CatalogExample {
  id: string;
  path: string;
  title: string;
  description: string;
  section: ExampleSection;
  goal?: ExampleGoal;
  capabilities: string[];
  format: ExampleFormat;
  level: ExampleLevel;
  featuredOrder?: number;
  entrypoints?: string[];
  href: string;
}

export interface ExampleGoalGroup {
  goal: ExampleGoal;
  entries: CatalogExample[];
}

export const PRIMARY_EXAMPLE_LIMITS: Partial<Record<ExampleGoal, number>> = {
  'use-case-recipes': 3,
  'connect-your-stack': 3,
};

export function compareExamples(left: CatalogExample, right: CatalogExample): number {
  if (left.featuredOrder !== undefined || right.featuredOrder !== undefined) {
    if (left.featuredOrder === undefined) return 1;
    if (right.featuredOrder === undefined) return -1;
    const featuredOrder = left.featuredOrder - right.featuredOrder;
    if (featuredOrder !== 0) return featuredOrder;
  }
  return left.title.localeCompare(right.title, 'en') || left.id.localeCompare(right.id, 'en');
}

export function getGoalGroups(entries: readonly CatalogExample[]): ExampleGoalGroup[] {
  return EXAMPLE_GOALS.map((goal) => ({
    goal,
    entries: entries
      .filter((entry) => entry.section === 'goal' && entry.goal === goal)
      .sort(compareExamples),
  }));
}

export function splitGoalEntries(group: ExampleGoalGroup): {
  primary: CatalogExample[];
  remaining: CatalogExample[];
} {
  const featured = group.entries.filter((entry) => entry.featuredOrder !== undefined);
  const primary = featured.slice(0, PRIMARY_EXAMPLE_LIMITS[group.goal] ?? featured.length);
  const primaryIds = new Set(primary.map((entry) => entry.id));
  return {
    primary,
    remaining: group.entries.filter((entry) => !primaryIds.has(entry.id)),
  };
}

export function getModelsProviders(entries: readonly CatalogExample[]): CatalogExample[] {
  return entries
    .filter((entry) => entry.section === 'models-providers')
    .sort(compareExamples);
}

export function getFeaturedUseCases(
  entries: readonly CatalogExample[],
  limit = 3,
): CatalogExample[] {
  const recipes = getGoalGroups(entries)
    .find((group) => group.goal === 'use-case-recipes')
    ?.entries ?? [];
  return recipes
    .filter((entry) => entry.featuredOrder !== undefined)
    .slice(0, limit);
}
