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

	let activeView = $state<ViewMode>('bracket-women');
	let bracketStatsByView = $state<{
		men: Record<number, PlayerStats>;
		women: Record<number, PlayerStats>;
	}>({
		men: {},
		women: {}
	});

	/*
		Seed-Reihenfolge (1:1) fuer GBC-Bracket, Quelle DVV Setzliste:
		Maenner (id=14643)
		1 Ehlers - Wuest
		2 Henning - Pfretzschner
		3 Huster - Winter
		4 Sagstetter - Sagstetter
		5 Lorenz - Rietschel
		6 Froebel - Wuest
		7 Held - Kubo
		8 Just - Pieper
		9 Reinhardt - Sowa
		10 Paszkiewicz - Peters
		11 Sievers - Stadie-Seeber
		12 Henrichs - Moede
		13 Bungert - Wuest
		14 Hikel - Sackermann
		15 Huber - Schneckenburger
		16 Kaminski - Sambale

		Frauen (id=14642)
		1 Mueller - Tillmann
		2 Ittlinger - van de Velde
		3 Bock - Kunst
		4 Gruene - Uhl
		5 Lippmann - Paul
		6 Beutel - Schuerholz
		7 Christ - Neuss
		8 Maidhof - Schwarz
		9 Barber - Gernert
		10 Behlen - Schulz
		11 Jancar - Schaekel
		12 Klinke - Reformat
		13 Dieckmann - Dressen
		14 Otte - Richter
		15 Gangey - Marunde
		16 Interwies - Schmitt
	*/

	const players: Player[] = [
		new Player(Gender.Male, 'Nils', 'Ehlers', 0),
		new Player(Gender.Male, 'Lui', 'Wüst', 0),
		new Player(Gender.Male, 'Paul', 'Henning', 0),
		new Player(Gender.Male, 'Lukas', 'Pfretzschner', 0),
		new Player(Gender.Male, 'Philipp Konstantin', 'Huster', 0),
		new Player(Gender.Male, 'Sven', 'Winter', 0),
		new Player(Gender.Male, 'Benedikt', 'Sagstetter', 0),
		new Player(Gender.Male, 'Jonas', 'Sagstetter', 0),
		new Player(Gender.Male, 'Momme', 'Lorenz', 0),
		new Player(Gender.Male, 'Tilo', 'Rietschel', 0),
		new Player(Gender.Male, 'Tristan', 'Fröbel', 0),
		new Player(Gender.Male, 'Tamo', 'Wüst', 0),
		new Player(Gender.Male, 'Niklas', 'Held', 0),
		new Player(Gender.Male, 'Luis', 'Kubo', 0),
		new Player(Gender.Male, 'Max', 'Just', 0),
		new Player(Gender.Male, 'Kalle', 'Pieper', 0),
		new Player(Gender.Male, 'Jonas', 'Reinhardt', 0),
		new Player(Gender.Male, 'Robin', 'Sowa', 0),
		new Player(Gender.Male, 'Colin', 'Paszkiewicz', 0),
		new Player(Gender.Male, 'Charlie', 'Peters', 0),
		new Player(Gender.Male, 'Milan', 'Sievers', 0),
		new Player(Gender.Male, 'Eric', 'Stadie-Seeber', 0),
		new Player(Gender.Male, 'Luis', 'Henrichs', 0),
		new Player(Gender.Male, 'Cedrik', 'Moede', 0),
		new Player(Gender.Male, 'Jonathan', 'Bungert', 0),
		new Player(Gender.Male, 'Filo', 'Wüst', 0),
		new Player(Gender.Male, 'Julian', 'Hikel', 0),
		new Player(Gender.Male, 'Ole', 'Sackermann', 0),
		new Player(Gender.Male, 'Kim', 'Huber', 0),
		new Player(Gender.Male, 'Valentin', 'Schneckenburger', 0),
		new Player(Gender.Male, 'Jonas', 'Kaminski', 0),
		new Player(Gender.Male, 'Janik', 'Sambale', 0),
		//////////////////////////////////////////////////////////////////////////
		new Player(Gender.Female, 'Svenja', 'Müller', 0),
		new Player(Gender.Female, 'Cinja', 'Tillmann', 0),
		new Player(Gender.Female, 'Sandra', 'Ittlinger', 0),
		new Player(Gender.Female, 'Kim', 'van de Velde', 0),
		new Player(Gender.Female, 'Linda', 'Bock', 0),
		new Player(Gender.Female, 'Lea Sophie', 'Kunst', 0),
		new Player(Gender.Female, 'Anna-Lena', 'Grüne', 0),
		new Player(Gender.Female, 'Janne', 'Uhl', 0),
		new Player(Gender.Female, 'Louisa', 'Lippmann', 0),
		new Player(Gender.Female, 'Melanie', 'Paul', 0),
		new Player(Gender.Female, 'Elea', 'Beutel', 0),
		new Player(Gender.Female, 'Paula', 'Schürholz', 0),
		new Player(Gender.Female, 'Chenoa', 'Christ', 0),
		new Player(Gender.Female, 'Sophia', 'Neuß', 0),
		new Player(Gender.Female, 'Mareet', 'Maidhof', 0),
		new Player(Gender.Female, 'Tabea', 'Schwarz', 0),
		new Player(Gender.Female, 'Nele', 'Barber', 0),
		new Player(Gender.Female, 'Melanie', 'Gernert', 0),
		new Player(Gender.Female, 'Anna', 'Behlen', 0),
		new Player(Gender.Female, 'Sarah', 'Schulz', 0),
		new Player(Gender.Female, 'Mila', 'Jancar', 0),
		new Player(Gender.Female, 'Josefine', 'Schäkel', 0),
		new Player(Gender.Female, 'Leonie', 'Klinke', 0),
		new Player(Gender.Female, 'Anna-Chiara', 'Reformat', 0),
		new Player(Gender.Female, 'Rika', 'Dieckmann', 0),
		new Player(Gender.Female, 'Clara', 'Dreßen', 0),
		new Player(Gender.Female, 'Sandra', 'Otte', 0),
		new Player(Gender.Female, 'Annalena', 'Richter', 0),
		new Player(Gender.Female, 'Emma', 'Gangey', 0),
		new Player(Gender.Female, 'Louisa', 'Marunde', 0),
		new Player(Gender.Female, 'Nina', 'Interwies', 0),
		new Player(Gender.Female, 'Nele', 'Schmitt', 0)
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
