import crypto from 'node:crypto';
import { Connection, PublicKey, ParsedInstruction, PartiallyDecodedInstruction, SystemProgram } from '@solana/web3.js';
import { getDatabase } from './db';
const CLUSTER=(process.env.SOLANA_CLUSTER||'devnet') as 'devnet'|'mainnet-beta'|'testnet';
const RPC=process.env.SOLANA_RPC_URL||undefined;
const connection=()=>new Connection(RPC||`https://api.${CLUSTER}.solana.com`,'confirmed');
const recipient=()=>new PublicKey(required('SOLANA_MERCHANT_WALLET'));
const required=(key:string)=>{const v=process.env[key]?.trim();if(!v)throw new Error(`${key}_NOT_CONFIGURED: set ${key} in the server .env and restart ForgeMuscle`);return v;};
const products=()=>({premium_monthly:{name:'ForgeMuscle Premium',currency:'USDC',usdc:Number(process.env.FORGEMUSCLE_PREMIUM_USDC||'9.99'),sol:Number(process.env.FORGEMUSCLE_PREMIUM_SOL||'0.05'),durationDays:30}} as const);
function mint(){
 const configured=process.env.SOLANA_USDC_MINT?.trim();
 if(configured)return configured;
 return CLUSTER==='devnet'?'4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU':'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
}
function reference(){return new PublicKey(crypto.randomBytes(32)).toBase58();}
export function listProducts(){const p=products().premium_monthly;return [{id:'premium_monthly',name:p.name,prices:{USDC:p.usdc,SOL:p.sol},durationDays:p.durationDays}];}
export function createPlayerDonationOrder(donorUserId:string,targetUserId:string,currency:'SOL'|'USDC',amount:number,battleId:string){
 const normalized=Number(amount);
 if(!Number.isFinite(normalized)||normalized<=0||normalized>10000)throw new Error('invalid_donation_amount');
 if(donorUserId===targetUserId)throw new Error('cannot_donate_to_self');
 const db=getDatabase();
 const target=db.prepare('SELECT id,nick FROM users WHERE id=?').get(targetUserId) as any;
 if(!target)throw new Error('target_user_not_found');
 const targetWallet=db.prepare('SELECT address FROM wallets WHERE user_id=?').get(targetUserId) as any;
 if(!targetWallet?.address)throw new Error('target_wallet_not_linked');
 const id=`tip_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`,ref=reference(),now=Date.now(),expires=now+15*60*1000;
 const token=currency==='USDC'?mint():null;
 const r=new PublicKey(targetWallet.address).toBase58();
 db.prepare('INSERT INTO payment_orders (id,user_id,product_id,amount,currency,token_mint,recipient,reference,status,created_at,expires_at,metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id,donorUserId,'player_donation',normalized,currency,token,r,ref,'PENDING',now,expires,JSON.stringify({network:CLUSTER,type:'player_donation',targetUserId,battleId,targetNick:target.nick}));
 const params=new URLSearchParams({amount:String(normalized),reference:ref,label:`ForgeMuscle · ${target.nick}`,message:`Voluntary tip to ${target.nick}`,memo:`ForgeMuscle player donation ${id}`});if(token)params.set('spl-token',token);
 return {id,productId:'player_donation',targetUserId,targetNick:target.nick,currency,amount:normalized,tokenMint:token,recipient:r,reference:ref,status:'PENDING',expiresAt:expires,paymentUrl:`solana:${r}?${params.toString()}`,network:CLUSTER};
}
export function createDonationOrder(userId:string,currency:'SOL'|'USDC',amount:number){
 const normalized=Number(amount);
 if(!Number.isFinite(normalized)||normalized<=0||normalized>10000)throw new Error('invalid_donation_amount');
 const id=`don_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`,ref=reference(),now=Date.now(),expires=now+15*60*1000;
 const db=getDatabase();const token=currency==='USDC'?mint():null;const r=recipient().toBase58();
 db.prepare('INSERT INTO payment_orders (id,user_id,product_id,amount,currency,token_mint,recipient,reference,status,created_at,expires_at,metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id,userId,'donation',normalized,currency,token,r,ref,'PENDING',now,expires,JSON.stringify({network:CLUSTER,type:'donation'}));
 const params=new URLSearchParams({amount:String(normalized),reference:ref,label:'ForgeMuscle',message:'Добровільний донат ForgeMuscle',memo:`ForgeMuscle donation ${id}`});if(token)params.set('spl-token',token);
 return {id,productId:'donation',currency,amount:normalized,tokenMint:token,recipient:r,reference:ref,status:'PENDING',expiresAt:expires,paymentUrl:`solana:${r}?${params.toString()}`,network:CLUSTER};
}
export function createOrder(userId:string,productId:string,currency:'SOL'|'USDC'){
 const p=(products() as any)[productId];if(!p)throw new Error('unknown_product');const amount=currency==='USDC'?p.usdc:p.sol;if(!Number.isFinite(amount)||amount<=0)throw new Error('invalid_product_price');
 const id=`ord_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`,ref=reference(),now=Date.now(),expires=now+15*60*1000;const db=getDatabase();const token=currency==='USDC'?mint():null;const r=recipient().toBase58();
 db.prepare('INSERT INTO payment_orders (id,user_id,product_id,amount,currency,token_mint,recipient,reference,status,created_at,expires_at,metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id,userId,productId,amount,currency,token,r,ref,'PENDING',now,expires,JSON.stringify({network:CLUSTER}));
 const params=new URLSearchParams({amount:String(amount),reference:ref,label:'ForgeMuscle',message:`ForgeMuscle ${p.name}`,memo:`ForgeMuscle order ${id}`});if(token)params.set('spl-token',token);const paymentUrl=`solana:${r}?${params.toString()}`;
 return {id,productId,currency,amount,tokenMint:token,recipient:r,reference:ref,status:'PENDING',expiresAt:expires,paymentUrl,network:CLUSTER};
}
function tokenReceived(meta:any,owner:string,mintAddress:string):number{
 const before=(meta?.preTokenBalances||[]).filter((x:any)=>x.owner===owner&&x.mint===mintAddress).reduce((s:number,x:any)=>s+Number(x.uiTokenAmount?.uiAmountString||0),0);
 const after=(meta?.postTokenBalances||[]).filter((x:any)=>x.owner===owner&&x.mint===mintAddress).reduce((s:number,x:any)=>s+Number(x.uiTokenAmount?.uiAmountString||0),0);
 return after-before;
}
function solReceived(tx:any,merchant:string):number{
 const keys=tx.transaction.message.accountKeys||[];const idx=keys.findIndex((k:any)=>(k.pubkey?.toBase58?.()||String(k.pubkey||k))===merchant);if(idx<0)return 0;return (Number(tx.meta?.postBalances?.[idx]||0)-Number(tx.meta?.preBalances?.[idx]||0))/1e9;
}
function hasReference(tx:any,ref:string):boolean{
 const keys=tx.transaction.message.accountKeys||[];return keys.some((k:any)=>(k.pubkey?.toBase58?.()||String(k.pubkey||k))===ref);
}
export async function verifyOrder(orderId:string,signature:string){
 const db=getDatabase();const order=db.prepare('SELECT * FROM payment_orders WHERE id=?').get(orderId) as any;if(!order)throw new Error('order_not_found');if(order.status==='PAID')return {paid:true,order};if(Date.now()>Number(order.expires_at)){db.prepare("UPDATE payment_orders SET status='EXPIRED' WHERE id=? AND status='PENDING'").run(orderId);throw new Error('order_expired');}
 const sig=String(signature||'').trim();if(!/^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(sig))throw new Error('invalid_signature');
 const linked=db.prepare('SELECT address FROM wallets WHERE user_id=?').get(order.user_id) as any;if(!linked?.address)throw new Error('wallet_not_linked');
 const prior=db.prepare('SELECT order_id FROM processed_payments WHERE transaction_signature=?').get(sig) as any;if(prior&&prior.order_id!==orderId)throw new Error('transaction_already_used');
 const tx=await connection().getParsedTransaction(sig,{commitment:'confirmed',maxSupportedTransactionVersion:0});if(!tx||tx.meta?.err)throw new Error('transaction_not_confirmed');if(!hasReference(tx,order.reference))throw new Error('reference_mismatch');
 const signers=(tx.transaction.message.accountKeys||[]).filter((k:any)=>k.signer).map((k:any)=>k.pubkey?.toBase58?.()||String(k.pubkey));if(!signers.includes(linked.address))throw new Error('payer_wallet_mismatch');
 let received=0;if(order.currency==='SOL'){received=solReceived(tx,order.recipient);}else{received=tokenReceived(tx.meta,order.recipient,order.token_mint);}
 if(received+1e-9<Number(order.amount))throw new Error('amount_mismatch');if(order.currency==='USDC'&&order.token_mint!==mint())throw new Error('token_mint_mismatch');
 const now=Date.now();const txid=`payment_${crypto.randomBytes(6).toString('hex')}`;db.prepare('BEGIN').run();try{db.prepare("UPDATE payment_orders SET status='PAID',transaction_signature=?,paid_at=? WHERE id=? AND status='PENDING'").run(sig,now,orderId);const updated=db.prepare('SELECT * FROM payment_orders WHERE id=?').get(orderId) as any;if(updated.status!=='PAID')throw new Error('order_state_conflict');db.prepare('INSERT INTO processed_payments(transaction_signature,order_id,processed_at) VALUES(?,?,?)').run(sig,orderId,now);const p=(products() as any)[order.product_id];const expires=order.product_id==='premium_monthly'?now+Number(p.durationDays)*86400000:null;if(order.product_id!=='donation'){db.prepare('INSERT OR IGNORE INTO entitlements(id,user_id,product_id,status,started_at,expires_at,payment_id) VALUES(?,?,?,?,?,?,?)').run(`ent_${crypto.randomBytes(6).toString('hex')}`,order.user_id,order.product_id,'ACTIVE',now,expires,orderId);}db.prepare('COMMIT').run();return {paid:true,transactionSignature:sig,order:updated,expiresAt:expires};}catch(e){try{db.prepare('ROLLBACK').run();}catch{};throw e;}
}
export function getUserEntitlements(userId:string){return getDatabase().prepare('SELECT product_id,status,started_at,expires_at,payment_id FROM entitlements WHERE user_id=? AND status=\'ACTIVE\' AND (expires_at IS NULL OR expires_at>?) ORDER BY started_at DESC').all(userId,Date.now());}
