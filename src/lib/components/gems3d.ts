// Procedural 3D gems. Six rarity tiers from most common to
// rarest: gray (a rock with glinting white crystals),
// green (shard), blue (magical orb), violet (crystal cluster),
// orange (shard) and red (shard). Each radiates mystically:
// an emissive surface, a colored light and a pulsing glow halo.
// The models are built in code — no files to load.

import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	CanvasTexture,
	ConeGeometry,
	CylinderGeometry,
	DoubleSide,
	Group,
	HemisphereLight,
	IcosahedronGeometry,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	PerspectiveCamera,
	PointLight,
	Scene,
	Sprite,
	SpriteMaterial,
	SRGBColorSpace,
	Vector3,
	WebGLRenderer
} from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';

export type GemKind = 'harmaa' | 'vihrea' | 'sininen' | 'violetti' | 'oranssi' | 'punainen';

/** From most common to rarest. */
export const GEM_ORDER: GemKind[] = ['harmaa', 'vihrea', 'sininen', 'violetti', 'oranssi', 'punainen'];

const GEM_STYLE: Record<GemKind, { base: number; emissive: number; glow: number }> = {
	harmaa: { base: 0xccd2da, emissive: 0x4c545e, glow: 0xdfe8ee },
	vihrea: { base: 0x2ee66b, emissive: 0x0d8a36, glow: 0x5cf294 },
	sininen: { base: 0x3aa8ff, emissive: 0x1256c8, glow: 0x7cc4ff },
	violetti: { base: 0xa66bff, emissive: 0x5c1fc4, glow: 0xc59cff },
	oranssi: { base: 0xff9d2e, emissive: 0xc45a0a, glow: 0xffc06a },
	punainen: { base: 0xff4545, emissive: 0xc41212, glow: 0xff8a7a }
};

/** Soft round glow blob for the sprite halo. */
function makeGlowTexture(): CanvasTexture {
	const size = 128;
	const cv = document.createElement('canvas');
	cv.width = cv.height = size;
	const g = cv.getContext('2d')!;
	const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
	grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.32)');
	grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, size, size);
	const tex = new CanvasTexture(cv);
	tex.colorSpace = SRGBColorSpace;
	return tex;
}

/** Sharp dot: a hard edge, no glow halo. */
function makeDotTexture(): CanvasTexture {
	const size = 64;
	const cv = document.createElement('canvas');
	cv.width = cv.height = size;
	const g = cv.getContext('2d')!;
	g.fillStyle = '#fff';
	g.beginPath();
	g.arc(size / 2, size / 2, size * 0.34, 0, Math.PI * 2);
	g.fill();
	const tex = new CanvasTexture(cv);
	tex.colorSpace = SRGBColorSpace;
	return tex;
}

/** Sharp four-pointed star: hard edges, no glow. */
function makeStarTexture(): CanvasTexture {
	const size = 64;
	const cv = document.createElement('canvas');
	cv.width = cv.height = size;
	const g = cv.getContext('2d')!;
	const c = size / 2;
	const outer = size * 0.48;
	const inner = size * 0.13;
	g.fillStyle = '#fff';
	g.beginPath();
	for (let i = 0; i < 8; i++) {
		const angle = (i * Math.PI) / 4 - Math.PI / 2;
		const r = i % 2 === 0 ? outer : inner;
		const x = c + Math.cos(angle) * r;
		const y = c + Math.sin(angle) * r;
		if (i === 0) g.moveTo(x, y);
		else g.lineTo(x, y);
	}
	g.closePath();
	g.fill();
	const tex = new CanvasTexture(cv);
	tex.colorSpace = SRGBColorSpace;
	return tex;
}

/** Sharp sliver: a narrow elongated diamond — a shard-like spark. */
function makeSliverTexture(): CanvasTexture {
	const size = 64;
	const cv = document.createElement('canvas');
	cv.width = cv.height = size;
	const g = cv.getContext('2d')!;
	g.fillStyle = '#fff';
	g.beginPath();
	g.moveTo(size / 2, 2);
	g.lineTo(size / 2 + 7, size / 2);
	g.lineTo(size / 2, size - 2);
	g.lineTo(size / 2 - 7, size / 2);
	g.closePath();
	g.fill();
	const tex = new CanvasTexture(cv);
	tex.colorSpace = SRGBColorSpace;
	return tex;
}

