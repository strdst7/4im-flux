/**
 * Turns Pavel Dobryakov's upstream script.js (MIT) into a reusable ES module
 * factory, keeping the WebGL solver itself byte-faithful to upstream.
 */
import fs from 'node:fs';

const SRC = '/home/user/fluid-src/script.js';
const OUT = '/home/user/aimirah/src/lib/fluid/fluid.core.js';

let src = fs.readFileSync(SRC, 'utf8');
const die = m => { console.error('TRANSFORM FAILED: ' + m); process.exit(1); };
const cut = (from, to, label) => {
  const a = src.indexOf(from);
  const b = src.indexOf(to);
  if (a < 0 || b < 0 || b <= a) die(label);
  src = src.slice(0, a) + src.slice(b);
};
const sub = (needle, repl, label) => {
  if (!src.includes(needle)) die(label || needle.slice(0, 60));
  src = src.replace(needle, repl);
};

/* ---------------------------------------------------------------- 1. strip the demo page bootstrap */
cut('// Mobile promo section', '// Simulation section', 'promo block');
sub("const canvas = document.getElementsByTagName('canvas')[0];\nresizeCanvas();\n", '');
sub('\nstartGUI();\n', '\n');

cut('function startGUI () {', 'function isMobile () {', 'startGUI definition');
cut("canvas.addEventListener('mousedown'", 'function updatePointerDownData', 'event listeners');

sub(
  `updateKeywords();
initFramebuffers();
multipleSplats(parseInt(Math.random() * 20) + 5);

let lastUpdateTime = Date.now();
let colorUpdateTimer = 0.0;
update();
`,
  `let lastUpdateTime = Date.now();
let colorUpdateTimer = 0.0;
let animationId = null;
let autoSplatTimer = 0;
let resizePending = true;
`
);

/* ---------------------------------------------------------------- 2. upstream analytics + WebGL2 flag */
sub(
  `    ga('send', 'event', isWebGL2 ? 'webgl2' : 'webgl', formatRGBA == null ? 'not supported' : 'supported');\n\n`,
  ''
);
sub(`    return {\n        gl,\n        ext: {`, `    return {\n        gl,\n        isWebGL2,\n        ext: {`);
sub('const { gl, ext } = getWebGLContext(canvas);', 'const { gl, ext, isWebGL2 } = getWebGLContext(canvas);');

/* ---------------------------------------------------------------- 3. mobile defaults must not clobber user config */
sub(
  `if (isMobile()) {
    config.DYE_RESOLUTION = 512;
}`,
  `if (isMobile() && initialConfig.DYE_RESOLUTION == null) {
    config.DYE_RESOLUTION = 512;
}`
);

/* ---------------------------------------------------------------- 4. config: merge + new options */
sub(
  `let config = {`,
  `let config = Object.assign({`
);
sub(
  `    SUNRAYS_WEIGHT: 1.0,
}`,
  `        SUNRAYS_WEIGHT: 1.0,

        // ---- added for the Aimirah build ----
        PARTICLES: false,          // thousands of particles riding the velocity field
        PARTICLE_COUNT: 16384,     // rounded to the nearest square texture
        PARTICLE_SIZE: 1.6,
        PARTICLE_LIFE: 5.0,
        PARTICLE_SPEED: 1.0,
        PARTICLE_FADE: 0.9,
        PARTICLE_COLORFUL: true,   // tint by the dye they are swimming in
        PARTICLE_COLOR: { r: 0.78, g: 0.66, b: 0.42 },

        COLOR_HUE_MIN: 0.0,        // narrow these to lock the fluid to a palette
        COLOR_HUE_MAX: 1.0,
        COLOR_SATURATION: 1.0,
        COLOR_VALUE: 1.0,

        AUTO_SPLATS: 0,            // seconds between gentle ambient splats (0 = off)
        MAX_PIXEL_RATIO: 2,        // cap the drawing buffer; 1.5 is plenty for a backdrop
    }, initialConfig || {});`
);

