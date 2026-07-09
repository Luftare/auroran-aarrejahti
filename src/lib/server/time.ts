// All game-day logic uses calendar days in Europe/Helsinki, decided by the server.

const fmt = new Intl.DateTimeFormat('sv-SE', {
	timeZone: 'Europe/Helsinki',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

/** Current game day as 'YYYY-MM-DD' in Europe/Helsinki. */
export function helsinkiToday(): string {
	return fmt.format(new Date());
}

/** Difference in whole days between two 'YYYY-MM-DD' strings (b - a). */
export function dayDiff(a: string, b: string): number {
	const ms = Date.UTC(...parseDay(b)) - Date.UTC(...parseDay(a));
	return Math.round(ms / 86_400_000);
}

/** 'YYYY-MM-DD' plus n days. */
export function addDays(day: string, n: number): string {
	const d = new Date(Date.UTC(...parseDay(day)));
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

function parseDay(day: string): [number, number, number] {
	const [y, m, d] = day.split('-').map(Number);
	return [y, m - 1, d];
}
