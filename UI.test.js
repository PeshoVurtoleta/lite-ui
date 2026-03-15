import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
let ioCallback;
globalThis.IntersectionObserver = vi.fn(function (cb) { ioCallback = cb; this.observe = vi.fn(); this.unobserve = vi.fn(); this.disconnect = vi.fn(); });
HTMLElement.prototype.animate = vi.fn(() => ({ onfinish: null, cancel: vi.fn(), reverse: vi.fn() }));

vi.mock('@zakkster/lite-smart-observer', () => {
    class MockSO { constructor(opts) { this.opts = opts; this._observed = []; this._destroyed = false; } observe(s) { this._observed.push(s); } destroy() { this._destroyed = true; } }
    return { default: MockSO, SmartObserver: MockSO };
});
vi.mock('@zakkster/lite-lerp', () => ({
    lerp: (a,b,t) => a+(b-a)*t, damp: (a,b,l,dt) => a+(b-a)*(1-Math.exp(-l*dt)),
    clamp: (v,a,b) => Math.max(a,Math.min(b,v)), inverseLerp: (a,b,v) => a===b?0:(v-a)/(b-a),
    smoothstep: (a,b,v) => { const t=Math.max(0,Math.min(1,(v-a)/(b-a))); return t*t*(3-2*t); },
    easeOut: (t) => t,
}));
vi.mock('@zakkster/lite-color', () => ({
    lerpOklch: (a,b,t) => ({ l: a.l+(b.l-a.l)*t, c: a.c+(b.c-a.c)*t, h: a.h+(b.h-a.h)*t }),
    toCssOklch: () => 'oklch(0.5 0.1 0)',
}));
vi.mock('@zakkster/lite-particles', () => {
    class MockEmitter { constructor() { this.activeCount = 0; this._destroyed = false; } emit() { this.activeCount++; return {}; } emitBurst(n, fn) { for(let i=0;i<n;i++) { fn(i); this.activeCount++; } } update() {} draw(ctx, cb) {} destroy() { this._destroyed = true; } releaseAll() { this.activeCount = 0; } }
    return { Emitter: MockEmitter };
});

import { ScrollReveal, Parallax, Magnetic, Spring, ScrollProgress, Tilt, ColorShift, ConfettiBurst, SparkleHover, destroyAll } from './UI.js';

describe('🎛️ LiteUI', () => {
    beforeEach(() => {
        // rAF returns an ID but does NOT call the callback synchronously
        // (prevents infinite recursion in self-scheduling loops)
        vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);
        vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    });
    afterEach(() => { vi.restoreAllMocks(); });

    describe('ScrollReveal', () => {
        it('fadeUp creates observer and observes', () => {
            const so = ScrollReveal.fadeUp('.card');
            expect(so._observed).toContain('.card');
            so.destroy();
        });
        it('fadeIn accepts direction', () => {
            const so = ScrollReveal.fadeIn('.item', 'right');
            expect(so.opts.mode).toBe('x');
            so.destroy();
        });
        it('scaleIn uses scale mode', () => {
            const so = ScrollReveal.scaleIn('.img');
            expect(so.opts.mode).toBe('scale');
            so.destroy();
        });
        it('cascade uses long stagger', () => {
            const so = ScrollReveal.cascade('.hero');
            expect(so.opts.stagger).toBe(0.15);
            so.destroy();
        });
    });

    describe('Spring', () => {
        it('starts settled', () => {
            const s = new Spring(0);
            expect(s.settled).toBe(true);
        });
        it('set() marks as unsettled', () => {
            const s = new Spring(0); s.set(100);
            expect(s.settled).toBe(false);
        });
        it('update moves toward target', () => {
            const s = new Spring(0); s.set(100);
            for (let i = 0; i < 100; i++) s.update(0.016);
            expect(Math.abs(s.value - 100)).toBeLessThan(1);
        });
        it('snap immediately sets value', () => {
            const s = new Spring(0); s.snap(50);
            expect(s.value).toBe(50); expect(s.settled).toBe(true);
        });
        it('settles and stops computing', () => {
            const s = new Spring(0, { stiffness: 300, damping: 30 }); s.set(10);
            for (let i = 0; i < 500; i++) s.update(0.016);
            expect(s.settled).toBe(true); expect(s.value).toBe(10);
        });
    });

    describe('ConfettiBurst', () => {
        let canvas;
        beforeEach(() => {
            canvas = document.createElement('canvas');
            canvas.getContext = vi.fn(() => ({
                clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(),
                arc: vi.fn(), fill: vi.fn(), globalAlpha: 1, fillStyle: '',
            }));
        });

        it('creates with emitter', () => {
            const c = new ConfettiBurst(canvas);
            expect(c.emitter).toBeDefined();
            c.destroy();
        });
        it('fire emits particles', () => {
            const c = new ConfettiBurst(canvas, { count: 10 });
            c.fire(100, 100);
            expect(c.emitter.activeCount).toBeGreaterThan(0);
            c.destroy();
        });
        it('destroy is idempotent', () => {
            const c = new ConfettiBurst(canvas);
            c.destroy();
            expect(() => c.destroy()).not.toThrow();
        });
    });

    describe('SparkleHover', () => {
        let canvas;
        beforeEach(() => {
            canvas = document.createElement('canvas');
            canvas.getContext = vi.fn(() => ({
                clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(),
                arc: vi.fn(), fill: vi.fn(), globalAlpha: 1, fillStyle: '',
            }));
        });

        it('creates with emitter', () => {
            const target = document.createElement('div');
            const s = new SparkleHover(canvas, target);
            expect(s.emitter).toBeDefined();
            s.destroy();
        });
        it('destroy cleans up', () => {
            const target = document.createElement('div');
            const s = new SparkleHover(canvas, target);
            s.destroy();
            expect(s.emitter._destroyed).toBe(true);
        });
    });

    describe('destroyAll()', () => {
        it('calls destroy on all instances', () => {
            const a = { destroy: vi.fn() }, b = { destroy: vi.fn() };
            destroyAll([a, b]);
            expect(a.destroy).toHaveBeenCalled();
            expect(b.destroy).toHaveBeenCalled();
        });
        it('clears the array', () => {
            const arr = [{ destroy: vi.fn() }];
            destroyAll(arr);
            expect(arr.length).toBe(0);
        });
        it('skips null entries', () => {
            expect(() => destroyAll([null, undefined, { destroy: vi.fn() }])).not.toThrow();
        });
    });

    describe('Parallax', () => {
        it('sets will-change', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);
            el.getBoundingClientRect = () => ({ top: 100, height: 200 });
            const p = new Parallax(el, { speed: 0.5 });
            expect(el.style.willChange).toBe('transform');
            p.destroy();
            el.remove();
        });
        it('destroy cleans up styles', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);
            el.getBoundingClientRect = () => ({ top: 0, height: 100 });
            const p = new Parallax(el);
            p.destroy();
            expect(el.style.willChange).toBe('');
            expect(el.style.transform).toBe('');
            el.remove();
        });
    });

    describe('ScrollProgress', () => {
        it('calls onChange with progress', () => {
            const fn = vi.fn();
            const sp = new ScrollProgress({ onChange: fn });
            expect(fn).toHaveBeenCalled();
            sp.destroy();
        });
        it('destroy is idempotent', () => {
            const sp = new ScrollProgress();
            sp.destroy();
            expect(() => sp.destroy()).not.toThrow();
        });
    });
});
