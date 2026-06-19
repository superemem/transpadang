<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { Planner } from '$lib/stores/planner.svelte';
	import { network } from '$lib/stores/network.svelte';
	import { buses } from '$lib/stores/buses.svelte';
	import PhoneFrame from '$lib/components/PhoneFrame.svelte';

	let { children, data } = $props();

	// data halte asli (dari /api/stops via layout load) → network store
	$effect(() => {
		network.set(data?.network ?? null);
	});

	// satu planner store dibagi ke semua route via context
	const planner = new Planner();
	setContext('planner', planner);

	// satu interval global: live countdown tiap 1 detik (handoff §6)
	$effect(() => {
		const id = setInterval(() => planner.tick(), 1000);
		return () => clearInterval(id);
	});

	// koneksi WebSocket posisi bus live (client only)
	$effect(() => {
		buses.start();
		return () => buses.stop();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Trans Padang — Transit Planner</title>
</svelte:head>

<PhoneFrame>
	{@render children()}
</PhoneFrame>
