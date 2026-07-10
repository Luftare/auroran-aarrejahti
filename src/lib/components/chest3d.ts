// Proseduraalinen 3D-aarrearkku arkunavausnäkymään. Tyyli: lämmin
// oranssi lankkupuu, järeät kivenharmaat vanteet, kahdeksankulmainen
// lukkolevy — pelillinen ja pehmeän kulmikas. Malli rakennetaan koodissa,
// jotta peli pysyy pelkkinä staattisina tiedostoina ilman mallitiedostoja.

import {
	ACESFilmicToneMapping,
	AmbientLight,
	CanvasTexture,
	CircleGeometry,
	CylinderGeometry,
	DirectionalLight,
	Group,
	HemisphereLight,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	PerspectiveCamera,
	RepeatWrapping,
	Scene,
	SphereGeometry,
	SpotLight,
	SRGBColorSpace,
	TorusGeometry,
	Vector3,
	WebGLRenderer
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type ChestRig = {
	/** Ravistus + puristus — napautuksen palaute. */
	tap: () => void;
	/** Kansi aukeaa jousimaisella liikkeellä. */
	open: () => void;
	dispose: () => void;
};

const WOOD_DARK = 0xa8591e;
const KEYHOLE = 0x1e2126;

/**
 * Piirtoperäinen sarjakuvamainen puusyytekstuuri: aaltoilevia syyviivoja,
 * vaaleita valojuovia ja muutama oksankohta. Piirretään canvasille ajon
 * aikana — ei ladattavia kuvatiedostoja.
 */
function makeWoodTexture(vertical = false): CanvasTexture {
	const size = 512;
	const cv = document.createElement('canvas');
	cv.width = cv.height = size;
	const g = cv.getContext('2d')!;

	if (vertical) {
		g.translate(size, 0);
		g.rotate(Math.PI / 2);
	}

	g.fillStyle = '#d97c2e';
	g.fillRect(0, 0, size, size);

	// Syyviivat: leveitä, aaltoilevia, vaihtelevan tummia
	for (let i = 0; i < 26; i++) {
		const y = (i + Math.random() * 0.8) * (size / 26);
		g.strokeStyle = `rgba(140, 68, 18, ${0.16 + Math.random() * 0.24})`;
		g.lineWidth = 3 + Math.random() * 7;
		g.beginPath();
		g.moveTo(-24, y);
		let x = -24;
		while (x < size + 24) {
			const step = 90 + Math.random() * 90;
			const wobble = (Math.random() - 0.5) * 26;
			g.quadraticCurveTo(x + step / 2, y + wobble, x + step, y + (Math.random() - 0.5) * 8);
			x += step;
		}
		g.stroke();
	}

	// Valojuovat: kapeita, lämpimän vaaleita
	for (let i = 0; i < 10; i++) {
		const y = Math.random() * size;
		g.strokeStyle = `rgba(255, 189, 110, ${0.18 + Math.random() * 0.2})`;
		g.lineWidth = 2 + Math.random() * 3;
		g.beginPath();
		g.moveTo(-24, y);
		g.quadraticCurveTo(size / 2, y + (Math.random() - 0.5) * 30, size + 24, y + (Math.random() - 0.5) * 12);
		g.stroke();
	}

	// Oksankohdat: sisäkkäisiä renkaita
	for (let i = 0; i < 5; i++) {
		const x = Math.random() * size;
		const y = Math.random() * size;
		g.strokeStyle = 'rgba(122, 56, 14, 0.4)';
		for (let r = 13; r > 3; r -= 4) {
			g.lineWidth = 2.5;
			g.beginPath();
			g.ellipse(x, y, r * 1.7, r, 0, 0, Math.PI * 2);
			g.stroke();
		}
		g.fillStyle = 'rgba(110, 48, 10, 0.55)';
		g.beginPath();
		g.ellipse(x, y, 4.5, 2.6, 0, 0, Math.PI * 2);
		g.fill();
	}

	const tex = new CanvasTexture(cv);
	tex.colorSpace = SRGBColorSpace;
	tex.wrapS = RepeatWrapping;
	tex.wrapT = RepeatWrapping;
	return tex;
}

/**
 * Sarjakuvamainen kulunut metalli: läikikäs harmaa pinta, vaaleita
 * naarmuja ja tummia koloja. Piirretään canvasille ajon aikana.
 */
function makeMetalTexture(): CanvasTexture {
	const size = 512;
	const cv = document.createElement('canvas');
	cv.width = cv.height = size;
	const g = cv.getContext('2d')!;

	g.fillStyle = '#7c8494';
	g.fillRect(0, 0, size, size);

	// Läikikkyys: pehmeitä vaaleita ja tummia laikkuja
	for (let i = 0; i < 46; i++) {
		const x = Math.random() * size;
		const y = Math.random() * size;
		const r = 18 + Math.random() * 55;
		const light = Math.random() < 0.5;
		const grad = g.createRadialGradient(x, y, 0, x, y, r);
		grad.addColorStop(0, light ? 'rgba(163, 171, 186, 0.28)' : 'rgba(84, 91, 105, 0.26)');
		grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
		g.fillStyle = grad;
		g.fillRect(x - r, y - r, r * 2, r * 2);
	}

	// Naarmut: ohuita vinoja viiruja, enimmäkseen vaaleita
	for (let i = 0; i < 16; i++) {
		const x = Math.random() * size;
		const y = Math.random() * size;
		const len = 26 + Math.random() * 80;
		const angle = Math.random() * Math.PI;
		const light = Math.random() < 0.7;
		g.strokeStyle = light
			? `rgba(190, 198, 212, ${0.2 + Math.random() * 0.2})`
			: `rgba(70, 76, 90, ${0.25 + Math.random() * 0.2})`;
		g.lineWidth = 1.5 + Math.random() * 1.8;
		g.beginPath();
		g.moveTo(x, y);
		g.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
		g.stroke();
	}

	// Kolot ja pisteet
	for (let i = 0; i < 70; i++) {
		const x = Math.random() * size;
		const y = Math.random() * size;
		g.fillStyle = `rgba(60, 66, 78, ${0.12 + Math.random() * 0.16})`;
		g.beginPath();
		g.arc(x, y, 1 + Math.random() * 2.6, 0, Math.PI * 2);
		g.fill();
	}

	const tex = new CanvasTexture(cv);
	tex.colorSpace = SRGBColorSpace;
	tex.wrapS = RepeatWrapping;
	tex.wrapT = RepeatWrapping;
	return tex;
}

export function createChest(canvas: HTMLCanvasElement): ChestRig {
	const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
	renderer.setClearColor(0x000000, 0);
	renderer.toneMapping = ACESFilmicToneMapping;

	const scene = new Scene();
	const camera = new PerspectiveCamera(35, 1, 0.1, 50);
	const CAMERA_BASE = new Vector3(3.1, 2.6, 4.7);
	const LOOK_AT = new Vector3(0, 0.8, 0);
	// Vaakasuuntainen kuvakulma pidetään vakiona: kapealla pystyruudulla
	// pystykulmaa avataan, jottei arkku pursua yli reunojen
	const H_FOV_RAD = (32 * Math.PI) / 180;
	camera.position.copy(CAMERA_BASE);
	camera.lookAt(LOOK_AT);

	// Dramaattinen valaistus: niukka pohjavalo, lämmin kohdevalo ylhäältä,
	// kylmä violetti vastavalo takaa — arkku nousee pimeydestä
	scene.add(new HemisphereLight(0xbfd4e0, 0x10141c, 0.3));
	scene.add(new AmbientLight(0xffffff, 0.04));
	const spot = new SpotLight(0xffe9c4, 45, 0, Math.PI / 5.5, 0.6, 1.6);
	spot.position.set(1.2, 5.2, 2.6);
	spot.target.position.set(0, 0.8, 0);
	scene.add(spot, spot.target);
	const key = new DirectionalLight(0xffdcae, 0.45);
	key.position.set(-2.5, 3.5, 3.5);
	scene.add(key);
	const rim = new DirectionalLight(0x9b7bff, 1.5);
	rim.position.set(2.5, 2, -3.5);
	scene.add(rim);

	const woodTex = makeWoodTexture();
	const woodTexArch = makeWoodTexture(true); // kannen holvissa syyt kulkevat akselin suuntaan
	woodTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
	woodTexArch.anisotropy = woodTex.anisotropy;

	const wood = new MeshStandardMaterial({ map: woodTex, roughness: 0.85, metalness: 0 });
	const woodArch = new MeshStandardMaterial({ map: woodTexArch, roughness: 0.85, metalness: 0 });
	// Tummat puuosat: sama syykuvio himmennettynä sävytyksellä
	const woodDark = new MeshStandardMaterial({ color: 0x9a8578, map: woodTex, roughness: 0.9, metalness: 0 });
	const metalTex = makeMetalTexture();
	metalTex.anisotropy = woodTex.anisotropy;
	const metal = new MeshStandardMaterial({ map: metalTex, roughness: 0.55, metalness: 0.25 });
	// Tummat metalliosat: sama kulunut pinta himmennettynä sävytyksellä
	const metalDark = new MeshStandardMaterial({ color: 0xa3a3a3, map: metalTex, roughness: 0.6, metalness: 0.25 });
	const dark = new MeshStandardMaterial({ color: KEYHOLE, roughness: 0.7, metalness: 0 });

	const chest = new Group();
	scene.add(chest);

	// --- Runko: lankut näkyvät ohuina urina rungon pinnassa ---
	const BODY_W = 2.0;
	const BODY_H = 1.0;
	const BODY_D = 1.35;
	const BODY_Y = 0.62; // rungon keskikorkeus (jalkojen päällä)

	const body = new Mesh(new RoundedBoxGeometry(BODY_W, BODY_H, BODY_D, 3, 0.07), wood);
	body.position.y = BODY_Y;
	chest.add(body);

	const grooveMat = new MeshStandardMaterial({ color: WOOD_DARK, roughness: 0.9, metalness: 0 });
	for (const y of [-0.22, 0.05, 0.32]) {
		const groove = new Mesh(new RoundedBoxGeometry(BODY_W + 0.015, 0.035, BODY_D + 0.015, 1, 0.015), grooveMat);
		groove.position.set(0, BODY_Y + y, 0);
		chest.add(groove);
	}

	// --- Kivijalusta ja kulmatassut ---
	const base = new Mesh(new RoundedBoxGeometry(BODY_W + 0.14, 0.16, BODY_D + 0.14, 2, 0.05), metalDark);
	base.position.y = 0.1;
	chest.add(base);

	for (const sx of [-1, 1]) {
		for (const sz of [-1, 1]) {
			const foot = new Mesh(new RoundedBoxGeometry(0.34, 0.34, 0.34, 2, 0.06), metal);
			foot.position.set(sx * (BODY_W / 2 - 0.06), 0.2, sz * (BODY_D / 2 - 0.04));
			chest.add(foot);
		}
	}

	// --- Vaakavanne ja lukko rungon yläreunassa ---
	const LOCK_Y = BODY_Y + 0.36;
	const band = new Mesh(new RoundedBoxGeometry(BODY_W + 0.1, 0.24, BODY_D + 0.1, 2, 0.04), metal);
	band.position.y = LOCK_Y;
	chest.add(band);

	// Kahdeksankulmainen lukkolevy + avaimenreikä
	const plate = new Mesh(new CylinderGeometry(0.3, 0.3, 0.09, 8), metal);
	plate.rotation.x = Math.PI / 2;
	plate.rotation.y = Math.PI / 8;
	plate.position.set(0, LOCK_Y, BODY_D / 2 + 0.09);
	chest.add(plate);

	const plateInner = new Mesh(new CylinderGeometry(0.22, 0.22, 0.1, 8), metalDark);
	plateInner.rotation.copy(plate.rotation);
	plateInner.position.set(0, LOCK_Y, BODY_D / 2 + 0.1);
	chest.add(plateInner);

	const keyholeTop = new Mesh(new CylinderGeometry(0.055, 0.055, 0.08, 16), dark);
	keyholeTop.rotation.x = Math.PI / 2;
	keyholeTop.position.set(0, LOCK_Y + 0.04, BODY_D / 2 + 0.13);
	chest.add(keyholeTop);

	const keyholeSlot = new Mesh(new RoundedBoxGeometry(0.07, 0.12, 0.08, 1, 0.02), dark);
	keyholeSlot.position.set(0, LOCK_Y - 0.04, BODY_D / 2 + 0.13);
	chest.add(keyholeSlot);

	// --- Kansi: puinen holvikaari, saranat takareunassa ---
	const LID_R = BODY_D / 2;
	const HINGE_Y = BODY_Y + BODY_H / 2;
	const lid = new Group();
	lid.position.set(0, HINGE_Y, -BODY_D / 2);
	chest.add(lid);

	// Sylinterin akseli kääntyy leveyssuuntaan (X) ja kaari osoittaa ylös —
	// sama suunta kuin päätyvanteilla
	const arch = new Mesh(
		new CylinderGeometry(LID_R, LID_R, BODY_W, 24, 1, false, 0, Math.PI),
		woodArch
	);
	arch.rotation.z = Math.PI / 2;
	arch.position.set(0, 0, LID_R);
	lid.add(arch);

	// Kannen pohjalevy sulkee holvin alapinnan
	const lidBottom = new Mesh(new RoundedBoxGeometry(BODY_W, 0.08, BODY_D, 1, 0.03), woodDark);
	lidBottom.position.set(0, 0.02, LID_R);
	lid.add(lidBottom);

	// Holvin päätykannet
	for (const sx of [-1, 1]) {
		const cap = new Mesh(new CircleGeometry(LID_R - 0.01, 24, 0, Math.PI), woodDark);
		cap.rotation.y = (sx * Math.PI) / 2;
		cap.position.set(sx * (BODY_W / 2 - 0.001), 0, LID_R);
		lid.add(cap);
	}

	// Järeät kaarivanteet kannen päissä
	for (const x of [-(BODY_W / 2 - 0.11), BODY_W / 2 - 0.11]) {
		const hoop = new Mesh(new TorusGeometry(LID_R - 0.01, 0.105, 12, 24, Math.PI), metal);
		hoop.rotation.y = Math.PI / 2;
		hoop.position.set(x, 0, LID_R);
		lid.add(hoop);
	}

	// Ontto sisus: mustat levyt kannen alapinnassa ja rungon suuaukossa —
	// kannen raottuessa rako näyttää syvältä ja pimeältä
	const hollow = new MeshBasicMaterial({ color: 0x000000 });
	const bodyOpening = new Mesh(
		new RoundedBoxGeometry(BODY_W - 0.18, 0.05, BODY_D - 0.18, 1, 0.02),
		hollow
	);
	bodyOpening.position.y = BODY_Y + BODY_H / 2 + 0.015;
	chest.add(bodyOpening);

	const lidHollow = new Mesh(
		new RoundedBoxGeometry(BODY_W - 0.2, 0.05, BODY_D - 0.2, 1, 0.02),
		hollow
	);
	lidHollow.position.set(0, -0.035, LID_R);
	lid.add(lidHollow);

	// --- Pystyvanteet rungon etu- ja takapinnalla kaarien jatkeena ---
	for (const x of [-(BODY_W / 2 - 0.14), BODY_W / 2 - 0.14]) {
		for (const z of [BODY_D / 2 + 0.03, -(BODY_D / 2 + 0.03)]) {
			const strap = new Mesh(new RoundedBoxGeometry(0.22, BODY_H + 0.06, 0.07, 1, 0.025), metal);
			strap.position.set(x, BODY_Y, z);
			chest.add(strap);
		}
	}

	// --- Niitit vanteissa ---
	const rivetGeo = new SphereGeometry(0.045, 12, 12);
	for (const x of [-(BODY_W / 2 - 0.14), BODY_W / 2 - 0.14]) {
		for (const y of [BODY_Y - 0.25, BODY_Y + 0.15]) {
			const rivet = new Mesh(rivetGeo, metalDark);
			rivet.position.set(x, y, BODY_D / 2 + 0.08);
			chest.add(rivet);
		}
	}
	for (const x of [-0.55, 0.55]) {
		const rivet = new Mesh(rivetGeo, metalDark);
		rivet.position.set(x, LOCK_Y, BODY_D / 2 + 0.07);
		chest.add(rivet);
	}

	// --- Animaatio ---
	let raf = 0;
	let disposed = false;
	let shakeStart = -1;
	let hitSide = 1; // iskun kallistussuunta vaihtelee
	let spinStart = -1;
	let openStart = -1;
	const SHAKE_DUR = 0.33;
	const SPIN_DUR = 1; // täysi kierros pystyakselin ympäri joka osumalla
	// Avaus: kansi raottuu verkkaisesti ~20°:een — se on juuri auennut, kun
	// kamera syöksyy raosta arkun pimeään sisään; käyttöliittymäkerros
	// häivyttää mustaan ennen perille pääsyä
	const DIVE_DUR = 1.0;
	const DIVE_END = new Vector3(0, BODY_Y + BODY_H / 2 + 0.08, -0.05);
	const DIVE_LOOK = new Vector3(0, BODY_Y + BODY_H / 2 - 0.2, -0.6);
	const LID_CRACK = -(20 * Math.PI) / 180; // ~20°
	const lookTarget = new Vector3();

	/* Vaimennettu jousi: menee yli, kimpoaa hieman takaisin toiseen
	   suuntaan ja asettuu — kuin jousen varassa. */
	function dampedSpring(t: number): number {
		if (t >= 1) return 1;
		return 1 - Math.exp(-6.5 * t) * Math.cos(9 * t);
	}

	function frame(nowMs: number): void {
		if (disposed) return;
		const now = nowMs / 1000;

		// Koko: seurataan canvasin CSS-kokoa
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		if (w > 0 && h > 0) {
			const pr = Math.min(window.devicePixelRatio || 1, 2);
			if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
				renderer.setPixelRatio(pr);
				renderer.setSize(w, h, false);
				camera.aspect = w / h;
				camera.fov = (2 * Math.atan(Math.tan(H_FOV_RAD / 2) / camera.aspect) * 180) / Math.PI;
				camera.updateProjectionMatrix();
			}
		}

		// Perusasento + kevyt eläväinen huojunta (sukelluksessa arkku
		// pysähtyy, jotta avaimenreikä pysyy paikallaan tähtäimessä)
		const diving = openStart >= 0;
		chest.rotation.set(0, diving ? 0 : Math.sin(now * 0.9) * 0.04, 0);
		chest.position.y = diving ? 0 : Math.sin(now * 1.7) * 0.02;
		chest.scale.set(1, 1, 1);

		// Osuman pyörähdys: täysi kierros pystyakselin ympäri jousibouncella —
		// yli, kimmahdus vastasuuntaan ja asettuminen
		if (spinStart >= 0) {
			const t = (now - spinStart) / SPIN_DUR;
			if (t < 1) {
				chest.rotation.y += Math.PI * 2 * dampedSpring(t);
			} else {
				spinStart = -1;
			}
		}

		// Kamera: perusasento; avauksessa kiihtyvä sukellus avaimenreikään
		camera.position.copy(CAMERA_BASE);
		lookTarget.copy(LOOK_AT);
		if (diving) {
			const zt = Math.min((now - openStart) / DIVE_DUR, 1);
			// Täysi vauhti heti alusta, kiihtyy silti loppua kohden
			const e = 0.5 * zt + 0.5 * zt * zt;
			camera.position.lerpVectors(CAMERA_BASE, DIVE_END, e);
			lookTarget.lerpVectors(LOOK_AT, DIVE_LOOK, Math.min(zt * 1.6, 1));
			// Kansi raottuu verkkaisesti: alku hidas, avautuu vasta lopussa
			lid.rotation.x = LID_CRACK * zt * zt;
		}

		// Vasaraniskumainen osuma: terävä painauma, joka palautuu
		// eksponentiaalisesti — ei pehmeää huojuntaa
		if (shakeStart >= 0) {
			const t = now - shakeStart;
			if (t < SHAKE_DUR) {
				const amp = Math.exp(-t * 17);
				const rattle = t < 0.12 ? Math.sin(t * 63) : 0; // lyhyt kova räminä
				camera.position.y -= 0.09 * amp;
				camera.position.x += rattle * 0.04 * amp;
				chest.position.y -= 0.05 * amp;
				chest.rotation.z = hitSide * 0.045 * amp;
				chest.scale.set(1 + 0.06 * amp, 1 - 0.11 * amp, 1 + 0.06 * amp);
			} else {
				shakeStart = -1;
			}
		}
		camera.lookAt(lookTarget);

		renderer.render(scene, camera);
		raf = requestAnimationFrame(frame);
	}
	raf = requestAnimationFrame(frame);

	return {
		tap() {
			shakeStart = performance.now() / 1000;
			spinStart = shakeStart;
			hitSide = Math.random() < 0.5 ? -1 : 1;
		},
		open() {
			shakeStart = -1;
			spinStart = -1;
			openStart = performance.now() / 1000;
		},
		dispose() {
			disposed = true;
			cancelAnimationFrame(raf);
			woodTex.dispose();
			woodTexArch.dispose();
			metalTex.dispose();
			scene.traverse((obj) => {
				if (obj instanceof Mesh) {
					obj.geometry.dispose();
					(Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
				}
			});
			renderer.dispose();
		}
	};
}
