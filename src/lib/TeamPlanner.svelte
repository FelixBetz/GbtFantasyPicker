<script lang="ts">
	import TeamCombinationsPanel from './TeamCombinationsPanel.svelte';
	import TeamPlayerList from './TeamPlayerList.svelte';
	import TeamSummaryPanel from './TeamSummaryPanel.svelte';
	import { Gender } from './player';
	import { onMount } from 'svelte';
	import { findTeamFillCombinations, Player, type TeamCombinationResult } from '$lib';

	type TeamPlannerProps = {
		players: Player[];
	};

	let { players }: TeamPlannerProps = $props();

	const COINS_BUDGET = 140;
	const MAX_TEAM_SIZE = 6;
	const MAX_COMBO_REMAINING_BUDGET = 50;
	const TEAM_STORAGE_KEY = 'gbt-fantasy-picker-team';
	const EXCLUDED_PLAYERS_STORAGE_KEY = 'gbt-fantasy-picker-excluded-players';
	const FILTERS_STORAGE_KEY = 'gbt-fantasy-picker-filters';

	let team = $state<Player[]>([]);
	let combinationResults = $state<TeamCombinationResult[] | null>(null);
	let maxGenderDifference = $state(0);
	let maxRemainingBudget = $state(0);
	let excludedPlayerIds = $state<number[]>([]);
	let hasLoadedStoredTeam = $state(false);

	onMount(() => {
		const storedTeam = localStorage.getItem(TEAM_STORAGE_KEY);

		if (storedTeam) {
			try {
				const storedIds = JSON.parse(storedTeam);

				if (Array.isArray(storedIds)) {
					team = restoreStoredTeam(storedIds);
				}
			} catch {
				localStorage.removeItem(TEAM_STORAGE_KEY);
			}
		}

		const storedExcludedPlayers = localStorage.getItem(EXCLUDED_PLAYERS_STORAGE_KEY);

		if (storedExcludedPlayers) {
			try {
				const storedIds = JSON.parse(storedExcludedPlayers);

				if (Array.isArray(storedIds)) {
					excludedPlayerIds = sanitizeExcludedPlayerIds(storedIds);
				}
			} catch {
				localStorage.removeItem(EXCLUDED_PLAYERS_STORAGE_KEY);
			}
		}

		const storedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);

		if (storedFilters) {
			try {
				const parsedFilters = JSON.parse(storedFilters);

				if (isValidGenderFilter(parsedFilters.genderFilter)) {
					genderFilter = parsedFilters.genderFilter;
				}

				if (isValidSortOrder(parsedFilters.sortOrder)) {
					sortOrder = parsedFilters.sortOrder;
				}

				if (typeof parsedFilters.maxGenderDifference === 'number') {
					maxGenderDifference = clamp(parsedFilters.maxGenderDifference, 0, MAX_TEAM_SIZE);
				}

				if (typeof parsedFilters.maxRemainingBudget === 'number') {
					const clampedBudget = clamp(
						parsedFilters.maxRemainingBudget,
						0,
						MAX_COMBO_REMAINING_BUDGET
					);
					maxRemainingBudget = Math.round(clampedBudget / 5) * 5;
				}
			} catch {
				localStorage.removeItem(FILTERS_STORAGE_KEY);
			}
		}

		hasLoadedStoredTeam = true;
	});

	type GenderFilter = 'all' | 'male' | 'female';
	type SortOrder = 'desc' | 'asc';

	let genderFilter = $state<GenderFilter>('all');
	let sortOrder = $state<SortOrder>('desc');

	const visiblePlayers = $derived.by(() => {
		return [...players]
			.filter((player) => {
				if (genderFilter === 'all') return true;
				if (genderFilter === 'male') return player.gender === Gender.Male;
				return player.gender === Gender.Female;
			})
			.sort((a, b) => (sortOrder === 'desc' ? b.coins - a.coins : a.coins - b.coins));
	});

	const teamCoins = $derived.by(() => {
		return team.reduce((sum, player) => sum + player.coins, 0);
	});

	const teamWomenCount = $derived.by(() => {
		return team.filter((player) => player.gender === Gender.Female).length;
	});

	const teamMenCount = $derived.by(() => {
		return team.filter((player) => player.gender === Gender.Male).length;
	});

	const teamGenderEmojis = $derived.by(() => {
		return `${'👩'.repeat(teamWomenCount)}${'👨'.repeat(teamMenCount)}`;
	});

	const filteredCombinationResults = $derived.by(() => {
		if (combinationResults === null) {
			return null;
		}

		return combinationResults.filter((combination) => {
			return (
				combination.genderDifference <= maxGenderDifference &&
				combination.remainingBudget <= maxRemainingBudget
			);
		});
	});

	$effect(() => {
		if (!hasLoadedStoredTeam) {
			return;
		}

		localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team.map((player) => player.id)));
	});

	$effect(() => {
		if (!hasLoadedStoredTeam) {
			return;
		}

		localStorage.setItem(EXCLUDED_PLAYERS_STORAGE_KEY, JSON.stringify(excludedPlayerIds));
	});

	$effect(() => {
		if (!hasLoadedStoredTeam) {
			return;
		}

		localStorage.setItem(
			FILTERS_STORAGE_KEY,
			JSON.stringify({
				genderFilter,
				sortOrder,
				maxGenderDifference,
				maxRemainingBudget
			})
		);
	});

	function restoreStoredTeam(storedIds: unknown[]): Player[] {
		const restoredTeam: Player[] = [];
		const seenIds = new Set<number>();
		let restoredCoins = 0;

		for (const storedId of storedIds) {
			if (typeof storedId !== 'number' || seenIds.has(storedId)) {
				continue;
			}

			const matchingPlayer = players.find((player) => player.id === storedId);

			if (!matchingPlayer) {
				continue;
			}

			if (
				restoredTeam.length >= MAX_TEAM_SIZE ||
				restoredCoins + matchingPlayer.coins > COINS_BUDGET
			) {
				continue;
			}

			restoredTeam.push(matchingPlayer);
			seenIds.add(storedId);
			restoredCoins += matchingPlayer.coins;
		}

		return restoredTeam;
	}

	function sanitizeExcludedPlayerIds(storedIds: unknown[]): number[] {
		const playerIds = new Set(players.map((player) => player.id));
		const teamIds = new Set(team.map((teamPlayer) => teamPlayer.id));
		const uniqueIds = new Set<number>();

		for (const storedId of storedIds) {
			if (typeof storedId !== 'number') {
				continue;
			}

			if (!playerIds.has(storedId) || teamIds.has(storedId)) {
				continue;
			}

			uniqueIds.add(storedId);
		}

		return [...uniqueIds];
	}

	function clamp(value: number, min: number, max: number): number {
		return Math.min(max, Math.max(min, value));
	}

	function isValidGenderFilter(value: unknown): value is GenderFilter {
		return value === 'all' || value === 'male' || value === 'female';
	}

	function isValidSortOrder(value: unknown): value is SortOrder {
		return value === 'asc' || value === 'desc';
	}

	function isPlayerInTeam(playerId: number): boolean {
		return team.some((teamPlayer) => teamPlayer.id === playerId);
	}

	function wouldExceedBudget(player: Player): boolean {
		return teamCoins + player.coins > COINS_BUDGET;
	}

	function addPlayerToTeam(player: Player) {
		if (isPlayerInTeam(player.id) || team.length >= MAX_TEAM_SIZE || wouldExceedBudget(player)) {
			return;
		}
		team = [...team, player];
		excludedPlayerIds = excludedPlayerIds.filter((excludedId) => excludedId !== player.id);
		combinationResults = null;
	}

	function removePlayerFromTeam(playerId: number) {
		team = team.filter((teamPlayer) => teamPlayer.id !== playerId);
		combinationResults = null;
	}

	function isPlayerExcluded(playerId: number): boolean {
		return excludedPlayerIds.includes(playerId);
	}

	function toggleExcludedPlayer(playerId: number) {
		if (isPlayerInTeam(playerId)) {
			return;
		}

		if (isPlayerExcluded(playerId)) {
			excludedPlayerIds = excludedPlayerIds.filter((excludedId) => excludedId !== playerId);
		} else {
			excludedPlayerIds = [...excludedPlayerIds, playerId];
		}

		combinationResults = null;
	}

	function clearExcludedPlayers() {
		excludedPlayerIds = [];
		combinationResults = null;
	}

	function searchTeamCombinations() {
		const excludedIds = new Set(excludedPlayerIds);

		combinationResults = findTeamFillCombinations({
			players: players.filter((player) => !excludedIds.has(player.id)),
			currentTeam: team,
			budget: COINS_BUDGET,
			maxTeamSize: MAX_TEAM_SIZE
		});
	}
