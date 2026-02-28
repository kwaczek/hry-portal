# hry-portal

Czech multiplayer browser gaming portal. Phase 1: portal infrastructure + Prší Online.

## Build & Test Commands
- Install: `npm install` (from root — installs all workspaces)
- Dev portal: `cd portal && npm run dev`
- Dev server: `cd server && npm run dev`
- Build portal: `cd portal && npm run build`
- Build server: `cd server && npm run build`
- Test: `npm test` (from root — runs all workspace tests)
- Lint: `npm run lint`

## Skills & Tools

You have access to **skills** (structured workflows) and **MCP tools** (external capabilities). Using them is NOT optional — they prevent bugs, improve quality, and save time.

### How to Use Skills
Skills are invoked via the `Skill` tool with the skill name. They load step-by-step instructions you then follow.

### How to Use MCP Tools
MCP tools are deferred — load them first with `ToolSearch` (e.g., `select:mcp__plugin_context7_context7__resolve-library-id`), then call them directly.

### Required Skills

**Every task (mandatory):**
- `/superpowers:verification-before-completion` — Run `npm run build` and `npm test` BEFORE marking any task complete. Evidence before assertions.

**When something breaks (mandatory):**
- `/superpowers:systematic-debugging` — Structured debugging: reproduce → isolate → hypothesize → verify → fix. Never guess at fixes.

**When implementing features with testable logic:**
- `/superpowers:test-driven-development` — Write failing tests first, then implement until they pass. Use for API routes, utils, game logic, validation. Skip for pure styling.

**When building UI:**
- `/frontend-design:frontend-design` — Creates polished, distinctive interfaces. Use when building or significantly modifying user-facing pages/components.

**When implementing multi-file features:**
- `/feature-dev:feature-dev` — Analyzes existing codebase patterns before writing code. Use when a feature spans 3+ files.

**When reviewing your work:**
- `/superpowers:requesting-code-review` — Self-review before committing significant features.

### MCP Tools

**Context7 — Library Docs** (use before any unfamiliar API):
1. Load: `ToolSearch` → `select:mcp__plugin_context7_context7__resolve-library-id`
2. Resolve: call `resolve-library-id` with library name (e.g., "nextjs") → returns ID
3. Load: `ToolSearch` → `select:mcp__plugin_context7_context7__query-docs`
4. Query: call `query-docs` with the ID + your question

**Playwright — Browser Testing** (use after building UI):
1. Start dev server: `npm run dev`
2. Load: `ToolSearch` → `+playwright navigate`
3. Navigate: `browser_navigate` → `http://localhost:3000`
4. Verify: `browser_snapshot` to see rendered elements
5. Check: `browser_console_messages` for JS errors

**Sequential Thinking** (use for complex reasoning):
1. Load: `ToolSearch` → `select:mcp__sequential-thinking__sequentialthinking`
2. Call with your problem statement for step-by-step reasoning

## Task Workflow
1. Read `.ralph/fix_plan.md` — pick the next unchecked task
2. Look up unfamiliar APIs with **Context7**
3. Invoke the appropriate skill(s) for the task type
4. Implement the task
5. If UI — verify with **Playwright**
6. Invoke `/superpowers:verification-before-completion`
7. Commit and push

## Rules
- TypeScript strict mode
- Do not modify `.env`, `.ralphrc`, `.ralph/PROMPT.md`, or `.ralph/fix_plan.md` structure
- One task per session — do it well, verify, commit, done
- Server-authoritative: ALL game logic runs on the server, clients are dumb renderers
- Czech language for all user-facing text
- Use key prefix `hry:` for all Upstash Redis keys
