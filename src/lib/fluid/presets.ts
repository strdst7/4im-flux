import type { FluidConfig } from "./fluid.core";

export type FluidPreset = {
  id: string;
  name: string;
  group: "house" | "classic" | "signature";
  family: string;
  variant: string;
  config: Partial<FluidConfig>;
};

type Family = {
  slug: string;
  name: string;
  group: "house" | "classic";
  /** hue window, 0–1, wraps */
  hue: [number, number];
  saturation: number;
  value: number;
  back: [number, number, number];
  particle: [number, number, number];
  base?: Partial<FluidConfig>;
};

const HOUSE_BASE: Partial<FluidConfig> = {
  CURL: 26,
  SPLAT_RADIUS: 0.22,
  SPLAT_FORCE: 5200,
  DENSITY_DISSIPATION: 1.05,
  VELOCITY_DISSIPATION: 0.24,
  PRESSURE: 0.8,
  BLOOM: true,
  BLOOM_INTENSITY: 0.62,
  BLOOM_THRESHOLD: 0.55,
  SUNRAYS: true,
  SUNRAYS_WEIGHT: 0.85,
  COLOR_UPDATE_SPEED: 7,
  PARTICLES: true,
  PARTICLE_COUNT: 16384,
  PARTICLE_SIZE: 1.5,
  PARTICLE_LIFE: 6,
  PARTICLE_SPEED: 0.9,
  PARTICLE_FADE: 0.85,
  PARTICLE_COLORFUL: true,
};

const CLASSIC_BASE: Partial<FluidConfig> = {
  CURL: 32,
  SPLAT_RADIUS: 0.25,
  SPLAT_FORCE: 6000,
  DENSITY_DISSIPATION: 1,
  VELOCITY_DISSIPATION: 0.2,
  PRESSURE: 0.8,
  BLOOM: true,
  BLOOM_INTENSITY: 0.8,
  BLOOM_THRESHOLD: 0.6,
  SUNRAYS: true,
  SUNRAYS_WEIGHT: 1,
  COLOR_UPDATE_SPEED: 10,
  PARTICLES: true,
  PARTICLE_COUNT: 16384,
  PARTICLE_SIZE: 1.6,
  PARTICLE_LIFE: 5,
  PARTICLE_SPEED: 1.1,
  PARTICLE_FADE: 0.9,
  PARTICLE_COLORFUL: true,
};

const GOLD: [number, number, number] = [0.78, 0.66, 0.42];

