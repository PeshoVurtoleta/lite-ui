/**
 * @zakkster/lite-ui — Micro-Interaction & Reveal Library
 *
 * Lightweight GSAP ScrollTrigger / Framer Motion alternative.
 *
 * Composes:
 *   @zakkster/lite-smart-observer (scroll reveals)
 *   @zakkster/lite-lerp           (math primitives)
 *   @zakkster/lite-color          (OKLCH transitions)
 *   @zakkster/lite-particles      (UI particle effects — confetti, sparkles)
 *
 * Modules:
 *   ScrollReveal   — Factory presets for SmartObserver
 *   Parallax       — Scroll-driven displacement
 *   Magnetic       — Cursor-attracted hover physics
 *   Spring         — Damped spring animation primitive
 *   ScrollProgress — Track scroll as 0–1
 *   Tilt           — 3D perspective tilt on hover
 *   ColorShift     — Scroll/hover-driven OKLCH color transitions
 *   ConfettiBurst  — Object-pool confetti on click/trigger
 *   SparkleHover   — Particle sparkles on hover
 *   destroyAll     — Clean teardown helper for SPA frameworks
 */

import SmartObserver from '@zakkster/lite-smart-observer';
import { lerp, damp, clamp, inverseLerp, smoothstep, easeOut } from '@zakkster/lite-lerp';
import { lerpOklch, toCssOklch } from '@zakkster/lite-color';
import { Emitter } from '@zakkster/lite-particles';

export { SmartObserver };


// ═══════════════════════════════════════════════════════════
//  SCROLL REVEAL — Factory presets
// ═══════════════════════════════════════════════════════════

export const ScrollReveal = {
    fadeUp(selector, options = {}) {
        const so = new SmartObserver({ mode: 'y', y: 40, stagger: 0.08, duration: 0.6, ease: 'power2.out', ...options });
        so.observe(selector);
        return so;
    },
    fadeIn(selector, direction = 'left', options = {}) {
        const isX = direction === 'left' || direction === 'right';
        const dist = direction === 'left' ? -40 : direction === 'right' ? 40 : direction === 'up' ? -40 : 40;
        const so = new SmartObserver({ mode: isX ? 'x' : 'y', x: isX ? dist : 0, y: isX ? 0 : dist, stagger: 0.06, duration: 0.5, ease: 'power3.out', ...options });
        so.observe(selector);
        return so;
    },
    scaleIn(selector, options = {}) {
        const so = new SmartObserver({ mode: 'scale', scale: 0.85, stagger: 0.06, duration: 0.5, ease: 'back.out', ...options });
        so.observe(selector);
        return so;
    },
    fade(selector, options = {}) {
        const so = new SmartObserver({ mode: 'fade', stagger: 0.05, duration: 0.4, ease: 'ease', ...options });
        so.observe(selector);
        return so;
    },
    cascade(selector, options = {}) {
        const so = new SmartObserver({ mode: 'y', y: 50, stagger: 0.15, duration: 0.8, delay: 0.2, ease: 'expo.out', ...options });
        so.observe(selector);
        return so;
    },
};


// ═══════════════════════════════════════════════════════════
//  PARALLAX
// ═══════════════════════════════════════════════════════════

export class Parallax {
    constructor(element, { speed = 0.5, direction = 'y', smooth = true } = {}) {
        this.el = typeof element === 'string' ? document.querySelector(element) : element;
        this.speed = speed;
        this.direction = direction;
        this._destroyed = false;
        this._ac = new AbortController();

        if (smooth) this.el.style.willChange = 'transform';
        this._onScroll = this._onScroll.bind(this);
        window.addEventListener('scroll', this._onScroll, { passive: true, signal: this._ac.signal });
        this._onScroll();
    }

    _onScroll() {
        if (this._destroyed) return;
        const rect = this.el.getBoundingClientRect();
        const viewH = window.innerHeight;
        const progress = clamp(1 - (rect.top / viewH), 0, 2);
        const offset = (progress - 0.5) * this.speed * 100;
        this.el.style.transform = this.direction === 'x'
            ? `translate3d(${offset}px, 0, 0)`
            : `translate3d(0, ${offset}px, 0)`;
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        this._ac.abort();
        this.el.style.willChange = '';
        this.el.style.transform = '';
    }
}


