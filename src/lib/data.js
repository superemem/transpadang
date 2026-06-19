// @ts-nocheck
// Trans Padang — mock data for the transit planner prototype (dari handoff, reuse as-is).
// NOTE: nanti diganti data real dari API tracking.dishub.padang.go.id — pertahankan SHAPE-nya.
// Corridor line colors (metro-style)
export const KORIDOR = [
	{
		id: 'K1',
		color: '#0E9F6E',
		name: 'Pasar Raya – Lubuk Buaya',
		headsignA: 'Lubuk Buaya',
		headsignB: 'Pasar Raya',
		stops: [
			'Pasar Raya',
			'Plaza Andalas',
			'Imam Bonjol',
			'Jati',
			'Sawahan',
			'Simpang Kandang',
			'Khatib Sulaiman',
			'RS M. Djamil',
			'Air Tawar',
			'UNP',
			'Tabing',
			'Bandara Tabing',
			'Adinegoro',
			'Simpang Kalumpang',
			'Lubuk Buaya'
		]
	},
	{
		id: 'K2',
		color: '#2563EB',
		name: 'Pasar Raya – Bungus',
		headsignA: 'Bungus',
		headsignB: 'Pasar Raya',
		stops: [
			'Pasar Raya',
			'Muaro Padang',
			'Batang Arau',
			'Seberang Padang',
			'Rawang',
			'Mata Air',
			'Indarung Junction',
			'Teluk Bayur',
			'Bungus'
		]
	},
	{
		id: 'K3',
		color: '#F2790D',
		name: 'Pasar Raya – Indarung',
		headsignA: 'Indarung',
		headsignB: 'Pasar Raya',
		stops: [
			'Pasar Raya',
			'Simpang Haru',
			'Marapalam',
			'Andalas',
			'Simpang Ketaping',
			'Gadut',
			'Lubuk Begalung',
			'Indarung'
		]
	},
	{
		id: 'K4',
		color: '#7C3AED',
		name: 'Pasar Raya – Universitas Andalas',
		headsignA: 'Universitas Andalas',
		headsignB: 'Pasar Raya',
		stops: [
			'Pasar Raya',
			'Simpang Haru',
			'Marapalam',
			'Banuaran',
			'Cengkeh',
			'Pasar Baru',
			'Limau Manis',
			'Universitas Andalas'
		]
	},
	{
		id: 'K5',
		color: '#E11D48',
		name: 'Teluk Bayur – Lubuk Buaya',
		headsignA: 'Lubuk Buaya',
		headsignB: 'Teluk Bayur',
		stops: [
			'Teluk Bayur',
			'Purus',
			'Pantai Padang',
			'Tugu IORA',
			'Ulak Karang',
			'Khatib Sulaiman',
			'Tabing',
			'Lubuk Buaya'
		]
	},
	{
		id: 'K6',
		color: '#DB2777',
		name: 'Pasar Raya – Aie Pacah',
		headsignA: 'Aie Pacah',
		headsignB: 'Pasar Raya',
		stops: ['Pasar Raya', 'Sawahan', 'Simpang Haru', 'By Pass', 'Aie Pacah', 'Balai Kota', 'Sungai Sapih']
	}
];

export const corridorById = (id) => KORIDOR.find((k) => k.id === id);

// Searchable places (halte + landmarks)
export const PLACES = [
	{ name: 'Pasar Raya Padang', sub: 'Pusat kota · Transit utama', lines: ['K1', 'K2', 'K3', 'K4', 'K6'], type: 'hub' },
	{ name: 'Khatib Sulaiman', sub: 'Jl. Khatib Sulaiman', lines: ['K1', 'K5'], type: 'stop' },
	{ name: 'Universitas Andalas', sub: 'Limau Manis', lines: ['K4'], type: 'place' },
	{ name: 'Pantai Padang', sub: 'Jl. Samudera', lines: ['K5'], type: 'place' },
	{ name: 'Bandara Tabing', sub: 'Jl. Adinegoro', lines: ['K1'], type: 'place' },
	{ name: 'Lubuk Buaya', sub: 'Terminal utara', lines: ['K1', 'K5'], type: 'hub' },
	{ name: 'Simpang Haru', sub: 'Transit · 3 koridor', lines: ['K3', 'K4', 'K6'], type: 'hub' },
	{ name: 'Air Tawar', sub: 'Dekat UNP', lines: ['K1'], type: 'stop' },
	{ name: 'Teluk Bayur', sub: 'Pelabuhan', lines: ['K2', 'K5'], type: 'place' },
	{ name: 'RS M. Djamil', sub: 'Jl. Perintis Kemerdekaan', lines: ['K1'], type: 'place' },
	{ name: 'Plaza Andalas', sub: 'Mall · pusat kota', lines: ['K1'], type: 'place' },
	{ name: 'Indarung', sub: 'Semen Padang', lines: ['K3'], type: 'place' }
];

export const RECENTS = [
	{ name: 'Universitas Andalas', sub: 'Limau Manis' },
	{ name: 'Pasar Raya Padang', sub: 'Pusat kota' }
];

export const SAVED = [
	{ label: 'Rumah', name: 'Lubuk Buaya', icon: 'home' },
	{ label: 'Kampus', name: 'Universitas Andalas', icon: 'cap' }
];

// occupancy: 0 sepi, 1 sedang, 2 penuh
function occLabel(o) {
	return ['Sepi', 'Sedang', 'Penuh'][o];
}

