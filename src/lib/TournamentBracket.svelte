<script lang="ts">
	import { onMount } from 'svelte';
	import { Gender, type Player } from './player';

	type BracketKind = 'men' | 'women';
	type BracketVariant = 'tourstop' | 'gbc-final';
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

	type MatchSeed = {
		game: number;
		time: string;
		teamARef: TeamRef;
		teamBRef: TeamRef;
		title?: string;
		isFinal?: boolean;
	};

	type BracketColumn = {
		title: string;
		// A plain number renders as its own centered slot; a nested array groups
		// several games into one tightly-spaced unit (e.g. Finale + kl. Finale)
		// so the group as a whole gets centered instead of each game separately.
		gameIds: (number | number[])[];
	};

	type BracketLayout = {
		teamCount: number;
		columns: BracketColumn[];
		matches: MatchSeed[];
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
		pickedPlayerIds?: number[];
		onStatsChange?: (payload: BracketStatsPayload) => void;
	};

	let {
		players,
		lockedBracket = null,
		pickedPlayerIds = [],
		onStatsChange
	}: TournamentBracketProps = $props();

	const pickedPlayerIdSet = $derived(new Set(pickedPlayerIds));

	const BRACKET_LAYOUTS: Record<BracketVariant, BracketLayout> = {
		tourstop: {
			teamCount: 8,
			columns: [
				{ title: 'Achtelfinale Winner', gameIds: [1, 2, 3, 4] },
				{ title: 'Viertelfinale Winner', gameIds: [7, 8] },
				{ title: 'Halbfinale & Finale', gameIds: [11, 13, 12] },
				{ title: 'Viertelfinale Loser', gameIds: [9, 10] },
				{ title: 'Achtelfinale Loser', gameIds: [5, 6] }
			],
			matches: [
				{ game: 1, time: 'Fr, 20:30', teamARef: { kind: 'team', teamId: 1 }, teamBRef: { kind: 'team', teamId: 8 } },
				{ game: 2, time: 'Fr, 17:15', teamARef: { kind: 'team', teamId: 4 }, teamBRef: { kind: 'team', teamId: 5 } },
				{ game: 3, time: 'Fr, 16:15', teamARef: { kind: 'team', teamId: 3 }, teamBRef: { kind: 'team', teamId: 6 } },
				{ game: 4, time: 'Fr, 21:30', teamARef: { kind: 'team', teamId: 2 }, teamBRef: { kind: 'team', teamId: 7 } },
				{ game: 5, time: 'Sa, 11:30', teamARef: { kind: 'loser', game: 1 }, teamBRef: { kind: 'loser', game: 2 } },
				{ game: 6, time: 'Sa, 12:30', teamARef: { kind: 'loser', game: 3 }, teamBRef: { kind: 'loser', game: 4 } },
				{ game: 7, time: 'Sa, 15:30', teamARef: { kind: 'winner', game: 1 }, teamBRef: { kind: 'winner', game: 2 } },
				{ game: 8, time: 'Sa, 16:30', teamARef: { kind: 'winner', game: 3 }, teamBRef: { kind: 'winner', game: 4 } },
				{ game: 9, time: 'Sa, 21:00', teamARef: { kind: 'winner', game: 5 }, teamBRef: { kind: 'loser', game: 8 } },
				{ game: 10, time: 'Sa, 20:00', teamARef: { kind: 'winner', game: 6 }, teamBRef: { kind: 'loser', game: 7 } },
				{ game: 11, time: 'So, 12:00', teamARef: { kind: 'winner', game: 7 }, teamBRef: { kind: 'winner', game: 9 } },
				{ game: 12, time: 'So, 13:00', teamARef: { kind: 'winner', game: 8 }, teamBRef: { kind: 'winner', game: 10 } },
				{ game: 13, time: 'So, 16:30', teamARef: { kind: 'winner', game: 11 }, teamBRef: { kind: 'winner', game: 12 }, title: 'FINALE', isFinal: true }
			]
		},
		'gbc-final': {
			teamCount: 16,
			columns: [
				{ title: 'Runde 1 Winner', gameIds: [1, 2, 3, 4, 5, 6, 7, 8] },
				{ title: 'Achtelfinale Winner', gameIds: [9, 10, 11, 12] },
				{ title: 'Viertelfinale Winner', gameIds: [21, 22] },
				{ title: 'Halbfinale', gameIds: [27, 28] },
				{ title: 'Finale', gameIds: [[30, 29]] },
				{ title: 'Viertelfinale Loser', gameIds: [25, 26] },
				{ title: 'Achtelfinale Loser', gameIds: [24, 23] },
				{ title: 'Runde 2 Loser', gameIds: [20, 19, 18, 17] },
				{ title: 'Runde 1 Loser', gameIds: [16, 15, 14, 13] }
			],
			matches: [
				{ game: 1, time: 'Do, 12:30', teamARef: { kind: 'team', teamId: 1 }, teamBRef: { kind: 'team', teamId: 16 } },
				{ game: 2, time: 'Do, 13:30', teamARef: { kind: 'team', teamId: 8 }, teamBRef: { kind: 'team', teamId: 9 } },
				{ game: 3, time: 'Do, 13:30', teamARef: { kind: 'team', teamId: 5 }, teamBRef: { kind: 'team', teamId: 12 } },
				{ game: 4, time: 'Do, 13:30', teamARef: { kind: 'team', teamId: 4 }, teamBRef: { kind: 'team', teamId: 13 } },
				{ game: 5, time: 'Do, 14:30', teamARef: { kind: 'team', teamId: 3 }, teamBRef: { kind: 'team', teamId: 14 } },
				{ game: 6, time: 'Do, 14:30', teamARef: { kind: 'team', teamId: 6 }, teamBRef: { kind: 'team', teamId: 11 } },
				{ game: 7, time: 'Do, 19:00', teamARef: { kind: 'team', teamId: 7 }, teamBRef: { kind: 'team', teamId: 10 } },
				{ game: 8, time: 'Do, 18:00', teamARef: { kind: 'team', teamId: 2 }, teamBRef: { kind: 'team', teamId: 15 } },
				{ game: 9, time: 'Fr, 13:30', teamARef: { kind: 'winner', game: 1 }, teamBRef: { kind: 'winner', game: 2 } },
				{ game: 10, time: 'Fr, 14:30', teamARef: { kind: 'winner', game: 3 }, teamBRef: { kind: 'winner', game: 4 } },
				{ game: 11, time: 'Fr, 10:30', teamARef: { kind: 'winner', game: 5 }, teamBRef: { kind: 'winner', game: 6 } },
				{ game: 12, time: 'Fr, 10:30', teamARef: { kind: 'winner', game: 7 }, teamBRef: { kind: 'winner', game: 8 } },
				{ game: 13, time: 'Do, 18:00', teamARef: { kind: 'loser', game: 1 }, teamBRef: { kind: 'loser', game: 2 } },
				{ game: 14, time: 'Do, 18:00', teamARef: { kind: 'loser', game: 3 }, teamBRef: { kind: 'loser', game: 4 } },
				{ game: 15, time: 'Fr, 14:30', teamARef: { kind: 'loser', game: 5 }, teamBRef: { kind: 'loser', game: 6 } },
				{ game: 16, time: 'Fr, 13:30', teamARef: { kind: 'loser', game: 7 }, teamBRef: { kind: 'loser', game: 8 } },
				{ game: 17, time: 'Fr, 16:00', teamARef: { kind: 'winner', game: 13 }, teamBRef: { kind: 'loser', game: 12 } },
				{ game: 18, time: 'Fr, 16:00', teamARef: { kind: 'winner', game: 14 }, teamBRef: { kind: 'loser', game: 11 } },
				{ game: 19, time: 'Fr, 19:00', teamARef: { kind: 'winner', game: 15 }, teamBRef: { kind: 'loser', game: 10 } },
				{ game: 20, time: 'Fr, 17:00', teamARef: { kind: 'winner', game: 16 }, teamBRef: { kind: 'loser', game: 9 } },
				{ game: 21, time: 'Sa, 10:30', teamARef: { kind: 'winner', game: 9 }, teamBRef: { kind: 'winner', game: 10 } },
				{ game: 22, time: 'Sa, 11:30', teamARef: { kind: 'winner', game: 11 }, teamBRef: { kind: 'winner', game: 12 } },
				{ game: 23, time: 'Sa, 13:30', teamARef: { kind: 'winner', game: 18 }, teamBRef: { kind: 'winner', game: 17 } },
				{ game: 24, time: 'Sa, 12:30', teamARef: { kind: 'winner', game: 20 }, teamBRef: { kind: 'winner', game: 19 } },
				{ game: 25, time: 'Sa, 18:00', teamARef: { kind: 'winner', game: 24 }, teamBRef: { kind: 'loser', game: 22 } },
				{ game: 26, time: 'Sa, 19:00', teamARef: { kind: 'winner', game: 23 }, teamBRef: { kind: 'loser', game: 21 } },
				{ game: 27, time: 'So, 10:30', teamARef: { kind: 'winner', game: 25 }, teamBRef: { kind: 'winner', game: 21 } },
				{ game: 28, time: 'So, 11:30', teamARef: { kind: 'winner', game: 22 }, teamBRef: { kind: 'winner', game: 26 } },
				{ game: 29, time: 'So, 15:00', teamARef: { kind: 'loser', game: 27 }, teamBRef: { kind: 'loser', game: 28 } },
				{ game: 30, time: 'So, 16:00', teamARef: { kind: 'winner', game: 27 }, teamBRef: { kind: 'winner', game: 28 }, isFinal: true }
			]
		}
	};

	function resolveVariantForTeamCount(teamCount: number): BracketVariant {
		return teamCount >= BRACKET_LAYOUTS['gbc-final'].teamCount ? 'gbc-final' : 'tourstop';
	}

	function getVariantLabel(variant: BracketVariant): string {
		return variant === 'gbc-final' ? 'Finale = GBC' : 'Normaler Tourstop';
	}

	const GBC_MATCH_TIMES: Record<BracketKind, Record<number, string>> = {
		men: {
			1: 'Do, 12:30',
			2: 'Do, 13:30',
			3: 'Do, 13:30',
			4: 'Do, 13:30',
			5: 'Do, 14:30',
			6: 'Do, 14:30',
			7: 'Do, 19:00',
			8: 'Do, 18:00',
			9: 'Fr, 13:30',
			10: 'Fr, 14:30',
			11: 'Fr, 10:30',
			12: 'Fr, 10:30',
			13: 'Do, 18:00',
			14: 'Do, 18:00',
			15: 'Fr, 14:30',
			16: 'Fr, 13:30',
			17: 'Fr, 16:00',
			18: 'Fr, 16:00',
			19: 'Fr, 19:00',
			20: 'Fr, 17:00',
			21: 'Sa, 10:30',
			22: 'Sa, 11:30',
			23: 'Sa, 13:30',
			24: 'Sa, 12:30',
			25: 'Sa, 18:00',
			26: 'Sa, 19:00',
			27: 'So, 10:30',
			28: 'So, 11:30',
			29: 'So, 15:00',
			30: 'So, 16:00'
		},
		women: {
			1: 'Do, 10:30',
			2: 'Do, 10:30',
			3: 'Do, 10:30',
			4: 'Do, 11:30',
			5: 'Do, 11:30',
			6: 'Do, 11:30',
			7: 'Do, 12:30',
			8: 'Do, 12:30',
			9: 'Do, 16:00',
			10: 'Do, 17:00',
			11: 'Do, 20:00',
			12: 'Do, 21:00',
			13: 'Do, 16:00',
			14: 'Do, 16:00',
			15: 'Do, 17:00',
			16: 'Do, 17:00',
			17: 'Fr, 11:30',
			18: 'Fr, 11:30',
			19: 'Fr, 12:30',
			20: 'Fr, 12:30',
			21: 'Fr, 20:00',
			22: 'Fr, 21:00',
			23: 'Fr, 17:00',
			24: 'Fr, 18:00',
			25: 'Sa, 14:30',
			26: 'Sa, 15:30',
			27: 'Sa, 20:00',
			28: 'Sa, 21:00',
			29: 'So, 12:45',
			30: 'So, 13:45'
		}
	};

	function resolveMatchTime(
		variant: BracketVariant,
		bracket: BracketKind,
		game: number,
		fallbackTime: string
	): string {
		if (variant !== 'gbc-final') {
			return fallbackTime;
		}

		return GBC_MATCH_TIMES[bracket][game] ?? fallbackTime;
	}

	function toBracketName(player: Player): string {
		const lastName = player.lastName?.trim();

		if (!lastName) {
			return 'TBD';
		}

		return lastName;
	}

	function buildTeamsForPool(sourcePlayers: Player[], teamCount: number): TeamEntry[] {
		return Array.from({ length: teamCount }, (_, teamIndex) => {
			const firstPlayer = sourcePlayers[teamIndex * 2];
			const secondPlayer = sourcePlayers[teamIndex * 2 + 1];
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
				label: `${toBracketName(firstPlayer)} / ${toBracketName(secondPlayer)}`,
				playerIds
			};
		});
	}

	function createInitialMatches(
		variant: BracketVariant,
		bracket: BracketKind,
		layout: BracketLayout,
		teams: TeamEntry[]
	): MatchState[] {
		return layout.matches.map((match) => {
			const teamARef: TeamRef =
				match.teamARef.kind === 'team'
					? {
						kind: 'team',
						teamId: teams[match.teamARef.teamId - 1]?.id ?? match.teamARef.teamId
					}
					: match.teamARef;
			const teamBRef: TeamRef =
				match.teamBRef.kind === 'team'
					? {
						kind: 'team',
						teamId: teams[match.teamBRef.teamId - 1]?.id ?? match.teamBRef.teamId
					}
					: match.teamBRef;

			return {
				game: match.game,
				time: resolveMatchTime(variant, bracket, match.game, match.time),
				teamARef,
				teamBRef,
				winnerTeamId: null,
				title: match.title,
				isFinal: match.isFinal
			} satisfies MatchState;
		});
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

	function getSlotSeed(ref: TeamRef, matches: MatchState[], teams: TeamEntry[]): number | null {
		const teamId = resolveTeamId(ref, matches);
		const team = getTeamById(teams, teamId);

		return team ? team.id : null;
	}

	function getSlotPlayers(ref: TeamRef, matches: MatchState[], teams: TeamEntry[]): Player[] | null {
		const teamId = resolveTeamId(ref, matches);
		const team = getTeamById(teams, teamId);

		if (!team) {
			return null;
		}

		return team.playerIds
			.map((playerId) => players.find((candidate) => candidate.id === playerId))
			.filter((player): player is Player => player !== undefined);
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

	function getStorageKey(variant: BracketVariant, bracket: BracketKind): string {
		return `gbt-bracket-results-v2-${variant}-${bracket}`;
	}

	function loadWinnerMap(
		variant: BracketVariant,
		bracket: BracketKind
	): Record<number, number | null> | null {
		const rawValue = localStorage.getItem(getStorageKey(variant, bracket));

		if (!rawValue) {
			return null;
		}

		try {
			const parsedValue: unknown = JSON.parse(rawValue);

			if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
				localStorage.removeItem(getStorageKey(variant, bracket));
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
			localStorage.removeItem(getStorageKey(variant, bracket));
			return null;
		}
	}

	function saveWinnerMap(variant: BracketVariant, bracket: BracketKind, matches: MatchState[]): void {
		localStorage.setItem(getStorageKey(variant, bracket), JSON.stringify(toWinnerMap(matches)));
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

	function restoreMatches(variant: BracketVariant, bracket: BracketKind): MatchState[] {
		const layout = BRACKET_LAYOUTS[variant];
		const sourcePlayers = bracket === 'men' ? menPlayers : womenPlayers;
		const teams = buildTeamsForPool(sourcePlayers, layout.teamCount);
		const matches = createInitialMatches(variant, bracket, layout, teams);
		const storedWinnerMap = loadWinnerMap(variant, bracket);

		if (!storedWinnerMap) {
			return matches;
		}

		return applyWinnerMap(matches, storedWinnerMap);
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

	function resetBracket() {
		const variant = activeBracket === 'men' ? menVariant : womenVariant;
		const layout = BRACKET_LAYOUTS[variant];

		if (activeBracket === 'men') {
			menMatches = normalizeWinners(
				createInitialMatches(variant, 'men', layout, menTeams)
			);
			localStorage.removeItem(getStorageKey(variant, 'men'));
			return;
		}

		womenMatches = normalizeWinners(
			createInitialMatches(variant, 'women', layout, womenTeams)
		);
		localStorage.removeItem(getStorageKey(variant, 'women'));
	}

	const menPlayers = $derived(players.filter((player) => player.gender === Gender.Male));
	const womenPlayers = $derived(players.filter((player) => player.gender === Gender.Female));
	const menVariant = $derived(resolveVariantForTeamCount(Math.floor(menPlayers.length / 2)));
	const womenVariant = $derived(resolveVariantForTeamCount(Math.floor(womenPlayers.length / 2)));
	const menLayout = $derived(BRACKET_LAYOUTS[menVariant]);
	const womenLayout = $derived(BRACKET_LAYOUTS[womenVariant]);
	const menTeams = $derived(buildTeamsForPool(menPlayers, menLayout.teamCount));
	const womenTeams = $derived(buildTeamsForPool(womenPlayers, womenLayout.teamCount));

	let menMatches = $state<MatchState[]>([]);
	let womenMatches = $state<MatchState[]>([]);
	let activeBracket = $state<BracketKind>('men');
	let hasLoadedStoredResults = $state(false);
	let hoveredTeamId = $state<number | null>(null);

	// Connector lines: real drawn paths from each match to the exact game it feeds
	// into, since a game's result can feed a match several columns away (loser-bracket
	// games routinely skip over the winner-side columns) - a plain "<-"/"->" glyph can't
	// express that distance, only a real line can.
	type ConnectorPath = { key: string; d: string };

	const rowRefs = new Map<string, HTMLElement>();
	let gridEl = $state<HTMLElement | null>(null);
	let connectorPaths = $state<ConnectorPath[]>([]);
	let recomputeScheduled = false;

	// Which games belong to the loser (consolation) bracket, for connector-line
	// filtering. Kept independent of the visual `columns` grouping above - game 29
	// (kl. Finale) is drawn stacked under "Finale" for layout reasons, but it's still
	// a loser-bracket game and must not gain a cross-side line because of that.
	const LOSER_SIDE_GAMES: Record<BracketVariant, ReadonlySet<number>> = {
		tourstop: new Set([5, 6, 9, 10]),
		'gbc-final': new Set([13, 14, 15, 16, 17, 18, 19, 20, 23, 24, 25, 26, 29])
	};

	function isLoserSideGame(variant: BracketVariant, game: number): boolean {
		return LOSER_SIDE_GAMES[variant].has(game);
	}

	function scheduleConnectorRecompute() {
		if (recomputeScheduled) {
			return;
		}

		recomputeScheduled = true;
		requestAnimationFrame(() => {
			recomputeScheduled = false;
			recomputeConnectorPaths();
		});
	}

	function registerTeamRow(node: HTMLElement, key: string) {
		rowRefs.set(key, node);
		scheduleConnectorRecompute();

		return {
			destroy() {
				if (rowRefs.get(key) === node) {
					rowRefs.delete(key);
				}
			}
		};
	}

	function recomputeConnectorPaths() {
		if (!gridEl) {
			connectorPaths = [];
			return;
		}

		const gridRect = gridEl.getBoundingClientRect();
		const paths: ConnectorPath[] = [];

		for (const match of currentMatches) {
			for (const [ref, rowSuffix] of [
				[match.teamARef, 'A'],
				[match.teamBRef, 'B']
			] as const) {
				if (ref.kind === 'team') {
					continue;
				}

				// Skip only the "you lost, here's your consolation-bracket drop" lines
				// (a "loser" edge whose source sits on the Winner side) - those jumps
				// span most of the bracket's width and the box text already spells out
				// the source game ("Verlierer Spiel X"), so nothing is lost by leaving
				// them out. Keep "winner" edges even when they cross sides, e.g.
				// Spiel 25/26 -> Spiel 27/28 - that's the consolation-bracket champion
				// advancing, which is worth tracing.
				if (
					ref.kind === 'loser' &&
					isLoserSideGame(currentVariant, ref.game) !== isLoserSideGame(currentVariant, match.game)
				) {
					continue;
				}

				// Anchor the source at the true midpoint between the source match's two
				// team rows - not the whole card's center, which skews toward row A
				// (the match-head eats space above the rows) and can end up almost on
				// top of a sibling edge that arrives right at row A.
				const sourceRowA = rowRefs.get(`${ref.game}-A`);
				const sourceRowB = rowRefs.get(`${ref.game}-B`);
				const destEl = rowRefs.get(`${match.game}-${rowSuffix}`);

				if (!sourceRowA || !sourceRowB || !destEl) {
					continue;
				}

				const sRectA = sourceRowA.getBoundingClientRect();
				const sRectB = sourceRowB.getBoundingClientRect();
				const sLeft = Math.min(sRectA.left, sRectB.left);
				const sRight = Math.max(sRectA.right, sRectB.right);
				const sCenterY = (sRectA.top + sRectA.height / 2 + sRectB.top + sRectB.height / 2) / 2;
				const dRect = destEl.getBoundingClientRect();
				const sCenterX = (sLeft + sRight) / 2 - gridRect.left;
				const dCenterX = dRect.left + dRect.width / 2 - gridRect.left;
				const goingRight = dCenterX >= sCenterX;

				const sx = (goingRight ? sRight : sLeft) - gridRect.left;
				const sy = sCenterY - gridRect.top;
				const dx = (goingRight ? dRect.left : dRect.right) - gridRect.left;
				const dy = dRect.top + dRect.height / 2 - gridRect.top;
				const midX = (sx + dx) / 2;

				paths.push({
					key: `${ref.kind}-${ref.game}-${match.game}-${rowSuffix}`,
					d: `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${dy} L ${dx} ${dy}`
				});
			}
		}

		connectorPaths = paths;
	}

	onMount(() => {
		menMatches = restoreMatches(menVariant, 'men');
		womenMatches = restoreMatches(womenVariant, 'women');

		hasLoadedStoredResults = true;

		window.addEventListener('resize', scheduleConnectorRecompute);

		// The bracket stays mounted (just hidden) while another tab is active, so a
		// resize-only listener misses the moment it becomes visible again - going from
		// display:none to visible is exactly a size change from 0x0, which this catches.
		const resizeObserver = new ResizeObserver(() => scheduleConnectorRecompute());

		if (gridEl) {
			resizeObserver.observe(gridEl);
		}

		return () => {
			window.removeEventListener('resize', scheduleConnectorRecompute);
			resizeObserver.disconnect();
		};
	});

	$effect(() => {
		// Re-measure whenever the visible bracket, its results, or its layout variant
		// change - box positions shift as winners get filled in and rows resize.
		void activeBracket;
		void currentMatches;
		void activeLayout;
		scheduleConnectorRecompute();
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

		saveWinnerMap(menVariant, 'men', menMatches);
		saveWinnerMap(womenVariant, 'women', womenMatches);
	});

	const showBracketTabs = $derived(lockedBracket === null);
	const currentVariant = $derived(activeBracket === 'men' ? menVariant : womenVariant);
	const activeLayout = $derived(BRACKET_LAYOUTS[currentVariant]);
	const currentVariantLabel = $derived(getVariantLabel(currentVariant));
	const currentMatches = $derived(activeBracket === 'men' ? menMatches : womenMatches);
	const currentTeams = $derived(activeBracket === 'men' ? menTeams : womenTeams);
</script>

<section class="mt-8 w-full px-3 py-5 lg:px-4">
	<header
		class="mb-4 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3 text-slate-100 shadow-xl"
	>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
					German Beach Tour
				</p>
				<h1 class="text-xl font-black tracking-tight sm:text-2xl">Turnier-Spielplan</h1>
				<p class="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
					{currentVariantLabel}
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
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
							Männer
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
				<button
					type="button"
					onclick={resetBracket}
					class="rounded-lg border border-rose-400/70 bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-100 transition hover:bg-rose-500/25"
				>
					Spielplan zurücksetzen
				</button>
			</div>
		</div>
	</header>

	<div
		class="bracket-surface overflow-x-auto rounded-2xl border border-slate-700 p-3 shadow-2xl sm:p-4"
	>
		<div
			class="bracket-grid gap-8"
			style={`--bracket-columns: ${activeLayout.columns.length};`}
			bind:this={gridEl}
		>
			<svg class="connector-lines">
				{#each connectorPaths as path (path.key)}
					<path d={path.d} />
				{/each}
			</svg>
			{#snippet matchCard(gameId: number)}
				{@const match = getMatchByGame(currentMatches, gameId)}
				{#if match}
					{@const teamASeed = getSlotSeed(match.teamARef, currentMatches, currentTeams)}
					{@const teamBSeed = getSlotSeed(match.teamBRef, currentMatches, currentTeams)}
					{@const teamAPlayers = getSlotPlayers(match.teamARef, currentMatches, currentTeams)}
					{@const teamBPlayers = getSlotPlayers(match.teamBRef, currentMatches, currentTeams)}
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
								onmouseenter={() => (hoveredTeamId = teamASeed)}
								onmouseleave={() => (hoveredTeamId = null)}
								disabled={!canSelectTeam(match.teamARef, currentMatches)}
								class={`team-row team-button ${isWinner(match, match.teamARef, currentMatches) ? 'team-row-winner' : ''} ${teamASeed !== null && teamASeed === hoveredTeamId ? 'team-row-highlighted' : ''}`}
								use:registerTeamRow={`${match.game}-A`}
							>
								{#if teamASeed !== null}
									<span class="team-seed">{teamASeed}</span>
								{/if}
								{#if teamAPlayers}
									{#each teamAPlayers as player, i (player.id)}
										{i > 0 ? ' / ' : ''}<span
											class={pickedPlayerIdSet.has(player.id) ? 'picked-name' : ''}
											title={pickedPlayerIdSet.has(player.id) ? 'Spieler in deinem Team' : undefined}
											>{toBracketName(player)}</span
										>
									{/each}
								{:else}
									{getFallbackLabel(match.teamARef)}
								{/if}
							</button>
							<button
								type="button"
								onclick={() => handleTeamClick(match, match.teamBRef)}
								onmouseenter={() => (hoveredTeamId = teamBSeed)}
								onmouseleave={() => (hoveredTeamId = null)}
								disabled={!canSelectTeam(match.teamBRef, currentMatches)}
								class={`team-row team-button ${isWinner(match, match.teamBRef, currentMatches) ? 'team-row-winner' : ''} ${teamBSeed !== null && teamBSeed === hoveredTeamId ? 'team-row-highlighted' : ''}`}
								use:registerTeamRow={`${match.game}-B`}
							>
								{#if teamBSeed !== null}
									<span class="team-seed">{teamBSeed}</span>
								{/if}
								{#if teamBPlayers}
									{#each teamBPlayers as player, i (player.id)}
										{i > 0 ? ' / ' : ''}<span
											class={pickedPlayerIdSet.has(player.id) ? 'picked-name' : ''}
											title={pickedPlayerIdSet.has(player.id) ? 'Spieler in deinem Team' : undefined}
											>{toBracketName(player)}</span
										>
									{/each}
								{:else}
									{getFallbackLabel(match.teamBRef)}
								{/if}
							</button>
						</div>
					</div>
				{/if}
			{/snippet}

			{#each activeLayout.columns as column}
				<div class="bracket-column">
					<h2 class="bracket-column-title">{column.title}</h2>
					<div class="bracket-column-games">
						{#each column.gameIds as group (Array.isArray(group) ? group.join('-') : group)}
							{#if Array.isArray(group)}
								<div class="match-group">
									{#each group as gameId (gameId)}
										{@render matchCard(gameId)}
									{/each}
								</div>
							{:else}
								{@render matchCard(group)}
							{/if}
						{/each}
					</div>
				</div>
			{/each}
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
		position: relative;
		isolation: isolate;
		display: grid;
		width: max-content;
		grid-template-columns: repeat(var(--bracket-columns), 152px);
	}

	.bracket-column {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.bracket-column-games {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: space-evenly;
		gap: 0.6rem;
	}

	.match-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.connector-lines {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
		overflow: visible;
		pointer-events: none;
	}

	.connector-lines path {
		fill: none;
		stroke: rgba(148, 163, 184, 0.6);
		stroke-width: 2;
	}

	.bracket-column-title {
		margin-bottom: 1rem;
		font-size: 1rem;
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: -0.02em;
		color: #f6f8fb;
		text-align: center;
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
		position: relative;
		margin: 0.25rem;
		border-radius: 0.3rem;
		border: 1px solid #d5d8cf;
		background: #f0f0e5;
		padding: 0.22rem 1.6rem 0.22rem 0.35rem;
		font-size: 0.68rem;
		line-height: 1.15;
		color: #535b63;
	}

	.team-seed {
		position: absolute;
		top: 0.15rem;
		right: 0.25rem;
		font-size: 0.68rem;
		font-weight: 700;
		line-height: 1;
		color: #8a929a;
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

	.team-row-highlighted {
		border-color: #e11d48;
		background: #ffe1e6;
		box-shadow: 0 0 0 2px rgba(225, 29, 72, 0.55);
	}

	.picked-name {
		font-weight: 800;
		color: #a16207;
	}

	.final-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.final-card {
		border-color: rgba(252, 211, 77, 0.9);
		box-shadow:
			0 0 0 2px rgba(252, 211, 77, 0.25),
			0 8px 20px rgba(0, 0, 0, 0.25);
	}

	.final-icon {
		align-self: center;
		font-size: 1.5rem;
		line-height: 1;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));
	}

	@media (max-width: 1280px) {
		.bracket-column-title {
			font-size: 0.9rem;
		}

		.team-row {
			font-size: 0.62rem;
		}
	}

	@media (max-width: 1024px) {
		.bracket-grid {
			gap: 1.25rem;
		}

		.bracket-column-title {
			font-size: 0.82rem;
		}

		.team-row {
			font-size: 0.56rem;
		}
	}
</style>
