"use client";

import { useMemo, useRef, useState } from "react";
import FluxCanvas, { type FluxCanvasHandle } from "@/components/flux/FluxCanvas";
import FluxStudio from "@/components/flux/FluxStudio";
import { DEFAULT_PRESET_ID, QUALITY_LEVELS, getPreset } from "@/lib/fluid";

export default function FluxPage() {
  const handle = useRef<FluxCanvasHandle | null>(null);
  const [background, setBackground] = useState<string | null>(null);

  const initial = useMemo(
    () => ({
      ...getPreset(DEFAULT_PRESET_ID).config,
      ...QUALITY_LEVELS[2].config,
    }),
    []
  );

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <div className="absolute inset-0">
        <FluxCanvas ref={handle} config={initial} backgroundImage={background} />
      </div>

      <header className="pointer-events-none absolute left-0 top-0 z-10 max-w-sm p-6 md:p-10">
        <p className="eyebrow text-[0.5625rem] text-gold/70">MI4 Inc.</p>
        <h1 className="display mt-5 text-[clamp(2rem,4vw,3rem)] leading-none text-bone">
          4IM/Flux
        </h1>
        <p className="mt-4 text-[0.9375rem] italic leading-relaxed text-mist/80">
          A real-time GPU fluid playground.
        </p>
      </header>

      <FluxStudio handle={handle} onBackgroundChange={setBackground} />
    </main>
  );
}
