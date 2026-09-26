import {
  NormalizedSkeleton,
  VerificationFrameResult,
  IExerciseVerifier,
  CameraViewMode,
  mapRepPhaseToUniversalState
} from './poseTypes';
import { extractSkeletonFromMediaPipe } from './mathUtils';
import { PushUpVerifier } from './PushUpVerifier';
import { SquatVerifier } from './SquatVerifier';
import { PullUpVerifier } from './PullUpVerifier';
import { UniversalExerciseRegistry, IUniversalDetector } from './universalExerciseEngine';

class UniversalVerifierAdapter implements IExerciseVerifier {
  public readonly exerciseType: string;
  private detector: IUniversalDetector;

  constructor(detector: IUniversalDetector) {
    this.detector = detector;
    this.exerciseType = detector.exerciseId;
  }

  public reset(): void {
    this.detector.reset();
  }

  public processSkeleton(skeleton: NormalizedSkeleton, timestampMs?: number): VerificationFrameResult {
    const res = this.detector.processFrame(skeleton, timestampMs);
    const isIsometric = this.exerciseType.toLowerCase().includes('plank');
    const metricValue = isIsometric && this.detector.getHoldSeconds ? this.detector.getHoldSeconds() : this.detector.getValidReps();

    return {
      exerciseId: this.detector.exerciseId,
      state: res.state === 'movingDown' ? 'DESCENDING' : res.state === 'bottom' ? 'BOTTOM' : res.state === 'movingUp' ? 'ASCENDING' : res.state === 'completed' ? 'TOP' : 'READY',
      universalState: res.state,
      validReps: metricValue,
      rejectedReps: this.detector.getRejectedReps(),
      lastRejectReason: res.lastRejectReason as any,
      repProgress: res.repProgress,
      leftElbowAngle: res.primaryAngle,
      rightElbowAngle: res.secondaryAngle,
      primaryElbowAngle: res.primaryAngle,
      leftKneeAngle: res.primaryAngle,
      rightKneeAngle: res.secondaryAngle,
      primaryKneeAngle: res.primaryAngle,
      torsoAngle: 5,
      isAlignmentValid: res.isUserInFrame,
      alignmentStatus: res.userFrameMessage,
      confidence: 0.95,
      feedback: res.feedback,
      isRepCompleted: res.state === 'completed' || (isIsometric && metricValue > 0),
      isRepRejected: false
    };
  }

  public getState() {
    const st = this.detector.getState();
    return st === 'movingDown' ? 'DESCENDING' : st === 'bottom' ? 'BOTTOM' : st === 'movingUp' ? 'ASCENDING' : st === 'completed' ? 'TOP' : 'READY';
  }

  public getValidReps(): number {
    return this.detector.getHoldSeconds ? (this.detector.getHoldSeconds() || 0) : this.detector.getValidReps();
  }

  public getRejectedReps(): number {
    return this.detector.getRejectedReps();
  }

  public getLastRejectReason() {
    return this.detector.getLastRejectReason() as any;
  }
}

// Declare MediaPipe Pose global on window
declare global {
  interface Window {
    Pose?: any;
  }
}

export type ExerciseType = 'push_up' | 'squat' | 'pull_up';

export class PoseDetectorService {
  private static instance: PoseDetectorService | null = null;

  private mediaPipePose: any = null;
  private isModelLoaded: boolean = false;
  private isLoading: boolean = false;
  private initPromise: Promise<boolean> | null = null;
  private isProcessingFrame: boolean = false;
  private activeVerifier: IExerciseVerifier;
  private currentExerciseType: ExerciseType = 'push_up';
  private currentViewMode: CameraViewMode = 'side';
  private isCurrentExerciseSupported: boolean = true;
  private lastSkeleton: NormalizedSkeleton | null = null;
  private lastResult: VerificationFrameResult | null = null;

  // Listeners
  private frameListeners: Set<(result: VerificationFrameResult, skeleton: NormalizedSkeleton | null) => void> = new Set();
  private repListeners: Set<(validCount: number) => void> = new Set();
  private rejectListeners: Set<(reason: string) => void> = new Set();

  private constructor() {
    this.activeVerifier = new PushUpVerifier();
  }

