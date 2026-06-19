// Trans Padang — network store (data halte asli). Singleton, di-set dari layout load.
// Data halte = global publik (sama untuk semua user) jadi aman sebagai singleton.
import type { Network, Corridor, Stop, Place } from '$lib/network';

class NetworkStore {
	corridors = $state<Corridor[]>([]);
	stops = $state<Stop[]>([]);
	places = $state<Place[]>([]);
	counts = $state<{ corridors: number; stops: number }>({ corridors: 6, stops: 0 });
	live = $state(false);
	loaded = $state(false);

	set(n: Network | null) {
		if (!n) return;
		this.corridors = n.corridors;
		this.stops = n.stops;
		this.places = n.places;
		this.counts = n.counts;
		this.live = n.live;
		this.loaded = true;
	}
}

export const network = new NetworkStore();
