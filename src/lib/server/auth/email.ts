import { env } from '$env/dynamic/private';

type Mail = { to: string; subject: string; text: string };

async function send(mail: Mail): Promise<void> {
	if (!env.SMTP_HOST) {
		// Dev fallback: no SMTP configured — print the mail so links are usable from the terminal.
		console.log(`[email] (SMTP ei käytössä) → ${mail.to}\n${mail.subject}\n${mail.text}`);
		return;
	}
	const nodemailer = await import('nodemailer');
	const transport = nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: Number(env.SMTP_PORT || 587),
		secure: env.SMTP_PORT === '465',
		auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
	});
	await transport.sendMail({ from: env.SMTP_FROM || 'Auroran aarre <aurora@localhost>', ...mail });
}

function baseUrl(): string {
	return env.PUBLIC_BASE_URL || 'http://localhost:5173';
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
	await send({
		to,
		subject: 'Vahvista sähköpostiosoitteesi — Auroran aarre',
		text: [
			'Tervetuloa aarteenetsijäksi!',
			'',
			'Vahvista sähköpostiosoitteesi napsauttamalla alla olevaa linkkiä. Linkki on voimassa vuorokauden.',
			'',
			`${baseUrl()}/vahvista?avain=${token}`,
			'',
			'Jos et luonut tunnusta Auroran aarteeseen, voit jättää tämän viestin huomiotta.'
		].join('\n')
	});
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
	await send({
		to,
		subject: 'Salasanan vaihtaminen — Auroran aarre',
		text: [
			'Saimme pyynnön vaihtaa salasanasi.',
			'',
			'Vaihda salasana napsauttamalla alla olevaa linkkiä. Linkki on voimassa tunnin.',
			'',
			`${baseUrl()}/salasana?avain=${token}`,
			'',
			'Jos et pyytänyt salasanan vaihtoa, voit jättää tämän viestin huomiotta.'
		].join('\n')
	});
}