/* ------------------------------------------------ 5b. palette-aware colour generation */
sub(
  `function generateColor () {
    let c = HSVtoRGB(Math.random(), 1.0, 1.0);`,
  `function generateColor () {
    let hue = config.COLOR_HUE_MIN + Math.random() * (config.COLOR_HUE_MAX - config.COLOR_HUE_MIN);
    hue = hue - Math.floor(hue);
    let c = HSVtoRGB(hue, config.COLOR_SATURATION, config.COLOR_VALUE);`
);

/* ---------------------------------------------------------------- 5. quad buffers need to be re-bindable after particles draw */
sub(
  `const blit = (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());`,
  `let quadBuffer = null;
let quadIndexBuffer = null;

function bindQuad () {
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
}

const blit = (() => {
    quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);`
);
sub(
  `    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());`,
  `    quadIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer);`
);

/* ---------------------------------------------------------------- 6. procedural dither texture (no network fetch) */
sub(
  `let ditheringTexture = createTextureAsync('LDR_LLL1_0.png');`,
  `let ditheringTexture = createDitherTexture();`
);

/* ---------------------------------------------------------------- 7. frame loop: particles + explicit control */
sub(
  `function update () {
    const dt = calcDeltaTime();
    if (resizeCanvas())
        initFramebuffers();
    updateColors(dt);
    applyInputs();
    if (!config.PAUSED)
        step(dt);
    render(null);
    requestAnimationFrame(update);
}`,
  `function update () {
    const dt = calcDeltaTime();
    if (resizePending) {
        if (resizeCanvas())
            initFramebuffers();
        resizePending = false;
    }
    updateColors(dt);
    applyInputs();
    if (!config.PAUSED) {
        step(dt);
        if (config.PARTICLES)
            simulateParticles(dt);

        if (config.AUTO_SPLATS > 0) {
            autoSplatTimer += dt;
            if (autoSplatTimer >= config.AUTO_SPLATS) {
                autoSplatTimer = 0;
                const color = generateColor();
                splat(
                    Math.random(),
                    Math.random(),
                    1000 * (Math.random() - 0.5),
                    1000 * (Math.random() - 0.5),
                    color
                );
            }
        }
    }
    render(null);
    if (config.PARTICLES)
        drawParticles(null);
    animationId = requestAnimationFrame(update);
}`
);

/* ---------------------------------------------------------------- 8. wrap in a factory and append the new API */
const HEADER_END = "'use strict';\n";
const headerEnd = src.indexOf(HEADER_END);
if (headerEnd < 0) die('use strict');
src = src.slice(0, headerEnd + HEADER_END.length) + '\n' + src.slice(headerEnd + HEADER_END.length);

src = src.replace(
  /\n'?use strict';?\n/,
  `\n'use strict';\n\nexport function createFluidSimulation (canvas, initialConfig = {}) {\n`
);

