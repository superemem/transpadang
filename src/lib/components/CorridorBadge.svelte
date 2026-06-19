<script lang="ts">
	import { corridorById } from '$lib/data.js';
	import Icon from './Icon.svelte';

	let {
		corridor,
		size = 'sm',
		bus = false
	}: { corridor: string; size?: 'xs' | 'sm' | 'md' | 'lg'; bus?: boolean } = $props();

	const color = $derived(corridorById(corridor)?.color ?? 'var(--k1)');
</script>

<span class="badge {size}" style="background:{color};">
	{#if bus}<Icon name="bus" size={size === 'lg' ? 15 : 13} stroke={1.9} />{/if}
	<span>{corridor}</span>
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		color: #fff;
		font-weight: 700;
		line-height: 1;
		white-space: nowrap;
		flex: 0 0 auto;
	}
	.xs {
		padding: 2px 5px;
		border-radius: 5px;
		font-size: 10px;
	}
	.sm {
		min-width: 34px;
		height: 24px;
		padding: 0 7px;
		border-radius: 7px;
		font-size: 12px;
	}
	.md {
		padding: 6px 11px;
		border-radius: 10px;
		font-size: 13px;
	}
	.lg {
		width: 42px;
		height: 42px;
		border-radius: 12px;
		font-size: 15px;
	}
</style>
