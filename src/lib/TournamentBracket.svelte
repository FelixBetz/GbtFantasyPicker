<script lang="ts">
	import { onMount } from 'svelte';
	import type { Player } from './player';

	type BracketKind = 'men' | 'women';
	type TeamRef =
		| { kind: 'team'; teamId: number }
		| { kind: 'winner'; game: number }
		| { kind: 'loser'; game: number };

	type TeamEntry = {
		id: number;
		label: string;
		playerIds: number[];
	};

	type MatchState = {
		game: number;
		time: string;
		teamARef: TeamRef;
		teamBRef: TeamRef;
		winnerTeamId: number | null;
		title?: string;
		isFinal?: boolean;
	};

	type PlayerStats = {
		gamesPlayed: number;
		wins: number;
	};

	type BracketStatsPayload = {
		bracket: BracketKind;
		stats: Record<number, PlayerStats>;
	};

	type TournamentBracketProps = {
		players: Player[];
		lockedBracket?: BracketKind | null;
		onStatsChange?: (payload: BracketStatsPayload) => void;
	};

	let { players, lockedBracket = null, onStatsChange }: TournamentBracketProps = $props();

	const ROUND_COLUMN_GAME_IDS = {
		roundOf16Winners: [1, 2, 3, 4],
		quarterWinners: [7, 8],
		center: [11, 13, 12],
		quarterLosers: [9, 10],
		roundOf16Losers: [5, 6]
	} as const;

	const ROUND_TITLES = {
		roundOf16Winners: 'Achtelfinale Winner',
		quarterWinners: 'Viertelfinale Winner',
		center: 'Halbfinale & Finale',
		quarterLosers: 'Viertelfinale Loser',
		roundOf16Losers: 'Achtelfinale Loser'
	};

	const STORAGE_KEYS: Record<BracketKind, string> = {
		men: 'gbt-bracket-results-men',
		women: 'gbt-bracket-results-women'
	};

	function toShortName(player: Player): string {
		const initial = player.firstName?.trim().charAt(0).toUpperCase();
		const lastName = player.lastName?.trim();

		if (!initial && !lastName) {
			return 'TBD';
		}

		if (!lastName) {
			return `${initial}.`;
		}

		return `${initial}. ${lastName}`;
	}

	function buildTeams(startIndex: number): TeamEntry[] {
		return Array.from({ length: 8 }, (_, teamIndex) => {
			const firstPlayer = players[startIndex + teamIndex * 2];
			const secondPlayer = players[startIndex + teamIndex * 2 + 1];
			const playerIds = [firstPlayer?.id, secondPlayer?.id].filter(
				(id): id is number => typeof id === 'number'
			);

			if (!firstPlayer || !secondPlayer) {
				return {
					id: teamIndex + 1,
					label: `Team ${teamIndex + 1}`,
					playerIds
				};
			}

			return {
				id: teamIndex + 1,
				label: `${toShortName(firstPlayer)} / ${toShortName(secondPlayer)}`,
				playerIds
			};
		});
	}

	function createInitialMatches(teams: TeamEntry[]): MatchState[] {
		const seedMatchups: [number, number, number, string][] = [
			[1, 1, 8, 'Fr, 20:30'],
			[2, 4, 5, 'Fr, 17:15'],
			[3, 3, 6, 'Fr, 16:15'],
			[4, 2, 7, 'Fr, 21:30']
		];

		const openingMatches = seedMatchups.map(([game, seedA, seedB, time]) => {
			const teamA = teams[seedA - 1];
			const teamB = teams[seedB - 1];

			return {
				game,
				time,
				teamARef: { kind: 'team', teamId: teamA?.id ?? seedA },
				teamBRef: { kind: 'team', teamId: teamB?.id ?? seedB },
				winnerTeamId: null
			} satisfies MatchState;
		});

		return [
			...openingMatches,
			{
				game: 5,
				time: 'Sa, 11:30',
				teamARef: { kind: 'loser', game: 1 },
				teamBRef: { kind: 'loser', game: 2 },
				winnerTeamId: null
			},
			{
				game: 6,
				time: 'Sa, 12:30',
				teamARef: { kind: 'loser', game: 3 },
				teamBRef: { kind: 'loser', game: 4 },
				winnerTeamId: null
			},
			{
				game: 7,
				time: 'Sa, 15:30',
				teamARef: { kind: 'winner', game: 1 },
				teamBRef: { kind: 'winner', game: 2 },
				winnerTeamId: null
			},
			{
				game: 8,
				time: 'Sa, 16:30',
				teamARef: { kind: 'winner', game: 3 },
				teamBRef: { kind: 'winner', game: 4 },
				winnerTeamId: null
			},
			{
				game: 9,
				time: 'Sa, 21:00',
				teamARef: { kind: 'winner', game: 5 },
				teamBRef: { kind: 'loser', game: 8 },
				winnerTeamId: null
			},
			{
				game: 10,
				time: 'Sa, 20:00',
				teamARef: { kind: 'winner', game: 6 },
				teamBRef: { kind: 'loser', game: 7 },
				winnerTeamId: null
			},
			{
				game: 11,
				time: 'So, 12:00',
				teamARef: { kind: 'winner', game: 7 },
				teamBRef: { kind: 'winner', game: 9 },
				winnerTeamId: null
			},
			{
				game: 12,
				time: 'So, 13:00',
				teamARef: { kind: 'winner', game: 8 },
				teamBRef: { kind: 'winner', game: 10 },
				winnerTeamId: null
			},
			{
				game: 13,
				time: 'So, 16:30',
				teamARef: { kind: 'winner', game: 11 },
				teamBRef: { kind: 'winner', game: 12 },
				winnerTeamId: null,
				title: 'FINALE',
				isFinal: true
			}
		];
	}

	function getMatchByGame(matches: MatchState[], game: number): MatchState | undefined {
		return matches.find((match) => match.game === game);
	}

	function resolveTeamId(ref: TeamRef, matches: MatchState[]): number | null {
		if (ref.kind === 'team') {
			return ref.teamId;
		}

		const sourceMatch = getMatchByGame(matches, ref.game);

		if (!sourceMatch) {
			return null;
		}

		if (ref.kind === 'winner') {
			return sourceMatch.winnerTeamId;
		}

		if (sourceMatch.winnerTeamId === null) {
			return null;
		}

		const teamAId = resolveTeamId(sourceMatch.teamARef, matches);
		const teamBId = resolveTeamId(sourceMatch.teamBRef, matches);

		if (teamAId === null || teamBId === null) {
			return null;
		}

		if (sourceMatch.winnerTeamId === teamAId) {
			return teamBId;
		}

		if (sourceMatch.winnerTeamId === teamBId) {
			return teamAId;
		}

		return null;
	}

	function resolveParticipants(match: MatchState, matches: MatchState[]) {
		return {
			teamAId: resolveTeamId(match.teamARef, matches),
			teamBId: resolveTeamId(match.teamBRef, matches)
		};
	}

	function getTeamById(teams: TeamEntry[], teamId: number | null): TeamEntry | null {
		if (teamId === null) {
			return null;
		}

		return teams.find((team) => team.id === teamId) ?? null;
	}

	function getFallbackLabel(ref: TeamRef): string {
		if (ref.kind === 'winner') {
			return `Gewinner Spiel ${ref.game}`;
		}

		if (ref.kind === 'loser') {
			return `Verlierer Spiel ${ref.game}`;
		}

		return 'Team TBD';
	}

	function getSlotLabel(ref: TeamRef, matches: MatchState[], teams: TeamEntry[]): string {
		const teamId = resolveTeamId(ref, matches);
		const team = getTeamById(teams, teamId);

		if (team) {
			return team.label;
		}

		return getFallbackLabel(ref);
	}

	function normalizeWinners(matches: MatchState[]): MatchState[] {
		const normalized = matches.map((match) => ({ ...match }));

		for (const match of normalized) {
			if (match.winnerTeamId === null) {
				continue;
			}

			const { teamAId, teamBId } = resolveParticipants(match, normalized);

			if (match.winnerTeamId !== teamAId && match.winnerTeamId !== teamBId) {
				match.winnerTeamId = null;
			}
		}

		return normalized;
	}

	function toWinnerMap(matches: MatchState[]): Record<number, number | null> {
		const winnerMap: Record<number, number | null> = {};

		for (const match of matches) {
			winnerMap[match.game] = match.winnerTeamId;
		}

		return winnerMap;
	}

	function applyWinnerMap(
		matches: MatchState[],
		winnerMap: Record<number, number | null>
	): MatchState[] {
		const mergedMatches = matches.map((match) => {
			const storedWinner = winnerMap[match.game];

			if (typeof storedWinner !== 'number') {
				return { ...match, winnerTeamId: null };
			}

			return { ...match, winnerTeamId: storedWinner };
		});

		return normalizeWinners(mergedMatches);
	}

	function loadWinnerMap(bracket: BracketKind): Record<number, number | null> | null {
		const rawValue = localStorage.getItem(STORAGE_KEYS[bracket]);

		if (!rawValue) {
			return null;
		}

		try {
			const parsedValue: unknown = JSON.parse(rawValue);

			if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
				localStorage.removeItem(STORAGE_KEYS[bracket]);
				return null;
			}

			const winnerMap: Record<number, number | null> = {};

			for (const [gameKey, winnerValue] of Object.entries(parsedValue)) {
				const gameNumber = Number(gameKey);

				if (!Number.isInteger(gameNumber)) {
					continue;
				}

				if (winnerValue === null || typeof winnerValue === 'number') {
					winnerMap[gameNumber] = winnerValue;
				}
			}

			return winnerMap;
		} catch {
			localStorage.removeItem(STORAGE_KEYS[bracket]);
			return null;
		}
	}

	function saveWinnerMap(bracket: BracketKind, matches: MatchState[]): void {
		localStorage.setItem(STORAGE_KEYS[bracket], JSON.stringify(toWinnerMap(matches)));
	}

	function updateWinner(bracket: BracketKind, game: number, winnerTeamId: number) {
		const sourceMatches = bracket === 'men' ? menMatches : womenMatches;
		const nextMatches = sourceMatches.map((match) => ({ ...match }));
		const targetMatch = getMatchByGame(nextMatches, game);

		if (!targetMatch) {
			return;
		}

		targetMatch.winnerTeamId = winnerTeamId;

		const normalized = normalizeWinners(nextMatches);

		if (bracket === 'men') {
			menMatches = normalized;
			return;
		}

		womenMatches = normalized;
	}

	function computePlayerStats(
		matches: MatchState[],
		teams: TeamEntry[]
	): Record<number, PlayerStats> {
		const stats: Record<number, PlayerStats> = {};
		const teamMap = new Map(teams.map((team) => [team.id, team]));

		for (const team of teams) {
			for (const playerId of team.playerIds) {
				stats[playerId] = { gamesPlayed: 0, wins: 0 };
			}
		}

		for (const match of matches) {
			const { teamAId, teamBId } = resolveParticipants(match, matches);

			if (teamAId === null || teamBId === null) {
				continue;
			}

			const teamA = teamMap.get(teamAId);
			const teamB = teamMap.get(teamBId);

			if (!teamA || !teamB) {
				continue;
			}

			for (const playerId of teamA.playerIds) {
				stats[playerId] = stats[playerId] ?? { gamesPlayed: 0, wins: 0 };
				stats[playerId].gamesPlayed += 1;
			}

			for (const playerId of teamB.playerIds) {
				stats[playerId] = stats[playerId] ?? { gamesPlayed: 0, wins: 0 };
				stats[playerId].gamesPlayed += 1;
			}

			const winnerTeam =
				match.winnerTeamId === teamA.id ? teamA : match.winnerTeamId === teamB.id ? teamB : null;

			if (!winnerTeam) {
				continue;
			}

			for (const playerId of winnerTeam.playerIds) {
				stats[playerId] = stats[playerId] ?? { gamesPlayed: 0, wins: 0 };
				stats[playerId].wins += 1;
			}
		}

		return stats;
	}

	function isWinner(match: MatchState, ref: TeamRef, matches: MatchState[]): boolean {
		const teamId = resolveTeamId(ref, matches);
		return teamId !== null && match.winnerTeamId === teamId;
	}

	function canSelectTeam(ref: TeamRef, matches: MatchState[]): boolean {
		return resolveTeamId(ref, matches) !== null;
	}

	function handleTeamClick(match: MatchState, ref: TeamRef) {
		const currentMatchesValue = activeBracket === 'men' ? menMatches : womenMatches;
		const teamId = resolveTeamId(ref, currentMatchesValue);

		if (teamId === null) {
			return;
		}

		updateWinner(activeBracket, match.game, teamId);
	}

	const menTeams = $derived(buildTeams(0));
	const womenTeams = $derived(buildTeams(16));

	let menMatches = $state<MatchState[]>([]);
	let womenMatches = $state<MatchState[]>([]);
	let activeBracket = $state<BracketKind>('men');
	let hasLoadedStoredResults = $state(false);

	$effect(() => {
		menMatches = normalizeWinners(createInitialMatches(menTeams));
		womenMatches = normalizeWinners(createInitialMatches(womenTeams));
	});

	onMount(() => {
		const storedMenWinners = loadWinnerMap('men');
		const storedWomenWinners = loadWinnerMap('women');

		if (storedMenWinners) {
			menMatches = applyWinnerMap(createInitialMatches(menTeams), storedMenWinners);
		}

		if (storedWomenWinners) {
			womenMatches = applyWinnerMap(createInitialMatches(womenTeams), storedWomenWinners);
		}

		hasLoadedStoredResults = true;
	});

	$effect(() => {
		if (lockedBracket !== null) {
			activeBracket = lockedBracket;
		}
	});

	$effect(() => {
		onStatsChange?.({ bracket: 'men', stats: computePlayerStats(menMatches, menTeams) });
		onStatsChange?.({ bracket: 'women', stats: computePlayerStats(womenMatches, womenTeams) });
	});

	$effect(() => {
		if (!hasLoadedStoredResults) {
			return;
		}

		saveWinnerMap('men', menMatches);
		saveWinnerMap('women', womenMatches);
	});

	const showBracketTabs = $derived(lockedBracket === null);
	const currentMatches = $derived(activeBracket === 'men' ? menMatches : womenMatches);
	const currentTeams = $derived(activeBracket === 'men' ? menTeams : womenTeams);
