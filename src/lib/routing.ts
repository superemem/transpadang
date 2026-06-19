// Trans Padang — routing engine sederhana dari halte asli.
// Hasil: opsi rute (direct / 1x transfer) dengan SHAPE yang sama kayak mock
// planTrips, jadi UI gak berubah. REAL: koridor, halte, urutan, jarak/estimasi
// waktu tempuh. SIMULASI: occupancy, kode bus, waktu tunggu (ETA live ada di
// trip detail via predict).
import type { Network, Corridor } from '$lib/network';
import { cumulativeDist } from '$lib/geo';

const SPEED_KMH = 20; // estimasi kecepatan tempuh termasuk berhenti

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

function rideMin(c: Corridor, i: number, j: number): number {
	const cum = cumulativeDist(c.stops);
	const km = Math.abs(cum[i] - cum[j]);
	return Math.max(1, Math.round((km / SPEED_KMH) * 60));
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

function hhmm(d: Date): string {
	return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

interface Cand {
	busLegs: BusLeg[];
	mid: Leg[];
	rideTotal: number;
	transfers: number;
}

export function planTripsReal(net: Network, fromName: string, toName: string): TripOption[] {
	const fromP = net.places.find((p) => p.name === fromName);
	const toP = net.places.find((p) => p.name === toName);
	if (!fromP || !toP) return [];

	const cands: Cand[] = [];

	// direct — koridor yang sama-sama lewat asal & tujuan
	for (const cid of fromP.lines) {
		if (!toP.lines.includes(cid)) continue;
		const c = corr(net, cid);
		if (!c) continue;
		const i = idxOn(c, fromName);
		const j = idxOn(c, toName);
		if (i < 0 || j < 0 || i === j) continue;
		const leg = busLeg(c, i, j, 4);
		cands.push({ busLegs: [leg], mid: [leg], rideTotal: leg.rideMin, transfers: 0 });
	}

	// 1x transfer — cari halte yang ada di koridor asal & koridor tujuan
	for (const cf of fromP.lines) {
		for (const ct of toP.lines) {
			if (cf === ct) continue;
			const cF = corr(net, cf);
			const cT = corr(net, ct);
			if (!cF || !cT) continue;
			const namesT = new Set(cT.stops.map((s) => s.name));
			let best: Cand | null = null;
			for (const s of cF.stops) {
				if (!namesT.has(s.name)) continue;
				const i = idxOn(cF, fromName);
				const x1 = idxOn(cF, s.name);
				const x2 = idxOn(cT, s.name);
				const j = idxOn(cT, toName);
				if (i < 0 || x1 < 0 || x2 < 0 || j < 0) continue;
				if (i === x1 || x2 === j) continue;
				const l1 = busLeg(cF, i, x1, 4);
				const l2 = busLeg(cT, x2, j, 3);
				const total = l1.rideMin + l2.rideMin;
				if (!best || total < best.rideTotal) {
					const transfer: TransferLeg = {
						type: 'transfer',
						min: 2,
						atStop: s.name,
						note: `Pindah ke ${ct}`
					};
					best = { busLegs: [l1, l2], mid: [l1, transfer, l2], rideTotal: total, transfers: 1 };
				}
			}
			if (best) cands.push(best);
		}
	}

	if (!cands.length) return [];

	// urutkan: ride + penalti transfer, lalu pilih sampai 3 yang variatif
	cands.sort((a, b) => a.rideTotal + a.transfers * 4 - (b.rideTotal + b.transfers * 4));
	const chosen: Cand[] = [];
	const keyOf = (c: Cand) => c.busLegs.map((l) => l.corridor).join('>');
	for (const c of cands) {
		if (chosen.length >= 3) break;
		if (chosen.some((x) => keyOf(x) === keyOf(c))) continue;
		chosen.push(c);
	}

	const now = new Date();
	return chosen.map((c, idx) => {
		const walkIn = 2;
		const walkOut = 1 + idx;
		const walkMin = walkIn + walkOut;
		const totalMin = c.rideTotal + walkMin + c.transfers * 2 + 4;
		const departIn = 3 + idx * 3;
		const depart = new Date(now.getTime() + departIn * 60000);
		const arrive = new Date(depart.getTime() + totalMin * 60000);
		const legs: Leg[] = [
			{ type: 'walk', min: walkIn, meters: 160, toLabel: 'Halte ' + c.busLegs[0].boardStop },
			...c.mid,
			{ type: 'walk', min: walkOut, meters: 120 + idx * 60, toLabel: 'Tujuan' }
		];
		const tag = idx === 0 ? 'Tercepat' : c.transfers === 0 ? 'Tanpa transit' : 'Alternatif';
		return {
			id: String.fromCharCode(97 + idx),
			tag,
			recommended: idx === 0,
			totalMin,
			departIn,
			departTime: hhmm(depart),
			arriveTime: hhmm(arrive),
			walkMin,
			transfers: c.transfers,
			legs
		};
	});
}
