// Trans Padang — planner store (Svelte 5 runes class, handoff §7)
// Provide via setContext('planner', new Planner()) di +layout.svelte.
import { PLACES, NEARBY, planTrips, corridorById } from '$lib/data.js';
import { rerollSec } from '$lib/format';

type Editing = 'from' | 'to';

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
	from = $state('Khatib Sulaiman'); // '' artinya belum diset
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
		return PLACES.filter((p) => `${p.name} ${p.sub ?? ''}`.toLowerCase().includes(q));
	});

	constructor() {
		this.seedNearby();
	}

	/** Seed nearby deterministik (eta menit → detik) biar SSR/hydration match. */
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

	/** Hitung opsi rute dari A ke B. */
	plan(from: string, to: string) {
		this.from = from;
		this.to = to;
		this.options = planTrips(from, to);
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

	/** Pilih opsi rute → siapin trip detail. */
	selectOption(id: string) {
		this.optionId = id;
		this.started = false;
		this.expanded = {};
		// seed boarding ETA dari waitMin bus pertama (kalau ada)
		const opt = this.options.find((o) => o.id === id);
		const firstBus = opt?.legs?.find((l: any) => l.type === 'bus');
		this.busEtaSec = (firstBus?.waitMin ?? 3) * 60;
	}

	/** Buka stop board → bikin arrivals dari koridor yang lewat halte itu. */
	openStop(name: string) {
		this.boardStop = name;
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
		this.board = board;
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
