export class ApiError extends Error {
	code: string;
	status: number;
	constructor(status: number, code: string, message: string) {
		super(message);
		this.code = code;
		this.status = status;
	}
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
	const res = await fetch(path, {
		method,
		headers: body === undefined ? undefined : { 'content-type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	if (!res.ok) {
		let code = 'SERVER_ERROR';
		let message = 'Jokin meni pieleen. Yritä hetken kuluttua uudelleen.';
		try {
			const data = await res.json();
			code = data.code ?? code;
			message = data.message ?? message;
		} catch {
			// non-JSON error body — keep defaults
		}
		throw new ApiError(res.status, code, message);
	}
	return res.json();
}

export const api = {
	get: <T>(path: string) => call<T>('GET', path),
	post: <T>(path: string, body?: unknown) => call<T>('POST', path, body),
	patch: <T>(path: string, body?: unknown) => call<T>('PATCH', path, body),
	del: <T>(path: string) => call<T>('DELETE', path)
};
