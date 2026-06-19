import { json } from '@sveltejs/kit';
import { buildNetwork, CORRIDOR_IDS, type RawStop } from '$lib/network';
import type { RequestHandler } from './$types';

// Proxy server-side untuk REST halte Dishub Padang.
// Kenapa proxy: upstream http:// (insecure) → gak bisa dipanggil langsung dari
// halaman https. Fetch di server + cache + sajikan via https.
const UPSTREAM = 'http://tracking.dishub.padang.go.id:3001/ngi/routes';
const TTL_MS = 6 * 60 * 60 * 1000; // halte jarang berubah → cache 6 jam

let cache: ReturnType<typeof buildNetwork> | null = null;
let cacheAt = 0;

const cacheHeaders = {
	'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400'
};

async function fetchKoridor(k: string): Promise<{ k: string; stops: RawStop[] }> {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), 12000);
	try {
		const res = await fetch(UPSTREAM, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ koridor: k }),
			signal: ctrl.signal
		});
		const d = await res.json();
		return { k, stops: (d?.data?.bus_stop ?? []) as RawStop[] };
	} finally {
		clearTimeout(timer);
	}
}

export const GET: RequestHandler = async () => {
	const now = Date.now();
	if (cache && now - cacheAt < TTL_MS) {
		return json(cache, { headers: cacheHeaders });
	}

	try {
		const results = await Promise.allSettled(CORRIDOR_IDS.map((k) => fetchKoridor(k)));
		const raw: Record<string, RawStop[]> = {};
		for (const r of results) {
			if (r.status === 'fulfilled') raw[r.value.k] = r.value.stops;
		}

		const net = buildNetwork(raw);
		net.live = net.counts.stops > 0;
		net.updatedAt = new Date().toISOString();

		// cache cuma kalau dapet data valid; kalau kosong, jangan timpa cache lama
		if (net.counts.stops > 0) {
			cache = net;
			cacheAt = now;
		}
		return json(cache ?? net, { headers: cacheHeaders });
	} catch {
		if (cache) return json(cache, { headers: cacheHeaders });
		return json({
			corridors: [],
			stops: [],
			places: [],
			counts: { corridors: 0, stops: 0 },
			updatedAt: null,
			live: false
		});
	}
};
