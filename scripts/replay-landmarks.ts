import fs from 'node:fs';
import { RepCounter } from '../src/services/repCounter';
import { estimateView } from '../src/services/viewEstimator';
import { ExerciseId } from '../src/types';
const file=process.argv[2]; const exercise=(process.argv[3]||'pushups') as ExerciseId;
if(!file){console.error('Usage: npm run replay -- recording.json [exercise]');process.exit(1);}
const frames=JSON.parse(fs.readFileSync(file,'utf8')); const c=new RepCounter(exercise,'standard'); let ts=0;
for(const frame of frames){const view=estimateView(frame.world||frame);c.process(frame.world||frame,view,ts);ts+=33;}
console.log(JSON.stringify({exercise,reps:c.totalReps,frames:frames.length},null,2));
