<script lang="ts">
	import type { TeamCombinationResult } from './combinationSearch';

	type TeamCombinationsPanelProps = {
		teamLength: number;
		teamGamesPlayed: number;
		maxTeamSize: number;
		excludedPlayersCount: number;
		maxGenderDifference: number;
		maxRemainingBudget: number;
		maxComboRemainingBudget: number;
		filteredCombinationResults: TeamCombinationResult[] | null;
		totalCombinationCount: number | null;
		playerStatsById: Record<number, { gamesPlayed: number; wins: number }>;
		onClearExcludedPlayers: () => void;
		onSearchTeamCombinations: () => void;
		onSetMaxGenderDifference: (value: number) => void;
		onSetMaxRemainingBudget: (value: number) => void;
	};

	let {
		teamLength,
		teamGamesPlayed,
		maxTeamSize,
		excludedPlayersCount,
		maxGenderDifference,
		maxRemainingBudget,
		maxComboRemainingBudget,
		filteredCombinationResults,
		totalCombinationCount,
		playerStatsById,
		onClearExcludedPlayers,
		onSearchTeamCombinations,
		onSetMaxGenderDifference,
		onSetMaxRemainingBudget
	}: TeamCombinationsPanelProps = $props();

	function getStats(playerId: number) {
		return playerStatsById[playerId] ?? { gamesPlayed: 0, wins: 0 };
	}

	function getCombinationTeamGames(combination: TeamCombinationResult): number {
		const addedPlayersGames = combination.addedPlayers.reduce(
			(sum, player) => sum + getStats(player.id).gamesPlayed,
			0
		);

		return teamGamesPlayed + addedPlayersGames;
	}

	function handleGenderDifferenceInput(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		onSetMaxGenderDifference(value);
	}

	function handleRemainingBudgetInput(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		onSetMaxRemainingBudget(value);
	}
</script>

<aside class="h-fit rounded-xl border border-amber-200 bg-white p-4 shadow-sm xl:sticky xl:top-4">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-lg font-bold text-stone-800">Mögliche Kombos</h3>
		{#if filteredCombinationResults !== null}
			<span class="text-xs font-semibold text-stone-500">
				{filteredCombinationResults.length}{#if totalCombinationCount !== null}/ {totalCombinationCount}{/if}
			</span>
		{/if}
	</div>

	<div class="mb-4 space-y-4 rounded-lg border border-amber-100 bg-amber-50/60 p-3">
		<div
			class="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 py-2"
		>
			<p class="text-xs font-semibold text-stone-600">
				Ausgeschlossene Spieler: {excludedPlayersCount}
			</p>
			<button
				type="button"
				onclick={onClearExcludedPlayers}
				disabled={excludedPlayersCount === 0}
				class="rounded-md border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Reset X
			</button>
		</div>

		<div>
			<div class="mb-2 flex items-center justify-between gap-3">
				<label for="gender-difference" class="text-sm font-semibold text-stone-700">
					Max Gender Unterschied
				</label>
				<span class="text-sm font-bold text-amber-900">{maxGenderDifference}</span>
			</div>
			<input
				id="gender-difference"
				type="range"
				min="0"
				max="6"
				step="1"
				value={maxGenderDifference}
				oninput={handleGenderDifferenceInput}
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-amber-200"
			/>
		</div>

		<div>
			<div class="mb-2 flex items-center justify-between gap-3">
				<label for="remaining-budget" class="text-sm font-semibold text-stone-700">
					Max Restbudget
				</label>
				<span class="inline-flex items-center gap-1 text-sm font-bold text-amber-900">
					{maxRemainingBudget}
					<img src="/Coins.png" alt="Coins" class="h-4 w-4 object-contain" />
				</span>
			</div>
			<input
				id="remaining-budget"
				type="range"
				min="0"
				max={maxComboRemainingBudget}
				step="5"
				value={maxRemainingBudget}
				oninput={handleRemainingBudgetInput}
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-amber-200"
			/>
		</div>

		<button
			type="button"
			onclick={onSearchTeamCombinations}
			disabled={teamLength >= maxTeamSize}
			class="w-full rounded-lg bg-stone-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
		>
			Kombis finden
		</button>
	</div>

	{#if teamLength >= maxTeamSize}
		<p class="text-sm text-stone-500">Dein Team ist bereits voll.</p>
	{:else if filteredCombinationResults === null}
		<p class="text-sm text-stone-500">
			Finde alle Kombinationen, die dein aktuelles Team exakt auf 6 Spieler auffüllen.
		</p>
	{:else if filteredCombinationResults.length === 0}
		<p class="text-sm text-stone-500">
			Keine passenden Auffüll-Kombinationen für die aktuellen Filter gefunden.
		</p>
	{:else}
		<ul class="max-h-[44rem] space-y-2 overflow-y-auto pr-1">
			{#each filteredCombinationResults as combination}
				<li class="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
					<div class="mb-2 flex items-center justify-between gap-2">
						<p class="text-xs font-semibold uppercase tracking-wide text-stone-600">
							Restbudget: {combination.remainingBudget}
						</p>
						<p class="inline-flex items-center gap-1 text-sm font-bold text-amber-900">
							{combination.totalCoins}
							<img src="/Coins.png" alt="Coins" class="h-4 w-4 object-contain" />
						</p>
					</div>
					<div class="mb-2 flex items-center justify-between gap-2">
						<p class="text-lg leading-none">{combination.genderEmojiRow}</p>
						<p class="text-xs font-semibold text-stone-500">Diff: {combination.genderDifference}</p>
					</div>
					<p class="mb-2 text-xs font-semibold text-stone-600">
						Team-Spiele: {getCombinationTeamGames(combination)}
					</p>
					<ul class="space-y-1">
						{#each combination.addedPlayers as addedPlayer}
							{@const stats = getStats(addedPlayer.id)}
							<li class="flex items-center justify-between gap-2 text-sm text-stone-700">
								<span class="truncate">
									{addedPlayer.firstName}
									{addedPlayer.lastName}
									<span class="ml-1 text-xs font-semibold text-stone-500">
										(S: {stats.gamesPlayed} | W: {stats.wins})
									</span>
								</span>
								<span class="inline-flex shrink-0 items-center gap-1 font-semibold text-amber-900">
									{addedPlayer.coins}
									<img src="/Coins.png" alt="Coins" class="h-4 w-4 object-contain" />
								</span>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	{/if}
</aside>
