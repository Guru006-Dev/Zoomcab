/** The still parts of the city: ground, roads, buildings, streetlights and trees. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const LETTERS = 'abcdefghijklmn'.split('');

function seeded(seed) {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function strip(points, width) {
    const positions = [];
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const q = points[i];
        const side = new THREE.Vector3(q.z - a.z, 0, a.x - q.x).normalize().multiplyScalar(width / 2);
        const [p1, p2, q1, q2] = [a.clone().add(side), a.clone().sub(side), q.clone().add(side), q.clone().sub(side)];
        for (const v of [p1, p2, q1, q1, p2, q2]) positions.push(v.x, v.y, v.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
}

export function softDot(inner) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, inner);
    g.addColorStop(1, 'transparent');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
}

function addRoads(scene, graph, at) {
    const flat = (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    const ribbons = (major, width, color, height) => {
        const parts = graph.edges.filter((e) => e[2] === major)
            .map(([a, b]) => strip([at(graph.nodes[a], height), at(graph.nodes[b], height)], width));
        const merged = mergeGeometries(parts);
        parts.forEach((p) => p.dispose());
        scene.add(new THREE.Mesh(merged, flat(color)));
    };
    ribbons(0, 7.6, 0x7f86ad, 0.25); // kerbs under the asphalt
    ribbons(1, 15, 0xaab0d6, 0.3);
    ribbons(0, 6, 0x333950, 0.5);
    ribbons(1, 13, 0x454c6b, 0.7);

    // discs fill the notches where road pieces meet
    const matrix = new THREE.Matrix4();
    for (const [major, radius, color, height] of [[0, 3, 0x333950, 0.55], [1, 6.5, 0x454c6b, 0.75]]) {
        const ids = [...new Set(graph.edges.filter((e) => e[2] === major).flatMap(([a, b]) => [a, b]))];
        const discs = new THREE.InstancedMesh(new THREE.CircleGeometry(radius, 14).rotateX(-Math.PI / 2), flat(color), ids.length);
        ids.forEach((id, i) => discs.setMatrixAt(i, matrix.setPosition(at(graph.nodes[id], height))));
        scene.add(discs);
    }

    const dashes = [];
    for (const [a, b] of graph.edges) {
        const p = at(graph.nodes[a], 0.95);
        const q = at(graph.nodes[b], 0.95);
        const length = p.distanceTo(q);
        for (let d = 2; d < length; d += 12) {
            dashes.push(p.clone().lerp(q, d / length), p.clone().lerp(q, Math.min(length, d + 5) / length));
        }
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(dashes),
        new THREE.LineBasicMaterial({ color: 0xd9c98a, transparent: true, opacity: 0.65 })));
}

function addLamps(scene, graph, at) {
    const lamps = [];
    const pools = [];
    for (const [a, b, major] of graph.edges) {
        const p = at(graph.nodes[a]);
        const q = at(graph.nodes[b]);
        const length = p.distanceTo(q);
        const gap = major ? 38 : 80;
        const side = new THREE.Vector3(q.z - p.z, 0, p.x - q.x).normalize().multiplyScalar(major ? 8.5 : 4.5);
        for (let d = gap / 2; d < length; d += gap) {
            const spot = p.clone().lerp(q, d / length).add(side);
            lamps.push(spot.clone().setY(8));
            pools.push(spot.clone().sub(side.clone().multiplyScalar(0.6)).setY(1.1));
        }
    }
    const cloud = (points, options) => {
        const o = new THREE.Points(new THREE.BufferGeometry().setFromPoints(points),
            new THREE.PointsMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...options }));
        scene.add(o);
        return o;
    };
    return {
        lights: cloud(lamps, { map: softDot('#fff1cf'), color: 0xffb864, size: 6 }),
        pools: cloud(pools, { map: softDot('#ffffff'), color: 0xff9a3c, size: 26, opacity: 0.17 }),
    };
}

/** Trees are decoration placed beside roads, never on one. */
function addTrees(scene, graph, at) {
    const random = seeded(99);
    const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.2, 0),
        new THREE.MeshLambertMaterial({ color: 0x1d4a37, flatShading: true }), 1800);
    const dummy = new THREE.Object3D();
    const onRoad = (x, y) => graph.edges.some(([a, b, major]) => {
        const [ax, ay] = graph.nodes[a];
        const [bx, by] = graph.nodes[b];
        const reach = major ? 11 : 7;
        if (x < Math.min(ax, bx) - reach || x > Math.max(ax, bx) + reach) return false;
        const dx = bx - ax;
        const dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
        return Math.hypot(x - ax - dx * t, y - ay - dy * t) < reach;
    });
    let planted = 0;
    for (let tries = 0; planted < trees.count && tries < 8000; tries++) {
        const [a, b] = graph.edges[Math.floor(random() * graph.edges.length)];
        const p = at(graph.nodes[a]);
        const q = at(graph.nodes[b]);
        const side = new THREE.Vector3(q.z - p.z, 0, p.x - q.x).normalize()
            .multiplyScalar((random() < 0.5 ? -1 : 1) * (11 + random() * 6));
        dummy.position.copy(p.lerp(q, random()).add(side)).setY(3.5);
        if (onRoad(dummy.position.x + graph.width / 2, dummy.position.z + graph.height / 2)) continue;
        dummy.scale.setScalar(0.6 + random() * 0.6);
        dummy.rotation.y = random() * 6;
        dummy.updateMatrix();
        trees.setMatrixAt(planted++, dummy.matrix);
    }
    trees.count = planted;
    scene.add(trees);
}

