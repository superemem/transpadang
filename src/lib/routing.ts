// Trans Padang — routing engine dari titik (koordinat) ke titik, gaya Moovit.
// Input: Endpoint {name, lat, lon} (halte, GPS, atau POI hasil geocode).
// Pertimbangkan BEBERAPA halte terdekat di asal & tujuan (bukan cuma 1) biar
// nemu rute walau halte paling deket gak nyambung. Output: jalan kaki → bus
// (direct/1x transfer) → jalan kaki. REAL: halte, koridor, urutan, jarak, transit,
// jalan kaki. SIMULASI: occupancy, kode bus, waktu tunggu.
import type { Network, Corridor, Stop } from '$lib/network';
import { cumulativeDist, haversine } from '$lib/geo';

const SPEED_KMH = 20; // estimasi kecepatan bus termasuk berhenti
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

/** Kandidat rute (direct + 1x transfer) antara dua halte. */
function genCands(net: Network, oName: string, dName: string, oLines: string[], dLines: string[]): Cand[] {
	const cands: Cand[] = [];
	// direct
	for (const cid of oLines) {
		if (!dLines.includes(cid)) continue;
		const c = corr(net, cid);
		if (!c) continue;
		const i = idxOn(c, oName);
		const j = idxOn(c, dName);
		if (i < 0 || j < 0 || i === j) continue;
		const leg = busLeg(c, i, j, 4);
		cands.push({ busLegs: [leg], mid: [leg], rideTotal: leg.rideMin, transfers: 0 });
	}
	// 1x transfer
	for (const cf of oLines) {
		for (const ct of dLines) {
			if (cf === ct) continue;
			const cF = corr(net, cf);
			const cT = corr(net, ct);
			if (!cF || !cT) continue;
			const namesT = new Set(cT.stops.map((s) => s.name));
			let best: Cand | null = null;
			for (const s of cF.stops) {
				if (!namesT.has(s.name)) continue;
				const i = idxOn(cF, oName);
				const x1 = idxOn(cF, s.name);
				const x2 = idxOn(cT, s.name);
				const j = idxOn(cT, dName);
				if (i < 0 || x1 < 0 || x2 < 0 || j < 0 || i === x1 || x2 === j) continue;
				const l1 = busLeg(cF, i, x1, 4);
				const l2 = busLeg(cT, x2, j, 3);
				const total = l1.rideMin + l2.rideMin;
				if (!best || total < best.rideTotal) {
					const transfer: TransferLeg = { type: 'transfer', min: 2, atStop: s.name, note: `Pindah ke ${ct}` };
					best = { busLegs: [l1, l2], mid: [l1, transfer, l2], rideTotal: total, transfers: 1 };
				}
			}
			if (best) cands.push(best);
		}
	}
	return cands;
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

	for (const o of oCands) {
		const oP = net.places.find((p) => p.name === o.stop.name);
		if (!oP) continue;
		for (const d of dCands) {
			if (o.stop.name === d.stop.name) continue;
			const dP = net.places.find((p) => p.name === d.stop.name);
			if (!dP) continue;
			const walkInMin = Math.max(1, Math.round(o.distM / WALK_M_PER_MIN));
			const walkOutMin = Math.max(1, Math.round(d.distM / WALK_M_PER_MIN));
			for (const c of genCands(net, o.stop.name, d.stop.name, oP.lines, dP.lines)) {
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
