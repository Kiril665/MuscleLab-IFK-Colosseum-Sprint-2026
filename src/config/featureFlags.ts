// Feature Flags Configuration for ForgeMuscle
// Core MVP loop: Camera verification -> Battle -> Forge progression -> Solana achievement

export interface FeatureFlags {
  ENABLE_PARKED_MODULES: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  // Parked modules (NutritionPlanner, Marketplace, ForgeEducation, Community/Chat, ProHub, MuscleMap)
  // are turned off by default to focus on the core verified loop.
  ENABLE_PARKED_MODULES: false,
};

export function isParkedModuleEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('forgemuscle_enable_parked');
    if (override === 'true') return true;
    if (override === 'false') return false;
  }
  return FEATURE_FLAGS.ENABLE_PARKED_MODULES;
}
