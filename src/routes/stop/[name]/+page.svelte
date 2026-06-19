<script lang="ts">
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import type { Planner } from '$lib/stores/planner.svelte';
	import { etaText, etaColor } from '$lib/format';
	import Icon from '$lib/components/Icon.svelte';
	import LiveDot from '$lib/components/LiveDot.svelte';
	import CorridorBadge from '$lib/components/CorridorBadge.svelte';

	const planner = getContext<Planner>('planner');
	const stopName = $derived(planner.boardStop || decodeURIComponent(page.params.name ?? ''));
	const sorted = $derived([...planner.board].sort((a, b) => a.sec - b.sec));
</script>

<div class="screen">
	<header class="hd">
		<button class="back tp-tap" onclick={() => history.back()} aria-label="Kembali">
			<Icon name="chevron-left" size={20} stroke={2} />
		</button>
		<div class="sum">
			<div class="ttl">{stopName}</div>
			<div class="sub">Halte · {planner.board.length} jadwal</div>
		</div>
		<span class="live-tag"><LiveDot size={6} /> Live</span>
	</header>
	<div class="bd">
		<div class="label">KEDATANGAN BERIKUTNYA</div>
		{#each sorted as a (a.headsign + a.bus)}
			<div class="arr">
				<CorridorBadge corridor={a.corridor} size="lg" />
				<div class="arr-mid">
					<div class="arr-head">{a.headsign}</div>
					<div class="arr-meta">Bus {a.bus}</div>
				</div>
				<div class="arr-eta tpnum" style="color:{etaColor(a.sec)};">{etaText(a.sec, true)}</div>
			</div>
		{:else}
			<div class="wip">Buka halte ini dari Home buat lihat live arrivals.</div>
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
	.sub {
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
	.bd {
		flex: 1;
		overflow-y: auto;
		padding: 14px 16px 24px;
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
		font-size: 11.5px;
		font-weight: 600;
		color: var(--t-500);
		margin-top: 2px;
	}
	.arr-eta {
		font-size: 22px;
		font-weight: 700;
		flex: 0 0 auto;
	}
	.wip {
		background: #fff;
		border: 1px solid var(--b-1);
		border-radius: 16px;
		padding: 18px;
		font-size: 13px;
		font-weight: 600;
		color: var(--t-600);
	}
</style>
