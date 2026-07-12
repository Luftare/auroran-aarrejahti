// One icon per area, shared by the level lists, the onboarding area tabs
// and the HUD level chip.
import Flower2 from '@lucide/svelte/icons/flower-2';
import Trees from '@lucide/svelte/icons/trees';
import Mountain from '@lucide/svelte/icons/mountain';
import type { LevelId } from '$lib/game/chests';

export const LEVEL_ICONS: Record<LevelId, typeof Flower2> = {
	puutarha: Flower2,
	metsa: Trees,
	seutu: Mountain
};