export type GemTextures = {
	glow: CanvasTexture;
	dot: CanvasTexture;
	star: CanvasTexture;
	sliver: CanvasTexture;
};

export function makeGemTextures(): GemTextures {
	return {
		glow: makeGlowTexture(),
		dot: makeDotTexture(),
		star: makeStarTexture(),
		sliver: makeSliverTexture()
	};
}

function gemMaterial(kind: GemKind, emissiveIntensity = 0.55): MeshStandardMaterial {
	const style = GEM_STYLE[kind];
	return new MeshStandardMaterial({
		color: style.base,
		emissive: style.emissive,
		emissiveIntensity,
		roughness: 0.25,
		metalness: 0.1,
		flatShading: true
	});
}

/**
 * An asymmetric, many-faceted crystal: a stretched, jagged point cloud
 * turned into a convex hull. No two alike.
 */
function shardGeometry(height: number, radius: number): ConvexGeometry {
	const points: Vector3[] = [];
	// A sharp tip and a blunter base, both clearly off-axis —
	// the slanted posture breaks the diamond symmetry
	points.push(new Vector3(radius * (Math.random() * 0.9 - 0.2), height * 0.62, (Math.random() - 0.5) * radius * 0.6));
	points.push(new Vector3(-radius * (Math.random() * 0.7), -height * 0.42, (Math.random() - 0.5) * radius * 0.5));
	// Side tip: a second, smaller spike at an angle
	points.push(new Vector3(radius * 1.15, height * (0.05 + Math.random() * 0.2), radius * 0.3));
	// Two irregular facet rings at different heights
	for (const [ringY, ringR, n] of [
		[height * 0.2, radius, 5],
		[-height * 0.14, radius * 0.8, 5]
	] as const) {
		for (let i = 0; i < n; i++) {
			const angle = (i / n) * Math.PI * 2 + Math.random() * 0.9;
			const r = ringR * (0.5 + Math.random() * 0.75);
			points.push(
				new Vector3(
					Math.cos(angle) * r,
					ringY + (Math.random() - 0.5) * height * 0.22,
					Math.sin(angle) * r
				)
			);
		}
	}
	return new ConvexGeometry(points);
}

export type GemHandle = {
	group: Group;
	/** Mystical liveliness: rotation, floating and glow pulsing.
	 *  The camera is needed to orient the tail ribbon toward the viewer. */
	update: (t: number, camera: PerspectiveCamera) => void;
};

/** Basis of a randomly tilted orbit: u and v span the orbital plane. */
function orbitBasis(): { u: Vector3; v: Vector3 } {
	const axis = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
	if (axis.lengthSq() < 0.01) axis.set(0, 1, 0);
	axis.normalize();
	const u = new Vector3(1, 0, 0).cross(axis);
	if (u.lengthSq() < 0.01) u.set(0, 0, 1).cross(axis);
	u.normalize();
	const v = axis.clone().cross(u).normalize();
	return { u, v };
}

