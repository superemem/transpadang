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

**Data real sudah terintegrasi** (live, no-auth, CORS terbuka):

- **REST halte:** `POST tracking.dishub.padang.go.id:3001/ngi/routes` → ±488 halte (6 koridor K1–K6), di-proxy lewat `/api/stops` (hindari CORS + cache). Halte di-dedupe & diurutkan sepanjang jalur di `network.ts` (data API gak route-ordered).
- **WebSocket posisi bus:** `wss://tracking.dishub.padang.go.id` (`subscribeAll`) → ±73 bus, update ~2 detik (`stores/buses.svelte.ts`).
  - ⚠️ Gotcha: field `latitude`/`longitude` di WS **tertukar** — wajib di-swap.
- **Geocoding tempat:** Photon (OSM) via `/api/geocode`, di-bias ke bbox Padang. ⚠️ OSM miskin POI UMKM lokal (coffee shop kecil dll sering gak ketemu) — kandidat upgrade, lihat [Roadmap](#roadmap).
- **Lokasi user:** GPS asli via Geolocation API (`stores/userloc.svelte.ts`).

> **Routing engine** (`planTripsReal` di `routing.ts`) logika kita sendiri — titik-ke-titik gaya Moovit di atas data halte real, dukung sampai 2× transit. API live cuma nyediain posisi bus + halte.

Sisa **mock** tinggal `src/lib/data.js`: chip tersimpan (`SAVED`: Rumah/Kampus) + helper warna koridor. (`planTrips()` lama udah gak dipakai.)

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
├── app.html                      # viewport-fit=cover (edge-to-edge mobile)
├── lib/
│   ├── network.ts                # model + transform halte REST asli (dedupe + order jalur)
│   ├── routing.ts                # routing engine titik-ke-titik (planTripsReal, ≤2× transit)
│   ├── predict.ts                # prediksi kedatangan bus per halte (boardFor / nearbyFor)
│   ├── geo.ts                    # haversine, nearestIndex, cumulativeDist
│   ├── format.ts                 # etaText / etaColor / occupancy helpers
│   ├── data.js                   # sisa mock: SAVED chips + helper warna koridor
│   ├── stores/
│   │   ├── planner.svelte.ts     # planner store (runes class) + live tick
│   │   ├── network.svelte.ts     # data halte real (dari /api/stops)
│   │   ├── buses.svelte.ts       # posisi bus live (WebSocket)
│   │   └── userloc.svelte.ts     # lokasi user (GPS)
│   └── components/                # PhoneFrame, CorridorBadge, LiveDot, OccupancyDots, Icon
└── routes/
    ├── +layout.svelte            # PhoneFrame + planner context + tick 1s
    ├── +layout.ts                # load data halte awal (/api/stops)
    ├── +page.svelte              # HOME — search card, armada live, halte terdekat
    ├── search/                   # SEARCH — halte + geocode tempat
    ├── results/                  # ROUTE OPTIONS — opsi rute + ETA
    ├── trip/                     # TRIP DETAIL — peta skematik + timeline + bus live
    ├── stop/[name]/              # STOP DETAIL — kedatangan berikutnya live
    └── api/
        ├── stops/                # proxy REST halte (anti-CORS + cache)
        └── geocode/              # proxy geocoding Photon (bias Padang)
```

## Status

- ✅ Foundation: stack, design tokens, fonts, data layer, planner store, base components
- ✅ **Integrasi API real** — halte REST (di-proxy), posisi bus live WebSocket, GPS user
- ✅ **Routing engine** titik-ke-titik gaya Moovit (≤2× transit) + ETA prediksi
- ✅ **5 layar lengkap & dipoles** — Home, Search, Results, Trip Detail, Stop Detail (safe-area insets, press/hover states)
- ✅ Geocoding tempat (Photon/OSM, bias Padang)
- 🔲 Deploy ke `trans.openpadang.web.id`
- 🔲 Upgrade sumber POI (OSM miskin UMKM lokal) — lihat Roadmap

## Roadmap

- **Sumber POI lebih lengkap.** Geocoding sekarang pakai Photon (OSM): bagus untuk tempat publik, tapi UMKM lokal (coffee shop kecil dll) sering belum ke-mapping di OSM. Opsi yang dipertimbangkan: DB POI lokal sendiri (Supabase — instan, gratis, bisa di-upstream balik ke OSM), gerakan mapping OSM komunitas, atau Google Places. **Status: ditahan di Photon dulu sambil diuji lapangan.**
- **Deploy** ke `trans.openpadang.web.id`.

## Lisensi

Open source untuk komunitas. Lisensi menyusul (rencana: MIT code).
