<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Planner } from '$lib/stores/planner.svelte';
	import { RECENTS } from '$lib/data.js';
	import Icon from '$lib/components/Icon.svelte';
	import CorridorBadge from '$lib/components/CorridorBadge.svelte';

	const planner = getContext<Planner>('planner');

	function focus(node: HTMLInputElement) {
		node.focus();
	}

	let locating = $state(false);

	function pick(name: string) {
		const action = planner.selectPlace(name);
		if (action === 'plan') goto('/results');
	}
	async function useLoc() {
		if (locating) return;
		locating = true;
		const res = await planner.pickCurrentLocation(planner.editing);
		locating = false;
		if (res === 'plan') goto('/results');
		// 'switch' → tetap di Search (field satunya jadi aktif); 'fail' → diem
	}
	function switchField(f: 'from' | 'to') {
		if (planner.editing === f) return;
		planner.editing = f;
		planner.query = '';
	}

	const iconFor = (type: string) => (type === 'hub' ? 'transfer' : 'shelter');
</script>

<div class="screen">
	<header class="hd">
		<button class="back tp-tap" onclick={() => history.back()} aria-label="Kembali">
			<Icon name="chevron-left" size={20} stroke={2} />
		</button>

		<div class="fields">
			<!-- FROM -->
			<div class="field" class:active={planner.editing === 'from'}>
				<span class="dot-from"></span>
				{#if planner.editing === 'from'}
					<input use:focus class="finput" placeholder="Dari mana?" bind:value={planner.query} />
				{:else}
					<button class="fstatic" onclick={() => switchField('from')}>
						<span class:dim={!planner.from}>{planner.from || 'Dari mana?'}</span>
					</button>
				{/if}
			</div>
			<!-- TO -->
			<div class="field" class:active={planner.editing === 'to'}>
				<span class="sq-to"></span>
				{#if planner.editing === 'to'}
					<input use:focus class="finput" placeholder="Mau ke mana?" bind:value={planner.query} />
				{:else}
					<button class="fstatic" onclick={() => switchField('to')}>
						<span class:dim={!planner.to}>{planner.to || 'Mau ke mana?'}</span>
					</button>
				{/if}
			</div>
		</div>
	</header>

	<div class="bd">
		{#if planner.query.trim() === ''}
			<!-- empty state: lokasi saya + recents -->
			<button class="row tp-tap" onclick={useLoc} disabled={locating}>
				<span class="tile mint"><Icon name="gps" size={17} /></span>
				<span class="row-text">
					<span class="row-name green">{locating ? 'Mencari lokasi…' : 'Gunakan lokasi saya'}</span>
				</span>
			</button>

			<div class="cap">TERAKHIR DICARI</div>
			{#each RECENTS as r (r.name)}
				<button class="row tp-tap" onclick={() => pick(r.name)}>
					<span class="tile"><Icon name="clock" size={16} /></span>
					<span class="row-text">
						<span class="row-name">{r.name}</span>
						<span class="row-sub">{r.sub}</span>
					</span>
				</button>
			{/each}
		{:else}
			<!-- filtered results dari halte asli -->
			{#each planner.results as p (p.name)}
				<button class="row tp-tap" onclick={() => pick(p.name)}>
					<span class="tile" class:mint={p.type === 'hub'}>
						<Icon name={iconFor(p.type)} size={17} />
					</span>
					<span class="row-text">
						<span class="row-name">{p.name}</span>
						<span class="row-sub">{p.sub}</span>
					</span>
					<span class="badges">
						{#each p.lines as l (l)}<CorridorBadge corridor={l} size="xs" />{/each}
					</span>
				</button>
			{:else}
				<div class="empty">Halte "{planner.query}" gak ketemu.</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.screen {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.hd {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 14px 16px 12px;
		background: #fff;
		border-bottom: 1px solid var(--b-2);
	}
	.back {
		width: 38px;
		height: 38px;
		border-radius: 11px;
		background: var(--canvas);
		border: none;
		color: var(--t-900);
		display: grid;
		place-items: center;
		cursor: pointer;
		flex: 0 0 auto;
		margin-top: 1px;
	}
	.fields {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}
	.field {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 12px 13px;
		border-radius: 13px;
		background: var(--field-inactive);
		border: 1.5px solid var(--b-2);
	}
	.field.active {
		background: #fff;
		border-color: var(--green);
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
	.finput {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		font-family: var(--font-sans);
		font-size: 15px;
		font-weight: 700;
		color: var(--t-900);
	}
	.finput::placeholder {
		color: var(--t-400);
		font-weight: 700;
	}
	.fstatic {
		flex: 1;
		min-width: 0;
		text-align: left;
		border: none;
		background: transparent;
		font-size: 15px;
		font-weight: 700;
		color: var(--t-900);
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.fstatic .dim {
		color: var(--t-400);
	}

	.bd {
		flex: 1;
		overflow-y: auto;
		padding: 8px 12px 24px;
	}
	.row {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 11px 10px;
		background: transparent;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		text-align: left;
	}
	.tile {
		width: 36px;
		height: 36px;
		border-radius: 11px;
		background: var(--canvas);
		color: var(--t-600);
		display: grid;
		place-items: center;
		flex: 0 0 auto;
	}
	.tile.mint {
		background: var(--mint);
		color: var(--green);
	}
	.row-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}
	.row-name {
		font-size: 14.5px;
		font-weight: 700;
		color: var(--t-900);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.row-name.green {
		color: var(--green);
	}
	.row-sub {
		font-size: 12px;
		font-weight: 600;
		color: var(--t-500);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.badges {
		display: flex;
		gap: 4px;
		flex: 0 0 auto;
	}
	.cap {
		font-size: 11px;
		font-weight: 700;
		color: var(--t-label);
		letter-spacing: 0.6px;
		padding: 16px 12px 8px;
	}
	.empty {
		padding: 28px 12px;
		text-align: center;
		font-size: 13px;
		font-weight: 600;
		color: var(--t-500);
	}
</style>
