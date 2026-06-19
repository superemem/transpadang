// Trans Padang — planner store (Svelte 5 runes class, handoff §7)
// Provide via setContext('planner', new Planner()) di +layout.svelte.
import { PLACES, NEARBY, planTrips, corridorById } from '$lib/data.js';
import { network } from '$lib/stores/network.svelte';
import { buses } from '$lib/stores/buses.svelte';
import { planTripsReal } from '$lib/routing';
import { boardFor, nearbyFor } from '$lib/predict';
import { haversine } from '$lib/geo';
import { userLoc } from '$lib/stores/userloc.svelte';
import type { Network } from '$lib/network';
import { rerollSec } from '$lib/format';

type Editing = 'from' | 'to';

// lokasi default "user" (sekitar Khatib Sulaiman, pusat Padang) — nanti diganti geolocation
const USER = { lat: -0.9171, lon: 100.3614 };

const asNetwork = () => network as unknown as Network;

interface Arrival {
	corridor: string;
	headsign: string;
	occ: number;
	bus: string;
	sec: number; // live countdown
}

interface NearbyStop {
	name: string;
	dist: number;
	walk: number;
	arrivals: Arrival[];
}

export class Planner {
	// --- trip planning state ---
	from = $state(''); // '' artinya belum diset
	to = $state('');
	editing = $state<Editing>('to'); // field search yang lagi aktif
	query = $state('');
	options = $state<any[]>([]);
	optionId = $state<string | null>(null);

	// --- trip-detail live state ---
	busEtaSec = $state(180); // countdown naik bus di trip detail
	started = $state(false); // toggle "mulai perjalanan"
	expanded = $state<Record<number, boolean>>({}); // expander per bus-leg

	// --- live arrival lists (mutable copies, di-tick tiap detik) ---
	nearby = $state<NearbyStop[]>([]);
	board = $state<Arrival[]>([]);
	boardStop = $state('');

	// --- derived ---
	selectedOption = $derived(this.options.find((o) => o.id === this.optionId) ?? null);
	results = $derived.by(() => {
		const q = this.query.trim().toLowerCase();
		if (!q) return [];
		// pakai halte asli kalau udah ke-load, fallback ke mock
		const src = network.places.length ? network.places : PLACES;
		return src.filter((p) => `${p.name} ${p.sub ?? ''}`.toLowerCase().includes(q)).slice(0, 40);
	});

	constructor() {
		this.seedNearby();
	}

	/** Seed nearby mock deterministik (buat SSR / sebelum data real masuk). */
	seedNearby() {
		this.nearby = NEARBY.map((s) => ({
			name: s.name,
			dist: s.dist,
			walk: s.walk,
			arrivals: s.arrivals.map((a) => ({
				corridor: a.corridor,
				headsign: a.headsign,
				occ: a.occ,
				bus: a.bus,
				sec: a.eta * 60
			}))
		}));
	}

	/** Halte terdekat real (dari posisi user) + kedatangan live. Dipanggil saat data update. */
	refreshNearby() {
		if (!network.loaded) return;
		const lat = userLoc.lat ?? USER.lat;
		const lon = userLoc.lon ?? USER.lon;
		const ns = nearbyFor(asNetwork(), buses.list, lat, lon, 2);
		if (!ns.length) return;
		this.nearby = ns.map((s) => ({
			name: s.name,
			dist: s.distM,
			walk: Math.max(1, Math.round(s.distM / 80)),
			arrivals: s.arrivals.map((a) => ({
				corridor: a.corridor,
				headsign: a.headsign,
				occ: a.occ,
				bus: a.bus,
				sec: a.etaSec
			}))
		}));
	}

	/** Hitung opsi rute dari A ke B (routing engine real, fallback mock). */
	plan(from: string, to: string) {
		this.from = from;
		this.to = to;
		let opts: any[] = [];
		if (network.loaded) opts = planTripsReal(asNetwork(), from, to);
		if (!opts.length) opts = planTrips(from, to);
		this.options = opts;
		this.optionId = null;
	}

