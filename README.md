# 3D Product Viewer

Interactive 3D product viewer built with **React Three Fiber (Three.js)**, **drei** and **GSAP**.

**Live demo:** https://3d-product-viewer-one.vercel.app

## Features
- Loads a GLB/glTF model (`useGLTF`) with Suspense and a progress loader
- Drag to rotate, scroll to zoom (OrbitControls, with limits), optional auto-rotate
- Live fabric and wood colour changes by editing the model's materials
- GSAP-animated camera moves between Front, Side, Top and Detail views
- Soft contact shadows and studio lighting (Lightformers, no external HDR)
- Responsive control panel

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Credits
Model: SheenChair from Khronos glTF Sample Assets, licensed CC BY 4.0.
