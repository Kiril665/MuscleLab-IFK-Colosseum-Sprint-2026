import { LandmarkPoint, LANDMARKS, calculateDistance3D } from './poseGeometry';
export type ViewKind='front'|'back'|'side'|'oblique'|'unknown';
export interface ViewEstimate { yawDeg:number; view:ViewKind; torsoOrientation:'vertical'|'horizontal'|'unknown'; quality:number; facing:'front'|'back'|'unknown'; }

function vis(p?:LandmarkPoint){return p?.visibility??0;}
function clamp(v:number,a=0,b=1){return Math.max(a,Math.min(b,v));}

export function estimateView(p:LandmarkPoint[], up={x:0,y:-1,z:0}):ViewEstimate{
 const ls=p[LANDMARKS.LEFT_SHOULDER],rs=p[LANDMARKS.RIGHT_SHOULDER],lh=p[LANDMARKS.LEFT_HIP],rh=p[LANDMARKS.RIGHT_HIP];
 if(!ls||!rs||!lh||!rh) return {yawDeg:90,view:'unknown',torsoOrientation:'unknown',quality:0,facing:'unknown'};
 const required=[ls,rs,lh,rh]; const visibility=required.reduce((s,x)=>s+vis(x),0)/4;
 const sw=calculateDistance3D(ls,rs), hw=calculateDistance3D(lh,rh);
 const xSpan=Math.abs(ls.x-rs.x), zSpan=Math.abs((ls.z??0)-(rs.z??0));
 const yaw=Math.atan2(zSpan,Math.max(xSpan,1e-4))*180/Math.PI;
 const shoulderMid={x:(ls.x+rs.x)/2,y:(ls.y+rs.y)/2,z:((ls.z??0)+(rs.z??0))/2};
 const hipMid={x:(lh.x+rh.x)/2,y:(lh.y+rh.y)/2,z:((lh.z??0)+(rh.z??0))/2};
 const torso={x:shoulderMid.x-hipMid.x,y:shoulderMid.y-hipMid.y,z:shoulderMid.z-hipMid.z};
 const torsoLen=Math.hypot(torso.x,torso.y,torso.z)||1;
 const upLen=Math.hypot(up.x,up.y,up.z)||1;
 const upDot=(torso.x*up.x+torso.y*up.y+torso.z*up.z)/(torsoLen*upLen);
 const torsoOrientation=Math.abs(upDot)>.72?'vertical':Math.abs(upDot)<.35?'horizontal':'unknown';
 const widthQuality=clamp(sw/.12)*.5+clamp(hw/.10)*.5;
 const quality=clamp(visibility*0.65+widthQuality*0.35);
 let view:ViewKind;
 if(quality<.25) view='unknown'; else if(yaw>=68)view='side'; else if(yaw>=28)view='oblique'; else view=sw>=hw*.9?'front':'back';
 return {yawDeg:Math.round(yaw),view,torsoOrientation,quality,facing:view==='front'?'front':view==='back'?'back':'unknown'};
}

export class ViewHysteresis {
 private current:ViewKind='unknown'; private candidate:ViewKind='unknown'; private frames=0;
 constructor(private requiredFrames=4){}
 update(next:ViewEstimate):ViewEstimate{
  if(next.view==='unknown'){this.frames=0; return {...next,view:this.current==='unknown'?'unknown':this.current};}
  if(next.view===this.current){this.candidate=next.view;this.frames=0;return next;}
  if(next.view!==this.candidate){this.candidate=next.view;this.frames=1;return {...next,view:this.current==='unknown'?'unknown':this.current};}
  this.frames++;
  if(this.frames>=this.requiredFrames){this.current=next.view;this.frames=0;}
  return {...next,view:this.current};
 }
 reset(){this.current='unknown';this.candidate='unknown';this.frames=0;}
}
