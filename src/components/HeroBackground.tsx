import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * drifting gold dust behind the hero — one Three.js Points field,
 * color follows --gold so it re-tints on theme switch.
 */
export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 26;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return; // no WebGL — hero still works, it just loses the dust
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const N = 160;
    const pos = new Float32Array(N * 3);
    const rise = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 72;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
      rise[i] = 0.01 + Math.random() * 0.02;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.34,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const readGold = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#f0b84a';
    mat.color.set(readGold());
    const themeObs = new MutationObserver(() => mat.color.set(readGold()));
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const resize = () => {
      const w = parent.clientWidth || 1;
      const h = parent.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let t = 0;
    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };
    if (!reduced) window.addEventListener('pointermove', onMove);
    const tick = () => {
      t += 0.01;
      const p = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < N; i++) {
        p[i * 3 + 1] += rise[i];
        if (p[i * 3 + 1] > 14) p[i * 3 + 1] = -14;
      }
      geo.attributes.position.needsUpdate = true;
      // slow sway + eased mouse parallax
      const sway = Math.sin(t * 0.12) * 0.14;
      points.rotation.y += (sway + mx * 0.4 - points.rotation.y) * 0.04;
      points.rotation.x += (my * 0.22 - points.rotation.x) * 0.04;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    if (reduced) renderer.render(scene, camera);
    else raf = requestAnimationFrame(tick);

    // shortcut: keeps rendering while the hero is scrolled past — 160 points, negligible; upgrade to an IntersectionObserver gate if the scene ever grows
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      themeObs.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
