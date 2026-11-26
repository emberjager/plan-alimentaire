/* Affichage : 5 onglets (Manger, Courses, Cuisine, Placard, Recettes), fenêtres du bas, minuteurs, synchro. */
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const view = {tab:"manger", day:null, sheet:null, pick:"from", plFilter:"have", plQ:"", rcQ:"", rcCat:"", toast:null};
try{ const t=localStorage.getItem("plan-tab"); if(t) view.tab=t; }catch(e){}

/* ---------- Enregistrement ---------- */
function save(){
  memo.clear();
  try{ localStorage.setItem("plan-stephane",JSON.stringify(S)); }catch(e){}
  ghPushSoon();
}
function boot(){
  let raw=null; try{ raw=localStorage.getItem("plan-stephane"); }catch(e){}
  let d={}; try{ d=raw?JSON.parse(raw):{}; }catch(e){}
  if(raw && d.v!==5){ try{ localStorage.setItem("plan-stephane-v4",raw); }catch(e){} }
  load(d); tidy();
  try{ localStorage.setItem("plan-stephane",JSON.stringify(S)); }catch(e){}
}

/* ---------- Petits morceaux d'interface ---------- */
const gchip = (t,small) => t ? `<span class="g g-${t}">${small?GT[t].s:GT[t].n}</span>` : "";
const emo = r => EMO[r]||"🍽️";
const toast = t => { view.toast=t; const el=$("#toast"); el.textContent=t; el.classList.add("on"); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove("on"),2600); };
const stepOf = id => ING[id][2]==="pc" ? 1 : fmts(id)[0].pw ? fmts(id)[0].pw/2 : Math.min(fmts(id)[0].s,100);
// valeur affichée et modifiable : en pièces pour les fruits et légumes, sinon en g / ml / pièces
const shown = (id,q) => { const f=fmts(id)[0]; return f.pw ? Math.round(q/f.pw*2)/2 : Math.round(q); };
const unitTxt = (id,n) => { const f=fmts(id)[0]; return f.pw ? (n>1?f.w[1]:f.w[0]) : ING[id][2]==="pc" ? (id==="oeuf"?(n>1?"œufs":"œuf"):(n>1?"galettes":"galette")) : ING[id][2]; };
const fromShown = (id,n) => { const f=fmts(id)[0]; return f.pw ? n*f.pw : n; };
function stepper(id,q,act,arg){
  const n=shown(id,q);
  return `<div class="step"><button class="sb" data-a="${act}" data-v="${arg}|-1" aria-label="Moins">−</button>
    <label class="sv"><input type="number" inputmode="decimal" min="0" step="any" value="${n}" data-in="${act}" data-v="${arg}"><span>${esc(unitTxt(id,n))}</span></label>
    <button class="sb" data-a="${act}" data-v="${arg}|1" aria-label="Plus">+</button></div>`;
}
const dayStrip = (days,sel,act,extra) => `<div class="strip">${days.map(d=>{ const k=iso(d), t=gType(d), on=typeof sel==="function"?sel(d):k===sel;
  return `<button class="dchip ${on?"on":""} ${k===iso(TODAY)?"today":""}" data-a="${act}" data-v="${k}"><small>${dayName(d).slice(0,3)}</small><b>${d.getDate()}</b>${t?`<i class="g-${t}">${GT[t].s}</i>`:"<i></i>"}${extra?extra(d):""}</button>`; }).join("")}</div>`;
const header = (title,sub,right) => `<header class="top"><div><h1>${title}</h1>${sub?`<p>${sub}</p>`:""}</div>${right||""}</header>`;
const empty = (i,t,btn) => `<div class="empty"><div class="ei">${i}</div><p>${t}</p>${btn||""}</div>`;
const STATE_TXT = {eaten:"Mangé",skip:"Pas mangé",ready:"Boîte prête",planned:"À cuisiner",todo:""};

