// Runs Codex CLI (`codex exec`) as the visual production sub-agent.
// Usage: node tools/codex-gen.mjs [--concurrency 4] [--force] <assetId|group:kind>...
//   node tools/codex-gen.mjs char_kai_neutral
//   node tools/codex-gen.mjs group:character --concurrency 4
// Each job reads art/prompts/<id>.md, attaches the reference PNG for edits (-i, placed
// after the prompt), and waits until art/raw/<id>.png exists. Logs go to art/logs/.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, createWriteStream, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const plan = JSON.parse(readFileSync(join(root, 'art/asset-plan.json'), 'utf8'));
const byId = new Map(plan.assets.map((a) => [a.id, a]));
const args = process.argv.slice(2);
let concurrency = 3;
let force = false;
const targets = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--concurrency') concurrency = Number(args[++i]);
  else if (args[i] === '--force') force = true;
  else targets.push(args[i]);
}

const ids = [];
for (const t of targets) {
  if (t.startsWith('group:')) {
    const kind = t.slice(6);
    plan.assets.filter((a) => a.kind === kind).forEach((a) => ids.push(a.id));
  } else if (byId.has(t)) ids.push(t);
  else throw new Error(`unknown asset ${t}`);
}

const codexJs = join(process.env.APPDATA ?? '', 'npm/node_modules/@openai/codex/bin/codex.js');
if (!existsSync(codexJs)) throw new Error('Codex CLI not found at ' + codexJs);
mkdirSync(join(root, 'art/raw'), { recursive: true });
mkdirSync(join(root, 'art/logs'), { recursive: true });

function refFile(a) {
  if (!a.ref) return null;
  const f = join(root, 'art/raw', `${a.ref}.png`);
  if (!existsSync(f)) throw new Error(`reference ${a.ref} not generated yet`);
  return f;
}

function runJob(id) {
  const a = byId.get(id);
  const out = join(root, 'art/raw', `${id}.png`);
  if (existsSync(out) && !force) {
    console.log(`[skip] ${id} exists`);
    return Promise.resolve({ id, ok: true, skipped: true });
  }
  const ref = refFile(a);
  const prompt =
    `Read the visual brief at art/prompts/${id}.md in the current workspace and follow it exactly. ` +
    (ref ? `The attached image is the reference named in the brief; edit it with your built-in image generation tool. ` : `Use your built-in image generation tool. `) +
    `Save the resulting PNG to art/raw/${id}.png. Do not change any other file. ` +
    `Finish by replying with the saved path, pixel size, transparency, and the image model name if known.`;
  const cliArgs = [codexJs, 'exec', '--skip-git-repo-check', '-s', 'workspace-write', '-C', root, '-o', join(root, 'art/logs', `${id}.reply.txt`), prompt];
  if (ref) cliArgs.push('-i', ref);
  const log = createWriteStream(join(root, 'art/logs', `${id}.log`));
  const started = Date.now();
  console.log(`[start] ${id}${ref ? ' (edit)' : ''}`);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, cliArgs, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(log);
    child.stderr.pipe(log);
    const timer = setTimeout(() => child.kill(), 20 * 60 * 1000);
    child.on('close', (code) => {
      clearTimeout(timer);
      const ok = existsSync(out) && statSync(out).size > 10_000;
      const secs = Math.round((Date.now() - started) / 1000);
      console.log(`[${ok ? 'done' : 'FAIL'}] ${id} code=${code} ${secs}s`);
      resolve({ id, ok, code });
    });
  });
}

const queue = [...ids];
const results = [];
async function worker() {
  while (queue.length) {
    const id = queue.shift();
    results.push(await runJob(id));
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker));
const failed = results.filter((r) => !r.ok).map((r) => r.id);
console.log(`finished ${results.length} jobs; failed: ${failed.length ? failed.join(', ') : 'none'}`);
