<script lang="ts">
	import { fi } from '$lib/fi';
	import { api, ApiError } from '$lib/client/api';
	import { geo } from '$lib/client/geo.svelte';

	type LootResponse = {
		ok: true;
		coinCount: number;
		coins: number;
		streak: number;
		isFirstLootToday: boolean;
	};

	let {
		chestId,
		onlooted,
		onback
	}: {
		chestId: string;
		onlooted: (result: LootResponse) => void;
		onback: () => void;
	} = $props();

	let phase = $state<'closed' | 'tapping' | 'open' | 'error'>('closed');
	let result = $state<LootResponse | null>(null);
	let tapsDone = $state(0);
	let shaking = $state(false);
	let errorMessage = $state('');
	let coins = $state<{ id: number; dx: number; rot: number }[]>([]);
	let coinSeq = 0;
	let busy = false;

	async function tap() {
		if (phase === 'open' || busy) return;

		// Ensimmäinen napautus sitoo ryöstön palvelimella ja paljastaa kolikkomäärän.
		if (phase === 'closed') {
			busy = true;
			try {
				result = await api.post<LootResponse>(`/api/chests/${chestId}/loot`, {
					lat: geo.lat,
					lng: geo.lng,
					accuracy: geo.accuracy
				});
				phase = 'tapping';
			} catch (e) {
				errorMessage = e instanceof ApiError ? e.message : fi.errorMessage('SERVER_ERROR');
				phase = 'error';
				busy = false;
				return;
			}
			busy = false;
		}

		if (!result) return;
		tapsDone += 1;
		popCoin();
		navigator.vibrate?.(tapsDone === result.coinCount ? [30, 40, 60] : 15);
		if (tapsDone >= result.coinCount) {
			phase = 'open';
			onlooted(result);
		} else {
			shaking = false;
			requestAnimationFrame(() => (shaking = true));
		}
	}

	function popCoin() {
		const id = coinSeq++;
		coins = [...coins, { id, dx: Math.random() * 120 - 60, rot: Math.random() * 360 }];
		setTimeout(() => (coins = coins.filter((c) => c.id !== id)), 900);
	}
</script>

<div class="stage">
	{#if phase === 'error'}
		<p class="error-text">{errorMessage}</p>
		<button class="btn" onclick={onback}>{fi.backToMap}</button>
	{:else}
		<button
			class="chest"
			class:shaking
			class:open={phase === 'open'}
			onclick={tap}
			aria-label={fi.tapToOpen}
		>
			<svg viewBox="0 0 120 100" width="180" height="150" xmlns="http://www.w3.org/2000/svg">
				<g class="lid" class:lifted={phase === 'open'}>
					<path d="M15 45 a45 28 0 0 1 90 0 z" fill="#a06a33" stroke="#5c3a17" stroke-width="4" />
					<path d="M15 45 a45 28 0 0 1 90 0" fill="none" stroke="#ffd166" stroke-width="2" opacity="0.5" />
				</g>
				<rect x="15" y="45" width="90" height="45" rx="8" fill="#8a5a2b" stroke="#5c3a17" stroke-width="4" />
				<rect x="52" y="40" width="16" height="24" rx="4" fill="#ffd166" stroke="#b8860b" stroke-width="2" />
				{#if phase === 'open'}
					<g class="glow">
						<ellipse cx="60" cy="45" rx="34" ry="12" fill="#ffd166" opacity="0.55" />
					</g>
				{/if}
			</svg>
			{#each coins as coin (coin.id)}
				<span class="coin" style="--dx: {coin.dx}px; --rot: {coin.rot}deg">🪙</span>
			{/each}
		</button>

		{#if phase === 'closed'}
			<p class="prompt">{fi.tapToOpen}</p>
		{:else if phase === 'tapping' && result}
			<p class="prompt">{fi.tapsLeft(result.coinCount - tapsDone)}</p>
			<div class="tap-dots">
				{#each Array(result.coinCount) as _, i}
					<span class="dot" class:filled={i < tapsDone}></span>
				{/each}
			</div>
		{:else if phase === 'open' && result}
			<p class="reward">{fi.gotCoins(result.coinCount)}</p>
			{#if result.isFirstLootToday}
				<p class="streak-note">
					{result.streak === 1 ? fi.streakStarted : fi.streakContinues(result.streak)}
				</p>
			{/if}
			<button class="btn btn-primary" onclick={onback}>{fi.backToMap}</button>
		{/if}
	{/if}
</div>

<style>
	.stage {
		width: min(90vw, 420px);
		aspect-ratio: 1;
		margin: 0 auto;
		border-radius: 50%;
		border: 3px solid var(--border);
		background:
			radial-gradient(80% 80% at 50% 30%, rgba(255, 209, 102, 0.12), transparent 70%),
			var(--bg-raised);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		box-shadow:
			0 0 0 6px rgba(255, 209, 102, 0.08),
			0 0 40px rgba(255, 209, 102, 0.12),
			var(--shadow);
		padding: 1.5rem;
		text-align: center;
	}

	.chest {
		position: relative;
		line-height: 0;
	}

	.chest.shaking svg {
		animation: shake 300ms ease;
	}

	@keyframes shake {
		0%, 100% { transform: rotate(0); }
		25% { transform: rotate(-4deg) scale(1.04); }
		75% { transform: rotate(4deg) scale(1.04); }
	}

	.lid {
		transform-origin: 15px 45px;
		transition: transform 400ms cubic-bezier(0.2, 1.6, 0.4, 1);
	}

	.lid.lifted {
		transform: rotate(-28deg) translateY(-6px);
	}

	.glow ellipse {
		animation: glow 1.2s ease-in-out infinite alternate;
	}

	@keyframes glow {
		from { opacity: 0.35; }
		to { opacity: 0.7; }
	}

	.coin {
		position: absolute;
		left: 50%;
		top: 20%;
		font-size: 1.6rem;
		pointer-events: none;
		animation: fly 850ms ease-out forwards;
	}

	@keyframes fly {
		0% { transform: translate(-50%, 0) rotate(0); opacity: 1; }
		60% { transform: translate(calc(-50% + var(--dx)), -90px) rotate(var(--rot)); opacity: 1; }
		100% { transform: translate(calc(-50% + var(--dx)), -40px) rotate(var(--rot)); opacity: 0; }
	}

	.prompt {
		font-weight: 600;
		margin: 0;
	}

	.tap-dots {
		display: flex;
		gap: 0.35rem;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 1.5px solid var(--gold);
		background: transparent;
		transition: background 150ms ease;
	}

	.dot.filled {
		background: var(--gold);
	}

	.reward {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--gold);
		margin: 0;
	}

	.streak-note {
		color: var(--aurora-green);
		font-weight: 600;
		margin: 0;
	}
</style>
