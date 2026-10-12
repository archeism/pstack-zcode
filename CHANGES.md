# Changelog

## 0.9.82 — first ZCode release

Port of pstack-claude 0.9.82 (pstack upstream at cursor/plugins @ e46364b and
later), comprising:

- First ZCode-native packaging: `.zcode-plugin/plugin.json` declaring the
  58-skill tree and the session hook; root + `.claude-plugin` marketplace
  manifests; `tools/sync.mjs` vendor pipeline with
  `tools/substitutions.json` recording every token rewrite.
- `skills/poteto-mode/references/zcode-tools.md`: the ZCode platform mapping
  (tool table, subagent policy, effort-level and model-name resolution,
  driver table, per-skill notes), mirroring the structure of the
  Codex/Pi/Copilot mapping docs.
- Substitutions over the vendored tree: ZCode pointer in poteto-mode's
  Platform Adaptation, ZCode pointer on the fourteen skills that carry the
  Codex platform-mapping pointer, a ZCode row in setup-pstack's Other
  runtimes table, the ZCode effort mapping in interrogate's override
  paragraph, and a `zcode` branch (sheet at `${ZCODE_HOME:-~/.zcode}`) in
  `hooks/session-start.sh`, wired through `hooks/zcode-hooks.json`.
- Correction after live verification: ZCode registers plugin agents from the
  `agents/` directory as native dispatchable types, so `pstack:poteto-agent`
  and `pstack:comment-sicko` work as on Claude Code (dispatch smoke-tested).
- The sync now copies the ten `effort-agents/*.md` definitions into `agents/`
  so every pstack agent type (`pstack:effort-<level>`,
  `pstack:poteto-agent-<level>`) registers and dispatches natively on ZCode,
  with the Claude Code-only `effort:` frontmatter key stripped as a
  precaution; the prompt-payload fallback stays documented for skills-only
  installs. The `effort-agents/` directory remains vendored unchanged.
- ZCode registers plugin agents in a startup-time snapshot (source:
  `create-app.ts` → `loadPluginAgentProfiles`): a plugin installed mid-session
  only exposes its agent types after the next session/app start. Skills and
  hooks, by contrast, are live immediately on install.
- Provenance: upstream NOTICE files and both MIT license texts carried
  unchanged; this port's modifications are MIT, archeism.
