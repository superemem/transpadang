// Trans Padang — live bus positions via WebSocket.
// wss:// (secure) → browser connect langsung, no proxy. Auto-reconnect.
import { browser } from '$app/environment';

const WS_URL = 'wss://tracking.dishub.padang.go.id';
const RECONNECT_MS = 2000;
const STALE_MS = 10000; // kalau gak ada data >10s → anggap off (anti-kedip saat reconnect normal ~14s)

export interface LiveBus {
	bus: string;
	lat: number;
	lon: number;
	corridor: string;
	speed: number;
	route: string;
	dir: string;
	lastUpdate: string;
}

class BusesStore {
	list = $state<LiveBus[]>([]);
	live = $state(false);
	updateCount = $state(0);

	count = $derived(this.list.length);
	countByCorridor = $derived.by(() => {
		const m: Record<string, number> = {};
		for (const b of this.list) m[b.corridor] = (m[b.corridor] ?? 0) + 1;
		return m;
	});

	#ws: WebSocket | null = null;
	#reconnect: ReturnType<typeof setTimeout> | null = null;
	#stale: ReturnType<typeof setTimeout> | null = null;
	#stopped = false;

	start() {
		if (!browser) return; // jangan connect saat SSR
		this.#stopped = false;
		this.#connect();
	}

	stop() {
		this.#stopped = true;
		if (this.#reconnect) clearTimeout(this.#reconnect);
		if (this.#stale) clearTimeout(this.#stale);
		try {
			this.#ws?.close();
		} catch {
			/* ignore */
		}
		this.#ws = null;
	}

	#connect() {
		try {
			this.#ws = new WebSocket(WS_URL);
		} catch {
			this.#scheduleReconnect();
			return;
		}
		this.#ws.addEventListener('open', () => {
			try {
				this.#ws?.send(JSON.stringify({ type: 'subscribeAll' }));
			} catch {
				/* ignore */
			}
		});
		this.#ws.addEventListener('message', (ev) => this.#onMessage(ev));
		this.#ws.addEventListener('close', () => this.#scheduleReconnect());
		this.#ws.addEventListener('error', () => {
			try {
				this.#ws?.close();
			} catch {
				/* ignore */
			}
		});
	}

	#onMessage(ev: MessageEvent) {
		let msg: { type?: string; data?: unknown };
		try {
			msg = JSON.parse(ev.data);
		} catch {
			return;
		}
		if (msg.type !== 'allBusLocation' || !Array.isArray(msg.data)) return;

		this.list = (msg.data as Record<string, string>[])
			.map((b) => ({
				bus: b.bus,
				lat: parseFloat(b.longitude), // ⚠️ SWAP: field longitude = latitude asli
				lon: parseFloat(b.latitude), // ⚠️ SWAP: field latitude = longitude asli
				corridor: b.corridor,
				speed: parseFloat(b.speed) || 0,
				route: b.route ?? '',
				dir: b.direct ?? '',
				lastUpdate: b.last_update ?? ''
			}))
			.filter((b) => Number.isFinite(b.lat) && Number.isFinite(b.lon));

		this.updateCount += 1;
		this.live = true;
		if (this.#stale) clearTimeout(this.#stale);
		this.#stale = setTimeout(() => {
			this.live = false;
		}, STALE_MS);
	}

	#scheduleReconnect() {
		if (this.#stopped) return;
		if (this.#reconnect) clearTimeout(this.#reconnect);
		this.#reconnect = setTimeout(() => this.#connect(), RECONNECT_MS);
	}
}

export const buses = new BusesStore();
