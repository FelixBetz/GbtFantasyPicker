<script lang="ts">
	import { browser } from '$app/environment';
	import type { Player } from '$lib/player';
	import TeamPlanner from '$lib/TeamPlanner.svelte';
	import TournamentBracket from '$lib/TournamentBracket.svelte';
	import ViewModeSwitch from '$lib/ViewModeSwitch.svelte';
	import { createSeedPlayers } from '../data/players.generated';

	type ViewMode = 'team' | 'bracket-men' | 'bracket-women';
	const VIEW_STORAGE_KEY = 'gbt-active-view';
	const VALID_VIEW_MODES: ViewMode[] = ['team', 'bracket-men', 'bracket-women'];

	function getInitialView(): ViewMode {
		if (!browser) {
			return 'team';
		}

		const stored = localStorage.getItem(VIEW_STORAGE_KEY);

		if (VALID_VIEW_MODES.includes(stored as ViewMode)) {
			return stored as ViewMode;
		}

		return 'team';
	}
	type PlayerStats = {
		gamesPlayed: number;
		wins: number;
	};
	type BracketStatsPayload = {
		bracket: 'men' | 'women';
		stats: Record<number, PlayerStats>;
	};

	let activeView = $state<ViewMode>(getInitialView());
	let bracketStatsByView = $state<{
		men: Record<number, PlayerStats>;
		women: Record<number, PlayerStats>;
	}>({
		men: {},
		women: {}
	});

	const players: Player[] = createSeedPlayers();

	function handleViewChange(nextMode: ViewMode) {
		activeView = nextMode;

		if (browser) {
			localStorage.setItem(VIEW_STORAGE_KEY, nextMode);
		}
	}

	function areStatsEqual(a: Record<number, PlayerStats>, b: Record<number, PlayerStats>): boolean {
		const aEntries = Object.entries(a);
		const bEntries = Object.entries(b);

		if (aEntries.length !== bEntries.length) {
			return false;
		}

		for (const [playerId, aStats] of aEntries) {
			const bStats = b[Number(playerId)];

			if (!bStats) {
				return false;
			}

			if (aStats.gamesPlayed !== bStats.gamesPlayed || aStats.wins !== bStats.wins) {
				return false;
			}
		}

		return true;
	}

	function handleBracketStatsChange(payload: BracketStatsPayload) {
		if (payload.bracket === 'men') {
			if (areStatsEqual(bracketStatsByView.men, payload.stats)) {
				return;
			}

			bracketStatsByView = { ...bracketStatsByView, men: payload.stats };
			return;
		}

		if (areStatsEqual(bracketStatsByView.women, payload.stats)) {
			return;
		}

		bracketStatsByView = { ...bracketStatsByView, women: payload.stats };
	}

	const playerStatsById = $derived({
		...bracketStatsByView.men,
		...bracketStatsByView.women
	});
</script>

<ViewModeSwitch {activeView} onChange={handleViewChange} />

{#if activeView === 'team'}
	<TeamPlanner {players} {playerStatsById} />
{:else if activeView === 'bracket-men'}
	<TournamentBracket {players} lockedBracket="men" onStatsChange={handleBracketStatsChange} />
{:else}
	<TournamentBracket {players} lockedBracket="women" onStatsChange={handleBracketStatsChange} />
{/if}
