/**
 * Standard animation states required by the 3D Bose Hostel Resident specification:
 */
export const CHARACTER_ANIMATION_STATES = [
  'idle',
  'walking',
  'stop',
  'lookVisitor',
  'wave',
  'lookAround',
  'point',
  'sitRead',
];

export const CharacterState = {
  IDLE: 'idle',
  WALKING: 'walking',
  STOP: 'stop',
  LOOK_VISITOR: 'lookVisitor',
  WAVE: 'wave',
  LOOK_AROUND: 'lookAround',
  POINT: 'point',
  SIT_READ: 'sitRead',
};

/**
 * Cinematic timing configuration (in seconds) for the introductory greeting sequence.
 * 0.0s → character appears & walks
 * 0.0–2.5s → walking
 * 2.5–3.0s → stop
 * 3.0–3.8s → look visitor / camera
 * 3.8–5.0s → wave
 * 5.0s+ → idle
 */
export const DEFAULT_SEQUENCE_TIMING = {
  walking: 2.5,
  stop: 0.5,
  lookVisitor: 0.8,
  wave: 1.2,
};