  public static getInstance(): PoseDetectorService {
    if (!PoseDetectorService.instance) {
      PoseDetectorService.instance = new PoseDetectorService();
    }
    return PoseDetectorService.instance;
  }

  public setViewMode(mode: CameraViewMode): void {
    this.currentViewMode = mode;
    if (this.currentExerciseType === 'push_up' && this.activeVerifier instanceof PushUpVerifier) {
      this.activeVerifier.setViewMode(mode);
    }
  }

  public getViewMode(): CameraViewMode {
    return this.currentViewMode;
  }

  public isTrackingSupportedForExercise(typeOrId?: string): boolean {
    if (!typeOrId) return this.isCurrentExerciseSupported;
    return UniversalExerciseRegistry.isTrackingSupported(typeOrId);
  }

  public setExercise(type: ExerciseType | string, viewMode?: CameraViewMode): void {
    const isSupported = UniversalExerciseRegistry.isTrackingSupported(type);
    this.isCurrentExerciseSupported = isSupported;

    if (viewMode) {
      this.currentViewMode = viewMode;
    }

    const universalDetector = UniversalExerciseRegistry.getDetector(type);
    if (universalDetector) {
      this.activeVerifier = new UniversalVerifierAdapter(universalDetector);
      this.currentExerciseType = type as any;
    } else {
      // Fallback
      const lower = (type || '').toLowerCase();
      if (lower.includes('squat')) {
        this.activeVerifier = new SquatVerifier();
        this.currentExerciseType = 'squat';
      } else if (lower.includes('pull')) {
        this.activeVerifier = new PullUpVerifier();
        this.currentExerciseType = 'pull_up';
      } else {
        this.activeVerifier = new PushUpVerifier({ viewMode: this.currentViewMode });
        this.currentExerciseType = 'push_up';
      }
    }
  }

  public getIsTrackingSupported(): boolean {
    return this.isCurrentExerciseSupported;
  }

  public getActiveVerifier(): IExerciseVerifier {
    return this.activeVerifier;
  }

  public getExerciseType(): ExerciseType {
    return this.currentExerciseType;
  }

  private lastSendTimestamp: number = 0;

  public isReady(): boolean {
    return this.isModelLoaded && !!this.mediaPipePose;
  }

  public isModelLoading(): boolean {
    return this.isLoading;
  }

  public resetCounters(): void {
    this.activeVerifier.reset();
  }

  /**
   * Asynchronously loads MediaPipe Pose script if not present with robust fallback & timeout
   */
  public async initMediaPipe(): Promise<boolean> {
    if (this.isModelLoaded && this.mediaPipePose) return true;
    if (this.initPromise) return this.initPromise;

    this.isLoading = true;
    this.initPromise = (async () => {
      try {
        if (!window.Pose) {
          // Robust script readiness detection with interval check and timeout
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              if (window.Pose) {
                resolve();
              } else {
                reject(new Error('MediaPipe Pose script load timeout (CDN unavailable)'));
              }
            }, 6000);

            const interval = setInterval(() => {
              if (window.Pose) {
                clearInterval(interval);
                clearTimeout(timeout);
                resolve();
              }
            }, 50);

            const existingScript = document.querySelector('script[src*="@mediapipe/pose"]') as HTMLScriptElement | null;
            if (existingScript) {
              existingScript.addEventListener('load', () => {
                clearInterval(interval);
                clearTimeout(timeout);
                resolve();
              });
              existingScript.addEventListener('error', (e) => {
                clearInterval(interval);
                clearTimeout(timeout);
                reject(e);
              });
              return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
              clearInterval(interval);
              clearTimeout(timeout);
              resolve();
            };
            script.onerror = (err) => {
              clearInterval(interval);
              clearTimeout(timeout);
              reject(err);
            };
            document.head.appendChild(script);
          });
        }

        if (!window.Pose) {
          throw new Error('window.Pose is not available after script load');
        }

        const pose = new window.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (typeof pose.initialize === 'function') {
          try {
            await pose.initialize();
          } catch (initErr) {
            console.warn('pose.initialize note (will initialize on first frame):', initErr);
          }
        }

