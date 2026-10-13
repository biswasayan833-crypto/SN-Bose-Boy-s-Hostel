import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * NoticeBoard3D
 * 
 * Physical 3D interactive hostel notice board with cinematic violet/cyan emissive accents.
 * Positioned in the 3D environment alongside the student resident.
 * 
 * Features:
 * - Emissive neon border trim with subtle idle glow pulse
 * - Pinned hostel notice sheets with glowing push-pins
 * - Clear hover & proximity interaction state
 * - Attention-drawing highlight pulse after greeting completion
 * - Click interaction triggers the accessible DOM Notice Board panel
 */
export function NoticeBoard3D({
  position = [-1.15, 0.15, -0.65],
  rotation = [0, 0.28, 0],
  scale = 1.0,
  isHighlighted = false,
  onOpenNoticeBoard,
  enableInteraction = true,
}) {
  const groupRef = useRef();
  const trimRef = useRef();
  const headerGlowRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.08);

    if (!groupRef.current) return;

    // 1. Idle emissive pulse & hover glow scaling
    const baseGlow = isHovered ? 1.4 : isHighlighted ? 1.1 + Math.sin(t * 3.5) * 0.4 : 0.6 + Math.sin(t * 1.8) * 0.2;
    if (trimRef.current) {
      trimRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        trimRef.current.emissiveIntensity || 0.6,
        baseGlow,
        dt * 6.0
      );
    }
    if (headerGlowRef.current) {
      headerGlowRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        headerGlowRef.current.emissiveIntensity || 0.8,
        baseGlow * 1.2,
        dt * 6.0
      );
    }

    // 2. Subtle hover scale pop & gentle floating sway
    const targetScale = isHovered ? scale * 1.03 : scale;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), dt * 6.0);

    // Subtle breathing float
    const floatY = position[1] + Math.sin(t * 1.2) * 0.015;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, floatY, dt * 4.0);
  });

  const handlePointerOver = (e) => {
    if (enableInteraction) {
      e.stopPropagation();
      setIsHovered(true);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    document.body.style.cursor = 'default';
  };

  const handleClick = (e) => {
    if (enableInteraction && typeof onOpenNoticeBoard === 'function') {
      e.stopPropagation();
      onOpenNoticeBoard();
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Dual Support Stand Posts (Matte Obsidian Metal) */}
      <mesh position={[-0.6, -0.95, -0.05]}>
        <cylinderGeometry args={[0.035, 0.035, 1.2, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.8} />
      </mesh>
      <mesh position={[0.6, -0.95, -0.05]}>
        <cylinderGeometry args={[0.035, 0.035, 1.2, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.8} />
      </mesh>

      {/* Main Board Frame Outer Backing */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[1.5, 1.1, 0.06]} />
        <meshStandardMaterial color="#090d16" roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Emissive Neon Outer Border Trim (Violet/Cyan) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.54, 1.14, 0.04]} />
        <meshStandardMaterial
          ref={trimRef}
          color="#06b6d4"
          emissive="#6366f1"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Cork / Slate Bulletin Board Surface */}
      <mesh position={[0, -0.03, 0.02]}>
        <boxGeometry args={[1.42, 0.94, 0.02]} />
        <meshStandardMaterial color="#0c1222" roughness={0.85} metalness={0.2} />
      </mesh>

      {/* Top Header Bar */}
      <mesh position={[0, 0.44, 0.03]}>
        <boxGeometry args={[1.42, 0.12, 0.025]} />
        <meshStandardMaterial
          ref={headerGlowRef}
          color="#1e1b4b"
          emissive="#38bdf8"
          emissiveIntensity={0.8}
          roughness={0.3}
        />
      </mesh>
      {/* Header Accent Line */}
      <mesh position={[0, 0.38, 0.045]}>
        <boxGeometry args={[1.3, 0.015, 0.005]} />
        <meshStandardMaterial color="#38bdf8" emissive="#06b6d4" emissiveIntensity={1.2} />
      </mesh>

      {/* --- PINNED NOTICE SHEETS --- */}

      {/* Notice 1: Gate Timings (Urgent / Top-Left) */}
      <group position={[-0.38, 0.16, 0.04]} rotation={[0, 0, 0.04]}>
        {/* Parchment Sheet */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.36, 0.01]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.6} />
        </mesh>
        {/* Urgent Header Strip */}
        <mesh position={[0, 0.13, 0.008]}>
          <boxGeometry args={[0.44, 0.04, 0.003]} />
          <meshStandardMaterial color="#e11d48" roughness={0.5} />
        </mesh>
        {/* Simulated Text Lines */}
        <mesh position={[0, 0.04, 0.008]}>
          <boxGeometry args={[0.4, 0.02, 0.002]} />
          <meshStandardMaterial color="#78716c" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.03, 0.008]}>
          <boxGeometry args={[0.38, 0.02, 0.002]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.09, 0.008]}>
          <boxGeometry args={[0.34, 0.02, 0.002]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.5} />
        </mesh>
        {/* Glowing Push Pin */}
        <mesh position={[0, 0.16, 0.015]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#f43f5e" emissive="#fb7185" emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Notice 2: Mess & Dining Hours (Top-Right) */}
      <group position={[0.38, 0.14, 0.04]} rotation={[0, 0, -0.03]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.48, 0.34, 0.01]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.6} />
        </mesh>
        {/* Dining Header Strip */}
        <mesh position={[0, 0.12, 0.008]}>
          <boxGeometry args={[0.42, 0.04, 0.003]} />
          <meshStandardMaterial color="#0284c7" roughness={0.5} />
        </mesh>
        {/* Text Lines */}
        <mesh position={[0, 0.03, 0.008]}>
          <boxGeometry args={[0.38, 0.02, 0.002]} />
          <meshStandardMaterial color="#64748b" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.04, 0.008]}>
          <boxGeometry args={[0.36, 0.02, 0.002]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.1, 0.008]}>
          <boxGeometry args={[0.32, 0.02, 0.002]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.5} />
        </mesh>
        {/* Cyan Push Pin */}
        <mesh position={[0, 0.15, 0.015]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#06b6d4" emissive="#38bdf8" emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Notice 3: Study Room Guidelines (Bottom-Left) */}
      <group position={[-0.36, -0.26, 0.04]} rotation={[0, 0, -0.02]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.46, 0.3, 0.01]} />
          <meshStandardMaterial color="#f5f3ff" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.1, 0.008]}>
          <boxGeometry args={[0.4, 0.035, 0.003]} />
          <meshStandardMaterial color="#4f46e5" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.02, 0.008]}>
          <boxGeometry args={[0.36, 0.018, 0.002]} />
          <meshStandardMaterial color="#64748b" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.05, 0.008]}>
          <boxGeometry args={[0.34, 0.018, 0.002]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.5} />
        </mesh>
        {/* Violet Push Pin */}
        <mesh position={[0, 0.13, 0.015]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#a78bfa" emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Notice 4: Inter-Wing Badminton Cup (Bottom-Right) */}
      <group position={[0.36, -0.25, 0.04]} rotation={[0, 0, 0.03]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.46, 0.3, 0.01]} />
          <meshStandardMaterial color="#ecfdf5" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.1, 0.008]}>
          <boxGeometry args={[0.4, 0.035, 0.003]} />
          <meshStandardMaterial color="#059669" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.02, 0.008]}>
          <boxGeometry args={[0.36, 0.018, 0.002]} />
          <meshStandardMaterial color="#64748b" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.05, 0.008]}>
          <boxGeometry args={[0.32, 0.018, 0.002]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.5} />
        </mesh>
        {/* Emerald Push Pin */}
        <mesh position={[0, 0.13, 0.015]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#34d399" emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Floating Interactive Hover Tag (visible on hover or highlight) */}
      {(isHovered || isHighlighted) && (
        <group position={[0, 0.68, 0.1]}>
          {/* Tag Pill Base */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.95, 0.18, 0.02]} />
            <meshStandardMaterial
              color="#090d16"
              emissive="#4f46e5"
              emissiveIntensity={0.6}
              roughness={0.2}
              transparent
              opacity={0.92}
            />
          </mesh>
          {/* Glowing Indicator Dot */}
          <mesh position={[-0.38, 0, 0.02]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.5} />
          </mesh>
          {/* Tag Accent Trim */}
          <mesh position={[0, -0.08, 0.015]}>
            <boxGeometry args={[0.88, 0.015, 0.005]} />
            <meshStandardMaterial color="#06b6d4" emissive="#38bdf8" emissiveIntensity={1.2} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default NoticeBoard3D;
