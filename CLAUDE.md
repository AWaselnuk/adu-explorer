# CLAUDE.md — ADU Explorer

3D walkthrough of the 112 Allissia Coach House (795 sq ft ADU).
Built with Vite + React Three Fiber. Deploys to GitHub Pages.

---

## Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 5.x | Build tool / dev server |
| React | 18.x | UI framework |
| @react-three/fiber | 8.x | React renderer for Three.js |
| @react-three/drei | 9.x | Helpers: controls, environment, sky |
| three | 0.166 | 3D engine |

---

## Dev workflow

```bash
npm install          # first time only
npm run dev          # dev server at http://localhost:5173
```

Open `http://localhost:5173/adu-explorer/` in the browser.

---

## Verifying changes before commit

**Always run this before committing or pushing:**

```bash
npm run build && npm run verify
```

This does two things:
1. `npm run build` — compiles the app to `dist/`. If this exits non-zero, there's a compile error. Fix it before going further.
2. `npm run verify` — runs `scripts/verify.js` which checks that:
   - `dist/index.html` exists and has the root div
   - At least one JS bundle is in `dist/assets/`
   - The main bundle is > 50KB (a tiny bundle = broken tree-shaking or missing imports)

**Do not push if either command fails.**

---

## What to check in the browser (dev server)

After `npm run dev`, open the site and verify:
- [ ] Scene loads — house visible in the center of a forested lot
- [ ] Orbit mode: drag rotates, scroll zooms, right-drag pans
- [ ] Walk mode: click toggles button, click canvas captures mouse, WASD moves, ESC releases
- [ ] No red error overlay from React (white text on red = runtime error)
- [ ] Browser console has no uncaught exceptions (F12 → Console tab)

---

## Checking for runtime errors

Vite shows compile errors in the terminal and in the browser overlay — these are easy to catch.

Runtime errors (Three.js geometry issues, bad texture paths, etc.) only appear in the browser console:
1. `npm run dev`
2. Open browser → F12 → Console
3. Look for red error lines
4. Common issues:
   - `Cannot read properties of undefined` → a component received wrong props
   - `THREE.BufferGeometry` warnings → geometry indices out of range (usually fine to ignore)
   - 404 on `/textures/...` → texture file missing from `public/textures/` (expected until you add real textures)

---

## Project structure

```
adu-explorer/
├── .github/workflows/
│   └── deploy.yml          ← GitHub Actions: builds + deploys to Pages on push to main
├── public/
│   ├── textures/
│   │   ├── exterior/       ← drop siding, roof, trim textures here
│   │   └── interior/       ← drop floor, wall, tile textures here
│   └── design-photos/      ← drop inspiration photos here for Claude to reference
├── scripts/
│   └── verify.js           ← post-build health check
├── src/
│   ├── components/
│   │   ├── ADUModel.jsx    ← 3D house geometry (walls, roof, windows, doors)
│   │   ├── CameraControls.jsx ← Orbit + walk camera modes
│   │   ├── Forest.jsx      ← Procedural trees and ground cover
│   │   └── UI.jsx          ← Orbit/Walk toggle button overlay
│   ├── App.jsx             ← Canvas setup, lighting, sky
│   └── main.jsx            ← React entry point
├── CLAUDE.md               ← this file
├── package.json
└── vite.config.js
```

---

## GitHub Pages setup (one-time)

After pushing to `main` for the first time:

1. Go to repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push any commit to `main` — Actions will build and deploy automatically
4. Live URL: `https://<your-username>.github.io/adu-explorer/`

---

## Adding textures

See `public/textures/exterior/README.md` and `public/textures/interior/README.md` for full instructions.

Short version:
1. Drop a tileable image into the appropriate folder
2. In `ADUModel.jsx`, import `useTexture` from `@react-three/drei`
3. Load the texture: `const map = useTexture('/textures/exterior/siding.jpg')`
4. Apply to material: `<meshStandardMaterial map={map} />`

---

## Floor plan reference

All geometry in `ADUModel.jsx` uses **feet as Three.js units** (1 unit = 1 foot).

| Room | Approx position (X, Z) | Size |
|------|------------------------|------|
| Living / Kitchen | center-south | 25' × 13' vaulted |
| Bedroom 1 (NE) | +X, -Z | ~8.5' × 13' |
| Bedroom 2 / Laundry (NW) | -X, -Z | ~10' × 11.3' |
| Bathroom (N center) | center, -Z | ~5.5' × 10.5' |
| Entry / Hall | center | transition zone |

Source drawings: Evolution Design & Drafting, March 20 2026.
