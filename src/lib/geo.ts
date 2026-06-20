// Trans Padang — helper geospasial.
import type { Stop } from '$lib/network';

/** Jarak haversine (km). */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// cap jarak per-segmen: koordinat halte yang error / gap besar jangan nge-inflate
// estimasi waktu tempuh (halte BRT urban jarang >2 km antar halte berurutan).
const SEG_CAP_KM = 2;

/** Jarak kumulatif (km) sepanjang urutan halte, dari index 0 (per-segmen di-cap). */
export function cumulativeDist(stops: Stop[]): number[] {
	const cum = [0];
	for (let i = 1; i < stops.length; i++) {
		const d = haversine(stops[i - 1].lat, stops[i - 1].lon, stops[i].lat, stops[i].lon);
		cum[i] = cum[i - 1] + Math.min(d, SEG_CAP_KM);
	}
	return cum;
}

/** Index halte terdekat dari sebuah koordinat. */
export function nearestIndex(lat: number, lon: number, stops: Stop[]): number {
	let best = 0;
	let bestD = Infinity;
	for (let i = 0; i < stops.length; i++) {
		const d = haversine(lat, lon, stops[i].lat, stops[i].lon);
		if (d < bestD) {
			bestD = d;
			best = i;
		}
	}
	return best;
}
