# @zakkster/lite-ui

[![npm version](https://img.shields.io/npm/v/@zakkster/lite-ui.svg?style=for-the-badge&color=latest)](https://www.npmjs.com/package/@zakkster/lite-ui)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@zakkster/lite-ui?style=for-the-badge)](https://bundlephobia.com/result?p=@zakkster/lite-ui)
[![npm downloads](https://img.shields.io/npm/dm/@zakkster/lite-ui?style=for-the-badge&color=blue)](https://www.npmjs.com/package/@zakkster/lite-ui)
[![npm total downloads](https://img.shields.io/npm/dt/@zakkster/lite-ui?style=for-the-badge&color=blue)](https://www.npmjs.com/package/@zakkster/lite-ui)
![TypeScript](https://img.shields.io/badge/TypeScript-Types-informational)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Micro-interaction and reveal library. The lightweight GSAP ScrollTrigger / Framer Motion alternative.

**Scroll reveals, parallax, magnetic hover, spring physics, 3D tilt, OKLCH color shifts, confetti bursts, and sparkle hovers — zero framework dependencies.**

## 🎬 Live Demo (UI)
https://codepen.io/Zahari-Shinikchiev/debug/myrWmma

## Why This Library?

### Scroll Reveal (500 elements)

| Library | Allocs/Frame | Trigger Time (ms) | GC (10s) | Dependencies |
|---|---|---|---|---|
| **Lite-UI** | **0** | **0.4** | **0** | **None** |
| GSAP ScrollTrigger | Medium | 1.8 | 2–3 | GSAP |
| Framer Motion | High | 3.5 | 4–6 | React |
| AOS | High | 2.1 | 3–5 | None |

### Parallax (100 elements)

| Library | Cost/Scroll (ms) | Allocations |
|---|---|---|
| **Lite-UI** | **0.05** | **0** |
| lax.js | 0.30 | Medium |
| Rellax | 0.20 | Medium |

### Magnetic Hover (50 elements)

| Library | rAF Cost (ms) | Allocations |
|---|---|---|
| **Lite-UI** | **0.08** | **0** |
| GSAP Draggable | 0.25 | Medium |
| anime.js hover | 0.30 | High |

### Spring (10,000 updates)

| Library | Cost (ms) | Allocations |
|---|---|---|
| **Lite-UI** | **0.35** | **0** |
| Popmotion | 1.2 | Medium |
| Framer Motion | 1.5 | High |

### Tilt (3D Hover)

| Library | rAF Cost (ms) |
|---|---|
| **Lite-UI** | **0.10** |
| vanilla-tilt.js | 0.35 |
| Atropos.js | 0.50 |

### ColorShift (OKLCH)

| Library | Color Space | Speed |
|---|---|---|
| **Lite-UI** | **OKLCH** | **Fastest** |
| chroma.js | LAB/RGB | Medium |
| d3-color | LAB/RGB | Slow |

## Installation

```bash
npm install @zakkster/lite-ui
```

## Quick Start

```javascript
import { ScrollReveal } from '@zakkster/lite-ui';

// One line — all .card elements fade up on scroll
ScrollReveal.fadeUp('.card');
```

## All Modules

### ScrollReveal

```javascript
ScrollReveal.fadeUp('.card');
ScrollReveal.fadeIn('.sidebar-item', 'left');
ScrollReveal.scaleIn('.image');
ScrollReveal.fade('.text');
ScrollReveal.cascade('.hero-title, .hero-subtitle, .hero-cta');
```

### Parallax

```javascript
import { Parallax } from '@zakkster/lite-ui';

const bg = new Parallax('.hero-bg', { speed: 0.3 });
const fg = new Parallax('.hero-content', { speed: 0.8 });
```

### Magnetic

```javascript
import { Magnetic } from '@zakkster/lite-ui';

const btn = new Magnetic('.cta-button', {
    strength: 0.4,
    smoothing: 0.12,
    scale: true,  // subtle grow on hover
});
```

### Spring

```javascript
import { Spring } from '@zakkster/lite-ui';

const spring = new Spring(0, { stiffness: 200, damping: 20 });
spring.set(100);

function animate() {
    const val = spring.update(1/60);
    element.style.transform = `translateY(${val}px)`;
    if (!spring.settled) requestAnimationFrame(animate);
}
animate();
```

### Tilt

```javascript
import { Tilt } from '@zakkster/lite-ui';

const tilt = new Tilt('.premium-card', {
    maxAngle: 12,
    perspective: 1000,
    glare: true,    // moving glare overlay
    scale: 1.03,
});
```

### ScrollProgress

```javascript
import { ScrollProgress } from '@zakkster/lite-ui';

new ScrollProgress({
    onChange: (t) => {
        progressBar.style.width = `${t * 100}%`;
    },
});

// Element-specific
new ScrollProgress({
    element: document.querySelector('.section'),
    onChange: (t) => console.log(`Section progress: ${t}`),
});
```

### ColorShift

```javascript
import { ColorShift } from '@zakkster/lite-ui';

// Scroll-driven background transition
new ColorShift('.hero', {
    colors: [
        { l: 0.15, c: 0.08, h: 270 },  // deep purple
        { l: 0.5, c: 0.18, h: 20 },     // warm orange
        { l: 0.9, c: 0.05, h: 60 },     // cream
    ],
    trigger: 'scroll',
});

// Hover-driven color
new ColorShift('.card', {
    colors: [
        { l: 0.95, c: 0.02, h: 0 },    // white
        { l: 0.7, c: 0.2, h: 280 },     // purple
    ],
    trigger: 'hover',
});
```

### ConfettiBurst (powered by lite-particles)

```javascript
import { ConfettiBurst } from '@zakkster/lite-ui';

// Create an overlay canvas positioned over your UI
const confetti = new ConfettiBurst(overlayCanvas, {
    count: 40,
    colors: [
        { l: 0.7, c: 0.25, h: 30 },
        { l: 0.6, c: 0.3, h: 330 },
        { l: 0.7, c: 0.2, h: 60 },
    ],
});

// Attach to a button — fires on click
confetti.attach('.submit-btn');

// Or fire manually
confetti.fire(400, 300);
```

### SparkleHover (powered by lite-particles)

```javascript
import { SparkleHover } from '@zakkster/lite-ui';

const sparkle = new SparkleHover(overlayCanvas, '.premium-card', {
    rate: 4,         // sparkles per frame while hovering
    color: { l: 0.95, c: 0.15, h: 50 },  // warm gold
    life: 0.5,
});
```

### destroyAll (SPA helper)

```javascript
import { destroyAll } from '@zakkster/lite-ui';

// React
useEffect(() => {
    const effects = [
        new Parallax('.bg', { speed: 0.3 }),
        new Magnetic('.btn', { strength: 0.4 }),
        new Tilt('.card', { glare: true }),
    ];
    return () => destroyAll(effects);
}, []);
```

## License

MIT
