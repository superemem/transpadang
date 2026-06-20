// Trans Padang — network model + transform dari data REST asli.
// Dipakai server (/api/stops proxy) maupun client.

export interface RawStop {
	id: string;
	name: string;
	latitude: string;
	longitude: string;
	corridor: string;
	route: string;
}

export interface Stop {
	id: string;
	name: string;
	lat: number;
	lon: number;
	corridor: string;
}

export interface Corridor {
	id: string;
	route: string;
	color: string;
	stops: Stop[];
}

export type PlaceType = 'hub' | 'place' | 'stop';

export interface Place {
	name: string;
	sub: string;
	lines: string[];
	type: PlaceType;
	lat: number;
	lon: number;
}

export interface Network {
	corridors: Corridor[];
	stops: Stop[];
	places: Place[];
	counts: { corridors: number; stops: number };
	updatedAt: string | null;
	live: boolean;
}

export const CORRIDOR_IDS = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'] as const;

export const CORRIDOR_COLORS: Record<string, string> = {
	K1: '#0E9F6E',
	K2: '#2563EB',
	K3: '#F2790D',
	K4: '#7C3AED',
	K5: '#E11D48',
	K6: '#DB2777'
};

// ---- Stop ordering ----
// Data API gak diurutkan sepanjang jalur (urutan acak + ada nama dobel utk 2 arah).
// Dedupe nama + urutkan via nearest-neighbor, tapi cuma pakai NN kalau jalurnya jadi
// lebih pendek (koridor yg datanya udah rapi spt K1 jangan dirusak).
function hav(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function pathLen(stops: Stop[]): number {
	let t = 0;
	for (let i = 1; i < stops.length; i++) {
		t += hav(stops[i - 1].lat, stops[i - 1].lon, stops[i].lat, stops[i].lon);
	}
	return t;
}
function dedupeByName(stops: Stop[]): Stop[] {
	const seen = new Set<string>();
	const out: Stop[] = [];
	for (const s of stops) {
		const k = s.name.toLowerCase();
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(s);
	}
	return out;
}
function nnOrder(stops: Stop[]): Stop[] {
	// mulai dari salah satu ujung (pasangan halte terjauh)
	let start = 0;
	let far = -1;
	for (let i = 0; i < stops.length; i++) {
		for (let j = i + 1; j < stops.length; j++) {
			const d = hav(stops[i].lat, stops[i].lon, stops[j].lat, stops[j].lon);
			if (d > far) {
				far = d;
				start = i;
			}
		}
	}
	const used = new Array(stops.length).fill(false);
	const order: Stop[] = [stops[start]];
	used[start] = true;
	let cur = start;
	for (let k = 1; k < stops.length; k++) {
		let best = -1;
		let bd = Infinity;
		for (let i = 0; i < stops.length; i++) {
			if (used[i]) continue;
			const d = hav(stops[cur].lat, stops[cur].lon, stops[i].lat, stops[i].lon);
			if (d < bd) {
				bd = d;
				best = i;
			}
		}
		order.push(stops[best]);
		used[best] = true;
		cur = best;
	}
	return order;
}
function orderStops(raw: Stop[]): Stop[] {
	const dd = dedupeByName(raw);
	if (dd.length < 4) return dd;
	const nn = nnOrder(dd);
	return pathLen(nn) < pathLen(dd) ? nn : dd;
}

/** Bangun Network dari raw halte per koridor (REST `bus_stop`). */
export function buildNetwork(rawByKoridor: Record<string, RawStop[]>): Network {
	const corridors: Corridor[] = [];
	const placeMap = new Map<string, Place>();

	for (const id of CORRIDOR_IDS) {
		const raw = rawByKoridor[id];
		if (!raw || !raw.length) continue;

		const parsed: Stop[] = raw
			.map((s) => ({
				id: s.id,
				name: (s.name ?? '').trim(), // gotcha: nama halte kadang ada leading space
				lat: parseFloat(s.latitude),
				lon: parseFloat(s.longitude),
				corridor: id
			}))
			.filter((s) => s.name && Number.isFinite(s.lat) && Number.isFinite(s.lon));

		// dedupe + urutkan halte sepanjang jalur (data API gak route-ordered)
		const stops = orderStops(parsed);
		const route = (raw[0]?.route ?? '').trim();
		corridors.push({ id, route, color: CORRIDOR_COLORS[id] ?? '#0E9F6E', stops });

		// kumpulin tiap nama halte unik → koridor mana aja yang lewat
		for (const s of stops) {
			const key = s.name.toLowerCase();
			const existing = placeMap.get(key);
			if (existing) {
				if (!existing.lines.includes(id)) existing.lines.push(id);
			} else {
				placeMap.set(key, { name: s.name, sub: '', lines: [id], type: 'stop', lat: s.lat, lon: s.lon });
			}
		}
	}

	const allStops = corridors.flatMap((c) => c.stops);

	const places = [...placeMap.values()]
		.map((p) => {
			const n = p.lines.length;
			p.type = n >= 2 ? 'hub' : 'stop';
			p.sub = n >= 2 ? `Transit · ${n} koridor` : `Koridor ${p.lines[0]}`;
			return p;
		})
		.sort((a, b) => b.lines.length - a.lines.length || a.name.localeCompare(b.name));

	return {
		corridors,
		stops: allStops,
		places,
		counts: { corridors: corridors.length, stops: allStops.length },
		updatedAt: null,
		live: false
	};
}
