import type SmartObserver from '@zakkster/lite-smart-observer';
import type { OklchColor } from '@zakkster/lite-color';
import type { Emitter } from '@zakkster/lite-particles';

export { SmartObserver };

export declare const ScrollReveal: {
    fadeUp(selector: string, options?: Record<string, any>): SmartObserver;
    fadeIn(selector: string, direction?: 'left' | 'right' | 'up' | 'down', options?: Record<string, any>): SmartObserver;
    scaleIn(selector: string, options?: Record<string, any>): SmartObserver;
    fade(selector: string, options?: Record<string, any>): SmartObserver;
    cascade(selector: string, options?: Record<string, any>): SmartObserver;
};

export declare class Parallax { constructor(element: HTMLElement | string, options?: { speed?: number; direction?: 'x' | 'y'; smooth?: boolean }); destroy(): void; }
export declare class Magnetic { constructor(element: HTMLElement | string, options?: { strength?: number; smoothing?: number; maxDistance?: number; scale?: boolean }); destroy(): void; }
export declare class Spring { value: number; target: number; velocity: number; settled: boolean; constructor(initial?: number, options?: { stiffness?: number; damping?: number; mass?: number; precision?: number }); set(target: number): void; update(dt: number): number; snap(value: number): void; }
export declare class ScrollProgress { progress: number; constructor(options?: { element?: HTMLElement; onChange?: (progress: number) => void; rootMargin?: string }); destroy(): void; }
export declare class Tilt { constructor(element: HTMLElement | string, options?: { maxAngle?: number; perspective?: number; smoothing?: number; glare?: boolean; scale?: number }); destroy(): void; }
export declare class ColorShift { constructor(element: HTMLElement | string, options: { colors: OklchColor[]; property?: string; trigger?: 'scroll' | 'hover'; ease?: (t: number) => number }); destroy(): void; }
export declare class ConfettiBurst { readonly emitter: Emitter; constructor(canvas: HTMLCanvasElement, options?: { maxParticles?: number; count?: number; colors?: OklchColor[]; gravity?: number; drag?: number; life?: number }); fire(x: number, y: number): void; attach(element: HTMLElement | string): void; destroy(): void; }
export declare class SparkleHover { readonly emitter: Emitter; constructor(canvas: HTMLCanvasElement, target: HTMLElement | string, options?: { maxParticles?: number; rate?: number; color?: OklchColor; life?: number }); destroy(): void; }
export declare function destroyAll(instances: Array<{ destroy: () => void }>): void;
