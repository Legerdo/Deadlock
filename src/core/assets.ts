import * as THREE from 'three';
import type { CharId } from '../data/types';
import { resolveExpr } from '../data/characters';

export interface ManifestEntry {
  id: string;
  file: string;
  smallFile?: string;
  purpose: string;
  character: CharId | null;
  expression: string | null;
  bbox?: [number, number, number, number];
  dimensions: string;
  transparent: boolean;
}

const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './';
export const url = (file: string) => base + file;

class AssetStore {
  private entries = new Map<string, ManifestEntry>();
  private textures = new Map<string, THREE.Texture>();
  private loader = new THREE.TextureLoader();
  maxAnisotropy = 4;

  async init() {
    const res = await fetch(url('assets/generated/manifest.json'));
    if (!res.ok) throw new Error('manifest.json missing');
    const data = (await res.json()) as { assets: ManifestEntry[] };
    for (const e of data.assets) this.entries.set(e.id, e);
  }

  has(id: string) {
    return this.entries.has(id);
  }

  get(id: string): ManifestEntry | undefined {
    return this.entries.get(id);
  }

  portraitId(char: CharId, expr?: string): string {
    const e = resolveExpr(char, expr);
    const id = `char_${char}_${e}`;
    if (this.entries.has(id)) return id;
    // expression ids use the plan naming (kai "angry" is char_kai_determined)
    for (const entry of this.entries.values()) if (entry.character === char && entry.expression === e) return entry.id;
    return `char_${char}_neutral`;
  }

  portrait(char: CharId, expr?: string): ManifestEntry {
    const entry = this.entries.get(this.portraitId(char, expr));
    if (!entry) throw new Error(`portrait missing for ${char}`);
    return entry;
  }

  /** Preload images into the browser cache (dialogue portraits, cut-ins). */
  preloadImages(ids: string[]) {
    return Promise.all(
      ids
        .map((id) => this.entries.get(id))
        .filter((e): e is ManifestEntry => !!e)
        .map(
          (e) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = img.onerror = () => resolve();
              img.src = url(e.file);
            }),
        ),
    );
  }

  texture(id: string, small = false): THREE.Texture {
    const key = id + (small ? '@sm' : '');
    const hit = this.textures.get(key);
    if (hit) return hit;
    const e = this.entries.get(id);
    if (!e) throw new Error(`asset ${id} missing from manifest`);
    const tex = this.loader.load(url(small && e.smallFile ? e.smallFile : e.file));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    this.textures.set(key, tex);
    return tex;
  }

  async preloadTextures(ids: string[], small = false) {
    await Promise.all(
      ids.map(
        (id) =>
          new Promise<void>((resolve) => {
            const e = this.entries.get(id);
            if (!e) return resolve();
            const key = id + (small ? '@sm' : '');
            if (this.textures.has(key) && this.textures.get(key)!.image) return resolve();
            this.loader.load(
              url(small && e.smallFile ? e.smallFile : e.file),
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = this.maxAnisotropy;
                this.textures.set(key, tex);
                resolve();
              },
              undefined,
              () => resolve(),
            );
          }),
      ),
    );
  }

  all(): ManifestEntry[] {
    return [...this.entries.values()];
  }
}

export const assets = new AssetStore();
