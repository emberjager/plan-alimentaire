/* Moteur du plan : dates, état, menu, placard, sessions de cuisine, courses. Pas d'affichage ici. */
"use strict";

/* ---------- Dates ---------- */
const pad = n => String(n).padStart(2,"0");
const iso = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse = s => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const dayName = d => DAYS[(d.getDay()+6)%7];
const fmt = d => d.getDate()+" "+MONTHS[d.getMonth()];
const fmtLong = d => dayName(d).toLowerCase()+" "+fmt(d);
const dShort = d => dayName(d).slice(0,3).toLowerCase()+". "+d.getDate();
const daysBetween = (a,b) => Math.round((b-a)/864e5);
let TODAY;
function setToday(now){ const n=now||new Date(); TODAY=new Date(n.getFullYear(),n.getMonth(),n.getDate()); }
setToday();
const relDay = d => { const k=daysBetween(TODAY,d); return k===0?"aujourd'hui":k===1?"demain":k===-1?"hier":k===2?"après-demain":fmtLong(d); };

/* ---------- État ----------
   guards {iso: J|N|G|A} · dp {iso: {B|CM|L|CA|D: recette}} · ban {ingrédient: 1}
   eat {"iso|L": {r, ded:{id:q}}} mangé (ded = ce qui a été retiré du placard) · skip {"iso|L": {why}}
   stock {ingrédient: quantité en g, ml ou pièces} · ses [{id, date, meals:["iso|L",…], done, at, used}]
   trip {from,to} jours des prochaines courses · trips [{from,to,at,items}] */
const DEFAULT = {v:5,start:"2026-11-12",since:"",guards:{},dp:{},ban:{},eat:{},skip:{},stock:{},ses:[],trip:null,trips:[],prog:{}};
let S = JSON.parse(JSON.stringify(DEFAULT));
const KEEP = Object.keys(DEFAULT);
function load(d){
  d=d||{};
  if(d.v!==5){ // ancienne appli : on garde les gardes, tes choix de repas, ce que tu n'aimes pas et les repas sautés
    const old=d; d={v:5,start:old.start||DEFAULT.start,guards:old.guards||{},dp:old.dp||{},ban:old.ban||{},skip:{}};
    Object.entries(old.skip||{}).forEach(([k,v])=>{ const [dt,s]=k.split("|"); d.skip[dt+"|"+s.replace(/\d$/,"")]={why:v.why||"autre"}; });
  }
  S=Object.assign(JSON.parse(JSON.stringify(DEFAULT)),d);
  if(!S.since) S.since=iso(TODAY); // on ne te demande rien sur les jours d'avant la nouvelle appli
  Object.keys(S).forEach(k=>{ if(!KEEP.includes(k)) delete S[k]; });
  memo.clear();
}

/* ---------- Gardes ---------- */
const gType = d => { const v=S.guards[iso(d)]; return v===1||v===true?"J":(v||""); };
const nextType = t => t ? (GT_ORDER[GT_ORDER.indexOf(t)+1]||"") : "J";
// 3 libre · 2 astreinte ou lendemain de nuit · 1 nuit (le matin est libre) ou lendemain de 24 h · 0 garde de jour ou 24 h
function freeScore(d){
  const t=gType(d), p=gType(addDays(d,-1));
  let s = t==="J"||t==="G" ? 0 : t==="N" ? 1 : t==="A" ? 2 : 3;
  if(p==="G") s=Math.min(s,1); else if(p==="N") s=Math.min(s,2);
  return s;
}
const FREE_TXT = ["jour de garde, ce sera le soir","matin libre avant la nuit","journée calme","journée libre"];

/* ---------- Menu ----------
   Le menu du coach tourne sur 4 semaines à partir du début du plan ; tu peux changer chaque repas jour par jour. */
