# Changelog

## 0.9.82 — first ZCode release

Port of pstack-claude 0.9.82 (pstack upstream at cursor/plugins @ e46364b and
later), comprising:

- First ZCode-native packaging: `.zcode-plugin/plugin.json` declaring the
  58-skill tree and the session hook; root + `.claude-plugin` marketplace
  manifests; `tools/sync.mjs` vendor pipeline with
  `tools/substitutions.json` recording every token rewrite.
- `skills/poteto-mode/references/zcode-tools.md`: the ZCode platform mapping
  (tool table, subagent-as-prompt policy, effort-level and model-name
  resolution, driver table, per-skill notes), mirroring the structure of the
  Codex/Pi/Copilot mapping docs.
- Substitutions over the vendored tree: ZCode pointer in poteto-mode's
  Platform Adaptation, ZCode pointer on the fourteen skills that carry the
  Codex platform-mapping pointer, a ZCode row in setup-pstack's Other
  runtimes table, the ZCode effort mapping in interrogate's override
  paragraph, and a `zcode` branch (sheet at `${ZCODE_HOME:-~/.zcode}`) in
  `hooks/session-start.sh`, wired through `hooks/zcode-hooks.json`.
- Provenance: upstream NOTICE files and both MIT license texts carried
  unchanged; this port's modifications are MIT, archeism.
