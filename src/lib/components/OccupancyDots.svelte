<script lang="ts">
	import { OCC_LABEL, OCC_COLOR, OCC_EMPTY } from '$lib/format';

	let {
		occ,
		w = 5,
		h = 11,
		showLabel = true,
		layout = 'col'
	}: { occ: number; w?: number; h?: number; showLabel?: boolean; layout?: 'col' | 'row' } = $props();
</script>

<div class="wrap {layout}">
	<div class="bars">
		{#each [0, 1, 2] as i (i)}
			<span
				class="bar"
				style="width:{w}px;height:{h}px;background:{i <= occ ? OCC_COLOR[occ] : OCC_EMPTY};"
			></span>
		{/each}
	</div>
	{#if showLabel}<span class="label" style="color:{OCC_COLOR[occ]};">{OCC_LABEL[occ]}</span>{/if}
</div>

<style>
	.wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.wrap.col {
		flex-direction: column;
		gap: 3px;
		align-items: flex-end;
	}
	.bars {
		display: flex;
		align-items: flex-end;
		gap: 2px;
	}
	.bar {
		border-radius: 2px;
		display: block;
	}
	.label {
		font-size: 10px;
		font-weight: 700;
		line-height: 1;
	}
</style>