const PREF = ["B","CM","L","CA","D"];
const PCAT = {B:"B",CM:"C",L:"L",CA:"C",D:"D"};
const PLAB = {B:"Petit-déjeuner",CM:"Collation du matin",L:"Déjeuner",CA:"Collation de l'après-midi",D:"Dîner"};
const PSHORT = {B:"Petit-déj",CM:"Collation",L:"Déjeuner",CA:"Collation",D:"Dîner"};
const TBL = {B:BRK,CM:CMS,L:LUNCH,CA:CAS,D:DINNER};
const NOMADE = new Set(["C9","C11","C14"]); // collations sans frigo
const startDate = () => parse(S.start);
const planWeek = d => { const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()), k=((daysBetween(startDate(),x)%7)+7)%7; return addDays(x,-k); };
const weekIndex = ws => { const w=Math.round(daysBetween(startDate(),ws)/7); return ((w%4)+4)%4; };
function coachFor(date,p){ const ws=planWeek(date); return TBL[p][weekIndex(ws)][SLOT_OF_DAY[daysBetween(ws,date)]]; }
const banned = r => Object.keys(R[r].i).filter(id=>S.ban[id]);
// remplaçant : même catégorie (mêmes calories), sans ce que tu n'aimes pas, proche des ingrédients de la semaine
function pickAlt(r,date,nomade,avoid){
  const w=weekIndex(planWeek(date)), wk=new Set(); [BRK,CMS,CAS,LUNCH,DINNER].forEach(T=>T[w].forEach(x=>Object.keys(R[x].i).forEach(i=>wk.add(i))));
  let best=null, bs=-1e9;
  Object.keys(R).forEach(id=>{
    if(R[id].c!==R[r].c||id===r||banned(id).length) return;
    const ings=Object.keys(R[id].i); let sc=10*ings.filter(i=>wk.has(i)).length/ings.length;
    if(nomade&&NOMADE.has(id)) sc+=50; if(id===avoid) sc-=5;
    if(sc>bs){ bs=sc; best=id; }
  });
  return best||r;
}
const memo = new Map();
const mk = (date,p) => iso(date)+"|"+p;
function mealsFor(date){
  const key=iso(date); if(memo.has(key)) return memo.get(key);
  const g=gType(date), away=g==="J"||g==="G", DP=S.dp[key]||{};
  const list=[]; let prevC=null;
  PREF.forEach(p=>{
    let r=DP[p], user=!!r, sub=null;
    if(!r){ r=coachFor(date,p);
      if(PCAT[p]==="C" && away && !NOMADE.has(r)){ r=p==="CM"?"C9":"C14"; sub="jour de garde : sans frigo"; } }
    const ban=banned(r);
    if(ban.length){ const a=pickAlt(r,date,PCAT[p]==="C"&&away,prevC); if(a!==r){ sub="tu n'aimes pas : "+ban.map(i=>SHORT[i].toLowerCase()).join(", "); r=a; } }
    if(PCAT[p]==="C") prevC=r;
    list.push({p,k:mk(date,p),r,cat:PCAT[p],user,sub,date});
  });
  const m={date,g,away,list,times:TIMES[g||"rest"]};
  memo.set(key,m); return m;
}
const mealAt = key => { const [d,p]=key.split("|"); return mealsFor(parse(d)).list.find(x=>x.p===p); };

