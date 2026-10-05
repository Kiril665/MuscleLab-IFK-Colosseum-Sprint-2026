import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const pkg=path.join(root,'node_modules','@mediapipe','tasks-vision');
const out=path.join(root,'public','mediapipe');
fs.mkdirSync(out,{recursive:true});
if(!fs.existsSync(pkg)){console.warn('MediaPipe package not installed; run npm install first.');process.exit(0);}
const wasmSrc=path.join(pkg,'wasm');
const wasmOut=path.join(out,'wasm');
if(fs.existsSync(wasmSrc)) fs.cpSync(wasmSrc,wasmOut,{recursive:true});
const candidates=[
 path.join(root,'models','pose_landmarker_lite.task'),
 path.join(pkg,'pose_landmarker_lite.task')
];
const model=candidates.find(fs.existsSync);
if(model) fs.copyFileSync(model,path.join(out,'pose_landmarker_lite.task'));
else console.warn('Pose model not found. Put pose_landmarker_lite.task in models/ or public/mediapipe/.');
