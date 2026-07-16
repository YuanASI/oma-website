import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { assertValidHeroRun } from './hero-run-schema.mjs'

const captures = [
  ['en', resolve('src/data/hero-run.json')],
  ['zh', resolve('src/data/hero-run.zh.json')],
]

for (const [locale, file] of captures) {
  const run = JSON.parse(await readFile(file, 'utf8'))
  assertValidHeroRun(run, locale)
  console.log(`valid ${locale} hero capture: ${run.runId} (${run.tasks.length} tasks, ${run.provider}/${run.model})`)
}
