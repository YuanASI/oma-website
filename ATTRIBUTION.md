# Attribution

How outbound links to open-multi-agent.com are tagged so their traffic can be
told apart, and the registry of values already in use.

This is the source of truth for those values. Add a link without checking it
and you will either collide with a value that means something else or invent a
synonym for one that exists — either way the dashboard stops being able to
separate them.

## Why this exists

Analytics for the site is self-hosted Counterscale at
`insights.open-multi-agent.com`. It reports a large share of visitors with no
referrer at all: 76.6% of new visitors over the 30 days to 2026-09-03.

Most of that is genuinely direct — 62% of it lands on `/` or `/zh/`, which is
someone typing the address, using a bookmark, or pasting a link. The rest is
channels that drop the referrer in transit: messaging apps, in-app webviews,
email clients, QR codes. No analytics tool can recover those. Campaign
parameters are the only thing that tells them apart, which is why outbound
links carry them.

Links from places that *do* pass a referrer (GitHub pages, search engines,
directory sites) gain much less from tagging — that traffic is already
visible. Tag them anyway when the referrer alone cannot distinguish two
positions on the same site, which is the case for GitHub's several link
fields.

## Choosing between a short link and a full URL

The question is **whether that position renders the link as the URL itself, or
as anchor text**.

| Renders as | Use | Because |
| --- | --- | --- |
| The URL | a `/go/` short link | a query string would sit in the open on a page built to be looked at |
| Anchor text | the canonical URL with parameters | the URL is never shown, and a canonical URL keeps working even if this repository loses the redirect rule |

Verified by reading the rendered pages on 2026-09-03: GitHub prints a profile
sidebar link and an organization website verbatim, and a repository's About
panel with only the scheme trimmed. Markdown and HTML links inside README
content render as anchor text.

One argument that does **not** hold, recorded so it is not reinvented: that a
short link is safer because a full URL "gets copied and pollutes attribution."
A copied link carries its parameters either way — someone arriving from a blog
post that quoted the link is recorded under the original source in both cases.
The only real difference is that a short link depends on its rule in
`public/_redirects` continuing to exist.

## Registry

### utm_source — where the visit came from

| Value | Meaning |
| --- | --- |
| `github` | Anywhere on GitHub |
| `npm` | An npm package page |
| `devto` | dev.to |
| `xhs` | Xiaohongshu |
| `wx` | WeChat |
| `twitter` | Twitter/X — the short link is `/go/x`, but the value stays `twitter`, which is what analytics tools call it and what the existing data uses |
| `email` | One-to-one or business email |
| `newsletter` | Broadcast newsletter |
| `yuanasiweb` | yuanasi.com |

### utm_medium — which position within that source

| Value | Position |
| --- | --- |
| `readme` | The framework repository's README |
| `package_readme` | A package README, as rendered on its npm page |
| `repo_about` | A repository's About panel |
| `org_profile` | The organization's website field |
| `user_profile` | A personal profile's sidebar link |
| `social` | Social platforms |
| `referral` | Another site linking here |
| `email` | Email |

`package_readme` and `npm` are registered for the framework repository's
`packages/*/README.md` files. Note the limit: the same file renders on both
npmjs.com and GitHub, and a single tag cannot distinguish the two. It is
attributed to npm because that is the page the file is written for.

`org_profile` currently covers two different things — the organization's
website field and the four anchor links in its profile README. To separate
them, move the README links to a distinct value rather than reusing this one.

## Short links

Defined in [`public/_redirects`](public/_redirects). All 302, never 301: a
campaign destination changes, and a 301 is cached by every browser that
already followed it — which is how this site's launch-day redirect became
uncorrectable from the server side.

| Link | Records |
| --- | --- |
| `/go/devto` | devto / referral |
| `/go/xhs` | xhs / social |
| `/go/wx` | wx / social |
| `/go/x` | twitter / social |
| `/go/email` | email / email |
| `/go/newsletter` | newsletter / email |
| `/go/yuanasi` | yuanasiweb / referral |
| `/go/me` | github / user_profile |
| `/go/repo` | github / repo_about |
| `/go/org` | github / org_profile |

Each is listed twice, bare and with a trailing slash: the rules match the path
exactly, and `trailingSlash: 'always'` governs generated pages, not edge
redirects.

## Rules

- Values are lowercase, no spaces, underscores between words. Tools compare
  them literally, so `GitHub` and `github` become two sources.
- **Never tag an internal link.** A link between pages of this site carrying
  campaign parameters is recorded as a fresh external arrival.
- A standing entry point carries no `utm_campaign`. Add one for a specific
  push whose numbers need separating, and use the same campaign value across
  every channel it runs on, so the push can be totalled as well as split.

## Verifying

Nothing in this repository validates `_redirects` — `public/` is copied
verbatim, so neither `pnpm check` nor `pnpm build` reads it. It has to be
checked against a deployment.

Cloudflare Pages builds a preview for every pull request. Take the deployment
id from the Cloudflare Pages check's target URL and use its first 8 characters:

```bash
curl -sI https://<id8>.oma-website.pages.dev/go/wx | grep -iE '^(HTTP|location)'
```

The branch-name alias (`https://<branch>.oma-website.pages.dev`) works only
while the branch name is short enough; a longer one is truncated and the
hostname 404s.

Expect a 302 and a `location` carrying the parameters. After merging, check
production the same way — and give it a minute: immediately after a deploy,
edge nodes are briefly inconsistent and the same path can answer 302 and 404
seconds apart, so re-test before concluding a rule is broken.

Campaign parameters are read from the address bar, not from the canonical URL,
so a deep landing page is attributed just like the home page. The reported
path comes from the canonical and stays free of the query string, so tagged
links do not fragment the pages report.
