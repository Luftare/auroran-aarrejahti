// Procedural 3D treasure chest for the chest-opening view. Style: warm
// orange plank wood, hefty stone-gray bands, an octagonal
// lock plate — game-like and softly angular. The model is built in code
// so the game stays as pure static files with no model assets.

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
	/** Shake + squash — tap feedback. */
	tap: () => void;
	/** The lid opens with a springy motion. */
	open: () => void;
	dispose: () => void;
};

const WOOD_DARK = 0xa8591e;
const KEYHOLE = 0x1e2126;

/**
 * Hand-drawn-style cartoonish wood grain texture: wavy grain lines,
 * light highlight streaks and a few knots. Drawn onto a canvas at
 * runtime — no image files to load.
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

	// Grain lines: wide, wavy, of varying darkness
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

	// Highlight streaks: narrow, warm and light
	for (let i = 0; i < 10; i++) {
		const y = Math.random() * size;
		g.strokeStyle = `rgba(255, 189, 110, ${0.18 + Math.random() * 0.2})`;
		g.lineWidth = 2 + Math.random() * 3;
		g.beginPath();
		g.moveTo(-24, y);
		g.quadraticCurveTo(size / 2, y + (Math.random() - 0.5) * 30, size + 24, y + (Math.random() - 0.5) * 12);
		g.stroke();
	}

	// Knots: nested rings
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
 * Cartoonish worn metal: a mottled gray surface, light scratches
 * and dark pits. Drawn onto a canvas at runtime.
 */