</script>

<section class="mx-auto mt-8 max-w-[1600px] px-3 py-5 lg:px-4">
	<header
		class="mb-4 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3 text-slate-100 shadow-xl"
	>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
					German Beach Tour
				</p>
				<h1 class="text-xl font-black tracking-tight sm:text-2xl">Turnier-Spielplan</h1>
			</div>
			{#if showBracketTabs}
				<div class="inline-flex rounded-xl border border-slate-600 bg-slate-800 p-1">
					<button
						type="button"
						onclick={() => (activeBracket = 'men')}
						class={`rounded-lg px-4 py-2 text-sm font-bold transition ${
							activeBracket === 'men'
								? 'bg-sky-300 text-slate-950 shadow-sm'
								: 'text-slate-200 hover:bg-slate-700'
						}`}
					>
						Manner
					</button>
					<button
						type="button"
						onclick={() => (activeBracket = 'women')}
						class={`rounded-lg px-4 py-2 text-sm font-bold transition ${
							activeBracket === 'women'
								? 'bg-sky-300 text-slate-950 shadow-sm'
								: 'text-slate-200 hover:bg-slate-700'
						}`}
					>
						Frauen
					</button>
				</div>
			{/if}
		</div>
	</header>

	<div
		class="bracket-surface overflow-x-auto rounded-2xl border border-slate-700 p-3 shadow-2xl sm:p-4"
	>
		<div class="bracket-grid min-w-[1160px] gap-4">
			<div class="space-y-4">
				<h2 class="bracket-column-title">{ROUND_TITLES.roundOf16Winners}</h2>
				{#each ROUND_COLUMN_GAME_IDS.roundOf16Winners as gameId, index (gameId)}
					{@const match = getMatchByGame(currentMatches, gameId)}
					{#if match}
						<div class={`match-wrap ${index >= 2 ? 'mt-24' : ''}`}>
							<div class="match-card">
								<div class="match-head">
									<p>Spiel {match.game}</p>
									<p>{match.time}</p>
								</div>
								<button
									type="button"
									onclick={() => handleTeamClick(match, match.teamARef)}
									disabled={!canSelectTeam(match.teamARef, currentMatches)}
									class={`team-row team-button ${isWinner(match, match.teamARef, currentMatches) ? 'team-row-winner' : ''}`}
								>
									{getSlotLabel(match.teamARef, currentMatches, currentTeams)}
								</button>
								<button
									type="button"
									onclick={() => handleTeamClick(match, match.teamBRef)}
									disabled={!canSelectTeam(match.teamBRef, currentMatches)}
									class={`team-row team-button ${isWinner(match, match.teamBRef, currentMatches) ? 'team-row-winner' : ''}`}
								>
									{getSlotLabel(match.teamBRef, currentMatches, currentTeams)}
								</button>
								<span class="connector connector-right">&rarr;</span>
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<div class="space-y-40 pt-10">
				<h2 class="bracket-column-title">{ROUND_TITLES.quarterWinners}</h2>
				{#each ROUND_COLUMN_GAME_IDS.quarterWinners as gameId (gameId)}
					{@const match = getMatchByGame(currentMatches, gameId)}
					{#if match}
						<div class="match-wrap">
							<div class="match-card">
								<div class="match-head">
									<p>Spiel {match.game}</p>
									<p>{match.time}</p>
								</div>
								<button
									type="button"
									onclick={() => handleTeamClick(match, match.teamARef)}
									disabled={!canSelectTeam(match.teamARef, currentMatches)}
									class={`team-row team-button ${isWinner(match, match.teamARef, currentMatches) ? 'team-row-winner' : ''}`}
								>
									{getSlotLabel(match.teamARef, currentMatches, currentTeams)}
								</button>
								<button
									type="button"
									onclick={() => handleTeamClick(match, match.teamBRef)}
									disabled={!canSelectTeam(match.teamBRef, currentMatches)}
									class={`team-row team-button ${isWinner(match, match.teamBRef, currentMatches) ? 'team-row-winner' : ''}`}
								>
									{getSlotLabel(match.teamBRef, currentMatches, currentTeams)}
								</button>
								<span class="connector connector-right">&rarr;</span>
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<div class="space-y-8 pt-12">
				<h2 class="bracket-column-title">{ROUND_TITLES.center}</h2>
				{#each ROUND_COLUMN_GAME_IDS.center as gameId (gameId)}
					{@const match = getMatchByGame(currentMatches, gameId)}
					{#if match}
						<div class={`match-wrap ${match.isFinal ? 'final-wrap' : ''}`}>
							{#if match.isFinal}
								<div class="final-icon">🏆</div>
							{/if}
							<div class={`match-card ${match.isFinal ? 'final-card' : ''}`}>
								<div class="match-head">
									<p>
										Spiel {match.game}
										{#if match.title}
											- {match.title}
										{/if}
									</p>
									<p>{match.time}</p>
								</div>
								<button
									type="button"
									onclick={() => handleTeamClick(match, match.teamARef)}
									disabled={!canSelectTeam(match.teamARef, currentMatches)}
									class={`team-row team-button ${isWinner(match, match.teamARef, currentMatches) ? 'team-row-winner' : ''}`}
								>
									{getSlotLabel(match.teamARef, currentMatches, currentTeams)}
								</button>
								<button
									type="button"
									onclick={() => handleTeamClick(match, match.teamBRef)}
									disabled={!canSelectTeam(match.teamBRef, currentMatches)}
									class={`team-row team-button ${isWinner(match, match.teamBRef, currentMatches) ? 'team-row-winner' : ''}`}
								>
									{getSlotLabel(match.teamBRef, currentMatches, currentTeams)}
								</button>
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<div class="space-y-40 pt-10">
				<h2 class="bracket-column-title">{ROUND_TITLES.quarterLosers}</h2>
				{#each ROUND_COLUMN_GAME_IDS.quarterLosers as gameId (gameId)}
					{@const match = getMatchByGame(currentMatches, gameId)}
					{#if match}
						<div class="match-wrap">
							<div class="match-card">
								<div class="match-head">
									<p>Spiel {match.game}</p>
									<p>{match.time}</p>
								</div>
								<button
									type="button"
									onclick={() => handleTeamClick(match, match.teamARef)}
									disabled={!canSelectTeam(match.teamARef, currentMatches)}
									class={`team-row team-button ${isWinner(match, match.teamARef, currentMatches) ? 'team-row-winner' : ''}`}
								>
									{getSlotLabel(match.teamARef, currentMatches, currentTeams)}
								</button>
								<button
									type="button"
									onclick={() => handleTeamClick(match, match.teamBRef)}
									disabled={!canSelectTeam(match.teamBRef, currentMatches)}
									class={`team-row team-button ${isWinner(match, match.teamBRef, currentMatches) ? 'team-row-winner' : ''}`}
								>
									{getSlotLabel(match.teamBRef, currentMatches, currentTeams)}
								</button>
								<span class="connector connector-left">&larr;</span>
							</div>
						</div>
					{/if}
				{/each}
			</div>

			<div class="space-y-40 pt-2">
				<h2 class="bracket-column-title">{ROUND_TITLES.roundOf16Losers}</h2>
				{#each ROUND_COLUMN_GAME_IDS.roundOf16Losers as gameId (gameId)}
					{@const match = getMatchByGame(currentMatches, gameId)}
					{#if match}
						<div class="match-wrap">
							<div class="match-card">
								<div class="match-head">
									<p>Spiel {match.game}</p>
									<p>{match.time}</p>
								</div>
								<button
									type="button"
									onclick={() => handleTeamClick(match, match.teamARef)}
									disabled={!canSelectTeam(match.teamARef, currentMatches)}
									class={`team-row team-button ${isWinner(match, match.teamARef, currentMatches) ? 'team-row-winner' : ''}`}
								>
									{getSlotLabel(match.teamARef, currentMatches, currentTeams)}
								</button>
								<button
									type="button"
									onclick={() => handleTeamClick(match, match.teamBRef)}
									disabled={!canSelectTeam(match.teamBRef, currentMatches)}
									class={`team-row team-button ${isWinner(match, match.teamBRef, currentMatches) ? 'team-row-winner' : ''}`}
								>
									{getSlotLabel(match.teamBRef, currentMatches, currentTeams)}
								</button>
								<span class="connector connector-left">&larr;</span>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.bracket-surface {
		background-color: #2f343b;
		background-image:
			radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
			linear-gradient(140deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.1));
		background-size:
			38px 38px,
			auto;
	}

	.bracket-grid {
		display: grid;
		grid-template-columns: repeat(5, minmax(200px, 1fr));
	}

	.bracket-column-title {
		margin-bottom: 1rem;
		font-size: 1.35rem;
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: -0.02em;
		color: #f6f8fb;
	}

	.match-wrap {
		position: relative;
	}

	.match-card {
		position: relative;
		border-radius: 0.5rem;
		border: 1px solid rgba(130, 182, 217, 0.9);
		background: #eef7ff;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
	}

	.match-head {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		border-bottom: 1px solid rgba(130, 182, 217, 0.9);
		background: #c6e6ff;
		padding: 0.25rem 0.45rem;
		font-size: 0.78rem;
		font-weight: 700;
		color: #30506b;
	}

	.team-row {
		margin: 0.25rem;
		border-radius: 0.3rem;
		border: 1px solid #d5d8cf;
		background: #f0f0e5;
		padding: 0.22rem 0.35rem;
		font-size: 1.15rem;
		line-height: 1.15;
		color: #535b63;
	}

	.team-button {
		display: block;
		width: calc(100% - 0.5rem);
		text-align: left;
		cursor: pointer;
		transition: all 120ms ease;
	}

	.team-button:hover:not(:disabled) {
		border-color: #7ab5d8;
		background: #e6f4ff;
	}

	.team-button:disabled {
		cursor: not-allowed;
		opacity: 0.82;
	}

	.team-row-winner {
		border-color: #0a9f53;
		background: #d9fbe7;
		color: #0a6136;
		font-weight: 700;
	}

	.connector {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1.35rem;
		line-height: 1;
		color: rgba(243, 245, 247, 0.9);
		text-shadow: 0 0 10px rgba(0, 0, 0, 0.35);
	}

	.connector-right {
		right: -1.2rem;
	}

	.connector-left {
		left: -1.2rem;
	}

	.final-wrap {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.55rem;
	}

	.final-card {
		border-color: rgba(252, 211, 77, 0.9);
		box-shadow:
			0 0 0 2px rgba(252, 211, 77, 0.25),
			0 8px 20px rgba(0, 0, 0, 0.25);
	}

	.final-icon {
		font-size: 1.5rem;
		line-height: 1;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));
	}

	@media (max-width: 1280px) {
		.bracket-column-title {
			font-size: 1.1rem;
		}

		.team-row {
			font-size: 1rem;
		}
	}

	@media (max-width: 1024px) {
		.connector {
			display: none;
		}

		.bracket-grid {
			gap: 0.75rem;
		}

		.bracket-column-title {
			font-size: 0.95rem;
		}

		.team-row {
			font-size: 0.82rem;
		}
	}
</style>