const api = `
    /* ===================================================================
       Particles — GPGPU points advected by the fluid's velocity field.
       State lives in a float texture: xy = position (uv), z = age, w = seed.
       =================================================================== */

    let particleFBO = null;
    let particleProgram = null;
    let particleDrawProgram = null;
    let particleIndexBuffer = null;
    let particleIndexCount = 0;
    let particleTexSize = 0;
    let particleSupported = false;
    let particleTime = 0;
    let particleAttrib = -1;

    const particleUpdateShader = compileShader(gl.FRAGMENT_SHADER, \`
        precision highp float;
        precision highp sampler2D;

        uniform sampler2D uParticles;
        uniform sampler2D uVelocity;
        uniform float uDt;
        uniform float uTime;
        uniform float uLife;
        uniform float uSpeed;
        uniform vec2  uTexel;

        varying vec2 vUv;

        float hash (vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        void main () {
            vec4 s = texture2D(uParticles, vUv);
            vec2 pos = s.xy;
            float age = s.z;
            float seed = s.w;

            vec2 vel = texture2D(uVelocity, pos).xy;
            pos += vel * uTexel * uDt * uSpeed * 60.0;
            age += uDt;

            bool dead = age > uLife || pos.x < -0.03 || pos.x > 1.03 || pos.y < -0.03 || pos.y > 1.03;
            if (dead) {
                float n1 = hash(vec2(seed, uTime));
                float n2 = hash(vec2(seed + 1.7, uTime + 3.13));
                pos = vec2(n1, n2);
                age = 0.0;
                seed = fract(seed + 0.6180339887498951);
            }

            gl_FragColor = vec4(pos, age, seed);
        }
    \`);

    const particleDrawVertexShader = compileShader(gl.VERTEX_SHADER, \`
        precision highp float;

        attribute float aIndex;

        uniform sampler2D uParticles;
        uniform float uTexSize;
        uniform float uSize;
        uniform float uLife;
        uniform float uPixelRatio;

        varying float vAlpha;
        varying vec2  vPos;

        void main () {
            float x = mod(aIndex, uTexSize);
            float y = floor(aIndex / uTexSize);
            vec2 uv = (vec2(x, y) + 0.5) / uTexSize;

            vec4 s = texture2D(uParticles, uv);
            vPos = s.xy;

            float t = clamp(s.z / max(uLife, 0.0001), 0.0, 1.0);
            vAlpha = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.55, 1.0, t));

            gl_Position = vec4(s.xy * 2.0 - 1.0, 0.0, 1.0);
            gl_PointSize = max(1.0, uSize * uPixelRatio);
        }
    \`);

    const particleDrawShader = compileShader(gl.FRAGMENT_SHADER, \`
        precision highp float;

        uniform sampler2D uDye;
        uniform vec3 uColor;
        uniform float uColorful;
        uniform float uFade;

        varying float vAlpha;
        varying vec2  vPos;

        void main () {
            vec2 c = gl_PointCoord - 0.5;
            float d = dot(c, c);
            if (d > 0.25) discard;

            float soft = 1.0 - smoothstep(0.0, 0.25, d);
            vec3 dye = texture2D(uDye, vPos).rgb;
            vec3 col = mix(uColor, dye + uColor * 0.35, uColorful);

            float a = vAlpha * soft * uFade;
            gl_FragColor = vec4(col * a, a);
        }
    \`);

    function getParticleFormat () {
        let rgba = isWebGL2 ? gl.RGBA32F : gl.RGBA;
        let f = getSupportedFormat(gl, rgba, gl.RGBA, gl.FLOAT);
        if (f) return { internalFormat: f.internalFormat, format: f.format, texType: gl.FLOAT, half: false };

        let half = isWebGL2 ? gl.RGBA16F : gl.RGBA;
        let h = getSupportedFormat(gl, half, gl.RGBA, ext.halfFloatTexType);
        if (h) return { internalFormat: h.internalFormat, format: h.format, texType: ext.halfFloatTexType, half: true };

        return null;
    }

    function toHalf (val) {
        // minimal float32 -> float16 conversion, enough for seeding a uv texture
        const floatView = new Float32Array(1);
        const int32View = new Int32Array(floatView.buffer);
        floatView[0] = val;
        const x = int32View[0];
        let bits = (x >> 16) & 0x8000;
        let m = (x >> 12) & 0x07ff;
        const e = (x >> 23) & 0xff;
        if (e < 103) return bits;
        if (e > 142) { bits |= 0x7c00; bits |= (e == 255) ? 0 : 1; return bits; }
        if (e < 113) { m |= 0x0800; bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1); return bits; }
        bits |= ((e - 112) << 10) | (m >> 1);
        bits += m & 1;
        return bits;
    }

    function initParticles (force) {
        const count = Math.max(1024, Math.min(65536, Math.round(config.PARTICLE_COUNT || 16384)));
        const size = Math.max(8, Math.round(Math.sqrt(count)));
        if (particleFBO != null && particleTexSize === size && !force) return;

        particleTexSize = size;
        particleIndexCount = size * size;

        const fmt = getParticleFormat();
        particleSupported = fmt != null;
        if (!particleSupported) {
            if (force) console.warn('[fluid] particles disabled: no renderable float texture on this device');
            return;
        }

        particleFBO = createDoubleFBO(
            size, size, fmt.internalFormat, fmt.format, fmt.texType, gl.NEAREST
        );

        const raw = new Float32Array(particleIndexCount * 4);
        for (let i = 0; i < particleIndexCount; i++) {
            raw[i * 4 + 0] = Math.random();
            raw[i * 4 + 1] = Math.random();
            raw[i * 4 + 2] = Math.random() * config.PARTICLE_LIFE;
            raw[i * 4 + 3] = Math.random();
        }
        const payload = fmt.half
            ? Uint16Array.from(Array.prototype.map.call(raw, toHalf))
            : raw;

        [particleFBO.read.texture, particleFBO.write.texture].forEach(texture => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internalFormat, size, size, 0, fmt.format, fmt.texType, payload);
        });

        if (particleProgram == null) {
            particleProgram = new Program(baseVertexShader, particleUpdateShader);
            particleDrawProgram = new Program(particleDrawVertexShader, particleDrawShader);
            particleAttrib = gl.getAttribLocation(particleDrawProgram.program, 'aIndex');
        }

        if (particleIndexBuffer == null) particleIndexBuffer = gl.createBuffer();
        const indices = new Float32Array(particleIndexCount);
        for (let i = 0; i < particleIndexCount; i++) indices[i] = i;
        gl.bindBuffer(gl.ARRAY_BUFFER, particleIndexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        bindQuad();
    }

    function simulateParticles (dt) {
        if (!particleSupported) return;
        if (particleFBO == null) initParticles();

        particleTime += dt;
        particleProgram.bind();
        gl.uniform1i(particleProgram.uniforms.uParticles, particleFBO.read.attach(0));
        gl.uniform1i(particleProgram.uniforms.uVelocity, velocity.read.attach(1));
        gl.uniform1f(particleProgram.uniforms.uDt, Math.min(dt, 1 / 60));
        gl.uniform1f(particleProgram.uniforms.uTime, particleTime);
        gl.uniform1f(particleProgram.uniforms.uLife, config.PARTICLE_LIFE);
        gl.uniform1f(particleProgram.uniforms.uSpeed, config.PARTICLE_SPEED);
        gl.uniform2f(particleProgram.uniforms.uTexel, velocity.texelSizeX, velocity.texelSizeY);
        blit(particleFBO.write);
        particleFBO.swap();
    }

    function drawParticles (target) {
        if (!particleSupported || particleFBO == null) return;

        const width = target == null ? gl.drawingBufferWidth : target.width;
        const height = target == null ? gl.drawingBufferHeight : target.height;

        gl.viewport(0, 0, width, height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target == null ? null : target.fbo);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        particleDrawProgram.bind();
        gl.uniform1i(particleDrawProgram.uniforms.uParticles, particleFBO.read.attach(0));
        gl.uniform1i(particleDrawProgram.uniforms.uDye, dye.read.attach(1));
        gl.uniform1f(particleDrawProgram.uniforms.uSize, Math.max(0.5, config.PARTICLE_SIZE));
        gl.uniform1f(particleDrawProgram.uniforms.uTexSize, particleTexSize);
        gl.uniform1f(particleDrawProgram.uniforms.uLife, config.PARTICLE_LIFE);
        gl.uniform1f(particleDrawProgram.uniforms.uFade, config.PARTICLE_FADE);
        gl.uniform1f(particleDrawProgram.uniforms.uPixelRatio, window.devicePixelRatio || 1);
        gl.uniform1f(particleDrawProgram.uniforms.uColorful, config.PARTICLE_COLORFUL ? 1.0 : 0.0);
        gl.uniform3f(
            particleDrawProgram.uniforms.uColor,
            config.PARTICLE_COLOR.r, config.PARTICLE_COLOR.g, config.PARTICLE_COLOR.b
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, particleIndexBuffer);
        gl.enableVertexAttribArray(particleAttrib);
        gl.vertexAttribPointer(particleAttrib, 1, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, particleIndexCount);
        gl.disableVertexAttribArray(particleAttrib);

        gl.disable(gl.BLEND);
        bindQuad();
    }

    /* ===================================================================
       Dither texture, generated instead of fetched
       =================================================================== */

    function createDitherTexture () {
        const size = 64;
        const data = new Uint8Array(size * size * 4);
        for (let i = 0; i < size * size; i++) {
            const v = (Math.random() * 256) | 0;
            data[i * 4 + 0] = v;
            data[i * 4 + 1] = v;
            data[i * 4 + 2] = v;
            data[i * 4 + 3] = 255;
        }
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        return { texture, width: size, height: size, attach (id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; } };
    }

    /* ===================================================================
       Pointer input (multitouch aware)
       =================================================================== */

    function findPointer (id) {
        return pointers.find(p => p.id === id);
    }

    // posX / posY arrive in CSS pixels; upstream expects device pixels.
    function pointerDown (id, posX, posY) {
        let p = findPointer(id);
        if (p == null) { p = new pointerPrototype(); pointers.push(p); }
        updatePointerDownData(p, id, scaleByPixelRatio(posX), scaleByPixelRatio(posY));
    }

    function pointerMove (id, posX, posY) {
        const p = findPointer(id);
        if (p == null || !p.down) return;
        updatePointerMoveData(p, scaleByPixelRatio(posX), scaleByPixelRatio(posY));
    }

    function pointerUp (id) {
        const p = findPointer(id);
        if (p == null) return;
        updatePointerUpData(p);
    }

    function randomSplats (amount) {
        splatStack.push(amount == null ? parseInt(Math.random() * 20) + 5 : amount);
    }

    /** Wipe dye and velocity so a new preset reads cleanly. */
    function clearField () {
        clearProgram.bind();
        gl.uniform1i(clearProgram.uniforms.uTexture, dye.read.attach(0));
        gl.uniform1f(clearProgram.uniforms.value, 0.0);
        blit(dye.write);
        dye.swap();

        gl.uniform1i(clearProgram.uniforms.uTexture, velocity.read.attach(0));
        gl.uniform1f(clearProgram.uniforms.value, 0.0);
        blit(velocity.write);
        velocity.swap();
    }

    /* ===================================================================
       Images: as a fluid source (splats coloured by pixels)
       =================================================================== */

    function imageSplats (image, options = {}) {
        const density = Math.max(8, Math.min(96, options.density || 40));
        const force = options.force == null ? 2600 : options.force;
        const brightness = options.brightness == null ? 8 : options.brightness;

        const c = document.createElement('canvas');
        const w = c.width = density;
        const h = c.height = Math.max(1, Math.round(density * (image.height / image.width)));
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const a = data[i + 3] / 255;
                if (a < 0.12) continue;
                const px = (x + 0.5) / w;
                const py = 1.0 - (y + 0.5) / h;
                const dx = (Math.random() - 0.5) * force;
                const dy = (Math.random() - 0.5) * force;
                splat(px, py, dx, dy, {
                    r: (data[i] / 255) * brightness * a,
                    g: (data[i + 1] / 255) * brightness * a,
                    b: (data[i + 2] / 255) * brightness * a
                });
            }
        }
    }

    /* ===================================================================
       Capture: stills and video
       =================================================================== */

    function screenshotDataURL (resolution) {
        const res = getResolution(resolution == null ? config.CAPTURE_RESOLUTION : resolution);
        const target = createFBO(
            res.width, res.height,
            ext.formatRGBA.internalFormat, ext.formatRGBA.format, ext.halfFloatTexType, gl.NEAREST
        );
        render(target);
        if (config.PARTICLES) drawParticles(target);

        let texture = framebufferToTexture(target);
        texture = normalizeTexture(texture, target.width, target.height);
        const captureCanvas = textureToCanvas(texture, target.width, target.height);

        gl.deleteFramebuffer(target.fbo);
        gl.deleteTexture(target.texture);
        bindQuad();

        return captureCanvas.toDataURL('image/png');
    }

    function screenshot (resolution) {
        downloadURI('fluid-' + Date.now() + '.png', screenshotDataURL(resolution));
    }

    let mediaRecorder = null;
    let recordingChunks = [];

    function isRecording () {
        return mediaRecorder != null && mediaRecorder.state === 'recording';
    }

    function startRecording (options = {}) {
        if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') return false;
        if (isRecording()) return true;

        const stream = canvas.captureStream(options.fps || 60);
        const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
        const mimeType = candidates.find(t => MediaRecorder.isTypeSupported(t)) || '';

        try {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType || undefined,
                videoBitsPerSecond: options.videoBitsPerSecond || 16000000
            });
        } catch (e) {
            mediaRecorder = null;
            return false;
        }

        recordingChunks = [];
        mediaRecorder.ondataavailable = e => { if (e.data && e.data.size) recordingChunks.push(e.data); };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordingChunks, { type: 'video/webm' });
            recordingChunks = [];
            const url = URL.createObjectURL(blob);
            if (options.onStop) options.onStop(url);
            else downloadURI('fluid-' + Date.now() + '.webm', url);
        };
        mediaRecorder.start(1000);
        return true;
    }

    function stopRecording () {
        if (mediaRecorder != null && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    }

    /* ===================================================================
       Lifecycle
       =================================================================== */

    function start () {
        if (animationId == null) {
            lastUpdateTime = Date.now();
            animationId = requestAnimationFrame(update);
        }
    }

    function stop () {
        if (animationId != null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function setConfig (patch) {
        if (patch == null) return;

        const resizeNeeded =
            ('SIM_RESOLUTION' in patch && patch.SIM_RESOLUTION !== config.SIM_RESOLUTION) ||
            ('DYE_RESOLUTION' in patch && patch.DYE_RESOLUTION !== config.DYE_RESOLUTION);

        const keywordsNeeded = ['SHADING', 'BLOOM', 'SUNRAYS'].some(k => k in patch);
        const particlesNeeded = 'PARTICLE_COUNT' in patch || ('PARTICLES' in patch && patch.PARTICLES && particleFBO == null);

        Object.assign(config, patch);

        if (keywordsNeeded) updateKeywords();
        if (resizeNeeded) initFramebuffers();
        if ('BLOOM' in patch && !resizeNeeded) initBloomFramebuffers();
        if ('SUNRAYS' in patch && !resizeNeeded) initSunraysFramebuffers();
        if (particlesNeeded) initParticles(true);
    }

    function resize () {
        resizePending = true;
        if (animationId == null) {
            if (resizeCanvas()) initFramebuffers();
            resizePending = false;
        }
    }

    function dispose () {
        stop();
        if (isRecording()) stopRecording();

        // Deliberately NOT calling WEBGL_lose_context: React may remount onto the same
        // canvas (StrictMode, fast refresh), and getContext() would then hand back the
        // lost context, leaving every format check failing on the second mount.
        const drop = fbo => {
            if (fbo == null) return;
            gl.deleteFramebuffer(fbo.fbo);
            gl.deleteTexture(fbo.texture);
        };
        const dropDouble = fbo => {
            if (fbo == null) return;
            drop(fbo.read);
            drop(fbo.write);
        };
        dropDouble(dye);
        dropDouble(velocity);
        dropDouble(pressure);
        drop(divergence);
        drop(curl);
        drop(sunrays);
        drop(sunraysTemp);
        dropDouble(particleFBO);
        bloomFramebuffers.forEach(drop);
        bloomFramebuffers = [];
    }

    function fluidInfo () {
        return {
            webgl2: isWebGL2,
            linearFiltering: ext.supportLinearFiltering,
            particlesSupported: particleSupported,
            particles: particleIndexCount,
            sim: { width: velocity ? velocity.width : 0, height: velocity ? velocity.height : 0 },
            dye: { width: dye ? dye.width : 0, height: dye ? dye.height : 0 }
        };
    }

    /* ---- boot ---- */
    resizeCanvas();
    updateKeywords();
    initFramebuffers();
    initParticles();
    randomSplats(5);

    return {
        canvas,
        gl,
        get config () { return config; },
        start,
        stop,
        resize,
        dispose,
        setConfig,
        randomSplats,
        clearField,
        splat,
        imageSplats,
        pointerDown,
        pointerMove,
        pointerUp,
        screenshot,
        screenshotDataURL,
        startRecording,
        stopRecording,
        isRecording,
        fluidInfo
    };
}
`;

src = src.trimEnd() + '\n' + api;

fs.mkdirSync('/home/user/aimirah/src/lib/fluid', { recursive: true });
fs.writeFileSync(OUT, src);
console.log('wrote', OUT, src.split('\n').length, 'lines');
