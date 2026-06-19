# Trans Padang — Live Transit Planner

Aplikasi **transit planner gaya Moovit/Citymapper** untuk jaringan BRT **Trans Padang** (Padang, Sumatra Barat). Dibuat untuk **penumpang**: dari mana → mau ke mana → lihat opsi rute terbaik → ikuti timeline perjalanan dengan ETA bus live.

> Bagian dari ekosistem **[OpenPadang](https://github.com/superemem/openpadang)** — civic open data initiative untuk Padang & Sumbar. Didedikasikan untuk **komunitas transport Padang**.
>
> 🌐 Target deploy: **`trans.openpadang.web.id`**

## Tech Stack

- **SvelteKit + Svelte 5** (runes mode) — `$state` / `$derived` / `$effect`
- **Tailwind CSS v4** (`@tailwindcss/vite`) + CSS variables sebagai design tokens
- **Animasi:** `Spring` & transitions built-in dari `svelte/motion` (zero dependency)
- **Fonts:** Plus Jakarta Sans (UI) + Space Grotesk (angka/ETA)
- **Icons:** inline SVG stroke (tanpa icon library)
- **Package manager:** **pnpm** (wajib)

## Data

Saat ini pakai **mock data** (`src/lib/data.js` + `planTrips()`) dengan shape yang sengaja disiapkan untuk gampang dicolok ke data real.

**Sumber data real** (live, no-auth, CORS terbuka) — diintegrasikan bertahap:

- **REST halte:** `POST tracking.dishub.padang.go.id:3001/ngi/routes` → 488 halte (6 koridor K1–K6)
- **WebSocket posisi bus:** `wss://tracking.dishub.padang.go.id` (`subscribeAll`) → 73 bus, update ~2 detik
- ⚠️ Gotcha: field `latitude`/`longitude` di WS **tertukar** — wajib di-swap.

> Routing engine (`planTrips`) tetap logika kita sendiri di atas data halte real — API live hanya menyediakan posisi bus + halte.

## Develop

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # svelte-check (type + a11y)
pnpm build        # production build
pnpm preview      # preview build
```

## Struktur

```
src/
├── app.css                       # design tokens, fonts, keyframes
├── lib/
│   ├── data.js                   # mock data + planTrips() (nanti diganti API real)
│   ├── format.ts                 # etaText / etaColor / occupancy helpers
│   ├── stores/planner.svelte.ts  # planner store (runes class) + live tick
│   └── components/                # PhoneFrame, CorridorBadge, LiveDot, OccupancyDots, Icon
└── routes/
    ├── +layout.svelte            # PhoneFrame + planner context + tick 1s
    ├── +page.svelte              # HOME ✅
    ├── search/                   # SEARCH (WIP)
    ├── results/                  # ROUTE OPTIONS (WIP)
    ├── trip/                     # TRIP DETAIL (WIP)
    └── stop/[name]/              # STOP DETAIL (WIP)
```

## Status

- ✅ Foundation: stack, design tokens, fonts, data layer, planner store, base components
- ✅ Home screen (header, search card, saved chips, halte terdekat live)
- 🚧 Search · Results · Trip Detail · Stop Detail (stub → pixel-perfect menyusul)
- 🔲 Integrasi API real (REST halte + WebSocket posisi bus)

## Lisensi

Open source untuk komunitas. Lisensi menyusul (rencana: MIT code).
