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
		new Player(Gender.Male, 'Tim', 'Berger', 40),
		new Player(Gender.Male, 'Timo', 'Hammarberg', 40),
		new Player(Gender.Male, 'Paul', 'Henning', 40),
		new Player(Gender.Male, 'Lukas', 'Pfretzschner', 45),
		new Player(Gender.Male, 'Elouan', 'Chouikh-Barbez', 40),
		new Player(Gender.Male, 'Joadel', 'Genevieve-Gardoque', 40),
		new Player(Gender.Male, 'Philipp', 'Huster', 30),
		new Player(Gender.Male, 'Sven', 'Winter', 30),
		new Player(Gender.Male, 'Jonas', 'Sagstetter', 35),
		new Player(Gender.Male, 'Robin', 'Sowa', 30),
		new Player(Gender.Male, 'Momme', 'Lorenz', 30),
		new Player(Gender.Male, 'Tilo', 'Rietschel', 30),
		new Player(Gender.Male, 'Max', 'Just', 30),
		new Player(Gender.Male, 'Kalle', 'Pieper', 10),
		new Player(Gender.Male, 'Tristan', 'Fröbel', 15),
		new Player(Gender.Male, 'Tamo', 'Wüst', 20),
		//////////////////////////////////////////////////////////////////////////
		new Player(Gender.Female, 'Sandra', 'Ittlinger', 45),
		new Player(Gender.Female, 'Kim', 'van de Velde', 40),
		new Player(Gender.Female, 'Dorina', 'Klinger', 35),
		new Player(Gender.Female, 'Ronja', 'Klinger', 35),
		new Player(Gender.Female, 'Ieva', 'Dumbauskaite', 30),
		new Player(Gender.Female, 'Gerda', 'Grudzinskaite', 30),
		new Player(Gender.Female, 'Anna-Lena', 'Grüne', 35),
		new Player(Gender.Female, 'Janne', 'Uhl', 20),
		new Player(Gender.Female, 'Anna', 'Behlen', 20),
		new Player(Gender.Female, 'Melanie', 'Paul', 45),
		new Player(Gender.Female, 'Chenoa', 'Christ', 10),
		new Player(Gender.Female, 'Sophia', 'Neuß', 15),
		new Player(Gender.Female, 'Melanie', 'Gernert', 35),
		new Player(Gender.Female, 'Nele', 'Barber', 20),
		new Player(Gender.Female, 'Elea', 'Beutel', 25),
		new Player(Gender.Female, 'Paula', 'Schürholz', 40)
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