/* ---------- Quantités et formats ---------- */
const fmts = id => { const b=ING[id][3]; return Array.isArray(b)?b:[b]; };
const unitOf = id => { const f=fmts(id)[0]; return ING[id][2]==="pc" ? {size:1,one:id==="oeuf"?"œuf":"galette",many:id==="oeuf"?"œufs":"galettes"} : f.pw ? {size:f.pw,one:f.w[0],many:f.w[1]} : {size:f.s,one:f.l.split(" (")[0].replace(/ \d.*$/,""),many:f.l.split(" (")[0].replace(/ \d.*$/,"")+"s"}; };
function fq(id,q){
  const u=ING[id][2]; q=Math.round(q);
  if(u==="pc") return id==="oeuf"?(q>1?q+" œufs":q+" œuf"):q+" "+(q>1?"galettes":"galette");
  return q>=1000 ? (q/1000).toLocaleString("fr-FR",{maximumFractionDigits:2})+(u==="ml"?" L":" kg") : q+" "+u;
}
// en pièces pour les fruits et légumes vendus à la pièce
function fqp(id,q){ const f=fmts(id)[0]; if(f.pw){ const n=Math.round(q/f.pw*2)/2; return (n<1&&q>0?"½":n.toLocaleString("fr-FR"))+" "+(n>1?f.w[1]:f.w[0]); } return fq(id,q); }
const euro = n => (Math.round(n*100)/100).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
// combinaison de paquets la moins chère qui couvre q
function packs(id,q){
  const fm=fmts(id);
  if(fm[0].pw){ const f=fm[0], n=Math.max(1,Math.ceil(q/f.pw-1e-9)); return {label:n+" "+(n>1?f.w[1]:f.w[0]),price:n*f.p,units:n*f.pw}; }
  const [a,b]=fm;
  if(!b){ const n=Math.max(1,Math.ceil(q/a.s-1e-9)); return {label:n+" × "+a.l,price:n*a.p,units:n*a.s}; }
  let best=null;
  for(let i=0;i<=Math.ceil(q/a.s);i++) for(let j=0;j<=Math.ceil(q/b.s);j++){
    if((i||j)===0||i*a.s+j*b.s<q) continue; const c=i*a.p+j*b.p; if(!best||c<best.c) best={c,i,j};
  }
  return {label:[best.j?best.j+" × "+b.l:"",best.i?best.i+" × "+a.l:""].filter(Boolean).join(" + "),price:best.c,units:best.i*a.s+best.j*b.s};
}
const kcalOf = r => CAT[R[r].c].k;

/* ---------- Placard ---------- */
const have = id => S.stock[id]||0;
// ajoute (sign 1) ou retire (sign -1) ; renvoie ce qui a vraiment bougé (on ne retire pas ce qui n'y est pas)
function stockAdd(o,sign){ const moved={}; Object.entries(o).forEach(([id,q])=>{ if(!(q>0)) return; const h=have(id), d=sign>0?q:Math.min(h,q), v=h+sign*d; if(d>0) moved[id]=d; if(v<0.5) delete S.stock[id]; else S.stock[id]=Math.round(v*10)/10; }); return moved; }
function stockSet(id,q){ if(!(q>=0.5)) delete S.stock[id]; else S.stock[id]=Math.round(q*10)/10; }
const ingsOf = (r,n=1) => { const o={}; Object.entries(R[r].i).forEach(([id,q])=>o[id]=q*n); return o; };

/* ---------- Sessions de cuisine ----------
   Une session prépare les déjeuners et dîners de quelques jours (4 jours de frigo au plus),
   et aussi les œufs durs (C5) et les boules énergétiques (C11) de ces jours. */
