// Renders static/kuvake.svg into the PNG sizes the PWA manifest needs.
// Run once after changing the icon: node scripts/make-icons.js
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const svg = readFileSync('static/kuvake.svg', 'utf8');
for (const size of [192, 512]) {
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
	writeFileSync(`static/kuvake-${size}.png`, png);
	console.log(`static/kuvake-${size}.png (${png.length} B)`);
}
