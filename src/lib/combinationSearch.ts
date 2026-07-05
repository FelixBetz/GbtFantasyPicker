import { Gender, Player } from './player';

export type TeamCombinationResult = {
	addedPlayers: Player[];
	totalCoins: number;
	remainingBudget: number;
	womenCount: number;
	menCount: number;
	genderDifference: number;
	genderEmojiRow: string;
};

type FindTeamFillCombinationsInput = {
	players: Player[];
	currentTeam: Player[];
	budget: number;
	maxTeamSize: number;
};

function countByGender(team: Player[]) {
	let womenCount = 0;
	let menCount = 0;

	for (const player of team) {
		if (player.gender === Gender.Female) {
			womenCount += 1;
		} else {
			menCount += 1;
		}
	}

	return { womenCount, menCount };
}

export function findTeamFillCombinations({
	players,
	currentTeam,
	budget,
	maxTeamSize
}: FindTeamFillCombinationsInput): TeamCombinationResult[] {
	const currentIds = new Set(currentTeam.map((player) => player.id));
	const candidates = players.filter((player) => !currentIds.has(player.id));
	const currentCoins = currentTeam.reduce((sum, player) => sum + player.coins, 0);
	const slotsToFill = maxTeamSize - currentTeam.length;

	if (slotsToFill <= 0) {
		return [];
	}

	const results: TeamCombinationResult[] = [];
	const picked: Player[] = [];

	function dfs(startIndex: number, pickedCoins: number) {
		if (picked.length === slotsToFill) {
			const fullTeam = [...currentTeam, ...picked];
			const totalCoins = currentCoins + pickedCoins;
			const remainingBudget = budget - totalCoins;
			const { womenCount, menCount } = countByGender(fullTeam);

			results.push({
				addedPlayers: [...picked],
				totalCoins,
				remainingBudget,
				womenCount,
				menCount,
				genderDifference: Math.abs(womenCount - menCount),
				genderEmojiRow: `${'👩'.repeat(womenCount)}${'👨'.repeat(menCount)}`
			});
			return;
		}

		for (let i = startIndex; i < candidates.length; i += 1) {
			const next = candidates[i];
			const totalIfAdded = currentCoins + pickedCoins + next.coins;

			if (totalIfAdded > budget) {
				continue;
			}

			picked.push(next);
			dfs(i + 1, pickedCoins + next.coins);
			picked.pop();
		}
	}

	dfs(0, 0);

	return results.sort((a, b) => {
		if (a.remainingBudget !== b.remainingBudget) {
			return a.remainingBudget - b.remainingBudget;
		}

		const aIds = a.addedPlayers.map((player) => player.id).join('-');
		const bIds = b.addedPlayers.map((player) => player.id).join('-');
		return aIds.localeCompare(bIds);
	});
}
