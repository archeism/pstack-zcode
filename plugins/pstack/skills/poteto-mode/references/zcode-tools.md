# ZCode tool mapping for pstack

pstack skills are written in Claude Code tool language (the `Skill` tool, the `Agent` tool, `AskUserQuestion`, Claude model names). On ZCode the skills are the same files; only the tool names resolve differently. Read this when a pstack skill names a Claude tool, a driver or bundled skill, or a Claude model. This file is ZCode-specific. Codex, Gemini CLI, opencode, Prime Agent, and other runtimes must use their own concrete tools, model names, and configuration paths.

## Tool actions

| pstack / Claude action | ZCode equivalent |
|------------------------|------------------|
| Read a file | `Read` |
| Create / edit / delete a file | `Write` / `Edit` (delete via `Bash`) |
| Run a shell command | `Bash` |
| Search file contents / find files | the search tools (`rg`-backed), or `Bash` with `rg` / `grep` / `find` |
| Fetch a URL | `WebFetch` (or the `web_reader` MCP tool when configured) |
| Search the web | `WebSearch` |
| Invoke a skill (the `Skill` tool, `/command`) | the `Skill` tool or the `/skill <name>` command. Skills load natively — follow the instructions presented. |
| Dispatch a subagent (the `Agent`/`Task` tool) | the `Agent` tool, `subagent_type: "general-purpose"` (or `"Explore"` for read-only search) |
| Dispatch N parallel subagents in one turn | N `Agent` calls in one response |
| Run a subagent in the background | `Agent` with `run_in_background: true`, then collect with `TaskOutput` |
| Track tasks (the todolist; `TaskCreate` / `TaskUpdate`, or `TodoWrite` on Claude Code) | `TodoWrite` (same tool, same shape) |
| Ask the human a fixed-choice question (`AskUserQuestion`) | `AskUserQuestion` (same tool, same shape) |

No feature flag is needed for subagents: the `Agent` tool is always available, and parallel dispatch is bounded by the host's own concurrency, not a thread limit you configure. A capacity or provider error from a dispatch is a capacity error, not a rejected model name, so the skills' fallback to another model does not apply to it. After a capacity rejection, stop spawning before you lose work, and prefer `run_in_background: true` plus `TaskOutput` so a finished agent's result is never lost.

## Subagent policy

poteto-mode's Subagents section sets Claude-specific defaults (`subagent_type: "pstack:poteto-agent"`, `run_in_background: true`). ZCode registers plugin agents from the plugin's `agents/` directory as native, dispatchable agent types, so the two definitions there work exactly as on Claude Code:

- `subagent_type: "pstack:poteto-agent"` works as written: it is a native ZCode agent type (verified by live dispatch), and its definition already tells it to read the `poteto-mode` skill in full before any work.
- `subagent_type: "pstack:comment-sicko"` works as written too; the **no-comments** skill's spawn needs no translation.
- The `effort-agents/` tree is referenced from the manifest but lives outside `agents/`, and ZCode does not register it as agent types. When a role value carries `@<level>`, or the `default effort` line names a level: dispatch `general-purpose` with a prompt that starts with the matching `effort-agents/effort-<level>.md` (or `poteto-agent-<level>.md`) body, then the task; and where the host lets you pick a subagent's model with a reasoning level, choose it with the model id's `$<level>` suffix (`ListModels` shows each model's supported levels). `session` changes nothing.
- The agent definition files all travel with the plugin. Any other named agent without a native type dispatches the same way: `general-purpose` with the definition's full body as the prompt prefix. The definition file is the system prompt.
- Claude Code runs every subagent on this machine, so the **swarm** skill's workers and the fan-out playbooks (`orchestrate`, `autopilot-full`, `autopilot-stack`) isolate writers with worktrees. The same holds on ZCode: writers get their own worktree or branch, created with `Bash` (`git worktree add`).
- Keep the rest of the policy unchanged. Pass file pointers not inlined context, give each worker its own worktree or branch when they write, review every subagent's diff yourself.

## Model names

Skills name Claude defaults (a single-role default for code/prose/judgment plus a diverse-model panel; each model-consuming skill lists its own in a Models section). These slugs do not resolve on ZCode. Substitute the models configured on your ZCode host:

- Detect models with the host's model listing (the session's model command or the `ListModels` tool) and never write a slug you have not seen listed.
- Single-model roles: your primary session model.
- Roles that default to the strongest Claude model (`bug-fix`, `perf-issue`, `hillclimb`, `strongest judgment`): the strongest model your host offers.
- Diverse-model panels (`arena`, `architect`, `interrogate`, `how` critics, `reflect`): the adversarial signal comes from model diversity, so use distinct models from different providers where your host has them. If only one model family is reachable, vary the reasoning level (`$<level>` suffix) per panelist and note in the verdict that diversity was reduced.
- Where a dispatch path accepts a subagent model (for example dynamic workflows' `subagent_model`), pass it there; a plain `Agent` call follows the host's session configuration.

`/setup-pstack` writes the configured model list. On ZCode, set it to your host's model ids; the sheet lives at `${ZCODE_HOME:-~/.zcode}/pstack-models.md` (see [setup-pstack's runtime table](../../setup-pstack/SKILL.md#other-runtimes)).

## Session routing hook

The plugin bundles the same `SessionStart` routing instruction as the Claude Code plugin, through `hooks/session-start.sh` with the `zcode` runtime name. ZCode fires the hook on startup, resume, clear, and compact, and expands `${CLAUDE_PLUGIN_ROOT}` for plugin hooks, so the wiring in `hooks/zcode-hooks.json` needs no trust step. The hook reads `session hook` from the ZCode sheet; `session hook: off` disables injection.

A skills-only installation does not include plugin hooks. Request `poteto-mode` explicitly or add a standing instruction to `AGENTS.md` in that case.

## Driver and bundled skills pstack references

The [driver policy](../SKILL.md#non-negotiables) selects the app driver. For skills and drivers named by these workflows, use these ZCode equivalents:

| Skill or driver named in pstack | On ZCode |
|---------------------------------|----------|
| `run` (drive a CLI/TUI to see a change work) | Run the app yourself via `Bash` and observe the real output. |
| Project UI driver | Drive the UI with the browser automation your host has (Browser Use when enabled), or hand the user a concrete manual check. Do not claim done without observing the artifact. |
| `plugin-dev:skill-development` (Claude's SKILL.md authoring guidance) | Follow your platform's skill-authoring guidance; the `writing-skills` skill if present. Keep `name` + `description` frontmatter and progressive disclosure. |
| `loop` (recurring/self-paced re-invocation, used by `babysit`) | ZCode has no `loop` skill. Re-run the step yourself on a cadence, or use a scheduled automation if one is configured. |

## Per-skill notes

Affected skill entry points point here. Most skills need only the tables above. These need one more mapping:

| Skill | On ZCode |
|-------|----------|
| `interrogate` | The `subagent_type`/`model`/`readonly` dispatch fields map to `Agent` calls (`Explore` for read-only; `pstack:poteto-agent` dispatches natively); substitute your host's models and keep the reviewer panel model-diverse. Effort suffixes use the Subagent policy fallback above. |
| `setup-pstack` | The skill's Other runtimes table names the ZCode sheet path and how it loads; the slugs are your host's model ids (see Model names above). The role rows are identical. |
| `no-comments` | `pstack:comment-sicko` dispatches natively; no translation needed. |
| `babysit` | No `loop` skill; see the driver table above. |
