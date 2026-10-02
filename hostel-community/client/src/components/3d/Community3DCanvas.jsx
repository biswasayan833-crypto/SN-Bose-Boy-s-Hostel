import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Checks if WebGL is supported by the current client.
 */
function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Creates a circular soft-glow particle sprite texture programmatically.
 * Avoids any external image downloads and ensures zero network latency.
 */
function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(129, 140, 248, 0.85)'); // Indigo-400
  gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');   // Cyan-400
  gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');          // Slate-900 transparent

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Community3DCanvas
 * 
 * Cinematic 3D visualization for Prof. S.N. Bose Boys Hostel Community.
 * Represents students (particles), community rooms (hubs), and peer connections (dynamic lattice).
 * 
 * Performance features:
 * - Lazy initialized
 * - WebGL fallback to graceful CSS gradient
 * - prefers-reduced-motion compliance
 * - IntersectionObserver (pauses offscreen)
 * - Page Visibility API (pauses when tab inactive)
 * - DPR clamped to max 1.75
 * - Full WebGL context & memory disposal on unmount
 */
export const Community3DCanvas = ({
  className = '',
  intensity = 'normal', // 'subtle' | 'normal'
  enableParallax = true,
}) => {
  const containerRef = useRef(null);
  const [webGLAvailable, setWebGLAvailable] = useState(() => isWebGLSupported());

  useEffect(() => {
    // 1. WebGL Support Guard
    if (!webGLAvailable) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // 2. Motion Preference Guard
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 3. Scene, Camera, Renderer Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 45;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: width > 768, // Antialias only on larger screens for mobile performance
        powerPreference: 'high-performance',
      });
    } catch {
      setWebGLAvailable(false);
      return;
    }

    const isMobile = width < 768;
    const isSmallMobile = width < 480;

    // DPR Clamping: 1.2x on small mobile, 1.4x on tablet/mobile, 1.75x on desktop
    const maxDpr = isSmallMobile ? 1.2 : (isMobile ? 1.4 : 1.75);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // 100% transparent backdrop
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // 4. Create Node Sprites & Lattice Geometry
    // Scale node count smoothly to ensure fluid 60fps on low-power devices
    const nodeCount = isSmallMobile ? 22 : (isMobile ? 32 : (intensity === 'subtle' ? 45 : 72));
    const connectionDistance = isSmallMobile ? 8.5 : (isMobile ? 11 : 15);
    const maxConnections = nodeCount * (isSmallMobile ? 3 : 4);

    const glowTexture = createGlowTexture();

    // Node Positions and Velocities
    const nodes = [];
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);

    // Color palette tailored to Prof. S.N. Bose Boys Hostel:
    // Cyan (Global), Violet (Wing B), Emerald (Wing A), Amber (Wing C)
    const colorPalette = [
      new THREE.Color(0x38bdf8), // Cyan-400
      new THREE.Color(0x818cf8), // Indigo-400
      new THREE.Color(0xc084fc), // Violet-400
      new THREE.Color(0x34d399), // Emerald-400
      new THREE.Color(0xfbbf24), // Amber-400
    ];

    const boundX = isSmallMobile ? 16 : (isMobile ? 22 : 36);
    const boundY = isSmallMobile ? 12 : (isMobile ? 16 : 24);
    const boundZ = isSmallMobile ? 14 : 18;

    for (let i = 0; i < nodeCount; i++) {
      const x = (Math.random() - 0.5) * boundX * 2;
      const y = (Math.random() - 0.5) * boundY * 2;
      const z = (Math.random() - 0.5) * boundZ * 2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const color = colorPalette[i % colorPalette.length];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      nodes.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 0.018,
        vy: (Math.random() - 0.5) * 0.018,
        vz: (Math.random() - 0.5) * 0.012,
        baseColor: color,
      });
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: isMobile ? 1.4 : 1.9,
      map: glowTexture || undefined,
      vertexColors: true,
      transparent: true,
      opacity: intensity === 'subtle' ? 0.6 : 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);

    // 5. Dynamic Connection Lines (LineSegments)
    const linePositions = new Float32Array(maxConnections * 6);
    const lineColors = new Float32Array(maxConnections * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage)
    );
    lineGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage)
    );

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: intensity === 'subtle' ? 0.16 : 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(connectionLines);

    // 6. Community Hubs (Representing Hostel Rooms & Quantum Core)
    const hubsGroup = new THREE.Group();
    scene.add(hubsGroup);

    // Main Central Hub (Global Hostel Node)
    const centralGeo = new THREE.IcosahedronGeometry(isMobile ? 3.5 : 5.2, 1);
    const centralMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1, // Indigo
      wireframe: true,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    const centralHub = new THREE.Mesh(centralGeo, centralMat);
    centralHub.position.set(0, 0, -5);
    hubsGroup.add(centralHub);

    // Outer Orbit Ring for Central Hub
    const ringGeo = new THREE.TorusGeometry(isMobile ? 5.5 : 8.2, 0.04, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Cyan
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    });
    const orbitalRing = new THREE.Mesh(ringGeo, ringMat);
    orbitalRing.rotation.x = Math.PI / 3;
    hubsGroup.add(orbitalRing);

    // 2nd Year Quarters Node
    const hub2Geo = new THREE.OctahedronGeometry(isMobile ? 2.0 : 2.8, 0);
    const hub2Mat = new THREE.MeshBasicMaterial({
      color: 0x34d399, // Emerald
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const hub2 = new THREE.Mesh(hub2Geo, hub2Mat);
    hub2.position.set(isMobile ? -14 : -24, isMobile ? 7 : 9, -8);
    hubsGroup.add(hub2);

    // 3rd Year Quarters Node
    const hub3Geo = new THREE.OctahedronGeometry(isMobile ? 2.2 : 3.0, 0);
    const hub3Mat = new THREE.MeshBasicMaterial({
      color: 0x818cf8, // Indigo
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const hub3 = new THREE.Mesh(hub3Geo, hub3Mat);
    hub3.position.set(isMobile ? 14 : 25, isMobile ? -6 : -8, -10);
    hubsGroup.add(hub3);

    // 4th Year Quarters Node
    const hub4Geo = new THREE.OctahedronGeometry(isMobile ? 1.8 : 2.4, 0);
    const hub4Mat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24, // Amber
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const hub4 = new THREE.Mesh(hub4Geo, hub4Mat);
    hub4.position.set(isMobile ? 10 : 18, isMobile ? 11 : 14, -12);
    hubsGroup.add(hub4);

    // 7. Mouse & Touch Parallax Easing
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handlePointerMove = (e) => {
      if (!enableParallax || prefersReducedMotion) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      targetX = (clientX - halfW) * 0.005;
      targetY = (clientY - halfH) * 0.005;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // 8. Visibility & Resize Handlers
    let isVisible = true;
    let isTabActive = !document.hidden;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          isVisible = entries[0].isIntersecting;
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize, { passive: true });

    // 9. Animation Loop
    let animationFrameId = null;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Halt calculations if offscreen or tab is hidden (saves CPU/battery)
      if (!isVisible || !isTabActive) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const speedFactor = prefersReducedMotion ? 0.08 : 1.0;

      // Smooth pointer parallax
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;

      camera.position.x = currentX * 6;
      camera.position.y = -currentY * 5;
      camera.lookAt(0, 0, 0);

      // Rotate Community Hubs
      centralHub.rotation.y += 0.12 * delta * speedFactor;
      centralHub.rotation.x += 0.08 * delta * speedFactor;
      orbitalRing.rotation.z += 0.1 * delta * speedFactor;

      hub2.rotation.y -= 0.15 * delta * speedFactor;
      hub2.rotation.z += 0.1 * delta * speedFactor;

      hub3.rotation.y += 0.14 * delta * speedFactor;
      hub3.rotation.x -= 0.09 * delta * speedFactor;

      hub4.rotation.x += 0.16 * delta * speedFactor;
      hub4.rotation.y += 0.12 * delta * speedFactor;

      // Update Node positions & Dynamic Lattice
      const posArray = particlesGeometry.attributes.position.array;
      const linePos = lineGeometry.attributes.position.array;
      const lineCol = lineGeometry.attributes.color.array;

      let lineIndex = 0;

      for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i];

        // Move nodes
        node.x += node.vx * speedFactor;
        node.y += node.vy * speedFactor;
        node.z += node.vz * speedFactor;

        // Bounce gently off soft bounds
        if (Math.abs(node.x) > boundX) node.vx *= -1;
        if (Math.abs(node.y) > boundY) node.vy *= -1;
        if (Math.abs(node.z) > boundZ) node.vz *= -1;

        posArray[i * 3] = node.x;
        posArray[i * 3 + 1] = node.y;
        posArray[i * 3 + 2] = node.z;

        // Form connection lines with nearby nodes
        for (let j = i + 1; j < nodeCount; j++) {
          if (lineIndex >= maxConnections) break;

          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dz = node.z - other.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < connectionDistance * connectionDistance) {
            const alpha = 1.0 - Math.sqrt(distSq) / connectionDistance;

            const idx = lineIndex * 6;
            linePos[idx] = node.x;
            linePos[idx + 1] = node.y;
            linePos[idx + 2] = node.z;
            linePos[idx + 3] = other.x;
            linePos[idx + 4] = other.y;
            linePos[idx + 5] = other.z;

            // Gradient line blending both node colors
            lineCol[idx] = node.baseColor.r * alpha;
            lineCol[idx + 1] = node.baseColor.g * alpha;
            lineCol[idx + 2] = node.baseColor.b * alpha;
            lineCol[idx + 3] = other.baseColor.r * alpha;
            lineCol[idx + 4] = other.baseColor.g * alpha;
            lineCol[idx + 5] = other.baseColor.b * alpha;

            lineIndex++;
          }
        }
      }

      particlesGeometry.attributes.position.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIndex * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Robust Cleanup & Disposal on Unmount
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      intersectionObserver.disconnect();
      resizeObserver.disconnect();

      // Dispose Three.js objects
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      centralGeo.dispose();
      centralMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      hub2Geo.dispose();
      hub2Mat.dispose();
      hub3Geo.dispose();
      hub3Mat.dispose();
      hub4Geo.dispose();
      hub4Mat.dispose();
      if (glowTexture) glowTexture.dispose();

      if (renderer) {
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
        renderer.forceContextLoss();
      }
    };
  }, [intensity, enableParallax]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
    >
      {!webGLAvailable && (
        // Graceful CSS Fallback when WebGL is unavailable
        <div className="absolute inset-0 bg-radial from-indigo-950/20 via-transparent to-transparent opacity-60" />
      )}
    </div>
  );
};

export default Community3DCanvas;