const FRIDGE = 4;
const prepped = x => x.cat==="L"||x.cat==="D"||x.r==="C5"||x.r==="C11";
const sesOf = key => S.ses.find(s=>s.meals.includes(key));
const isEaten = key => !!S.eat[key];
const isSkip = key => !!S.skip[key];
// où en est un repas : eaten · skip · ready (boîte prête) · planned (session prévue) · todo
function stateOf(x){
  if(isEaten(x.k)) return "eaten"; if(isSkip(x.k)) return "skip";
  if(!prepped(x)) return "todo";
  const s=sesOf(x.k); return s ? (s.done?"ready":"planned") : "todo";
}
// les repas à cuisiner qui n'ont pas encore de session
const freeMeals = date => mealsFor(date).list.filter(x=>prepped(x)&&!sesOf(x.k)&&!isEaten(x.k)&&!isSkip(x.k));
const needsCook = date => freeMeals(date).some(x=>x.cat==="L"||x.cat==="D");
// sessions proposées pour les jours qui n'en ont pas encore (jusqu'à 10 jours)
function proposals(){
  const out=[], end=addDays(TODAY,10);
  let d=new Date(TODAY);
  while(d<=end && out.length<3){
    if(!needsCook(d)){ d=addDays(d,1); continue; }
    const f=d, cands=[addDays(f,-1),f].filter(x=>x>=TODAY);
    let cook=cands[0]; cands.forEach(c=>{ if(freeScore(c)>freeScore(cook)) cook=c; });
    const days=[];
    for(let x=f; x<=end && daysBetween(cook,x)<FRIDGE; x=addDays(x,1)){
      if(!needsCook(x)) break;
      days.push(x);
    }
    const meals=[]; days.forEach(x=>freeMeals(x).forEach(m=>meals.push(m.k)));
    out.push({id:"p"+iso(cook),date:iso(cook),meals,proposed:true});
    d=addDays(days[days.length-1],1);
  }
  return out;
}
const sessionDays = s => [...new Set(s.meals.map(k=>k.split("|")[0]))].sort().map(parse);
// plats de la session : {r, p portions, dates}
function sessionItems(s){
  const by={};
  s.meals.forEach(k=>{ if(isSkip(k)) return; const x=mealAt(k); if(!x) return; const r=(s.done&&s.rs&&s.rs[k])||x.r; const it=by[r]=by[r]||{r,p:0,dates:[]}; it.p++; it.dates.push(x.date); });
  return Object.values(by).sort((a,b)=>(R[a.r].c>R[b.r].c?-1:1));
}
function sessionIngs(s){ const o={}; sessionItems(s).forEach(it=>Object.entries(R[it.r].i).forEach(([id,q])=>o[id]=(o[id]||0)+q*it.p)); return o; }
const missingFor = ings => Object.entries(ings).filter(([id,q])=>have(id)<q*0.9).map(([id,q])=>({id,q,has:have(id)}));
function confirmSession(p,date,meals){
  const s={id:"s"+Date.now().toString(36),date:date||p.date,meals:meals||p.meals.slice(),done:false};
  S.ses.push(s); return s;
}
// « J'ai cuisiné » : retire les ingrédients du placard (quantités corrigées par toi)
function finishSession(s,used){
  s.done=true; s.at=iso(TODAY); s.rs={};
  s.meals.forEach(k=>{ const x=mealAt(k); if(x) s.rs[k]=x.r; });
  s.used=stockAdd(used,-1);
}
function undoSession(s){ if(s.done&&s.used) stockAdd(s.used,1); s.done=false; delete s.used; delete s.at; delete s.rs; }
// garde les vieilles sessions légères
function tidy(){
  const lim=iso(addDays(TODAY,-21));
  S.ses=S.ses.filter(s=>sessionDays(s).some(d=>iso(d)>=lim)||s.date>=lim);
  ["eat","skip"].forEach(f=>Object.keys(S[f]).forEach(k=>{ if(k<lim) delete S[f][k]; }));
  Object.keys(S.dp).forEach(k=>{ if(k<lim) delete S.dp[k]; });
  Object.keys(S.prog).forEach(k=>{ if(!S.ses.some(s=>s.id===k)) delete S.prog[k]; });
  S.trips=S.trips.slice(-12);
}

/* ---------- Manger ----------
   Quand tu coches « mangé », ce qui n'a pas été cuisiné en session sort du placard. */
function eat(x){
  if(isEaten(x.k)) return;
  delete S.skip[x.k];
  const s=sesOf(x.k), fromBox=prepped(x)&&s&&s.done;
  const ded=fromBox?{}:stockAdd(ingsOf(x.r),-1);
  S.eat[x.k]={r:x.r,ded};
}
function uneat(key){ const e=S.eat[key]; if(!e) return; stockAdd(e.ded||{},1); delete S.eat[key]; }
function skip(x,why){ uneat(x.k); S.skip[x.k]={why}; }

