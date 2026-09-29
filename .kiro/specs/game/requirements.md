# AFTERSIGNAL — Requirements

A short, complete 2.5D mystery episode (25–45 min): 3D rooms built in Three.js, 2D Codex-generated characters as billboards, investigation, a public debate ("the Crosswire Account"), reconstruction and a resolved ending.

## Completion criteria

1. `npm install`, `npm run dev`, `npm run build` all succeed.
2. A new player can go Title → Prologue → Arrival → Dinner → Evening → Night → Incident → Investigation → Pre-Hearing → Hearing → Reconstruction → Verdict → Epilogue → Credits with no outside explanation.
3. Exploration is real 3D (WASD + mouse look, collision, doors between 8 rooms). NPCs are transparent PNG billboards that stay upright and face the camera around the Y axis.
4. Talking to an NPC switches to a VN layer over the blurred 3D room: large portrait, name, text, expression changes (neutral / happy / thinking / surprised / distressed-angry).
5. Story progress is an explicit state machine (`src/core/StoryMachine.ts` + `src/data/story.ts`). Each state defines accessible rooms, NPC placement, dialogue, hotspots and objective.
6. Investigation unlocks evidence at hotspots and via testimony. Every required evidence item is obtainable in INVESTIGATION before the hearing opens. The hearing door opens only when all required evidence is held.
7. Evidence Board (Tab) shows icon, name, description, where found, confirmed facts, and recorded statements. No culprit hints.
8. Hearing uses at least four interaction types: CUT (contradiction), PATCH (support), TUNE (critical choice), REEL (timeline reconstruction). Wrong answers cost Focus; zero Focus restarts the current round, never game over.
9. The case is logically complete: every answer is deducible from in-game information; red herrings are explained; the timeline is physically possible.
10. Save/Continue (localStorage): story state, room + position, evidence, examined hotspots, talked flags, hearing progress, settings. Continue is disabled with no save. New Game after the ending works.
11. Settings: text speed, auto-advance, master/music/SFX volume, camera shake, motion reduction, fullscreen.
12. Procedural Web Audio (UI, evidence, error, correct, tension pulse, ambient drone). No downloaded music.
13. Layout holds at 1280×720, 1366×768, 1600×900, 1920×1080. Pixel ratio capped.
14. All final character, key-art, cut-in and poster art is produced through `codex exec` (Codex CLI built-in image generation). Prompts in `art/prompts/`, metadata in `public/assets/generated/manifest.json`. No credentials stored.
15. `npm run validate` (case validator) passes; `npm test` (Vitest) passes; `npm run e2e` (Playwright full playthrough) passes.
16. Screenshots of the key states are captured to `artifacts/screenshots/` and reviewed.
17. No uncaught errors, promise rejections, 404s or WebGL errors during a full playthrough.
18. README matches the implementation. Git history is organized and the tree is clean.

## Out of scope

Combat, platforming, open world, networked play, copying any existing IP's characters, names, UI, terminology or events.
