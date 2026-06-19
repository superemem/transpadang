<script lang="ts">
	let { children } = $props();
</script>

<div class="backdrop">
	<div class="frame">
		{@render children()}
	</div>
</div>

<style>
	.backdrop {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: radial-gradient(120% 80% at 50% -10%, var(--backdrop-a) 0%, var(--backdrop-b) 55%);
	}
	.frame {
		position: relative;
		width: 100%;
		max-width: 468px;
		height: 100dvh;
		max-height: 940px;
		background: var(--canvas);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 40px 90px -20px rgba(0, 0, 0, 0.55);
	}
	/* phone-card look di desktop */
	@media (min-width: 500px) {
		.frame {
			border-radius: 26px;
		}
	}
</style>