        pose.onResults((results: any) => {
          this.isProcessingFrame = false;
          if (results && results.poseLandmarks) {
            const skeleton = extractSkeletonFromMediaPipe(results.poseLandmarks);
            if (skeleton) {
              this.handleSkeletonFrame(skeleton, Date.now());
              return;
            }
          }
          this.lastSkeleton = null;
          if (this.lastResult) {
            this.frameListeners.forEach((cb) => cb(this.lastResult!, null));
          }
        });

        this.mediaPipePose = pose;
        this.isModelLoaded = true;
        this.isLoading = false;
        return true;
      } catch (err) {
        console.warn('MediaPipe Pose load warning (will use internal fallback):', err);
        this.isLoading = false;
        this.isProcessingFrame = false;
        this.initPromise = null;
        return false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Sends video frame to MediaPipe Pose with concurrency prevention & watchdog unblock
   */
  public async sendVideoFrame(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.mediaPipePose || !this.isModelLoaded) {
      return;
    }
    if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return;
    }

    const now = Date.now();
    if (this.isProcessingFrame) {
      // Watchdog: If previous frame has been processing for > 600ms, force unblock
      if (now - this.lastSendTimestamp > 600) {
        this.isProcessingFrame = false;
      } else {
        return; // Skip frame if MediaPipe is still analyzing previous frame
      }
    }

    this.isProcessingFrame = true;
    this.lastSendTimestamp = now;

    try {
      await this.mediaPipePose.send({ image: videoElement });
    } catch {
      this.isProcessingFrame = false;
    }
  }

  /**
   * Process skeleton directly (from MediaPipe or fallback simulator)
   */
  public handleSkeletonFrame(skeleton: NormalizedSkeleton, timestampMs?: number): VerificationFrameResult {
    const prevValid = this.activeVerifier.getValidReps();
    const prevRejected = this.activeVerifier.getRejectedReps();

    const isFullBody = skeleton.isFullBodyVisible !== false;

    if (!isFullBody) {
      // Incomplete body framing (e.g. user sitting at desk, camera sees only head/torso)
      // Do NOT trigger rep or reject state machine, keep in POSITIONING
      const result = this.activeVerifier.processSkeleton(skeleton, timestampMs);
      result.isFullBodyVisible = false;
      result.state = 'POSITIONING';
      result.universalState = 'ready';
      result.isRepCompleted = false;
      result.isRepRejected = false;
      result.validReps = prevValid;
      result.rejectedReps = prevRejected;
      result.feedback = '⚠️ Не видно все тіло — відійдіть від камери / покладіть телефон так, щоб було видно від голови до ніг';

      this.lastSkeleton = skeleton;
      this.lastResult = result;
      this.frameListeners.forEach((cb) => cb(result, skeleton));
      return result;
    }

    const result = this.activeVerifier.processSkeleton(skeleton, timestampMs);
    result.isFullBodyVisible = true;
    result.universalState = mapRepPhaseToUniversalState(result.state);

    this.lastSkeleton = skeleton;
    this.lastResult = result;

    if (result.isRepCompleted && result.validReps > prevValid) {
      this.repListeners.forEach((cb) => cb(result.validReps));
    }
    if (result.isRepRejected && result.rejectedReps > prevRejected && result.lastRejectReason) {
      this.rejectListeners.forEach((cb) => cb(result.lastRejectReason!));
    }

    this.frameListeners.forEach((cb) => cb(result, skeleton));
    return result;
  }

  public getLastSkeleton(): NormalizedSkeleton | null {
    return this.lastSkeleton;
  }

  public getLastResult(): VerificationFrameResult | null {
    return this.lastResult;
  }

  // Event Subscription
  public onFrame(cb: (result: VerificationFrameResult, skeleton: NormalizedSkeleton | null) => void): () => void {
    this.frameListeners.add(cb);
    return () => this.frameListeners.delete(cb);
  }

  public onRep(cb: (validCount: number) => void): () => void {
    this.repListeners.add(cb);
    return () => this.repListeners.delete(cb);
  }

  public onReject(cb: (reason: string) => void): () => void {
    this.rejectListeners.add(cb);
    return () => this.rejectListeners.delete(cb);
  }
}

export const poseService = PoseDetectorService.getInstance();