// ═══════════════════════════════════════════════════════════
//  MAGNETIC — Cursor-attracted hover physics
// ═══════════════════════════════════════════════════════════

export class Magnetic {
    constructor(element, { strength = 0.3, smoothing = 0.15, maxDistance = 100, scale = false } = {}) {
        this.el = typeof element === 'string' ? document.querySelector(element) : element;
        this.strength = strength;
        this.smoothing = smoothing;
        this.maxDistance = maxDistance;
        this.scale = scale;
        this._destroyed = false;
        this._ac = new AbortController();
        this._x = 0; this._y = 0; this._targetX = 0; this._targetY = 0;
        this._isHovering = false;
        this._rafId = null;

        this.el.style.willChange = 'transform';
        const signal = this._ac.signal;

        this.el.addEventListener('mouseenter', () => { this._isHovering = true; this._startLoop(); }, { signal });
        this.el.addEventListener('mousemove', (e) => {
            if (!this._isHovering) return;
            const rect = this.el.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.maxDistance) { this._targetX = 0; this._targetY = 0; }
            else { this._targetX = dx * this.strength; this._targetY = dy * this.strength; }
        }, { signal });
        this.el.addEventListener('mouseleave', () => { this._isHovering = false; this._targetX = 0; this._targetY = 0; }, { signal });
    }

    _startLoop() {
        if (this._rafId) return;
        const loop = () => {
            this._x = lerp(this._x, this._targetX, this.smoothing);
            this._y = lerp(this._y, this._targetY, this.smoothing);
            const s = this.scale && this._isHovering ? 1.05 : 1;
            // Avoid toFixed — use Math.round to prevent string allocations
            const rx = Math.round(this._x * 100) / 100;
            const ry = Math.round(this._y * 100) / 100;
            this.el.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${s})`;

            const settled = Math.abs(this._x - this._targetX) < 0.1 && Math.abs(this._y - this._targetY) < 0.1;
            if (settled && !this._isHovering) {
                this.el.style.transform = '';
                this._x = 0; this._y = 0;
                this._rafId = null;
            } else {
                this._rafId = requestAnimationFrame(loop);
            }
        };
        this._rafId = requestAnimationFrame(loop);
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        this._ac.abort();
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this.el.style.willChange = '';
        this.el.style.transform = '';
    }
}


// ═══════════════════════════════════════════════════════════
//  SPRING — Physics-based animation primitive
// ═══════════════════════════════════════════════════════════

export class Spring {
    constructor(initial = 0, { stiffness = 170, damping = 26, mass = 1, precision = 0.01 } = {}) {
        this.value = initial;
        this.target = initial;
        this.velocity = 0;
        this.stiffness = stiffness;
        this.damping = damping;
        this.mass = mass;
        this.precision = precision;
        this.settled = true;
    }

    set(target) { this.target = target; this.settled = false; }

    update(dt) {
        if (this.settled) return this.value;
        dt = Math.min(dt, 0.064);
        const displacement = this.value - this.target;
        const springForce = -this.stiffness * displacement;
        const dampingForce = -this.damping * this.velocity;
        this.velocity += ((springForce + dampingForce) / this.mass) * dt;
        this.value += this.velocity * dt;
        if (Math.abs(this.velocity) < this.precision && Math.abs(displacement) < this.precision) {
            this.value = this.target; this.velocity = 0; this.settled = true;
        }
        return this.value;
    }

    snap(value) { this.value = value; this.target = value; this.velocity = 0; this.settled = true; }
}


// ═══════════════════════════════════════════════════════════
//  SCROLL PROGRESS
// ═══════════════════════════════════════════════════════════

export class ScrollProgress {
    constructor({ element, onChange, rootMargin = '0px' } = {}) {
        this._onChange = onChange || (() => {});
        this._element = element || null;
        this._destroyed = false;
        this._ac = new AbortController();
        this.progress = 0;
        this._onScroll = this._onScroll.bind(this);
        window.addEventListener('scroll', this._onScroll, { passive: true, signal: this._ac.signal });
        this._onScroll();
    }

    _onScroll() {
        if (this._destroyed) return;
        if (this._element) {
            const rect = this._element.getBoundingClientRect();
            this.progress = clamp(inverseLerp(window.innerHeight, -rect.height, rect.top), 0, 1);
        } else {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            this.progress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
        }
        this._onChange(this.progress);
    }

    destroy() { if (this._destroyed) return; this._destroyed = true; this._ac.abort(); }
}


// ═══════════════════════════════════════════════════════════
//  TILT — 3D perspective hover
// ═══════════════════════════════════════════════════════════

export class Tilt {
    constructor(element, { maxAngle = 15, perspective = 800, smoothing = 0.1, glare = false, scale = 1.02 } = {}) {
        this.el = typeof element === 'string' ? document.querySelector(element) : element;
        this.maxAngle = maxAngle;
        this.smoothing = smoothing;
        this.scale = scale;
        this._destroyed = false;
        this._ac = new AbortController();
        this._rx = 0; this._ry = 0; this._tx = 0; this._ty = 0;
        this._isHovering = false; this._rafId = null;

        this.el.style.transformStyle = 'preserve-3d';
        if (this.el.parentElement) this.el.parentElement.style.perspective = `${perspective}px`;
        this.el.style.willChange = 'transform';

        this._glare = null;
        if (glare) {
            this._glare = document.createElement('div');
            Object.assign(this._glare.style, {
                position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
                pointerEvents: 'none', opacity: '0', transition: 'opacity 0.3s',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 60%)',
                borderRadius: getComputedStyle(this.el).borderRadius,
            });
            this.el.style.position = this.el.style.position || 'relative';
            this.el.style.overflow = 'hidden';
            this.el.appendChild(this._glare);
        }

        const signal = this._ac.signal;
        this.el.addEventListener('mouseenter', () => {
            this._isHovering = true;
            if (this._glare) this._glare.style.opacity = '1';
            this._startLoop();
        }, { signal });
        this.el.addEventListener('mousemove', (e) => {
            const rect = this.el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            this._tx = (0.5 - y) * this.maxAngle * 2;
            this._ty = (x - 0.5) * this.maxAngle * 2;
            if (this._glare) {
                this._glare.style.background =
                    `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)`;
            }
        }, { signal });
        this.el.addEventListener('mouseleave', () => {
            this._isHovering = false; this._tx = 0; this._ty = 0;
            if (this._glare) this._glare.style.opacity = '0';
        }, { signal });
    }

    _startLoop() {
        if (this._rafId) return;
        const loop = () => {
            this._rx = lerp(this._rx, this._tx, this.smoothing);
            this._ry = lerp(this._ry, this._ty, this.smoothing);
            const s = this._isHovering ? this.scale : 1;
            const rx = Math.round(this._rx * 100) / 100;
            const ry = Math.round(this._ry * 100) / 100;
            this.el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale3d(${s},${s},${s})`;
            const settled = Math.abs(this._rx - this._tx) < 0.05 && Math.abs(this._ry - this._ty) < 0.05;
            if (settled && !this._isHovering) {
                this.el.style.transform = ''; this._rx = 0; this._ry = 0; this._rafId = null;
            } else {
                this._rafId = requestAnimationFrame(loop);
            }
        };
        this._rafId = requestAnimationFrame(loop);
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        this._ac.abort();
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this.el.style.willChange = ''; this.el.style.transform = ''; this.el.style.transformStyle = '';
        if (this._glare) { this._glare.remove(); this._glare = null; }
    }
}


