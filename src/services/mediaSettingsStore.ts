/**
 * ForgeMuscle Centralized Media Settings Store
 * Manages audio/video devices, permissions, testing, push-to-talk, and camera configurations.
 */

import { storageManager } from './storageManager';
import { authStore } from './authStore';

export interface MediaSettingsState {
  micEnabled: boolean;
  selectedMicId: string;
  pushToTalk: boolean;
  cameraEnabled: boolean;
  selectedCameraId: string;
  facingMode: 'user' | 'environment';
  showSkeleton: boolean;
  mirrorVideo: boolean;
}

const DEFAULT_MEDIA_SETTINGS: MediaSettingsState = {
  micEnabled: true,
  selectedMicId: '',
  pushToTalk: false,
  cameraEnabled: true,
  selectedCameraId: '',
  facingMode: 'user',
  showSkeleton: true,
  mirrorVideo: true
};

class MediaSettingsStore {
  private settings: MediaSettingsState;
  private listeners: Set<() => void> = new Set();
  public availableMics: MediaDeviceInfo[] = [];
  public availableCameras: MediaDeviceInfo[] = [];
  public micPermission: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown';
  public cameraPermission: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown';

  // Mic test state
  private testAudioContext: AudioContext | null = null;
  private testMediaStream: MediaStream | null = null;
  private testAnalyser: AnalyserNode | null = null;
  private testAnimFrame: number | null = null;
  public audioLevel: number = 0; // 0 to 100
  public isTestingMic: boolean = false;

  constructor() {
    this.settings = this.load();
    if (typeof window !== 'undefined') {
      this.checkPermissions();
      this.refreshDevices();
      if (navigator.mediaDevices?.addEventListener) {
        navigator.mediaDevices.addEventListener('devicechange', () => {
          this.refreshDevices();
        });
      }
    }
  }

  private load(): MediaSettingsState {
    try {
      const saved = storageManager.getSlice<MediaSettingsState>('mediaSettings');
      if (saved) {
        return { ...DEFAULT_MEDIA_SETTINGS, ...saved };
      }
    } catch {}
    return { ...DEFAULT_MEDIA_SETTINGS };
  }

  private save() {
    try {
      storageManager.setSlice('mediaSettings', this.settings);
      // Also sync to authStore user settings
      authStore.updateSettings({
        micEnabled: this.settings.micEnabled,
        selectedMicId: this.settings.selectedMicId,
        pushToTalk: this.settings.pushToTalk,
        cameraEnabled: this.settings.cameraEnabled,
        selectedCameraId: this.settings.selectedCameraId,
        facingMode: this.settings.facingMode,
        showSkeleton: this.settings.showSkeleton,
        mirrorVideo: this.settings.mirrorVideo
      });
    } catch {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSettings(): MediaSettingsState {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<MediaSettingsState>) {
    this.settings = { ...this.settings, ...partial };
    this.save();
  }

  public async checkPermissions() {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;
    try {
      // @ts-ignore
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      this.micPermission = micStatus.state as any;
      micStatus.onchange = () => {
        this.micPermission = micStatus.state as any;
        this.notify();
      };
    } catch {
      this.micPermission = 'unknown';
    }

    try {
      // @ts-ignore
      const camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      this.cameraPermission = camStatus.state as any;
      camStatus.onchange = () => {
        this.cameraPermission = camStatus.state as any;
        this.notify();
      };
    } catch {
      this.cameraPermission = 'unknown';
    }
    this.notify();
  }

  public async refreshDevices() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableMics = devices.filter((d) => d.kind === 'audioinput');
      this.availableCameras = devices.filter((d) => d.kind === 'videoinput');
      this.notify();
    } catch {}
  }

  public async requestMicPermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      this.micPermission = 'granted';
      await this.refreshDevices();
      this.notify();
      return true;
    } catch (err) {
      this.micPermission = 'denied';
      this.notify();
      return false;
    }
  }

  public async requestCameraPermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      this.cameraPermission = 'granted';
      await this.refreshDevices();
      this.notify();
      return true;
    } catch (err) {
      this.cameraPermission = 'denied';
      this.notify();
      return false;
    }
  }

  // Live microphone level test for Settings
  public async startMicTest(): Promise<void> {
    this.stopMicTest();
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      const constraints: MediaStreamConstraints = {
        audio: this.settings.selectedMicId ? { deviceId: { exact: this.settings.selectedMicId } } : true
      };
      this.testMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.testAudioContext = new AudioCtx();
      if (this.testAudioContext.state === 'suspended') {
        await this.testAudioContext.resume();
      }

      const source = this.testAudioContext.createMediaStreamSource(this.testMediaStream);
      this.testAnalyser = this.testAudioContext.createAnalyser();
      this.testAnalyser.fftSize = 256;
      source.connect(this.testAnalyser);

      this.isTestingMic = true;
      const dataArray = new Uint8Array(this.testAnalyser.frequencyBinCount);

      const updateLevel = () => {
        if (!this.testAnalyser || !this.isTestingMic) return;
        this.testAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Map 0-255 to 0-100 with sensitivity multiplier
        this.audioLevel = Math.min(100, Math.round((avg / 128) * 100));
        this.notify();
        this.testAnimFrame = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch {
      this.stopMicTest();
    }
  }

  public stopMicTest(): void {
    this.isTestingMic = false;
    this.audioLevel = 0;
    if (this.testAnimFrame) {
      cancelAnimationFrame(this.testAnimFrame);
      this.testAnimFrame = null;
    }
    if (this.testMediaStream) {
      this.testMediaStream.getTracks().forEach((t) => t.stop());
      this.testMediaStream = null;
    }
    if (this.testAudioContext) {
      this.testAudioContext.close().catch(() => {});
      this.testAudioContext = null;
    }
    this.notify();
  }
}

export const mediaSettingsStore = new MediaSettingsStore();
