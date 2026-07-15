# U-AIX OS User Experience (UX) Specification

This document defines the structural guidelines, typography, responsive breakpoints, design systems, and visual layouts of the **U-AIX OS** dashboard interfaces.

---

## 1. Visual Token Design System (CSS Variables)

The interface is built around a sleek dark-mode glassmorphic framework:

```css
:root {
    /* Cyberpunk Colors */
    --bg-base: #0a0a0f;
    --bg-surface: rgba(18, 18, 26, 0.7);
    --bg-surface-solid: #12121a;
    --border-color: rgba(255, 255, 255, 0.08);
    --border-color-glow: rgba(139, 92, 246, 0.25);

    /* HSL Accents & Glow Masks */
    --accent-violet: #8b5cf6;
    --accent-violet-glow: rgba(139, 92, 246, 0.35);
    --accent-cyan: #06b6d4;
    --accent-cyan-glow: rgba(6, 182, 212, 0.35);
    --accent-green: #10b981;
    --accent-green-glow: rgba(16, 185, 129, 0.25);
    --accent-red: #ef4444;
    --accent-amber: #f59e0b;

    /* Typography Scale */
    --font-sans: 'Inter', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    /* Transition Rates */
    --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. Layout Grid & Breakpoints

The workspace is organized into a modular flex grid configuration:

| Breakpoint Target | Screen Width Range | Layout Configuration | Navigation Behavior |
|---|---|---|---|
| **Large Desktop** | `>= 1200px` | 3-Column / Sidebars (320px) | Fixed top bar nav, sidebars pinned |
| **Tablet/Standard**| `901px - 1199px`| 2-Column / Condensed menus | Sidebar collapsible |
| **Mobile Port** | `<= 900px` | Single column stacked | Vertical scrollable, wrap tabs |

---

## 3. Screen layout structures

### Screen 1: Workspace Dashboard (Main CLI Shell)
- **Top System Navbar (Height: 64px)**: Pinned to view header. Displays application logo on the left, tab nav buttons in the center, and Ollama/resource meters on the right.
- **Left Status Column (Width: 320px)**: Pinned. Includes the `Active Agents` panel and `Installed Skills` grid.
- **Main Terminal Console (Flex: 1)**: Glassmorphic overlay. Displays scrollable logs in monospace and caret-prefixed intent prompt bar.

### Screen 2: Registry Marketplace
- **Search Header (Height: 120px)**: Features key search input text bar and type-filters dropdown.
- **Marketplace Cards Grid (Grid template minmax 280px)**: Fades in cards dynamically. Each contains author meta, installation switches, and inspect source button.

### Screen 3: Custom Skill Builder
- **Manifest Properties (Width: 300px)**: Fields for inputting package metadata and ticking permissions flags (`network`, `file_system`, `subprocesses`, `clipboard`).
- **Code Editor Editor (Flex: 1)**: Integrated textareas in monospace with mock javascript template structures.
- **AST Scan Dialog Panel**: Absolute overlay with a dark backdrop filter (`blur(8px)`) showing progress tickers.

### Screen 4: Memory Vault Manager
- **Semantic Tokens Explorer (Width: 320px)**: Scrollable list of short/long term memory items. Includes relations creators form.
- **Interactive Network graph (Flex: 1)**: Canvas element displaying physical node points (Personal, Team, Knowledge) and connection paths.
- **Privacy Controls sidebar (Width: 240px)**: Pinned on the right. Controls to purge vault nodes or export JSON context maps.

### Screen 5: Multi-Model Router & Telemetry
- **Telemetry Charts (Flex: 1)**: Canvas elements drawing real-time oscilloscope curves showing model generations speeds and latency levels.
- **Router Configuration sidebar (Width: 320px)**: Fields to modify active Ollama servers and test connections.
- **Metrics display grid**: Key stat cards (VRAM, Latency peaks, Cost curves).