/* ---------- Courses ---------- */
function tripNow(){
  const T=S.trip; if(T&&T.to>=iso(TODAY)) return T;
  return {from:iso(addDays(TODAY,1)),to:iso(addDays(TODAY,7))};
}
const tripDays = T => { const a=[]; for(let d=parse(T.from); d<=parse(T.to); d=addDays(d,1)) a.push(d); return a; };
// tout ce qui sortira encore du placard d'ici le dernier jour (les repas d'ici là d'abord)
function needsUntil(to){
  const need={}, add=o=>Object.entries(o).forEach(([id,q])=>need[id]=(need[id]||0)+q);
  for(let d=new Date(TODAY); d<=to; d=addDays(d,1)) mealsFor(d).list.forEach(x=>{
    if(isEaten(x.k)||isSkip(x.k)) return;
    const s=prepped(x)&&sesOf(x.k); if(s&&s.done) return;
    add(ingsOf(x.r));
  });
  return need;
}
function shopList(T){
  const need=needsUntil(parse(T.to));
  return Object.entries(need).map(([id,q])=>{
    const h=have(id); let rest=Math.max(0,q-h);
    if(rest>0 && h>0 && rest<=q*0.1) rest=0;              // il en reste presque assez
    if(rest>0 && ING[id][2]!=="pc" && rest<3) rest=0;     // quelques grammes : pas la peine
    const pk=rest>0?packs(id,rest):null;
    return {id,name:ING[id][0],aisle:ING[id][1],need:q,have:h,rest,buy:!!pk,label:pk?pk.label:"",price:pk?pk.price:0,units:pk?pk.units:0};
  }).sort((a,b)=>a.name.localeCompare(b.name,"fr"));
}
// « J'ai récupéré mes courses » : ce que tu as coché entre au placard
function gotShopping(T,items){
  const add={}; items.forEach(it=>{ if(it.q>0) add[it.id]=(add[it.id]||0)+it.q; });
  stockAdd(add,1);
  S.trips.push({from:T.from,to:T.to,at:iso(TODAY),items:add});
  S.trip=null;
}

/* ---------- Étapes de cuisine ---------- */
const fill = (txt,r,p) => txt.replace(/\{q:(\w+)\}/g,(_,id)=>fq(id,(R[r].i[id]||0)*p)).replace("{b}",p>1?p+" boîtes":"1 boîte");
const nbC = (p,one,many) => p>1?p+" "+many:"1 "+one;
const fillBC = (t,r,p) => t.replace(/\{q:(\w+)\}/g,(_,id)=>fqp(id,(R[r].i[id]||0)*p)).replace(/\{u:(\w+)\}/g,(_,id)=>fqp(id,R[r].i[id]||0))
  .replace(/\{x:(\d+)\}/g,(_,n)=>n*p).replace(/\{pots\}/g,nbC(p,"pot","pots")).replace(/\{sachets\}/g,nbC(p,"sachet","sachets")).replace(/\{boites\}/g,nbC(p,"boîte","boîtes"));
