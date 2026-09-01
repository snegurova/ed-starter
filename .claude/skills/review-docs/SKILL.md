---
name: review-docs
description: Use this skill when the user asks to verify that code uses a library, framework, SDK, or API correctly and against its latest version. The skill uses the context7 MCP server to fetch current documentation. Triggers include "review docs", "check API usage", "verify library usage", "is this the right way to use X", "check against latest version", "verify against docs".
---

Verify that the referenced code (or file) uses each third-party library / framework / SDK / API correctly and follows the current, latest-version guidance. Documentation MUST be verified through the **context7 MCP server** — do not rely on training memory.

## Process

### 1. Identify dependencies
List every external library, framework, SDK, or API the code touches. Read `package.json` and the lockfile to record the exact version each one is pinned to.

### 2. Fetch current docs with context7 (required for every dependency)
For each library, always run both context7 tools — even for libraries you think you already know:

1. `mcp__context7__resolve-library-id` — pass the official library name (e.g. `Next.js`, `Zustand`, `Tailwind CSS`) to get its Context7-compatible ID. If the installed version matches an offered version, use the `/org/project/version` form.
2. `mcp__context7__query-docs` — pass that ID and a query scoped to the specific API being used (e.g. "app router route handler exports", "zustand selector with shallow", "tailwind v4 css-first config"). One concept per call; make separate calls for separate concepts.

Prefer context7 over web search and over your own recollection. Only if `resolve-library-id` returns no usable match, fall back to WebSearch and mark those findings as lower-confidence.

### 3. Check syntax
Before comparing against docs, confirm the code is syntactically and type-wise valid:
- Run `npm run typecheck` (`tsc --noEmit`) and `npm run lint`.
- Report any parser errors, type errors, unresolved imports, or lint failures with `file:line` and the exact compiler / linter message.
- If typecheck fails, still finish the docs review, but mark the file as not building.

### 4. Compare code against the docs
For each usage, check:
- **API surface** — function / hook / method names, argument order, option-object shape, return types.
- **Latest-version idioms** — is the code using a deprecated, removed, or superseded pattern? Note the version where it changed and the current replacement.
- **Required setup / config** the docs mandate (providers, config keys, env vars, peer deps).
- **Anti-patterns** the docs explicitly warn against.
- **Version mismatch** — installed version vs. the version the docs describe; flag if the project is behind a newer major.

### 5. Report findings
For each issue: severity (blocker / warning / suggestion), `file:line`, what the context7 docs say (or the compiler / linter message for syntax issues), the current code, and the corrected code. Quote the context7 snippet you relied on and name the library ID + version it came from.

If everything checks out, say so plainly and list: the syntax / typecheck / lint result, and which library IDs, versions, and doc queries you verified against.
