# AFTERSIGNAL — Design

## 1. Premise

Kestrel Tower, a mountain-ridge broadcast tower due for demolition in two days. Six residents and the player (Kai Morrow, audio restorer) spend the final night there. A storm stops the cable car. At 06:00 the tower's 1970s security automaton **WARDEN** announces an occupant death, seals the building and demands an **Account**: time, place, method, actor. It verifies the Account against its sensor record and only then unseals. No villain mascot; the rule belongs to the building, and (as revealed at the end) the victim reactivated it himself.

Debate format: **the Crosswire Account** (radio tape-editing vocabulary):

| Verb | Genre role | Interaction |
|---|---|---|
| CUT | contradiction | load evidence card, cut the marked phrase of a false statement (tape splice) |
| PATCH | support | load evidence card, patch it into a true statement under attack (patch cable) |
| TUNE | critical choice | rotate a dial to the missing person / time / place / motive |
| REEL | reconstruction | order tape segments into the true sequence |

Focus: 5 pips. Wrong answer −1. At 0: "SIGNAL LOST", round restarts at 3 Focus. Never game over.

## 2. Cast

| id | name | role | secret |
|---|---|---|---|
| kai | Kai Morrow (카이 모로) | player, audio restorer | — |
| theo | Theo Lindqvist (테오 린드크비스트) | host of *Night Kestrel*, victim | planned to take the KST-D reels; reactivated WARDEN; pre-recorded his "live" show |
| helena | Helena Voss (헬레나 보스) | archive director | gave Theo her vault code; the dinner fight was staged |
| bas | Bastian "Bas" Kord (바스 코르드) | station engineer | pulled the vault siren fuse two weeks ago, never logged it |
| lumi | Lumi Castell (루미 카스텔) | field-recording artist | records people without asking; recorded the Atrium all night |
| oskar | Oskar Wendt (오스카 벤트) | Aldane Foundation counsel | lied about the canteen; searched Helena's desk |
| wren | Wren Hollis (렌 홀리스) | Theo's producer | pulled the vault CO₂ release believing Theo was on air |

## 3. Case Truth Graph

### 3.1 True timeline

| time | event | location | witnesses / traces |
|---|---|---|---|
| 19:30 | Dinner. Staged fight; Helena flings a folded "contract" (the code note) at Theo | canteen | everyone (Kai sees the paper) |
| 20:15–21:30 | Theo records the 75-min show alone ("rehearsal") | studio_b | ON AIR sign, Wren kept out |
| 21:10 | Bas paints the gas-room release cover, hangs WET PAINT tag | workshop | tag, Kai may see Bas painting |
| 22:00 | fire panel self-test printed | workshop | printout |
| 23:14 | Theo sets auto-start for 23:30, leaves | studio_b | studio door log, auto-start card |
| 23:21 | Theo opens vault with Director code, headphones on at max | vault | keypad log, note, headphones |
| 23:25 | Lumi starts recording in the Atrium | atrium | recording |
| 23:30 | pre-recorded show plays on the PA; everyone believes Theo is live | all | recording |
| 23:35 | Oskar enters Helena's office via the staff corridor (not via Atrium) | archive | pen, forced drawer |
| 23:45 | Wren crosses the Atrium to the Workshop stairs; headset LED blinking blue | atrium | recording (door squeak), Lumi saw a blue light |
| 23:47 | Wren pulls the release. Siren silent (no fuse). CO₂ floods the vault. Vault locks. Headset brushes wet paint | workshop → vault | vault panel, release station, siren box, headset smear |
| 23:48 | printer logs MANUAL RELEASE; Wren tears it off | workshop | torn printout |
| 23:49 | Wren returns through the Atrium | atrium | recording |
| 23:51 | Bas passes Lumi ("Evening, kiddo") on the way to the generator | atrium | recording |
| 23:52 / 23:53 | mains fail / Bas starts generator | workshop | generator log |
| 00:45 | tape runs out, dead air | all | — |
| 06:00 | WARDEN announces seal | all | — |
| 06:12 | Bas overrides the lockout; body found | vault | vault panel |

Travel is only between adjacent rooms (Guest Wing ↔ Atrium ↔ Workshop is ~1 minute). No impossible movement.

