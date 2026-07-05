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

	let activeView = $state<ViewMode>('bracket-men');
	let bracketStatsByView = $state<{
		men: Record<number, PlayerStats>;
		women: Record<number, PlayerStats>;
	}>({
		men: {},
		women: {}
	});

	const players: Player[] = [
		new Player(1, 2, Gender.Male, 'Nils', 'Ehlers', 50),
		new Player(2, 1, Gender.Male, 'Lui', 'Wüst', 40),
		new Player(3, 4, Gender.Male, 'Jonas', 'Sagstetter', 35),
		new Player(4, 3, Gender.Male, 'Benedikt', 'Sagstetter', 30),
		new Player(5, 6, Gender.Male, 'Momme', 'Lorenz', 20),
		new Player(6, 5, Gender.Male, 'Tilo', 'Rietschel', 25),
		new Player(7, 8, Gender.Male, 'Max', 'Just', 35),
		new Player(8, 7, Gender.Male, 'Kalle', 'Pieper', 10),
		new Player(9, 10, Gender.Male, 'Niklas', 'Held', 30),
		new Player(10, 9, Gender.Male, 'Luis', 'Kubo', 20),
		new Player(11, 12, Gender.Male, 'Jonas', 'Reinhardt', 25),
		new Player(12, 11, Gender.Male, 'Robin', 'Sowa', 30),
		new Player(13, 14, Gender.Male, 'Milan', 'Sievers', 15),
		new Player(14, 13, Gender.Male, 'Eric', 'Stadie-Seeber', 15),
		new Player(15, 16, Gender.Male, 'Jonas', 'Kaminski', 5),
		new Player(16, 15, Gender.Male, 'Janik', 'Sambale', 5),
		new Player(17, 18, Gender.Female, 'Lea', 'Kunst', 40),
		new Player(18, 17, Gender.Female, 'Melanie', 'Paul', 45),
		new Player(19, 20, Gender.Female, 'Anna-Lena', 'Grüne', 35),
		new Player(20, 19, Gender.Female, 'Janne', 'Uhl', 20),
		new Player(21, 22, Gender.Female, 'Sarah', 'Schulz', 25),
		new Player(22, 21, Gender.Female, 'Kim', 'van de Velde', 40),
		new Player(23, 24, Gender.Female, 'Chenoa', 'Christ', 10),
		new Player(24, 23, Gender.Female, 'Sophia', 'Neuß', 15),
		new Player(25, 26, Gender.Female, 'Nele', 'Barber', 20),
		new Player(26, 25, Gender.Female, 'Melanie', 'Gernert', 35),
		new Player(27, 28, Gender.Female, 'Mareet', 'Maidhof', 20),
		new Player(28, 27, Gender.Female, 'Tabea', 'Schwarz', 20),
		new Player(29, 30, Gender.Female, 'Emma', 'Gangey', 5),
		new Player(30, 29, Gender.Female, 'Leonie', 'Klinke', 15),
		new Player(31, 32, Gender.Female, 'Mila', 'Jancar', 5),
		new Player(32, 31, Gender.Female, 'Josefine', 'Schäkel', 5)
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
