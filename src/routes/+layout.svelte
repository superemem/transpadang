<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { Planner } from '$lib/stores/planner.svelte';
	import PhoneFrame from '$lib/components/PhoneFrame.svelte';

	let { children } = $props();

	// satu planner store dibagi ke semua route via context
	const planner = new Planner();
	setContext('planner', planner);

	// satu interval global: live countdown tiap 1 detik (handoff §6)
	$effect(() => {
		const id = setInterval(() => planner.tick(), 1000);
		return () => clearInterval(id);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Trans Padang — Transit Planner</title>
</svelte:head>

<PhoneFrame>
	{@render children()}
</PhoneFrame>
