import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CHARACTER_ANIMATION_STATES, CharacterState } from './constants';

/**
 * 3D Student Backpack Component
 * Faithfully matches the reference character sheet:
 * - Black tactical/student backpack (#0F0F0F / #111113)
 * - Padded curved shoulder straps draping over shoulders
 * - Multi-compartment pack body with zipper seam details
 * - Cyan neon accent safety strip
 */
function StudentBackpack({ position = [0, 1.08, -0.15], rotation = [0.06, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Main Backpack Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.34, 0.44, 0.18]} />
        <meshStandardMaterial color="#111113" roughness={0.8} metalness={0.08} />
      </mesh>

      {/* Front Accessory Pocket */}
      <mesh position={[0, -0.06, 0.105]}>
        <boxGeometry args={[0.28, 0.24, 0.06]} />
        <meshStandardMaterial color="#16161a" roughness={0.82} metalness={0.05} />
      </mesh>

      {/* Small patch logo on front pocket */}
      <mesh position={[0, -0.06, 0.138]}>
        <boxGeometry args={[0.07, 0.045, 0.008]} />
        <meshStandardMaterial color="#26262b" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Cyan neon safety accent strip */}
      <mesh position={[0, 0.08, 0.095]}>
        <boxGeometry args={[0.24, 0.016, 0.01]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.65} roughness={0.3} />
      </mesh>

      {/* Top Grab Handle */}
      <mesh position={[0, 0.23, -0.02]}>
        <torusGeometry args={[0.055, 0.014, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1c1c20" roughness={0.8} />
      </mesh>

      {/* Left Shoulder Strap (curves over shoulder to chest) */}
      <mesh position={[-0.13, 0.08, 0.05]} rotation={[-0.25, 0, 0.1]}>
        <boxGeometry args={[0.048, 0.32, 0.12]} />
        <meshStandardMaterial color="#18181c" roughness={0.7} />
      </mesh>

      {/* Right Shoulder Strap (curves over shoulder to chest) */}
      <mesh position={[0.13, 0.08, 0.05]} rotation={[-0.25, 0, -0.1]}>
        <boxGeometry args={[0.048, 0.32, 0.12]} />
        <meshStandardMaterial color="#18181c" roughness={0.7} />
      </mesh>

      {/* Side Compression Straps & Buckles */}
      <mesh position={[-0.175, 0, 0]}>
        <boxGeometry args={[0.012, 0.018, 0.12]} />
        <meshStandardMaterial color="#2d2d35" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0.175, 0, 0]}>
        <boxGeometry args={[0.012, 0.018, 0.12]} />
        <meshStandardMaterial color="#2d2d35" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * 3D Draped Hood Collar & Drawstrings
 * Adds sculpted 3D depth to the hoodie around the neck and chest:
 * - Royal Blue collar/hood fold (#2E68D9)
 * - Braided white drawstrings (#F5F5F5) with silver metal aglets
 */
function HoodieCollarAccents({ position = [0, 1.34, 0.02] }) {
  return (
    <group position={position}>
      {/* Draped Hood Collar around neck */}
      <mesh position={[0, 0.01, -0.05]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.14, 0.045, 12, 24]} />
        <meshStandardMaterial color="#2458bf" roughness={0.75} />
      </mesh>

      {/* Left Drawstring */}
      <group position={[-0.045, -0.06, 0.13]}>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.16, 8]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.165, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.018, 8]} />
          <meshStandardMaterial color="#d1d5db" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Right Drawstring */}
      <group position={[0.045, -0.06, 0.13]}>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.16, 8]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.165, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.018, 8]} />
          <meshStandardMaterial color="#d1d5db" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * GLTFCharacterModel
 * 
 * Production humanoid 3D resident avatar loaded from `bose_student.glb`.
 * Controls skeletal bone kinematics and facial blendshapes across all 8 required states:
 * - walking: full bipedal gait with alternating leg/arm swing and hip translation
 * - stop: smooth deceleration settling to natural rest stance
 * - lookVisitor: neck/head orientation + eye tracking towards visitor/camera
 * - wave: raised right arm wave gesture with wrist oscillation and warm smile
 * - idle: organic breathing, weight shift, cursor tracking, and natural blinking
 * - lookAround, point, sitRead: secondary interactive poses
 */
