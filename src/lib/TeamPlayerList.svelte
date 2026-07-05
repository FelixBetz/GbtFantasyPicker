<script lang="ts">
	import { Player } from './player';

	type TeamPlayerListProps = {
		visiblePlayers: Player[];
		teamLength: number;
		maxTeamSize: number;
		isPlayerExcluded: (playerId: number) => boolean;
		isPlayerInTeam: (playerId: number) => boolean;
		wouldExceedBudget: (player: Player) => boolean;
		onAddPlayer: (player: Player) => void;
		onToggleExcluded: (playerId: number) => void;
	};

	let {
		visiblePlayers,
		teamLength,
		maxTeamSize,
		isPlayerExcluded,
		isPlayerInTeam,
		wouldExceedBudget,
		onAddPlayer,
		onToggleExcluded
	}: TeamPlayerListProps = $props();
</script>

<section class="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-lg font-bold text-stone-800">Spieler</h3>
		<span class="text-sm font-semibold text-stone-500">{visiblePlayers.length}</span>
	</div>
	<ul class="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-1">
		{#each visiblePlayers as player}
			<li>
				<div
					class={`grid grid-cols-[1fr_auto] items-start gap-2 rounded-xl border p-1 shadow-sm ${
						isPlayerExcluded(player.id)
							? 'border-rose-300 bg-rose-100'
							: 'border-amber-100 bg-gradient-to-r from-amber-50 to-white'
					}`}
				>
					<button
						type="button"
						onclick={() => onAddPlayer(player)}
						disabled={isPlayerInTeam(player.id) ||
							teamLength >= maxTeamSize ||
							wouldExceedBudget(player)}
						class="grid w-full grid-cols-[56px_1fr] items-center gap-x-2 gap-y-1 rounded-lg px-1 py-1 text-left transition hover:border-amber-300 hover:shadow md:grid-cols-[70px_1fr_auto] md:gap-y-0 disabled:cursor-not-allowed disabled:opacity-60"
					>
						<img
							class="h-14 w-14 rounded-full bg-amber-100 object-cover"
							src={player.imgurl}
							alt={`${player.firstName} ${player.lastName}`}
						/>
						<div>
							<h2 class="m-0 text-base font-bold leading-tight text-stone-800 sm:text-[1.05rem]">
								{player.firstName}
								{player.lastName}
							</h2>
							{#if isPlayerInTeam(player.id)}
								<p class="m-0 mt-1 text-xs font-semibold text-emerald-700">Im Team</p>
							{:else if wouldExceedBudget(player)}
								<p class="m-0 mt-1 text-xs font-semibold text-rose-700">Über Budget</p>
							{:else if isPlayerExcluded(player.id)}
								<p class="m-0 mt-1 text-xs font-semibold text-rose-700">
									Für Kombis ausgeschlossen
								</p>
							{/if}
						</div>
						<p
							class="m-0 inline-flex w-fit items-center gap-2 justify-self-start py-1 text-lg font-bold text-amber-900 md:justify-self-end"
						>
							<span>{player.coins}</span>
							<img src="/Coins.png" alt="Coins" class="h-8 w-8 object-contain" />
						</p>
					</button>

					<button
						type="button"
						onclick={() => onToggleExcluded(player.id)}
						disabled={isPlayerInTeam(player.id)}
						class={`mt-1 rounded-md border px-2 py-1 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
							isPlayerExcluded(player.id)
								? 'border-rose-400 bg-rose-100 text-rose-800'
								: 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
						}`}
						title="Spieler für Kombi-Suche ausschließen"
					>
						X
					</button>
				</div>
			</li>
		{/each}
	</ul>
</section>