export function buildGem(kind: GemKind, tex: GemTextures): GemHandle {
	const style = GEM_STYLE[kind];
	const group = new Group();
	const phase = Math.random() * Math.PI * 2;

	// Glow halo and colored light — the shared mystical radiance
	const glowMat = new SpriteMaterial({
		map: tex.glow,
		color: style.glow,
		blending: AdditiveBlending,
		depthWrite: false,
		transparent: true
	});
	const glow = new Sprite(glowMat);
	glow.scale.setScalar(2.2);
	glow.userData.rooli = 'hehku'; // the intro animation tells the glow apart from the sparks
	group.add(glow);
	// Light above and in front of the gem — centered, it would be left in the dark inside the body
	const light = new PointLight(style.glow, 4, 4, 1.8);
	light.position.set(0.3, 0.55, 0.9);
	group.add(light);

	const spinner = new Group();
	group.add(spinner);

	let crystalMats: MeshStandardMaterial[] = [];

	if (kind === 'sininen') {
		// Magical orb: a translucent shell and a bright core
		const shellMat = gemMaterial(kind, 0.35);
		shellMat.flatShading = false;
		shellMat.transparent = true;
		shellMat.opacity = 0.62;
		shellMat.roughness = 0.1;
		const shell = new Mesh(new IcosahedronGeometry(0.42, 3), shellMat);
		spinner.add(shell);
		const coreMat = new MeshStandardMaterial({
			color: 0xdff1ff,
			emissive: 0x9fd4ff,
			emissiveIntensity: 1.6,
			roughness: 0.3
		});
		crystalMats.push(coreMat);
		const core = new Mesh(new IcosahedronGeometry(0.2, 2), coreMat);
		spinner.add(core);
	} else if (kind === 'violetti') {
		// Crystal cluster: hexagonal columns at different angles
		const columns: [number, number, number, number][] = [
			// [x, z, height, tilt]
			[0, 0, 0.62, 0],
			[-0.16, 0.1, 0.4, 0.5],
			[0.17, -0.06, 0.34, -0.55],
			[0.05, 0.16, 0.3, 0.35]
		];
		for (const [x, z, h, tilt] of columns) {
			const mat = gemMaterial(kind);
			crystalMats.push(mat);
			const column = new Group();
			const shaft = new Mesh(new CylinderGeometry(0.09, 0.12, h, 6), mat);
			shaft.position.y = h / 2;
			const tip = new Mesh(new ConeGeometry(0.09, 0.16, 6), mat);
			tip.position.y = h + 0.08;
			column.add(shaft, tip);
			column.position.set(x, -0.3, z);
			column.rotation.z = tilt;
			spinner.add(column);
		}
	} else {
		// Shards: an asymmetric many-faceted crystal, each color with its own posture
		const mat = gemMaterial(kind);
		crystalMats.push(mat);
		if (kind === 'harmaa') {
			// Light gray crystal — kin to the green one but stockier and posed differently
			const shard = new Mesh(shardGeometry(1.0, 0.36), mat);
			shard.rotation.z = -0.2;
			spinner.add(shard);
		} else if (kind === 'vihrea') {
			const shard = new Mesh(shardGeometry(1.15, 0.3), mat);
			shard.rotation.z = 0.15;
			spinner.add(shard);
		} else if (kind === 'oranssi') {
			const shard = new Mesh(shardGeometry(0.9, 0.42), mat);
			shard.rotation.z = -0.22;
			spinner.add(shard);
		} else {
			// punainen (red): the longest and narrowest — the rarest shard
			const shard = new Mesh(shardGeometry(1.4, 0.26), mat);
			shard.rotation.z = 0.1;
			const splinter = new Mesh(shardGeometry(0.65, 0.15), mat);
			splinter.position.set(0.3, -0.15, 0.05);
			splinter.rotation.z = -0.35;
			spinner.add(shard, splinter);
		}
	}

	// --- Sparks / magic dust: each gem has its own character and its own trail:
	// a soft glow (glow), a sharp dot (dot) or a sharp star (star) ---
	function spawnSpark(size: number, map: CanvasTexture): { sprite: Sprite; mat: SpriteMaterial } {
		const mat = new SpriteMaterial({
			map,
			color: style.glow,
			blending: AdditiveBlending,
			depthWrite: false,
			transparent: true,
			opacity: 0,
			rotation: Math.random() * Math.PI
		});
		const sprite = new Sprite(mat);
		sprite.scale.setScalar(size);
		sprite.userData.rooli = 'kipina';
		group.add(sprite);
		return { sprite, mat };
	}

	let updateSparks: (t: number, camera: PerspectiveCamera) => void = () => {};

	if (kind === 'harmaa' || kind === 'vihrea') {
		// The sparks radiate outward and fade away as very small sharp
		// dots — the gray gem has only a few, and at a leisurely pace
		const count = kind === 'harmaa' ? 3 : 9;
		const reach = kind === 'harmaa' ? 0.85 : 1.1;
		const baseSize = 0.028;
		const speedBase = kind === 'harmaa' ? 0.13 : 0.28;
		const sparks = Array.from({ length: count }, () => {
			const dir = new Vector3(Math.random() - 0.5, Math.random() - 0.4, Math.random() - 0.5).normalize();
			return { ...spawnSpark(baseSize, tex.dot), dir, speed: speedBase + Math.random() * 0.2, offset: Math.random() };
		});
		updateSparks = (t) => {
			for (const s of sparks) {
				const progress = (t * s.speed + s.offset) % 1;
				s.sprite.position.copy(s.dir).multiplyScalar(0.3 + progress * reach);
				s.mat.opacity = 0.85 * (1 - progress) ** 1.4;
				s.sprite.scale.setScalar(baseSize * (0.6 + 0.4 * (1 - progress)));
			}
		};
	} else if (kind === 'sininen') {
		// The gentlest: the sparks drift very slowly in different orbital planes
		// and directions — like an underwater planetary system
		const sparks = Array.from({ length: 7 }, () => {
			const { u, v } = orbitBasis();
			return {
				...spawnSpark(0.07 + Math.random() * 0.05, tex.glow),
				u,
				v,
				radius: 0.55 + Math.random() * 0.35,
				speed: (0.12 + Math.random() * 0.18) * (Math.random() < 0.5 ? -1 : 1),
				offset: Math.random() * Math.PI * 2
			};
		});
		updateSparks = (t) => {
			for (const s of sparks) {
				const a = t * s.speed + s.offset;
				s.sprite.position
					.copy(s.u)
					.multiplyScalar(Math.cos(a) * s.radius)
					.addScaledVector(s.v, Math.sin(a) * s.radius);
				s.mat.opacity = 0.55 + 0.25 * Math.sin(t * 0.6 + s.offset);
			}
		};
	} else if (kind === 'violetti') {
		// Internal lightning: a random crystal flashes bright every now
		// and then — the light comes from inside the gem, not around it
		let flashIdx = 0;
		let flashStart = -10;
		let nextFlash = 0.6;
		const FLASH_DUR = 0.4;
		updateSparks = (t) => {
			if (t >= nextFlash) {
				flashIdx = Math.floor(Math.random() * crystalMats.length);
				flashStart = t;
				nextFlash = t + 0.8 + Math.random() * 1.6;
			}
			const progress = (t - flashStart) / FLASH_DUR;
			const boost = progress < 1 ? (1 - progress) ** 1.6 : 0;
			crystalMats.forEach((mat, i) => {
				if (i === flashIdx) mat.emissiveIntensity += 3.6 * boost;
			});
			light.intensity += 7 * boost;
		};
	} else if (kind === 'oranssi') {
		// Two comets: a sharp dot head and, as the tail, a single camera-facing
		// triangle ribbon that narrows and fades toward the tip.
		// The ribbon length scales freely with the number of history points.
		const HISTORY = 90;
		const comets = Array.from({ length: 2 }, (_, i) => {
			const { u, v } = orbitBasis();
			const geo = new BufferGeometry();
			geo.setAttribute('position', new BufferAttribute(new Float32Array(HISTORY * 2 * 3), 3));
			const idx: number[] = [];
			for (let s = 0; s < HISTORY - 1; s++) {
				const a = s * 2;
				idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
			}
			geo.setIndex(idx);
			geo.setDrawRange(0, 0);
			const mat = new MeshBasicMaterial({
				color: style.glow,
				transparent: true,
				opacity: 0.5,
				blending: AdditiveBlending,
				depthWrite: false,
				side: DoubleSide
			});
			const ribbon = new Mesh(geo, mat);
			ribbon.frustumCulled = false;
			group.add(ribbon);
			return {
				head: spawnSpark(0.028, tex.dot),
				geo,
				history: [] as Vector3[],
				u,
				v,
				radius: 0.62 + i * 0.16,
				speed: 1.5 - i * 0.4,
				offset: i * Math.PI
			};
		});
		const viewDir = new Vector3();
		const along = new Vector3();
		const side = new Vector3();
		updateSparks = (t, camera) => {
			camera.getWorldDirection(viewDir);
			for (const c of comets) {
				const a = t * c.speed + c.offset;
				c.head.sprite.position
					.copy(c.u)
					.multiplyScalar(Math.cos(a) * c.radius)
					.addScaledVector(c.v, Math.sin(a) * c.radius);
				c.head.mat.opacity = 0.9;
				c.history.unshift(c.head.sprite.position.clone());
				if (c.history.length > HISTORY) c.history.pop();

				const pos = c.geo.attributes.position as BufferAttribute;
				const len = c.history.length;
				for (let p = 0; p < len; p++) {
					const point = c.history[p];
					const prev = c.history[Math.max(p - 1, 0)];
					const next = c.history[Math.min(p + 1, len - 1)];
					along.subVectors(prev, next);
					side.crossVectors(along, viewDir);
					const w = 0.016 * (1 - p / HISTORY) ** 1.3;
					if (side.lengthSq() > 1e-8) side.normalize().multiplyScalar(w);
					else side.set(w, 0, 0);
					pos.setXYZ(p * 2, point.x + side.x, point.y + side.y, point.z + side.z);
					pos.setXYZ(p * 2 + 1, point.x - side.x, point.y - side.y, point.z - side.z);
				}
				pos.needsUpdate = true;
				c.geo.setDrawRange(0, Math.max(len - 1, 0) * 6);
			}
		};
	} else {
		// punainen (red): random bursts of sharp slivers — as if the crystal were
		// flinging shards around itself
		const sparks = Array.from({ length: 9 }, () => ({
			...spawnSpark(0.1 + Math.random() * 0.06, tex.sliver),
			dir: new Vector3(),
			speed: 0,
			born: -1
		}));
		let nextBurst = 0.4;
		const LIFE = 0.7;
		updateSparks = (t) => {
			if (t >= nextBurst) {
				nextBurst = t + 1.1 + Math.random() * 1.6;
				for (const s of sparks) {
					s.dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
					s.speed = 0.9 + Math.random() * 1.3;
					s.born = t;
					s.mat.rotation = Math.random() * Math.PI;
				}
			}
			for (const s of sparks) {
				const age = s.born >= 0 ? t - s.born : Infinity;
				if (age > LIFE) {
					s.mat.opacity = 0;
					continue;
				}
				s.sprite.position.copy(s.dir).multiplyScalar(0.35 + age * s.speed);
				s.mat.opacity = 0.9 * (1 - age / LIFE) ** 1.3;
			}
		};
	}

	function update(t: number, camera: PerspectiveCamera): void {
		spinner.rotation.y = t * 0.7 + phase;
		spinner.position.y = Math.sin(t * 1.3 + phase) * 0.06;
		const pulse = 0.75 + 0.25 * Math.sin(t * 2.1 + phase);
		glowMat.opacity = 0.45 + 0.3 * pulse;
		glow.scale.setScalar(2.0 + 0.45 * pulse);
		light.intensity = 3 + 3 * pulse;
		for (const mat of crystalMats) {
			mat.emissiveIntensity = 0.7 + 0.9 * pulse;
		}
		updateSparks(t + phase, camera);
	}

	return { group, update };
}

