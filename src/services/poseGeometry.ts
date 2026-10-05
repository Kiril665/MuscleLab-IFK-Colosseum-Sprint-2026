export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export const LANDMARKS = {
  NOSE: 0, LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12, LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16, LEFT_HIP: 23, RIGHT_HIP: 24, LEFT_KNEE: 25,
  RIGHT_KNEE: 26, LEFT_ANKLE: 27, RIGHT_ANKLE: 28, LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32
} as const;

export function calculateJointAngle(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle);
}

export function calculateJointAngle3D(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint): number {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (b.z ?? 0) };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const na = Math.hypot(ab.x, ab.y, ab.z);
  const nc = Math.hypot(cb.x, cb.y, cb.z);
  if (na < 1e-6 || nc < 1e-6) return 180;
  return Math.round(Math.acos(Math.max(-1, Math.min(1, dot / (na * nc)))) * 180 / Math.PI);
}

export function calculateDistance(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function calculateDistance3D(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

export function checkBodyAlignment(shoulder: LandmarkPoint, hip: LandmarkPoint, ankle: LandmarkPoint): number {
  return Math.abs(180 - calculateJointAngle3D(shoulder, hip, ankle));
}

export class PointFilterEMA {
  private smoothed: LandmarkPoint[] = [];
  constructor(private alpha = 0.35) {}
  public smooth(points: LandmarkPoint[]): LandmarkPoint[] {
    if (this.smoothed.length !== points.length) {
      this.smoothed = points.map(p => ({ ...p }));
      return this.smoothed;
    }
    this.smoothed = points.map((p, i) => {
      const prev = this.smoothed[i];
      return {
        x: prev.x + this.alpha * (p.x - prev.x),
        y: prev.y + this.alpha * (p.y - prev.y),
        z: (prev.z ?? 0) + this.alpha * ((p.z ?? 0) - (prev.z ?? 0)),
        visibility: p.visibility
      };
    });
    return this.smoothed;
  }
  public reset() { this.smoothed = []; }
}

/** Adaptive One Euro filter. It follows slow motion closely and damps high-frequency jitter. */
export class OneEuroFilter {
  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrev: number | null = null;
  constructor(private minCutoff = 1.2, private beta = 0.035, private dCutoff = 1.0) {}
  private alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / Math.max(dt, 1e-4));
  }
  public filter(x: number, timestampMs: number): number {
    if (this.xPrev === null || this.tPrev === null) {
      this.xPrev = x; this.tPrev = timestampMs; return x;
    }
    const dt = Math.max(0.001, (timestampMs - this.tPrev) / 1000);
    const dx = (x - this.xPrev) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    this.dxPrev = aD * dx + (1 - aD) * this.dxPrev;
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dxPrev);
    const a = this.alpha(cutoff, dt);
    this.xPrev = a * x + (1 - a) * this.xPrev;
    this.tPrev = timestampMs;
    return this.xPrev;
  }
}

export class LandmarkOneEuroFilter {
  private filters = new Map<string, OneEuroFilter>();
  private last: LandmarkPoint[] = [];
  private key(i: number, axis: string) { return `${i}:${axis}`; }
  public smooth(points: LandmarkPoint[], timestampMs: number): LandmarkPoint[] {
    this.last = points.map((p, i) => ({
      x: this.filtersFor(i, 'x').filter(p.x, timestampMs),
      y: this.filtersFor(i, 'y').filter(p.y, timestampMs),
      z: this.filtersFor(i, 'z').filter(p.z ?? 0, timestampMs),
      visibility: p.visibility
    }));
    return this.last;
  }
  private filtersFor(i: number, axis: string) {
    const k = this.key(i, axis);
    let f = this.filters.get(k);
    if (!f) { f = new OneEuroFilter(); this.filters.set(k, f); }
    return f;
  }
  public reset() { this.filters.clear(); this.last = []; }
}
