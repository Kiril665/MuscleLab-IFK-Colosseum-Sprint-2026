import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Camera, 
  Mic, 
  Check, 
  ShieldCheck,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { onboardingStore, ONBOARDING_STEPS } from '../../services/onboardingStore';
import { mediaSettingsStore } from '../../services/mediaSettingsStore';
import { useI18n } from '../../services/i18n';
import { Button } from '../../ui/Button';

export const OnboardingTour: React.FC = () => {
  const { t } = useI18n();
  const [tourState, setTourState] = useState(onboardingStore.getState());
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [camAllowed, setCamAllowed] = useState(mediaSettingsStore.cameraPermission === 'granted');
  const [micAllowed, setMicAllowed] = useState(mediaSettingsStore.micPermission === 'granted');

  useEffect(() => {
    const unsubOnboarding = onboardingStore.subscribe(() => {
      setTourState(onboardingStore.getState());
    });
    const unsubMedia = mediaSettingsStore.subscribe(() => {
      setCamAllowed(mediaSettingsStore.cameraPermission === 'granted');
      setMicAllowed(mediaSettingsStore.micPermission === 'granted');
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!onboardingStore.getState().isActive) return;
      if (e.key === 'Escape') {
        onboardingStore.skipTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        onboardingStore.nextStep();
      } else if (e.key === 'ArrowLeft') {
        onboardingStore.prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubOnboarding();
      unsubMedia();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update spotlight rect when step changes or resize occurs
  useEffect(() => {
    if (!tourState.isActive) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      if (tourState.targetSelector) {
        const el = document.querySelector(tourState.targetSelector);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          return;
        }
      }
      setTargetRect(null);
    };

    const timer = setTimeout(updateRect, 150);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [tourState.isActive, tourState.currentStep, tourState.targetSelector]);

  if (!tourState.isActive) return null;

  const stepConfig = ONBOARDING_STEPS[tourState.currentStep - 1] || ONBOARDING_STEPS[0];
  const title = (t.onboarding as any)[stepConfig.titleKey] || stepConfig.titleKey;
  const desc = (t.onboarding as any)[stepConfig.descKey] || stepConfig.descKey;
  const isFirst = tourState.currentStep === 1;
  const isLast = tourState.currentStep === tourState.totalSteps;

  const handleAllowCamera = async () => {
    const ok = await mediaSettingsStore.requestCameraPermission();
    setCamAllowed(ok);
  };

  const handleAllowMic = async () => {
    const ok = await mediaSettingsStore.requestMicPermission();
    setMicAllowed(ok);
  };

  // Calculate tooltip placement
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 selection:bg-[var(--accent)] selection:text-white"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* 1. Backdrop Overlay */}
      <div 
        onClick={() => onboardingStore.skipTour()}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* 2. Spotlight Cutout / Glow around target element if found */}
      {targetRect && (
        <div
          className="absolute border-2 border-[var(--accent)] rounded-2xl pointer-events-none transition-all duration-300 shadow-[0_0_40px_rgba(255,77,0,0.5)] bg-white/5 animate-pulse"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`
          }}
        />
      )}

      {/* 3. Interactive Tooltip Card */}
      <div className={`relative z-10 w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--border-strong)] p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 ${
        isMobile ? 'my-auto' : ''
      }`}>
        {/* Header with Step indicator and Skip button */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping" />
            <span className="font-heading font-black text-xs uppercase tracking-wider text-[var(--accent)]">
              {t.onboarding.stepOf
                .replace('{step}', String(tourState.currentStep))
                .replace('{total}', String(tourState.totalSteps))}
            </span>
          </div>

          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === tourState.currentStep - 1
                    ? 'w-6 bg-[var(--accent)]'
                    : idx < tourState.currentStep - 1
                    ? 'w-1.5 bg-emerald-400'
                    : 'w-1.5 bg-[var(--border-subtle)]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => onboardingStore.skipTour()}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer flex items-center gap-1"
            aria-label={t.onboarding.skip}
          >
            <span>{t.onboarding.skip}</span>
            <X size={14} />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-3 mb-6">
          <h2 className="font-heading font-black text-xl sm:text-2xl text-[var(--text-primary)] tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {desc}
          </p>

          {/* Permission Step Interactive Buttons */}
          {stepConfig.isPermissionStep && (
            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3 mt-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  size="sm"
                  variant={camAllowed ? 'outline' : 'primary'}
                  fullWidth
                  onClick={handleAllowCamera}
                  className="flex items-center justify-center gap-2 font-bold"
                >
                  <Camera size={16} />
                  <span>{camAllowed ? t.onboarding.cameraAllowed : t.onboarding.allowCamera}</span>
                </Button>

                <Button
                  size="sm"
                  variant={micAllowed ? 'outline' : 'primary'}
                  fullWidth
                  onClick={handleAllowMic}
                  className="flex items-center justify-center gap-2 font-bold"
                >
                  <Mic size={16} />
                  <span>{micAllowed ? t.onboarding.micAllowed : t.onboarding.allowMic}</span>
                </Button>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 justify-center">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>Дозволи можна будь-коли змінити в Налаштуваннях</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {!isFirst ? (
            <Button
              variant="outline"
              size="md"
              onClick={() => onboardingStore.prevStep()}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft size={16} />
              <span>{t.onboarding.prev}</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => onboardingStore.nextStep()}
            className="flex items-center gap-2 font-bold px-6 shadow-lg shadow-[var(--accent)]/20"
          >
            <span>{isLast ? t.onboarding.finish : t.onboarding.next}</span>
            {isLast ? <Check size={16} /> : <ArrowRight size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
};