function GLTFCharacterModel({
  modelPath = '/models/bose_student.glb',
  animationState = CharacterState.IDLE,
  enableInteraction = true,
  onAnimationComplete,
  onCharacterClick,
}) {
  const groupRef = useRef();
  const shadowRef = useRef();
  const initialOffsetSetRef = useRef(false);

  // Load production GLB asset
  const { scene } = useGLTF(modelPath);

  // Cache bone nodes and morph targets
  const bonesRef = useRef({});
  const morphsRef = useRef(null);
  const restPoseRef = useRef({});

  useEffect(() => {
    if (!scene) return;

    const bones = {};
    const rest = {};

    scene.traverse((obj) => {
      // SkinnedMesh & Material PBR refinements
      if (obj.isMesh || obj.isSkinnedMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;

        if (obj.morphTargetDictionary && (obj.name === 'Head_Mesh' || obj.name.includes('Head'))) {
          morphsRef.current = obj;
        }

        // Refine PBR materials for realistic stylized look
        if (obj.material) {
          const mat = obj.material;
          mat.roughness = THREE.MathUtils.clamp(mat.roughness ?? 0.6, 0.35, 0.85);
          // Prevent plastic sheen on skin
          if (mat.name === 'Head' || mat.name === 'Body' || mat.name.includes('Skin')) {
            mat.roughness = 0.65;
            mat.metalness = 0.0;
          }
          // Fabric matte finish for hoodie fleece and cargo pants
          if (mat.name.includes('look') || mat.name.includes('Outfit')) {
            mat.roughness = 0.78;
            mat.metalness = 0.02;
            if (mat.normalMap) mat.normalScale.set(0.12, 0.12);
            if (mat.aoMap) mat.aoMapIntensity = 0.25;
          }
          // Hair soft sheen
          if (mat.name.includes('hair')) {
            mat.roughness = 0.48;
            mat.metalness = 0.12;
          }
        }
      }

      // Catalog all humanoid bones
      if (obj.isBone) {
        bones[obj.name] = obj;
        rest[obj.name] = {
          rotation: obj.rotation.clone(),
          position: obj.position.clone(),
        };
      }
    });

    // Immediately initialize arms to natural resting posture at sides
    if (bones.LeftArm && rest.LeftArm) {
      bones.LeftArm.rotation.x = rest.LeftArm.rotation.x + 1.25;
      bones.LeftArm.rotation.z = rest.LeftArm.rotation.z;
    }
    if (bones.RightArm && rest.RightArm) {
      bones.RightArm.rotation.x = rest.RightArm.rotation.x + 1.25;
      bones.RightArm.rotation.z = rest.RightArm.rotation.z;
    }

    bonesRef.current = bones;
    restPoseRef.current = rest;
  }, [scene]);

  // Main Kinematics & Facial Animation Loop
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const pointer = state.pointer;
    const dt = Math.min(delta, 0.08);

    if (!groupRef.current) return;

    // Initial walk offset positioning on mount
    if (!initialOffsetSetRef.current) {
      initialOffsetSetRef.current = true;
      if (animationState === CharacterState.WALKING) {
        groupRef.current.position.set(0.65, -1.2, -1.8);
        groupRef.current.rotation.y = -0.28;
      } else {
        groupRef.current.position.set(0, -1.2, 0);
        groupRef.current.rotation.y = 0;
      }
    }

    // Kinematic target variables for root transform
    let targetX = 0;
    let targetY = -1.2;
    let targetZ = 0;
    let targetBodyRotY = 0;
    let shadowScale = 1.0;

    // Bone rotation offsets
    // LeftArm: +1.25 rad on X lowers the arm straight down to the side
    let leftArmRotX = 1.25;
    let leftArmRotZ = 0;
    let leftForeArmRotZ = 0.1;

    // RightArm: +1.25 rad on X lowers the arm straight down to the side
    let rightArmRotX = 1.25;
    let rightArmRotY = 0;
    let rightArmRotZ = 0;
    let rightForeArmRotZ = -0.1;
    let rightHandRotX = 0;

    let leftUpLegRotX = 0;
    let rightUpLegRotX = 0;
    let leftLegRotX = 0;
    let rightLegRotX = 0;

    let spineRotY = 0;
    let spine1RotX = 0;
    let headRotX = 0;
    let headRotY = 0;
    let headRotZ = 0;
    let neckRotY = 0;

    // Facial morph target values (0 to 1)
    let smileVal = 0.0;
    let browUpVal = 0.0;
    let blinkVal = 0.0;

    // Natural involuntary blink reflex (blink for 0.14s every ~3.5s)
    const blinkCycle = t % 3.6;
    if (blinkCycle < 0.14) {
      blinkVal = Math.sin((blinkCycle / 0.14) * Math.PI);
    }

    switch (animationState) {
      case CharacterState.WALKING: {
        targetX = 0;
        targetZ = 0;
        targetBodyRotY = -0.22;

        const strideFreq = 7.0;
        const stride = Math.sin(t * strideFreq);

        // Bipedal alternating thigh strides
        leftUpLegRotX = -stride * 0.44;
        rightUpLegRotX = stride * 0.44;

        // Knee flexion on rear swing
        leftLegRotX = Math.min(0, -stride * 0.55);
        rightLegRotX = Math.min(0, stride * 0.55);

        // Arm counter-swings along Z axis with natural elbow bend
        leftArmRotX = 1.25;
        leftArmRotZ = -stride * 0.38;
        rightArmRotX = 1.25;
        rightArmRotZ = stride * 0.38;
        leftForeArmRotZ = 0.25;
        rightForeArmRotZ = -0.25;

        // Natural walking vertical bounce and pelvic sway
        targetY = -1.2 + Math.abs(stride) * 0.05;
        shadowScale = 0.88 + Math.abs(stride) * 0.12;
        spineRotY = -stride * 0.08;
        headRotX = 0.04 + Math.sin(t * strideFreq * 2) * 0.02;
        break;
      }

      case CharacterState.STOP: {
        targetX = 0;
        targetZ = 0;
        targetY = -1.2;
        targetBodyRotY = -0.06;

        leftUpLegRotX = 0;
        rightUpLegRotX = 0;
        leftLegRotX = 0;
        rightLegRotX = 0;

        leftArmRotX = 1.25;
        rightArmRotX = 1.25;
        shadowScale = 1.0;
        break;
      }

      case CharacterState.LOOK_VISITOR: {
        targetX = 0;
        targetZ = 0;
        targetY = -1.2 + Math.sin(t * 1.5) * 0.025;
        targetBodyRotY = 0;

        leftArmRotX = 1.25;
        rightArmRotX = 1.25;

        // Head and neck orient smoothly to visitor / camera
        headRotX = -0.04;
        if (enableInteraction && pointer) {
          headRotY = pointer.x * 0.42;
          headRotX = -pointer.y * 0.25 - 0.04;
          neckRotY = pointer.x * 0.2;
        }

        smileVal = 0.38;
        browUpVal = 0.14;
        break;
      }

      case CharacterState.WAVE: {
        targetX = 0;
        targetZ = 0;
        targetY = -1.2 + Math.sin(t * 1.8) * 0.02;
        targetBodyRotY = 0.06;

        // Left arm relaxed at side
        leftArmRotX = 1.25;

        // Right arm raised in friendly college greeting wave
        const waveFreq = 8.5;
        rightArmRotX = -0.45;       // Raise arm up and forward
        rightArmRotZ = -0.35;       // Angle inward towards chest/head
        rightForeArmRotZ = -1.35;   // Elbow bent upwards
        rightHandRotX = Math.sin(t * waveFreq) * 0.42; // Waving hand oscillation

        // Friendly head tilt and warm smile
        headRotZ = Math.sin(t * 3.5) * 0.08;
        headRotX = -0.05;
        if (enableInteraction && pointer) {
          headRotY = pointer.x * 0.28;
        }

        smileVal = 0.72;
        browUpVal = 0.24;
        break;
      }

      case CharacterState.LOOK_AROUND: {
        targetX = 0;
        targetZ = 0;
        targetY = -1.2 + Math.sin(t * 1.5) * 0.025;
        headRotY = Math.sin(t * 1.2) * 0.48;
        headRotX = Math.cos(t * 1.2) * 0.08;
        leftArmRotX = 1.25;
        rightArmRotX = 1.25;
        break;
      }

      case CharacterState.POINT: {
        targetX = 0;
        targetZ = 0;
        targetY = -1.2 + Math.sin(t * 1.5) * 0.025;
        // Right arm points left-forward toward 3D Notice Board
        rightArmRotX = -0.25;
        rightArmRotZ = -0.85;
        rightForeArmRotZ = -0.4;
        headRotY = -0.38;
        headRotX = 0.05;
        leftArmRotX = 1.25;
        break;
      }

      case CharacterState.SIT_READ: {
        targetX = 0;
        targetZ = 0;
        targetY = -1.35;
        headRotX = 0.24;
        leftArmRotX = 0.6;
        rightArmRotX = 0.6;
        break;
      }

      case CharacterState.IDLE:
      default: {
        // Natural organic breathing and subtle weight shift
        targetX = 0;
        targetZ = 0;
        targetY = -1.2 + Math.sin(t * 1.5) * 0.025;

        // Subtle chest expansion with breath
        spine1RotX = Math.sin(t * 1.5) * 0.02;

        leftArmRotX = 1.25;
        leftArmRotZ = 0.0;
        leftForeArmRotZ = 0.05;
        rightArmRotX = 1.25;
        rightArmRotZ = 0.0;
        rightForeArmRotZ = -0.05;

        // Cursor parallax tracking
        if (enableInteraction && pointer) {
          headRotY = pointer.x * 0.45;
          headRotX = -pointer.y * 0.25;
          targetBodyRotY = pointer.x * 0.12;
        } else {
          headRotY = Math.sin(t * 0.8) * 0.06;
        }
        break;
      }
    }

    // 1. Smooth lerping interpolation for root group transform
    const posLerpSpeed = animationState === CharacterState.WALKING ? dt * 1.6 : dt * 3.2;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, posLerpSpeed);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, dt * 6.0);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, posLerpSpeed);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetBodyRotY, dt * 3.5);

    // 2. Smooth articulation across humanoid skeletal bones
    const bones = bonesRef.current;
    const rest = restPoseRef.current;

    // Head & Neck
    if (bones.Head && rest.Head) {
      bones.Head.rotation.x = THREE.MathUtils.lerp(bones.Head.rotation.x, rest.Head.rotation.x + headRotX, dt * 5.0);
      bones.Head.rotation.y = THREE.MathUtils.lerp(bones.Head.rotation.y, rest.Head.rotation.y + headRotY, dt * 5.0);
      bones.Head.rotation.z = THREE.MathUtils.lerp(bones.Head.rotation.z, rest.Head.rotation.z + headRotZ, dt * 5.0);
    }
    if (bones.Neck && rest.Neck) {
      bones.Neck.rotation.y = THREE.MathUtils.lerp(bones.Neck.rotation.y, rest.Neck.rotation.y + neckRotY, dt * 5.0);
    }

    // Spine
    if (bones.Spine && rest.Spine) {
      bones.Spine.rotation.y = THREE.MathUtils.lerp(bones.Spine.rotation.y, rest.Spine.rotation.y + spineRotY, dt * 4.0);
    }
    if (bones.Spine1 && rest.Spine1) {
      bones.Spine1.rotation.x = THREE.MathUtils.lerp(bones.Spine1.rotation.x, rest.Spine1.rotation.x + spine1RotX, dt * 3.5);
    }

    // Arms
    if (bones.LeftArm && rest.LeftArm) {
      bones.LeftArm.rotation.x = THREE.MathUtils.lerp(bones.LeftArm.rotation.x, rest.LeftArm.rotation.x + leftArmRotX, dt * 6.0);
      bones.LeftArm.rotation.z = THREE.MathUtils.lerp(bones.LeftArm.rotation.z, rest.LeftArm.rotation.z + leftArmRotZ, dt * 5.0);
    }
    if (bones.RightArm && rest.RightArm) {
      bones.RightArm.rotation.x = THREE.MathUtils.lerp(bones.RightArm.rotation.x, rest.RightArm.rotation.x + rightArmRotX, dt * 6.0);
      bones.RightArm.rotation.y = THREE.MathUtils.lerp(bones.RightArm.rotation.y, rest.RightArm.rotation.y + rightArmRotY, dt * 6.0);
      bones.RightArm.rotation.z = THREE.MathUtils.lerp(bones.RightArm.rotation.z, rest.RightArm.rotation.z + rightArmRotZ, dt * 6.0);
    }

    // Forearms & Hands
    if (bones.LeftForeArm && rest.LeftForeArm) {
      bones.LeftForeArm.rotation.z = THREE.MathUtils.lerp(bones.LeftForeArm.rotation.z, rest.LeftForeArm.rotation.z + leftForeArmRotZ, dt * 6.0);
    }
    if (bones.RightForeArm && rest.RightForeArm) {
      bones.RightForeArm.rotation.z = THREE.MathUtils.lerp(bones.RightForeArm.rotation.z, rest.RightForeArm.rotation.z + rightForeArmRotZ, dt * 6.0);
    }
    if (bones.RightHand && rest.RightHand) {
      bones.RightHand.rotation.x = THREE.MathUtils.lerp(bones.RightHand.rotation.x, rest.RightHand.rotation.x + rightHandRotX, dt * 8.0);
    }

    // Legs
    if (bones.LeftUpLeg && rest.LeftUpLeg) {
      bones.LeftUpLeg.rotation.x = THREE.MathUtils.lerp(bones.LeftUpLeg.rotation.x, rest.LeftUpLeg.rotation.x + leftUpLegRotX, dt * 7.5);
    }
    if (bones.RightUpLeg && rest.RightUpLeg) {
      bones.RightUpLeg.rotation.x = THREE.MathUtils.lerp(bones.RightUpLeg.rotation.x, rest.RightUpLeg.rotation.x + rightUpLegRotX, dt * 7.5);
    }
    if (bones.LeftLeg && rest.LeftLeg) {
      bones.LeftLeg.rotation.x = THREE.MathUtils.lerp(bones.LeftLeg.rotation.x, rest.LeftLeg.rotation.x + leftLegRotX, dt * 7.5);
    }
    if (bones.RightLeg && rest.RightLeg) {
      bones.RightLeg.rotation.x = THREE.MathUtils.lerp(bones.RightLeg.rotation.x, rest.RightLeg.rotation.x + rightLegRotX, dt * 7.5);
    }

    // 3. Facial Morph Targets Interpolation
    const morphMesh = morphsRef.current;
    if (morphMesh && morphMesh.morphTargetDictionary && morphMesh.morphTargetInfluences) {
      const dict = morphMesh.morphTargetDictionary;
      const inf = morphMesh.morphTargetInfluences;

      const setMorph = (name, targetVal, speed = dt * 8.0) => {
        if (dict[name] !== undefined) {
          const idx = dict[name];
          inf[idx] = THREE.MathUtils.lerp(inf[idx], targetVal, speed);
        }
      };

      setMorph('mouthSmile', smileVal);
      setMorph('mouthSmileLeft', smileVal);
      setMorph('mouthSmileRight', smileVal);
      setMorph('browInnerUp', browUpVal);
      setMorph('eyeBlinkLeft', blinkVal, dt * 18.0);
      setMorph('eyeBlinkRight', blinkVal, dt * 18.0);
      if (smileVal > 0.4) {
        setMorph('eyeSquintLeft', 0.25);
        setMorph('eyeSquintRight', 0.25);
      } else {
        setMorph('eyeSquintLeft', 0);
        setMorph('eyeSquintRight', 0);
      }
    }

    // 4. Ground Shadow scaling
    if (shadowRef.current) {
      shadowRef.current.scale.setScalar(
        THREE.MathUtils.lerp(shadowRef.current.scale.x, shadowScale, dt * 4.0)
      );
    }
  });

  const handlePointerOver = () => {
    if (enableInteraction) {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
  };

  const handleClick = (e) => {
    if (enableInteraction && typeof onCharacterClick === 'function') {
      e.stopPropagation();
      onCharacterClick();
    }
  };

  return (
    <group
      ref={groupRef}
      position={[0, -1.2, 0]}
      dispose={null}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Production Humanoid Character Model */}
      <primitive object={scene} />

      {/* 3D Student Backpack Accessory on Character's Back */}
      <StudentBackpack position={[0, 1.12, -0.15]} />

      {/* 3D Draped Hood Collar & Drawstrings */}
      <HoodieCollarAccents position={[0, 1.34, 0.02]} />

      {/* Soft Ground Contact Shadow Disc */}
      <mesh ref={shadowRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/**
 * ModelErrorBoundary
 * Gracefully falls back to procedural student avatar if GLB loading fails.
 */
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('[StudentCharacter] Failed to load GLB model:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * ProceduralStudentAvatar
 * Fallback procedural avatar if WebGL or GLB asset cannot be loaded.
 */
function ProceduralStudentAvatar({
  animationState = CharacterState.IDLE,
  enableInteraction = true,
  onCharacterClick,
}) {
  const groupRef = useRef();

  const handlePointerOver = () => {
    if (enableInteraction) document.body.style.cursor = 'pointer';
  };
  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
  };
  const handleClick = (e) => {
    if (enableInteraction && typeof onCharacterClick === 'function') {
      e.stopPropagation();
      onCharacterClick();
    }
  };

  return (
    <group
      ref={groupRef}
      position={[0, -1.2, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Stylized Humanoid Fallback Meshes */}
      <mesh position={[0, 1.5, 0]}>
        <capsuleGeometry args={[0.32, 0.75, 16, 24]} />
        <meshStandardMaterial color="#2e68d9" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#c48c66" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.24, 0.22, 0.9, 16]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * StudentCharacter
 * 
 * Orchestrates the production 3D Bose Hostel Resident character.
 * Uses high-fidelity GLTF humanoid model `/models/bose_student.glb` with full kinematics,
 * falling back gracefully if necessary.
 */
export const StudentCharacter = ({
  modelPath = '/models/bose_student.glb',
  animationState = CharacterState.IDLE,
  onAnimationComplete,
  onCharacterClick,
  enableInteraction = true,
  scale = 1.0,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const [hasGLB, setHasGLB] = useState(true);

  // Verify GLB availability
  useEffect(() => {
    let isMounted = true;
    const checkModel = async () => {
      try {
        const res = await fetch(modelPath, { method: 'HEAD' });
        if (isMounted) {
          const contentType = res.headers.get('content-type') || '';
          const isRealAsset = res.ok && !contentType.includes('text/html');
          setHasGLB(isRealAsset);
        }
      } catch {
        if (isMounted) setHasGLB(false);
      }
    };
    checkModel();
    return () => {
      isMounted = false;
    };
  }, [modelPath]);

  return (
    <group scale={scale} position={position} rotation={rotation}>
      {hasGLB ? (
        <ModelErrorBoundary
          fallback={
            <ProceduralStudentAvatar
              animationState={animationState}
              enableInteraction={enableInteraction}
              onCharacterClick={onCharacterClick}
            />
          }
        >
          <GLTFCharacterModel
            modelPath={modelPath}
            animationState={animationState}
            onAnimationComplete={onAnimationComplete}
            enableInteraction={enableInteraction}
            onCharacterClick={onCharacterClick}
          />
        </ModelErrorBoundary>
      ) : (
        <ProceduralStudentAvatar
          animationState={animationState}
          enableInteraction={enableInteraction}
          onCharacterClick={onCharacterClick}
        />
      )}
    </group>
  );
};

// Preload production asset for instant rendering
useGLTF.preload('/models/bose_student.glb');

export default StudentCharacter;
