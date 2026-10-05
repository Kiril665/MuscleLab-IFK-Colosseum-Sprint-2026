import { LandmarkPoint, LANDMARKS } from '../../src/services/poseGeometry';

export interface SyntheticOptions { exercise:'pushups'|'squats'|'pullups'|'jumping_jacks'|'burpees'|'lunges'|'dips'|'plank'; reps:number; fps?:number; yaw?:number; pitch?:number; roll?:number; scale?:number; noise?:number; }
const base=()=>Array.from({length:33},()=>({x:0,y:0,z:0,visibility:1}));
function rot(p:{x:number;y:number;z:number}, yaw:number,pitch:number,roll:number){
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
  let x=cy*p.x-sy*p.z,z=sy*p.x+cy*p.z,y=p.y;
  const y2=cp*y-sp*z,z2=sp*y+cp*z; y=y2;z=z2;
  return {x:cr*x-sr*y,y:sr*x+cr*y,z};
}
export function syntheticPoseSequence(o:SyntheticOptions):LandmarkPoint[][] {
  const frames=Math.max(30,Math.round((o.reps*2+1)*(o.fps??30)));
  const out:LandmarkPoint[][]=[]; const yaw=(o.yaw??0)*Math.PI/180,pitch=(o.pitch??0)*Math.PI/180,roll=(o.roll??0)*Math.PI/180,scale=o.scale??1,noise=o.noise??0;
  for(let i=0;i<frames;i++){
    const p=base(); const cycle=(i/(frames-1))*Math.max(1,o.reps*2), phase=(cycle%2)/2; const depth=.5-.22*Math.sin(phase*Math.PI);
    const pts:{[k:number]:{x:number;y:number;z:number}}={
      [LANDMARKS.NOSE]:{x:0,y:-.65,z:0},[11]:{x:-.2,y:-.45,z:0},[12]:{x:.2,y:-.45,z:0},
      [13]:{x:-.35,y:-.2,z:0},[14]:{x:.35,y:-.2,z:0},[15]:{x:-.5,y:0,z:0},[16]:{x:.5,y:0,z:0},
      [23]:{x:-.16,y:0,z:0},[24]:{x:.16,y:0,z:0},[25]:{x:-.17,y:.42,z:0},[26]:{x:.17,y:.42,z:0},
      [27]:{x:-.18,y:.85,z:0},[28]:{x:.18,y:.85,z:0}
    };
    if(o.exercise==='squats'||o.exercise==='lunges'){pts[23].y=depth;pts[24].y=depth;pts[25].y=depth+.25;pts[26].y=depth+.25;}
    if(o.exercise==='pushups'||o.exercise==='dips'){pts[23].y=.1;pts[24].y=.1;pts[11].y=.05;pts[12].y=.05;pts[27].y=.15;pts[28].y=.15;}
    if(o.exercise==='pullups'){pts[15].y=-.85+Math.sin(phase*Math.PI)*.35;pts[16].y=pts[15].y;}
    if(o.exercise==='jumping_jacks'){const wide=.22+.35*Math.sin(phase*Math.PI), high=-.75-.3*Math.sin(phase*Math.PI);pts[27].x=-wide;pts[28].x=wide;pts[15].y=high;pts[16].y=high;}
    for(const [idx,v] of Object.entries(pts)){const r=rot(v,yaw,pitch,roll);p[Number(idx)]={x:.5+r.x*scale+((Math.random()-.5)*noise),y:.5+r.y*scale+((Math.random()-.5)*noise),z:r.z*scale,visibility:1};}
    out.push(p);
  }
  return out;
}
