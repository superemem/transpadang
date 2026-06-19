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

/** Jarak kumulatif (km) sepanjang urutan halte, dari index 0. */
export function cumulativeDist(stops: Stop[]): number[] {
	const cum = [0];
	for (let i = 1; i < stops.length; i++) {
		cum[i] = cum[i - 1] + haversine(stops[i - 1].lat, stops[i - 1].lon, stops[i].lat, stops[i].lon);
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
