import * as THREE from 'three';

// Code-painted graphic textures (floors, walls, signage). Generated art is used
// only for posters, murals and windows; readable text is always typeset here.

const cache = new Map<string, THREE.Texture>();

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function toTexture(c: HTMLCanvasElement, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function floorTexture(pattern: string, a: string, b: string): THREE.Texture {
  const key = `floor:${pattern}:${a}:${b}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(256, 256);
  const r = rng(7);
  g.fillStyle = a;
  g.fillRect(0, 0, 256, 256);
  switch (pattern) {
    case 'terrazzo':
      for (let i = 0; i < 380; i++) {
        g.fillStyle = [b, '#8E8A93', '#2A2632', '#E4F03A33'][i % 4];
        g.beginPath();
        g.ellipse(r() * 256, r() * 256, 1 + r() * 4, 1 + r() * 3, r() * 3, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = '#16131D55';
      g.lineWidth = 2;
      g.strokeRect(0, 0, 256, 256);
      break;
    case 'checker':
      g.fillStyle = b;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) g.fillRect(x * 64, y * 64, 64, 64);
      break;
    case 'planks':
      for (let y = 0; y < 8; y++) {
        g.fillStyle = y % 2 ? b : a;
        g.fillRect(0, y * 32, 256, 32);
        g.fillStyle = '#16131D66';
        g.fillRect(0, y * 32, 256, 2);
        g.fillRect(((y * 97) % 256), y * 32, 2, 32);
      }
      break;
    case 'grate':
      g.fillStyle = b;
      for (let i = 0; i < 256; i += 16) {
        g.fillRect(i, 0, 4, 256);
        g.fillRect(0, i, 256, 4);
      }
      break;
    case 'carpet':
      for (let i = 0; i < 2000; i++) {
        g.fillStyle = r() > 0.5 ? b : '#16131D22';
        g.fillRect(r() * 256, r() * 256, 2, 2);
      }
      g.strokeStyle = '#E4F03A33';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(0, 128);
      g.lineTo(256, 128);
      g.stroke();
      break;
    case 'concrete':
    default:
      for (let i = 0; i < 1400; i++) {
        g.fillStyle = r() > 0.5 ? b : '#16131D18';
        g.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3);
      }
      g.strokeStyle = '#16131D40';
      g.lineWidth = 2;
      g.strokeRect(0, 0, 256, 256);
  }
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

export function wallTexture(base: string, band: string, pattern = 'panels'): THREE.Texture {
  const key = `wall:${base}:${band}:${pattern}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(256, 512);
  const r = rng(11);
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = r() > 0.5 ? '#FFFFFF10' : '#16131D14';
    g.fillRect(r() * 256, r() * 512, 2, 2);
  }
  if (pattern === 'panels') {
    g.strokeStyle = '#16131D55';
    g.lineWidth = 3;
    g.strokeRect(6, 40, 244, 330);
  } else if (pattern === 'tile') {
    g.strokeStyle = '#16131D30';
    g.lineWidth = 2;
    for (let y = 300; y < 512; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
    for (let x = 0; x < 256; x += 32) {
      g.beginPath();
      g.moveTo(x, 300);
      g.lineTo(x, 512);
      g.stroke();
    }
  } else if (pattern === 'acoustic') {
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 4; x++) {
        g.fillStyle = (x + y) % 2 ? '#16131D40' : '#FFFFFF08';
        g.fillRect(x * 64 + 4, y * 48 + 4, 56, 40);
      }
  } else {
    g.strokeStyle = '#16131D30';
    g.lineWidth = 2;
    g.strokeRect(2, 2, 252, 508);
    g.fillStyle = '#16131D20';
    for (let i = 0; i < 6; i++) g.fillRect(30 + i * 40, 60 + (i % 3) * 90, 3, 3);
  }
  // painted band (wayfinding stripe)
  g.fillStyle = band;
  g.fillRect(0, 392, 256, 26);
  g.fillStyle = '#16131D';
  g.fillRect(0, 418, 256, 6);
  g.fillRect(0, 386, 256, 3);
  // skirting
  g.fillStyle = '#16131D';
  g.fillRect(0, 488, 256, 24);
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

export function signTexture(text: string, fg = '#F2EADB', bg = '#16131D', accent = '#E4F03A'): THREE.Texture {
  const key = `sign:${text}:${fg}:${bg}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(1024, 192);
  g.fillStyle = bg;
  g.fillRect(0, 0, 1024, 192);
  g.fillStyle = accent;
  g.fillRect(0, 0, 18, 192);
  g.fillStyle = fg;
  let size = 104;
  g.textBaseline = 'middle';
  do {
    g.font = `900 ${size}px "Anton", "Black Han Sans", "Noto Sans KR", sans-serif`;
    size -= 4;
  } while (g.measureText(text).width > 940 && size > 30);
  g.fillText(text, 48, 100);
  const t = toTexture(c, false);
  cache.set(key, t);
  return t;
}

/** Poster caption band composited over generated art (art has no text). */
export function posterTexture(img: HTMLImageElement, caption: string): THREE.Texture {
  const [c, g] = canvas(img.width, img.height);
  g.drawImage(img, 0, 0);
  const [title, sub] = caption.split('|');
  const h = img.height;
  const band = h * 0.2;
  g.fillStyle = '#16131DE8';
  g.fillRect(0, h - band, img.width, band);
  g.fillStyle = '#E4F03A';
  g.fillRect(0, h - band, img.width, 10);
  g.fillStyle = '#F2EADB';
  g.textBaseline = 'alphabetic';
  g.font = `900 ${Math.round(band * 0.44)}px "Anton", sans-serif`;
  g.fillText(title, img.width * 0.07, h - band * 0.45);
  g.fillStyle = '#E4F03A';
  g.font = `700 ${Math.round(band * 0.16)}px "IBM Plex Mono", monospace`;
  g.fillText(sub ?? '', img.width * 0.07, h - band * 0.16);
  return toTexture(c, false);
}

export function blobShadow(): THREE.Texture {
  const hit = cache.get('blob');
  if (hit) return hit;
  const [c, g] = canvas(128, 128);
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(10,8,14,0.65)');
  grad.addColorStop(0.6, 'rgba(10,8,14,0.3)');
  grad.addColorStop(1, 'rgba(10,8,14,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = toTexture(c, false);
  cache.set('blob', t);
  return t;
}

export function markerTexture(kind: 'hotspot' | 'done' | 'talk'): THREE.Texture {
  const key = `marker:${kind}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(128, 128);
  g.translate(64, 64);
  if (kind === 'talk') {
    g.fillStyle = '#16131D';
    g.beginPath();
    g.roundRect(-46, -30, 92, 52, 10);
    g.fill();
    g.fillStyle = '#E4F03A';
    g.beginPath();
    g.roundRect(-40, -24, 80, 40, 8);
    g.fill();
    g.beginPath();
    g.moveTo(-10, 16);
    g.lineTo(0, 34);
    g.lineTo(10, 16);
    g.fill();
    g.fillStyle = '#16131D';
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.arc(i * 20, -4, 6, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    g.rotate(Math.PI / 4);
    g.fillStyle = '#16131D';
    g.fillRect(-34, -34, 68, 68);
    g.fillStyle = kind === 'done' ? '#8E8A93' : '#E4F03A';
    g.fillRect(-26, -26, 52, 52);
    g.rotate(-Math.PI / 4);
    g.strokeStyle = '#16131D';
    g.lineWidth = 9;
    g.lineCap = 'round';
    g.beginPath();
    if (kind === 'done') {
      g.moveTo(-14, 0);
      g.lineTo(-3, 11);
      g.lineTo(16, -12);
    } else {
      g.moveTo(0, -16);
      g.lineTo(0, 4);
      g.moveTo(0, 16);
      g.lineTo(0, 17);
    }
    g.stroke();
  }
  const t = toTexture(c, false);
  cache.set(key, t);
  return t;
}

export function toonGradient(): THREE.Texture {
  const hit = cache.get('toon');
  if (hit) return hit;
  const data = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  cache.set('toon', t);
  return t;
}

export function labelTexture(lines: string[], opts: { w?: number; h?: number; bg?: string; fg?: string } = {}): THREE.Texture {
  const [c, g] = canvas(opts.w ?? 512, opts.h ?? 256);
  g.fillStyle = opts.bg ?? '#F2EADB';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = opts.fg ?? '#16131D';
  g.font = `700 ${Math.round(c.height / (lines.length + 1.5))}px "IBM Plex Mono", monospace`;
  lines.forEach((l, i) => g.fillText(l, 20, (i + 1.2) * (c.height / (lines.length + 0.8))));
  return toTexture(c, false);
}
