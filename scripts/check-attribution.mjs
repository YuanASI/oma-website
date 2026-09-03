#!/usr/bin/env node
/**
 * Checks that the campaign short links and the attribution registry agree.
 *
 * ATTRIBUTION.md is only useful while it describes what the site actually
 * does. Nothing else verifies that: `public/` is copied verbatim at build
 * time, so no build step reads `_redirects` at all, and a link added to one
 * file but not the other stays wrong until someone reads a dashboard and
 * cannot explain a value.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const redirectsPath = join(root, "public/_redirects");
const registryPath = join(root, "ATTRIBUTION.md");

const errors = [];
const fail = (message) => errors.push(message);

/** Rules of the form `/go/<name>[/]  /?utm_source=..&utm_medium=..  <code>`. */
function parseShortLinks(text) {
    const rules = [];
    for (const [index, line] of text.split("\n").entries()) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("/go/")) continue;

        const [from, to, code] = trimmed.split(/\s+/);
        const params = new URLSearchParams(to.split("?")[1] ?? "");
        rules.push({
            line: index + 1,
            from,
            name: from.replace(/^\/go\//, "").replace(/\/$/, ""),
            trailingSlash: from.endsWith("/"),
            to,
            code,
            source: params.get("utm_source"),
            medium: params.get("utm_medium"),
        });
    }
    return rules;
}

/** First-column values of the markdown table following a heading. */
function parseTableColumn(text, heading, column = 0) {
    const start = text.indexOf(heading);
    if (start === -1) {
        fail(`ATTRIBUTION.md: heading not found: ${heading}`);
        return [];
    }
    const body = text.slice(start + heading.length);
    const values = [];
    for (const line of body.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("|")) {
            // Stop at the first non-table line after the table has begun.
            if (values.length > 0) break;
            continue;
        }
        const cells = trimmed.split("|").slice(1, -1).map((c) => c.trim());
        if (cells.every((c) => /^-+$/.test(c)) || cells[0] === "Value") continue;
        if (cells[0] === "Link" || cells[0] === "File") continue;
        const cell = cells[column];
        if (cell) values.push(cell.replace(/`/g, "").trim());
    }
    return values;
}

const redirects = readFileSync(redirectsPath, "utf8");
const registry = readFileSync(registryPath, "utf8");

const rules = parseShortLinks(redirects);
const sources = new Set(parseTableColumn(registry, "### utm_source"));
const mediums = new Set(parseTableColumn(registry, "### utm_medium"));
const documented = parseTableColumn(registry, "## Short links");
const documentedNames = new Set(
    documented.map((v) => v.replace(/^\/go\//, "")),
);

if (rules.length === 0) fail("public/_redirects: no /go/ rules found");

const seen = new Map();
for (const rule of rules) {
    const where = `public/_redirects:${rule.line} (${rule.from})`;

    if (rule.code !== "302") {
        fail(
            `${where}: is ${rule.code}, must be 302 — a campaign destination changes, and a 301 is cached by browsers that already followed it`,
        );
    }
    if (!rule.source) fail(`${where}: no utm_source`);
    if (!rule.medium) fail(`${where}: no utm_medium`);
    if (rule.source && !sources.has(rule.source)) {
        fail(
            `${where}: utm_source "${rule.source}" is not in ATTRIBUTION.md's registry — add it there, or reuse an existing value`,
        );
    }
    if (rule.medium && !mediums.has(rule.medium)) {
        fail(
            `${where}: utm_medium "${rule.medium}" is not in ATTRIBUTION.md's registry — add it there, or reuse an existing value`,
        );
    }
    if (!documentedNames.has(rule.name)) {
        fail(
            `${where}: not listed in ATTRIBUTION.md's short links table`,
        );
    }

    // Both spellings must exist and agree: the rules match the path exactly,
    // and trailingSlash: 'always' governs generated pages, not edge redirects.
    const previous = seen.get(rule.name);
    if (previous && previous.to !== rule.to) {
        fail(
            `${where}: sends to ${rule.to}, but /go/${rule.name}${previous.trailingSlash ? "/" : ""} sends to ${previous.to}`,
        );
    }
    seen.set(rule.name, rule);
}

for (const [name, rule] of seen) {
    const forms = rules.filter((r) => r.name === name);
    if (!forms.some((r) => r.trailingSlash) || !forms.some((r) => !r.trailingSlash)) {
        fail(
            `public/_redirects:${rule.line}: /go/${name} needs both the bare and trailing-slash forms; only one is present`,
        );
    }
}

for (const name of documentedNames) {
    if (!seen.has(name)) {
        fail(
            `ATTRIBUTION.md: /go/${name} is documented but has no rule in public/_redirects`,
        );
    }
}

if (errors.length > 0) {
    console.error("Attribution check failed:\n");
    for (const error of errors) console.error(`  ${error}`);
    console.error(
        `\n${errors.length} problem(s). ATTRIBUTION.md is the source of truth for these values.`,
    );
    process.exit(1);
}

console.log(
    `attribution: ${seen.size} short links, ${sources.size} sources, ${mediums.size} mediums — consistent`,
);
