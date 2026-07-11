// All game data is stored in IndexedDB on this device —
// clearing browser data resets the game.

const DB_NAME = 'auroran-aarrejahti';
const STORE = 'avaimet';

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function idbGet(key: string): Promise<string | null> {
	try {
		const db = await openDb();
		return await new Promise((resolve, reject) => {
			const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
			req.onsuccess = () => resolve((req.result as string) ?? null);
			req.onerror = () => reject(req.error);
		});
	} catch {
		return null;
	}
}

export async function idbSet(key: string, value: string): Promise<void> {
	try {
		const db = await openDb();
		await new Promise<void>((resolve, reject) => {
			const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key);
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});
	} catch {
		// storage unavailable (private mode) — the session cookie still carries the day
	}
}

export async function idbDelete(key: string): Promise<void> {
	try {
		const db = await openDb();
		await new Promise<void>((resolve, reject) => {
			const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key);
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});
	} catch {
		// ignore
	}
}
