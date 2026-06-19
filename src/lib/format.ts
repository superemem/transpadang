// Trans Padang — formatting helpers (dari handoff §6)

/**
 * ETA text dari detik tersisa.
 * - nearby (board=false): <=30s → "Skrg"
 * - board/trip (board=true): <=30s → "Tiba"
 * - selebihnya → "<n> mnt"
 */
export function etaText(sec: number, board = false): string {
	if (sec <= 30) return board ? 'Tiba' : 'Skrg';
	return `${Math.max(1, Math.round(sec / 60))} mnt`;
}

/** Warna ETA berdasar ambang waktu (handoff §6). */
export function etaColor(sec: number): string {
	if (sec <= 90) return '#0E9F6E';
	if (sec <= 300) return '#131A17';
	return '#8A968E';
}

/** Occupancy 0/1/2 → label & warna. */
export const OCC_LABEL = ['Sepi', 'Sedang', 'Penuh'] as const;
export const OCC_COLOR = ['#0E9F6E', '#F2790D', '#E11D48'] as const;
export const OCC_EMPTY = '#E6E9E4';

/** Detik random untuk reset arrival yang udah lewat (6–18 menit). */
export function rerollSec(): number {
	return Math.floor((6 + Math.random() * 12) * 60);
}
