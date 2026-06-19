<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Planner } from '$lib/stores/planner.svelte';
	import { buses } from '$lib/stores/buses.svelte';
	import { etaText, etaColor } from '$lib/format';
	import Icon from '$lib/components/Icon.svelte';
	import LiveDot from '$lib/components/LiveDot.svelte';
	import CorridorBadge from '$lib/components/CorridorBadge.svelte';
	import OccupancyDots from '$lib/components/OccupancyDots.svelte';

	const planner = getContext<Planner>('planner');
	const stopName = $derived(planner.boardStop || decodeURIComponent(page.params.name ?? ''));
	const sorted = $derived([...planner.board].sort((a, b) => a.sec - b.sec));
	const koridorCount = $derived(new Set(planner.board.map((b) => b.corridor)).size);

	// pastikan board ke-load buat halte ini, dan refresh tiap data bus update
	$effect(() => {
		const target = decodeURIComponent(page.params.name ?? '');
		if (target && planner.boardStop !== target) planner.openStop(target);
	});
	$effect(() => {
		buses.updateCount; // dependency
		planner.refreshBoard();
	});

	function berangkat() {
		planner.useStopAs('from', stopName);
		goto('/search');
	}
	function tujuan() {
		planner.useStopAs('to', stopName);
		goto('/search');
	}
</script>

<div class="screen">
	<header class="hd">
		<button class="back tp-tap" onclick={() => history.back()} aria-label="Kembali">
			<Icon name="chevron-left" size={20} stroke={2} />
		</button>
		<div class="sum">
			<div class="ttl">{stopName}</div>
			<div class="subline">Halte · {koridorCount} koridor · {planner.board.length} jadwal</div>
		</div>
		<span class="live-tag" class:off={!buses.live}>
			<LiveDot size={6} color={buses.live ? 'var(--green)' : 'var(--t-400)'} />
			{buses.live ? 'Live' : 'Off'}
		</span>
	</header>

	<div class="actions">
		<button class="act go tp-tap" onclick={berangkat}>
			<span class="dot-from"></span> Berangkat dari sini
		</button>
		<button class="act to tp-tap" onclick={tujuan}>
			<span class="sq-to"></span> Tujuan ke sini
		</button>
	</div>

	<div class="bd">
		<div class="label">KEDATANGAN BERIKUTNYA</div>
		{#each sorted as a (a.headsign + a.bus)}
			<div class="arr">
				<CorridorBadge corridor={a.corridor} size="lg" />
				<div class="arr-mid">
					<div class="arr-head">{a.headsign}</div>
					<div class="arr-meta">
						<span>Bus {a.bus}</span>
						<OccupancyDots occ={a.occ} layout="row" w={4} h={9} />
					</div>
				</div>
				<div class="arr-eta tpnum" style="color:{etaColor(a.sec)};">
					{etaText(a.sec, true)}
				</div>
			</div>
		{:else}
			<div class="empty">Belum ada bus menuju halte ini terdeteksi.</div>
		{/each}
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
		align-items: center;
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
	}
	.sum {
		min-width: 0;
		flex: 1;
	}
	.ttl {
		font-size: 16px;
		font-weight: 800;
		color: var(--t-900);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.subline {
		font-size: 12px;
		font-weight: 600;
		color: var(--t-500);
	}
	.live-tag {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 11.5px;
		font-weight: 700;
		color: var(--green);
		flex: 0 0 auto;
	}
	.live-tag.off {
		color: var(--t-400);
	}

	.actions {
		display: flex;
		gap: 10px;
		padding: 14px 16px 6px;
	}
	.act {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px;
		border-radius: 13px;
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
	}
	.act.go {
		background: var(--mint);
		border: 1.5px solid var(--b-rec);
		color: var(--green-dark);
	}
	.act.to {
		background: #fff;
		border: 1.5px solid var(--b-1);
		color: var(--t-900);
	}
	.dot-from {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		border: 3px solid var(--green);
		flex: 0 0 auto;
	}
	.sq-to {
		width: 11px;
		height: 11px;
		border-radius: 3px;
		background: var(--t-900);
		flex: 0 0 auto;
	}

	.bd {
		flex: 1;
		overflow-y: auto;
		padding: 8px 16px 24px;
	}
	.label {
		font-size: 11px;
		font-weight: 700;
		color: var(--t-label);
		letter-spacing: 0.6px;
		padding: 6px 4px 10px;
	}
	.arr {
		display: flex;
		align-items: center;
		gap: 12px;
		background: #fff;
		border: 1px solid var(--b-1);
		border-radius: 16px;
		padding: 14px 16px;
		margin-bottom: 10px;
		box-shadow: 0 6px 18px -16px rgba(19, 26, 23, 0.35);
	}
	.arr-mid {
		flex: 1;
		min-width: 0;
	}
	.arr-head {
		font-size: 14.5px;
		font-weight: 700;
		color: var(--t-900);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.arr-meta {
		display: flex;
		align-items: center;
		gap: 9px;
		font-size: 11.5px;
		font-weight: 600;
		color: var(--t-500);
		margin-top: 3px;
	}
	.arr-eta {
		font-size: 22px;
		font-weight: 700;
		flex: 0 0 auto;
	}
	.empty {
		padding: 28px 12px;
		text-align: center;
		font-size: 13px;
		font-weight: 600;
		color: var(--t-500);
	}
</style>
