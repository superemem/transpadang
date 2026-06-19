// Trans Padang — planner store (Svelte 5 runes class, handoff §7)
// Model: asal & tujuan = Endpoint {name, lat, lon} (halte / GPS / POI geocode).
import { network } from '$lib/stores/network.svelte';
import { buses } from '$lib/stores/buses.svelte';
import { userLoc } from '$lib/stores/userloc.svelte';
import { planTripsReal, type Endpoint } from '$lib/routing';
import { boardFor, nearbyFor } from '$lib/predict';
import type { Network } from '$lib/network';
import { rerollSec } from '$lib/format';

type Editing = 'from' | 'to';

// lokasi default kalau GPS belum ada (sekitar Khatib Sulaiman, pusat Padang)
const USER = { lat: -0.9171, lon: 100.3614 };
const asNetwork = () => network as unknown as Network;

interface Arrival {
	corridor: string;
	headsign: string;
	occ: number;
	bus: string;
	sec: number;
}
interface NearbyStop {
	name: string;
	dist: number;
	walk: number;
	arrivals: Arrival[];
}

export class Planner {
	// --- asal/tujuan sebagai titik koordinat ---
	fromPt = $state<Endpoint | null>(null);
	toPt = $state<Endpoint | null>(null);
	editing = $state<Editing>('to');
	query = $state('');

	options = $state<any[]>([]);
	optionId = $state<string | null>(null);

	// --- trip-detail live state ---
	busEtaSec = $state(180);
	started = $state(false);
	expanded = $state<Record<number, boolean>>({});

	// --- live arrival lists ---
	nearby = $state<NearbyStop[]>([]);
	board = $state<Arrival[]>([]);
	boardStop = $state('');

	// --- riwayat pencarian (real) ---
	recents = $state<Endpoint[]>([]);

	// --- derived ---
	from = $derived(this.fromPt?.name ?? '');
	to = $derived(this.toPt?.name ?? '');
	selectedOption = $derived(this.options.find((o) => o.id === this.optionId) ?? null);
	results = $derived.by(() => {
		const q = this.query.trim().toLowerCase();
		if (!q) return [];
		return network.places.filter((p) => `${p.name} ${p.sub ?? ''}`.toLowerCase().includes(q)).slice(0, 8);
	});

	/** Hitung opsi rute dari titik ke titik (gak ada fallback mock). */
	plan() {
		this.options = this.fromPt && this.toPt && network.loaded ? planTripsReal(asNetwork(), this.fromPt, this.toPt) : [];
		this.optionId = null;
	}

	pushRecent(ep: Endpoint) {
		if (ep.name === 'Lokasi saya') return;
		this.recents = [ep, ...this.recents.filter((r) => r.name !== ep.name)].slice(0, 5);
	}

	/** Pilih tempat (halte/POI) di Search → isi field aktif. */
	selectPlace(ep: Endpoint): 'plan' | 'switch' {
		if (this.editing === 'from') this.fromPt = ep;
		else this.toPt = ep;
		this.pushRecent(ep);
		if (this.fromPt && this.toPt) {
			this.plan();
			return 'plan';
		}
		this.editing = this.editing === 'from' ? 'to' : 'from';
		this.query = '';
		return 'switch';
	}

	swap() {
		[this.fromPt, this.toPt] = [this.toPt, this.fromPt];
		if (this.fromPt && this.toPt) this.plan();
	}

	/** Pakai GPS → set titik asal/tujuan = lokasi user (Moovit style). */
	async pickCurrentLocation(field: Editing): Promise<'plan' | 'switch' | 'fail'> {
		const pos = await userLoc.request();
		if (!pos) return 'fail';
		const ep: Endpoint = { name: 'Lokasi saya', lat: pos.lat, lon: pos.lon };
		if (field === 'from') this.fromPt = ep;
		else this.toPt = ep;
		this.refreshNearby();
		if (this.fromPt && this.toPt) {
			this.plan();
			return 'plan';
		}
		this.editing = field === 'from' ? 'to' : 'from';
		this.query = '';
		return 'switch';
	}

	/** Set sebuah halte sebagai asal/tujuan (dari Stop Detail). */
	useStopAs(field: Editing, name: string) {
		const s = network.stops.find((x) => x.name === name);
		const ep: Endpoint = { name, lat: s?.lat ?? USER.lat, lon: s?.lon ?? USER.lon };
		if (field === 'from') this.fromPt = ep;
		else this.toPt = ep;
		this.pushRecent(ep);
		this.editing = field === 'from' ? 'to' : 'from';
	}

	/** Resolve nama tempat → Endpoint (cek halte dulu, lalu geocode). */
	async resolvePlace(name: string): Promise<Endpoint | null> {
		const lower = name.toLowerCase();
		const s =
			network.stops.find((x) => x.name.toLowerCase() === lower) ||
			network.places.find((p) => p.name.toLowerCase() === lower);
		if (s) return { name: s.name, lat: s.lat, lon: s.lon };
		try {
			const res = await fetch('/api/geocode?q=' + encodeURIComponent(name + ' Padang'));
			const d = await res.json();
			const r = d.results?.[0];
			if (r) return { name, lat: r.lat, lon: r.lon };
		} catch {
			/* ignore */
		}
		return null;
	}

	/** Plan ke sebuah tujuan; pakai asal yang ada atau GPS. */
	async planTo(dest: Endpoint): Promise<'plan' | 'need-origin' | 'fail'> {
		this.toPt = dest;
		this.pushRecent(dest);
		if (!this.fromPt) {
			const pos = await userLoc.request();
			if (pos) this.fromPt = { name: 'Lokasi saya', lat: pos.lat, lon: pos.lon };
		}
		if (this.fromPt && this.toPt) {
			this.refreshNearby();
			this.plan();
			return this.options.length ? 'plan' : 'fail';
		}
		return 'need-origin';
	}

	/** Halte terdekat real (dari lokasi user / default) + kedatangan live. */
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
			arrivals: s.arrivals.map((a) => ({ corridor: a.corridor, headsign: a.headsign, occ: a.occ, bus: a.bus, sec: a.etaSec }))
		}));
	}

	selectOption(id: string) {
		this.optionId = id;
		this.started = false;
		this.expanded = {};
		const opt = this.options.find((o) => o.id === id);
		const firstBus = opt?.legs?.find((l: any) => l.type === 'bus');
		let seed = (firstBus?.waitMin ?? 3) * 60;
		if (network.loaded && firstBus) {
			const arr = boardFor(asNetwork(), buses.list, firstBus.boardStop).filter((a) => a.corridor === firstBus.corridor);
			if (arr.length) seed = arr[0].etaSec;
		}
		this.busEtaSec = seed;
	}

	openStop(name: string) {
		this.boardStop = name;
		this.refreshBoard();
	}

	/** Papan kedatangan real; kosong (jujur) kalau gak ada bus terdeteksi. */
	refreshBoard() {
		if (network.loaded && this.boardStop) {
			this.board = boardFor(asNetwork(), buses.list, this.boardStop).map((a) => ({
				corridor: a.corridor,
				headsign: a.headsign,
				occ: a.occ,
				bus: a.bus,
				sec: a.etaSec
			}));
		} else {
			this.board = [];
		}
	}

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
