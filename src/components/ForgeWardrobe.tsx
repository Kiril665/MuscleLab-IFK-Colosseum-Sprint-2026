import React, { useState, useEffect } from 'react';
import { 
  Shirt, 
  Sparkles, 
  Check, 
  Lock, 
  Zap, 
  Flame, 
  Shield, 
  X, 
  Award,
  ChevronRight
} from 'lucide-react';
import { sound } from '../services/soundEngine';

export interface AthleteSkin {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  visualTier: string;
  costXp: number;
  accentColor: string;
  auraEffect: string;
  previewIcon: string;
}

interface ForgeWardrobeProps {
  onClose: () => void;
  userXp?: number;
  onSkinEquipped?: (skin: AthleteSkin) => void;
}

export const ForgeWardrobe: React.FC<ForgeWardrobeProps> = ({ 
  onClose, 
  userXp = 850,
  onSkinEquipped 
}) => {
  const [skins, setSkins] = useState<AthleteSkin[]>([]);
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>(['skin_anvil_classic']);
  const [equippedSkinId, setEquippedSkinId] = useState<string>('skin_anvil_classic');
  const [selectedSkin, setSelectedSkin] = useState<AthleteSkin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/skins/catalog');
      if (res.ok) {
        const json = await res.json();
        setSkins(json.skins || []);
        setUnlockedSkinIds(json.unlockedSkinIds || ['skin_anvil_classic']);
        setEquippedSkinId(json.equippedSkinId || 'skin_anvil_classic');
        if (json.skins && json.skins.length > 0) {
          const equipped = json.skins.find((s: AthleteSkin) => s.id === json.equippedSkinId) || json.skins[0];
          setSelectedSkin(equipped);
        }
      }
    } catch (err) {
      console.error('Failed to load skins catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (skin: AthleteSkin) => {
    sound.playClick();
    try {
      const res = await fetch('/api/skins/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinId: skin.id })
      });
      if (res.ok) {
        const json = await res.json();
        setUnlockedSkinIds(json.unlockedSkinIds);
        sound.playTrophy();
        setActionMessage(`Скін «${skin.name}» розблоковано!`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to unlock skin:', err);
    }
  };

  const handleEquip = async (skin: AthleteSkin) => {
    sound.playClick();
    try {
      const res = await fetch('/api/skins/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinId: skin.id })
      });
      if (res.ok) {
        setEquippedSkinId(skin.id);
        if (onSkinEquipped) onSkinEquipped(skin);
        sound.playClick();
        setActionMessage(`Екіпіровано: «${skin.name}»`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to equip skin:', err);
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-red-950/80 text-red-400 border-red-500/50';
      case 'epic': return 'bg-purple-950/80 text-purple-400 border-purple-500/50';
      case 'rare': return 'bg-amber-950/80 text-amber-400 border-amber-500/50';
      default: return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-neutral-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                ГАРДЕРОБ FORGE & СКІНИ
              </h3>
              <p className="text-xs text-neutral-400 font-sans">
                Косметичні аури та аватарні образи для арени дуелей
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-4 py-2 text-xs text-emerald-300 font-bold flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Body Layout: Preview on Left, Catalog on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Main Selected Skin Showcase */}
          <div className="md:col-span-5 p-5 bg-gradient-to-b from-neutral-950 to-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col items-center justify-between text-center">
            {selectedSkin ? (
              <>
                <div className="w-full flex justify-between items-center text-xs">
                  <span className={`px-2 py-0.5 rounded-full border uppercase font-mono text-[10px] ${getRarityBadge(selectedSkin.rarity)}`}>
                    {selectedSkin.rarity}
                  </span>
                  <span className="text-neutral-400 font-mono text-[11px]">
                    XP Вартість: <strong className="text-amber-400">{selectedSkin.costXp}</strong>
                  </span>
                </div>

                {/* Animated Skin Avatar Visual */}
                <div className="my-6 relative flex items-center justify-center">
                  <div 
                    className="w-36 h-36 rounded-2xl border-2 flex flex-col items-center justify-center text-5xl shadow-2xl relative transition-transform duration-300 hover:scale-105"
                    style={{ 
                      borderColor: selectedSkin.accentColor,
                      boxShadow: `0 0 35px ${selectedSkin.accentColor}40`,
                      background: `radial-gradient(circle, ${selectedSkin.accentColor}15 0%, #0a0a0c 80%)`
                    }}
                  >
                    <span>{selectedSkin.previewIcon}</span>
                    <span className="text-[10px] font-mono uppercase mt-2 tracking-widest text-neutral-400">
                      {selectedSkin.visualTier}
                    </span>
                  </div>

                  {equippedSkinId === selectedSkin.id && (
                    <div className="absolute -top-3 -right-3 bg-amber-500 text-neutral-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-neutral-900">
                      ЕКІПІРОВАНО
                    </div>
                  )}
                </div>

                {/* Skin Info */}
                <div className="space-y-1 max-w-xs mb-4">
                  <h4 className="text-lg font-extrabold text-white font-heading">
                    {selectedSkin.name}
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    {selectedSkin.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-2">
                  {equippedSkinId === selectedSkin.id ? (
                    <div className="w-full py-2.5 rounded-xl bg-neutral-800 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/30">
                      <Check className="w-4 h-4" />
                      Зараз у використанні
                    </div>
                  ) : unlockedSkinIds.includes(selectedSkin.id) ? (
                    <button
                      onClick={() => handleEquip(selectedSkin)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer font-heading"
                    >
                      <Zap className="w-4 h-4 fill-neutral-950" />
                      ЕКІПІРУВАТИ СКІН
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlock(selectedSkin)}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer font-heading"
                    >
                      <Lock className="w-4 h-4 fill-neutral-950" />
                      РОЗБЛОКУВАТИ ({selectedSkin.costXp} XP)
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="m-auto text-neutral-500 text-xs">Оберіть скін зі списку</div>
            )}
          </div>

          {/* Skins Grid Selection */}
          <div className="md:col-span-7 p-4 sm:p-5 space-y-3">
            <div className="text-xs font-bold text-neutral-400 font-mono uppercase tracking-wider">
              Доступна колекція обладунків ({skins.length})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {skins.map(skin => {
                const isUnlocked = unlockedSkinIds.includes(skin.id);
                const isEquipped = equippedSkinId === skin.id;
                const isSelected = selectedSkin?.id === skin.id;

                return (
                  <div
                    key={skin.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedSkin(skin);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 relative ${
                      isSelected
                        ? 'bg-neutral-800 border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                    }`}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
                      style={{ 
                        borderColor: skin.accentColor,
                        background: `${skin.accentColor}12`
                      }}
                    >
                      {skin.previewIcon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs truncate">
                          {skin.name}
                        </span>
                        {isEquipped && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] border font-mono uppercase ${getRarityBadge(skin.rarity)}`}>
                          {skin.rarity}
                        </span>
                        {isUnlocked ? (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Відкрито
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-0.5">
                            <Lock className="w-3 h-3" /> {skin.costXp} XP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