/* ================= MANGER ================= */
function todoCards(){
  const out=[];
  // jours passés pas cochés (depuis la nouvelle appli, 3 jours au plus)
  for(let i=3;i>=1;i--){ const d=addDays(TODAY,-i); if(iso(d)<S.since) continue;
    const n=mealsFor(d).list.filter(x=>!isEaten(x.k)&&!isSkip(x.k)).length;
    if(n) out.push({i:"✅",t:`${relDay(d).replace(/^./,c=>c.toUpperCase())} : ${n} repas pas cochés`,s:"Dis-moi ce que tu as mangé pour que le placard reste juste.",a:"openday",v:iso(d),b:"Cocher"}); }
  // sessions passées pas terminées
  S.ses.filter(s=>!s.done&&s.date<iso(TODAY)).forEach(s=>out.push({i:"🍳",t:`Cuisine prévue ${relDay(parse(s.date))} : c'est fait ?`,s:"Valide pour retirer les ingrédients du placard.",a:"opensession",v:s.id,b:"Voir"}));
  const today=S.ses.filter(s=>!s.done&&s.date===iso(TODAY));
  today.forEach(s=>{ const m=missingFor(sessionIngs(s));
    out.push({i:"👨‍🍳",t:"Aujourd'hui : session cuisine",s:sessionItems(s).filter(it=>"LD".includes(R[it.r].c)).map(it=>it.p+" × "+R[it.r].n).join(" · ")+(m.length?` · il te manque ${m.length} ingrédient${m.length>1?"s":""}`:""),a:"opensession",v:s.id,b:"Commencer",hot:1}); });
  const props=proposals(), p0=props[0];
  if(p0 && daysBetween(TODAY,parse(p0.date))<=1) out.push({i:"🗓️",t:`Cuisine proposée ${relDay(parse(p0.date))}`,s:`Pour ${sessionDays(p0).map(dShort).join(", ")}. ${FREE_TXT[freeScore(parse(p0.date))].replace(/^./,c=>c.toUpperCase())}.`,a:"tab",v:"cuisine",b:"Voir"});
  // il manque des ingrédients pour la prochaine session (3 jours)
  const next=S.ses.filter(s=>!s.done&&s.date>=iso(TODAY)&&daysBetween(TODAY,parse(s.date))<=3).sort((a,b)=>a.date<b.date?-1:1)[0];
  if(next){ const m=missingFor(sessionIngs(next)); if(m.length && next.date!==iso(TODAY)) out.push({i:"🛒",t:`Il te manque ${m.length} ingrédient${m.length>1?"s":""} pour cuisiner ${relDay(parse(next.date))}`,s:m.slice(0,4).map(x=>SHORT[x.id]).join(", ")+(m.length>4?"…":""),a:"tab",v:"courses",b:"Courses"}); }
  if(!Object.keys(S.stock).length) out.push({i:"🧺",t:"Ton placard est vide",s:"Ajoute ce que tu as déjà, ou fais les courses : ce que tu coches entre au placard.",a:"tab",v:"placard",b:"Remplir"});
  remindersFor(TODAY).forEach(r=>out.push({i:r.i,t:r.t,small:1}));
  return out;
}
function mealCard(x,times,i){
  const st=stateOf(x), s=sesOf(x.k);
  const note = st==="ready"?"Boîte prête au frigo":st==="planned"?"Prévu en cuisine "+relDay(parse(s.date)):x.sub?x.sub:"";
  return `<div class="meal st-${st}" data-a="openmeal" data-v="${x.k}">
    <div class="me">${emo(x.r)}</div>
    <div class="mt"><small>${PSHORT[x.p]} · ${esc(times[i].split(" · ")[0])}</small><b>${esc(R[x.r].n)}</b>${note?`<span class="note">${esc(note)}</span>`:""}</div>
    <div class="ma">${st==="eaten"?`<button class="ok on" data-a="uneat" data-v="${x.k}" aria-label="Annuler">✓</button>`:st==="skip"?`<button class="ok sk" data-a="uneat" data-v="${x.k}" aria-label="Annuler">✕</button>`:`<button class="ok" data-a="eat" data-v="${x.k}" aria-label="Mangé">✓</button>`}</div></div>`;
}
function vManger(){
  const d=view.day?parse(view.day):TODAY, m=mealsFor(d), isToday=iso(d)===iso(TODAY);
  const days=[]; for(let i=-1;i<7;i++) days.push(addDays(TODAY,i));
  const done=m.list.filter(x=>isEaten(x.k)).reduce((a,x)=>a+kcalOf(x.r),0), tot=m.list.filter(x=>!isSkip(x.k)).reduce((a,x)=>a+kcalOf(x.r),0)||1;
  const todo=isToday?todoCards():[];
  return header(`${dayName(TODAY)} ${fmt(TODAY)}`, gType(TODAY)?gchip(gType(TODAY)):"Pas de garde aujourd'hui",
      `<div class="hbtn"><button class="ib" data-a="gardes" aria-label="Mes gardes">📅</button><button class="ib" data-a="settings" aria-label="Réglages">⚙️</button></div>`)
    + (todo.length?`<section><h2>À faire</h2>${todo.map(c=>c.small?`<div class="tip"><span>${c.i}</span><p>${esc(c.t)}</p></div>`:
      `<div class="todo ${c.hot?"hot":""}"><span class="ti">${c.i}</span><div><b>${esc(c.t)}</b>${c.s?`<p>${esc(c.s)}</p>`:""}</div><button class="btn sm ${c.hot?"pri":""}" data-a="${c.a}" data-v="${c.v}">${c.b}</button></div>`).join("")}</section>`:"")
    + `<section><h2>${isToday?"Tes repas":"Repas de "+fmtLong(d)}</h2>${dayStrip(days,iso(d),"day")}
      <div class="kc"><div class="bar"><i style="width:${Math.min(100,done/tot*100)}%"></i></div><span>${done} / ${tot} kcal</span></div>
      ${m.g?`<p class="muted small">${gchip(m.g)} ${m.g==="J"||m.g==="G"?"Collations sans frigo dans le sac.":""}</p>`:""}
      ${m.list.map((x,i)=>mealCard(x,m.times,i)).join("")}
      ${m.list.some(x=>!isEaten(x.k)&&!isSkip(x.k))?`<button class="btn wide" data-a="eatall" data-v="${iso(d)}">Tout mangé ce jour-là</button>`:""}</section>`;
}

