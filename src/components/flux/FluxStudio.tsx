"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  CLASSIC_PRESETS,
  DEFAULT_PRESET_ID,
  HOUSE_PRESETS,
  PRESET_COUNT,
  QUALITY_LEVELS,
  SIGNATURE_PRESETS,
  getPreset,
  type FluidConfig,
  type FluidInfo,
} from "@/lib/fluid";
import { FLUID_DEFAULTS } from "@/lib/fluid/defaults";
import type { FluxCanvasHandle } from "@/components/flux/FluxCanvas";
import { Action, Choice, ColorField, Section, Slider, Toggle } from "@/components/flux/controls";

type SavedPreset = { id: string; name: string; config: Partial<FluidConfig> };
type Tab = "house" | "classic" | "signature" | "saved";

const STORAGE_KEY = "aimirah.fluid.presets.v1";

const particleOptions = [
  { value: 4096, label: "4k" },
  { value: 8192, label: "8k" },
  { value: 16384, label: "16k" },
  { value: 32768, label: "33k" },
  { value: 65536, label: "65k" },
];

export default function FluxStudio({
  handle,
  onBackgroundChange,
}: {
  handle: RefObject<FluxCanvasHandle | null>;
  onBackgroundChange: (url: string | null) => void;
}) {
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [qualityId, setQualityId] = useState("high");
  const [overrides, setOverrides] = useState<Partial<FluidConfig>>({});
  const [tab, setTab] = useState<Tab>("house");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<SavedPreset[]>([]);
  const [draftName, setDraftName] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const [info, setInfo] = useState<FluidInfo | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const quality = QUALITY_LEVELS.find(q => q.id === qualityId) ?? QUALITY_LEVELS[2];

  const effective = useMemo<Partial<FluidConfig>>(
    () => ({
      ...getPreset(presetId).config,
      ...quality.config,
      ...overrides,
    }),
    [presetId, quality, overrides]
  );

  const value = useCallback(
    <K extends keyof FluidConfig>(key: K): FluidConfig[K] =>
      (effective[key] ?? FLUID_DEFAULTS[key]) as FluidConfig[K],
    [effective]
  );

  const set = useCallback((patch: Partial<FluidConfig>) => {
    setOverrides(prev => ({ ...prev, ...patch }));
  }, []);

  /* ---- push config to the simulation ---- */
  useEffect(() => {
    handle.current?.setConfig(effective);
  }, [effective, handle]);

  /* ---- saved presets ---- */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: SavedPreset[]) => {
    setSaved(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  /* ---- device info ---- */
  useEffect(() => {
    const read = () => setInfo(handle.current?.info() ?? null);
    read();
    const id = window.setInterval(read, 2000);
    return () => window.clearInterval(id);
  }, [handle]);

  /* ---- shortcuts ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        const next = !paused;
        setPaused(next);
        set({ PAUSED: next });
      }
      if (e.key.toLowerCase() === "r") handle.current?.randomSplats(18);
      if (e.key.toLowerCase() === "s") handle.current?.screenshot(1024);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handle, paused, set]);

  /* ---- actions ---- */
  const applyPreset = (id: string, config?: Partial<FluidConfig>) => {
    if (config) {
      setPresetId(id);
      setOverrides(config);
    } else {
      setPresetId(id);
      setOverrides({});
    }
    // give each preset a clean field so the change is legible
    window.setTimeout(() => {
      handle.current?.clear();
      handle.current?.randomSplats(10);
    }, 60);
  };

  const randomise = () => {
    const pool = tab === "classic" ? CLASSIC_PRESETS : HOUSE_PRESETS;
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? getPreset(DEFAULT_PRESET_ID);
    applyPreset(pick.id);
  };

  const savePreset = () => {
    const name = draftName.trim() || `Untitled ${saved.length + 1}`;
    persist([
      ...saved,
      { id: `saved-${Date.now()}`, name, config: { ...effective, PAUSED: false } },
    ]);
    setDraftName("");
    setTab("saved");
  };

  const useImageAsSource = () => {
    const image = imageRef.current;
    if (!image) return;
    handle.current?.imageSplats(image, { density: 40, force: 2600, brightness: 8 });
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
    };
    image.src = url;
    setBackground(url);
    onBackgroundChange(url);
  };

  const clearBackground = () => {
    if (background) URL.revokeObjectURL(background);
    setBackground(null);
    onBackgroundChange(null);
    imageRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
  };

  const filtered = useMemo(() => {
    const pool = tab === "saved" ? saved.map(s => ({ id: s.id, name: s.name, config: s.config })) : tab === "house" ? HOUSE_PRESETS : tab === "classic" ? CLASSIC_PRESETS : SIGNATURE_PRESETS;
    if (!query.trim()) return pool;
    return pool.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [tab, query, saved]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-20 border border-bone/15 bg-ink/70 px-4 py-2.5 text-[0.5625rem] uppercase tracking-[0.28em] text-mist/80 backdrop-blur-md transition-colors duration-500 hover:border-gold/40 hover:text-gold-soft"
      >
        Controls
      </button>
    );
  }

  return (
    <aside className="pointer-events-auto fixed bottom-0 right-0 z-20 flex h-[62svh] w-full flex-col border-t border-bone/10 bg-ink/92 backdrop-blur-xl md:top-0 md:h-full md:max-w-[26rem] md:border-l md:border-t-0">
      <header className="flex items-baseline justify-between gap-4 border-b border-bone/10 px-6 py-5">
        <div>
          <p className="eyebrow text-[0.5625rem] text-gold/70">4IM/Flux Studio</p>
          <p className="display mt-2 text-2xl leading-none text-bone">
            {PRESET_COUNT} presets
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[0.625rem] uppercase tracking-[0.22em] text-mist transition-colors hover:text-gold"
        >
          Hide
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* ---------------------------------------------------------- presets */}
        <Section
          title="Presets"
          right={
            <div className="flex gap-3">
              <button
                type="button"
                onClick={randomise}
                className="text-[0.5625rem] uppercase tracking-[0.2em] text-mist hover:text-gold"
              >
                Random
              </button>
              <button
                type="button"
                onClick={() => {
                  setPresetId(DEFAULT_PRESET_ID);
                  setOverrides({});
                }}
                className="text-[0.5625rem] uppercase tracking-[0.2em] text-mist hover:text-gold"
              >
                Reset
              </button>
            </div>
          }
        >
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search presets…"
            className="w-full border border-bone/12 bg-transparent px-3 py-2 text-[0.8125rem] text-bone placeholder:text-mist/60 focus:border-gold/40 focus:outline-none"
          />

          <div className="flex flex-wrap gap-2">
            {(["house", "classic", "signature", "saved"] as Tab[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`border px-3 py-1.5 text-[0.5625rem] uppercase tracking-[0.2em] transition-colors ${
                  tab === t
                    ? "border-gold/60 text-gold-soft"
                    : "border-bone/12 text-mist hover:border-gold/35"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="max-h-[15rem] overflow-y-auto border border-bone/10 p-2">
            <div className="flex flex-wrap gap-1.5">
              {filtered.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id, "config" in p ? p.config : undefined)}
                  className={`border px-2.5 py-1.5 text-[0.625rem] tracking-[0.08em] transition-colors ${
                    presetId === p.id
                      ? "border-gold/60 bg-gold/10 text-gold-soft"
                      : "border-bone/10 text-mist hover:border-gold/35 hover:text-bone"
                  }`}
                >
                  {p.name}
                </button>
              ))}
              {filtered.length === 0 ? (
                <p className="px-1 py-2 text-xs text-mist">No presets match.</p>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              placeholder="Name this look"
              className="flex-1 border border-bone/12 bg-transparent px-3 py-2 text-[0.75rem] text-bone placeholder:text-mist/60 focus:border-gold/40 focus:outline-none"
            />
            <Action tone="gold" onClick={savePreset}>
              Save
            </Action>
          </div>

          {tab === "saved" && saved.length > 0 ? (
            <div className="space-y-2">
              {saved.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 border border-bone/10 px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => applyPreset(p.id, p.config)}
                    className="flex-1 truncate text-left text-[0.75rem] text-bone/80 hover:text-gold-soft"
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => persist(saved.filter(s => s.id !== p.id))}
                    className="text-[0.5625rem] uppercase tracking-[0.2em] text-mist hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </Section>

        {/* ---------------------------------------------------------- quality */}
        <Section title="Quality">
          <Choice
            label="Preset"
            value={qualityId}
            options={QUALITY_LEVELS.map(q => ({ value: q.id, label: q.name }))}
            onChange={id => {
              setQualityId(id);
              setOverrides(prev => {
                const next = { ...prev };
                QUALITY_LEVELS.forEach(q => {
                  Object.keys(q.config).forEach(k => delete next[k as keyof FluidConfig]);
                });
                return next;
              });
            }}
          />
          <p className="text-[0.6875rem] leading-relaxed text-mist">{quality.note}</p>
          {info ? (
            <p className="font-mono text-[0.625rem] leading-relaxed text-bone/40">
              {info.webgl2 ? "WebGL 2" : "WebGL 1"} · sim {info.sim.width}×{info.sim.height} · dye{" "}
              {info.dye.width}×{info.dye.height} ·{" "}
              {info.particlesSupported
                ? `${info.particles.toLocaleString()} particles`
                : "particles unsupported"}
            </p>
          ) : null}
        </Section>

        {/* ------------------------------------------------------ simulation */}
        <Section title="Simulation">
          <Slider
            label="Density dissipation"
            value={value("DENSITY_DISSIPATION")}
            min={0.2}
            max={4}
            step={0.05}
            onChange={v => set({ DENSITY_DISSIPATION: v })}
          />
          <Slider
            label="Velocity dissipation"
            value={value("VELOCITY_DISSIPATION")}
            min={0}
            max={1}
            step={0.01}
            onChange={v => set({ VELOCITY_DISSIPATION: v })}
          />
          <Slider
            label="Pressure"
            value={value("PRESSURE")}
            min={0}
            max={1}
            step={0.01}
            onChange={v => set({ PRESSURE: v })}
          />
          <Slider
            label="Pressure iterations"
            value={value("PRESSURE_ITERATIONS")}
            min={1}
            max={50}
            step={1}
            format={v => v.toFixed(0)}
            onChange={v => set({ PRESSURE_ITERATIONS: Math.round(v) })}
          />
          <Slider
            label="Curl / vorticity"
            value={value("CURL")}
            min={0}
            max={80}
            step={1}
            format={v => v.toFixed(0)}
            onChange={v => set({ CURL: Math.round(v) })}
          />
          <Slider
            label="Splat radius"
            value={value("SPLAT_RADIUS")}
            min={0.05}
            max={1}
            step={0.01}
            onChange={v => set({ SPLAT_RADIUS: v })}
          />
          <Slider
            label="Splat force"
            value={value("SPLAT_FORCE")}
            min={1000}
            max={20000}
            step={100}
            format={v => v.toFixed(0)}
            onChange={v => set({ SPLAT_FORCE: Math.round(v) })}
          />
          <Slider
            label="Ambient splats"
            value={value("AUTO_SPLATS")}
            min={0}
            max={10}
            step={0.25}
            format={v => (v === 0 ? "off" : `every ${v.toFixed(2)}s`)}
            onChange={v => set({ AUTO_SPLATS: v })}
          />
          <Toggle
            label="Shading"
            value={value("SHADING")}
            onChange={v => set({ SHADING: v })}
          />
        </Section>

        {/* ---------------------------------------------------------- colour */}
        <Section title="Colour">
          <Toggle
            label="Cycling colours"
            value={value("COLORFUL")}
            onChange={v => set({ COLORFUL: v })}
          />
          <Slider
            label="Colour update speed"
            value={value("COLOR_UPDATE_SPEED")}
            min={0}
            max={30}
            step={0.5}
            onChange={v => set({ COLOR_UPDATE_SPEED: v })}
          />
          <Slider
            label="Hue from"
            value={value("COLOR_HUE_MIN")}
            min={0}
            max={1}
            step={0.005}
            format={v => `${Math.round(v * 360)}°`}
            onChange={v => set({ COLOR_HUE_MIN: v })}
          />
          <Slider
            label="Hue to"
            value={value("COLOR_HUE_MAX")}
            min={0}
            max={1}
            step={0.005}
            format={v => `${Math.round(v * 360)}°`}
            onChange={v => set({ COLOR_HUE_MAX: v })}
          />
          <Slider
            label="Saturation"
            value={value("COLOR_SATURATION")}
            min={0}
            max={1}
            step={0.01}
            onChange={v => set({ COLOR_SATURATION: v })}
          />
          <Slider
            label="Brightness"
            value={value("COLOR_VALUE")}
            min={0}
            max={1}
            step={0.01}
            onChange={v => set({ COLOR_VALUE: v })}
          />
          <ColorField
            label="Backdrop"
            value={value("BACK_COLOR")}
            onChange={v => set({ BACK_COLOR: v })}
          />
          <Toggle
            label="Transparent canvas"
            value={value("TRANSPARENT")}
            onChange={v => set({ TRANSPARENT: v })}
          />
        </Section>

        {/* ----------------------------------------------------------- bloom */}
        <Section title="Bloom">
          <Toggle label="Bloom" value={value("BLOOM")} onChange={v => set({ BLOOM: v })} />
          <Slider
            label="Intensity"
            value={value("BLOOM_INTENSITY")}
            min={0}
            max={2}
            step={0.02}
            disabled={!value("BLOOM")}
            onChange={v => set({ BLOOM_INTENSITY: v })}
          />
          <Slider
            label="Threshold"
            value={value("BLOOM_THRESHOLD")}
            min={0}
            max={1.5}
            step={0.01}
            disabled={!value("BLOOM")}
            onChange={v => set({ BLOOM_THRESHOLD: v })}
          />
          <Slider
            label="Soft knee"
            value={value("BLOOM_SOFT_KNEE")}
            min={0}
            max={1}
            step={0.01}
            disabled={!value("BLOOM")}
            onChange={v => set({ BLOOM_SOFT_KNEE: v })}
          />
          <Slider
            label="Iterations"
            value={value("BLOOM_ITERATIONS")}
            min={1}
            max={12}
            step={1}
            format={v => v.toFixed(0)}
            disabled={!value("BLOOM")}
            onChange={v => set({ BLOOM_ITERATIONS: Math.round(v) })}
          />
        </Section>

        {/* --------------------------------------------------------- sunrays */}
        <Section title="Sunrays">
          <Toggle
            label="Sunrays"
            value={value("SUNRAYS")}
            onChange={v => set({ SUNRAYS: v })}
          />
          <Slider
            label="Weight"
            value={value("SUNRAYS_WEIGHT")}
            min={0}
            max={2}
            step={0.02}
            disabled={!value("SUNRAYS")}
            onChange={v => set({ SUNRAYS_WEIGHT: v })}
          />
        </Section>

        {/* ------------------------------------------------------- particles */}
        <Section title="Particles">
          <Toggle
            label="Particles"
            value={value("PARTICLES")}
            onChange={v => set({ PARTICLES: v })}
          />
          <Choice
            label="Count"
            value={value("PARTICLE_COUNT")}
            options={particleOptions}
            onChange={v => set({ PARTICLE_COUNT: v })}
          />
          <Slider
            label="Size"
            value={value("PARTICLE_SIZE")}
            min={0.5}
            max={6}
            step={0.1}
            disabled={!value("PARTICLES")}
            onChange={v => set({ PARTICLE_SIZE: v })}
          />
          <Slider
            label="Lifespan"
            value={value("PARTICLE_LIFE")}
            min={1}
            max={20}
            step={0.5}
            disabled={!value("PARTICLES")}
            onChange={v => set({ PARTICLE_LIFE: v })}
          />
          <Slider
            label="Drift speed"
            value={value("PARTICLE_SPEED")}
            min={0}
            max={4}
            step={0.05}
            disabled={!value("PARTICLES")}
            onChange={v => set({ PARTICLE_SPEED: v })}
          />
          <Slider
            label="Opacity"
            value={value("PARTICLE_FADE")}
            min={0}
            max={1}
            step={0.02}
            disabled={!value("PARTICLES")}
            onChange={v => set({ PARTICLE_FADE: v })}
          />
          <Toggle
            label="Tint by dye"
            value={value("PARTICLE_COLORFUL")}
            onChange={v => set({ PARTICLE_COLORFUL: v })}
          />
          <ColorField
            label="Particle colour"
            value={value("PARTICLE_COLOR")}
            onChange={v => set({ PARTICLE_COLOR: v })}
          />
        </Section>

        {/* ---------------------------------------------------------- images */}
        <Section title="Image">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={e => onFile(e.target.files?.[0])}
            className="w-full text-[0.6875rem] text-mist file:mr-3 file:border file:border-bone/15 file:bg-transparent file:px-3 file:py-1.5 file:text-[0.625rem] file:uppercase file:tracking-[0.2em] file:text-mist"
          />
          <div className="flex flex-wrap gap-2">
            <Action onClick={useImageAsSource}>Use as fluid source</Action>
            <Action onClick={clearBackground}>Clear</Action>
          </div>
          <p className="text-[0.6875rem] leading-relaxed text-mist">
            Loading an image sets it as the backdrop and keeps it ready. “Use as fluid source”
            dissolves it into the velocity field as a grid of coloured splats.
          </p>
        </Section>

        {/* --------------------------------------------------------- capture */}
        <Section title="Capture">
          <div className="flex flex-wrap gap-2">
            <Action
              tone="gold"
              onClick={() => {
                const next = !paused;
                setPaused(next);
                set({ PAUSED: next });
              }}
            >
              {paused ? "Resume" : "Pause"}
            </Action>
            <Action onClick={() => handle.current?.randomSplats(14)}>Random splats</Action>
            <Action onClick={() => handle.current?.clear()}>Clear field</Action>
            <Action onClick={() => handle.current?.screenshot(1024)}>Screenshot</Action>
            <Action
              tone={recording ? "danger" : "quiet"}
              onClick={() => {
                if (recording) {
                  handle.current?.stopRecording();
                  setRecording(false);
                  return;
                }
                const started = handle.current?.startRecording({
                  fps: 60,
                  onStop: url => {
                    setRecordUrl(url);
                    setRecording(false);
                  },
                });
                setRecording(Boolean(started));
              }}
            >
              {recording ? "Stop recording" : "Record video"}
            </Action>
          </div>

          {recordUrl ? (
            <a
              href={recordUrl}
              download={`4im-flux-${Date.now()}.webm`}
              className="inline-block border border-gold/40 px-3 py-2 text-[0.625rem] uppercase tracking-[0.22em] text-gold-soft"
            >
              Download recording ↓
            </a>
          ) : null}

          <p className="text-[0.6875rem] leading-relaxed text-mist">
            Space pauses, R throws splats, S saves a still. Drag with one finger, several, or the
            mouse — the field answers to all of them at once.
          </p>
        </Section>

        <footer className="border-t border-bone/10 px-6 py-6">
          <p className="text-[0.6875rem] leading-relaxed text-mist">
            Solver:{" "}
            <a
              href="https://github.com/PavelDoGreat/WebGL-Fluid-Simulation"
              target="_blank"
              rel="noreferrer"
              className="text-bone/70 underline decoration-gold/30 underline-offset-4 hover:text-gold-soft"
            >
              WebGL-Fluid-Simulation
            </a>{" "}
            by Pavel Dobryakov, MIT. Ported to React and extended with palettes, particles, presets
            and capture for Aimirah.
          </p>
        </footer>
      </div>
    </aside>
  );
}
