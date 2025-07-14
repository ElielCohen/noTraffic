# Polygon Editor Frontend

This folder contains the **React + Vite** web application for visualising and editing polygons.

## Prerequisites

1. **Node.js ≥ 16** (includes npm). You can verify with:

   ```bash
   node -v
   npm -v
   ```

2. The backend API running on its default port (or update `frontend/src/api.js` to point to your backend URL).

---

## Getting Started (Development)

```bash
# 1. Navigate to the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start the dev server (Vite)
npm run dev
```

Vite will print a local URL (usually <http://localhost:5173>). Open it in your browser; the app will live-reload on changes.

> **Tip:** The dev server proxies API calls to the same origin by default. If your backend runs on a different port/host, tweak `BASE` in `src/api.js` or configure a Vite proxy.

---

## Production Build

Generate an optimised static bundle:

```bash
npm run build
```

The output is written to `dist/`.  You can serve it with any static HTTP server:

```bash
# Preview the production build locally
npm run preview
```

---

## Scripts Summary

| Command          | Purpose                                |
| ---------------- | -------------------------------------- |
| `npm run dev`    | Start development server with HMR      |
| `npm run build`  | Create production build in `dist/`     |
| `npm run preview`| Serve the build locally for quick test |

---

## Project Structure (simplified)

```
frontend/
├─ public/              # Static assets copied as-is
├─ src/
│  ├─ components/       # React components (canvas, modal, …)
│  ├─ api.js            # API helper functions
│  ├─ App.jsx           # Main application entry
│  └─ styles.css        # Global styles
├─ index.html           # Vite HTML entry
└─ package.json         # Project metadata & scripts
```

Enjoy editing and managing your polygons! 