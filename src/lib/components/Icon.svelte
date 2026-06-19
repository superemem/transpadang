<script lang="ts">
	// Inline stroke icons (handoff §11) — no icon library.
	let {
		name,
		size = 18,
		stroke = 1.7
	}: { name: string; size?: number; stroke?: number } = $props();

	const paths: Record<string, string> = {
		bus: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 11h16"/><circle cx="8" cy="17.5" r="1.2"/><circle cx="16" cy="17.5" r="1.2"/><path d="M8 4v3M16 4v3"/>',
		walker:
			'<circle cx="13" cy="4.3" r="1.6"/><path d="M11.5 8.2l-1.8 3.6 2 1.8 1 5.4"/><path d="M9.7 11.8l-3 1.1"/><path d="M13.5 10.8l2.2 2 3 .2"/>',
		'map-pin': '<path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>',
		shelter: '<path d="M3 7h18"/><path d="M5 7v10M19 7v10"/><rect x="7" y="11" width="10" height="6" rx="1"/>',
		transfer: '<path d="M7 4v14"/><path d="M4 7l3-3 3 3"/><path d="M17 20V6"/><path d="M20 17l-3 3-3-3"/>',
		swap: '<path d="M8 3v13"/><path d="M5 6l3-3 3 3"/><path d="M16 21V8"/><path d="M13 18l3 3 3-3"/>',
		'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
		'chevron-right': '<path d="M9 6l6 6-6 6"/>',
		'chevron-down': '<path d="M6 9l6 6 6-6"/>',
		clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
		gps: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
		home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
		cap: '<path d="M2 9l10-4 10 4-10 4z"/><path d="M6 11v4c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4"/>',
		person: '<circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>',
		flag: '<path d="M5 21V4"/><path d="M5 5h11l-2 3 2 3H5"/>'
	};
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html paths[name] ?? ''}
</svg>