	/** Pilih tempat di layar Search → isi field yang aktif. Return aksi berikutnya. */
	selectPlace(name: string): 'plan' | 'switch' {
		if (this.editing === 'from') this.from = name;
		else this.to = name;

		if (this.from && this.to) {
			this.plan(this.from, this.to);
			return 'plan'; // page → goto('/results')
		}
		this.editing = this.editing === 'from' ? 'to' : 'from';
		this.query = '';
		return 'switch';
	}

	/** Tukar asal & tujuan, lalu re-plan kalau dua-duanya keisi. */
	swap() {
		[this.from, this.to] = [this.to, this.from];
		if (this.from && this.to) this.plan(this.from, this.to);
	}

	/** Halte asli terdekat dari sebuah koordinat. */
	#nearestName(lat: number, lon: number): string | null {
		let best: string | null = null;
		let bestD = Infinity;
		for (const s of network.stops) {
			const d = haversine(lat, lon, s.lat, s.lon);
			if (d < bestD) {
				bestD = d;
				best = s.name;
			}
		}
		return best;
	}

	/** Pakai GPS → isi field (asal/tujuan) dengan halte asli terdekat. */
	async pickCurrentLocation(field: Editing): Promise<'plan' | 'switch' | 'fail'> {
		const pos = await userLoc.request();
		if (!pos || !network.loaded) return 'fail';
		const name = this.#nearestName(pos.lat, pos.lon);
		if (!name) return 'fail';
		if (field === 'from') this.from = name;
		else this.to = name;
		this.refreshNearby();
		if (this.from && this.to) {
			this.plan(this.from, this.to);
			return 'plan';
		}
		this.editing = field === 'from' ? 'to' : 'from';
		this.query = '';
		return 'switch';
	}

	/** Pilih opsi rute → siapin trip detail (seed boarding ETA dari prediksi live). */
	selectOption(id: string) {
		this.optionId = id;
		this.started = false;
		this.expanded = {};
		const opt = this.options.find((o) => o.id === id);
		const firstBus = opt?.legs?.find((l: any) => l.type === 'bus');
		let seed = (firstBus?.waitMin ?? 3) * 60;
		if (network.loaded && firstBus) {
			const arr = boardFor(asNetwork(), buses.list, firstBus.boardStop).filter(
				(a) => a.corridor === firstBus.corridor
			);
			if (arr.length) seed = arr[0].etaSec;
		}
		this.busEtaSec = seed;
	}

	/** Buka stop board. */
	openStop(name: string) {
		this.boardStop = name;
		this.refreshBoard();
	}

	/** Papan kedatangan real dari bus live; fallback mock kalau data belum ada. */
	refreshBoard() {
		if (network.loaded && this.boardStop) {
			const arr = boardFor(asNetwork(), buses.list, this.boardStop);
			if (arr.length) {
				this.board = arr.map((a) => ({
					corridor: a.corridor,
					headsign: a.headsign,
					occ: a.occ,
					bus: a.bus,
					sec: a.etaSec
				}));
				return;
			}
		}
		this.board = this.#mockBoard(this.boardStop);
	}

	#mockBoard(name: string): Arrival[] {
		const place = PLACES.find((p) => p.name === name);
		const lines: string[] = place?.lines ?? [];
		const board: Arrival[] = [];
		let stagger = 2;
		for (const id of lines) {
			const k = corridorById(id);
			if (!k) continue;
			for (const hs of [k.headsignA, k.headsignB]) {
				board.push({
					corridor: id,
					headsign: hs,
					occ: Math.floor(Math.random() * 3),
					bus: `TP-${100 + Math.floor(Math.random() * 300)}`,
					sec: Math.floor((stagger + Math.random() * 4) * 60)
				});
				stagger += 2;
			}
		}
		return board;
	}

	/** Tick 1 detik: turunin semua countdown, reset yang udah lewat. */
	tick() {
		for (const s of this.nearby) {
			for (const a of s.arrivals) {
				a.sec -= 1;
				if (a.sec < -8) a.sec = rerollSec();
			}
		}
		for (const a of this.board) {
			a.sec -= 1;
			if (a.sec < -8) a.sec = rerollSec();
		}
		if (this.busEtaSec > -8) this.busEtaSec -= 1;
		else this.busEtaSec = rerollSec();
	}

	toggleLeg(i: number) {
		this.expanded = { ...this.expanded, [i]: !this.expanded[i] };
	}
}
