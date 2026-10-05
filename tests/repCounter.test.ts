import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RepCounter } from '../src/services/repCounter';
import { estimateView } from '../src/services/viewEstimator';
import { ExerciseId } from '../src/types';
import { LandmarkPoint, LANDMARKS } from '../src/services/poseGeometry';

function pose(): LandmarkPoint[] {
  return Array.from({length:33},()=>({x:.5,y:.5,z:0,visibility:1}));
}
function frame(exercise:ExerciseId, phase:'top'|'bottom') {
  const p=pose();
  const theta=phase==='top'?10:105;
  const setSide=(shoulder:number,elbow:number,wrist:number,hip:number,knee:number,ankle:number)=>{
    p[shoulder]={x:.35,y:.5,z:0,visibility:1}; p[elbow]={x:.45,y:.5,z:0,visibility:1};
    const r=theta*Math.PI/180; p[wrist]={x:.45+Math.cos(r)*.12,y:.5+Math.sin(r)*.12,z:0,visibility:1};
    p[hip]={x:.65,y:.65,z:0,visibility:1}; p[knee]={x:.75,y:.7,z:0,visibility:1}; p[ankle]={x:.85,y:.75,z:0,visibility:1};
  };
  setSide(11,13,15,23,25,27); setSide(12,14,16,24,26,28);
  return p;
}
describe('RepCounter',()=>{
  it('uses both sides and emits one event per completed cycle',()=>{
    const c=new RepCounter('pushups','lenient'); const view=estimateView(frame('pushups','top'));
    c.process(frame('pushups','top'),view,0);
    c.process(frame('pushups','bottom'),view,900);
    const r=c.process(frame('pushups','top'),view,1900);
    assert.equal(r.counted,true); assert.equal(r.count,1);
  });
  it('never counts an unsupported side view for jumping jacks',()=>{
    const c=new RepCounter('jumping_jacks','standard');
    const p=frame('jumping_jacks','top');
    const bad={...estimateView(p),view:'side' as const,quality:1};
    const r=c.process(p,bad,0);
    assert.equal(r.counted,false); assert.ok(r.error==='bad_view'||r.error==='low_confidence');
  });
  it('supports plank as a hold instead of reps',()=>{
    const c=new RepCounter('plank','standard'); const p=pose();
    p[11]={x:.2,y:.4,z:0,visibility:1}; p[23]={x:.5,y:.5,z:0,visibility:1}; p[27]={x:.8,y:.6,z:0,visibility:1};
    p[12]={x:.2,y:.4,z:0,visibility:1}; p[24]={x:.5,y:.5,z:0,visibility:1}; p[28]={x:.8,y:.6,z:0,visibility:1};
    const v={...estimateView(p),quality:1,view:'side' as const}; const r=c.process(p,v,1000); assert.equal(r.counted,false); assert.equal(r.phase,'hold');
  });
});
