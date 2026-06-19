<script lang="ts">
	import { getContext } from 'svelte';
	import type { Planner } from '$lib/stores/planner.svelte';
	import Icon from '$lib/components/Icon.svelte';

	const planner = getContext<Planner>('planner');
</script>

<div class="screen">
	<header class="hd">
		<button class="back tp-tap" onclick={() => history.back()} aria-label="Kembali">
			<Icon name="chevron-left" size={20} stroke={2} />
		</button>
		<div class="sum">
			<div class="route">{planner.from || '—'} → {planner.to || '—'}</div>
			<div class="sub">Berangkat sekarang · {planner.options.length} rute</div>
		</div>
	</header>
	<div class="bd">
		<div class="wip">
			<div class="wip-title">🗂️ Layar Route Options — menyusul</div>
			<div class="wip-sub">{planner.options.length} opsi ke-generate dari planTrips()</div>
		</div>
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
	}
	.route {
		font-size: 14px;
		font-weight: 700;
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
	.bd {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
	}
	.wip {
		background: #fff;
		border: 1px solid var(--b-1);
		border-radius: 16px;
		padding: 18px;
	}
	.wip-title {
		font-size: 15px;
		font-weight: 800;
		color: var(--t-900);
		margin-bottom: 6px;
	}
	.wip-sub {
		font-size: 13px;
		font-weight: 600;
		color: var(--t-600);
	}
</style>
