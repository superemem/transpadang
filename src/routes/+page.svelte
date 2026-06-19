<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Planner } from '$lib/stores/planner.svelte';
	import { SAVED } from '$lib/data.js';
	import { etaText, etaColor } from '$lib/format';
	import Icon from '$lib/components/Icon.svelte';
	import LiveDot from '$lib/components/LiveDot.svelte';
	import CorridorBadge from '$lib/components/CorridorBadge.svelte';
	import { network } from '$lib/stores/network.svelte';
	import { buses } from '$lib/stores/buses.svelte';
	import { CORRIDOR_IDS } from '$lib/network';

	const planner = getContext<Planner>('planner');
	const netLabel = $derived.by(() => {
		if (buses.live) return `${network.counts.stops || 488} halte · ${buses.count} bus aktif`;
		if (network.loaded) return `${network.counts.corridors} koridor · ${network.counts.stops} halte`;
		return 'Menyambungkan data…';
	});

	function editFrom() {
		planner.editing = 'from';
		goto('/search');
	}
	function editTo() {
		planner.editing = 'to';
		goto('/search');
	}
	function useMyLocation() {
		planner.from = 'Lokasi saya · Khatib Sulaiman';
		if (planner.to) {
			planner.plan(planner.from, planner.to);
			goto('/results');
		} else {
			planner.editing = 'to';
			goto('/search');
		}
	}
	function planSaved(name: string) {
		planner.plan(planner.from || 'Lokasi saya', name);
		goto('/results');
	}
	function openStop(name: string) {
		planner.openStop(name);
		goto(`/stop/${encodeURIComponent(name)}`);
	}
	const savedIcon = (i: string) => (i === 'home' ? 'home' : 'cap');
</script>