/* ================= COURSES ================= */
function vCourses(){
  const T=tripNow(), list=shopList(T), buy=list.filter(x=>x.buy), ok=list.filter(x=>!x.buy), chk=(S.trip&&S.trip.chk)||{};
  const days=[]; for(let i=0;i<14;i++) days.push(addDays(TODAY,i));
  const inRange=d=>iso(d)>=T.from&&iso(d)<=T.to;
  const by={}; buy.forEach(x=>(by[x.aisle]=by[x.aisle]||[]).push(x));
  const total=buy.reduce((a,x)=>a+x.price,0), nChk=buy.filter(x=>chk[x.id]).length;
  const td=tripDays(T);
  return header("Courses",`Pour ${td.length} jour${td.length>1?"s":""} : du ${fmtLong(parse(T.from))} au ${fmtLong(parse(T.to))}`)
    + `<section><h2>1. Les jours</h2><p class="muted small">${view.pick==="to"?"Touche maintenant le <b>dernier</b> jour.":"Touche le <b>premier</b> jour, puis le dernier."}</p>${dayStrip(days,inRange,"tripday")}</section>`
    + `<section><h2>2. Les repas de ces jours</h2><div class="mini">${td.map(d=>{ const m=mealsFor(d);
        return `<div class="mrow"><b>${dShort(d)}</b><div>${m.list.filter(x=>x.cat==="L"||x.cat==="D").map(x=>`<button class="pill ${stateOf(x)}" data-a="openmeal" data-v="${x.k}">${emo(x.r)} ${esc(R[x.r].n)}</button>`).join("")}</div></div>`; }).join("")}</div>
      <p class="muted small">Touche un plat pour le changer. Petits-déj et collations sont comptés aussi.</p></section>`
    + `<section><h2>3. La liste <span class="cnt">${buy.length}</span></h2>
      ${buy.length?`<p class="muted small">Coche ce que tu mets dans le caddie. « Au placard » : ce que tu as déjà.</p>
      ${Object.keys(AISLES).filter(a=>by[a]).map(a=>`<h3>${AISLE_EMO[a]} ${AISLES[a]}</h3>${by[a].map(x=>`
        <div class="it ${chk[x.id]?"done":""}"><button class="cb ${chk[x.id]?"on":""}" data-a="chk" data-v="${x.id}" aria-label="Dans le caddie">${chk[x.id]?"✓":""}</button>
          <div class="itx" data-a="chk" data-v="${x.id}"><b>${esc(x.name)}</b><small>${esc(x.label)} · ${euro(x.price)}${x.have?` · tu as ${fqp(x.id,x.have)}`:""}</small></div>
          <button class="btn xs ghost" data-a="haveit" data-v="${x.id}">J'en ai</button></div>`).join("")}`).join("")}
      <p class="tot">Environ <b>${euro(total)}</b></p>
      <div class="row"><button class="btn" data-a="copylist">📋 Copier la liste</button></div>`
      : empty("🎉","Rien à acheter : ton placard couvre ces jours.")}
      ${ok.length?`<details class="more"><summary>Déjà au placard (${ok.length})</summary>${ok.map(x=>`<div class="it"><div class="itx"><b>${esc(x.name)}</b><small>besoin ${fqp(x.id,x.need)} · tu as ${fqp(x.id,x.have)}</small></div></div>`).join("")}</details>`:""}
      </section>
      <div class="dock"><button class="btn big pri" data-a="gotopen">🛍️ J'ai récupéré mes courses${nChk?` (${nChk})`:""}</button></div>`;
}
function sGot(){
  const T=tripNow(), chk=(S.trip&&S.trip.chk)||{}, list=shopList(T).filter(x=>x.buy);
  const g=view.got=view.got||Object.fromEntries(list.map(x=>[x.id,{on:!!chk[x.id]||!Object.keys(chk).length,q:x.units}]));
  const extra=Object.keys(g).filter(id=>!list.some(x=>x.id===id));
  const rows=[...list.map(x=>x.id),...extra];
  return `<h2>Ce que tu as récupéré</h2><p class="muted">Décoche ce qui manquait, corrige les quantités. Tout ce qui est coché entre au placard.</p>
    ${rows.map(id=>{ const it=g[id]; return `<div class="it ${it.on?"":"off"}"><button class="cb ${it.on?"on":""}" data-a="gottog" data-v="${id}">${it.on?"✓":""}</button>
      <div class="itx"><b>${esc(ING[id][0])}</b></div>${it.on?stepper(id,it.q,"gotq",id):""}</div>`; }).join("")}
    <button class="btn wide ghost" data-a="gotadd">+ Autre chose acheté</button>
    <div class="sheetdock"><button class="btn big pri" data-a="gotgo">Ranger au placard (${rows.filter(id=>g[id].on).length})</button></div>`;
}

/* ================= CUISINE ================= */
function sesCard(s){
  const items=sessionItems(s), main=items.filter(it=>"LD".includes(R[it.r].c)), side=items.filter(it=>!"LD".includes(R[it.r].c));
  const d=parse(s.date), m=missingFor(sessionIngs(s)), days=sessionDays(s);
  const prog=S.prog[s.id]||{}, nSteps=s.proposed?0:sessionSteps(s).length, nDone=Object.keys(prog).length;
  return `<div class="card ses ${s.proposed?"prop":""} ${s.done?"done":""}">
    <div class="sh"><div><small>${s.proposed?"Proposée":s.done?"Faite "+relDay(parse(s.at||s.date)):"Prévue"}</small><b>${relDay(d).replace(/^./,c=>c.toUpperCase())}${gType(d)?" "+gchip(gType(d),1):""}</b></div><span class="big-e">👨‍🍳</span></div>
    <p class="muted small">Pour ${days.map(dShort).join(", ")} · ${main.reduce((a,it)=>a+it.p,0)} boîtes${s.proposed?" · "+FREE_TXT[freeScore(d)]:""}</p>
    <ul class="dish">${main.map(it=>`<li>${emo(it.r)} <b>${it.p} ×</b> ${esc(R[it.r].n)}</li>`).join("")}${side.map(it=>`<li class="muted">${emo(it.r)} ${it.p} × ${esc(R[it.r].n)}</li>`).join("")}</ul>
    ${!s.done&&m.length?`<p class="warn">Il manque ${m.length} ingrédient${m.length>1?"s":""} : ${m.slice(0,5).map(x=>SHORT[x.id]).join(", ")}${m.length>5?"…":""}</p>`:""}
    ${!s.done&&!s.proposed&&nDone?`<div class="bar"><i style="width:${nDone/nSteps*100}%"></i></div>`:""}
    <div class="row">${s.proposed?`<button class="btn pri" data-a="propok" data-v="${s.date}">Valider</button><button class="btn" data-a="propday" data-v="${s.date}">Changer le jour</button>`
      : s.done?`<button class="btn ghost sm" data-a="opensession" data-v="${s.id}">Détails</button>`
      : `<button class="btn pri" data-a="opensession" data-v="${s.id}">${nDone?"Reprendre":"Commencer"}</button><button class="btn" data-a="sesday" data-v="${s.id}">Changer le jour</button>`}</div></div>`;
}
function vCuisine(){
  const mine=S.ses.filter(s=>!s.done).sort((a,b)=>a.date<b.date?-1:1), props=proposals();
  const done=S.ses.filter(s=>s.done&&sessionDays(s).some(d=>d>=TODAY)).sort((a,b)=>a.date<b.date?-1:1);
  const boxes=[]; for(let i=0;i<5;i++){ const d=addDays(TODAY,i); mealsFor(d).list.forEach(x=>{ if(stateOf(x)==="ready") boxes.push(x); }); }
  return header("Cuisine","Tu cuisines une fois pour 2 à 4 jours")
    + (mine.length?`<section><h2>Prévues</h2>${mine.map(sesCard).join("")}</section>`:"")
    + `<section><h2>Proposées</h2>${props.length?`<p class="muted small">Choisies d'après tes gardes : le jour le plus calme juste avant les repas. 4 jours de frigo au plus.</p>${props.map(sesCard).join("")}`:empty("✨","Tout est prévu pour les 10 prochains jours.")}</section>`
    + (boxes.length?`<section><h2>Au frigo</h2><div class="mini">${boxes.map(x=>`<button class="pill ready" data-a="openmeal" data-v="${x.k}">${emo(x.r)} ${dShort(x.date)} · ${esc(R[x.r].n)}</button>`).join("")}</div></section>`:"")
    + (done.length?`<section><h2>Déjà cuisiné</h2>${done.map(sesCard).join("")}</section>`:"");
}
function sSession(id){
  const s=S.ses.find(x=>x.id===id); if(!s) return "<p>Session introuvable.</p>";
  const ings=sessionIngs(s), steps=sessionSteps(s), prog=S.prog[s.id]=S.prog[s.id]||{};
  const by={}; Object.entries(ings).forEach(([id,q])=>(by[ING[id][1]]=by[ING[id][1]]||[]).push([id,q]));
  let ph=0;
  return `<h2>Session du ${fmtLong(parse(s.date))}</h2>
    <p class="muted">Pour ${sessionDays(s).map(dShort).join(", ")}</p>
    ${!s.done?`<details class="more"><summary>Jours de cette session</summary>${sessionDays(s).map(d=>`<div class="it"><div class="itx"><b>${fmtLong(d)}</b><small>${mealsFor(d).list.filter(x=>s.meals.includes(x.k)).map(x=>R[x.r].n).join(" · ")}</small></div><button class="btn xs ghost" data-a="sesdrop" data-v="${s.id}|${iso(d)}">Retirer</button></div>`).join("")}</details>`:""}
    <h3>Ingrédients</h3>
    ${Object.keys(AISLES).filter(a=>by[a]).map(a=>by[a].map(([id,q])=>{ const h=have(id), ok=h>=q*0.9;
      return `<div class="it sm"><span class="dot ${ok?"ok":"ko"}"></span><div class="itx"><b>${esc(SHORT[id])}</b></div><span class="q">${fqp(id,q)}${!ok&&!s.done?` <small class="ko">(${h?"tu as "+fqp(id,h):"à acheter"})</small>`:""}</span></div>`; }).join("")).join("")}
    <h3>Étapes</h3>
    ${steps.map(st=>{ const h=st.ph!==ph?`<h4>${PHASES[st.ph]}</h4>`:""; ph=st.ph; const on=!!prog[st.id];
      return h+`<div class="stp ${on?"on":""}"><button class="cb ${on?"on":""}" data-a="stp" data-v="${s.id}|${st.id}">${on?"✓":""}</button><div><p>${esc(st.txt)}</p>${st.rec&&!st.id.startsWith("g-")&&st.id.includes("-")?`<small>${esc(st.rec)}</small>`:""}
        ${st.min&&!on?`<button class="btn xs" data-a="timer" data-v="${st.min}|${esc(st.txt.split(":")[0].slice(0,40))}">⏱ ${st.min} min</button>`:""}</div></div>`; }).join("")}
    <div class="sheetdock">${s.done?`<button class="btn wide ghost" data-a="sesundo" data-v="${s.id}">Annuler « cuisiné » (remet au placard)</button>`
      :`<button class="btn big pri" data-a="sesfin" data-v="${s.id}">J'ai fini de cuisiner</button>`}</div>`;
}
function sFinish(id){
  const s=S.ses.find(x=>x.id===id); const ings=sessionIngs(s);
  const u=view.used=view.used||Object.fromEntries(Object.entries(ings).map(([k,q])=>[k,Math.min(q,have(k))||q]));
  return `<h2>Ce que tu as utilisé</h2><p class="muted">Je retire ça du placard. Corrige si tu as mis plus ou moins.</p>
    ${Object.keys(u).map(id=>`<div class="it"><div class="itx"><b>${esc(SHORT[id])}</b><small>au placard : ${fqp(id,have(id))}</small></div>${stepper(id,u[id],"usedq",id)}</div>`).join("")}
    <div class="sheetdock"><button class="btn big pri" data-a="sesfingo" data-v="${s.id}">Valider : boîtes au frigo</button></div>`;
}
function sDay(kind,v){
  // choisir le jour de cuisine : entre aujourd'hui et le premier jour mangé
  const meals=kind==="prop"?(proposals().find(p=>p.date===v)||{meals:[]}).meals:S.ses.find(s=>s.id===v).meals;
  const first=meals.map(k=>k.split("|")[0]).sort()[0]||iso(TODAY), out=[];
  for(let d=new Date(TODAY); iso(d)<=first; d=addDays(d,1)) out.push(d);
  return `<h2>Quel jour tu cuisines ?</h2><p class="muted">Au plus tard le ${fmtLong(parse(first))}, pour que tout soit prêt.</p>
    ${out.map(d=>`<button class="opt" data-a="${kind==="prop"?"propokd":"sesdayset"}" data-v="${v}|${iso(d)}"><b>${relDay(d).replace(/^./,c=>c.toUpperCase())}</b><small>${gType(d)?GT[gType(d)].n+" · ":""}${FREE_TXT[freeScore(d)]}</small></button>`).join("")}`;
}

/* ================= PLACARD ================= */
function vPlacard(){
  const q=view.plQ.trim().toLowerCase(), all=view.plFilter==="all"||!!q;
  const soon=Object.entries(needsUntil(addDays(TODAY,2))).filter(([id,n])=>have(id)>0&&have(id)<n*0.9).map(([id])=>id);
  const ids=Object.keys(ING).filter(id=>(all||have(id)>0)&&(!q||ING[id][0].toLowerCase().includes(q)||SHORT[id].toLowerCase().includes(q)));
  const by={}; ids.forEach(id=>(by[ING[id][1]]=by[ING[id][1]]||[]).push(id));
  const n=Object.keys(S.stock).length;
  return header("Placard",`${n} produit${n>1?"s":""} chez toi`)
    + `<section><input class="search" type="search" placeholder="Chercher ou ajouter un produit…" value="${esc(view.plQ)}" data-in="plq">
      <div class="chips"><button class="chip ${view.plFilter==="have"?"on":""}" data-a="plf" data-v="have">Ce que j'ai</button><button class="chip ${view.plFilter==="all"?"on":""}" data-a="plf" data-v="all">Tous les produits</button></div>
      ${soon.length?`<div class="todo"><span class="ti">⚠️</span><div><b>Bientôt à court</b><p>${soon.map(id=>SHORT[id]).join(", ")} : pas assez pour les 3 prochains jours.</p></div></div>`:""}
      ${!n&&!all?empty("🧺","Ton placard est vide. Ajoute ce que tu as déjà chez toi, ou fais tes courses : ce que tu coches entre ici tout seul.",`<button class="btn pri" data-a="plf" data-v="all">Faire l'inventaire</button>`):""}
      ${Object.keys(AISLES).filter(a=>by[a]).map(a=>`<h3>${AISLE_EMO[a]} ${AISLES[a]}</h3>${by[a].sort((x,y)=>ING[x][0].localeCompare(ING[y][0],"fr")).map(id=>`
        <div class="it ${have(id)?"":"off"}"><div class="itx"><b>${esc(ING[id][0])}</b>${soon.includes(id)?`<small class="ko">bientôt à court</small>`:""}</div>${stepper(id,have(id),"stk",id)}</div>`).join("")}`).join("")}
      ${all&&!ids.length?empty("🔎","Aucun produit de tes recettes ne correspond."):""}</section>`;
}

/* ================= RECETTES ================= */
function vRecettes(){
  const q=view.rcQ.trim().toLowerCase();
  const ids=Object.keys(R).filter(r=>(!view.rcCat||R[r].c===view.rcCat)&&(!q||R[r].n.toLowerCase().includes(q)||Object.keys(R[r].i).some(i=>SHORT[i].toLowerCase().includes(q))));
  const bans=Object.keys(S.ban);
  return header("Recettes",`${Object.keys(R).length} recettes de ton plan`)
    + `<section><input class="search" type="search" placeholder="Une recette, un ingrédient…" value="${esc(view.rcQ)}" data-in="rcq">
      <div class="chips">${[["","Toutes"],["B","Petits-déj"],["C","Collations"],["L","Déjeuners"],["D","Dîners"]].map(([c,n])=>`<button class="chip ${view.rcCat===c?"on":""}" data-a="rcc" data-v="${c}">${n}</button>`).join("")}</div>
      <div class="grid">${ids.map(r=>`<button class="rc ${banned(r).length?"ban":""}" data-a="openrec" data-v="${r}"><span>${emo(r)}</span><b>${esc(R[r].n)}</b><small>${CAT[R[r].c].n} · ${kcalOf(r)} kcal${banned(r).length?" · remplacé":""}</small></button>`).join("")}</div>
      ${!ids.length?empty("🔎","Aucune recette ne correspond."):""}</section>
      <section><h2>Ce que tu n'aimes pas</h2><p class="muted small">Les repas qui en contiennent sont remplacés par un plat équivalent.</p>
      <div class="chips">${bans.length?bans.map(id=>`<button class="chip on" data-a="ban" data-v="${id}">${esc(SHORT[id])} ✕</button>`).join(""):`<span class="muted small">Rien pour l'instant. Ouvre une recette et touche un ingrédient.</span>`}</div></section>`;
}
function recBody(r,k){
  const x=k?mealAt(k):null, n=1;
  return `<div class="rh"><span>${emo(r)}</span><div><small>${CAT[R[r].c].n} · ${kcalOf(r)} kcal</small><h2>${esc(R[r].n)}</h2></div></div>
    <h3>Ingrédients</h3>${Object.entries(R[r].i).map(([id,q])=>`<div class="it sm ${S.ban[id]?"off":""}"><span class="dot ${have(id)>=q*n?"ok":"ko"}"></span><div class="itx"><b>${esc(SHORT[id])}</b></div><span class="q">${fqp(id,q*n)}</span><button class="btn xs ghost" data-a="ban" data-v="${id}">${S.ban[id]?"J'aime":"Je n'aime pas"}</button></div>`).join("")}
    <p class="muted small"><span class="dot ok"></span> au placard · <span class="dot ko"></span> à acheter</p>
    <h3>Préparation</h3>${prepped({cat:R[r].c,r})&&!BC[r]?`<p class="muted small">Se prépare en session cuisine, pour plusieurs jours. Pour 1 portion :</p>`:""}
    <ol class="steps">${recipeSteps(r).map(t=>`<li>${esc(t)}</li>`).join("")}</ol>
    ${R[r].h?`<p class="hint">💡 ${esc(R[r].h)}</p>`:""}`;
}
function sMeal(k){
  const x=mealAt(k); if(!x) return "";
  const st=stateOf(x), s=sesOf(k);
  return `<p class="muted">${PLAB[x.p]} · ${fmtLong(x.date)}${x.sub?" · "+esc(x.sub):""}</p>${recBody(x.r,k)}
    ${st==="ready"?`<p class="hint">📦 Boîte prête : réchauffe-la 2 à 3 min au micro-ondes.</p>`:st==="planned"?`<p class="hint">🗓️ Prévu dans la session du ${fmtLong(parse(s.date))}.</p>`:""}
    <button class="btn wide ghost" data-a="swap" data-v="${k}">🔄 Changer de plat</button>
    <div class="sheetdock row">${st==="eaten"||st==="skip"?`<button class="btn big" data-a="uneat" data-v="${k}">Annuler (${STATE_TXT[st].toLowerCase()})</button>`
      :`<button class="btn big" data-a="skip" data-v="${k}">Pas mangé</button><button class="btn big pri" data-a="eat" data-v="${k}">Mangé ✓</button>`}</div>`;
}
function sSwap(k){
  const x=mealAt(k), c=R[x.r].c;
  return `<h2>Changer de plat</h2><p class="muted">${PLAB[x.p]} du ${fmtLong(x.date)}. Même catégorie, mêmes calories.</p>
    ${x.user?`<button class="opt" data-a="swapgo" data-v="${k}|"><b>↩️ Remettre le plat du coach</b><small>${esc(R[coachFor(x.date,x.p)].n)}</small></button>`:""}
    ${Object.keys(R).filter(r=>R[r].c===c&&r!==x.r).map(r=>`<button class="opt ${banned(r).length?"off":""}" data-a="swapgo" data-v="${k}|${r}"><span class="oe">${emo(r)}</span><b>${esc(R[r].n)}</b>${banned(r).length?`<small>contient ce que tu n'aimes pas</small>`:NOMADE.has(r)?`<small>sans frigo</small>`:""}</button>`).join("")}`;
}

/* ================= GARDES et RÉGLAGES ================= */
function sGardes(){
  const ws=addDays(TODAY,-((TODAY.getDay()+6)%7)), weeks=[];
  for(let w=0;w<6;w++){ const r=[]; for(let i=0;i<7;i++) r.push(addDays(ws,w*7+i)); weeks.push(r); }
  return `<h2>Mes gardes</h2><p class="muted">Touche un jour pour changer : rien → Jour → Nuit → 24 h → Astreinte.</p>
    <div class="cal"><div class="cw">${DAYS.map(d=>`<span>${d.slice(0,1)}</span>`).join("")}</div>
    ${weeks.map(r=>`<div class="cw">${r.map(d=>{ const t=gType(d); return `<button class="cd ${t?"g-"+t:""} ${iso(d)===iso(TODAY)?"today":""} ${d<TODAY?"past":""}" data-a="guard" data-v="${iso(d)}"><b>${d.getDate()}</b>${d.getDate()===1||iso(d)===iso(ws)?`<small>${MONTHS[d.getMonth()]}</small>`:""}<i>${t?GT[t].s:""}</i></button>`; }).join("")}</div>`).join("")}</div>
    <p class="muted small">Les sessions cuisine et les collations sans frigo suivent tes gardes.</p>`;
}
let syncMsg="Enregistré sur cet appareil";
function setSync(t){ syncMsg=t; const el=$("#ghState"); if(el) el.textContent=t; }
function sSettings(){
  const connected=gh&&gh.id;
  return `<h2>Réglages</h2>
    <div class="card"><b>Synchro PC ↔ téléphone ${connected?"✓":""}</b><p class="muted small" id="ghState">${esc(syncMsg)}</p>
    ${connected?`<div class="row"><button class="btn sm" data-a="ghnow">Synchroniser maintenant</button><button class="btn sm ghost" data-a="ghoff">Déconnecter</button></div>`
    :`<ol class="small"><li>Ouvre <a href="https://github.com/settings/tokens/new?scopes=gist&description=Plan%20alimentaire" target="_blank" rel="noopener">ce lien GitHub</a>.</li><li>« Expiration » : <b>No expiration</b>, laisse seulement « gist » coché.</li><li><b>Generate token</b>, copie la clé (ghp_…).</li><li>Colle-la ici, puis « Connecter ». Même clé sur l'autre appareil.</li></ol>
      <input id="ghTok" class="search" type="password" autocomplete="off" placeholder="ghp_…"><button class="btn pri" data-a="ghgo">Connecter</button><p class="small" id="ghMsg"></p>`}</div>
    <div class="card"><b>Sauvegarde</b><p class="muted small">Un fichier avec toutes tes données (gardes, placard, repas).</p>
      <div class="row"><button class="btn sm" data-a="exp">Télécharger</button><label class="btn sm ghost">Restaurer<input type="file" accept=".json,application/json" data-in="imp" hidden></label></div></div>
    <div class="card"><b>Début du plan</b><p class="muted small">Le menu du coach tourne sur 4 semaines à partir du ${fmtLong(startDate())}.</p></div>`;
}

/* ---------- Fenêtres du bas ---------- */
const SHEETS = {got:sGot,session:sSession,finish:sFinish,day:a=>sDay(...a.split("~")),meal:sMeal,swap:sSwap,rec:r=>recBody(r),gardes:sGardes,settings:sSettings};
function openSheet(kind,arg){ view.sheet={kind,arg}; renderSheet(true); }
function closeSheet(){ view.sheet=null; view.got=null; view.used=null; const sh=$("#sheet"); sh.classList.remove("on"); setTimeout(()=>{ if(!view.sheet) sh.innerHTML=""; },250); }
function renderSheet(fresh){
  const sh=$("#sheet"); if(!view.sheet){ return; }
  const body=sh.querySelector(".sbody"), top=body&&!fresh?body.scrollTop:0;
  sh.innerHTML=`<div class="scrim" data-a="close"></div><div class="panel" role="dialog"><div class="grab" data-a="close"><i></i></div><button class="x" data-a="close" aria-label="Fermer">✕</button><div class="sbody">${SHEETS[view.sheet.kind](view.sheet.arg)}</div></div>`;
  sh.querySelector(".sbody").scrollTop=top;
  requestAnimationFrame(()=>sh.classList.add("on"));
}

/* ---------- Rendu ---------- */
const TABS = [["manger","Manger","M4 3v8a2 2 0 0 0 2 2h0v8M8 3v8M6 3v5M18 21V3c-2 0-4 2-4 6v4h4"],["courses","Courses","M3 4h2l2.4 11h11L21 7H6.2M9 20.5a1 1 0 1 0 0-.1M18 20.5a1 1 0 1 0 0-.1"],
  ["cuisine","Cuisine","M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6zM2 11h20M9 4c0 2 2 2 2 4M14 4c0 2 2 2 2 4"],["placard","Placard","M4 3h16v18H4zM4 12h16M12 3v18M9 7.5v1M15 7.5v1M9 15.5v1M15 15.5v1"],
  ["recettes","Recettes","M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6"]];
const VIEWS = {manger:vManger,courses:vCourses,cuisine:vCuisine,placard:vPlacard,recettes:vRecettes};
function render(){
  setToday(); memo.clear();
  const ae=document.activeElement, keep=ae&&ae.dataset&&ae.dataset.in&&ae.type==="search"?{in:ae.dataset.in,pos:ae.selectionStart}:null;
  $("#main").innerHTML=VIEWS[view.tab]();
  $("#tabs").innerHTML=TABS.map(([k,n,p])=>`<button class="${view.tab===k?"on":""}" data-a="tab" data-v="${k}"><svg viewBox="0 0 24 24"><path d="${p}"/></svg><span>${n}</span></button>`).join("");
  document.body.dataset.tab=view.tab;
  if(keep){ const el=document.querySelector(`[data-in="${keep.in}"]`); if(el){ el.focus(); try{ el.setSelectionRange(keep.pos,keep.pos); }catch(e){} } }
  if(view.sheet) renderSheet();
}
const after = () => { save(); render(); };

/* ---------- Actions ---------- */
function ensureTrip(){ if(!S.trip||S.trip.to<iso(TODAY)) S.trip=Object.assign(tripNow(),{chk:{}}); S.trip.chk=S.trip.chk||{}; return S.trip; }
const A = {
  close: closeSheet,
  tab: v => { view.tab=v; view.day=null; closeSheet(); try{ localStorage.setItem("plan-tab",v); }catch(e){} render(); scrollTo(0,0); },
  day: v => { view.day=v===iso(TODAY)?null:v; render(); },
  openday: v => { view.day=v; view.tab="manger"; render(); scrollTo(0,0); },
  openmeal: v => openSheet("meal",v),
  openrec: v => openSheet("rec",v),
  eat: v => { const x=mealAt(v); eat(x); toast("Bon appétit ✓"); if(view.sheet&&view.sheet.kind==="meal") closeSheet(); after(); },
  uneat: v => { uneat(v); delete S.skip[v]; after(); },
  skip: v => { skip(mealAt(v),"autre"); closeSheet(); after(); },
  eatall: v => { mealsFor(parse(v)).list.forEach(x=>{ if(!isEaten(x.k)&&!isSkip(x.k)) eat(x); }); toast("Journée cochée ✓"); after(); },
  swap: v => openSheet("swap",v),
  swapgo: v => { const i=v.lastIndexOf("|"), k=v.slice(0,i), r=v.slice(i+1), [d,p]=k.split("|"), D=S.dp[d]=S.dp[d]||{}; if(r) D[p]=r; else delete D[p]; if(!Object.keys(D).length) delete S.dp[d]; openSheet("meal",k); after(); },
  gardes: () => openSheet("gardes"),
  settings: () => openSheet("settings"),
  guard: v => { const t=nextType(gType(parse(v))); if(t) S.guards[v]=t; else delete S.guards[v]; after(); },
  // courses
  tripday: v => { const T=ensureTrip();
    if(view.pick==="to"&&v>=T.from){ T.to=v; view.pick="from"; } else { T.from=v; if(T.to<v) T.to=v; view.pick="to"; }
    after(); },
  chk: v => { const T=ensureTrip(); if(T.chk[v]) delete T.chk[v]; else T.chk[v]=1; after(); },
  haveit: v => { const x=shopList(tripNow()).find(y=>y.id===v); if(x) stockSet(v,Math.max(have(v),x.need)); toast(SHORT[v]+" : ajouté au placard"); after(); },
  copylist: () => { const T=tripNow(), b=shopList(T).filter(x=>x.buy), by={}; b.forEach(x=>(by[x.aisle]=by[x.aisle]||[]).push(x));
    const txt=`Courses du ${fmtLong(parse(T.from))} au ${fmtLong(parse(T.to))}\n`+Object.keys(AISLES).filter(a=>by[a]).map(a=>`\n${AISLES[a]}\n`+by[a].map(x=>`- ${x.name} : ${x.label}`).join("\n")).join("\n");
    (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast("Liste copiée 📋"),()=>toast("Copie impossible sur cet appareil")); },
  gotopen: () => { view.got=null; openSheet("got"); },
  gottog: v => { view.got[v].on=!view.got[v].on; renderSheet(); },
  gotq: v => { const [id,dir]=v.split("|"); const g=view.got[id]; g.q=Math.max(0,g.q+(+dir)*stepOf(id)); renderSheet(); },
  gotadd: () => { const q=prompt("Quel produit ? (ex. : poulet, riz, banane)"); if(!q) return; const l=q.toLowerCase();
    const id=Object.keys(ING).find(i=>ING[i][0].toLowerCase().includes(l)||SHORT[i].toLowerCase().includes(l));
    if(!id){ toast("Je ne connais pas ce produit"); return; } view.got[id]=view.got[id]||{on:true,q:packs(id,1).units}; view.got[id].on=true; renderSheet(); },
  gotgo: () => { const T=tripNow(), items=Object.entries(view.got).filter(([,g])=>g.on).map(([id,g])=>({id,q:g.q}));
    gotShopping(T,items); view.pick="from"; closeSheet(); toast(`${items.length} produits rangés au placard ✓`); view.tab="placard"; view.plFilter="have"; after(); scrollTo(0,0); },
  // cuisine
  propok: v => { const p=proposals().find(x=>x.date===v); if(p){ confirmSession(p); toast("Session prévue ✓"); } after(); },
  propday: v => openSheet("day","prop~"+v),
  propokd: v => { const [d,n]=v.split("|"), p=proposals().find(x=>x.date===d); if(p) confirmSession(p,n); closeSheet(); toast("Session prévue ✓"); after(); },
  sesday: v => openSheet("day","ses~"+v),
  sesdayset: v => { const [id,d]=v.split("|"), s=S.ses.find(x=>x.id===id); if(s) s.date=d; closeSheet(); after(); },
  sesdrop: v => { const [id,d]=v.split("|"), s=S.ses.find(x=>x.id===id); s.meals=s.meals.filter(k=>!k.startsWith(d+"|")); if(!s.meals.length){ S.ses=S.ses.filter(x=>x!==s); closeSheet(); } after(); },
  opensession: v => { view.tab="cuisine"; openSheet("session",v); render(); },
  stp: v => { const [id,st]=v.split("|"), P=S.prog[id]=S.prog[id]||{}; if(P[st]) delete P[st]; else P[st]=1; after(); },
  sesfin: v => { view.used=null; openSheet("finish",v); },
  usedq: v => { const [id,dir]=v.split("|"); view.used[id]=Math.max(0,view.used[id]+(+dir)*stepOf(id)); renderSheet(); },
  sesfingo: v => { const s=S.ses.find(x=>x.id===v); finishSession(s,view.used); delete S.prog[s.id]; closeSheet(); toast("Bravo, les boîtes sont au frigo 📦"); after(); },
  sesundo: v => { const s=S.ses.find(x=>x.id===v); undoSession(s); closeSheet(); after(); },
  timer: v => { const [m,l]=v.split("|"); startTimer(+m,l); },
  tstop: v => { timers=timers.filter(t=>t.id!==v); saveTimers(); drawTimers(); },
  // placard
  stk: v => { const [id,dir]=v.split("|"); stockSet(id,Math.max(0,have(id)+(+dir)*stepOf(id))); after(); },
  plf: v => { view.plFilter=v; view.plQ=""; render(); },
  // recettes
  rcc: v => { view.rcCat=v; render(); },
  ban: v => { if(S.ban[v]) delete S.ban[v]; else S.ban[v]=1; after(); },
  // réglages
  ghgo: (v,t) => { const tok=($("#ghTok").value||"").trim(), m=$("#ghMsg");
    if(!/^(ghp_|github_pat_)/.test(tok)){ m.textContent="Colle la clé GitHub en entier (elle commence par ghp_)."; return; }
    m.textContent="Connexion…"; t.disabled=true;
    ghConnect(tok).then(r=>{ renderSheet(); render(); setSync(r==="found"?"Données récupérées depuis ton autre appareil ✓":"Synchro active ✓ Colle la même clé sur ton autre appareil."); })
      .catch(e=>{ t.disabled=false; m.textContent=e&&e.code===401?"Clé refusée : vérifie que tu l'as copiée en entier.":e&&(e.code===403||e.code===404)?"Cette clé n'a pas le droit « gist » : recrée-la en cochant « gist ».":"Pas de connexion internet : réessaie."; }); },
  ghnow: () => { setSync("Synchronisation…"); (ghDirty?ghPush():Promise.resolve()).then(()=>ghPull()); },
  ghoff: () => { if(!confirm("Arrêter la synchro sur cet appareil ? Tes données restent ici.")) return; gh=null; try{ localStorage.removeItem("plan-gh"); localStorage.removeItem("plan-gh-t"); }catch(e){} setSync("Enregistré sur cet appareil"); renderSheet(); },
  exp: () => { const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:"application/json"})); a.download="plan-alimentaire-"+iso(TODAY)+".json"; a.click(); },
};
const INPUTS = {
  plq: v => { view.plQ=v; render(); },
  rcq: v => { view.rcQ=v; render(); },
  stk: (v,el) => { stockSet(el.dataset.v,fromShown(el.dataset.v,+v||0)); after(); },
  gotq: (v,el) => { view.got[el.dataset.v].q=fromShown(el.dataset.v,+v||0); renderSheet(); },
  usedq: (v,el) => { view.used[el.dataset.v]=fromShown(el.dataset.v,+v||0); renderSheet(); },
  imp: (v,el) => { const f=el.files[0]; if(!f) return; f.text().then(t=>{ const d=JSON.parse(t); if(!d||typeof d!=="object") throw 0; if(!confirm("Remplacer les données de cet appareil par ce fichier ?")) return; load(d); after(); closeSheet(); toast("Données restaurées ✓"); }).catch(()=>toast("Ce fichier n'est pas une sauvegarde du plan")); },
};
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-a]"); if(!t) return;
  if(t.closest("a")) return;
  e.preventDefault(); e.stopPropagation();
  const f=A[t.dataset.a]; if(f) f(t.dataset.v,t);
});
document.addEventListener("input",e=>{ const t=e.target; if(t.dataset.in&&t.type==="search") INPUTS[t.dataset.in](t.value,t); });
document.addEventListener("change",e=>{ const t=e.target; if(t.dataset.in&&t.type!=="search") INPUTS[t.dataset.in](t.type==="file"?"":t.value,t); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&view.sheet) closeSheet(); if(e.key==="Enter"&&e.target.type==="number") e.target.blur(); });

