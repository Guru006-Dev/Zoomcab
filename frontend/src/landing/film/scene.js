/** Draws one story state in 3D. Owns the renderer; call dispose() to release it. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildCity, softDot, strip } from './city3d';
import { createTaxi } from './taxi';
import { along } from './timeline';

const ROAD_Y = 1.2;
const clamp = (n) => Math.min(1, Math.max(0, n));
const smooth = (t) => t * t * (3 - 2 * t);

export async function createScene(canvas, { graph, spots, ride, reduced, base }) {
    const at = ([x, y], h = 0) => new THREE.Vector3(x - graph.width / 2, h, y - graph.height / 2);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060a);
    scene.fog = new THREE.FogExp2(0x05060a, 0.00022);
    const camera = new THREE.PerspectiveCamera(50, 1, 5, 12000);
    const sky = new THREE.HemisphereLight(0x8d9cff, 0x14101f, 1.6);
    const moon = new THREE.DirectionalLight(0xbfc8ff, 1.2);
    moon.position.set(-1, 2, 1);
    scene.add(sky, moon);

    const composer = new EffectComposer(renderer);

    const dispose = () => {
        scene.traverse((o) => {
            o.geometry?.dispose();
            for (const m of [].concat(o.material ?? [])) {
                m.map?.dispose();
                m.dispose();
            }
        });
        composer.passes.forEach((pass) => pass.dispose?.());
        composer.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
    };

    const P = graph.nodes[ride.pickup];
    const D = graph.nodes[ride.dropoff];
    let city;
    try {
        city = await buildCity(scene, { graph, spots, at, closeTo: [P, D], base });
    } catch (error) {
        dispose();
        throw error;
    }

    const route = [...ride.approach, ...ride.trip].map((p) => at(p, ROAD_Y));
    const routeLine = new THREE.Mesh(strip(route, 2.4), new THREE.MeshBasicMaterial({ color: 0x3ddc84, side: THREE.DoubleSide }));
    scene.add(routeLine);

    const marker = (color, size) => {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: softDot('#ffffff'), color, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
        }));
        sprite.scale.setScalar(size);
        scene.add(sprite);
        return sprite;
    };
    const you = marker(0x8b82ff, 90);
    you.position.copy(at(P, 10));
    const goal = marker(0xffffff, 60);
    goal.position.copy(at(D, 10));

    const place = (taxi, where) => {
        taxi.group.position.copy(at([where.x, where.y], 1));
        taxi.group.rotation.y = where.heading;
        scene.add(taxi.group);
    };
    const car = createTaxi(7);
    scene.add(car.group);
    const rival = createTaxi(7);
    place(rival, along(ride.rival, 0));
    // background taxis, parked across the city
    const others = Array.from({ length: 40 }, (_, i) => {
        const from = graph.main[(i * 977 + 131) % graph.main.length];
        const to = graph.adj[from][0].to;
        const taxi = createTaxi(4);
        place(taxi, along([graph.nodes[from], graph.nodes[to]], 0.5));
        return taxi;
    });

    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.5, 0.62);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const v = (base3, x, y, z) => base3.clone().add(new THREE.Vector3(x, y, z));
    const zero = new THREE.Vector3();
    const pickup = at(P);
    const drop = at(D);
    const shots = [
        [v(zero, -500, 2100, 2200), zero],
        [v(pickup, 80, 330, 430), pickup],
        [v(pickup, -420, 520, 300), pickup],
        null, // follow the taxi
        [v(zero, 900, 800, 900), zero],
        [v(zero, 300, 1000, 1200), zero],
        [v(drop, 300, 900, 900), drop],
    ];

    return {
        resize(width, height) {
            const ratio = Math.min(window.devicePixelRatio, 1.5);
            renderer.setPixelRatio(ratio);
            renderer.setSize(width, height, false);
            composer.setPixelRatio(ratio);
            composer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        },
        render(state, now) {
            const { s } = state;
            car.group.position.copy(at([state.car.x, state.car.y], 1));
            car.group.rotation.y = state.car.heading;
            car.group.scale.setScalar(7 - 5 * clamp(s - 2.2));
            car.mark(state.matched ? 0x3ddc84 : null);
            rival.mark(state.rivalRefused ? 0xff7a50 : null);
            rival.fade(state.rivalOpacity);
            others.forEach((taxi) => taxi.fade(state.othersOpacity));
            routeLine.visible = state.matched;
            you.visible = state.showPickup;
            you.scale.setScalar(s > 0.6 ? 90 + (reduced ? 0 : Math.sin(now / 260) * 14) : 50);
            goal.visible = s > 2.6;

            // flicker at 2.5 changes a second, inside the safety limit of three flashes
            const flicker = !reduced && state.fault > 0.3 && Math.floor(now / 200) % 2 ? 0.85 : 1;
            city.setPower(state.fault, flicker * (1 - state.fault * 0.85));
            sky.intensity = 1.6 * flicker * (1 - state.fault * 0.35);

            const follow = () => [v(car.group.position, 22, 150, 48), car.group.position.clone()];
            const i = Math.min(Math.floor(s), shots.length - 1);
            const from = shots[i] ?? follow();
            const to = shots[Math.min(i + 1, shots.length - 1)] ?? follow();
            const k = reduced ? Math.round(s - i) : smooth(s - i);
            camera.position.copy(from[0]).lerp(to[0], k);
            camera.lookAt(from[1].clone().lerp(to[1], k));
            composer.render();
        },
        dispose,
    };
}
