# pstack-zcode

[ZCode](https://z.ai) port of **pstack** — Lauren Tan's (@poteto) stack of skills and principles for rigorous AI-assisted engineering: poteto-mode, 23 playbooks, parallel design exploration, adversarial multi-model review, root-cause debugging, and verified delivery.

This is a port of a port, with full provenance:

```
cursor/plugins/pstack          Lauren Tan (poteto)     — upstream, Cursor-native
  └─ pstack-claude             Michael Denyer          — Claude Code port + runtime generator
       └─ pstack-zcode         archeism                — this repo: ZCode-native plugin
```

All layers are MIT; every copyright notice travels in [NOTICE.md](NOTICE.md), [NOTICE-skills.md](NOTICE-skills.md), [LICENSE](LICENSE), [LICENSE-pstack-claude](LICENSE-pstack-claude), and [LICENSE-cursor-team-kit](LICENSE-cursor-team-kit).

## Install

```sh
zcode plugins marketplace add archeism/pstack-zcode
zcode plugins install pstack@pstack-zcode
```

Or in the app: **Settings → Plugin Management → Discover → `+`** → `archeism/pstack-zcode`, then **Get** on pstack.

Then say "work on this in poteto-mode" or invoke the `poteto-mode` skill. Run `/skill setup-pstack` once to write your model sheet.

## What the port does

The 58 skills are the same files pstack-claude generates for Claude Code; the differences are exactly the ZCode adaptation layer:

- **Native ZCode manifest** — `.zcode-plugin/plugin.json` declares the skills tree and the session hook (first probe position; no reliance on ZCode's Claude-manifest fallback).
- **Platform mapping** — [`zcode-tools.md`](plugins/pstack/skills/poteto-mode/references/zcode-tools.md) resolves every Claude tool, subagent, effort level, and model name pstack names to its ZCode equivalent, the same way pstack-claude maps them for Codex, Pi, and Copilot.
- **Subagents** — ZCode does not register plugin agent types, so the 11 agent definitions (`poteto-agent`, effort tiers, `comment-sicko`) travel as files and dispatch as `Agent(general-purpose)` calls whose prompt carries the definition body (see the mapping's Subagent policy).
- **Session hook** — the same `SessionStart` routing instruction, wired through `hooks/zcode-hooks.json` with the `zcode` runtime branch in `session-start.sh`; the models sheet lives at `~/.zcode/pstack-models.md`.
- **Substitutions** — `tools/substitutions.json` records every token rewrite over the vendored tree (Platform Adaptation pointer, per-skill mapping pointers, the setup-pstack runtime row, the hook branch), each with its rationale.

## Updating from upstream

```sh
git clone --depth 1 https://github.com/michael-denyer/pstack-claude /tmp/pstack-claude
node tools/sync.mjs --src /tmp/pstack-claude
```

The sync vendors the generated `plugins/pstack/` tree, applies the substitutions (failing loudly if upstream wording moved), overlays the port-owned files, and stamps the version. Review the diff, update [CHANGES.md](CHANGES.md), release.
