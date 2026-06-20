<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Planner } from '$lib/stores/planner.svelte';
	import { etaText } from '$lib/format';
	import Icon from '$lib/components/Icon.svelte';
	import LiveDot from '$lib/components/LiveDot.svelte';
	import CorridorBadge from '$lib/components/CorridorBadge.svelte';
	import OccupancyDots from '$lib/components/OccupancyDots.svelte';

	const planner = getContext<Planner>('planner');
	const opt = $derived(planner.selectedOption);
	const firstBus = $derived(opt?.legs?.find((l: any) => l.type === 'bus'));

	// bangun track skematik dari urutan leg
	const track = $derived.by(() => {
		const legs = opt?.legs ?? [];
		const items: any[] = [{ kind: 'origin' }];
		let firstBusUsed = false;
		for (let i = 0; i < legs.length; i++) {
			const l = legs[i];
			if (l.type === 'transfer') {
				items.push({ kind: 'transfer' });
				continue;
			}
			if (l.type === 'walk') {
				items.push({ kind: 'walk', grow: Math.max(1, l.min) });
			} else {
				items.push({ kind: 'bus', grow: Math.max(2, l.rideMin), color: l.color, corridor: l.corridor, first: !firstBusUsed });
				firstBusUsed = true;
			}
			const next = legs[i + 1];
			if (next && next.type !== 'transfer' && i < legs.length - 1) items.push({ kind: 'stop' });
		}
		items.push({ kind: 'dest' });
		return items;
	});
</script>

