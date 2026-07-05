<script lang="ts">
	import { Player } from './player';

	type TeamSummaryPanelProps = {
		team: Player[];
		teamCoins: number;
		coinsBudget: number;
		maxTeamSize: number;
		teamGenderEmojis: string;
		onRemovePlayer: (playerId: number) => void;
	};

	let {
		team,
		teamCoins,
		coinsBudget,
		maxTeamSize,
		teamGenderEmojis,
		onRemovePlayer
	}: TeamSummaryPanelProps = $props();
</script>

<aside class="h-fit rounded-xl border border-amber-200 bg-white p-4 shadow-sm xl:sticky xl:top-4">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-lg font-bold text-stone-800">Dein Team</h3>
		<span class="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900"
			>{team.length}/{maxTeamSize}</span
		>
	</div>

	<div class="mb-4 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
		<span class="text-sm font-semibold text-stone-700">Coins</span>
		<span class="inline-flex items-center gap-2 text-lg font-bold text-amber-900">
			{teamCoins}/{coinsBudget}
			<img src="/Coins.png" alt="Coins" class="h-6 w-6 object-contain" />
		</span>
	</div>

	<div class="mb-4 rounded-lg bg-stone-50 px-3 py-2">
		<p class="text-2xl leading-none">{teamGenderEmojis}</p>
	</div>

	{#if team.length === 0}
		<p class="text-sm text-stone-500">
			Klicke links auf Spieler, um sie zu deinem Team hinzuzufügen.
		</p>
	{:else}
		<ul class="space-y-2">
			{#each team as teamPlayer}
				<li class="flex items-center gap-2 rounded-lg border border-amber-100 px-2 py-2">
					<img
						class="h-10 w-10 rounded-full bg-amber-100 object-cover"
						src={teamPlayer.imgurl}
						alt={`${teamPlayer.firstName} ${teamPlayer.lastName}`}
					/>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold text-stone-800">
							{teamPlayer.firstName}
							{teamPlayer.lastName}
						</p>
						<p class="inline-flex items-center gap-1 text-xs font-semibold text-amber-900">
							{teamPlayer.coins}
							<img src="/Coins.png" alt="Coins" class="h-4 w-4 object-contain" />
						</p>
					</div>
					<button
						type="button"
						onclick={() => onRemovePlayer(teamPlayer.id)}
						class="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
					>
						Entfernen
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</aside>
