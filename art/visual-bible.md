# AFTERSIGNAL — Visual Bible

Direction: **interactive graphic novel + pop-up stage + stylized low-poly architecture + editorial motion graphics.** A broadcast tower at the end of its life, seen through tape, signal and print.

## Palette (six core colors)

| name | hex | use |
|---|---|---|
| INK | `#16131D` | line art, deep shadow, UI base |
| PAPER | `#F2EADB` | light surfaces, text, highlights |
| SIGNAL | `#E4F03A` | acid yellow: emphasis, marked phrases, safety paint, "live" |
| CYAN | `#0F7D87` | deep cyan: calm, cold light, the archive, WARDEN |
| CORAL | `#FF5A48` | coral red: danger, ON AIR, contradiction, error |
| VIOLET | `#6D5C9E` | muted violet: night, secrets, memory |

Mid-greys are mixes of INK and PAPER. No pure black, no pure white, no pink blood tones, no neon magenta.

## Line and shading (2D art)

- Bold, confident ink outlines in INK, variable weight: heavier on the outer silhouette, thinner inside.
- Flat color fills with **one** hard-edged cel shadow tone; occasional small halftone-dot texture inside shadows.
- Faces and hands are simplified but anatomically clean and highly readable. Five fingers, clear knuckles.
- Graphic-novel / high-quality anime-adjacent drawing, adult proportions (7–8 heads tall), no chibi, no photorealism, no 3D render look, no painterly soft airbrushing.
- Asymmetric fashion details on every character.

## Character image conventions

- Full body, head to toe, feet fully visible, standing on nothing (no floor, no cast shadow).
- Camera: straight-on eye level, very slight 3/4 turn allowed, orthographic-feeling (no dramatic perspective).
- Centered, ~6% empty margin above head and below feet. Portrait 2:3.
- Background: fully transparent (alpha). If alpha is impossible: perfectly flat uniform pure green `#00FF00`, no gradient, no shadow, no floor.
- No text, letters, logos, watermarks, signatures or frames anywhere in the image.

## Environment

- 3D geometry is low-to-mid poly with flat or toon shading, strong silhouettes, slightly exaggerated proportions (tall doors, deep corridors).
- Textures are graphic: canvas-painted stripes, tape-label grids, concrete with painted panels. Colour and shape over PBR realism.
- Posters, murals, window views and signage are flat planes (decals / billboards). Generated art for these contains no text; all readable text is typeset in code.
- Every room has one strong landmark (the Halo Dial in the Atrium, the round vault door, the ON AIR lamp, the red release station, the ring of podiums).

## Camera conventions (runtime)

- Exploration: first-person, eye height 1.62 m, FOV 62°.
- Dialogue: 3D scene stays visible behind, blurred and darkened; portrait large on one side; name plate as a tape label.
- Hearing: speaker framing (waist-up), two-shot confrontation, wide ring shot, slow orbit, fast push-in on key lines. Whip pans ≤ 280 ms. All shake/motion scaled by settings.

## UI style

- Typography is the stage: big condensed display type for key phrases, monospaced timecodes, Korean body text in a clean sans at high contrast.
- Motifs: magnetic tape strips, splice marks, patch cables, tuning dials, VU meters, printed timecodes, registration marks, halftone.
- Panels are tape strips and paper cards with hard offsets, not rounded RPG boxes.
- Meaning never relies on color alone: every state also has a label or shape (e.g., CUT ✂ / PATCH ⎓ / wrong = strike-through + "NO SIGNAL").

## Forbidden

- Anything from existing commercial games/anime: their characters, costumes, mascots (especially two-tone bear mascots), logos, school crests, UI frames, trial terminology, pink blood.
- Gore, visible wounds, blood.
- Generated text inside images.
- Photorealism, 3D-render look, glossy plastic skin.
