import { json } from '@sveltejs/kit';
import type { z } from 'zod';
import { fi } from '$lib/fi';

/** JSON error response in the shape the client expects: { code, message }. */
export function apiError(status: number, code: string): Response {
	return json({ code, message: fi.errorMessage(code) }, { status });
}

/** Parse and validate a JSON body; returns data or a ready-made 400 response. */
export async function parseBody<T extends z.ZodTypeAny>(
	request: Request,
	schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: Response }> {
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return { data: null, error: apiError(400, 'INVALID_INPUT') };
	}
	const parsed = schema.safeParse(raw);
	if (!parsed.success) return { data: null, error: apiError(400, 'INVALID_INPUT') };
	return { data: parsed.data, error: null };
}