// ═══════════════════════════════════════════════════════════
//  COLOR SHIFT — Scroll/hover OKLCH transitions
// ═══════════════════════════════════════════════════════════

export class ColorShift {
    constructor(element, { colors, property = 'backgroundColor', trigger = 'scroll', ease } = {}) {
        this.el = typeof element === 'string' ? document.querySelector(element) : element;
        this._destroyed = false;
        this._ac = new AbortController();
        this._rafId = null;

        this._sampler = (t) => {
            if (colors.length === 1) return colors[0];
            const clamped = clamp(ease ? ease(t) : t, 0, 1);
            const scaled = clamped * (colors.length - 1);
            const idx = Math.min(Math.floor(scaled), colors.length - 2);
            return lerpOklch(colors[idx], colors[idx + 1], scaled - idx);
        };

        if (trigger === 'scroll') {
            this._scrollHandler = () => {
                if (this._destroyed) return;
                const rect = this.el.getBoundingClientRect();
                const t = clamp(inverseLerp(window.innerHeight, -rect.height, rect.top), 0, 1);
                this.el.style[property] = toCssOklch(this._sampler(t));
            };
            window.addEventListener('scroll', this._scrollHandler, { passive: true, signal: this._ac.signal });
            this._scrollHandler();
        } else if (trigger === 'hover') {
            this._hoverT = 0; this._hoverTarget = 0;
            this.el.addEventListener('mouseenter', () => { this._hoverTarget = 1; this._startHoverLoop(property); }, { signal: this._ac.signal });
            this.el.addEventListener('mouseleave', () => { this._hoverTarget = 0; this._startHoverLoop(property); }, { signal: this._ac.signal });
        }
    }