</script>

<section class="mx-auto max-w-7xl px-4 py-4">
	<div
		class="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3"
	>
		<div class="min-w-[160px] flex-1">
			<label for="gender-filter" class="mb-1 block text-sm font-semibold text-stone-700"
				>Gender</label
			>
			<select
				id="gender-filter"
				bind:value={genderFilter}
				class="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm outline-none ring-0 focus:border-amber-400"
			>
				<option value="all">Alle</option>
				<option value="male">Male</option>
				<option value="female">Female</option>
			</select>
		</div>

		<div class="min-w-[160px] flex-1">
			<label for="coin-sort" class="mb-1 block text-sm font-semibold text-stone-700"
				>Coins Sortierung</label
			>
			<select
				id="coin-sort"
				bind:value={sortOrder}
				class="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm outline-none ring-0 focus:border-amber-400"
			>
				<option value="desc">Absteigend</option>
				<option value="asc">Aufsteigend</option>
			</select>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr_1fr]">
		<TeamPlayerList
			{visiblePlayers}
			teamLength={team.length}
			maxTeamSize={MAX_TEAM_SIZE}
			{isPlayerExcluded}
			{isPlayerInTeam}
			{wouldExceedBudget}
			onAddPlayer={addPlayerToTeam}
			onToggleExcluded={toggleExcludedPlayer}
		/>

		<TeamCombinationsPanel
			teamLength={team.length}
			maxTeamSize={MAX_TEAM_SIZE}
			excludedPlayersCount={excludedPlayerIds.length}
			{maxGenderDifference}
			{maxRemainingBudget}
			maxComboRemainingBudget={MAX_COMBO_REMAINING_BUDGET}
			{filteredCombinationResults}
			onClearExcludedPlayers={clearExcludedPlayers}
			onSearchTeamCombinations={searchTeamCombinations}
			onSetMaxGenderDifference={(value) => (maxGenderDifference = value)}
			onSetMaxRemainingBudget={(value) => (maxRemainingBudget = value)}
		/>

		<TeamSummaryPanel
			{team}
			{teamCoins}
			coinsBudget={COINS_BUDGET}
			maxTeamSize={MAX_TEAM_SIZE}
			{teamGenderEmojis}
			onRemovePlayer={removePlayerFromTeam}
		/>
	</div>
</section>
