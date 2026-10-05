import { ExerciseId } from '../types';
import { LANDMARKS } from './poseGeometry';

export type CountingMode = 'reps' | 'hold';
export type Strictness = 'lenient' | 'standard' | 'strict';
export type ViewKind = 'front' | 'side' | 'oblique' | 'back';

export interface ExerciseRule {
  id: ExerciseId;
  mode: CountingMode;
  preferredViews: Partial<Record<ViewKind, number>>;
  signal: 'elbow' | 'knee' | 'jack' | 'lunge' | 'burpee' | 'plank' | 'dip';
  minRom: Record<Strictness, number>;
  minRepMs: number;
  maxRepMs: number;
  required: number[];
  invalidViews?: ViewKind[];
}

export const EXERCISE_RULES: Record<ExerciseId, ExerciseRule> = {
  pushups: { id:'pushups', mode:'reps', preferredViews:{side:1,oblique:.75,front:.45,back:.45}, signal:'elbow', minRom:{lenient:55,standard:70,strict:85}, minRepMs:500,maxRepMs:8000,required:[11,12,13,14,15,16,23,24,27,28] },
  squats: { id:'squats', mode:'reps', preferredViews:{front:1,side:1,oblique:.75,back:.75}, signal:'knee', minRom:{lenient:55,standard:70,strict:85}, minRepMs:600,maxRepMs:10000,required:[23,24,25,26,27,28] },
  pullups: { id:'pullups', mode:'reps', preferredViews:{front:1,back:1,side:.75,oblique:.7}, signal:'elbow', minRom:{lenient:50,standard:65,strict:80}, minRepMs:700,maxRepMs:10000,required:[11,12,13,14,15,16,0] },
  jumping_jacks: { id:'jumping_jacks', mode:'reps', preferredViews:{front:1,back:1}, signal:'jack', minRom:{lenient:55,standard:70,strict:80}, minRepMs:350,maxRepMs:5000,required:[11,12,15,16,27,28],invalidViews:['side'] },
  lunges: { id:'lunges', mode:'reps', preferredViews:{side:1,oblique:1,front:.75}, signal:'lunge', minRom:{lenient:50,standard:65,strict:80}, minRepMs:600,maxRepMs:9000,required:[23,24,25,26,27,28] },
  dips: { id:'dips', mode:'reps', preferredViews:{side:1,oblique:.75,front:.5}, signal:'dip', minRom:{lenient:50,standard:65,strict:80}, minRepMs:600,maxRepMs:9000,required:[11,12,13,14,15,16,23,24] },
  burpees: { id:'burpees', mode:'reps', preferredViews:{front:.9,back:.9,side:.8,oblique:.9}, signal:'burpee', minRom:{lenient:55,standard:70,strict:80}, minRepMs:1000,maxRepMs:15000,required:[0,11,12,23,24,27,28] },
  plank: { id:'plank', mode:'hold', preferredViews:{side:1,oblique:.75}, signal:'plank', minRom:{lenient:0,standard:0,strict:0}, minRepMs:0,maxRepMs:0,required:[11,12,23,24,27,28] }
};

export const exerciseRule = (id: ExerciseId) => EXERCISE_RULES[id];
export const requiredLandmarks = (id: ExerciseId) => EXERCISE_RULES[id].required;