/* ---------- Minuteurs ---------- */
let timers=[]; try{ timers=JSON.parse(localStorage.getItem("plan-timers")||"[]").filter(t=>t.end>Date.now()-36e5); }catch(e){}
const saveTimers = () => { try{ localStorage.setItem("plan-timers",JSON.stringify(timers)); }catch(e){} };
function startTimer(min,label){ timers.push({id:Date.now().toString(36),label,end:Date.now()+min*6e4}); saveTimers(); drawTimers(); toast(`Minuteur ${min} min lancé`);
  if(window.Notification&&Notification.permission==="default") Notification.requestPermission().catch(()=>{}); }
function beep(){ try{ const c=new (window.AudioContext||window.webkitAudioContext)(); [0,.35,.7].forEach(t=>{ const o=c.createOscillator(), g=c.createGain(); o.frequency.value=880; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(.3,c.currentTime+t); g.gain.exponentialRampToValueAtTime(.001,c.currentTime+t+.3); o.start(c.currentTime+t); o.stop(c.currentTime+t+.3); }); }catch(e){} }
function drawTimers(){
  const el=$("#timers"), now=Date.now();
  timers.forEach(t=>{ if(!t.rang&&t.end<=now){ t.rang=1; saveTimers(); beep(); navigator.vibrate&&navigator.vibrate([300,150,300,150,300]);
    try{ if(window.Notification&&Notification.permission==="granted") new Notification("⏱ C'est prêt",{body:t.label}); }catch(e){} } });
  el.innerHTML=timers.map(t=>{ const s=Math.max(0,Math.round((t.end-now)/1000)); return `<div class="tm ${s?"":"ring"}"><span>⏱ ${esc(t.label)}</span><b>${s?Math.floor(s/60)+":"+pad(s%60):"Prêt !"}</b><button data-a="tstop" data-v="${t.id}" aria-label="Arrêter">✕</button></div>`; }).join("");
}
setInterval(()=>{ if(timers.length) drawTimers(); },1000);

