import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Geocoding tempat di Padang via Photon (OSM). Server-side proxy: hindari CORS,
// set User-Agent, cache. Bias + bbox ke wilayah Padang/Sumbar.
const PHOTON = 'https://photon.komoot.io/api/';
const BBOX = '100.28,-1.10,100.55,-0.75'; // minLon,minLat,maxLon,maxLat (Padang & sekitar)
const BIAS = { lat: -0.92, lon: 100.36 }; // pusat Padang

interface GeoResult {
	name: string;
	sub: string;
	lat: number;
	lon: number;
}

export const GET: RequestHandler = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	if (q.length < 3) return json({ results: [] as GeoResult[] });

	try {
		const u = new URL(PHOTON);
		u.searchParams.set('q', q);
		u.searchParams.set('bbox', BBOX);
		u.searchParams.set('lat', String(BIAS.lat));
		u.searchParams.set('lon', String(BIAS.lon));
		u.searchParams.set('limit', '6');
		u.searchParams.set('lang', 'default');

		const ctrl = new AbortController();
		const timer = setTimeout(() => ctrl.abort(), 8000);
		const res = await fetch(u, {
			headers: { 'User-Agent': 'TransPadang/1.0 (https://openpadang.web.id)' },
			signal: ctrl.signal
		});
		clearTimeout(timer);
		const d = await res.json();

		const results: GeoResult[] = (d.features ?? [])
			.map((f: any) => {
				const c = f.geometry?.coordinates ?? [];
				const p = f.properties ?? {};
				const name =
					p.name || [p.street, p.housenumber].filter(Boolean).join(' ') || p.city || 'Tanpa nama';
				const subParts = [p.street && p.name ? p.street : null, p.district, p.city].filter(Boolean);
				return {
					name,
					sub: [...new Set(subParts)].slice(0, 2).join(', '),
					lat: c[1],
					lon: c[0]
				};
			})
			.filter((r: GeoResult) => Number.isFinite(r.lat) && Number.isFinite(r.lon));

		return json({ results }, { headers: { 'Cache-Control': 'public, s-maxage=86400' } });
	} catch {
		return json({ results: [] as GeoResult[] });
	}
};
