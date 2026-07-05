<script lang="ts">
	type Match = {
		game: number;
		time: string;
		rows: [string, string];
		title?: string;
		isFinal?: boolean;
	};

	type Bracket = {
		roundOf16Winners: Match[];
		quarterWinners: Match[];
		center: {
			top: Match;
			final: Match;
			bottom: Match;
		};
		quarterLosers: Match[];
		roundOf16Losers: Match[];
	};

	type BracketKind = 'men' | 'women';

	type TournamentBracketProps = {
		lockedBracket?: BracketKind | null;
	};

	let { lockedBracket = null }: TournamentBracketProps = $props();

	const ROUND_TITLES = {
		roundOf16Winners: 'Achtelfinale Winner',
		quarterWinners: 'Viertelfinale Winner',
		center: 'Halbfinale & Finale',
		quarterLosers: 'Viertelfinale Loser',
		roundOf16Losers: 'Achtelfinale Loser'
	};

	function createOpeningRows(prefix: string): [string, string][] {
		return [
			[`${prefix} Team 1 / ${prefix} Team 2`, `${prefix} Team 3 / ${prefix} Team 4`],
			[`${prefix} Team 5 / ${prefix} Team 6`, `${prefix} Team 7 / ${prefix} Team 8`],
			[`${prefix} Team 9 / ${prefix} Team 10`, `${prefix} Team 11 / ${prefix} Team 12`],
			[`${prefix} Team 13 / ${prefix} Team 14`, `${prefix} Team 15 / ${prefix} Team 16`]
		];
	}

	function createBracket(prefix: string): Bracket {
		const openingRows = createOpeningRows(prefix);

		return {
			roundOf16Winners: [
				{ game: 1, time: 'Fr, 20:30', rows: openingRows[0] },
				{ game: 2, time: 'Fr, 17:15', rows: openingRows[1] },
				{ game: 3, time: 'Fr, 16:15', rows: openingRows[2] },
				{ game: 4, time: 'Fr, 21:30', rows: openingRows[3] }
			],
			quarterWinners: [
				{ game: 7, time: 'Sa, 15:30', rows: ['Gewinner Spiel 1', 'Gewinner Spiel 2'] },
				{ game: 8, time: 'Sa, 16:30', rows: ['Gewinner Spiel 3', 'Gewinner Spiel 4'] }
			],
			center: {
				top: { game: 11, time: 'So, 12:00', rows: ['Gewinner Spiel 7', 'Gewinner Spiel 9'] },
				final: {
					game: 13,
					time: 'So, 16:30',
					rows: ['Gewinner Spiel 11', 'Gewinner Spiel 12'],
					title: 'FINALE',
					isFinal: true
				},
				bottom: { game: 12, time: 'So, 13:00', rows: ['Gewinner Spiel 8', 'Gewinner Spiel 10'] }
			},
			quarterLosers: [
				{ game: 9, time: 'Sa, 21:00', rows: ['Gewinner Spiel 5', 'Verlierer Spiel 8'] },
				{ game: 10, time: 'Sa, 20:00', rows: ['Gewinner Spiel 6', 'Verlierer Spiel 7'] }
			],
			roundOf16Losers: [
				{ game: 5, time: 'Sa, 11:30', rows: ['Verlierer Spiel 1', 'Verlierer Spiel 2'] },
				{ game: 6, time: 'Sa, 12:30', rows: ['Verlierer Spiel 3', 'Verlierer Spiel 4'] }
			]
		};
	}

	const menBracket = createBracket('M');
	const womenBracket = createBracket('F');

	let activeBracket = $state<BracketKind>('men');

	$effect(() => {
		if (lockedBracket !== null) {
			activeBracket = lockedBracket;
		}
	});

	const showBracketTabs = $derived(lockedBracket === null);
	const currentBracket = $derived(activeBracket === 'men' ? menBracket : womenBracket);
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
		</div>
	</header>

	<div
		class="bracket-surface overflow-x-auto rounded-2xl border border-slate-700 p-3 shadow-2xl sm:p-4"
	>
		<div class="bracket-grid min-w-[1160px] gap-4">
			<div class="space-y-4">
				<h2 class="bracket-column-title">{ROUND_TITLES.roundOf16Winners}</h2>
				{#each currentBracket.roundOf16Winners as match, index (match.game)}
					<div class={`match-wrap ${index >= 2 ? 'mt-24' : ''}`}>
						<div class="match-card">
							<div class="match-head">
								<p>Spiel {match.game}</p>
								<p>{match.time}</p>
							</div>
							<div class="team-row">{match.rows[0]}</div>
							<div class="team-row">{match.rows[1]}</div>
							<span class="connector connector-right">&rarr;</span>
						</div>
					</div>
				{/each}
			</div>

			<div class="space-y-40 pt-10">
				<h2 class="bracket-column-title">{ROUND_TITLES.quarterWinners}</h2>
				{#each currentBracket.quarterWinners as match (match.game)}
					<div class="match-wrap">
						<div class="match-card">
							<div class="match-head">
								<p>Spiel {match.game}</p>
								<p>{match.time}</p>
							</div>
							<div class="team-row">{match.rows[0]}</div>
							<div class="team-row">{match.rows[1]}</div>
							<span class="connector connector-right">&rarr;</span>
						</div>
					</div>
				{/each}
			</div>

			<div class="space-y-8 pt-12">
				<h2 class="bracket-column-title">{ROUND_TITLES.center}</h2>
				<div class="match-wrap">
					<div class="match-card">
						<div class="match-head">
							<p>Spiel {currentBracket.center.top.game}</p>
							<p>{currentBracket.center.top.time}</p>
						</div>
						<div class="team-row">{currentBracket.center.top.rows[0]}</div>
						<div class="team-row">{currentBracket.center.top.rows[1]}</div>
					</div>
				</div>

				<div class="match-wrap final-wrap">
					<div class="final-icon">🏆</div>
					<div class="match-card final-card">
						<div class="match-head">
							<p>
								Spiel {currentBracket.center.final.game}
								{#if currentBracket.center.final.title}
									- {currentBracket.center.final.title}
								{/if}
							</p>
							<p>{currentBracket.center.final.time}</p>
						</div>
						<div class="team-row">{currentBracket.center.final.rows[0]}</div>
						<div class="team-row">{currentBracket.center.final.rows[1]}</div>
					</div>
				</div>

				<div class="match-wrap">
					<div class="match-card">
						<div class="match-head">
							<p>Spiel {currentBracket.center.bottom.game}</p>
							<p>{currentBracket.center.bottom.time}</p>
						</div>
						<div class="team-row">{currentBracket.center.bottom.rows[0]}</div>
						<div class="team-row">{currentBracket.center.bottom.rows[1]}</div>
					</div>
				</div>
			</div>

			<div class="space-y-40 pt-10">
				<h2 class="bracket-column-title">{ROUND_TITLES.quarterLosers}</h2>
				{#each currentBracket.quarterLosers as match (match.game)}
					<div class="match-wrap">
						<div class="match-card">
							<div class="match-head">
								<p>Spiel {match.game}</p>
								<p>{match.time}</p>
							</div>
							<div class="team-row">{match.rows[0]}</div>
							<div class="team-row">{match.rows[1]}</div>
							<span class="connector connector-left">&larr;</span>
						</div>
					</div>
				{/each}
			</div>

			<div class="space-y-40 pt-2">
				<h2 class="bracket-column-title">{ROUND_TITLES.roundOf16Losers}</h2>
				{#each currentBracket.roundOf16Losers as match (match.game)}
					<div class="match-wrap">
						<div class="match-card">
							<div class="match-head">
								<p>Spiel {match.game}</p>
								<p>{match.time}</p>
							</div>
							<div class="team-row">{match.rows[0]}</div>
							<div class="team-row">{match.rows[1]}</div>
							<span class="connector connector-left">&larr;</span>
						</div>
					</div>
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
