
// Refractive indices for water roughly
export const REFRACTIVE_INDEX_AIR = 1.0003;
export const REFRACTIVE_INDEX_RED = 1.331;
export const REFRACTIVE_INDEX_GREEN = 1.335;
export const REFRACTIVE_INDEX_VIOLET = 1.343;

export interface Point {
  x: number;
  y: number;
}

export interface RayPath {
  start: Point;
  entry: Point;
  back: Point;
  back2?: Point; // Added for Secondary Rainbow
  exit: Point;
  end: Point;
  color: string;
}

/**
 * Calculates the path of a light ray through a spherical drop (Primary Rainbow)
 */
export const calculateRayPath = (
  yOffset: number,
  radius: number,
  n2: number,
  color: string,
  centerX: number,
  centerY: number
): RayPath => {
  // 1. Start point (far left)
  const start: Point = { x: 0, y: centerY - yOffset };

  // 2. Entry point
  const h = yOffset; 
  const xIn = -Math.sqrt(radius * radius - h * h);
  const entry: Point = {
    x: centerX + xIn,
    y: centerY - h,
  };

  // Angles
  const alpha = Math.asin(h / radius);
  const beta = Math.asin((REFRACTIVE_INDEX_AIR / n2) * Math.sin(alpha));

  // 3. Back reflection point
  const thetaEntry = Math.atan2(entry.y - centerY, entry.x - centerX);
  const thetaBack = thetaEntry + (Math.PI - 2 * beta);
  
  const back: Point = {
    x: centerX + radius * Math.cos(thetaBack),
    y: centerY + radius * Math.sin(thetaBack), 
  };

  // 4. Exit point
  const thetaExit = thetaBack + (Math.PI - 2 * beta);
  const exit: Point = {
    x: centerX + radius * Math.cos(thetaExit),
    y: centerY + radius * Math.sin(thetaExit),
  };

  // 5. End point (ray leaving)
  const exitAngle = Math.PI + (4 * beta - 2 * alpha);
  
  // Reduced length to keep on screen
  const rayLength = 220; 
  const end: Point = {
    x: exit.x + rayLength * Math.cos(exitAngle),
    y: exit.y + rayLength * Math.sin(exitAngle),
  };

  return { start, entry, back, exit, end, color };
};

/**
 * Calculates the path for Secondary Rainbow (Double Reflection)
 */
export const calculateDoubleReflectionRayPath = (
  yOffset: number,
  radius: number,
  n2: number,
  color: string,
  centerX: number,
  centerY: number
): RayPath => {
  // For secondary rainbow, light typically enters the bottom half to exit towards observer
  // 1. Start point (far left, bottom)
  const start: Point = { x: 0, y: centerY + yOffset };

  // 2. Entry point (Bottom-Left)
  const h = yOffset;
  const xIn = -Math.sqrt(radius * radius - h * h);
  const entry: Point = {
    x: centerX + xIn,
    y: centerY + h,
  };

  const alpha = Math.asin(h / radius);
  const beta = Math.asin((REFRACTIVE_INDEX_AIR / n2) * Math.sin(alpha));

  // Polar Angle logic
  const thetaEntry = Math.atan2(entry.y - centerY, entry.x - centerX);

  const angleStep = Math.PI - 2 * beta;
  
  // 3. Back 1 (Top-Rightish)
  const thetaBack1 = thetaEntry - angleStep;
  const back1: Point = {
    x: centerX + radius * Math.cos(thetaBack1),
    y: centerY + radius * Math.sin(thetaBack1),
  };

  // 4. Back 2 (Top-Leftish/Top)
  const thetaBack2 = thetaBack1 - angleStep;
  const back2: Point = {
    x: centerX + radius * Math.cos(thetaBack2),
    y: centerY + radius * Math.sin(thetaBack2),
  };

  // 5. Exit (Front-Top)
  const thetaExit = thetaBack2 - angleStep;
  const exit: Point = {
    x: centerX + radius * Math.cos(thetaExit),
    y: centerY + radius * Math.sin(thetaExit),
  };

  // 6. End
  const exitAngle = 6 * beta - 2 * alpha;

  // Reduced length to keep on screen
  const rayLength = 220;
  const end: Point = {
    x: exit.x + rayLength * Math.cos(exitAngle), 
    y: exit.y + rayLength * Math.sin(exitAngle),
  };

  return { start, entry, back: back1, back2, exit, end, color };
};