const FAMILIES: Family[] = [
  /* ---------------------------------------------------------------- house */
  { slug: "champagne", name: "Champagne", group: "house", hue: [0.09, 0.13], saturation: 0.55, value: 1.0, back: [0.03, 0.03, 0.04], particle: GOLD },
  { slug: "old-gold", name: "Old Gold", group: "house", hue: [0.10, 0.14], saturation: 0.68, value: 0.95, back: [0.04, 0.03, 0.02], particle: [0.82, 0.68, 0.38] },
  { slug: "vellum", name: "Vellum", group: "house", hue: [0.09, 0.13], saturation: 0.22, value: 1.0, back: [0.05, 0.05, 0.05], particle: [0.95, 0.93, 0.89] },
  { slug: "ink-wash", name: "Ink Wash", group: "house", hue: [0.10, 0.13], saturation: 0.45, value: 0.7, back: [0.02, 0.02, 0.03], particle: [0.6, 0.52, 0.34], base: { CURL: 20, DENSITY_DISSIPATION: 1.3, BLOOM_INTENSITY: 0.5 } },
  { slug: "brass", name: "Brass", group: "house", hue: [0.12, 0.15], saturation: 0.6, value: 0.95, back: [0.03, 0.03, 0.03], particle: [0.85, 0.72, 0.45] },
  { slug: "amber", name: "Amber", group: "house", hue: [0.06, 0.10], saturation: 0.85, value: 1.0, back: [0.04, 0.02, 0.01], particle: [0.9, 0.6, 0.25] },
  { slug: "bronze", name: "Bronze", group: "house", hue: [0.07, 0.10], saturation: 0.7, value: 0.85, back: [0.03, 0.02, 0.02], particle: [0.75, 0.55, 0.35] },
  { slug: "platinum", name: "Platinum", group: "house", hue: [0.55, 0.65], saturation: 0.15, value: 1.0, back: [0.03, 0.03, 0.035], particle: [0.92, 0.93, 0.95] },
  { slug: "sepia", name: "Sepia", group: "house", hue: [0.07, 0.10], saturation: 0.5, value: 0.75, back: [0.035, 0.03, 0.025], particle: [0.7, 0.58, 0.42], base: { CURL: 18, DENSITY_DISSIPATION: 1.35 } },
  { slug: "ivory-smoke", name: "Ivory Smoke", group: "house", hue: [0.09, 0.14], saturation: 0.25, value: 1.0, back: [0.04, 0.04, 0.04], particle: [0.9, 0.88, 0.84], base: { CURL: 34, VELOCITY_DISSIPATION: 0.16 } },
  { slug: "copper-leaf", name: "Copper Leaf", group: "house", hue: [0.02, 0.05], saturation: 0.75, value: 0.95, back: [0.03, 0.02, 0.02], particle: [0.85, 0.55, 0.35] },
  { slug: "midnight-gold", name: "Midnight Gold", group: "house", hue: [0.10, 0.14], saturation: 0.8, value: 0.8, back: [0.015, 0.015, 0.02], particle: [0.8, 0.66, 0.4], base: { BLOOM_INTENSITY: 0.9, SUNRAYS_WEIGHT: 1.1 } },

  /* -------------------------------------------------------------- classic */
  { slug: "aurora", name: "Aurora", group: "classic", hue: [0.35, 0.65], saturation: 0.9, value: 1.0, back: [0, 0, 0], particle: [0.5, 1.0, 0.8] },
  { slug: "neon", name: "Neon", group: "classic", hue: [0.75, 1.05], saturation: 1.0, value: 1.0, back: [0, 0, 0], particle: [1.0, 0.4, 0.9], base: { BLOOM_INTENSITY: 1.1, CURL: 38 } },
  { slug: "fire", name: "Fire", group: "classic", hue: [0.0, 0.07], saturation: 1.0, value: 1.0, back: [0.02, 0, 0], particle: [1.0, 0.5, 0.15], base: { DENSITY_DISSIPATION: 0.92, CURL: 30 } },
  { slug: "ice", name: "Ice", group: "classic", hue: [0.5, 0.62], saturation: 0.7, value: 1.0, back: [0, 0.01, 0.02], particle: [0.7, 0.9, 1.0], base: { SUNRAYS_WEIGHT: 1.2 } },
  { slug: "toxic", name: "Toxic", group: "classic", hue: [0.22, 0.35], saturation: 1.0, value: 1.0, back: [0, 0.01, 0], particle: [0.6, 1.0, 0.2] },
  { slug: "lava", name: "Lava", group: "classic", hue: [0.97, 1.06], saturation: 1.0, value: 1.0, back: [0.02, 0, 0], particle: [1.0, 0.35, 0.1], base: { DENSITY_DISSIPATION: 0.9, VELOCITY_DISSIPATION: 0.28, CURL: 24 } },
  { slug: "ocean", name: "Ocean", group: "classic", hue: [0.5, 0.6], saturation: 0.95, value: 0.95, back: [0, 0.01, 0.03], particle: [0.35, 0.7, 1.0] },
  { slug: "ultraviolet", name: "Ultraviolet", group: "classic", hue: [0.72, 0.82], saturation: 1.0, value: 1.0, back: [0.01, 0, 0.03], particle: [0.7, 0.4, 1.0] },
  { slug: "candy", name: "Candy", group: "classic", hue: [0.85, 0.99], saturation: 0.85, value: 1.0, back: [0.02, 0.01, 0.02], particle: [1.0, 0.6, 0.8] },
  { slug: "spectrum", name: "Spectrum", group: "classic", hue: [0.0, 1.0], saturation: 1.0, value: 1.0, back: [0, 0, 0], particle: [1.0, 1.0, 1.0], base: { COLOR_UPDATE_SPEED: 14 } },
  { slug: "ember", name: "Ember", group: "classic", hue: [0.02, 0.09], saturation: 0.9, value: 0.9, back: [0.02, 0.01, 0], particle: [1.0, 0.65, 0.3], base: { DENSITY_DISSIPATION: 1.2, BLOOM_INTENSITY: 0.7 } },
  { slug: "cyber", name: "Cyber", group: "classic", hue: [0.45, 0.78], saturation: 1.0, value: 1.0, back: [0, 0.01, 0.02], particle: [0.3, 0.9, 1.0], base: { BLOOM_INTENSITY: 1.2, SUNRAYS_WEIGHT: 1.25, CURL: 40 } },
];