function makeMetalTexture(): CanvasTexture {
	const size = 512;
	const cv = document.createElement('canvas');
	cv.width = cv.height = size;
	const g = cv.getContext('2d')!;

	g.fillStyle = '#7c8494';
	g.fillRect(0, 0, size, size);

	// Mottling: soft light and dark blotches
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

	// Scratches: thin diagonal streaks, mostly light
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

	// Pits and specks
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
	// The horizontal field of view is kept constant: on a narrow portrait
	// screen the vertical angle is widened so the chest doesn't spill past the edges
	const H_FOV_RAD = (32 * Math.PI) / 180;
	camera.position.copy(CAMERA_BASE);
	camera.lookAt(LOOK_AT);

	// Dramatic lighting: scant base light, a warm spotlight from above,
	// a cold violet rim light from behind — the chest rises out of darkness
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
	const woodTexArch = makeWoodTexture(true); // on the lid arch the grain runs along the axis
	woodTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
	woodTexArch.anisotropy = woodTex.anisotropy;

	const wood = new MeshStandardMaterial({ map: woodTex, roughness: 0.85, metalness: 0 });
	const woodArch = new MeshStandardMaterial({ map: woodTexArch, roughness: 0.85, metalness: 0 });
	// Dark wood parts: the same grain pattern dimmed with a tint
	const woodDark = new MeshStandardMaterial({ color: 0x9a8578, map: woodTex, roughness: 0.9, metalness: 0 });
	const metalTex = makeMetalTexture();
	metalTex.anisotropy = woodTex.anisotropy;
	const metal = new MeshStandardMaterial({ map: metalTex, roughness: 0.55, metalness: 0.25 });
	// Dark metal parts: the same worn surface dimmed with a tint
	const metalDark = new MeshStandardMaterial({ color: 0xa3a3a3, map: metalTex, roughness: 0.6, metalness: 0.25 });
	const dark = new MeshStandardMaterial({ color: KEYHOLE, roughness: 0.7, metalness: 0 });

	const chest = new Group();
	scene.add(chest);

	// --- Body: the planks show as thin grooves in the body surface ---
	const BODY_W = 2.0;
	const BODY_H = 1.0;
	const BODY_D = 1.35;
	const BODY_Y = 0.62; // center height of the body (on top of the feet)

	const body = new Mesh(new RoundedBoxGeometry(BODY_W, BODY_H, BODY_D, 3, 0.07), wood);
	body.position.y = BODY_Y;
	chest.add(body);

	const grooveMat = new MeshStandardMaterial({ color: WOOD_DARK, roughness: 0.9, metalness: 0 });
	for (const y of [-0.22, 0.05, 0.32]) {
		const groove = new Mesh(new RoundedBoxGeometry(BODY_W + 0.015, 0.035, BODY_D + 0.015, 1, 0.015), grooveMat);
		groove.position.set(0, BODY_Y + y, 0);
		chest.add(groove);
	}

	// --- Stone base and corner feet ---
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

	// --- Horizontal band and lock at the top edge of the body ---
	const LOCK_Y = BODY_Y + 0.36;
	const band = new Mesh(new RoundedBoxGeometry(BODY_W + 0.1, 0.24, BODY_D + 0.1, 2, 0.04), metal);
	band.position.y = LOCK_Y;
	chest.add(band);

	// Octagonal lock plate + keyhole
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

	// --- Lid: a wooden barrel arch, hinges at the back edge ---
	const LID_R = BODY_D / 2;
	const HINGE_Y = BODY_Y + BODY_H / 2;
	const lid = new Group();
	lid.position.set(0, HINGE_Y, -BODY_D / 2);
	chest.add(lid);

	// The cylinder axis is turned to run widthwise (X) and the arch points up —
	// the same orientation as the end hoops
	const arch = new Mesh(
		new CylinderGeometry(LID_R, LID_R, BODY_W, 24, 1, false, 0, Math.PI),
		woodArch
	);
	arch.rotation.z = Math.PI / 2;
	arch.position.set(0, 0, LID_R);
	lid.add(arch);

	// The lid's bottom plate closes the underside of the arch
	const lidBottom = new Mesh(new RoundedBoxGeometry(BODY_W, 0.08, BODY_D, 1, 0.03), woodDark);
	lidBottom.position.set(0, 0.02, LID_R);
	lid.add(lidBottom);

	// End caps of the arch
	for (const sx of [-1, 1]) {
		const cap = new Mesh(new CircleGeometry(LID_R - 0.01, 24, 0, Math.PI), woodDark);
		cap.rotation.y = (sx * Math.PI) / 2;
		cap.position.set(sx * (BODY_W / 2 - 0.001), 0, LID_R);
		lid.add(cap);
	}

	// Hefty arched hoops at the ends of the lid
	for (const x of [-(BODY_W / 2 - 0.11), BODY_W / 2 - 0.11]) {
		const hoop = new Mesh(new TorusGeometry(LID_R - 0.01, 0.105, 12, 24, Math.PI), metal);
		hoop.rotation.y = Math.PI / 2;
		hoop.position.set(x, 0, LID_R);
		lid.add(hoop);
	}

	// Hollow interior: black plates on the underside of the lid and in the
	// body opening — when the lid cracks open the gap looks deep and dark
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

	// --- Vertical straps on the front and back faces of the body, continuing the arches ---
	for (const x of [-(BODY_W / 2 - 0.14), BODY_W / 2 - 0.14]) {
		for (const z of [BODY_D / 2 + 0.03, -(BODY_D / 2 + 0.03)]) {
			const strap = new Mesh(new RoundedBoxGeometry(0.22, BODY_H + 0.06, 0.07, 1, 0.025), metal);
			strap.position.set(x, BODY_Y, z);
			chest.add(strap);
		}
	}

	// --- Rivets on the straps ---
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

	// --- Animation ---
	let raf = 0;
	let disposed = false;
	let shakeStart = -1;
	let hitSide = 1; // the tilt direction of the hit varies
	let spinStart = -1;
	let openStart = -1;
	const SHAKE_DUR = 0.33;
	const SPIN_DUR = 1; // a full turn around the vertical axis on every hit
	// Opening: the lid cracks open leisurely to ~20° — it has just opened when
	// the camera dives through the gap into the chest's dark interior; the UI
	// layer fades to black before we get there
	const DIVE_DUR = 1.0;
	const DIVE_END = new Vector3(0, BODY_Y + BODY_H / 2 + 0.08, -0.05);
	const DIVE_LOOK = new Vector3(0, BODY_Y + BODY_H / 2 - 0.2, -0.6);
	const LID_CRACK = -(20 * Math.PI) / 180; // ~20°
	const lookTarget = new Vector3();

	/* Damped spring: overshoots, bounces back a little in the other
	   direction and settles — as if riding on a spring. */
	function dampedSpring(t: number): number {
		if (t >= 1) return 1;
		return 1 - Math.exp(-6.5 * t) * Math.cos(9 * t);
	}

	function frame(nowMs: number): void {
		if (disposed) return;
		const now = nowMs / 1000;

		// Size: track the canvas's CSS size
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

		// Base pose + a light lively sway (during the dive the chest
		// stops so the keyhole stays fixed in the crosshairs)
		const diving = openStart >= 0;
		chest.rotation.set(0, diving ? 0 : Math.sin(now * 0.9) * 0.04, 0);
		chest.position.y = diving ? 0 : Math.sin(now * 1.7) * 0.02;
		chest.scale.set(1, 1, 1);

		// Hit spin: a full turn around the vertical axis with a spring bounce —
		// overshoot, rebound in the opposite direction, and settle
		if (spinStart >= 0) {
			const t = (now - spinStart) / SPIN_DUR;
			if (t < 1) {
				chest.rotation.y += Math.PI * 2 * dampedSpring(t);
			} else {
				spinStart = -1;
			}
		}

		// Camera: base pose; during the opening, an accelerating dive into the keyhole
		camera.position.copy(CAMERA_BASE);
		lookTarget.copy(LOOK_AT);
		if (diving) {
			const zt = Math.min((now - openStart) / DIVE_DUR, 1);
			// Full speed right from the start, yet accelerating toward the end
			const e = 0.5 * zt + 0.5 * zt * zt;
			camera.position.lerpVectors(CAMERA_BASE, DIVE_END, e);
			lookTarget.lerpVectors(LOOK_AT, DIVE_LOOK, Math.min(zt * 1.6, 1));
			// The lid cracks open leisurely: slow at first, only opening near the end
			lid.rotation.x = LID_CRACK * zt * zt;
		}

		// Hammer-blow-like hit: a sharp dip that recovers
		// exponentially — no soft swaying
		if (shakeStart >= 0) {
			const t = now - shakeStart;
			if (t < SHAKE_DUR) {
				const amp = Math.exp(-t * 17);
				const rattle = t < 0.12 ? Math.sin(t * 63) : 0; // a short hard rattle
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