    _startHoverLoop(property) {
        if (this._rafId) return;
        const loop = () => {
            this._hoverT = lerp(this._hoverT, this._hoverTarget, 0.08);
            this.el.style[property] = toCssOklch(this._sampler(this._hoverT));
            if (Math.abs(this._hoverT - this._hoverTarget) < 0.005) {
                this._hoverT = this._hoverTarget;
                this.el.style[property] = toCssOklch(this._sampler(this._hoverT));
                this._rafId = null;
            } else {
                this._rafId = requestAnimationFrame(loop);
            }
        };
        if (!this._rafId) this._rafId = requestAnimationFrame(loop);
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        this._ac.abort();
        if (this._rafId) cancelAnimationFrame(this._rafId);
    }
}


// ═══════════════════════════════════════════════════════════
//  CONFETTI BURST — lite-particles powered UI confetti
// ═══════════════════════════════════════════════════════════

export class ConfettiBurst {
    /**
     * @param {HTMLCanvasElement} canvas   Overlay canvas (position: absolute over your UI)
     * @param {Object} [options]
     * @param {number} [options.maxParticles=150]
     * @param {number} [options.count=30]          Particles per burst
     * @param {Array}  [options.colors]            Array of OKLCH colors for random pick
     * @param {number} [options.gravity=600]
     * @param {number} [options.drag=0.97]
     * @param {number} [options.life=1.5]
     */
    constructor(canvas, {
        maxParticles = 150, count = 30,
        colors = [
            { l: 0.7, c: 0.25, h: 30 }, { l: 0.6, c: 0.3, h: 330 },
            { l: 0.7, c: 0.2, h: 60 }, { l: 0.5, c: 0.25, h: 260 },
            { l: 0.65, c: 0.2, h: 150 },
        ],
        gravity = 600, drag = 0.97, life = 1.5,
    } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.emitter = new Emitter({ maxParticles });
        this.count = count;
        this.colors = colors;
        this.gravity = gravity;
        this.drag = drag;
        this.life = life;
        this._destroyed = false;
        this._rafId = null;
        this._lastTime = 0;
    }

    /**
     * Trigger a confetti burst at (x, y) in canvas coordinates.
     * @param {number} x
     * @param {number} y
     */
    fire(x, y) {
        if (this._destroyed) return;
        const colorCount = this.colors.length;
        this.emitter.emitBurst(this.count, (i) => ({
            x, y,
            vx: (Math.random() - 0.5) * 400,
            vy: (Math.random() - 1) * 500,
            gravity: this.gravity,
            drag: this.drag,
            life: this.life * (0.8 + Math.random() * 0.4),
            maxLife: this.life,
            size: 4 + Math.random() * 4,
            data: { color: this.colors[i % colorCount] },
        }));

        if (!this._rafId) this._startLoop();
    }

    /** Attach to a DOM element — fires confetti on click at click position. */
    attach(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        el.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.fire(e.clientX - rect.left, e.clientY - rect.top);
        });
    }

    _startLoop() {
        this._lastTime = performance.now();
        const loop = (now) => {
            if (this._destroyed) return;
            let dt = (now - this._lastTime) / 1000;
            this._lastTime = now;
            if (dt > 0.1) dt = 0.016;

            this.emitter.update(dt);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.emitter.draw(this.ctx, (ctx, p, life) => {
                ctx.globalAlpha = life;
                ctx.fillStyle = p.data?.color ? toCssOklch(p.data.color) : '#ff00ff';
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            });

            if (this.emitter.activeCount > 0) {
                this._rafId = requestAnimationFrame(loop);
            } else {
                this._rafId = null;
            }
        };
        this._rafId = requestAnimationFrame(loop);
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this.emitter.destroy();
    }
}