// Nearby stops with live arrivals (home screen)
export const NEARBY = [
	{
		name: 'Khatib Sulaiman',
		dist: 180,
		walk: 2,
		arrivals: [
			{ corridor: 'K1', headsign: 'Lubuk Buaya', eta: 3, occ: 1, bus: 'TP-114' },
			{ corridor: 'K5', headsign: 'Teluk Bayur', eta: 7, occ: 0, bus: 'TP-231' },
			{ corridor: 'K1', headsign: 'Pasar Raya', eta: 11, occ: 2, bus: 'TP-108' }
		]
	},
	{
		name: 'RS M. Djamil',
		dist: 420,
		walk: 5,
		arrivals: [
			{ corridor: 'K1', headsign: 'Pasar Raya', eta: 5, occ: 1, bus: 'TP-119' },
			{ corridor: 'K1', headsign: 'Lubuk Buaya', eta: 14, occ: 0, bus: 'TP-126' }
		]
	}
];

export { occLabel };

// Build a trip plan. Generic but uses real stop sequences for believable timelines.
export function planTrips(fromName, toName) {
	const K1 = corridorById('K1'),
		K4 = corridorById('K4');
	// midStops helper between two indices (exclusive ends)
	const seg = (k, a, b) => k.stops.slice(Math.min(a, b) + 1, Math.max(a, b));
	const opts = [];

	// Option A — Tercepat: K1 to Pasar Raya, transfer K4 to Universitas Andalas
	opts.push({
		id: 'a',
		tag: 'Tercepat',
		recommended: true,
		totalMin: 47,
		departIn: 3,
		departTime: '08:24',
		arriveTime: '09:11',
		walkMin: 6,
		transfers: 1,
		legs: [
			{ type: 'walk', min: 2, meters: 180, toLabel: 'Halte Khatib Sulaiman' },
			{
				type: 'bus',
				corridor: 'K1',
				color: K1.color,
				headsign: 'Lubuk Buaya → Pasar Raya',
				dir: 'Pasar Raya',
				boardStop: 'Khatib Sulaiman',
				alightStop: 'Pasar Raya',
				stopsCount: 6,
				rideMin: 18,
				waitMin: 3,
				bus: 'TP-114',
				occ: 1,
				midStops: seg(K1, 0, 6).reverse()
			},
			{ type: 'transfer', min: 2, atStop: 'Pasar Raya', note: 'Pindah ke peron Koridor 4' },
			{
				type: 'bus',
				corridor: 'K4',
				color: K4.color,
				headsign: 'Universitas Andalas',
				dir: 'Universitas Andalas',
				boardStop: 'Pasar Raya',
				alightStop: 'Universitas Andalas',
				stopsCount: 7,
				rideMin: 21,
				waitMin: 4,
				bus: 'TP-402',
				occ: 0,
				midStops: seg(K4, 0, 7)
			},
			{ type: 'walk', min: 2, meters: 160, toLabel: 'Tujuan' }
		]
	});

	// Option B — Paling sedikit jalan kaki
	opts.push({
		id: 'b',
		tag: 'Sedikit jalan kaki',
		totalMin: 52,
		departIn: 6,
		departTime: '08:27',
		arriveTime: '09:19',
		walkMin: 3,
		transfers: 1,
		legs: [
			{ type: 'walk', min: 1, meters: 90, toLabel: 'Halte Khatib Sulaiman' },
			{
				type: 'bus',
				corridor: 'K1',
				color: K1.color,
				headsign: 'Lubuk Buaya → Pasar Raya',
				dir: 'Pasar Raya',
				boardStop: 'Khatib Sulaiman',
				alightStop: 'Simpang Haru',
				stopsCount: 7,
				rideMin: 22,
				waitMin: 6,
				bus: 'TP-108',
				occ: 2,
				midStops: ['Jati', 'Sawahan', 'Pasar Raya', 'Plaza Andalas', 'Imam Bonjol']
			},
			{ type: 'transfer', min: 1, atStop: 'Simpang Haru', note: 'Transit antar peron' },
			{
				type: 'bus',
				corridor: 'K4',
				color: K4.color,
				headsign: 'Universitas Andalas',
				dir: 'Universitas Andalas',
				boardStop: 'Simpang Haru',
				alightStop: 'Universitas Andalas',
				stopsCount: 6,
				rideMin: 19,
				waitMin: 5,
				bus: 'TP-407',
				occ: 1,
				midStops: seg(K4, 1, 7)
			},
			{ type: 'walk', min: 1, meters: 70, toLabel: 'Tujuan' }
		]
	});

	// Option C — Tanpa transit (1 bus, jalan lebih jauh)
	opts.push({
		id: 'c',
		tag: 'Tanpa transit',
		totalMin: 58,
		departIn: 9,
		departTime: '08:30',
		arriveTime: '09:28',
		walkMin: 14,
		transfers: 0,
		legs: [
			{ type: 'walk', min: 8, meters: 650, toLabel: 'Halte Simpang Haru' },
			{
				type: 'bus',
				corridor: 'K4',
				color: K4.color,
				headsign: 'Universitas Andalas',
				dir: 'Universitas Andalas',
				boardStop: 'Simpang Haru',
				alightStop: 'Universitas Andalas',
				stopsCount: 6,
				rideMin: 19,
				waitMin: 9,
				bus: 'TP-409',
				occ: 0,
				midStops: seg(K4, 1, 7)
			},
			{ type: 'walk', min: 6, meters: 480, toLabel: 'Tujuan' }
		]
	});

	return opts;
}
