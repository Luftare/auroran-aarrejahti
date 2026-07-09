// Haamupelaajien nimet muodostetaan huolletuista sanalistoista, joten
// generoitu nimi ei voi koskaan olla sopimaton.

const ADJEKTIIVIT = [
	'Utuinen', 'Nokkela', 'Hiljainen', 'Ripeä', 'Salaperäinen', 'Uljas', 'Vikkelä',
	'Tyyni', 'Rohkea', 'Kuulas', 'Havukka', 'Sumuinen', 'Kultainen', 'Hopeinen',
	'Ketterä', 'Valpas', 'Lempeä', 'Reipas', 'Hämärä', 'Kajastava'
];

const ELÄIMET = [
	'Ilves', 'Saukko', 'Kettu', 'Mäyrä', 'Näätä', 'Orava', 'Siili', 'Hirvi',
	'Kärppä', 'Majava', 'Metso', 'Kuukkeli', 'Tikka', 'Pöllö', 'Kurki',
	'Joutsen', 'Sisilisko', 'Rusakko', 'Peura', 'Telkkä'
];

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

/** e.g. "Haamu Utuinen Ilves". Caller retries with suffix on collision. */
export function generateGhostName(attempt = 0): string {
	const base = `Haamu ${pick(ADJEKTIIVIT)} ${pick(ELÄIMET)}`;
	return attempt === 0 ? base : `${base} ${Math.floor(Math.random() * 9000) + 1000}`;
}