{#if !opt}
	<div class="screen empty-screen">
		<p>Belum ada rute dipilih.</p>
		<button class="cta" onclick={() => goto('/')}>Ke beranda</button>
	</div>
{:else}
	<div class="screen">
		<header class="hd">
			<button class="back tp-tap" onclick={() => history.back()} aria-label="Kembali">
				<Icon name="chevron-left" size={20} stroke={2} />
			</button>
			<div class="sum">
				<div class="ttl">Rincian perjalanan</div>
				<div class="subline tpnum">{opt.departTime} – {opt.arriveTime} · {opt.totalMin} mnt</div>
			</div>
		</header>

		<div class="bd">
			<!-- schematic route map -->
			<div class="map">
				<div class="map-head">
					<span class="map-title">Peta rute</span>
					<span class="sk"><LiveDot size={5} /> Skematik</span>
				</div>
				<div class="trk">
					{#each track as it, i (i)}
						{#if it.kind === 'origin'}
							<span class="n-origin"></span>
						{:else if it.kind === 'dest'}
							<span class="n-dest"></span>
						{:else if it.kind === 'stop'}
							<span class="n-stop"></span>
						{:else if it.kind === 'transfer'}
							<span class="n-transfer"><Icon name="transfer" size={10} stroke={2} /></span>
						{:else if it.kind === 'walk'}
							<span class="seg-walk" style="flex-grow:{it.grow};"></span>
						{:else}
							<span class="seg-bus" style="flex-grow:{it.grow};background:{it.color};">
								<span class="seg-k" style="background:{it.color};">{it.corridor}</span>
								{#if it.first}<span class="marker" style="border-color:{it.color};"></span>{/if}
							</span>
						{/if}
					{/each}
				</div>
				<div class="map-foot">
					<span class="mf-from">{firstBus?.boardStop ?? planner.from}</span>
					<span class="mf-to">{planner.to}</span>
				</div>
			</div>

			<!-- live boarding banner -->
			{#if firstBus}
				<div class="banner">
					<div class="bn-top"><LiveDot size={6} color="#fff" /> LANGSUNG</div>
					<div class="bn-row">
						<div class="bn-l">
							<div class="bn-bus">Bus {firstBus.corridor} · {firstBus.bus}</div>
							<div class="bn-sub">menuju Halte {firstBus.boardStop}</div>
						</div>
						<div class="bn-r">
							<div class="bn-eta tpnum">{etaText(planner.busEtaSec, true)}</div>
							<div class="bn-cap">perkiraan tiba</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- timeline -->
			<div class="tl">
				{#each opt.legs as l, i (i)}
					{#if l.type === 'walk'}
						<div class="leg">
							<div class="rail"><span class="dot walk"></span><span class="line grey"></span></div>
							<div class="content">
								<div class="tile"><Icon name="walker" size={16} /></div>
								<div>
									<div class="lt">Jalan ke {l.toLabel}</div>
									<div class="ls">{l.min} mnt · {l.meters} m</div>
								</div>
							</div>
						</div>
					{:else if l.type === 'transfer'}
						<div class="leg">
							<div class="rail"><span class="dot tf"></span><span class="line grey"></span></div>
							<div class="content">
								<div class="tile tf-tile"><Icon name="transfer" size={16} /></div>
								<div>
									<div class="lt">Transit di {l.atStop}</div>
									<div class="ls">{l.note} · {l.min} mnt</div>
								</div>
							</div>
						</div>
					{:else}
						<div class="leg">
							<div class="rail"><span class="dot" style="background:{l.color};"></span><span class="line" style="background:{l.color};"></span></div>
							<div class="content">
								<div class="buscard">
									<div class="bc-head">
										<CorridorBadge corridor={l.corridor} size="md" bus />
										<div class="bc-mid">
											<div class="bc-head-sign">{l.headsign}</div>
											<div class="bc-bus">Bus {l.bus}</div>
										</div>
										<OccupancyDots occ={l.occ} layout="col" />
									</div>
									<button type="button" class="exp tp-tap" onclick={() => planner.toggleLeg(i)}>
										<span>Melewati {l.stopsCount} halte · ~{l.rideMin} mnt</span>
										<span class="chev" class:open={planner.expanded[i]}><Icon name="chevron-down" size={16} stroke={2} /></span>
									</button>
									{#if planner.expanded[i]}
										<div class="mids">
											{#each l.midStops as m (m)}
												<div class="mid"><span class="mid-dot"></span> {m}</div>
											{/each}
											<div class="mid alight"><span class="mid-dot"></span> Turun: {l.alightStop}</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/if}
				{/each}
				<!-- arrive -->
				<div class="leg">
					<div class="rail"><span class="dot dest"></span></div>
					<div class="content">
						<div class="tile dest-tile"><Icon name="flag" size={16} /></div>
						<div>
							<div class="lt strong">Tiba di {planner.to}</div>
							<div class="ls">Tujuan kamu</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="cta-wrap">
			<button class="cta" onclick={() => (planner.started = !planner.started)}>
				{planner.started ? 'Sedang dalam perjalanan…' : 'Mulai perjalanan'}
			</button>
		</div>
	</div>
{/if}

<style>
	.screen {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
	}
	.empty-screen {
		align-items: center;
		justify-content: center;
		gap: 16px;
		color: var(--t-600);
		font-weight: 600;
	}
	.hd {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px 12px;
		background: #fff;
		border-bottom: 1px solid var(--b-2);
		flex: 0 0 auto;
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
	.ttl {
		font-size: 15px;
		font-weight: 800;
		color: var(--t-900);
	}
	.subline {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--t-500);
	}
	.bd {
		flex: 1;
		overflow-y: auto;
		padding: 16px 16px 110px;
	}

	/* schematic map */
	.map {
		background: #fff;
		border: 1px solid var(--b-1);
		border-radius: 18px;
		padding: 15px 17px 14px;
		background-image: radial-gradient(#e6ebe5 1.1px, transparent 1.1px);
		background-size: 13px 13px;
	}
	.map-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}
	.map-title {
		font-size: 12.5px;
		font-weight: 800;
		color: var(--t-900);
	}
	.sk {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 10.5px;
		font-weight: 700;
		color: var(--green);
		background: var(--mint);
		padding: 3px 8px;
		border-radius: 999px;
	}
	.trk {
		display: flex;
		align-items: center;
		gap: 2px;
		height: 18px;
		margin: 14px 0;
	}
	.n-origin {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		border: 4px solid var(--green);
		background: #fff;
		flex: 0 0 auto;
	}
	.n-dest {
		width: 15px;
		height: 15px;
		border-radius: 5px;
		background: var(--t-900);
		flex: 0 0 auto;
	}
	.n-stop {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 2.5px solid var(--b-7);
		background: #fff;
		flex: 0 0 auto;
	}
	.n-transfer {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #fff4e6;
		border: 2px solid #f2790d;
		color: #f2790d;
		display: grid;
		place-items: center;
		flex: 0 0 auto;
	}
	.seg-walk {
		height: 3px;
		background: repeating-linear-gradient(90deg, #c2c9c1 0 5px, transparent 5px 10px);
		min-width: 14px;
	}
	.seg-bus {
		position: relative;
		height: 7px;
		border-radius: 4px;
		min-width: 30px;
	}
	.seg-k {
		position: absolute;
		top: -20px;
		left: 50%;
		transform: translateX(-50%);
		color: #fff;
		font-size: 10px;
		font-weight: 700;
		padding: 1px 6px;
		border-radius: 5px;
	}
	.marker {
		position: absolute;
		top: 50%;
		width: 14px;
		height: 14px;
		margin-top: -7px;
		border-radius: 50%;
		background: #fff;
		border: 3px solid;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
		animation: tp-bus-move 2.8s ease-in-out infinite alternate;
	}
	.map-foot {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
	.mf-from,
	.mf-to {
		font-size: 11px;
		font-weight: 700;
		max-width: 46%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.mf-from {
		color: var(--t-600);
	}
	.mf-to {
		color: var(--t-900);
		text-align: right;
	}

	/* live boarding banner */
	.banner {
		margin-top: 14px;
		background: linear-gradient(135deg, #0e9f6e, #0b855c);
		border-radius: 18px;
		padding: 16px 18px;
		box-shadow: 0 12px 28px -14px rgba(14, 159, 110, 0.7);
		color: #fff;
	}
	.bn-top {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.4px;
		color: rgba(255, 255, 255, 0.85);
	}
	.bn-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
		margin-top: 8px;
	}
	.bn-bus {
		font-size: 15px;
		font-weight: 700;
	}
	.bn-sub {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.78);
		margin-top: 2px;
	}
	.bn-r {
		text-align: right;
		flex: 0 0 auto;
	}
	.bn-eta {
		font-size: 30px;
		font-weight: 700;
		line-height: 1;
	}
	.bn-cap {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 3px;
	}

	/* timeline */
	.tl {
		margin-top: 18px;
	}
	.leg {
		display: flex;
		gap: 12px;
	}
	.rail {
		width: 24px;
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.dot {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		flex: 0 0 auto;
		margin-top: 4px;
	}
	.dot.walk {
		background: var(--b-8);
	}
	.dot.tf {
		background: #f2790d;
	}
	.dot.dest {
		background: var(--t-900);
		border-radius: 4px;
	}
	.line {
		flex: 1;
		width: 3px;
		margin: 3px 0;
		border-radius: 2px;
		background: var(--green);
	}
	.line.grey {
		background: var(--b-6);
	}
	.content {
		flex: 1;
		min-width: 0;
		display: flex;
		gap: 12px;
		padding-bottom: 18px;
	}
	.tile {
		width: 30px;
		height: 30px;
		border-radius: 9px;
		background: #fff;
		border: 1px solid var(--b-1);
		color: var(--t-600);
		display: grid;
		place-items: center;
		flex: 0 0 auto;
	}
	.tf-tile {
		background: #fff4e6;
		border-color: #fde2c0;
		color: #f2790d;
	}
	.dest-tile {
		background: var(--t-900);
		border-color: var(--t-900);
		color: #fff;
	}
	.lt {
		font-size: 14px;
		font-weight: 700;
		color: var(--t-900);
	}
	.lt.strong {
		font-weight: 800;
	}
	.ls {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--t-500);
		margin-top: 2px;
	}

	.buscard {
		flex: 1;
		min-width: 0;
		background: #fff;
		border: 1px solid var(--b-1);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 6px 18px -16px rgba(19, 26, 23, 0.4);
	}
	.bc-head {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 13px 15px;
	}
	.bc-mid {
		flex: 1;
		min-width: 0;
	}
	.bc-head-sign {
		font-size: 13.5px;
		font-weight: 700;
		color: var(--t-900);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.bc-bus {
		font-size: 11.5px;
		font-weight: 600;
		color: var(--t-500);
		margin-top: 2px;
	}
	.exp {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--inset);
		border: none;
		border-top: 1px solid var(--b-4);
		padding: 11px 15px;
		font-size: 12.5px;
		font-weight: 700;
		color: var(--t-600);
		cursor: pointer;
	}
	.chev {
		display: inline-flex;
		transition: transform 0.2s;
	}
	.chev.open {
		transform: rotate(180deg);
	}
	.mids {
		padding: 6px 15px 13px;
	}
	.mid {
		display: flex;
		align-items: center;
		gap: 9px;
		font-size: 12.5px;
		font-weight: 600;
		color: var(--t-600);
		padding: 4px 0;
	}
	.mid-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		border: 2px solid var(--b-7);
		flex: 0 0 auto;
	}
	.mid.alight {
		color: var(--t-900);
		font-weight: 700;
	}

	/* CTA */
	.cta-wrap {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 14px 18px 18px;
		background: linear-gradient(to top, var(--canvas) 72%, transparent);
		pointer-events: none; /* biar area fade gak nangkep klik konten di belakangnya */
	}
	.cta {
		width: 100%;
		pointer-events: auto;
		background: var(--t-900);
		color: #fff;
		font-size: 15px;
		font-weight: 700;
		border: none;
		border-radius: 15px;
		padding: 16px;
		box-shadow: 0 10px 24px -10px rgba(19, 26, 23, 0.6);
		cursor: pointer;
	}
</style>