<div class="body">
	<!-- header -->
	<header class="head">
		<div class="brand">
			<div class="logo"><Icon name="bus" size={18} stroke={2} /></div>
			<div>
				<div class="title">Trans Padang</div>
				<div class="sub">
					<LiveDot size={6} color={buses.live ? 'var(--green)' : 'var(--t-400)'} />
					{netLabel}
				</div>
			</div>
		</div>
		<button class="avatar" aria-label="Profil"><Icon name="person" size={18} /></button>
	</header>

	<!-- heading -->
	<h1 class="heading">Mau ke mana<br />hari ini?</h1>

	<!-- search card -->
	<div class="search-card">
		<button class="field tp-tap" onclick={editFrom}>
			<span class="dot-from"></span>
			<span class="field-text">
				<span class="field-label">Dari</span>
				<span class="field-value" class:placeholder={!planner.from}>{planner.from || 'Lokasi saya'}</span>
			</span>
		</button>

		<div class="divider-row">
			<span class="rule"></span>
			<button class="swap tp-tap" onclick={() => planner.swap()} aria-label="Tukar">
				<Icon name="swap" size={17} />
			</button>
			<span class="rule"></span>
		</div>

		<button class="field tp-tap" onclick={editTo}>
			<span class="sq-to"></span>
			<span class="field-text">
				<span class="field-label">Ke</span>
				<span class="field-value" class:placeholder={!planner.to}>{planner.to || 'Pilih tujuan'}</span>
			</span>
		</button>

		<span class="thin-rule"></span>

		<button class="locbtn tp-tap" onclick={useMyLocation}>
			<span class="loc-tile"><Icon name="gps" size={15} /></span>
			<span class="loc-label">Pakai lokasi saat ini</span>
			<Icon name="chevron-right" size={16} stroke={1.9} />
		</button>
	</div>

	<!-- saved quick chips -->
	<div class="chips">
		{#each SAVED as s (s.label)}
			<button class="chip tp-tap" onclick={() => planSaved(s.name)}>
				<span class="chip-tile"><Icon name={savedIcon(s.icon)} size={16} /></span>
				<span class="chip-text">
					<span class="chip-label">{s.label}</span>
					<span class="chip-name">{s.name}</span>
				</span>
			</button>
		{/each}
	</div>

	<!-- armada langsung (live bus per koridor) -->
	<div class="section-head">
		<span class="section-title">Armada langsung</span>
		<span class="live-tag" class:off={!buses.live}>
			<LiveDot size={6} color={buses.live ? 'var(--green)' : 'var(--t-400)'} />
			{buses.live ? 'Live' : 'Off'}
		</span>
	</div>
	<div class="fleet">
		{#each CORRIDOR_IDS as id (id)}
			<div class="fleet-chip">
				<CorridorBadge corridor={id} size="xs" />
				<span class="fleet-count tpnum">{buses.countByCorridor[id] ?? 0}</span>
				<span class="fleet-unit">bus</span>
			</div>
		{/each}
	</div>

	<!-- halte terdekat -->
	<div class="section-head">
		<span class="section-title">Halte terdekat</span>
		<span class="live-tag"><LiveDot size={6} /> Live</span>
	</div>

	{#each planner.nearby as stop (stop.name)}
		{@const sorted = [...stop.arrivals].sort((a, b) => a.sec - b.sec)}
		<button class="stop-card tp-tap" onclick={() => openStop(stop.name)}>
			<div class="stop-head">
				<span class="stop-name"><Icon name="map-pin" size={15} /> {stop.name}</span>
				<span class="stop-dist">{stop.walk} mnt jalan · {stop.dist} m</span>
			</div>
			{#each sorted as a (a.bus)}
				<div class="arr-row">
					<CorridorBadge corridor={a.corridor} size="sm" />
					<span class="arr-headsign">{a.headsign}</span>
					<span class="arr-eta tpnum" style="color:{etaColor(a.sec)};">{etaText(a.sec)}</span>
				</div>
			{/each}
		</button>
	{/each}

	<div class="foot-space"></div>
</div>

<style>
	.body {
		flex: 1;
		overflow-y: auto;
		padding: 0 20px 28px;
	}

	/* header */
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 0 14px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 11px;
	}
	.logo {
		width: 34px;
		height: 34px;
		border-radius: 11px;
		background: var(--green);
		color: #fff;
		display: grid;
		place-items: center;
		box-shadow: 0 6px 16px -4px rgba(14, 159, 110, 0.6);
	}
	.title {
		font-size: 15px;
		font-weight: 800;
		color: var(--t-900);
		letter-spacing: -0.3px;
	}
	.sub {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 11px;
		font-weight: 600;
		color: var(--t-600);
		margin-top: 2px;
	}
	.avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: #fff;
		border: 1px solid var(--b-1);
		color: var(--t-700);
		display: grid;
		place-items: center;
		cursor: pointer;
	}

	/* heading */
	.heading {
		font-size: 27px;
		font-weight: 800;
		color: var(--t-900);
		letter-spacing: -0.8px;
		line-height: 1.12;
		margin: 6px 0 18px;
	}

	/* search card */
	.search-card {
		background: #fff;
		border-radius: 22px;
		padding: 7px;
		border: 1px solid var(--b-1);
		box-shadow: 0 10px 30px -14px rgba(19, 26, 23, 0.18);
	}
	.field {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 15px 14px;
		border-radius: 16px;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
	}
	.field-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.field-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--t-400);
	}
	.field-value {
		font-size: 15.5px;
		font-weight: 700;
		color: var(--t-900);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.field-value.placeholder {
		color: var(--t-400);
	}
	.dot-from {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		border: 3px solid var(--green);
		background: transparent;
		flex: 0 0 auto;
	}
	.sq-to {
		width: 11px;
		height: 11px;
		border-radius: 3px;
		background: var(--t-900);
		flex: 0 0 auto;
	}
	.divider-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 14px;
	}
	.rule {
		flex: 1;
		height: 1px;
		background: var(--b-3);
	}
	.swap {
		width: 36px;
		height: 36px;
		border-radius: 11px;
		background: var(--canvas);
		border: none;
		color: var(--t-600);
		display: grid;
		place-items: center;
		cursor: pointer;
		flex: 0 0 auto;
	}
	.thin-rule {
		display: block;
		height: 1px;
		background: var(--b-3);
		margin: 4px 14px;
	}
	.locbtn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 13px 14px;
		background: transparent;
		border: none;
		cursor: pointer;
	}
	.loc-tile {
		width: 26px;
		height: 26px;
		border-radius: 8px;
		background: var(--mint);
		color: var(--green);
		display: grid;
		place-items: center;
		flex: 0 0 auto;
	}
	.loc-label {
		flex: 1;
		text-align: left;
		font-size: 13.5px;
		font-weight: 700;
		color: var(--green);
	}
	.locbtn :global(svg:last-child) {
		color: #bccfc3;
	}

	/* saved chips */
	.chips {
		display: flex;
		gap: 10px;
		margin-top: 14px;
	}
	.chip {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		background: #fff;
		border: 1px solid var(--b-1);
		border-radius: 15px;
		padding: 12px 14px;
		cursor: pointer;
		text-align: left;
	}
	.chip-tile {
		width: 30px;
		height: 30px;
		border-radius: 9px;
		background: var(--mint);
		color: var(--green);
		display: grid;
		place-items: center;
		flex: 0 0 auto;
	}
	.chip-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.chip-label {
		font-size: 13px;
		font-weight: 700;
		color: var(--t-900);
	}
	.chip-name {
		font-size: 11px;
		font-weight: 600;
		color: var(--t-500);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* section head */
	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 26px 2px 12px;
	}
	.section-title {
		font-size: 16px;
		font-weight: 800;
		color: var(--t-900);
	}
	.live-tag {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 11.5px;
		font-weight: 700;
		color: var(--green);
	}
	.live-tag.off {
		color: var(--t-400);
	}

	/* armada langsung */
	.fleet {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.fleet-chip {
		flex: 1 1 calc(33.333% - 8px);
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 7px;
		background: #fff;
		border: 1px solid var(--b-1);
		border-radius: 13px;
		padding: 10px 12px;
	}
	.fleet-count {
		font-size: 16px;
		font-weight: 700;
		color: var(--t-900);
		margin-left: auto;
	}
	.fleet-unit {
		font-size: 11px;
		font-weight: 600;
		color: var(--t-500);
	}

	/* nearby stop card */
	.stop-card {
		width: 100%;
		display: block;
		text-align: left;
		background: #fff;
		border: 1px solid var(--b-1);
		border-radius: 18px;
		padding: 15px 16px;
		margin-bottom: 11px;
		box-shadow: 0 6px 18px -14px rgba(19, 26, 23, 0.3);
		cursor: pointer;
	}
	.stop-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 10px;
	}
	.stop-name {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 15px;
		font-weight: 700;
		color: var(--t-900);
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.stop-name :global(svg) {
		color: var(--t-500);
		flex: 0 0 auto;
	}
	.stop-dist {
		font-size: 12px;
		font-weight: 600;
		color: var(--t-500);
		white-space: nowrap;
		flex: 0 0 auto;
	}
	.arr-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 0;
	}
	.arr-headsign {
		flex: 1;
		font-size: 13.5px;
		font-weight: 600;
		color: var(--t-700);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.arr-eta {
		font-size: 15px;
		font-weight: 700;
		flex: 0 0 auto;
	}

	.foot-space {
		height: 8px;
	}
</style>