export type GemGalleryRig = { dispose: () => void };

/** Intro length (s): the color reveal and the spring bounce land right
 *  after this — sync celebration effects (e.g. the cheer text) to it. */
export const GEM_INTRO_DUR = 1.6;

/**
 * A single gem, centered — for the chest-opening reward view.
 * In `intro` mode the gem appears as a small black silhouette, spins fast
 * while slowing down and grows to full size; the glow is gray in the
 * meantime. When the true colors are revealed at the end, the gem bounces
 * with a damped spring, as if it just landed on the stage.
 */
export function createGemView(
	canvas: HTMLCanvasElement,
	kind: GemKind,
	opts: { intro?: boolean } = {}
): GemGalleryRig {
	const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
	renderer.setClearColor(0x000000, 0);

	const scene = new Scene();
	scene.add(new HemisphereLight(0x8fa3b8, 0x1a2029, 0.85));

	// Far enough away that the glow halo doesn't get clipped at the canvas edges
	const camera = new PerspectiveCamera(35, 1, 0.1, 50);
	camera.position.set(0, 0, 4.6);
	const H_FOV_RAD = (30 * Math.PI) / 180;

	const tex = makeGemTextures();
	const gem = buildGem(kind, tex);
	scene.add(gem.group);

	// Intro: stash the original colors so they can be restored at the end
	const INTRO_DUR = GEM_INTRO_DUR;
	const INTRO_SPIN = 22; // rad/s at the start, decelerates to zero
	// Spring bounce at the color reveal: overshoot amplitude, damping (1/s)
	// and oscillation frequency (rad/s); settled once the envelope has died out
	const SPRING_AMP = 0.32;
	const SPRING_DAMP = 5.5;
	const SPRING_FREQ = 16;
	const SPRING_DUR = 0.9;
	let introDone = !opts.intro;
	let startT: number | null = null;
	const originals: { mat: MeshStandardMaterial; color: number; emissive: number }[] = [];
	const spriteOriginals: { mat: SpriteMaterial; color: number }[] = [];
	if (opts.intro) {
		gem.group.traverse((obj) => {
			if (obj instanceof Mesh) {
				const mat = obj.material as MeshStandardMaterial;
				originals.push({
					mat,
					color: mat.color.getHex(),
					emissive: mat.emissive ? mat.emissive.getHex() : 0
				});
			} else if (obj instanceof Sprite) {
				const mat = obj.material as SpriteMaterial;
				spriteOriginals.push({ mat, color: mat.color.getHex() });
			}
		});
	}

	function applyIntro(te: number): void {
		const p = Math.min(te / INTRO_DUR, 1);
		// Growth from tiny to full size, with a decelerating spin
		const e = 1 - Math.pow(1 - p, 3);
		gem.group.scale.setScalar(0.02 + 0.98 * e);
		const ti = Math.min(te, INTRO_DUR);
		gem.group.rotation.y = INTRO_SPIN * (ti - (ti * ti) / (2 * INTRO_DUR));

		if (p < 1) {
			for (const o of originals) {
				o.mat.color.setHex(0x08090b);
				o.mat.emissive?.setHex(0x000000);
			}
			gem.group.traverse((obj) => {
				if (obj instanceof Sprite) {
					const mat = obj.material as SpriteMaterial;
					if (obj.userData.rooli === 'hehku') mat.color.setHex(0x8f97a1);
					else mat.opacity = 0;
				}
			});
		} else {
			// The colors are revealed: restore the original materials,
			// including the glow halo the intro tinted gray
			for (const o of originals) {
				o.mat.color.setHex(o.color);
				o.mat.emissive?.setHex(o.emissive);
			}
			for (const o of spriteOriginals) o.mat.color.setHex(o.color);
			// Spring bounce: the scale overshoots and oscillates back to rest
			const ts = te - INTRO_DUR;
			if (ts < SPRING_DUR) {
				gem.group.scale.setScalar(
					1 + SPRING_AMP * Math.exp(-SPRING_DAMP * ts) * Math.sin(SPRING_FREQ * ts)
				);
			} else {
				gem.group.scale.setScalar(1);
				introDone = true;
			}
		}
	}

	let raf = 0;
	let disposed = false;

	function frame(nowMs: number): void {
		if (disposed) return;
		const t = nowMs / 1000;
		if (startT === null) startT = t;
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
		gem.update(t, camera);
		if (!introDone) applyIntro(t - startT);
		renderer.render(scene, camera);
		raf = requestAnimationFrame(frame);
	}
	raf = requestAnimationFrame(frame);

	return {
		dispose() {
			disposed = true;
			cancelAnimationFrame(raf);
			tex.glow.dispose();
			tex.dot.dispose();
			tex.star.dispose();
			tex.sliver.dispose();
			scene.traverse((obj) => {
				if (obj instanceof Mesh || obj instanceof Sprite) {
					if ('geometry' in obj) (obj as Mesh).geometry?.dispose();
					const material = (obj as Mesh).material;
					(Array.isArray(material) ? material : [material]).forEach((m) => m.dispose());
				}
			});
			renderer.dispose();
		}
	};
}

