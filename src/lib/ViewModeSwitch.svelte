<script lang="ts">
	type ViewMode = 'team' | 'bracket-men' | 'bracket-women';

	type ViewModeSwitchProps = {
		activeView: ViewMode;
		onChange: (mode: ViewMode) => void;
	};

	let { activeView, onChange }: ViewModeSwitchProps = $props();
</script>

<section class="mx-auto max-w-7xl px-4 pt-8">
	<div class="mb-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
		<p class="mb-2 text-sm font-semibold text-stone-700">Ansicht</p>
		<div class="inline-flex rounded-lg border border-amber-200 bg-white p-1 shadow-sm">
			<button
				type="button"
				onclick={() => onChange('team')}
				class={`rounded-md px-3 py-2 text-sm font-semibold transition ${
					activeView === 'team' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-amber-50'
				}`}
			>
				Team
			</button>
			<button
				type="button"
				onclick={() => onChange('bracket-men')}
				class={`rounded-md px-3 py-2 text-sm font-semibold transition ${
					activeView === 'bracket-men'
						? 'bg-stone-900 text-white'
						: 'text-stone-700 hover:bg-amber-50'
				}`}
			>
				Spielplan Männer
			</button>
			<button
				type="button"
				onclick={() => onChange('bracket-women')}
				class={`rounded-md px-3 py-2 text-sm font-semibold transition ${
					activeView === 'bracket-women'
						? 'bg-stone-900 text-white'
						: 'text-stone-700 hover:bg-amber-50'
				}`}
			>
				Spielplan Frauen
			</button>
		</div>
	</div>
</section>
