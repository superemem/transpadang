// Trans Padang — routing engine dari titik (koordinat) ke titik, gaya Moovit.
// Input: Endpoint {name, lat, lon} (halte, GPS, atau POI hasil geocode).
// Pertimbangkan BEBERAPA halte terdekat di asal & tujuan (bukan cuma 1) biar
// nemu rute walau halte paling deket gak nyambung. Output: jalan kaki → bus
// (direct/1x transfer) → jalan kaki. REAL: halte, koridor, urutan, jarak, transit,
// jalan kaki. SIMULASI: occupancy, kode bus, waktu tunggu.
import type { Network, Corridor, Stop } from '$lib/network';
import { CORRIDOR_IDS } from '$lib/network';
import { cumulativeDist, haversine } from '$lib/geo';

const SPEED_KMH = 24; // estimasi kecepatan tempuh bus (haversine straight-line, ~setara 18km/h di jalan)
const WALK_M_PER_MIN = 80; // kecepatan jalan kaki
const NEAR_K = 6; // jumlah halte kandidat per ujung (biar nemu koridor yg pas, bukan cuma yg paling deket)

export interface Endpoint {
	name: string;
	lat: number;
	lon: number;
}
export interface WalkLeg {
	type: 'walk';
	min: number;
	meters: number;
	toLabel: string;
}
export interface BusLeg {
	type: 'bus';
	corridor: string;
	color: string;
	headsign: string;
	dir: string;
	boardStop: string;
	alightStop: string;
	stopsCount: number;
	rideMin: number;
	waitMin: number;
	bus: string;
	occ: number;
	midStops: string[];
}
export interface TransferLeg {
	type: 'transfer';
	min: number;
	atStop: string;
	note: string;
}
export type Leg = WalkLeg | BusLeg | TransferLeg;

export interface TripOption {
	id: string;
	tag: string;
	recommended?: boolean;
	totalMin: number;
	departIn: number;
	departTime: string;
	arriveTime: string;
	walkMin: number;
	transfers: number;
	legs: Leg[];
}

const corr = (net: Network, id: string) => net.corridors.find((c) => c.id === id);
const idxOn = (c: Corridor, name: string) => c.stops.findIndex((s) => s.name === name);

/** Top-K halte unik (by nama) terdekat dari sebuah titik. */
function nearestUnique(net: Network, lat: number, lon: number, k: number) {
	const seen = new Set<string>();
	const arr: { stop: Stop; distM: number }[] = [];
	for (const s of net.stops) {
		if (seen.has(s.name)) continue;
		seen.add(s.name);
		arr.push({ stop: s, distM: Math.round(haversine(lat, lon, s.lat, s.lon) * 1000) });
	}
	arr.sort((a, b) => a.distM - b.distM);
	return arr.slice(0, k);
}

function rideMin(c: Corridor, i: number, j: number): number {
	const cum = cumulativeDist(c.stops);
	return Math.max(1, Math.round((Math.abs(cum[i] - cum[j]) / SPEED_KMH) * 60));
}
function headFor(c: Corridor, i: number, j: number): string {
	return c.stops[j > i ? c.stops.length - 1 : 0].name;
}
function midOf(c: Corridor, i: number, j: number): string[] {
	const lo = Math.min(i, j);
	const hi = Math.max(i, j);
	const seg = c.stops.slice(lo + 1, hi).map((s) => s.name);
	return j > i ? seg : seg.reverse();
}
const occRand = () => Math.floor(Math.random() * 3);
const busCode = () => 'TP-' + String(100 + Math.floor(Math.random() * 300));

