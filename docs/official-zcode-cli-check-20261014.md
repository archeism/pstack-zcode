# Official ZCode CLI compatibility check — 2026-10-14

Checked pstack-zcode `2b4d00bc3f36c859d3b1809d99c97196c0235ffe`
(`0.9.82-zcode.3`) against official `zai-org/ZCode`
`aac4755666d09fdcd70272fcf063c077a639015f`, terminal CLI `0.16.9`,
Node `24.14.0`, Linux x64. This is a bounded integration check, not certification
of all 58 skills or parity with the current upstream pstack release.

## Verified

- Native marketplace add and `pstack@pstack-zcode` install succeed; plugin is enabled.
- All 208 installed plugin files match the source checkout byte-for-byte.
- Native skill discovery lists 58 pstack skills without diagnostics; 12 agent
  definitions are present. Only one agent type was dispatched in this check.
- A real session trace records the plugin SessionStart command with outcome
  `success`, not merely a runnable hook declaration.
- An authenticated BigModel GLM-5.3 turn invokes `Skill` for `pstack:poteto-mode`,
  then `Agent` with `subagent_type: pstack:poteto-agent`. The child also loads
  poteto-mode, reads the fixture, and returns the expected value 5. Parent
  receives a successful Agent result. No task file was edited.
- Notices retain Lauren Tan/Cursor and Michael Denyer attribution and MIT texts.
  The vendored release is based on pstack-claude 0.9.82, not a claim to track
  every change in Lauren Tan's latest tree.

## Compatibility gaps

1. **Effort-agent names do not enforce reasoning levels.** `tools/sync.mjs`
   strips the Claude `effort` field when copying profiles into `agents/`.
   ZCode's Agent input has no model or effort override. Its profile/Settings
   model-selection path is separate; merely choosing `pstack:effort-high`
   does not prove a different reasoning setting from `effort-low`. The model
   sheet alone cannot create distinct-model panels through ordinary Agent calls.
   Source: `apps/zcode-cli/packages/contracts/src/tools/agent.ts` and
   `apps/zcode-cli/packages/bootstrap/src/subagents.ts` in the pinned official tree.
   The probe deliberately inherits GLM-5.3 for parent and child; model diversity
   is reduced. No model sheet was created or changed.
2. **Reflect is not ZCode-transcript aware.** `skills/reflect/SKILL.md` still
   points to `~/.claude/projects`; its finder handles Claude/Pi/Copilot but has
   no ZCode parser. It can fail for a missing Claude root or select unrelated
   Claude history. Give ZCode an explicit current-session digest path or add
   a native transcript adapter before claiming reflection parity.
3. **Vendoring provenance can be more reproducible.** Sync prints the upstream
   short SHA but does not persist the full source revision. The reviewed
   pstack-claude v0.9.82 tag resolves to
   `b0bffae6ed3bc6cef37e5b54cb500fdf00913b5d`; record full revisions on future syncs.

## Evidence and limits

Private local raw evidence is retained under
`/root/.local/share/zcode-official/`: `pstack-plugins.json`,
`pstack-skills.json`, `pstack-probe-events.jsonl`, and
`pstack-probe-build-events.jsonl`. Small file hashes and extracted tool/usage
receipts live in the adjacent `pstack-check.json` outside Git. No credentials
are copied into this repository.

The first plan-mode attempt loaded no skill and dispatched no agent; it stopped
at an ExitPlanMode approval boundary. Preserve it as a non-passing attempt.
The normal-mode retry supplies the actual skill and delegation evidence.

Source review was independently performed without model calls or edits.
The live probe uses one model family and a read-only arithmetic fixture. It does
not test all effort types, diverse-model review, reflection, editing workflows,
or every playbook. No port behavior or skill instructions were changed.