// recette pour 1 portion (petits-déj et collations : faits le jour même)
function recipeSteps(r){
  if(BC[r]){ const B=BC[r]; return [...(B.veille||[]).map(t=>"La veille au soir : "+t.charAt(0).toLowerCase()+t.slice(1)),...(B.jour||[])].map(t=>fillBC(t,r,1)); }
  const out=(STEPS[r]||[]).map(s=>{ if(s.length===1){ const G=GROUPS[s[0]]; return {ph:G.ph,txt:G.t.replace("{q}",fq(G.ing,R[r].i[G.ing]||0))}; } return {ph:s[0],txt:fill(s[1],r,1)}; });
  if(out.some(s=>s.ph===2)) out.push({ph:1,txt:"Préchauffe le four à 200 °C."});
  return out.sort((a,b)=>a.ph-b.ph).map(s=>s.txt);
}
// toutes les étapes d'une session, dans le bon ordre (le riz de 3 plats cuit en une fois)
function sessionSteps(s){
  const items=sessionItems(s), main=items.filter(it=>R[it.r].c==="L"||R[it.r].c==="D"), steps=[], groups={};
  let eggs=0, balls=0;
  items.forEach(it=>{ if(it.r==="C5") eggs+=2*it.p; if(it.r==="C11") balls+=it.p; });
  main.forEach(it=>{
    if(R[it.r].i.oeuf) eggs+=R[it.r].i.oeuf*it.p;
    (STEPS[it.r]||[]).forEach((st,j)=>{
      if(st.length===1){ const G=GROUPS[st[0]], g=groups[st[0]]=groups[st[0]]||{q:0,rec:[]}; const q=(R[it.r].i[G.ing]||0)*it.p; g.q+=q; g.rec.push(R[it.r].n); return; }
      steps.push({id:it.r+"-"+j,ph:st[0],txt:fill(st[1],it.r,it.p),min:st[2],rec:R[it.r].n});
    });
  });
  Object.entries(groups).forEach(([k,g])=>{ const G=GROUPS[k]; steps.push({id:"g-"+k,ph:G.ph,txt:G.t.replace("{q}",fq(G.ing,g.q)),min:G.min,rec:g.rec.join(", ")}); });
  if(eggs) steps.push({id:"oeufs",ph:3,txt:`Œufs durs : ${eggs} œufs, 10 min dans l'eau bouillante, puis dans un bol d'eau froide. Garde-les dans leur coquille, 4 jours au frigo.`,min:10,rec:"Œufs"});
  if(balls) steps.push({id:"boules",ph:7,txt:`Boules énergétiques : mélange ${fq("avoine",35*balls)} de flocons, ${fq("bc",15*balls)} de beurre de cacahuète, ${fq("miel",10*balls)} de miel et ${fq("choco",10*balls)} de chocolat haché. Forme ${balls*3} à ${balls*4} boules, 30 min au frigo.`,rec:"Collations de garde"});
  const boxes=main.reduce((a,it)=>a+it.p,0);
  const oven=steps.some(x=>x.ph===2), water=steps.filter(x=>x.ph===3||x.ph===6).length, pan=steps.some(x=>x.ph===5);
  steps.push({id:"prep",ph:1,txt:`Sors ${boxes?boxes+" boîtes hermétiques, ":""}une planche, un bon couteau${pan?", 2 poêles":""}${oven?", une plaque de four":""} et les ingrédients de la liste.`});
  if(oven) steps.push({id:"four",ph:1,txt:"Préchauffe le four à 200 °C."});
  if(water) steps.push({id:"eau",ph:1,txt:`Mets ${water>1?"2 grandes casseroles":"une grande casserole"} d'eau salée à chauffer.`});
  if(boxes){
    steps.push({id:"froid",ph:8,txt:"Laisse refroidir 30 min au plus à découvert, puis ferme les boîtes et range-les au frigo (4 jours maximum)."});
    steps.push({id:"jours",ph:8,txt:"Note le jour sur chaque boîte : "+main.map(it=>R[it.r].n+" → "+it.dates.map(dShort).join(", ")).join(" · ")+"."});
  }
  return steps.sort((a,b)=>a.ph-b.ph);
}

/* ---------- Rappels pour demain ---------- */
function remindersFor(day){
  const out=[], tm=addDays(day,1), m=mealsFor(tm), n=p=>R[m.list.find(x=>x.p===p).r].n, g=m.g;
  if(g==="J") out.push({i:"🎒",t:`Garde de jour demain : prépare ton sac ce soir. Boîte du déjeuner (${n("L")}), collations sans frigo (${n("CM")}, ${n("CA")}) et petit-déj à emporter (${n("B")}).`});
  if(g==="G") out.push({i:"🎒",t:`Garde 24 h demain : prends 2 boîtes, déjeuner (${n("L")}) et dîner (${n("D")}), plus tes collations sans frigo (${n("CM")}, ${n("CA")}).`});
  if(g==="N") out.push({i:"🌙",t:`Garde de nuit demain soir : prépare la boîte du dîner (${n("D")}) et une collation pour la nuit. Fais une sieste l'après-midi si tu peux.`});
  if(g==="A") out.push({i:"📟",t:"Astreinte demain : garde une collation sans frigo dans ton sac."});
  m.list.forEach(x=>{ const B=BC[x.r]; if(B&&B.veille&&!isSkip(x.k)) out.push({i:"🌜",t:"Ce soir pour demain : "+B.veille.map(t=>fillBC(t,x.r,1)).join(" ").replace(/^./,c=>c.toLowerCase())}); });
  return out;
}