function busLeg(c: Corridor, i: number, j: number, wait: number): BusLeg {
	const head = headFor(c, i, j);
	return {
		type: 'bus',
		corridor: c.id,
		color: c.color,
		headsign: head,
		dir: head,
		boardStop: c.stops[i].name,
		alightStop: c.stops[j].name,
		stopsCount: Math.abs(j - i),
		rideMin: rideMin(c, i, j),
		waitMin: wait,
		bus: busCode(),
		occ: occRand(),
		midStops: midOf(c, i, j)
	};
}
function walkLeg(aLat: number, aLon: number, bLat: number, bLon: number, label: string): WalkLeg {
	const meters = Math.round(haversine(aLat, aLon, bLat, bLon) * 1000);
	return { type: 'walk', min: Math.max(1, Math.round(meters / WALK_M_PER_MIN)), meters, toLabel: label };
}
function hhmm(d: Date): string {
	return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

interface Cand {
	busLegs: BusLeg[];
	mid: Leg[];
	rideTotal: number;
	transfers: number;
}

type SharedFn = (a: string, b: string) => string[];

/** Kandidat rute (0/1/2 transfer) antara dua halte. 2x transit cuma kalau yg ≤1x gak ada. */
function routeBetween(
	net: Network,
	oName: string,
	oLines: string[],
	dName: string,
	dLines: string[],
	shared: SharedFn
): Cand[] {
	const out: Cand[] = [];

	// direct
	for (const cid of oLines) {
		if (!dLines.includes(cid)) continue;
		const c = corr(net, cid);
		if (!c) continue;
		const i = idxOn(c, oName);
		const j = idxOn(c, dName);
		if (i < 0 || j < 0 || i === j) continue;
		const leg = busLeg(c, i, j, 4);
		out.push({ busLegs: [leg], mid: [leg], rideTotal: leg.rideMin, transfers: 0 });
	}

	// 1x transfer
	for (const cf of oLines) {
		for (const ct of dLines) {
			if (cf === ct) continue;
			const cF = corr(net, cf);
			const cT = corr(net, ct);
			if (!cF || !cT) continue;
			const oi = idxOn(cF, oName);
			const dj = idxOn(cT, dName);
			if (oi < 0 || dj < 0) continue;
			let best: Cand | null = null;
			for (const t of shared(cf, ct)) {
				const x1 = idxOn(cF, t);
				const x2 = idxOn(cT, t);
				if (x1 < 0 || x2 < 0 || x1 === oi || x2 === dj) continue;
				const l1 = busLeg(cF, oi, x1, 4);
				const l2 = busLeg(cT, x2, dj, 3);
				const total = l1.rideMin + l2.rideMin;
				if (!best || total < best.rideTotal) {
					const tr: TransferLeg = { type: 'transfer', min: 2, atStop: t, note: `Pindah ke ${ct}` };
					best = { busLegs: [l1, l2], mid: [l1, tr, l2], rideTotal: total, transfers: 1 };
				}
			}
			if (best) out.push(best);
		}
	}

	if (out.length) return out; // udah ada rute ≤1x transit

	// 2x transfer (fallback: lewat koridor perantara)
	for (const cf of oLines) {
		for (const ct of dLines) {
			if (cf === ct) continue;
			const cF = corr(net, cf);
			const cT = corr(net, ct);
			if (!cF || !cT) continue;
			const oi = idxOn(cF, oName);
			const dj = idxOn(cT, dName);
			if (oi < 0 || dj < 0) continue;
			let best: Cand | null = null;
			for (const cm of CORRIDOR_IDS) {
				if (cm === cf || cm === ct) continue;
				const cM = corr(net, cm);
				if (!cM) continue;
				const s1 = shared(cf, cm);
				const s2 = shared(cm, ct);
				if (!s1.length || !s2.length) continue;
				for (const t1 of s1) {
					const a1 = idxOn(cF, t1);
					const m1 = idxOn(cM, t1);
					if (a1 < 0 || m1 < 0 || a1 === oi) continue;
					for (const t2 of s2) {
						if (t2 === t1) continue;
						const m2 = idxOn(cM, t2);
						const b2 = idxOn(cT, t2);
						if (m2 < 0 || b2 < 0 || m2 === m1 || b2 === dj) continue;
						const l1 = busLeg(cF, oi, a1, 4);
						const l2 = busLeg(cM, m1, m2, 3);
						const l3 = busLeg(cT, b2, dj, 3);
						const total = l1.rideMin + l2.rideMin + l3.rideMin;
						if (!best || total < best.rideTotal) {
							const tr1: TransferLeg = { type: 'transfer', min: 2, atStop: t1, note: `Pindah ke ${cm}` };
							const tr2: TransferLeg = { type: 'transfer', min: 2, atStop: t2, note: `Pindah ke ${ct}` };
							best = { busLegs: [l1, l2, l3], mid: [l1, tr1, l2, tr2, l3], rideTotal: total, transfers: 2 };
						}
					}
				}
			}
			if (best) out.push(best);
		}
	}

	return out;
}

export function planTripsReal(net: Network, from: Endpoint, to: Endpoint): TripOption[] {
	const oCands = nearestUnique(net, from.lat, from.lon, NEAR_K);
	const dCands = nearestUnique(net, to.lat, to.lon, NEAR_K);

	interface Scored {
		c: Cand;
		oStop: Stop;
		dStop: Stop;
		walkInMin: number;
		walkOutMin: number;
		score: number;
	}
	const scored: Scored[] = [];

	// cache shared-stops antar koridor (titik transit)
	const sCache = new Map<string, string[]>();
	const shared = (a: string, b: string): string[] => {
		const key = a < b ? a + b : b + a;
		const hit = sCache.get(key);
		if (hit) return hit;
		const cA = corr(net, a);
		const cB = corr(net, b);
		let v: string[] = [];
		if (cA && cB) {
			const setB = new Set(cB.stops.map((s) => s.name));
			v = [...new Set(cA.stops.map((s) => s.name).filter((n) => setB.has(n)))];
		}
		sCache.set(key, v);
		return v;
	};

	for (const o of oCands) {
		const oP = net.places.find((p) => p.name === o.stop.name);
		if (!oP) continue;
		for (const d of dCands) {
			if (o.stop.name === d.stop.name) continue;
			const dP = net.places.find((p) => p.name === d.stop.name);
			if (!dP) continue;
			const walkInMin = Math.max(1, Math.round(o.distM / WALK_M_PER_MIN));
			const walkOutMin = Math.max(1, Math.round(d.distM / WALK_M_PER_MIN));
			for (const c of routeBetween(net, o.stop.name, oP.lines, d.stop.name, dP.lines, shared)) {
				scored.push({
					c,
					oStop: o.stop,
					dStop: d.stop,
					walkInMin,
					walkOutMin,
					score: c.rideTotal + c.transfers * 4 + walkInMin + walkOutMin
				});
			}
		}
	}

	if (!scored.length) return [];
	scored.sort((a, b) => a.score - b.score);

	// pilih sampai 3 yang variatif (signature beda)
	const chosen: Scored[] = [];
	const keyOf = (x: Scored) =>
		x.oStop.name + '|' + x.c.busLegs.map((l) => l.corridor).join('>') + '|' + x.dStop.name;
	for (const x of scored) {
		if (chosen.length >= 3) break;
		if (chosen.some((y) => keyOf(y) === keyOf(x))) continue;
		chosen.push(x);
	}

	const now = new Date();
	return chosen.map((x, idx) => {
		const walkIn = walkLeg(from.lat, from.lon, x.oStop.lat, x.oStop.lon, 'Halte ' + x.oStop.name);
		const walkOut = walkLeg(x.dStop.lat, x.dStop.lon, to.lat, to.lon, to.name);
		const walkMin = walkIn.min + walkOut.min;
		const totalMin = x.c.rideTotal + walkMin + x.c.transfers * 2 + 4;
		const departIn = 3 + idx * 3;
		const depart = new Date(now.getTime() + departIn * 60000);
		const arrive = new Date(depart.getTime() + totalMin * 60000);
		const legs: Leg[] = [walkIn, ...x.c.mid, walkOut];
		const tag = idx === 0 ? 'Tercepat' : x.c.transfers === 0 ? 'Tanpa transit' : 'Alternatif';
		return {
			id: String.fromCharCode(97 + idx),
			tag,
			recommended: idx === 0,
			totalMin,
			departIn,
			departTime: hhmm(depart),
			arriveTime: hhmm(arrive),
			walkMin,
			transfers: x.c.transfers,
			legs
		};
	});
}