async function loadModel(loader, base, name) {
    const gltf = await loader.loadAsync(`${base}${name}.glb`);
    gltf.scene.updateMatrixWorld(true);
    const pieces = [];
    let map = null;
    gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
        for (const key of Object.keys(g.attributes)) {
            if (!['position', 'normal', 'uv'].includes(key)) g.deleteAttribute(key);
        }
        pieces.push(g);
        map = o.material.map;
    });
    const geometry = mergeGeometries(pieces);
    geometry.computeBoundingBox();
    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    const middle = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-middle.x, -geometry.boundingBox.min.y, -middle.z);
    return { geometry, size, map };
}

/** Detailed models where the camera gets close, simple ones everywhere else. */
async function addBuildings(scene, spots, at, closeTo, base) {
    const loader = new GLTFLoader();
    const sets = await Promise.all(['building-', 'low-detail-building-']
        .map((prefix) => Promise.all(LETTERS.map((l) => loadModel(loader, base, prefix + l)))));
    const close = ([x, y]) => closeTo.some(([cx, cy]) => Math.hypot(x - cx, y - cy) < 300);
    const holder = new THREE.Object3D();
    const materials = [];
    sets.forEach((set, simple) => {
        set.forEach((model, type) => {
            const list = spots.filter((s) => s[6] === type && close(s) !== Boolean(simple));
            if (!list.length) return;
            const material = new THREE.MeshLambertMaterial({
                map: model.map, emissive: 0xffffff, emissiveMap: model.map, emissiveIntensity: simple ? 0.03 : 0.1,
            });
            material.userData.base = simple ? 0x565d86 : 0xffffff;
            material.color.set(material.userData.base);
            materials.push(material);
            const mesh = new THREE.InstancedMesh(model.geometry, material, list.length);
            list.forEach(([x, y, angle, w, d, h], i) => {
                const sx = w / model.size.x;
                const sz = d / model.size.z;
                const sy = h ? h / model.size.y : Math.min(Math.sqrt(sx * sz), (simple ? 40 : 22) / model.size.y);
                holder.position.copy(at([x, y]));
                holder.rotation.set(0, -angle, 0);
                holder.scale.set(sx, sy, sz);
                holder.updateMatrix();
                mesh.setMatrixAt(i, holder.matrix);
            });
            scene.add(mesh);
        });
    });
    return materials;
}

export async function buildCity(scene, { graph, spots, at, closeTo, base }) {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(graph.width * 3, graph.height * 3),
        new THREE.MeshBasicMaterial({ color: 0x07080d }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    scene.add(ground);
    addRoads(scene, graph, at);
    const lamps = addLamps(scene, graph, at);
    addTrees(scene, graph, at);
    const materials = await addBuildings(scene, spots, at, closeTo, base);

    const red = new THREE.Color(0x5a2030);
    return {
        /** fault 0 is normal; 1 is the server failure. power dims the lights. */
        setPower(fault, power) {
            materials.forEach((m) => {
                m.color.set(m.userData.base).lerp(red, fault);
                m.emissiveIntensity = (m.userData.base === 0xffffff ? 0.1 : 0.03) * power;
            });
            lamps.lights.material.opacity = power;
            lamps.pools.material.opacity = 0.17 * power;
        },
    };
}
