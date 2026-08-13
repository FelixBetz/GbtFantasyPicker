<script lang="ts">
	import { Gender, Player } from '$lib/player';
	import TeamPlanner from '$lib/TeamPlanner.svelte';
	import TournamentBracket from '$lib/TournamentBracket.svelte';
	import ViewModeSwitch from '$lib/ViewModeSwitch.svelte';

	type ViewMode = 'team' | 'bracket-men' | 'bracket-women';
	type PlayerStats = {
		gamesPlayed: number;
		wins: number;
	};
	type BracketStatsPayload = {
		bracket: 'men' | 'women';
		stats: Record<number, PlayerStats>;
	};

	let activeView = $state<ViewMode>('team');
	let bracketStatsByView = $state<{
		men: Record<number, PlayerStats>;
		women: Record<number, PlayerStats>;
	}>({
		men: {},
		women: {}
	});

	const players: Player[] = [
		new Player(Gender.Male, 'Momme', 'Lorenz', 30),
		new Player(Gender.Male, 'Tilo', 'Rietschel', 30),
		new Player(Gender.Male, 'Ole', 'Sackermann', 5),
		new Player(Gender.Male, 'Benedikt', 'Sagstetter', 30),
		new Player(Gender.Male, 'Niklas', 'Held', 30),
		new Player(Gender.Male, 'Luis', 'Kubo', 20),
		new Player(Gender.Male, 'Jonas', 'Reinhardt', 25),
		new Player(Gender.Male, 'Robin', 'Sowa', 30),
		new Player(Gender.Male, 'Tristan', 'Fröbel', 20),
		new Player(Gender.Male, 'Tamo', 'Wüst', 25),
		new Player(Gender.Male, 'Colin', 'Paszkiewicz', 5),
		new Player(Gender.Male, 'Charlie', 'Peters', 5),
		new Player(Gender.Male, 'Luis', 'Henrichs', 20),
		new Player(Gender.Male, 'Cedrik', 'Moede', 10),
		new Player(Gender.Male, 'Hennes Jorge', 'Nissen', 15),
		new Player(Gender.Male, 'Milan', 'Sievers', 15),
		//////////////////////////////////////////////////////////////////////////
		new Player(Gender.Female, 'Chenoa', 'Christ', 10),
		new Player(Gender.Female, 'Sophia', 'Neuß', 15),
		new Player(Gender.Female, 'Nele', 'Barber', 20),
		new Player(Gender.Female, 'Melanie', 'Gernert', 35),
		new Player(Gender.Female, 'Mareet', 'Maidhof', 20),
		new Player(Gender.Female, 'Tabea', 'Schwarz', 20),
		new Player(Gender.Female, 'Anna', 'Behlen', 20),
		new Player(Gender.Female, 'Sarah', 'Schulz', 25),
		new Player(Gender.Female, 'Leonie', 'Klinke', 15),
		new Player(Gender.Female, 'Lisa-Sophie', 'Kotzan', 15),
		new Player(Gender.Female, 'Rika', 'Dieckmann', 10),
		new Player(Gender.Female, 'Clara', 'Dreßen', 10),
		new Player(Gender.Female, 'Mila', 'Jancar', 5),
		new Player(Gender.Female, 'Josefine', 'Schäkel', 5),
		new Player(Gender.Female, 'Sandra', 'Otte', 5),
		new Player(Gender.Female, 'Annalena', 'Richter', 5)
	];

	function handleViewChange(nextMode: ViewMode) {
		activeView = nextMode;
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
