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

/** Bangun Network dari raw halte per koridor (REST `bus_stop`). */
export function buildNetwork(rawByKoridor: Record<string, RawStop[]>): Network {
	const corridors: Corridor[] = [];
	const placeMap = new Map<string, Place>();

	for (const id of CORRIDOR_IDS) {
		const raw = rawByKoridor[id];
		if (!raw || !raw.length) continue;

		const stops: Stop[] = raw
			.map((s) => ({
				id: s.id,
				name: (s.name ?? '').trim(), // gotcha: nama halte kadang ada leading space
				lat: parseFloat(s.latitude),
				lon: parseFloat(s.longitude),
				corridor: id
			}))
			.filter((s) => s.name && Number.isFinite(s.lat) && Number.isFinite(s.lon));

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