// ═══════════════════════════════════════════════════════════
//  SPARKLE HOVER — lite-particles sparkles on mouse hover
// ═══════════════════════════════════════════════════════════

export class SparkleHover {
    /**
     * @param {HTMLCanvasElement} canvas   Overlay canvas
     * @param {HTMLElement|string} target  Element to track hover on
     * @param {Object} [options]
     * @param {number} [options.maxParticles=80]
     * @param {number} [options.rate=3]           Particles per frame while hovering
     * @param {Object} [options.color]            OKLCH color for sparkles
     * @param {number} [options.life=0.6]
     */
    constructor(canvas, target, {
        maxParticles = 80, rate = 3,
        color = { l: 0.95, c: 0.1, h: 50 },
        life = 0.6,
    } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.target = typeof target === 'string' ? document.querySelector(target) : target;
        this.emitter = new Emitter({ maxParticles });
        this.rate = rate;
        this.color = color;
        this.life = life;
        this._destroyed = false;
        this._ac = new AbortController();
        this._rafId = null;
        this._lastTime = 0;
        this._isHovering = false;
        this._mouseX = 0;
        this._mouseY = 0;

        const signal = this._ac.signal;
        this.target.addEventListener('mouseenter', () => {
            this._isHovering = true;
            if (!this._rafId) this._startLoop();
        }, { signal });
        this.target.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this._mouseX = e.clientX - rect.left;
            this._mouseY = e.clientY - rect.top;
        }, { signal });
        this.target.addEventListener('mouseleave', () => { this._isHovering = false; }, { signal });
    }

    _startLoop() {
        this._lastTime = performance.now();
        const loop = (now) => {
            if (this._destroyed) return;
            let dt = (now - this._lastTime) / 1000;
            this._lastTime = now;
            if (dt > 0.1) dt = 0.016;

            // Spawn sparkles while hovering
            if (this._isHovering) {
                for (let i = 0; i < this.rate; i++) {
                    this.emitter.emit({
                        x: this._mouseX + (Math.random() - 0.5) * 20,
                        y: this._mouseY + (Math.random() - 0.5) * 20,
                        vx: (Math.random() - 0.5) * 60,
                        vy: -Math.random() * 40 - 10,
                        gravity: -20,
                        life: this.life * (0.5 + Math.random()),
                        maxLife: this.life,
                        size: 2 + Math.random() * 3,
                    });
                }
            }

            this.emitter.update(dt);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.emitter.draw(this.ctx, (ctx, p, life) => {
                ctx.globalAlpha = life * life;
                ctx.fillStyle = toCssOklch(this.color);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * life, 0, Math.PI * 2);
                ctx.fill();
            });

            if (this.emitter.activeCount > 0 || this._isHovering) {
                this._rafId = requestAnimationFrame(loop);
            } else {
                this._rafId = null;
            }
        };
        this._rafId = requestAnimationFrame(loop);
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        this._ac.abort();
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this.emitter.destroy();
    }
}


// ═══════════════════════════════════════════════════════════
//  DESTROY ALL — SPA framework teardown helper
// ═══════════════════════════════════════════════════════════

/**
 * Destroy an array of LiteUI instances (or any object with a .destroy() method).
 * Useful for React useEffect cleanup, Vue onUnmounted, etc.
 *
 * @param {Array<{destroy: Function}>} instances
 *
 * @example
 *   const cleanup = [parallax, magnetic, tilt, colorShift, confetti];
 *   // In React: useEffect(() => () => destroyAll(cleanup), []);
 *   // In Vue: onUnmounted(() => destroyAll(cleanup));
 */
export function destroyAll(instances) {
    for (const instance of instances) {
        if (instance && typeof instance.destroy === 'function') {
            instance.destroy();
        }
    }
    instances.length = 0;
}
