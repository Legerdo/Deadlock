// Builds one Codex visual brief per asset in art/asset-plan.json.
// Each brief combines the shared visual bible, the character bible entry and
// the asset-specific instructions, so every generation sees the same rules.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const plan = JSON.parse(readFileSync(join(root, 'art/asset-plan.json'), 'utf8'));
const characterBible = readFileSync(join(root, 'art/character-bible.md'), 'utf8');
const byId = new Map(plan.assets.map((a) => [a.id, a]));

function characterSection(id) {
  const parts = characterBible.split(/\n(?=## )/);
  const hit = parts.find((p) => p.startsWith('## ') && p.split('\n')[0].includes('`' + id + '`'));
  if (!hit) throw new Error(`character-bible entry missing for ${id}`);
  return hit.trim().replace(/^## /, '### ');
}

const STYLE = `- Game: AFTERSIGNAL, a 2.5D mystery set in a mountain-top broadcast tower on its last night. Look: interactive graphic novel + pop-up stage + editorial print.
- Palette (six core colors, keep to these): INK #16131D, PAPER #F2EADB, SIGNAL acid yellow #E4F03A, CYAN deep cyan #0F7D87, CORAL #FF5A48, VIOLET muted violet #6D5C9E. Mid-greys are mixes of ink and paper. No pure black, no pure white, no neon magenta, no pink.
- Line: bold confident ink outlines, variable weight (heavier outer silhouette, thinner interior lines).
- Shading: flat fills with ONE hard-edged cel shadow tone; small halftone dots allowed inside shadows. No airbrush gradients, no painterly blur.
- Drawing: high-quality graphic-novel / anime-adjacent illustration with adult proportions (7-8 heads tall). Faces and hands clean and readable, five fingers. Not photorealistic, not a 3D render, not chibi.
- Original design only: do not imitate any existing game, anime, mascot, logo, school uniform or crest.`;

const FORBIDDEN = `- No text, letters, numbers, logos, watermarks, signatures, speech bubbles or frames anywhere in the image.
- No blood, wounds or gore.
- No extra characters unless the brief asks for them.
- No resemblance to existing commercial characters.`;

function outputBlock(a) {
  return `## Output
- Save the final PNG exactly to: \`art/raw/${a.id}.png\` (create the folder if needed). Do not overwrite any other file and do not modify project files.
- Reply with: the saved path, pixel dimensions, whether the background is transparent, and the image model name if your tool reports it.`;
}

function refPath(refId) {
  const ref = byId.get(refId);
  return `art/raw/${ref.id}.png`;
}

function briefCharacter(a) {
  return `# Visual brief — ${a.id}

You are the visual production sub-agent for the game AFTERSIGNAL. Use your built-in image generation tool to create exactly ONE image.

## Role of this asset
Canonical full-body reference portrait of this character. It is rendered as a 2D billboard standing inside 3D rooms and as the large dialogue portrait. Every expression variant will later be an image EDIT of this picture, so it must be clean, complete and on-model.

## Global art direction
${STYLE}

## Character bible
${characterSection(a.character)}

## Pose and expression
${a.pose}

## Composition
- Portrait orientation 2:3 (${a.size}).
- Full body from the top of the head to the soles of the shoes. Feet fully visible. Nothing cropped.
- Character centered horizontally, about 6% empty margin above the head and below the feet.
- Straight-on eye-level camera, at most a slight 3/4 turn, no dramatic perspective or foreshortening.

## Background
- Fully transparent background (PNG with alpha). No floor, no ground shadow, no backdrop, no vignette.
- If your tool cannot output transparency, use a perfectly flat, uniform pure green #00FF00 background instead (no gradient, no shadow, no floor) and state that in your reply.

## Forbidden
${FORBIDDEN}

${outputBlock(a)}
`;
}

function briefExpression(a) {
  return `# Visual brief — ${a.id}

You are the visual production sub-agent for the game AFTERSIGNAL. Use your built-in image generation tool in EDIT mode on the attached reference image (\`${refPath(a.ref)}\`, the canonical portrait of this character). Create exactly ONE image.

## Role of this asset
Expression variant "${a.expression}" used in dialogue and in the debate scene. It is swapped in place of the canonical portrait, so the character must be instantly recognizable as the same person at the same scale and framing.

## Change ONLY
${a.change}
${a.retryNote ? `\n## Retry note\n${a.retryNote}\n` : ''}
## Keep exactly the same as the reference
- Face structure, eye shape, nose, jaw, age.
- Hairstyle, hair color and dyed details.
- Outfit, every garment, color blocking, accessories and their positions.
- Body type, height proportions, line weight, cel-shading style, palette.
- Framing: full body head to toe, feet visible, same size in frame, same margins, centered.
- Background: fully transparent (or the same flat pure green #00FF00 if the reference uses it). No floor, no shadow.

## Character bible (for identity checking)
${characterSection(a.character)}

## Global art direction
${STYLE}

## Forbidden
${FORBIDDEN}

${outputBlock(a)}
`;
}

function briefScene(a) {
  const refLine = a.ref
    ? `Use the attached reference image (\`${refPath(a.ref)}\`) as the identity / composition reference. Keep that subject exactly on-model.`
    : 'No reference image; create from the description.';
  return `# Visual brief — ${a.id}

You are the visual production sub-agent for the game AFTERSIGNAL. Use your built-in image generation tool to create exactly ONE image.

## Role of this asset
${{ keyart: 'Title screen key visual (full-screen background behind the typeset logo).', cutin: 'Full-screen dramatic cut-in illustration shown at a key story moment.', environment: 'Flat graphic texture placed on a wall/poster/window plane inside the 3D level.' }[a.kind]}

## Reference
${refLine}

## Scene
${a.scene}

## Global art direction
${STYLE}

## Composition
- ${a.size.startsWith('1536') ? 'Landscape 3:2' : a.size === '1024x1024' ? 'Square 1:1' : 'Portrait 2:3'} (${a.size}), full-bleed, opaque background.
- Clear focal point and strong silhouette readable at small size.

## Forbidden
${FORBIDDEN}

${outputBlock(a)}
`;
}

mkdirSync(join(root, 'art/prompts'), { recursive: true });
for (const a of plan.assets) {
  const text = a.kind === 'character' ? briefCharacter(a) : a.kind === 'expression' ? briefExpression(a) : briefScene(a);
  writeFileSync(join(root, 'art/prompts', `${a.id}.md`), text);
}
console.log(`wrote ${plan.assets.length} briefs to art/prompts/`);