/** Debug gallery: all gems at once, the most common at the top left. */
export function createGemGallery(canvas: HTMLCanvasElement): GemGalleryRig {
	const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
	renderer.setClearColor(0x000000, 0);

	const scene = new Scene();
	scene.add(new HemisphereLight(0x8fa3b8, 0x1a2029, 0.85));

	const camera = new PerspectiveCamera(35, 1, 0.1, 50);
	camera.position.set(0, 0, 6.2);
	const H_FOV_RAD = (30 * Math.PI) / 180;

	const tex = makeGemTextures();
	const gems = GEM_ORDER.map((kind, i) => {
		const handle = buildGem(kind, tex);
		const col = i % 2;
		const row = Math.floor(i / 2);
		handle.group.position.set(col === 0 ? -0.85 : 0.85, 1.85 - row * 1.85, 0);
		scene.add(handle.group);
		return handle;
	});

	let raf = 0;
	let disposed = false;

	function frame(nowMs: number): void {
		if (disposed) return;
		const t = nowMs / 1000;
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
		for (const gem of gems) gem.update(t, camera);
		renderer.render(scene, camera);
		raf = requestAnimationFrame(frame);
	}
	raf = requestAnimationFrame(frame);

	return {
		dispose() {
			disposed = true;
			cancelAnimationFrame(raf);
			tex.glow.dispose();
			tex.dot.dispose();
			tex.star.dispose();
			tex.sliver.dispose();
			scene.traverse((obj) => {
				if (obj instanceof Mesh || obj instanceof Sprite) {
					if ('geometry' in obj) (obj as Mesh).geometry?.dispose();
					const material = (obj as Mesh).material;
					(Array.isArray(material) ? material : [material]).forEach((m) => {
						if ('map' in m && m.map) (m.map as CanvasTexture).dispose();
						m.dispose();
					});
				}
			});
			renderer.dispose();
		}
	};
}
