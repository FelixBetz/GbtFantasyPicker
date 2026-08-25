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
	maxRemainingBudget?: number;
	maxGenderDifference?: number;
	resultLimit?: number;
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
	maxTeamSize,
	maxRemainingBudget = budget,
	maxGenderDifference = maxTeamSize,
	resultLimit = 50000
}: FindTeamFillCombinationsInput): TeamCombinationResult[] {
	const currentIds = new Set(currentTeam.map((player) => player.id));
	// Sorted descending so the DFS explores expensive (budget-using) picks first,
	// and so the prefix sums below give a valid upper bound for pruning.
	const candidates = players
		.filter((player) => !currentIds.has(player.id))
		.sort((a, b) => b.coins - a.coins);
	const currentCoins = currentTeam.reduce((sum, player) => sum + player.coins, 0);
	const { womenCount: currentWomen, menCount: currentMen } = countByGender(currentTeam);
	const slotsToFill = maxTeamSize - currentTeam.length;

	if (slotsToFill <= 0) {
		return [];
	}

	// A combination is only useful if its final remainingBudget is <= maxRemainingBudget,
	// i.e. its total coin spend is >= this floor. Combined with the budget ceiling, this
	// collapses the search to a narrow coin-spend window instead of every possible subset.
	const minRequiredCoins = budget - maxRemainingBudget;

	const candidateCount = candidates.length;
	const prefixSums = new Array(candidateCount + 1).fill(0);
	// Suffix counts of how many women/men remain from index i onward, used to bound
	// the best achievable gender split for the still-open slots.
	const womenSuffix = new Array(candidateCount + 1).fill(0);
	const menSuffix = new Array(candidateCount + 1).fill(0);
	for (let i = 0; i < candidateCount; i += 1) {
		prefixSums[i + 1] = prefixSums[i] + candidates[i].coins;
	}
	for (let i = candidateCount - 1; i >= 0; i -= 1) {
		const isWoman = candidates[i].gender === Gender.Female;
		womenSuffix[i] = womenSuffix[i + 1] + (isWoman ? 1 : 0);
		menSuffix[i] = menSuffix[i + 1] + (isWoman ? 0 : 1);
	}

	function maxAdditionalCoins(startIndex: number, slots: number): number {
		const take = Math.min(slots, candidateCount - startIndex);
		return prefixSums[startIndex + take] - prefixSums[startIndex];
	}

	// Best (smallest) final gender difference achievable for the open slots, given how
	// many women/men are still available from startIndex onward. Returns Infinity if
	// there simply aren't enough of one gender left to fill the remaining slots at all.
	function bestAchievableGenderDiff(
		startIndex: number,
		remainingSlots: number,
		pickedWomen: number,
		pickedMen: number
	): number {
		const womenAvailable = womenSuffix[startIndex];
		const menAvailable = menSuffix[startIndex];
		const maxWomenPick = Math.min(remainingSlots, womenAvailable);
		const minWomenPick = Math.max(0, remainingSlots - menAvailable);

		if (minWomenPick > maxWomenPick) {
			return Infinity;
		}

		const diffBeforeRemaining = currentWomen + pickedWomen - (currentMen + pickedMen);
		// finalDiff(x) = |diffBeforeRemaining + x - (remainingSlots - x)|, minimized over
		// achievable x (women picked among the remaining slots).
		const idealWomenPick = Math.round((remainingSlots - diffBeforeRemaining) / 2);
		const candidatesForX = [
			minWomenPick,
			maxWomenPick,
			Math.min(maxWomenPick, Math.max(minWomenPick, idealWomenPick))
		];

		let best = Infinity;
		for (const x of candidatesForX) {
			const diff = Math.abs(diffBeforeRemaining + 2 * x - remainingSlots);
			if (diff < best) {
				best = diff;
			}
		}

		return best;
	}

	const results: TeamCombinationResult[] = [];
	const picked: Player[] = [];

	function dfs(startIndex: number, pickedCoins: number, pickedWomen: number, pickedMen: number) {
		if (results.length >= resultLimit) {
			return;
		}

		const remainingSlots = slotsToFill - picked.length;

		if (remainingSlots === 0) {
			const totalCoins = currentCoins + pickedCoins;
			const remainingBudget = budget - totalCoins;
			const womenCount = currentWomen + pickedWomen;
			const menCount = currentMen + pickedMen;
			const genderDifference = Math.abs(womenCount - menCount);

			// The pruning above only proves a threshold is still reachable, not that this
			// particular path reached it - only bank combinations that actually qualify,
			// so the result cap isn't spent on ones the UI would filter out anyway.
			if (remainingBudget > maxRemainingBudget || genderDifference > maxGenderDifference) {
				return;
			}

			results.push({
				addedPlayers: [...picked],
				totalCoins,
				remainingBudget,
				womenCount,
				menCount,
				genderDifference,
				genderEmojiRow: `${'👩'.repeat(womenCount)}${'👨'.repeat(menCount)}`
			});
			return;
		}

		// Even picking the (already-sorted) best remaining candidates can't reach the
		// required spend floor from here on, so the whole branch can be dropped.
		const bestCase = pickedCoins + maxAdditionalCoins(startIndex, remainingSlots);
		if (currentCoins + bestCase < minRequiredCoins) {
			return;
		}

		// No achievable gender split of the remaining slots stays within the limit either.
		if (
			bestAchievableGenderDiff(startIndex, remainingSlots, pickedWomen, pickedMen) >
			maxGenderDifference
		) {
			return;
		}

		const lastStart = candidateCount - remainingSlots;
		for (let i = startIndex; i <= lastStart; i += 1) {
			const next = candidates[i];
			const totalIfAdded = currentCoins + pickedCoins + next.coins;

			if (totalIfAdded > budget) {
				continue;
			}

			const isWoman = next.gender === Gender.Female;
			picked.push(next);
			dfs(
				i + 1,
				pickedCoins + next.coins,
				pickedWomen + (isWoman ? 1 : 0),
				pickedMen + (isWoman ? 0 : 1)
			);
			picked.pop();

			if (results.length >= resultLimit) {
				return;
			}
		}
	}

	dfs(0, 0, 0, 0);

	return results.sort((a, b) => {
		if (a.remainingBudget !== b.remainingBudget) {
			return a.remainingBudget - b.remainingBudget;
		}

		const aIds = a.addedPlayers.map((player) => player.id).join('-');
		const bIds = b.addedPlayers.map((player) => player.id).join('-');
		return aIds.localeCompare(bIds);
	});
}
