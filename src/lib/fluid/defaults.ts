import type { FluidConfig } from "./fluid.core";

/** Upstream defaults, plus the values for everything this build adds. */
export const FLUID_DEFAULTS: FluidConfig = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1024,
  CAPTURE_RESOLUTION: 512,
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
  PAUSED: false,
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
  PARTICLE_COUNT: 16384,
  PARTICLE_SIZE: 1.6,
  PARTICLE_LIFE: 5.0,
  PARTICLE_SPEED: 1.0,
  PARTICLE_FADE: 0.9,
  PARTICLE_COLORFUL: true,
  PARTICLE_COLOR: { r: 0.78, g: 0.66, b: 0.42 },

  COLOR_HUE_MIN: 0.0,
  COLOR_HUE_MAX: 1.0,
  COLOR_SATURATION: 1.0,
  COLOR_VALUE: 1.0,

  AUTO_SPLATS: 0,

  MAX_PIXEL_RATIO: 2,
};

export function hexToFluidColor(hex: string) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map(c => c + c)
          .join("")
      : clean;
  const int = parseInt(full, 16);
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
  };
}

export function fluidColorToHex(color: { r: number; g: number; b: number }) {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(color.r)}${to(color.g)}${to(color.b)}`;
}
