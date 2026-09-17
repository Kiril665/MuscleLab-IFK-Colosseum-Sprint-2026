import React, { useState, useEffect } from 'react';
import { arnoVoice, ArnoVoiceSettings } from '../services/arnoVoice';
import { sound } from '../services/soundEngine';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  Check, 
  X, 
  Play, 
  Sliders, 
  Sparkles,
  Flame,
  Globe
} from 'lucide-react';

interface ArnoVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArnoVoiceSettingsModal: React.FC<ArnoVoiceSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [settings, setSettings] = useState<ArnoVoiceSettings>(arnoVoice.getVoiceSettings());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(arnoVoice.getVoiceSettings());
      const loaded = arnoVoice.getAvailableVoices();
      setVoices(loaded);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = arnoVoice.subscribe((speaking) => {
      setIsPlayingTest(speaking);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleToggleEnabled = () => {
    sound.playClick();
    const newEnabled = !settings.enabled;
    arnoVoice.setVoiceSettings({ enabled: newEnabled });
    setSettings((prev) => ({ ...prev, enabled: newEnabled }));
  };

  const handleVoiceSelect = (uri: string) => {
    sound.playClick();
    arnoVoice.setVoiceSettings({ voiceUri: uri });
    setSettings((prev) => ({ ...prev, voiceUri: uri }));
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    arnoVoice.setVoiceSettings({ pitch: val });
    setSettings((prev) => ({ ...prev, pitch: val }));
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    arnoVoice.setVoiceSettings({ rate: val });
    setSettings((prev) => ({ ...prev, rate: val }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    arnoVoice.setVoiceSettings({ volume: val });
    setSettings((prev) => ({ ...prev, volume: val }));
  };

  const handleTestVoice = () => {
    sound.playClick();
    arnoVoice.testVoice('Слухай тренера Арно! Спина рівна, дихання глибоке, залізо підкориться!');
  };

  const isUkrainianVoice = (v: SpeechSynthesisVoice) => {
    const l = v.lang.toLowerCase();
    const n = v.name.toLowerCase();
    return l.startsWith('uk') || n.includes('ukrainian') || n.includes('укра') || n.includes('lesya') || n.includes('polina');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-amber-500/40 p-6 sm:p-7 space-y-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white font-heading">
              ГОЛОС ТРЕНЕРА {settings.coachName === 'arthur' ? 'АРТУРА' : 'АРНО'}
            </h3>
            <p className="text-xs text-neutral-400">
              Налаштування синтезу мови українською мовою та аудіосупроводу
            </p>
          </div>
        </div>

        {/* Coach Identity Selector: Arno vs Arthur */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Імʼя наставника:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                arnoVoice.setVoiceSettings({ coachName: 'arno' });
                setSettings((prev) => ({ ...prev, coachName: 'arno' }));
                arnoVoice.testVoice('Привіт! Я твій тренер Арно. Залізо кличе до бою!');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                settings.coachName === 'arno'
                  ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Тренер Арно
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                arnoVoice.setVoiceSettings({ coachName: 'arthur' });
                setSettings((prev) => ({ ...prev, coachName: 'arthur' }));
                arnoVoice.testVoice('Здоров був! Я твій тренер Артур. Працюємо на результат!');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                settings.coachName === 'arthur'
                  ? 'bg-cyan-500 text-neutral-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Тренер Артур
            </button>
          </div>
        </div>

        {/* Toggle Voice Switch */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-white block">
              Голосовий супровід тренування
            </span>
            <span className="text-xs text-neutral-400">
              {settings.enabled ? 'Тренер коментує техніку, рахує повторення та підбадьорює' : 'Голос вимкнено (лише звукові ефекти)'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleEnabled}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              settings.enabled
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {settings.enabled ? <Check className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {settings.enabled ? 'УВІМКНЕНО' : 'ВИМКНЕНО'}
          </button>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            Вибір системного голосу (Браузер)
          </label>
          <select
            value={settings.voiceUri}
            onChange={(e) => handleVoiceSelect(e.target.value)}
            disabled={!settings.enabled}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 font-medium disabled:opacity-50"
          >
            {voices.length === 0 && (
              <option value="">Завантаження голосів системи...</option>
            )}
            {voices.map((v) => {
              const isUk = isUkrainianVoice(v);
              return (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {isUk ? '🇺🇦 ' : ''}{v.name} ({v.lang})
                </option>
              );
            })}
          </select>
          <p className="text-[11px] text-neutral-500">
            {voices.some(isUkrainianVoice)
              ? '✅ Знайдено оптимізований український голос у системі.'
              : 'ℹ️ Використовується системний голос із мовною передачею uk-UA.'}
          </p>
        </div>

        {/* Sliders: Rate & Pitch */}
        <div className="space-y-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
          {/* Pitch */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">Тональність (Pitch)</span>
              <span className="text-amber-400 font-bold">{settings.pitch.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.25"
              step="0.05"
              value={settings.pitch}
              onChange={handlePitchChange}
              disabled={!settings.enabled}
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Грубіший / Бас</span>
              <span>Природний тренер</span>
              <span>Вищий</span>
            </div>
          </div>

          {/* Rate / Speed */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-850">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">Швидкість мови (Tempo)</span>
              <span className="text-amber-400 font-bold">{settings.rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.80"
              max="1.30"
              step="0.05"
              value={settings.rate}
              onChange={handleRateChange}
              disabled={!settings.enabled}
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Спокійний (0.8x)</span>
              <span>Атлетичний (1.0x)</span>
              <span>Швидкий (1.3x)</span>
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-850">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">Гучність голосу</span>
              <span className="text-amber-400 font-bold">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={handleVolumeChange}
              disabled={!settings.enabled}
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>

        {/* Test Voice Button */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={!settings.enabled}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-heading ${
              isPlayingTest
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-neutral-800 hover:bg-neutral-750 text-amber-300 border border-amber-500/30'
            } disabled:opacity-50`}
          >
            <Play className="w-4 h-4 fill-current" />
            {isPlayingTest
              ? `${settings.coachName === 'arthur' ? 'АРТУР' : 'АРНО'} ГОВОРИТЬ...`
              : `ПОСЛУХАТИ ТРЕНЕРА (${settings.coachName === 'arthur' ? 'АРТУРА' : 'АРНО'})`}
          </button>
        </div>
      </div>
    </div>
  );
};
