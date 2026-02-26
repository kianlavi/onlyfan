# CLAUDE.md — Agent Operating Protocol

This file governs how AI agents operate in this repository. Every agent (and sub-agent) must read and follow these rules before making any changes.

## 1. Sub-Agent Orchestration

When a task is complex enough to warrant sub-agents, the orchestrating agent MUST:

- **Plan before delegating.** Break the task into independent units of work. Assign each sub-agent a clear, scoped responsibility.
- **Enforce file-level exclusivity.** No two sub-agents may modify the same file concurrently. The orchestrator must partition work so that each file is owned by exactly one sub-agent at a time. If two tasks need to touch the same file, they must be sequenced, not parallelized.
- **Verify before merging.** After sub-agents complete, the orchestrator must review that changes are coherent and don't conflict before moving on.

### File Ownership Example

If sub-agent A is updating `admin.js` and sub-agent B is updating `style.css`, that's fine — they own different files. But if both need to change `index.html`, one must finish before the other starts.

## 2. Git Discipline

Agents MUST commit and push changes autonomously. Do not accumulate large uncommitted diffs.

### Commit Rules

- **Commit after every meaningful unit of work.** A "meaningful unit" is any change that accomplishes a discrete goal: a bug fix, a new feature, a refactor, a config change. When in doubt, commit.
- **Write clear commit messages.** Use imperative mood. First line is a concise summary (≤72 chars). Add a body if the "why" isn't obvious from the summary.
- **Push to origin after committing.** Every commit should be pushed to `origin/main` (or the current working branch) immediately. Local-only commits are fragile — treat the remote as the source of truth.
- **Never force-push to main** without explicit user approval.

### Commit Flow

```
1. Make changes
2. git add <specific files>
3. git commit -m "Clear imperative summary"
4. git push origin <branch>
5. Update the changelog below
```

## 3. Changelog

Every agent that makes changes MUST append an entry to the changelog below. This serves as a human-readable version history alongside git log.

Format: `- **YYYY-MM-DD HH:MM** | <short summary of what changed and why>`

---

### Version History

- **2025-02-26** | Initial commit history: static OnlyFan site with index, admin page, styling, and profile/post data
- **2026-02-26** | Created CLAUDE.md with agent orchestration rules, git discipline, and changelog protocol
- **2026-02-26** | Added README.md with project summary, admin setup instructions, and file map

---

## 4. Project Context

This is **OnlyFan** — a static site hosted on GitHub Pages.

### File Map

| File | Purpose |
|------|---------|
| `index.html` | Public-facing landing page |
| `style.css` | Global styles |
| `app.js` | Frontend logic for the public site |
| `admin.html` | Password-protected admin interface |
| `admin.js` | Admin page logic |
| `profile.json` | Profile configuration data |
| `posts.json` | Post content data |
| `images/` | Static image assets |
| `README.md` | Project documentation |
| `CLAUDE.md` | This file — agent operating protocol |

### Tech Stack

- Vanilla HTML/CSS/JS (no build step, no framework)
- GitHub Pages for hosting
- Git for version control, remote at `origin` → `https://github.com/kianlavi/onlyfan.git`

## 5. General Principles

- **Read before writing.** Always read a file before editing it. Understand context before making changes.
- **Don't break what works.** Run the site locally or reason carefully about changes before pushing.
- **Minimize unnecessary files.** This is a simple static site. Don't introduce build tools, frameworks, or dependencies unless explicitly asked.
- **Keep this file updated.** If the project structure changes (new files, renamed files, new conventions), update the File Map and relevant sections above.
