/**
 * Coach Arno Voice Synthesis Service
 * Uses Web Speech API with native Ukrainian language support (uk-UA),
 * natural athletic persona settings, anti-freeze keepalive, and sound engine integration.
 */

import { sound } from './soundEngine';

export interface ArnoVoiceListener {
  (speaking: boolean, text: string): void;
}

export interface ArnoVoiceSettings {
  enabled: boolean;
  voiceUri: string;
  pitch: number;
  rate: number;
  volume: number;
  coachName: 'arno' | 'arthur';
}

class ArnoVoiceEngine {
  private isEnabled: boolean = true;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<ArnoVoiceListener> = new Set();
  private availableVoices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded: boolean = false;
  private keepAliveTimer: number | null = null;
  private failsafeTimer: number | null = null;
  private isCurrentlySpeaking: boolean = false;
  private coachName: 'arno' | 'arthur' = 'arno';

  // Athletic coach persona voice parameters
  private pitch: number = 0.98; // Natural deep masculine coach tone
  private rate: number = 1.02; // Confident athletic tempo
  private volume: number = 1.0;
  private preferredVoiceUri: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedEnabled = localStorage.getItem('forgemuscle_arno_voice_enabled');
        if (savedEnabled !== null) {
          this.isEnabled = savedEnabled === 'true';
        }

        const savedCoach = localStorage.getItem('forgemuscle_coach_name');
        if (savedCoach === 'arthur' || savedCoach === 'arno') {
          this.coachName = savedCoach;
        }

        const savedVoiceUri = localStorage.getItem('forgemuscle_arno_voice_uri');
        if (savedVoiceUri) {
          this.preferredVoiceUri = savedVoiceUri;
        }

        const savedPitch = localStorage.getItem('forgemuscle_arno_voice_pitch');
        if (savedPitch) {
          this.pitch = parseFloat(savedPitch) || 0.98;
        }

        const savedRate = localStorage.getItem('forgemuscle_arno_voice_rate');
        if (savedRate) {
          this.rate = parseFloat(savedRate) || 1.02;
        }

