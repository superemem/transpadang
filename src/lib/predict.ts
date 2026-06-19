// Trans Padang — prediksi ETA dari posisi bus live.
// Catatan kejujuran: ETA = estimasi dari jarak bus ke halte ÷ kecepatan (lantai
// SPEED_FLOOR biar bus parkir tetap kasih angka wajar). Occupancy DISIMULASIKAN
// (API gak nyediain). Posisi bus, halte, koridor = REAL.
import type { Network } from '$lib/network';
import type { LiveBus } from '$lib/stores/buses.svelte';
import { haversine, cumulativeDist, nearestIndex } from '$lib/geo';

const SPEED_FLOOR = 14; // km/h

export interface Arrival {
	corridor: string;
	headsign: string;
	dir: string;
	bus: string;
	occ: number;
	etaSec: number;
}

/** Occupancy semu yang stabil per bus (hash id → 0/1/2). */
function occFor(busId: string): number {
	let h = 0;
	for (const ch of busId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
	return h % 3;
}

/** Papan kedatangan untuk satu halte: bus tersoon per koridor per arah. */
export function boardFor(net: Network, busList: LiveBus[], stopName: string): Arrival[] {
	const out: Arrival[] = [];
	for (const c of net.corridors) {
		const target = c.stops.findIndex((s) => s.name === stopName);
		if (target < 0) continue;
		const cum = cumulativeDist(c.stops);
		const onCorridor = busList.filter((b) => b.corridor === c.id);

		// dua arah: naik (ke index terakhir) & turun (ke index 0)
		for (const up of [true, false]) {
			const headsign = c.stops[up ? c.stops.length - 1 : 0].name;
			let bestEta = Infinity;
			let bestBus: LiveBus | null = null;
			for (const b of onCorridor) {
				const j = nearestIndex(b.lat, b.lon, c.stops);
				const reachable = up ? j <= target : j >= target;
				if (!reachable) continue;
				const distKm = Math.abs(cum[target] - cum[j]);
				const eta = (distKm / Math.max(b.speed, SPEED_FLOOR)) * 3600;
				if (eta < bestEta) {
					bestEta = eta;
					bestBus = b;
				}
			}
			if (bestBus) {
				out.push({
					corridor: c.id,
					headsign,
					dir: headsign,
					bus: 'TP-' + String(bestBus.bus).padStart(3, '0'),
					occ: occFor(bestBus.bus),
					etaSec: Math.round(bestEta)
				});
			}
		}
	}
	return out.sort((a, b) => a.etaSec - b.etaSec);
}

export interface NearbyStop {
	name: string;
	lines: string[];
	distM: number;
	arrivals: Arrival[];
}

/** Halte terdekat dari sebuah lokasi + kedatangan live-nya. */
export function nearbyFor(
	net: Network,
	busList: LiveBus[],
	lat: number,
	lon: number,
	n = 2
): NearbyStop[] {
	// dedupe halte fisik by nama, ambil terdekat
	const seen = new Set<string>();
	const uniq: { name: string; lat: number; lon: number }[] = [];
	for (const s of net.stops) {
		if (seen.has(s.name)) continue;
		seen.add(s.name);
		uniq.push({ name: s.name, lat: s.lat, lon: s.lon });
	}
	const near = uniq
		.map((s) => ({ s, distM: Math.round(haversine(lat, lon, s.lat, s.lon) * 1000) }))
		.sort((a, b) => a.distM - b.distM)
		.slice(0, n);

	return near.map(({ s, distM }) => {
		const arrivals = boardFor(net, busList, s.name).slice(0, 3);
		const lines = [...new Set(arrivals.map((a) => a.corridor))];
		return { name: s.name, lines, distM, arrivals };
	});
}