### 3.2 Wrong beliefs and how they fall

| wrong belief | held by | broken by |
|---|---|---|
| Theo was live until 00:45 | everyone | autostart_card / studio_log (R1) |
| Helena let him in and killed him | Oskar | helena_note (R3) |
| Theo hit the inner release by accident | Helena, Oskar | inner_release (R4) |
| The storm surge fired the gas | Wren | generator_log / lumi_recording (R6) |
| The siren must have sounded | Bas (lie) | siren_box (R7) |
| Bas went down at 23:45 | Oskar | lumi_recording (R8) |
| Oskar was in the canteen | Oskar (lie) | oskar_pen / kettle (R9) |
| Wren's paint is from the afternoon | Wren (lie) | wet_paint_tag (R11) |

### 3.3 Hidden facts

Bas's missing fuse (R7), Oskar's search and Order 88-D (R9), Helena's alliance (R3), Lumi's covert recording (investigation), Wren's act (R10–R12), Theo's reactivation of WARDEN and the listening-post past of the tower (verdict addendum).

### 3.4 Facility secret

1979–1998 the tower relayed and recorded civilian phone calls for Aldane Signals. The recordings are the KST-D "dead air" reels. Order 88-D schedules them for destruction with the tower. WARDEN files its Accounts on the old 97.3 transmitter, so the solved Account — including Order 88-D — is heard across the valley. Theo planned this as insurance.

## 4. Story state graph

```
TITLE → PROLOGUE → ARRIVAL → DINNER → EVENING → NIGHT → INCIDENT → INVESTIGATION
      → PRE_HEARING → HEARING → RECONSTRUCTION → VERDICT → EPILOGUE → CREDITS
```

Data in `src/data/story.ts`. Every state declares: rooms, npc placements (room, position, dialogue ids), enabled hotspots, objective, and exit (`flagsAll`, `evidenceAll`, or a script command `advance`). `StoryMachine` is the only thing allowed to change the state.

## 5. Architecture

```
src/core        Game loop, Input, StoryMachine, Save, Settings, EventBus
src/world       Three scene, RoomBuilder (data → geometry), Player (FPS + collision), Billboard
src/interaction Interactables (hotspots, doors, NPCs), proximity prompt
src/story       Director (runs dialogue scripts / commands)
src/investigation EvidenceStore
src/trial       Hearing (3D ring, camera director), round controllers
src/ui          Title, HUD, Dialogue, EvidenceBoard, Menu/Settings, Transitions, Cut-ins, Hearing UI
src/audio       Procedural Web Audio
src/data        characters, locations, dialogue, evidence, case, trial, story
tools/          validate-case.ts, asset pipeline scripts
```

Rendering: one WebGLRenderer, pixel ratio ≤ 1.5 (≤ 1 in reduced mode). Rooms are built on demand from `locations.ts` (floor/walls/ceiling with door gaps, props from primitives, canvas textures, Codex posters). NPCs are `Billboard`s: PlaneGeometry with the PNG, bottom-anchored, yaw-only facing, blob shadow, mipmapped textures. VN layer: CSS overlay, 3D canvas blurred via CSS filter.

Hearing: the Round is a real room; seven podiums in a ring (Theo's is a memorial stand). A camera director frames speaker / two-shot / wide / orbit / push-in; shake and motion scale with settings.

## 6. Asset pipeline

`art/visual-bible.md` + `art/character-bible.md` → `art/prompts/*.md` briefs → `tools/codex-gen.ps1` runs `codex exec -s workspace-write` with the brief (and `-i reference.png` for edits) → raw PNG in `art/raw/` → `tools/postprocess.py` (chroma key if needed, trim, resize) → `public/assets/generated/**` + `manifest.json`.

Expressions are image edits of each canonical portrait, never fresh text-to-image.

## 7. Verification

`tools/validate-case.ts` checks evidence ids, trial references, required evidence obtainable before the hearing, state transitions and reachability, hotspot rooms accessible in their state, reel orders defined. Vitest covers story transitions, evidence, validator, trial answers, save/load. Playwright plays New Game → Credits with real input and captures screenshots.
