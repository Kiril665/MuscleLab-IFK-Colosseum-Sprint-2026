import React,{useState} from 'react';
import {Heart,Loader2,CheckCircle2,AlertCircle,ExternalLink} from 'lucide-react';
import {Card} from '../../ui/Card';
import {Button} from '../../ui/Button';
import {useI18n} from '../../services/i18n';

type Order={id:string;provider:'liqpay';amount:number;currency:'UAH';status:string;expiresAt:number;checkoutUrl:string;data:string;signature:string};

export const UkrainianSupport:React.FC=()=>{
 const {lang}=useI18n();
 const [amount,setAmount]=useState('100');
 const [status,setStatus]=useState<'idle'|'loading'|'pending'|'error'>('idle');
 const [error,setError]=useState('');
 const [order,setOrder]=useState<Order|null>(null);
 const copy=lang==='en'?{
  title:'Support the developers',desc:'Voluntary support in UAH through LiqPay. Card, Privat24 and other available payment methods are handled by LiqPay.',
  amount:'Amount, UAH',support:'Support',invalid:'Enter an amount from 1 to 100,000 UAH.',failed:'Could not create the payment.',pending:'Payment page opened. After payment, LiqPay will notify ForgeMuscle automatically.',done:'Thank you for supporting ForgeMuscle!',open:'Open LiqPay',
 }:{
  title:'Підтримати розробників',desc:'Добровільна підтримка в гривнях через LiqPay. Картка, Privat24 та інші доступні способи оплати обробляються на стороні LiqPay.',
  amount:'Сума, грн',support:'Підтримати',invalid:'Вкажіть суму від 1 до 100 000 грн.',failed:'Не вдалося створити платіж.',pending:'Сторінку оплати відкрито. Після оплати LiqPay автоматично повідомить ForgeMuscle.',done:'Дякуємо за підтримку ForgeMuscle!',open:'Відкрити LiqPay'
 };
 const create=async()=>{
  setStatus('loading');setError('');
  try{
   const n=Number(amount.replace(',','.'));
   if(!Number.isFinite(n)||n<1||n>100000)throw new Error(copy.invalid);
   const r=await fetch('/api/payments/support-ukraine',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:n,language:lang})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||copy.failed);
   setOrder(d.order);setStatus('pending');
   const form=document.createElement('form');form.method='POST';form.action=d.order.checkoutUrl;form.style.display='none';
   for(const [name,value] of [['data',d.order.data],['signature',d.order.signature]] as const){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.appendChild(input);}
   document.body.appendChild(form);form.submit();
  }catch(e){setStatus('error');setError(e instanceof Error?e.message:copy.failed);}
 };
 return <Card padding="md">
  <div className="flex items-center justify-between gap-3">
   <div className="flex items-center gap-2 font-heading font-bold"><Heart size={16} className="text-[var(--accent)]"/><span>{copy.title}</span></div>
   <Heart size={18} className="text-[var(--accent)] opacity-70" />
  </div>
  <p className="text-xs text-[var(--text-secondary)] mt-1">{copy.desc}</p>
  <div className="grid grid-cols-4 gap-2 mt-3">{['50','100','250','500'].map(v=><button key={v} type="button" onClick={()=>setAmount(v)} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${amount===v?'border-[var(--accent)] bg-[var(--accent)]/10':'border-[var(--border-subtle)] bg-[var(--bg-subtle)]'}`}>{v} ₴</button>)}</div>
  <div className="flex gap-2 mt-3"><input inputMode="decimal" className="min-w-0 flex-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-2 text-sm" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={copy.amount}/><Button className="min-w-[150px] font-bold" onClick={create} disabled={status==='loading'}>{status==='loading'?<Loader2 className="animate-spin" size={14}/>:copy.support}</Button></div>
  {status==='pending'&&order&&<div className="mt-3 space-y-2"><p className="text-xs text-[var(--text-secondary)]">{copy.pending}</p><a className="text-xs underline inline-flex items-center gap-1" href={order.checkoutUrl} target="_blank" rel="noreferrer">{copy.open} <ExternalLink size={12}/></a></div>}
  {status==='error'&&<div className="mt-3 text-xs text-rose-400 flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}
  {order?.status==='PAID'&&<div className="mt-3 text-sm text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16}/>{copy.done}</div>}
 </Card>;
};