const VARIANTS = [
  { slug: "subtle", name: "Subtle", curl: 0.5, force: 0.65, density: 1.35, bloom: 0.6, sunrays: 0.6, speed: 0.5, particles: 0.5, size: 0.85 },
  { slug: "balanced", name: "Balanced", curl: 1.0, force: 1.0, density: 1.0, bloom: 1.0, sunrays: 1.0, speed: 1.0, particles: 1.0, size: 1.0 },
  { slug: "intense", name: "Intense", curl: 1.8, force: 1.5, density: 0.85, bloom: 1.3, sunrays: 1.2, speed: 1.6, particles: 1.8, size: 1.15 },
  { slug: "wild", name: "Wild", curl: 2.8, force: 2.1, density: 0.7, bloom: 1.65, sunrays: 1.4, speed: 2.4, particles: 2.6, size: 1.3 },
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const particleCounts = [4096, 8192, 16384, 32768, 65536];
const pickCount = (base: number, mult: number) =>
  particleCounts.reduce((best, c) =>
    Math.abs(c - base * mult) < Math.abs(best - base * mult) ? c : best
  );

function buildPreset(family: Family, variant: (typeof VARIANTS)[number]): FluidPreset {
  const base: Partial<FluidConfig> = {
    ...(family.group === "house" ? HOUSE_BASE : CLASSIC_BASE),
    ...(family.base || {}),
  };

  const particleBase = base.PARTICLE_COUNT ?? 16384;

  return {
    id: `${family.slug}-${variant.slug}`,
    name: `${family.name} · ${variant.name}`,
    group: family.group,
    family: family.slug,
    variant: variant.slug,
    config: {
      ...base,
      COLOR_HUE_MIN: family.hue[0],
      COLOR_HUE_MAX: family.hue[1],
      COLOR_SATURATION: family.saturation,
      COLOR_VALUE: family.value,
      BACK_COLOR: { r: family.back[0], g: family.back[1], b: family.back[2] },
      PARTICLE_COLOR: { r: family.particle[0], g: family.particle[1], b: family.particle[2] },
      CURL: (base.CURL ?? 30) * variant.curl,
      SPLAT_FORCE: (base.SPLAT_FORCE ?? 6000) * variant.force,
      DENSITY_DISSIPATION: (base.DENSITY_DISSIPATION ?? 1) * variant.density,
      BLOOM_INTENSITY: clamp((base.BLOOM_INTENSITY ?? 0.8) * variant.bloom, 0, 2),
      SUNRAYS_WEIGHT: clamp((base.SUNRAYS_WEIGHT ?? 1) * variant.sunrays, 0, 2),
      COLOR_UPDATE_SPEED: (base.COLOR_UPDATE_SPEED ?? 10) * variant.speed,
      PARTICLE_COUNT: pickCount(particleBase, variant.particles),
      PARTICLE_SIZE: (base.PARTICLE_SIZE ?? 1.6) * variant.size,
    },
  };
}

export const PRESETS: FluidPreset[] = [
  {
    id: "upstream-original",
    name: "Upstream · Original",
    group: "signature",
    family: "upstream",
    variant: "default",
    config: {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1024,
      DENSITY_DISSIPATION: 1,
      VELOCITY_DISSIPATION: 0.2,
      PRESSURE: 0.8,
      PRESSURE_ITERATIONS: 20,
      CURL: 30,
      SPLAT_RADIUS: 0.25,
      SPLAT_FORCE: 6000,
      SHADING: true,
      COLORFUL: true,
      COLOR_UPDATE_SPEED: 10,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      TRANSPARENT: false,
      BLOOM: true,
      BLOOM_ITERATIONS: 8,
      BLOOM_RESOLUTION: 256,
      BLOOM_INTENSITY: 0.8,
      BLOOM_THRESHOLD: 0.6,
      BLOOM_SOFT_KNEE: 0.7,
      SUNRAYS: true,
      SUNRAYS_RESOLUTION: 196,
      SUNRAYS_WEIGHT: 1.0,
      PARTICLES: false,
      COLOR_HUE_MIN: 0,
      COLOR_HUE_MAX: 1,
      COLOR_SATURATION: 1,
      COLOR_VALUE: 1,
    },
  },
  {
    id: "aimirah-house",
    name: "Aimirah · House Signature",
    group: "signature",
    family: "aimirah",
    variant: "signature",
    config: {
      CURL: 24,
      SPLAT_RADIUS: 0.2,
      SPLAT_FORCE: 4800,
      DENSITY_DISSIPATION: 1.1,
      VELOCITY_DISSIPATION: 0.26,
      BLOOM: true,
      BLOOM_INTENSITY: 0.6,
      BLOOM_THRESHOLD: 0.55,
      SUNRAYS: true,
      SUNRAYS_WEIGHT: 0.8,
      COLOR_UPDATE_SPEED: 6,
      COLOR_HUE_MIN: 0.095,
      COLOR_HUE_MAX: 0.135,
      COLOR_SATURATION: 0.55,
      COLOR_VALUE: 1.0,
      BACK_COLOR: { r: 0.027, g: 0.027, b: 0.031 },
      PARTICLES: true,
      PARTICLE_COUNT: 16384,
      PARTICLE_SIZE: 1.4,
      PARTICLE_LIFE: 7,
      PARTICLE_SPEED: 0.85,
      PARTICLE_FADE: 0.8,
      PARTICLE_COLOR: { r: 0.78, g: 0.66, b: 0.42 },
    },
  },
  ...FAMILIES.flatMap(family => VARIANTS.map(variant => buildPreset(family, variant))),
];

export const PRESET_COUNT = PRESETS.length;

export const HOUSE_PRESETS = PRESETS.filter(p => p.group === "house");
export const CLASSIC_PRESETS = PRESETS.filter(p => p.group === "classic");
export const SIGNATURE_PRESETS = PRESETS.filter(p => p.group === "signature");

export const DEFAULT_PRESET_ID = "aimirah-house";

export function getPreset(id: string): FluidPreset {
  return PRESETS.find(p => p.id === id) ?? PRESETS[0];
}

/* ------------------------------------------------------------------ quality */

export type QualityLevel = {
  id: string;
  name: string;
  note: string;
  config: Partial<FluidConfig>;
};

export const QUALITY_LEVELS: QualityLevel[] = [
  {
    id: "low",
    name: "Low",
    note: "128 sim · 256 dye · 12 iterations · no bloom, sunrays or particles",
    config: {
      SIM_RESOLUTION: 64,
      DYE_RESOLUTION: 256,
      PRESSURE_ITERATIONS: 12,
      BLOOM: false,
      SUNRAYS: false,
      SHADING: false,
      PARTICLES: false,
      PARTICLE_COUNT: 4096,
    },
  },
  {
    id: "medium",
    name: "Medium",
    note: "128 sim · 512 dye · 20 iterations · bloom · 8k particles",
    config: {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 512,
      PRESSURE_ITERATIONS: 20,
      BLOOM: true,
      BLOOM_RESOLUTION: 256,
      BLOOM_ITERATIONS: 8,
      SUNRAYS: false,
      SHADING: true,
      PARTICLES: true,
      PARTICLE_COUNT: 8192,
    },
  },
  {
    id: "high",
    name: "High",
    note: "128 sim · 1024 dye · 24 iterations · bloom + sunrays · 16k particles",
    config: {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1024,
      PRESSURE_ITERATIONS: 24,
      BLOOM: true,
      BLOOM_RESOLUTION: 256,
      BLOOM_ITERATIONS: 8,
      SUNRAYS: true,
      SUNRAYS_RESOLUTION: 196,
      SHADING: true,
      PARTICLES: true,
      PARTICLE_COUNT: 16384,
    },
  },
  {
    id: "ultra",
    name: "Ultra",
    note: "256 sim · 1024 dye · 32 iterations · full effects · 65k particles",
    config: {
      SIM_RESOLUTION: 256,
      DYE_RESOLUTION: 1024,
      PRESSURE_ITERATIONS: 32,
      BLOOM: true,
      BLOOM_RESOLUTION: 512,
      BLOOM_ITERATIONS: 8,
      SUNRAYS: true,
      SUNRAYS_RESOLUTION: 196,
      SHADING: true,
      PARTICLES: true,
      PARTICLE_COUNT: 65536,
    },
  },
];

/** A light configuration for the showcase band on the Aimirah home page. */
export const SHOWCASE_CONFIG: Partial<FluidConfig> = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 512,
  PRESSURE_ITERATIONS: 16,
  CURL: 24,
  SPLAT_RADIUS: 0.2,
  SPLAT_FORCE: 4800,
  DENSITY_DISSIPATION: 0.92,
  VELOCITY_DISSIPATION: 0.26,
  BLOOM: true,
  BLOOM_INTENSITY: 0.6,
  BLOOM_THRESHOLD: 0.55,
  SUNRAYS: true,
  SUNRAYS_WEIGHT: 0.8,
  COLOR_UPDATE_SPEED: 6,
  COLOR_HUE_MIN: 0.095,
  COLOR_HUE_MAX: 0.135,
  COLOR_SATURATION: 0.55,
  COLOR_VALUE: 1.0,
  BACK_COLOR: { r: 0.027, g: 0.027, b: 0.031 },
  TRANSPARENT: false,
  PARTICLES: true,
  PARTICLE_COUNT: 4096,
  PARTICLE_SIZE: 1.4,
  PARTICLE_LIFE: 7,
  PARTICLE_SPEED: 0.85,
  PARTICLE_FADE: 0.8,
  PARTICLE_COLOR: { r: 0.78, g: 0.66, b: 0.42 },
  AUTO_SPLATS: 2.0,
  MAX_PIXEL_RATIO: 1.5,
};
