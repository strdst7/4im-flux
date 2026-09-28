"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  createFluidSimulation,
  type FluidConfig,
  type FluidSimulation,
  type ImageSplatOptions,
  type RecordingOptions,
} from "@/lib/fluid";

export type FluxCanvasHandle = {
  sim: () => FluidSimulation | null;
  setConfig: (patch: Partial<FluidConfig>) => void;
  randomSplats: (amount?: number) => void;
  clear: () => void;
  imageSplats: (image: CanvasImageSource, options?: ImageSplatOptions) => void;
  screenshot: (resolution?: number) => void;
  screenshotDataURL: (resolution?: number) => string | null;
  startRecording: (options?: RecordingOptions) => boolean;
  stopRecording: () => void;
  isRecording: () => boolean;
  info: () => ReturnType<FluidSimulation["fluidInfo"]> | null;
};

type FluxCanvasProps = {
  /** Applied once on mount; use the handle for changes afterwards. */
  config?: Partial<FluidConfig>;
  className?: string;
  interactive?: boolean;
  /** Sits behind the canvas; forces the canvas transparent. */
  backgroundImage?: string | null;
  /** Park the solver whenever the canvas leaves the viewport. Default true. */
  pauseWhenOffscreen?: boolean;
  /** Drop internal quality if the solver cannot hold ~30fps. Default false. */
  adaptiveQuality?: boolean;
  onReady?: (sim: FluidSimulation) => void;
};

/* Steps the adaptive guard takes when frames are consistently slow. */
const DEGRADE_STEPS: Partial<FluidConfig>[] = [
  { DYE_RESOLUTION: 256, SUNRAYS: false, PARTICLE_COUNT: 4096, MAX_PIXEL_RATIO: 1 },
  { BLOOM: false, PRESSURE_ITERATIONS: 12, PARTICLE_COUNT: 2048, SHADING: false },
];

const FluxCanvas = forwardRef<FluxCanvasHandle, FluxCanvasProps>(function FluxCanvas(
  {
    config,
    className = "",
    interactive = true,
    backgroundImage = null,
    pauseWhenOffscreen = true,
    adaptiveQuality = false,
    onReady,
  },
  ref
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<FluidSimulation | null>(null);
  const [failed, setFailed] = useState(false);
  const [degradeStep, setDegradeStep] = useState(0);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;


  const running = onScreen && tabVisible;
  const runningRef = useRef(true);
  runningRef.current = running;
  const degradeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null) return;
    setFailed(false);

    const initial: Partial<FluidConfig> = {
      ...(config || {}),
      ...(backgroundImage ? { TRANSPARENT: true } : {}),
    };

    let sim: FluidSimulation | null = null;
    try {
      sim = createFluidSimulation(canvas, initial);
    } catch (error) {
      console.error("[4IM/Flux] failed to initialise", error);
      setFailed(true);
      return;
    }

    simRef.current = sim;
    onReadyRef.current?.(sim);

    const observer = new ResizeObserver(() => sim?.resize());
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      sim?.dispose();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Park the solver when the canvas is scrolled past: on a page that already
     runs several WebGL contexts this is what keeps the frame budget free. */
  useEffect(() => {
    const el = wrapRef.current;
    if (el == null || !pauseWhenOffscreen) {
      setOnScreen(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => setOnScreen(entries.some(entry => entry.isIntersecting)),
      { rootMargin: "150px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pauseWhenOffscreen]);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const sim = simRef.current;
    if (sim == null) return;
    if (running) sim.start();
    else sim.stop();
  }, [running]);

  useEffect(() => {
    const sim = simRef.current;
    if (sim == null || degradeStep === 0) return;
    for (let i = 0; i < degradeStep; i++) sim.setConfig(DEGRADE_STEPS[i]);
  }, [degradeStep]);

  useEffect(() => {
    if (backgroundImage == null) return;
    simRef.current?.setConfig({ TRANSPARENT: true });
  }, [backgroundImage]);

  /* Shed work if the machine cannot hold a usable frame rate — two consecutive
     slow two-second windows before each step, and never in the studio, where
     quality is the operator's call. */
  useEffect(() => {
    if (!adaptiveQuality) return;

    let frames = 0;
    let windowStart = performance.now();
    let slowWindows = 0;
    let raf = 0;

    const tick = () => {
      frames += 1;
      const elapsed = performance.now() - windowStart;
      if (elapsed >= 2000) {
        const fps = (frames * 1000) / elapsed;
        frames = 0;
        windowStart = performance.now();

        if (runningRef.current) {
          slowWindows = fps < 30 ? slowWindows + 1 : 0;
          if (slowWindows >= 2) {
            slowWindows = 0;
            const next = Math.min(DEGRADE_STEPS.length, degradeRef.current + 1);
            if (next !== degradeRef.current) {
              degradeRef.current = next;
              console.info(
                `[4IM/Flux] holding ${fps.toFixed(0)}fps — dropping to quality step ${next}`
              );
              setDegradeStep(next);
            }
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [adaptiveQuality]);

  const toLocal = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      sim: () => simRef.current,
      setConfig: patch => simRef.current?.setConfig(patch),
      randomSplats: amount => simRef.current?.randomSplats(amount),
      clear: () => simRef.current?.clearField(),
      imageSplats: (image, options) => simRef.current?.imageSplats(image, options),
      screenshot: resolution => simRef.current?.screenshot(resolution),
      screenshotDataURL: resolution =>
        simRef.current ? simRef.current.screenshotDataURL(resolution) : null,
      startRecording: options =>
        simRef.current ? simRef.current.startRecording(options) : false,
      stopRecording: () => simRef.current?.stopRecording(),
      isRecording: () => (simRef.current ? simRef.current.isRecording() : false),
      info: () => (simRef.current ? simRef.current.fluidInfo() : null),
    }),
    []
  );

  return (
    <div ref={wrapRef} className={`relative h-full w-full overflow-hidden ${className}`}>
      {backgroundImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      <canvas
        ref={canvasRef}
        className="relative block h-full w-full"
        style={{ touchAction: "none" }}
        onPointerDown={
          interactive
            ? e => {
                const { x, y } = toLocal(e);
                e.currentTarget.setPointerCapture?.(e.pointerId);
                simRef.current?.pointerDown(e.pointerId, x, y);
              }
            : undefined
        }
        onPointerMove={
          interactive
            ? e => {
                const { x, y } = toLocal(e);
                simRef.current?.pointerMove(e.pointerId, x, y);
              }
            : undefined
        }
        onPointerUp={interactive ? e => simRef.current?.pointerUp(e.pointerId) : undefined}
        onPointerCancel={interactive ? e => simRef.current?.pointerUp(e.pointerId) : undefined}
        onPointerLeave={interactive ? e => simRef.current?.pointerUp(e.pointerId) : undefined}
      />

      {failed ? (
        <div className="absolute inset-0 grid place-items-center bg-ink/80 px-8 text-center">
          <p className="max-w-sm text-sm leading-relaxed text-mist">
            This browser could not start the fluid solver — it needs WebGL with renderable
            floating-point textures. Everything else on the page still works.
          </p>
        </div>
      ) : null}
    </div>
  );
});

export default FluxCanvas;
