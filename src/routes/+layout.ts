import type { LayoutLoad } from './$types';
import type { Network } from '$lib/network';

// Ambil data halte asli via proxy /api/stops (jalan di SSR & client).
// Kalau gagal → network: null, app fallback ke mock biar gak pecah.
export const load: LayoutLoad = async ({ fetch }) => {
	try {
		const res = await fetch('/api/stops');
		if (res.ok) {
			const network = (await res.json()) as Network;
			return { network };
		}
	} catch {
		// abaikan — fallback ke mock
	}
	return { network: null as Network | null };
};
