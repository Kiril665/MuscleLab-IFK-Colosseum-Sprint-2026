import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Trophy, Timer, Users, Camera, Check } from 'lucide-react';
import { ExerciseId } from '../../types';
import { EXERCISES } from '../../data/exercisesData';
import { CameraEngine } from './CameraEngine';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { useI18n } from '../../services/i18n';

interface Competition { id:string; exercise_id:ExerciseId; title:string; starts_at:number; ends_at:number; status:string; participants:number; my_score:number|null; }
interface Props { exerciseId:ExerciseId; view:'list'|'active'|'result'; onViewChange:(v:'list'|'active'|'result')=>void; onBack:()=>void; }

export const CompetitionView: React.FC<Props> = ({ exerciseId, view, onViewChange, onBack }) => {
  const { t } = useI18n();
  const [competitions,setCompetitions]=useState<Competition[]>([]);
  const [selected,setSelected]=useState<Competition|null>(null);
  const [nonce,setNonce]=useState(''); const [endsAt,setEndsAt]=useState(0); const [reps,setReps]=useState(0); const [lastSent,setLastSent]=useState(0);
  const [result,setResult]=useState<{score:number;accuracy:number;rank:number;durationSec:number}|null>(null);
  const [leaderboard,setLeaderboard]=useState<any[]>([]); const timer=useRef<number|null>(null);
  const exercise=EXERCISES.find(e=>e.id===exerciseId)||EXERCISES[0];
  const load=async()=>{ const r=await fetch('/api/competitions'); if(r.ok){const d=await r.json();setCompetitions(d.competitions||[]);} };
  useEffect(()=>{load(); const i=window.setInterval(load,5000); return()=>clearInterval(i);},[]);
  useEffect(()=>()=>{if(timer.current)clearInterval(timer.current)},[]);
  const start=async(c:Competition)=>{ const r=await fetch(`/api/competitions/${c.id}/start`,{method:'POST',headers:{'Content-Type':'application/json'}}); const d=await r.json(); if(!r.ok)return; setSelected(c);setNonce(d.nonce);setEndsAt(d.expiresAt);setReps(0);setLastSent(0);onViewChange('active'); };
  const onRep=async(count:number,_rom:number,accuracy:number)=>{ if(!nonce||count<=lastSent)return; for(let n=lastSent+1;n<=count;n++){await fetch(`/api/competitions/${selected?.id}/rep`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nonce,accuracy})});} setLastSent(count);setReps(count); };
  const finish=async()=>{if(!selected||!nonce)return; const r=await fetch(`/api/competitions/${selected.id}/finish`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nonce})}); const d=await r.json(); if(r.ok){setResult(d); const lb=await fetch(`/api/competitions/${selected.id}/leaderboard`); if(lb.ok){const x=await lb.json();setLeaderboard(x.entries||[]);} onViewChange('result');}};
  useEffect(()=>{if(view!=='active'||!endsAt)return; if(timer.current)clearInterval(timer.current);timer.current=window.setInterval(()=>{if(Date.now()>=endsAt){clearInterval(timer.current!);finish();}},250);return()=>{if(timer.current)clearInterval(timer.current)};},[view,endsAt]);
  if(view==='active') return <div className="flex flex-col gap-4"><Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={15} className="mr-1"/> {t.battle.endDuel}</Button><Card padding="md"><div className="flex justify-between items-center mb-3"><div><h2 className="font-heading text-xl font-black">{selected?.title||t.battle.competitionTitle}</h2><p className="text-xs text-[var(--text-secondary)]">{exercise.name}</p></div><div className="font-heading text-2xl text-[var(--accent)]"><Timer size={18} className="inline mr-1"/>{Math.max(0,Math.ceil((endsAt-Date.now())/1000))}s</div></div><CameraEngine exerciseId={selected?.exercise_id||exerciseId} isActive={true} onRepCounted={onRep}/><Button className="mt-3" fullWidth onClick={finish}>{t.battle.competitionFinish} ({reps})</Button></Card></div>;
  if(view==='result') return <div className="flex flex-col gap-4"><Button variant="ghost" size="sm" onClick={()=>onViewChange('list')}><ArrowLeft size={15} className="mr-1"/> {t.battle.competitionTitle}</Button><Card padding="lg" className="text-center"><Trophy size={44} className="mx-auto text-[var(--crown-gold)]"/><h2 className="font-heading text-3xl font-black mt-2">{t.battle.competitionScore}</h2><div className="text-6xl font-black text-[var(--accent)] mt-2">{result?.score?.toFixed(1)}</div><p className="text-sm text-[var(--text-secondary)] mt-2">{reps} reps · {result?.accuracy?.toFixed(0)}% · #{result?.rank}</p></Card><Card padding="md"><h3 className="font-heading font-bold mb-3">{t.battle.competitionTitle}</h3>{leaderboard.map((e,i)=><div key={e.id} className="flex justify-between p-2 border-b border-[var(--border-subtle)] text-sm"><span>{i+1}. {e.nick}</span><b>{Number(e.score).toFixed(1)}</b></div>)}</Card></div>;
  return <div className="flex flex-col gap-4"><Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={15} className="mr-1"/> {t.battle.endDuel}</Button><div className="flex items-center gap-2"><Trophy className="text-[var(--accent)]"/><h2 className="font-heading text-2xl font-black">{t.battle.competitionTitle}</h2></div><p className="text-xs text-[var(--text-secondary)]">{t.battle.competitionSubtitle}</p><p className="text-[11px] text-[var(--text-secondary)]">{t.battle.competitionRule}</p>{competitions.map(c=><Card key={c.id} padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h3 className="font-heading font-bold">{c.title}</h3><p className="text-xs text-[var(--text-secondary)] mt-1">{EXERCISES.find(e=>e.id===c.exercise_id)?.name||c.exercise_id} · <Users size={12} className="inline"/> {c.participants} {t.battle.competitionParticipants} · {c.my_score==null?'—':Number(c.my_score).toFixed(1)}</p><p className="text-[10px] text-[var(--text-secondary)] mt-1">{new Date(c.ends_at).toLocaleString()}</p></div><Button onClick={()=>start(c)}><Camera size={14} className="mr-1"/>{t.battle.competitionJoin}</Button></Card>)}</div>;
};
