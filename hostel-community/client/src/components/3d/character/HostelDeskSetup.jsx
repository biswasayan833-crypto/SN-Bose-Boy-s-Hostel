import React from 'react';
import * as THREE from 'three';

/**
 * HostelDeskSetup
 * 
 * Production stylized 3D study desk & workstation for the Prof. S.N. Bose resident:
 * - Sleek modern dark study desk with brushed metallic frame
 * - Coding/community terminal monitor with cyan/violet emissive screen
 * - Open student laptop with backlit keyboard
 * - Curved minimalist desk lamp casting warm study illumination
 * - Hostel textbooks, desk mat, and student coffee tumbler
 */
export function HostelDeskSetup({
  position = [0.2, -0.82, 0.45],
  rotation = [0, -0.08, 0],
  scale = 1.0,
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. STUDY DESK TABLETOP */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.045, 0.62]} />
        <meshStandardMaterial color="#141824" roughness={0.55} metalness={0.15} />
      </mesh>

      {/* Desk Top Bevel Trim / Accent Edge */}
      <mesh position={[0, 0.024, 0.312]}>
        <boxGeometry args={[1.35, 0.008, 0.008]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.4} roughness={0.3} />
      </mesh>

      {/* 2. DESK LEGS & FRAME (Brushed Slate Metal) */}
      {/* Left Leg Assembly */}
      <mesh position={[-0.6, -0.42, 0]} castShadow>
        <boxGeometry args={[0.045, 0.8, 0.54]} />
        <meshStandardMaterial color="#1e2333" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Right Leg Assembly */}
      <mesh position={[0.6, -0.42, 0]} castShadow>
        <boxGeometry args={[0.045, 0.8, 0.54]} />
        <meshStandardMaterial color="#1e2333" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Rear Support Crossbar */}
      <mesh position={[0, -0.3, -0.22]}>
        <boxGeometry args={[1.2, 0.04, 0.03]} />
        <meshStandardMaterial color="#1a1e2d" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 3. WORKSTATION MONITOR (Left side of desk, angled towards student) */}
      <group position={[-0.28, 0.025, -0.06]} rotation={[0, 0.22, 0]}>
        {/* Monitor Stand Base */}
        <mesh position={[0, 0.006, 0]}>
          <boxGeometry args={[0.18, 0.012, 0.14]} />
          <meshStandardMaterial color="#1e2333" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Monitor Vertical Arm */}
        <mesh position={[0, 0.15, -0.04]}>
          <cylinderGeometry args={[0.012, 0.015, 0.28, 12]} />
          <meshStandardMaterial color="#252b3e" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Monitor Chassis Frame */}
        <mesh position={[0, 0.26, 0]} castShadow>
          <boxGeometry args={[0.58, 0.34, 0.022]} />
          <meshStandardMaterial color="#0c0e17" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Glowing Terminal Screen (Displaying Hostel Dev / Community Dashboard) */}
        <mesh position={[0, 0.26, 0.012]}>
          <planeGeometry args={[0.55, 0.31]} />
          <meshStandardMaterial
            color="#070c18"
            emissive="#06b6d4"
            emissiveIntensity={0.65}
            roughness={0.2}
          />
        </mesh>
        {/* Screen Top Status Light */}
        <mesh position={[0, 0.42, 0.012]}>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* 4. STUDENT LAPTOP (Right side of desk, open) */}
      <group position={[0.26, 0.025, 0.08]} rotation={[0, -0.16, 0]}>
        {/* Laptop Base Chassis */}
        <mesh position={[0, 0.006, 0]}>
          <boxGeometry args={[0.32, 0.012, 0.22]} />
          <meshStandardMaterial color="#1a1e2d" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Keyboard Area with Subtle Cyan Backlight */}
        <mesh position={[0, 0.013, 0.02]}>
          <planeGeometry args={[0.28, 0.12]} rotation={[-Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#111522" emissive="#38bdf8" emissiveIntensity={0.45} roughness={0.5} />
        </mesh>
        {/* Laptop Screen Lid (Angled at 115 degrees) */}
        <group position={[0, 0.012, -0.11]} rotation={[-0.42, 0, 0]}>
          <mesh position={[0, 0.11, 0]}>
            <boxGeometry args={[0.32, 0.22, 0.008]} />
            <meshStandardMaterial color="#161a27" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Laptop Screen Display */}
          <mesh position={[0, 0.11, 0.005]}>
            <planeGeometry args={[0.3, 0.2]} />
            <meshStandardMaterial color="#080c18" emissive="#8b5cf6" emissiveIntensity={0.7} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* 5. MINIMALIST LED DESK LAMP */}
      <group position={[0.54, 0.025, -0.16]}>
        {/* Circular Base */}
        <mesh position={[0, 0.008, 0]}>
          <cylinderGeometry args={[0.06, 0.065, 0.016, 16]} />
          <meshStandardMaterial color="#1e2333" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Curved Gooseneck Arm */}
        <mesh position={[-0.04, 0.18, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.008, 0.008, 0.34, 10]} />
          <meshStandardMaterial color="#2d3348" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Lamp Head */}
        <mesh position={[-0.14, 0.32, 0]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.035, 0.05, 0.09, 14]} />
          <meshStandardMaterial color="#1e2333" metalness={0.75} roughness={0.3} />
        </mesh>
        {/* Lamp Light Bulb Glow */}
        <mesh position={[-0.155, 0.29, 0]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.8} />
        </mesh>
        {/* Warm Study Desk Illumination */}
        <pointLight
          position={[-0.18, 0.26, 0.05]}
          color="#fef08a"
          intensity={0.85}
          distance={1.8}
          decay={2}
        />
      </group>

      {/* 6. HOSTEL ACADEMIC PROPS */}
      {/* Desk Mat under center */}
      <mesh position={[0.02, 0.024, 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.82, 0.38]} />
        <meshStandardMaterial color="#0e111a" roughness={0.85} />
      </mesh>

      {/* Stack of Engineering Textbooks (Left rear) */}
      <group position={[-0.52, 0.025, 0.1]}>
        {/* Book 1 (Quantum & Solid State Physics) */}
        <mesh position={[0, 0.016, 0]} rotation={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.18, 0.032, 0.24]} />
          <meshStandardMaterial color="#2563eb" roughness={0.6} />
        </mesh>
        {/* Book 2 (Algorithms & System Design) */}
        <mesh position={[0.005, 0.044, -0.005]} rotation={[0, -0.05, 0]} castShadow>
          <boxGeometry args={[0.17, 0.026, 0.23]} />
          <meshStandardMaterial color="#7c3aed" roughness={0.6} />
        </mesh>
        {/* Book 3 (Hostel Life Notes) */}
        <mesh position={[-0.008, 0.068, 0.008]} rotation={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.16, 0.02, 0.21]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.5} />
        </mesh>
      </group>

      {/* Bose Hostel Resident Ceramic Mug */}
      <group position={[0.48, 0.025, 0.16]}>
        <mesh position={[0, 0.045, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.032, 0.09, 14]} />
          <meshStandardMaterial color="#2e68d9" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Mug Handle */}
        <mesh position={[0.04, 0.045, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.022, 0.006, 8, 12, Math.PI]} />
          <meshStandardMaterial color="#2e68d9" roughness={0.4} />
        </mesh>
        {/* White Rim */}
        <mesh position={[0, 0.091, 0]}>
          <cylinderGeometry args={[0.036, 0.036, 0.004, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

export default HostelDeskSetup;
