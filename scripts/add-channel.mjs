#!/usr/bin/env node
/**
 * Adds a campaign short link, updating both files that have to agree.
 *
 * Doing this by hand means editing `public/_redirects` and ATTRIBUTION.md in
 * step, remembering that each link needs a bare and a trailing-slash form, and
 * that these are 302 while the rules above them are 301. That is four chances
 * to get it wrong for something that will be done many times, so it is a
 * command instead.
 *
 *   node scripts/add-channel.mjs <name> <medium> [--source=<s>] [--desc="..."]
 *
 *   node scripts/add-channel.mjs douyin social --desc="Douyin"
 *   node scripts/add-channel.mjs x social --source=twitter --desc="Twitter/X"
 *
 * `name` is the path: /go/<name>. `--source` defaults to it, and needs
 * `--desc` when the value is new. `medium` must already be registered — the
 * mediums are a small closed set describing kinds of channel, and adding one
 * is a decision to make deliberately in ATTRIBUTION.md, not a side effect.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const redirectsPath = join(root, "public/_redirects");
const registryPath = join(root, "ATTRIBUTION.md");

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const flag = (key) => {
    const match = argv.find((a) => a.startsWith(`--${key}=`));
    return match ? match.slice(key.length + 3).replace(/^["']|["']$/g, "") : undefined;
};

const [name, medium] = positional;
const source = flag("source") ?? name;
const desc = flag("desc");

const die = (message) => {
    console.error(`\n${message}\n`);
    process.exit(1);
};

if (!name || !medium) {
    die(
        "usage: node scripts/add-channel.mjs <name> <medium> [--source=<s>] [--desc=\"...\"]\n\n" +
        '  node scripts/add-channel.mjs douyin social --desc="Douyin"\n' +
        '  node scripts/add-channel.mjs x social --source=twitter --desc="Twitter/X"',
    );
}

// Tools compare these literally, so a capital letter or a space silently
// becomes a second channel.
for (const [label, value] of [["name", name], ["source", source], ["medium", medium]]) {
    if (!/^[a-z0-9_]+$/.test(value)) {
        die(`${label} "${value}" must be lowercase letters, digits or underscores`);
    }
}

let redirects = readFileSync(redirectsPath, "utf8");
let registry = readFileSync(registryPath, "utf8");

// Compared as strings rather than by building a pattern from an argument.
// The arguments are validated above, so a crafted value cannot reach here —
// but a regex assembled from input is worth avoiding on its own terms, and
// prefix matching says what this means more plainly than an escaped pattern.
const existingLinks = new Set(
    redirects
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("/go/"))
        .map((line) => line.split(/\s+/)[0].slice(4).replace(/\/$/, "")),
);

if (existingLinks.has(name)) {
    die(`/go/${name} already exists in public/_redirects`);
}

const registered = (heading, value) => {
    const start = registry.indexOf(heading);
    if (start === -1) return false;
    const body = registry.slice(start + heading.length);
    const end = body.indexOf("\n## ");
    const section = end === -1 ? body : body.slice(0, end);
    const prefix = `| \`${value}\` |`;
    return section
        .split("\n")
        .some((line) => line.trimStart().startsWith(prefix));
};

if (!registered("### utm_medium", medium)) {
    die(
        `utm_medium "${medium}" is not registered.\n\n` +
        "Mediums describe kinds of channel and the set stays small on purpose.\n" +
        "If this really is a new kind, add it to ATTRIBUTION.md by hand first.",
    );
}

const sourceIsNew = !registered("### utm_source", source);
if (sourceIsNew && !desc) {
    die(
        `utm_source "${source}" is new, so it needs a description for the registry.\n\n` +
        `  node scripts/add-channel.mjs ${name} ${medium}${flag("source") ? ` --source=${source}` : ""} --desc="…"`,
    );
}

// --- public/_redirects: append, then re-align the whole /go/ block ---------

const target = `/?utm_source=${source}&utm_medium=${medium}`;
const lines = redirects.split("\n");
const isRule = (line) => /^\/go\/\S+\s+\/\?/.test(line);
const lastRule = lines.map(isRule).lastIndexOf(true);
if (lastRule === -1) die("public/_redirects: no /go/ rules to append after");

lines.splice(lastRule + 1, 0, `/go/${name} ${target} 302`, `/go/${name}/ ${target} 302`);

const ruleIndexes = lines.map((l, i) => (isRule(l) ? i : -1)).filter((i) => i !== -1);
const parsed = ruleIndexes.map((i) => lines[i].trim().split(/\s+/));
const fromWidth = Math.max(...parsed.map((p) => p[0].length));
const toWidth = Math.max(...parsed.map((p) => p[1].length));
ruleIndexes.forEach((lineIndex, n) => {
    const [from, to, code] = parsed[n];
    lines[lineIndex] = `${from.padEnd(fromWidth + 1)}${to.padEnd(toWidth + 2)}${code}`;
});
writeFileSync(redirectsPath, lines.join("\n"));

// --- ATTRIBUTION.md: registry row, then the short-links table --------------

/**
 * Appends a row to the last table under a heading.
 *
 * Locating the table by line rather than by the first blank run: a heading may
 * carry a sentence of its own before the table starts, and searching for the
 * next blank line lands between the two, which silently splits the table in
 * half rather than extending it.
 */
function appendTableRow(text, heading, row) {
    const lines = text.split("\n");
    const headingIndex = lines.findIndex((line) => line.startsWith(heading));
    if (headingIndex === -1) return null;

    let lastRow = -1;
    for (let i = headingIndex + 1; i < lines.length; i++) {
        if (lines[i].startsWith("|")) lastRow = i;
        else if (lastRow !== -1) break;
        else if (lines[i].startsWith("#")) break;
    }
    if (lastRow === -1) return null;

    lines.splice(lastRow + 1, 0, row);
    return lines.join("\n");
}

if (sourceIsNew) {
    const updated = appendTableRow(
        registry,
        "### utm_source",
        `| \`${source}\` | ${desc} |`,
    );
    if (!updated) die("ATTRIBUTION.md: could not find the utm_source table");
    registry = updated;
}

const withLink = appendTableRow(
    registry,
    "## Short links",
    `| \`/go/${name}\` | ${source} / ${medium} |`,
);
if (!withLink) die("ATTRIBUTION.md: could not find the short links table");
registry = withLink;

writeFileSync(registryPath, registry);

console.log(`added /go/${name} -> ${target}`);
console.log(`  public/_redirects  two rules (bare and trailing slash)`);
console.log(
    `  ATTRIBUTION.md     short-links table${sourceIsNew ? ` and utm_source "${source}"` : ""}`,
);
console.log(`\nnext: pnpm check:attribution, then commit both files together`);
