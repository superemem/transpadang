<script lang="ts">
	let { size = 6, color = 'var(--green)' }: { size?: number; color?: string } = $props();
</script>

<span class="dot" style="width:{size}px;height:{size}px;background:{color};"></span>

<style>
	.dot {
		display: inline-block;
		border-radius: 50%;
		flex: 0 0 auto;
		animation: tp-live 1.6s ease infinite;
	}
</style>