/* ---------- Synchro : un fichier privé (gist) de ton compte GitHub ---------- */
const GH={file:"plan-alimentaire.json",desc:"Plan alimentaire · synchro (ne pas supprimer)"};
let gh=null, ghT=0, ghPushTimer=null, ghDirty=false, ghBusy=false;
try{ gh=JSON.parse(localStorage.getItem("plan-gh")||"null"); ghT=+localStorage.getItem("plan-gh-t")||0; }catch(e){}
const hhmm = () => new Date().toTimeString().slice(0,5);
const ghErr = e => setSync(e&&e.code===401?"Synchro : clé GitHub refusée (Réglages)":"Pas de connexion : enregistré sur cet appareil");
const ghSetT = t => { ghT=t; try{ localStorage.setItem("plan-gh-t",String(t)); }catch(e){} };
function ghApi(path,opt){
  return fetch("https://api.github.com"+path,Object.assign({cache:"no-store"},opt||{},{headers:{Authorization:"Bearer "+gh.token,Accept:"application/vnd.github+json","Content-Type":"application/json"}}))
    .then(r=>{ if(!r.ok) throw {code:r.status}; return r.json(); });
}
async function ghRead(){
  const g=await ghApi("/gists/"+gh.id), f=g.files&&g.files[GH.file]; if(!f) return null;
  const txt=f.truncated ? await fetch(f.raw_url,{cache:"no-store"}).then(r=>r.text()) : f.content;
  return JSON.parse(txt);
}
function ghPushSoon(){ if(!gh||!gh.id) return; ghDirty=true; clearTimeout(ghPushTimer); ghPushTimer=setTimeout(ghPush,1500); }
async function ghPush(){
  if(!gh||!gh.id) return; if(ghBusy){ ghPushSoon(); return; }
  ghBusy=true; const t=Date.now();
  try{ await ghApi("/gists/"+gh.id,{method:"PATCH",body:JSON.stringify({files:{[GH.file]:{content:JSON.stringify({t,data:S})}}})}); ghSetT(t); ghDirty=false; setSync("Synchronisé · "+hhmm()); }
  catch(e){ ghErr(e); }
  ghBusy=false;
}
async function ghPull(){
  if(!gh||!gh.id||ghDirty||ghBusy) return; ghBusy=true;
  try{ const r=await ghRead();
    if(r&&r.data&&r.t>ghT&&!ghDirty){ ghSetT(r.t); load(r.data); try{ localStorage.setItem("plan-stephane",JSON.stringify(S)); }catch(e){}
      const busy=view.sheet&&["got","finish"].includes(view.sheet.kind); if(!busy) render(); }
    setSync("Synchronisé · "+hhmm()); }
  catch(e){ ghErr(e); }
  ghBusy=false;
}
async function ghConnect(token){
  gh={token};
  try{
    const list=await ghApi("/gists?per_page=100"), g=list.find(x=>x.files&&x.files[GH.file]);
    if(g){ gh.id=g.id; localStorage.setItem("plan-gh",JSON.stringify(gh)); ghSetT(0); await ghPull(); return "found"; }
    const t=Date.now(), c=await ghApi("/gists",{method:"POST",body:JSON.stringify({description:GH.desc,public:false,files:{[GH.file]:{content:JSON.stringify({t,data:S})}}})});
    gh.id=c.id; localStorage.setItem("plan-gh",JSON.stringify(gh)); ghSetT(t); setSync("Synchronisé · "+hhmm()); return "new";
  }catch(e){ gh=null; throw e; }
}
function ghStart(){
  const tick=()=>{ if(gh&&gh.id&&!document.hidden) ghPull(); };
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden){ render(); tick(); } });
  window.addEventListener("focus",tick); window.addEventListener("online",()=>{ if(ghDirty) ghPush(); tick(); });
  setInterval(tick,30000); tick();
}

/* ---------- Démarrage ---------- */
boot(); render(); drawTimers(); ghStart();
if("serviceWorker" in navigator && location.protocol==="https:") navigator.serviceWorker.register("sw.js").catch(()=>{});