        const savedVolume = localStorage.getItem('forgemuscle_arno_voice_volume');
        if (savedVolume) {
          this.volume = parseFloat(savedVolume) || 1.0;
        }
      } catch {
        // localStorage might fail in private browsing
      }

      // Auto-unlock SpeechSynthesis and AudioContext on user interaction
      const unlockAudio = () => {
        try {
          this.unlock();
          if (sound && typeof sound.init === 'function') {
            sound.init();
          }
        } catch {
          // ignore
        }
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });

      if ('speechSynthesis' in window) {
        this.loadVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  /**
   * Loads installed system voices and matches Ukrainian voices
   */
  public loadVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }

    try {
      const voices = window.speechSynthesis.getVoices() || [];
      this.availableVoices = voices;

      if (voices.length > 0) {
        this.voicesLoaded = true;

        // If user saved a preference, try finding it
        if (this.preferredVoiceUri) {
          const matchedSaved = voices.find((v) => v.voiceURI === this.preferredVoiceUri);
          if (matchedSaved) {
            this.selectedVoice = matchedSaved;
            return voices;
          }
        }

        // Priority 1: Match Ukrainian voice by language code (uk, uk-UA, uk_UA)
        const ukrainianVoice = voices.find((v) => {
          const l = v.lang.toLowerCase().replace('_', '-');
          return l.startsWith('uk');
        });

        // Priority 2: Match Ukrainian name in voice title
        const ukrainianNamedVoice = voices.find((v) => {
          const n = v.name.toLowerCase();
          return (
            n.includes('ukrainian') ||
            n.includes('україн') ||
            n.includes('lesya') ||
            n.includes('polina') ||
            n.includes('taras') ||
            n.includes('ostap')
          );
        });

        // Priority 3: Natural / neural voice fallback
        const naturalVoice = voices.find(
          (v) =>
            (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online')) &&
            !v.lang.startsWith('zh') &&
            !v.lang.startsWith('ja')
        );

        // Priority 4: Default or first available voice
        this.selectedVoice =
          ukrainianVoice ||
          ukrainianNamedVoice ||
          voices.find((v) => v.default) ||
          naturalVoice ||
          voices[0] ||
          null;
      }
      return voices;
    } catch (err) {
      console.warn('Error loading voices:', err);
      return [];
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0) {
      this.loadVoices();
    }
    return this.availableVoices;
  }

  public getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  public setSelectedVoice(voiceUri: string) {
    this.preferredVoiceUri = voiceUri;
    try {
      localStorage.setItem('forgemuscle_arno_voice_uri', voiceUri);
    } catch {
      // ignore
    }
    const match = this.availableVoices.find((v) => v.voiceURI === voiceUri);
    if (match) {
      this.selectedVoice = match;
    }
  }

  public getVoiceSettings(): ArnoVoiceSettings {
    return {
      enabled: this.isEnabled,
      voiceUri: this.selectedVoice?.voiceURI || this.preferredVoiceUri,
      pitch: this.pitch,
      rate: this.rate,
      volume: this.volume,
      coachName: this.coachName
    };
  }

  public getCoachName(): 'arno' | 'arthur' {
    return this.coachName;
  }

  public getCoachDisplayName(): string {
    return this.coachName === 'arthur' ? 'Артур' : 'Арно';
  }

  public setCoachName(name: 'arno' | 'arthur') {
    this.coachName = name;
    try {
      localStorage.setItem('forgemuscle_coach_name', name);
    } catch {
      // ignore
    }
  }

  public setVoiceSettings(settings: Partial<ArnoVoiceSettings>) {
    if (settings.enabled !== undefined) {
      this.isEnabled = settings.enabled;
      try {
        localStorage.setItem('forgemuscle_arno_voice_enabled', String(this.isEnabled));
      } catch {
        // ignore
      }
      if (!this.isEnabled) this.stop();
    }
    if (settings.coachName !== undefined) {
      this.setCoachName(settings.coachName);
    }
    if (settings.voiceUri !== undefined) {
      this.setSelectedVoice(settings.voiceUri);
    }
    if (settings.pitch !== undefined) {
      this.pitch = settings.pitch;
      try {
        localStorage.setItem('forgemuscle_arno_voice_pitch', String(this.pitch));
      } catch {
        // ignore
      }
    }
    if (settings.rate !== undefined) {
      this.rate = settings.rate;
      try {
        localStorage.setItem('forgemuscle_arno_voice_rate', String(this.rate));
      } catch {
        // ignore
      }
    }
    if (settings.volume !== undefined) {
      this.volume = settings.volume;
      try {
        localStorage.setItem('forgemuscle_arno_voice_volume', String(this.volume));
      } catch {
        // ignore
      }
    }
  }

  public subscribe(listener: ArnoVoiceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(speaking: boolean, text: string) {
    this.isCurrentlySpeaking = speaking;
    this.listeners.forEach((fn) => {
      try {
        fn(speaking, text);
      } catch (err) {
        console.error('Arno voice listener error:', err);
      }
    });
  }

  public toggleVoice(): boolean {
    this.isEnabled = !this.isEnabled;
    try {
      localStorage.setItem('forgemuscle_arno_voice_enabled', String(this.isEnabled));
    } catch {
      // ignore
    }
    if (!this.isEnabled) {
      this.stop();
    }
    return this.isEnabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public stop() {
    this.clearTimers();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.notify(false, '');
  }

  private clearTimers() {
    if (this.keepAliveTimer !== null) {
      window.clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.failsafeTimer !== null) {
      window.clearTimeout(this.failsafeTimer);
      this.failsafeTimer = null;
    }
  }

  /**
   * Sanitizes speech text:
   * Strips emojis, hashtags, markdown formatting, asterisk emphasis so the TTS engine
   * pronounces only clean Ukrainian words without stuttering or reading symbol names.
   */
  private cleanTextForSpeech(text: string): string {
    return text
      .replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{27BF}]/gu, '') // Emojis
      .replace(/[*_~`#|>[\]()]/g, ' ') // Markdown symbols
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Unlock speech synthesis and audio context on user interaction
   */
  public unlock() {
    if (typeof window !== 'undefined') {
      try {
        sound.init();
        if ('speechSynthesis' in window && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }
    }
  }

  /**
   * Speak arbitrary text with Coach Arno / Arthur persona
   * Always plays coach vocalized audio cue + dispatches robust speech utterance
   */
  public speak(
    text: string,
    options?: { pitch?: number; rate?: number; force?: boolean; volume?: number }
  ) {
    if (!this.isEnabled && !options?.force) {
      return;
    }

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) return;

    // 1. Play musical coach acoustic signature motif immediately (guaranteed audible feedback!)
    try {
      sound.playCoachVocalCue();
    } catch {
      // ignore
    }

    // 2. Notify on-screen visual subtitles and animated coach bubbles
    this.notify(true, cleanText);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    // Ensure voices are freshly inspected
    if (!this.voicesLoaded || !this.selectedVoice) {
      this.loadVoices();
    }

    try {
      this.stop();

      // Small delay prevents Chromium cancel-drop race condition
      window.setTimeout(() => {
        try {
          if (!('speechSynthesis' in window)) return;

          // Resume synthesis engine if suspended
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          const utterance = new SpeechSynthesisUtterance(cleanText);

          // Smart voice & language pairing:
          if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
            const lang = this.selectedVoice.lang.toLowerCase();
            if (lang.startsWith('uk') || lang.startsWith('ru') || lang.startsWith('pl') || lang.startsWith('cs')) {
              utterance.lang = this.selectedVoice.lang;
            } else {
              // If only English/default voice is installed, match voice's lang so Chrome doesn't error out
              utterance.lang = this.selectedVoice.lang || 'en-US';
            }
          } else {
            utterance.lang = 'uk-UA';
          }

          utterance.pitch = options?.pitch ?? this.pitch;
          utterance.rate = options?.rate ?? this.rate;
          utterance.volume = options?.volume ?? this.volume;

          utterance.onstart = () => {
            this.notify(true, cleanText);
          };

          utterance.onend = () => {
            this.clearTimers();
            this.notify(false, cleanText);
          };

          utterance.onerror = (e) => {
            this.clearTimers();
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
              console.warn('SpeechSynthesis utterance error:', e.error);
            }
            this.notify(false, cleanText);
          };

          this.currentUtterance = utterance;

          // KeepAlive anti-freeze for Chromium
          this.keepAliveTimer = window.setInterval(() => {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }
          }, 4500);

          // Failsafe safety timeout in case onend never fires
          const maxDuration = Math.max(3000, cleanText.length * 160 + 2500);
          this.failsafeTimer = window.setTimeout(() => {
            if (this.isCurrentlySpeaking) {
              this.stop();
            }
          }, maxDuration);

          window.speechSynthesis.speak(utterance);
        } catch (innerErr) {
          console.warn('SpeechSynthesis speak execution error:', innerErr);
        }
      }, 35);
    } catch (err) {
      console.warn('Speech synthesis speak failure:', err);
    }
  }

  /**
   * Test current voice settings
   */
  public testVoice(phrase?: string) {
    const coachName = this.getCoachDisplayName();
    const sample =
      phrase ||
      `Увага! Працює голос тренера ${coachName}. Якість звуку відмінна, техніка понад усе! Залізо чекає!`;
    this.speak(sample, { force: true });
  }

  // --- Contextual Coach Voice Actions (Arno / Arthur) ---

  public speakGreeting() {
    const coach = this.getCoachDisplayName();
    const greetings = [
      `Вітаю в Кузні Мʼязів! Я ${coach}, твій наставник. Обирай вправу та до діла!`,
      `Здоров був! ${coach} на зв'язку. Залізо чекає, покажемо залізний характер!`,
      `Готовий гартувати тіло? Тренер ${coach} допоможе викувати справжню міць!`
    ];
    const text = greetings[Math.floor(Math.random() * greetings.length)];
    this.speak(text);
    return text;
  }

  public speakWorkoutStart(exerciseName: string) {
    const coach = this.getCoachDisplayName();
    const phrases = [
      `Почали вправу: ${exerciseName}! Спина рівна, повна концентрація!`,
      `Увага на техніку! ${exerciseName}. ${coach} пильно рахує кожне повторення!`,
      `Пішов підхід: ${exerciseName}! Покажи, на що здатні твої мʼязи!`
    ];
    const text = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(text);
    return text;
  }

  public speakRepPraise(rep: number) {
    const coach = this.getCoachDisplayName();
    const praiseLines = [
      `Реп ${rep}! Красава! Так тримати!`,
      `Ось це міць! Твої мʼязи гартуються як загартована сталь!`,
      `Чудовий контроль руху! Ще одне повторення!`,
      `Залізо підкорюється твоїй енергії! Відмінно!`,
      `Ідеальна траєкторія! ${coach} задоволений!`,
      `Відчуй напругу, це росте справжня сила!`,
      `Потужно! Спина рівна, погляд уперед!`
    ];
    const text = praiseLines[Math.floor(Math.random() * praiseLines.length)];
    this.speak(text);
    return text;
  }

  public speakRoast() {
    const coach = this.getCoachDisplayName();
    const roastLines = [
      'Гей! Ти заснув чи змерз? Рухайся, ковадло охолоне!',
      'Мʼязи самі себе не викують! Починай підхід!',
      'Ти прийшов сюди відпочивати чи ставати легендою? Давай рухайся!',
      `Свисток уже готовий! Не змушуй тренера ${coach} червоніти!`
    ];
    const text = roastLines[Math.floor(Math.random() * roastLines.length)];
    this.speak(text);
    return text;
  }

  public speakWorkoutComplete(reps: number, xp: number) {
    const coach = this.getCoachDisplayName();
    const finishLines = [
      `Відмінна робота! ${reps} повторень і плюс ${xp} досвіду! Залізо підкорилося!`,
      `Сесію завершено! Результат гідний справжнього воїна. Відпочинь і попий води!`,
      `Блискуче! Твоя броня стала міцнішою. ${coach} пишається тобою!`
    ];
    const text = finishLines[Math.floor(Math.random() * finishLines.length)];
    this.speak(text);
    return text;
  }

  public speakExerciseDetected(exerciseName: string, confidence: number) {
    const detectedPhrases = [
      `Камера розпізнала вправу: ${exerciseName}! Впевненість ${confidence} відсотків. Працюй за планом!`,
      `Бачу виконання: ${exerciseName}! Точність розпізнавання висока. Тримай форму!`,
      `Фіксую ${exerciseName}! Відмінний вибір, рахую повторення!`
    ];
    const text = detectedPhrases[Math.floor(Math.random() * detectedPhrases.length)];
    this.speak(text);
    return text;
  }

  public speakFormFeedback(good: boolean, cue: string) {
    const text = good
      ? `Чудова амплітуда! ${cue}`
      : `Увага! ${cue}`;
    this.speak(text);
    return text;
  }
}

export const arnoVoice = new ArnoVoiceEngine();
