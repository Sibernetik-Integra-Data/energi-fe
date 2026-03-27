# energi-fe

Scaffolded Vite + Vue 3 project with Tailwind, Pinia, and an MVC-per-module example.

Quick start

```bash
cd energi-fe
npm install
npm run dev
```

Set backend base URL with `VITE_API_BASE`, for example:

```bash
VITE_API_BASE=http://localhost:3000 npm run dev
```

Project structure highlights

- `src/modules/<name>/model.js` — model layer
- `src/modules/<name>/controller.js` — controller/use-case layer
- `src/modules/<name>/view.vue` — Vue view component
- `src/api/fetch.js` — central fetch wrapper using `VITE_API_BASE`
# energi-fe
Web aplikasi untuk kebun sawit