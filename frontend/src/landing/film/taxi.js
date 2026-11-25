/** Block model taxi, built in code and drawn oversized so it reads from the air. Faces +x. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createTaxi(scale) {
    const lit = (color, glow = 0) => new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: glow, metalness: 0.25, roughness: 0.35, transparent: true,
    });
    const paint = lit(0xffc21a, 0.22);
    const glass = lit(0x1b2236);
    const tyre = lit(0x090a0f);
    const sign = lit(0xfff3c4, 1);
    const head = lit(0xfff6d0, 1);
    const tail = lit(0xff3b30, 1);
    const group = new THREE.Group();
    const box = (w, h, d, material, x, y, z = 0) => {
        const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.28), material);
        mesh.position.set(x, y, z);
        group.add(mesh);
    };
    box(4.4, 0.9, 2, paint, 0, 0.9);
    box(2.3, 0.75, 1.84, glass, -0.25, 1.7);
    box(2.1, 0.14, 1.9, paint, -0.3, 2.14);
    box(0.7, 0.35, 0.9, sign, -0.3, 2.39);
    for (const z of [-0.65, 0.65]) {
        box(0.12, 0.26, 0.42, head, 2.22, 0.98, z);
        box(0.12, 0.24, 0.42, tail, -2.22, 0.98, z);
    }
    for (const x of [-1.45, 1.45]) {
        for (const z of [-0.98, 0.98]) {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 12), tyre);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(x, 0.48, z);
            group.add(wheel);
        }
    }
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.4), new THREE.MeshBasicMaterial({
        color: 0xffe9a8, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(5.6, 0.15, 0);
    group.add(beam);
    const body = [...group.children];

    // ring on the road: green for matched, orange for refused
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 4.1, 40), new THREE.MeshBasicMaterial({
        color: 0x3ddc84, side: THREE.DoubleSide, depthWrite: false,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    ring.visible = false;
    group.add(ring);
    group.scale.setScalar(scale);

    return {
        group,
        fade(opacity) {
            for (const mesh of body) mesh.material.opacity = mesh === beam ? opacity * 0.16 : opacity;
        },
        mark(color) {
            ring.visible = color !== null;
            if (color !== null) ring.material.color.set(color);
        },
    };
}
