<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Planner } from '$lib/stores/planner.svelte';
	import Icon from '$lib/components/Icon.svelte';

	const planner = getContext<Planner>('planner');

	function open(id: string) {
		planner.selectOption(id);
		goto('/trip');
	}
	function swap() {
		planner.swap();
	}
	const departHint = (n: number) => (n <= 1 ? 'Berangkat sekarang' : `Berangkat ${n} mnt lagi`);
	// leg sequence buat ribbon (walk + bus, transfer jadi pemisah implisit)
	const ribbon = (legs: any[]) => legs.filter((l) => l.type !== 'transfer');
</script>

<div class="screen">
	<header class="hd">
		<button class="back tp-tap" onclick={() => history.back()} aria-label="Kembali">
			<Icon name="chevron-left" size={20} stroke={2} />
		</button>
		<div class="sum">
			<div class="route">
				<span class="rt">{planner.from || '—'}</span>
				<span class="arr">→</span>
				<span class="rt">{planner.to || '—'}</span>
			</div>
			<div class="subline">Berangkat sekarang · {planner.options.length} rute</div>
		</div>
		<button class="back tp-tap" onclick={swap} aria-label="Tukar"><Icon name="swap" size={18} /></button>
	</header>

	<div class="bd">
		{#each planner.options as o (o.id)}
			<button class="card tp-tap" class:rec={o.recommended} onclick={() => open(o.id)}>
				<div class="top">
					<div class="top-l">
						<span class="tag" class:tag-rec={o.recommended}>
							{o.recommended ? 'Pilihan terbaik' : o.tag}
						</span>
						<span class="depart">{departHint(o.departIn)}</span>
					</div>
					<span class="total tpnum">{o.totalMin} mnt</span>
				</div>

				<div class="ribbon">
					{#each ribbon(o.legs) as l, idx (idx)}
						{#if idx > 0}<span class="sep"><Icon name="chevron-right" size={13} stroke={2} /></span>{/if}
						{#if l.type === 'walk'}
							<span class="walk"><Icon name="walker" size={15} /> {l.min}</span>
						{:else}
							<span class="busp" style="background:{l.color};"><Icon name="bus" size={13} stroke={1.9} /> {l.corridor}</span>
						{/if}
					{/each}
				</div>

				<div class="foot">
					<span class="fitem"><Icon name="clock" size={13} /> Tiba {o.arriveTime}</span>
					<span class="fitem">{o.transfers === 0 ? 'Tanpa transit' : `${o.transfers}× transit`}</span>
					<span class="fitem walkt">{o.walkMin} mnt jalan</span>
				</div>
			</button>
		{:else}
			<div class="empty">
				{#if planner.from && planner.to}
					Rute dari "{planner.from}" ke "{planner.to}" belum ketemu. Coba tujuan lain.
				{:else}
					Pilih asal & tujuan dulu.
				{/if}
			</div>
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
		gap: 10px;
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
		flex: 1;
		min-width: 0;
	}
	.route {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 14px;
		font-weight: 700;
		color: var(--t-900);
	}
	.rt {
		max-width: 42%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.arr {
		color: var(--t-400);
		flex: 0 0 auto;
	}
	.subline {
		font-size: 12px;
		font-weight: 600;
		color: var(--t-500);
		margin-top: 1px;
	}

	.bd {
		flex: 1;
		overflow-y: auto;
		padding: 14px 16px 24px;
	}
	.card {
		width: 100%;
		display: block;
		text-align: left;
		background: #fff;
		border: 1.5px solid var(--b-2);
		border-radius: 20px;
		padding: 16px 17px;
		margin-bottom: 13px;
		box-shadow: 0 8px 22px -16px rgba(19, 26, 23, 0.4);
		cursor: pointer;
	}
	.card.rec {
		border-color: var(--b-rec);
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
	}
	.top-l {
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-width: 0;
	}
	.tag {
		align-self: flex-start;
		font-size: 11px;
		font-weight: 700;
		padding: 4px 9px;
		border-radius: 7px;
		color: var(--t-600);
		background: var(--b-4);
	}
	.tag-rec {
		color: var(--green);
		background: var(--mint);
	}
	.depart {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--t-500);
	}
	.total {
		font-size: 21px;
		font-weight: 700;
		color: var(--t-900);
		flex: 0 0 auto;
	}

	.ribbon {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		margin: 13px 0;
	}
	.walk {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 12.5px;
		font-weight: 700;
		color: var(--t-500);
	}
	.busp {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 5px 10px;
		border-radius: 9px;
		color: #fff;
		font-size: 12.5px;
		font-weight: 700;
	}
	.sep {
		color: #cdd4cd;
		display: inline-flex;
	}

	.foot {
		display: flex;
		align-items: center;
		gap: 14px;
		padding-top: 13px;
		border-top: 1px solid var(--b-4);
		font-size: 12px;
		font-weight: 600;
		color: var(--t-600);
	}
	.fitem {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.walkt {
		margin-left: auto;
	}
	.empty {
		padding: 28px 12px;
		text-align: center;
		font-size: 13px;
		font-weight: 600;
		color: var(--t-500);
	}
</style>
