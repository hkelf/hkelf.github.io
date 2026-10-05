"use strict";
// =====================================================================
// MOTEUR — lit window.GAME_CONFIG (config.js). Aucune valeur de jeu ici.
// =====================================================================
const CFG_KEY='proto-duel-config';
const deep=o=>JSON.parse(JSON.stringify(o));
const FILE_CFG=deep(window.GAME_CONFIG);
let CFG,R;
function loadConfig(){
  CFG=deep(FILE_CFG);
  try{const s=localStorage.getItem(CFG_KEY);if(s)CFG=JSON.parse(s)}catch(e){}
  R=CFG.regles;
  applyTheme();
}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const STATS=['pv','attP','defP','attM','defM','vit'];
const elKeys=()=>Object.keys(CFG.elements);
const elCls=el=>'el'+Math.max(0,elKeys().indexOf(el));
const keyLabel=c=>c.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Numpad/,'Num ');
const isAI=p=>!!((CFG.ia.joueurs||[])[p]);
const bothAI=()=>isAI(0)&&isAI(1);
function D(){const d=CFG.affichage.delais,m=bothAI()?(CFG.affichage.vitesseIaVsIa??1):1,o={};for(const k in d)o[k]=Math.round(d[k]*m);return o}
function aiTurn(){CFG.joueurs.forEach((_,p)=>{if(isAI(p))aiChoose(p)})}

function applyTheme(){
  let css='',dark='';
  elKeys().forEach((k,i)=>{const e=CFG.elements[k];css+=`.el${i}{--el:${e.couleur}}`;dark+=`.el${i}{--el:${e.couleurSombre||e.couleur}}`});
  CFG.joueurs.forEach((j,i)=>{css+=`.pl${i}{--pc:${j.couleur}}`;dark+=`.pl${i}{--pc:${j.couleurSombre||j.couleur}}`});
  const scoped=dark.replace(/\.(el|pl)(\d+)/g,':root:not([data-theme="light"]) .$1$2');
  const forced=dark.replace(/\.(el|pl)(\d+)/g,':root[data-theme="dark"] .$1$2');
  let st=document.getElementById('cfgTheme');if(!st){st=document.createElement('style');st.id='cfgTheme';document.head.appendChild(st)}
  st.textContent=css+`@media (prefers-color-scheme:dark){${scoped}}`+forced;
}

// ================= PLATEAU =================
const lanes=n=>R.cases[n]||R.cases[R.tailleTerrain];
function laneIndex(label,n){
  const L=lanes(n);let i=L.indexOf(label);
  if(i<0){const m=(R.redirection[n]||{})[label];if(m!==undefined)i=L.indexOf(m)}
  return i;
}
function arrondi(x){return R.degats.arrondi==='superieur'?Math.ceil(x):R.degats.arrondi==='proche'?Math.round(x):Math.floor(x)}

// ================= CONSTRUCTION =================
let teams=null,phase='build',G=null;
const teamSize=()=>R.tailleTerrain+R.tailleBanc;
function slotFor(classe,equipement,accessoire,attaques){
  const C=CFG.classes[classe];
  const eq=C.equipements.includes(equipement)?equipement:C.equipements[0];
  const acc=CFG.accessoires[accessoire]?accessoire:Object.keys(CFG.accessoires)[0];
  const mv=(attaques||C.parDefaut||C.movePool).slice(0,R.attaquesParPerso);
  return {classe,equipement:eq,accessoire:acc,attaques:mv.map(id=>({id,canal:CFG.attaques[id].canal||C.canal}))};
}
function defaultTeam(p){
  const d=(CFG.equipesParDefaut||[])[p]||[];const cl=Object.keys(CFG.classes);
  const t=[];for(let i=0;i<teamSize();i++){const s=d[i];t.push(s&&CFG.classes[s.classe]?slotFor(s.classe,s.equipement,s.accessoire,s.attaques):slotFor(cl[i%cl.length]))}
  return t;
}
const maxCl=()=>R.maxParClasse||Infinity;
function classCount(team,c,skip){return team.filter((s,i)=>i!==skip&&s.classe===c).length}
function teamError(team){
  if(!R.maxParClasse)return null;
  const over=Object.keys(CFG.classes).filter(c=>classCount(team,c)>R.maxParClasse);
  return over.length?`Max ${R.maxParClasse} par classe : ${over.join(', ')} en trop.`:null;
}
function randomTeam(){
  const cl=Object.keys(CFG.classes),t=[];
  for(let k=0;k<teamSize();k++){const ok=cl.filter(c=>classCount(t,c)<maxCl());t.push(randOne(ok.length?ok:cl))}
  return t;
}
function randOne(cl){{const c=pick(cl),C=CFG.classes[c];
    return slotFor(c,pick(C.equipements),pick(Object.keys(CFG.accessoires)),shuffle(C.movePool.slice()).slice(0,R.attaquesParPerso))}
}
function statsOf(slot){
  const C=CFG.classes[slot.classe],em=CFG.equipements[slot.equipement].mods||{},am=CFG.accessoires[slot.accessoire].mods||{},s={};
  for(const k of STATS) s[k]=Math.max(k==='pv'?1:0,(C.stats[k]||0)+(em[k]||0)+(am[k]||0));
  return s;
}
const statLine=st=>STATS.map(k=>`${CFG.stats[k]} ${st[k]}`).join(' · ');
const posName=i=>i<R.tailleTerrain?cap(lanes(R.tailleTerrain)[i]):`Banc${R.tailleBanc>1?' '+(i-R.tailleTerrain+1):''}`;
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function accDesc(id){const A=CFG.accessoires[id];const m=Object.entries(A.mods||{}).map(([k,v])=>`${CFG.stats[k]} ${v>0?'+':''}${v}`);
  const e=(A.effets||[]).map(f=>({survie:`survit à 1 PV (${f.utilisations}×)`,antiRacines:`annule Racines (${f.utilisations}×)`,verrouChoix:'bloqué sur sa 1re attaque',rage:`+${f.bonusDegats} dégât/coup, −${f.coutPV} PV/attaque`,antiBaisse:`annule une baisse de stats (${f.utilisations}×)`,soinFinDeTour:`+${f.montant} PV en fin de tour`}[f.type]||f.type));
  return [...m,...e].join(', ');}
function moveDesc(M){
  const c=CFG.ciblages[M.cible];const parts=[c?c.nom:M.cible];
  if(M.priorite) parts.push(`priorité ${M.priorite>0?'+':''}${M.priorite}`);
  for(const f of M.effets||[]) parts.push({soin:`soigne ${f.montant}`,regeneration:`soigne ${f.montant} au début des ${f.tours} prochains tours`,racines:`racines ${f.tours} tour(s)`,drain:`draine ${f.ratio*100}%`,contrecoup:`contrecoup ${f.montant}`,pousser:`pousse de ${f.cases}`,tirer:`tire de ${f.cases}`,echangerCibles:'échange les cibles',defense:`Déf +${f.bonus} (${f.tours} tour(s))${f.inamovible?', inamovible':''}`,deplacerSoi:`se déplace (${f.direction})`,modStats:`${f.sur==='cibles'?'cibles':f.sur==='lanceur'?'soi':'allié devant'} : ${Object.entries(f.stats||{}).map(([k,v])=>`${CFG.stats[k]} ${v>0?'+':''}${v}`).join(', ')}${f.tours!=null?` (${f.tours} tour(s))`:''}`}[f.type]||f.type);
  return parts.join(' — ');
}

function renderBuilder(){
  phase='build';G=null;
  document.getElementById('btnBack').classList.add('hidden');
  const app=document.getElementById('app');
  app.innerHTML=`<div class="builder">${CFG.joueurs.map((_,p)=>teamHTML(p)).join('')}</div>
  <div class="options">
    <label><input type="checkbox" data-opt="bonusElementActif" ${R.degats.bonusElementActif?'checked':''}> Bonus d’élément (+${R.degats.bonusElement} Puissance)</label>
    <label><input type="checkbox" data-opt="bonusFatigueActif" ${R.degats.bonusFatigueActif?'checked':''}> Fatigué : +${R.degats.bonusFatigue} dégât reçu</label>
    ${CFG.joueurs.map((j,p)=>`<label><input type="checkbox" data-opt="ia${p}" ${isAI(p)?'checked':''}> ${esc(j.nom)} : IA</label>`).join('')}
    <label><input type="checkbox" data-opt="banc" ${CFG.affichage.banVisible?'checked':''}> Banc visible (test)</label>
    <button class="primary go" id="go">Lancer le combat</button>
  </div>
  ${keysHTML()}${cfgHTML()}`;
  app.querySelectorAll('[data-opt]').forEach(el=>el.onchange=()=>{const k=el.dataset.opt;
    if(k.startsWith('ia')){CFG.ia.joueurs=CFG.ia.joueurs||[false,false];CFG.ia.joueurs[+k.slice(2)]=el.checked}else if(k==='banc')CFG.affichage.banVisible=el.checked;else R.degats[k]=el.checked});
  app.querySelector('#go').onclick=startGame;
  bindCfg();
  app.querySelectorAll('[data-act]').forEach(el=>{
    const p=+el.dataset.p,i=+el.dataset.i,a=el.dataset.act;
    const ev=el.tagName==='SELECT'||el.type==='checkbox'?'onchange':'onclick';
    el[ev]=e=>{
      const s=teams[p][i],n=teams[p].length;
      if(a==='def')teams[p]=defaultTeam(p);
      else if(a==='rnd')teams[p]=randomTeam();
      else if(a==='cls')teams[p][i]=slotFor(el.value);
      else if(a==='eq')s.equipement=el.value;
      else if(a==='acc')s.accessoire=el.value;
      else if(a==='up'&&i>0)[teams[p][i-1],teams[p][i]]=[teams[p][i],teams[p][i-1]];
      else if(a==='down'&&i<n-1)[teams[p][i+1],teams[p][i]]=[teams[p][i],teams[p][i+1]];
      else if(a==='mv'){const id=el.dataset.m,ix=s.attaques.findIndex(m=>m.id===id);
        if(ix>=0)s.attaques.splice(ix,1);
        else if(s.attaques.length<R.attaquesParPerso)s.attaques.push({id,canal:CFG.attaques[id].canal||CFG.classes[s.classe].canal});
        else{el.checked=false;return}}
      else if(a==='ch'){e.preventDefault();e.stopPropagation();const m=s.attaques.find(m=>m.id===el.dataset.m);if(m)m.canal=m.canal==='P'?'M':'P'}
      renderBuilder();
    };
  });
}
function teamHTML(p){
  return `<section class="team pl${p}"><h2>${esc(CFG.joueurs[p].nom)}<span class="acts">
    <button data-act="def" data-p="${p}" data-i="0">Par défaut</button>
    <button data-act="rnd" data-p="${p}" data-i="0">Aléatoire</button></span></h2>
    ${teamError(teams[p])?`<p class="msg err" style="color:var(--bad);margin:.2rem 0">${esc(teamError(teams[p]))}</p>`:R.maxParClasse?`<p class="stats" style="margin:.2rem 0">${R.maxParClasse===1?'Une seule fois chaque classe':`${R.maxParClasse} fois max chaque classe`}.</p>`:''}
    ${teams[p].map((s,i)=>{const C=CFG.classes[s.classe],st=statsOf(s),n=teams[p].length;
      return `<div class="slot"><div class="pos">${esc(posName(i))}<span class="ord">
        <button data-act="up" data-p="${p}" data-i="${i}" aria-label="Monter" ${i===0?'disabled':''}>▲</button>
        <button data-act="down" data-p="${p}" data-i="${i}" aria-label="Descendre" ${i===n-1?'disabled':''}>▼</button></span></div>
      <div>
        <div class="row">
          <select data-act="cls" data-p="${p}" data-i="${i}" aria-label="Classe">${Object.keys(CFG.classes).map(c=>`<option ${c===s.classe?'selected':''} ${c!==s.classe&&classCount(teams[p],c,i)>=maxCl()?'disabled':''}>${esc(c)}</option>`).join('')}</select>
          <select data-act="eq" data-p="${p}" data-i="${i}" aria-label="Équipement">${C.equipements.map(e=>{const E=CFG.equipements[e];return `<option value="${e}" ${e===s.equipement?'selected':''}>${CFG.elements[E.element].glyphe} ${esc(E.nom)} (${esc(E.element)})</option>`}).join('')}</select>
          <select data-act="acc" data-p="${p}" data-i="${i}" aria-label="Accessoire">${Object.entries(CFG.accessoires).map(([k,a])=>`<option value="${k}" ${k===s.accessoire?'selected':''}>${esc(a.nom)}</option>`).join('')}</select>
        </div>
        <div class="stats">${statLine(st)}${accDesc(s.accessoire)?' — '+esc(accDesc(s.accessoire)):''}</div>
        <div class="row" style="margin-top:.3rem">${C.movePool.map(id=>{const M=CFG.attaques[id],sel=s.attaques.find(m=>m.id===id);
          return `<label class="chip ${elCls(M.element)} ${sel?'on':''}" data-tip="pool" data-m="${id}" data-cls="${esc(s.classe)}" data-ch="${sel?sel.canal:C.canal}" data-eq="${s.equipement}">
            <input type="checkbox" data-act="mv" data-p="${p}" data-i="${i}" data-m="${id}" ${sel?'checked':''}>
            <span class="dot"></span>${esc(M.nom)}${M.puissance?' '+M.puissance:''}
            ${sel&&M.puissance&&R.canalModifiable?`<span class="ch" data-act="ch" data-p="${p}" data-i="${i}" data-m="${id}" title="Canal : clic pour basculer">${sel.canal}</span>`:''}</label>`}).join('')}
          <span class="stats">${s.attaques.length}/${R.attaquesParPerso}</span></div>
      </div></div>`}).join('')}
  </section>`;
}
function keysHTML(){
  const M=CFG.manette;
  return `<div class="keys">${CFG.joueurs.map((j,p)=>{const K=j.clavier;return `<div><b class="pl${p} pc">${esc(j.nom)}</b> — tenir <kbd>${keyLabel(K.gachetteGauche)}</kbd> (gauche) ou <kbd>${keyLabel(K.gachetteDroite)}</kbd> (droite), rien pour le milieu, puis <kbd>${K.boutons.map(keyLabel).join('</kbd> <kbd>')}</kbd>. Switch : gâchette + <kbd>${keyLabel(K.switch)}</kbd>. Manette ${p+1} : gâchettes, ${M.nomsBoutons.join(' ')}, switch sur bumper.</div>`}).join('')}</div>`;
}

// ================= ÉDITEUR DE CONFIG =================
function cfgHTML(){
  let over=false;try{over=!!localStorage.getItem(CFG_KEY)}catch(e){}
  return `<details class="cfg"><summary>Configuration ${over?'(modifiée dans le navigateur)':'(fichier config.js)'}</summary>
    <p class="msg">Source : <code>config.js</code>. Les modifications faites ici restent dans ce navigateur et remplacent le fichier.</p>
    <textarea id="cfgText" spellcheck="false">${esc(JSON.stringify(CFG,null,2))}</textarea>
    <div class="row"><button id="cfgApply" class="primary">Appliquer</button><button id="cfgReset">Revenir au fichier</button><span class="msg" id="cfgMsg"></span></div></details>`;
}
function bindCfg(){
  const msg=document.getElementById('cfgMsg');
  document.getElementById('cfgApply').onclick=()=>{
    let c;try{c=JSON.parse(document.getElementById('cfgText').value)}catch(e){msg.className='msg err';msg.textContent='JSON invalide : '+e.message;return}
    const err=validate(c);if(err){msg.className='msg err';msg.textContent=err;return}
    try{localStorage.setItem(CFG_KEY,JSON.stringify(c))}catch(e){}
    CFG=c;R=CFG.regles;applyTheme();teams=CFG.joueurs.map((_,p)=>defaultTeam(p));renderBuilder();
  };
  document.getElementById('cfgReset').onclick=()=>{try{localStorage.removeItem(CFG_KEY)}catch(e){}loadConfig();teams=CFG.joueurs.map((_,p)=>defaultTeam(p));renderBuilder()};
}
function validate(c){
  const need=['regles','elements','ciblages','stats','attaques','movePoolUniversel','equipements','accessoires','classes','joueurs','manette','ia','affichage'];
  for(const k of need) if(!c[k]) return `Section manquante : ${k}`;
  if(c.joueurs.length!==2) return 'Il faut exactement 2 joueurs.';
  for(const [id,M] of Object.entries(c.attaques)){if(!c.elements[M.element])return `Attaque ${id} : élément inconnu ${M.element}`;if(!c.ciblages[M.cible])return `Attaque ${id} : ciblage inconnu ${M.cible}`}
  for(const id of c.movePoolUniversel) if(!c.attaques[id]) return `Move pool universel : attaque inconnue ${id}`;
  for(const [id,E] of Object.entries(c.equipements)) if(!c.elements[E.element]) return `Équipement ${id} : élément inconnu`;
  for(const [n,C] of Object.entries(c.classes)){
    for(const e of C.equipements) if(!c.equipements[e]) return `Classe ${n} : équipement inconnu ${e}`;
    for(const a of C.movePool) if(!c.attaques[a]) return `Classe ${n} : attaque inconnue ${a}`;
    if(C.movePool.length<c.regles.attaquesParPerso) return `Classe ${n} : move pool trop court`;
  }
  if(!c.regles.cases[c.regles.tailleTerrain]) return 'regles.cases doit définir la taille du terrain.';
  return null;
}

// ================= PARTIE =================
let uid=0;
const accFx=(u,type)=>(CFG.accessoires[u.acc].effets||[]).find(f=>f.type===type);
function mkUnit(slot,p){
  const st=statsOf(slot);
  return {uid:++uid,p,classe:slot.classe,eq:slot.equipement,el:CFG.equipements[slot.equipement].element,acc:slot.accessoire,
    attaques:slot.attaques.map(m=>({...m})),max:st.pv,pv:st.pv,st,fatigue:false,agi:false,racines:-1,buffs:[],regen:null,
    uses:{},verrou:null,revele:false,ko:false};
}
function startGame(){
  for(const p of [0,1]){const er=teamError(teams[p]);if(er){alert(`${CFG.joueurs[p].nom} : ${er}`);return}}
  for(const p of [0,1]) for(const s of teams[p]) if(s.attaques.length!==R.attaquesParPerso){alert(`${CFG.joueurs[p].nom} : ${s.classe} doit avoir ${R.attaquesParPerso} attaques (${s.attaques.length}).`);return}
  uid=0;
  G={tour:1,camps:[0,1].map(p=>({terrain:teams[p].slice(0,R.tailleTerrain).map(s=>mkUnit(s,p)),banc:teams[p].slice(R.tailleTerrain).map(s=>mkUnit(s,p))})),choix:[null,null],log:[],fin:null};
  G.camps.forEach(S=>S.terrain.forEach(u=>u.revele=true));
  addLog('t','Tour 1');phase='choose';
  document.getElementById('btnBack').classList.remove('hidden');
  renderArena();aiTurn();
}
const benchReady=S=>S.banc.find(b=>!b.ko);
function triggerIndex(p,trig){const S=G.camps[p],n=S.terrain.length;const sel=(CFG.joueurs[p].selection[n]||{})[trig];return laneIndex(sel,n)}
function triggerHint(p,i){
  const n=G.camps[p].terrain.length,K=CFG.joueurs[p].clavier;
  const t=['gauche','droite','aucune'].filter(tr=>triggerIndex(p,tr)===i);
  return t.map(tr=>tr==='gauche'?keyLabel(K.gachetteGauche):tr==='droite'?keyLabel(K.gachetteDroite):'—').join(' ')||'';
}
// ---- positions de lancement ----
function caseOf(u){const S=G.camps[u.p],i=S.terrain.indexOf(u);return i<0?null:lanes(S.terrain.length)[i]}
function canLaunch(u,M){
  const PL=R.positionsLancement;if(!PL||!PL.actives||!M.depuis||!M.depuis.length)return true;
  const S=G.camps[u.p],n=S.terrain.length,i=S.terrain.indexOf(u);if(i<0)return false;
  return M.depuis.some(l=>laneIndex(l,n)===i);
}
const ownMoves=u=>u.verrou?u.attaques.filter(m=>m.id===u.verrou):u.attaques;
function outOfPosition(u){const PL=R.positionsLancement;return !!(PL&&PL.actives&&PL.repliSiAucune&&!ownMoves(u).some(m=>canLaunch(u,CFG.attaques[m.id])))}
const usesUniversal=u=>u.fatigue||outOfPosition(u);
function movesFor(u){return usesUniversal(u)?CFG.movePoolUniversel.map(id=>({id,canal:CFG.attaques[id].canal||CFG.classes[u.classe].canal})):u.attaques}
function moveAllowed(u,k){const ms=movesFor(u);if(!ms[k])return false;if(usesUniversal(u))return true;if(u.verrou&&ms[k].id!==u.verrou)return false;return canLaunch(u,CFG.attaques[ms[k].id])}
const rooted=u=>u.racines>=G.tour;
function canSwitch(p,u){return R.switch.actif&&!!benchReady(G.camps[p])&&!(R.switch.bloqueParRacines&&rooted(u))}
function submit(p,c){
  if(phase!=='choose'||G.choix[p])return false;
  const u=G.camps[p].terrain[c.idx];if(!u||u.ko)return false;
  if(c.kind==='move'&&!moveAllowed(u,c.k))return flashReady(p);
  if(c.kind==='switch'&&!canSwitch(p,u))return flashReady(p);
  G.choix[p]={...c,u};renderArena();
  if(G.choix[0]&&G.choix[1])resolveTurn();
  return true;
}
function flashReady(p){const el=document.querySelector(`.ready.pl${p}`);if(el){el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}return false}

// ================= RÉSOLUTION =================
const uname=u=>`<span class="pl${u.p} pc">${esc(u.classe)} ${CFG.elements[u.el].glyphe}</span>`;
function addLog(cls,html){G.log.push({cls,html})}
function affinity(a,d){if(a===R.elementNeutre)return 1;if((CFG.elements[a].bat||[]).includes(d))return 2;if((CFG.elements[d]?.bat||[]).includes(a))return .5;return 1}
const buffDef=u=>u.buffs.filter(b=>b.jusqua>=G.tour).reduce((s,b)=>s+b.bonus,0);
const immovable=u=>!u||rooted(u)||u.buffs.some(b=>b.jusqua>=G.tour&&b.inamovible);
// ---- modificateurs de stats (setup / debuff) ----
function modOf(u,k){const cap=(R.modificateurs||{}).plafond??2;const s=(u.mods||[]).filter(m=>m.jusqua==null||m.jusqua>=G.tour).reduce((a,m)=>a+(m.stats[k]||0),0);return Math.max(-cap,Math.min(cap,s))}
function stat(u,k){return Math.max(0,u.st[k]+modOf(u,k))}
const statName=k=>CFG.stats[k]||k;
function applyMods(src,t,stats,tours,M){
  const hostile=src.p!==t.p&&Object.values(stats).some(v=>v<0);
  const ab=hostile&&accFx(t,'antiBaisse');
  if(ab&&(t.uses.antiBaisse||0)<ab.utilisations){t.uses.antiBaisse=(t.uses.antiBaisse||0)+1;addLog('',`${uname(t)} annule la baisse (${esc(CFG.accessoires[t.acc].nom)}).`);return}
  const before={};for(const k in stats)before[k]=modOf(t,k);
  t.mods=t.mods||[];t.mods.push({stats:{...stats},jusqua:tours==null?null:G.tour+tours});
  const txt=Object.keys(stats).map(k=>{const d=modOf(t,k)-before[k];return d?`${statName(k)} ${d>0?'+':''}${d}`:`${statName(k)} au plafond`}).join(', ');
  addLog('',`${uname(t)} : ${txt}.`);
}
function defOf(u,ch){return stat(u,ch==='P'?'defP':'defM')+buffDef(u)}
function calcDamage(a,d,M,ch){
  const Dg=R.degats;
  const pow=M.puissance+(Dg.bonusElementActif&&M.element===a.el?Dg.bonusElement:0);
  const base=pow+stat(a,ch==='P'?'attP':'attM')-defOf(d,ch);
  const aff=affinity(M.element,d.el);
  let v=aff===2?base*Dg.multAvantage:aff===.5?arrondi(base/Dg.divDesavantage):base;
  v=Math.max(Dg.minimum,v);
  if(Dg.bonusFatigueActif&&d.fatigue)v+=Dg.bonusFatigue;
  const rg=accFx(a,'rage');if(rg)v+=rg.bonusDegats;
  return {v,aff};
}
function swapIdx(f,i,j){if(i<0||j<0||i>=f.length||j>=f.length||i===j)return false;[f[i],f[j]]=[f[j],f[i]];return true}
function targetsOf(u,M,me,foe){
  const myI=me.terrain.indexOf(u),n=foe.terrain.length;
  if(M.cible==='enFace'){const lbl=lanes(me.terrain.length)[myI];return [laneIndex(lbl,n)]}
  return CFG.ciblages[M.cible].cases.map(l=>laneIndex(l,n));
}
async function resolveTurn(){
  phase='resolve';
  const acts=[0,1].map(p=>{const c=G.choix[p];const m=c.kind==='move'?movesFor(c.u)[c.k]:null;const M=m?CFG.attaques[m.id]:null;
    return {...c,p,M,ch:m?m.canal:null,prio:c.kind==='switch'?R.switch.priorite:(M.priorite||0),spd:stat(c.u,'vit'),tie:Math.random()}});
  for(const a of acts)addLog('',`${uname(a.u)} : ${a.kind==='switch'?'switch':`<b>${esc(a.M.nom)}</b>`}`);
  const tb=R.departage==='joueur1'?(x,y)=>x.p-y.p:R.departage==='joueur2'?(x,y)=>y.p-x.p:(x,y)=>x.tie-y.tie;
  acts.sort((x,y)=>y.prio-x.prio||y.spd-x.spd||tb(x,y));
  if(acts[0].prio===acts[1].prio&&acts[0].spd===acts[1].spd)addLog('',`Égalité de priorité et de Vitesse : départage (${R.departage}).`);
  renderArena();await sleep(D().revelation);
  for(const a of acts){
    if(G.fin)break;
    if(a.u.ko){addLog('',`${uname(a.u)} est K.O. et n’agit pas.`);renderArena();await sleep(D().ko);continue}
    if(!G.camps[a.p].terrain.includes(a.u))continue;
    await execute(a);renderArena();await sleep(D().entreActions);
  }
  endTurn();
}
async function execute(a){
  const me=G.camps[a.p],foe=G.camps[1-a.p],u=a.u;
  pending.acting=null;
  if(a.kind==='switch'){
    if(R.switch.bloqueParRacines&&rooted(u)){addLog('',`${uname(u)} est enraciné, le switch échoue.`);return}
    const i=me.terrain.indexOf(u),bi=me.banc.findIndex(b=>!b.ko),b=me.banc[bi];
    me.banc.splice(bi,1);me.terrain[i]=b;me.banc.push(u);
    if(R.fatigue.bancEfface){u.fatigue=false}u.agi=false;u.verrou=null;u.buffs=[];if(!R.modificateurs||R.modificateurs.reinitialiseAuBanc!==false)u.mods=[];
    b.fatigue=false;b.agi=!!R.fatigue.switchFatigue;b.revele=true;
    addLog('',`${uname(u)} sort, ${uname(b)} entre en ${lanes(me.terrain.length)[i]}.`);
    animate(b,[]);await sleep(D().switch);return;
  }
  const M=a.M;u.agi=true;
  if(R.positionsLancement&&R.positionsLancement.verifieeALaResolution&&!canLaunch(u,M)){addLog('',`${uname(u)} n’est plus en position (${caseOf(u)}) : ${esc(M.nom)} échoue.`);animate(u,[]);await sleep(D().action);return}
  if(accFx(u,'verrouChoix')&&!usesUniversal(u)&&!u.verrou&&u.attaques.some(m=>m.id===a.M.id))u.verrou=a.M.id;
  animate(u,[]);await sleep(D().action);
  const myI=me.terrain.indexOf(u);
  if(M.cible==='soi'||M.cible==='allieDevant'){
    const tgt=M.cible==='soi'?u:(myI>0?me.terrain[myI-1]:u);
    for(const f of M.effets||[]) applySelfEffect(f,u,tgt,me,M);
    return;
  }
  const idxs=targetsOf(u,M,me,foe);
  const per=new Map();idxs.forEach(i=>per.set(i,(per.get(i)||0)+1));
  let total=0;const touched=[];
  for(const [i,n] of per){
    const t=foe.terrain[i];
    if(i<0||!t||t.ko){addLog('',`${esc(M.nom)} frappe une case vide.`);continue}
    if(!M.puissance){touched.push(t);continue}
    for(let h=0;h<n;h++){
      if(t.ko)break;
      const {v,aff}=calcDamage(u,t,M,a.ch);const dealt=damage(t,v,false);total+=dealt;touched.push(t);
      addLog('',`${esc(M.nom)} → ${uname(t)} (${lanes(foe.terrain.length)[i]}) : <b>${v}</b>${aff===2?` (avantage ×${R.degats.multAvantage})`:aff===.5?` (désavantage ÷${R.degats.divDesavantage})`:''}${n>1?` [coup ${h+1}/${n}]`:''}${t.ko?' — K.O.':''}`);
      floatNum(t,-v);
    }
  }
  animate(u,touched);await sleep(D().impact);
  const uniq=[...new Set(touched)].filter(t=>!t.ko);
  for(const f of M.effets||[]){
    if(f.type==='drain'&&total>0){const h=Math.floor(total*f.ratio);if(h){heal(u,h);addLog('',`${uname(u)} draine ${h} PV.`)}}
    else if(f.type==='contrecoup'){damage(u,f.montant,true);addLog('',`${uname(u)} subit ${f.montant} de contrecoup.`)}
    else if(f.type==='racines'){for(const t of uniq){const ar=accFx(t,'antiRacines');
      if(ar&&(t.uses.antiRacines||0)<ar.utilisations){t.uses.antiRacines=(t.uses.antiRacines||0)+1;addLog('',`${uname(t)} annule Racines (${esc(CFG.accessoires[t.acc].nom)}).`)}
      else{t.racines=Math.max(t.racines,G.tour+f.tours);addLog('',`${uname(t)} est enraciné.`)}}}
    else if(f.type==='pousser'||f.type==='tirer'){
      let i=idxs[0];const t=foe.terrain[i];if(!t||t.ko)continue;const dir=f.type==='pousser'?1:-1;let moved=false;
      for(let s=0;s<f.cases;s++){const j=i+dir;if(j<0||j>=foe.terrain.length||immovable(t)||immovable(foe.terrain[j]))break;swapIdx(foe.terrain,i,j);i=j;moved=true}
      addLog('',moved?`${uname(t)} est ${f.type==='pousser'?'poussé':'tiré'} en ${lanes(foe.terrain.length)[i]}.`:`${uname(t)} ne bouge pas.`);
    }
    else if(f.type==='echangerCibles'){const d=[...new Set(idxs)].filter(i=>i>=0);
      if(d.length>=2){if(immovable(foe.terrain[d[0]])||immovable(foe.terrain[d[1]]))addLog('','L’échange est bloqué.');else{swapIdx(foe.terrain,d[0],d[1]);addLog('','Les deux cibles échangent leur place.')}}}
    else if(f.type==='modStats'){
      if(f.sur==='cibles')for(const t of uniq)applyMods(u,t,f.stats,f.tours,M);
      else if(!u.ko)applyMods(u,u,f.stats,f.tours,M);
    }
    else if(f.type==='defense'||f.type==='deplacerSoi'||f.type==='soin'||f.type==='regeneration') applySelfEffect(f,u,u,me,M);
  }
  const rg=accFx(u,'rage');if(rg&&!u.ko&&M.puissance){damage(u,rg.coutPV,true);addLog('',`${uname(u)} perd ${rg.coutPV} PV (${esc(CFG.accessoires[u.acc].nom)}).`)}
}
function applySelfEffect(f,u,tgt,me,M){
  const myI=me.terrain.indexOf(u);
  if(f.type==='soin'){if(tgt.ko)addLog('','Aucun allié à soigner.');else{heal(tgt,f.montant);addLog('',`${uname(u)} soigne ${uname(tgt)}.`)}}
  else if(f.type==='modStats'){const t=f.sur==='lanceur'?u:tgt;if(t.ko)addLog('','Aucun allié à renforcer.');else applyMods(u,t,f.stats,f.tours,M)}
  else if(f.type==='regeneration'){tgt.regen={montant:f.montant,restant:f.tours};addLog('',`${uname(tgt)} se régénérera.`)}
  else if(f.type==='defense'){u.buffs.push({bonus:f.bonus,jusqua:G.tour+f.tours,inamovible:!!f.inamovible});addLog('',`${uname(u)} : ${esc(M.nom)} (Déf +${f.bonus}).`)}
  else if(f.type==='deplacerSoi'){
    const j=f.direction==='avant'?myI-1:f.direction==='arriere'?myI+1:(myI<me.terrain.length-1?myI+1:myI-1);
    const o=me.terrain[j];
    if(j<0||j>=me.terrain.length)addLog('',`${uname(u)} n’a nulle part où aller.`);
    else if(immovable(u)||immovable(o))addLog('',`${uname(u)} ne peut pas bouger.`);
    else{swapIdx(me.terrain,myI,j);addLog('',`${uname(u)} passe en ${lanes(me.terrain.length)[j]}.`)}
  }
}
function damage(t,v,self){
  let left=t.pv-v;const sv=accFx(t,'survie');
  if(left<=0&&sv&&!self&&(t.uses.survie||0)<sv.utilisations&&t.pv>=sv.seuilPV*t.max){t.uses.survie=(t.uses.survie||0)+1;left=1;addLog('',`${uname(t)} tient à 1 PV (${esc(CFG.accessoires[t.acc].nom)}).`)}
  const dealt=t.pv-Math.max(0,left);t.pv=Math.max(0,left);if(t.pv===0)t.ko=true;return dealt;
}
function heal(t,v){const h=Math.min(v,t.max-t.pv);t.pv+=h;if(h)floatNum(t,h);return h}
const aliveCount=S=>S.terrain.filter(u=>!u.ko).length+S.banc.filter(b=>!b.ko).length;
function endTurn(){
  pending.acting=null;
  G.camps.forEach((S,p)=>{
    const fat=R.fatigue.active&&aliveCount(S)>=R.fatigue.minPersosDebout;
    for(const u of S.terrain){if(u.ko)continue;u.fatigue=fat&&u.agi;u.agi=false;
      const b=accFx(u,'soinFinDeTour');if(b&&u.pv<u.max){heal(u,b.montant);addLog('',`${uname(u)} regagne ${b.montant} PV.`)}}
    S.terrain.forEach((u,i)=>{if(u.ko&&R.remplacementAuto){const bi=S.banc.findIndex(b=>!b.ko);if(bi>=0){const b=S.banc.splice(bi,1)[0];b.revele=true;b.fatigue=false;b.agi=false;S.terrain[i]=b;addLog('',`${uname(b)} entre en ${lanes(S.terrain.length)[i]}.`)}}});
    if(R.plateauRetrecit){const before=S.terrain.length;S.terrain=S.terrain.filter(u=>!u.ko);
      if(S.terrain.length<before&&S.terrain.length)addLog('',`Plateau de ${esc(CFG.joueurs[p].nom)} : ${S.terrain.length} case${S.terrain.length>1?'s':''}.`)}
  });
  const alive=G.camps.map(aliveCount);
  if(!alive[0]||!alive[1])return finish(!alive[0]&&!alive[1]?'Égalité':`Victoire de ${CFG.joueurs[alive[0]?0:1].nom}`);
  if(R.limiteTours&&G.tour>=R.limiteTours){
    const hp=G.camps.map(S=>[...S.terrain,...S.banc].reduce((s,u)=>s+(u.ko?0:u.pv),0));
    const w=alive[0]!==alive[1]?(alive[0]>alive[1]?0:1):hp[0]!==hp[1]?(hp[0]>hp[1]?0:1):-1;
    return finish(`Limite de tours atteinte — ${w<0?'égalité':'victoire de '+CFG.joueurs[w].nom}`);
  }
  G.tour++;G.choix=[null,null];addLog('t',`Tour ${G.tour}`);
  for(const S of G.camps)for(const u of S.terrain)if(u.regen&&u.regen.restant>0){u.regen.restant--;const h=heal(u,u.regen.montant);if(h)addLog('',`${uname(u)} se régénère (+${h}).`);if(!u.regen.restant)u.regen=null}
  phase='choose';renderArena();aiTurn();
}
function finish(txt){G.fin=txt;addLog('t',txt);phase='over';renderArena()}

// ================= IA =================
function aiChoose(p){
  const S=G.camps[p],F=G.camps[1-p],W=CFG.ia,c=[];
  S.terrain.forEach((u,i)=>{
    movesFor(u).forEach((m,k)=>{if(!moveAllowed(u,k))return;const M=CFG.attaques[m.id];let sc=Math.random()*W.hasard;
      if(M.cible==='soi'||M.cible==='allieDevant'){for(const f of M.effets||[]){
        if(f.type==='soin'||f.type==='regeneration')sc+=u.max-u.pv>W.seuilBlessure?W.soinSiBlesse:W.soinSinon;
        else if(f.type==='defense')sc+=f.inamovible?W.defense:W.garde;
        else if(f.type==='modStats'){const t=f.sur==='lanceur'?u:(i>0?S.terrain[i-1]:u);const pts=Object.entries(f.stats).reduce((a,[k,v])=>a+Math.max(0,Math.min(v,((R.modificateurs||{}).plafond??2)-modOf(t,k))),0);sc+=u.pv>=u.max*W.seuilPVSetup?pts*W.setupParPoint:pts*W.setupParPoint*.3}
        else sc+=W.deplacement}}
      else{const deb=(M.effets||[]).filter(f=>f.type==='modStats'&&f.sur==='cibles');
        for(const j of targetsOf(u,M,S,F)){const t=F.terrain[j];if(!t||t.ko)continue;
          if(M.puissance){const {v}=calcDamage(u,t,M,m.canal);sc+=v+(v>=t.pv?W.bonusKO:0)}
          for(const f of deb)sc+=Object.entries(f.stats).reduce((a,[k,v])=>a+Math.max(0,Math.min(-v,((R.modificateurs||{}).plafond??2)+modOf(t,k))),0)*W.debuffParPoint}}
      if(u.fatigue)sc-=W.malusFatigue;
      c.push({sc,c:{kind:'move',idx:i,k}});
    });
    if(canSwitch(p,u))c.push({sc:(u.pv<u.max*W.seuilPVBas?W.switchPVBas:W.switchSinon)+Math.random()*W.hasard+(u.fatigue?W.switchSiFatigue:0),c:{kind:'switch',idx:i}});
  });
  c.sort((a,b)=>b.sc-a.sc);
  setTimeout(()=>{if(c[0])submit(p,c[0].c)},D().ia);
}

// ================= ENTRÉES =================
const held=new Set();
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!document.getElementById('recap').classList.contains('hidden')){closeRecap();return}
  if(e.repeat||e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT'||!document.getElementById('recap').classList.contains('hidden'))return;held.add(e.code);
  if(phase!=='choose')return;
  CFG.joueurs.forEach((j,p)=>{
    if(isAI(p))return;
    const K=j.clavier,b=K.boutons.indexOf(e.code),isS=e.code===K.switch;
    if(b<0&&!isS)return;e.preventDefault();
    const trig=held.has(K.gachetteGauche)?'gauche':held.has(K.gachetteDroite)?'droite':'aucune';
    const idx=triggerIndex(p,trig);
    submit(p,isS?{kind:'switch',idx}:{kind:'move',idx,k:b});
  });
});
addEventListener('keyup',e=>held.delete(e.code));
addEventListener('blur',()=>held.clear());
const padPrev={};
function pollPads(){
  const pads=navigator.getGamepads?navigator.getGamepads():[],M=CFG.manette;
  for(const p of [0,1]){
    const gp=pads[p];if(!gp)continue;
    const prev=padPrev[p]||[],now=gp.buttons.map(b=>b.pressed||b.value>M.seuil);
    if(phase==='choose'&&!isAI(p)){
      const v=i=>gp.buttons[i]&&gp.buttons[i].value>M.seuil;
      const idx=triggerIndex(p,v(M.gachetteGauche)?'gauche':v(M.gachetteDroite)?'droite':'aucune');
      M.boutons.forEach((bi,k)=>{if(now[bi]&&!prev[bi])submit(p,{kind:'move',idx,k})});
      if(M.switch.some(bi=>now[bi]&&!prev[bi]))submit(p,{kind:'switch',idx});
    }
    padPrev[p]=now;
  }
  requestAnimationFrame(pollPads);
}

// ================= RENDU COMBAT =================
function renderArena(){
  const app=document.getElementById('app');
  const sideHTML=p=>{
    const S=G.camps[p],n=S.terrain.length,J=CFG.joueurs[p];
    const bench=S.banc.length?S.banc.map(b=>b.ko?'K.O.':(b.revele||CFG.affichage.banVisible)?`<b>${esc(b.classe)} ${CFG.elements[b.el].glyphe}</b> ${b.pv}/${b.max}`:'<b>???</b>').join(', '):'vide';
    return `<section class="side pl${p} ${J.cote==='gauche'?'rev':''}">
      <div class="sidehead"><span class="pc">${esc(J.nom)}${isAI(p)?' (IA)':''}</span><span class="st">${n} case${n>1?'s':''}</span></div>
      <div class="lineup" style="grid-template-columns:repeat(${Math.max(n,1)},minmax(0,1fr))">${S.terrain.map((u,i)=>cardHTML(u,p,i)).join('')}</div>
      <div class="bench">Banc : ${bench}</div></section>`;
  };
  const rd=p=>`<span class="ready pl${p} ${G.choix[p]?'ok':''}">${esc(CFG.joueurs[p].nom)} ${G.choix[p]?'prêt':'choisit…'}</span>`;
  app.innerHTML=`${G.fin?`<div class="banner">${esc(G.fin)}</div>`:''}
  <div class="arena">${sideHTML(0)}
    <div class="mid"><div class="turn">Tour ${G.tour}</div>${rd(0)}${rd(1)}${G.fin?'<button class="primary" id="again">Rejouer</button>':''}</div>
    ${sideHTML(1)}</div>
  <div class="log" id="log">${G.log.map(l=>`<p class="${l.cls}">${l.html}</p>`).join('')}</div>${keysHTML()}`;
  const lg=document.getElementById('log');lg.scrollTop=lg.scrollHeight;
  const ag=document.getElementById('again');if(ag)ag.onclick=startGame;
  app.querySelectorAll('[data-click]').forEach(el=>el.onclick=()=>{if(el.classList.contains('off')||tipLong)return;const p=+el.dataset.p,idx=+el.dataset.i;
    if(isAI(p))return;submit(p,el.dataset.click==='sw'?{kind:'switch',idx}:{kind:'move',idx,k:+el.dataset.k})});
  flushFx();
}
function cardHTML(u,p,i){
  const S=G.camps[p],ms=movesFor(u),K=CFG.joueurs[p].clavier;
  const lock=phase!=='choose'||!!G.choix[p]||isAI(p);
  const sts=[];
  if(u.fatigue)sts.push('<span class="st fat">Fatigué</span>');
  if(rooted(u))sts.push('<span class="st">Racines</span>');
  const bd=buffDef(u);if(bd)sts.push(`<span class="st">Déf +${bd}</span>`);
  for(const k of STATS.slice(1)){const m=modOf(u,k);if(m)sts.push(`<span class="st ${m>0?'up':'down'}">${statName(k)} ${m>0?'+':''}${m}</span>`)}
  if(u.regen)sts.push(`<span class="st">Régén ${u.regen.restant}</span>`);
  if(u.verrou)sts.push(`<span class="st">Bloqué : ${esc(CFG.attaques[u.verrou].nom)}</span>`);
  const pct=Math.round(u.pv/u.max*100),E=CFG.equipements[u.eq];
  return `<article class="card ${elCls(u.el)} ${u.ko?'ko':''}" data-uid="${u.uid}">
    <div class="hdr"><span class="glyph" title="${esc(u.el)}">${CFG.elements[u.el].glyphe}</span>
      <span class="nm">${esc(u.classe)}<small>${esc(E.nom)}${u.acc!=='aucun'?' + '+esc(CFG.accessoires[u.acc].nom):''}</small></span>
      <span class="postag">${esc(lanes(S.terrain.length)[i])}<span class="trig">${triggerHint(p,i)}</span></span></div>
    <div class="hp ${pct<34?'low':''}"><i style="width:${pct}%"></i></div>
    <div class="hpnum"><span><b>${u.pv}</b>/${u.max} ${CFG.stats.pv}</span><span>${STATS.slice(1).map(k=>`${CFG.stats[k]} ${stat(u,k)}`).join(' ')}</span></div>
    <div class="sts">${sts.join('')}</div>
    <div class="moves">${ms.map((m,k)=>{const M=CFG.attaques[m.id],ok=moveAllowed(u,k);
      const off=lock||!ok||u.ko;
      return `<button class="mv ${elCls(M.element)} ${off?'off':''}" data-click="mv" data-p="${p}" data-i="${i}" data-k="${k}" aria-disabled="${off}" data-tip="mv">
        <span class="k">${keyLabel(K.boutons[k]||'?')}</span><span><span class="dot"></span> ${esc(M.nom)}</span>
        <span class="meta">${launchHTML(M)}${patHTML(M)}${M.puissance?`${M.puissance}${M.element!==R.elementNeutre?' '+m.canal:''}`:''}${M.priorite?` <b>${M.priorite>0?'+':''}${M.priorite}</b>`:''}</span></button>`}).join('')}</div>
    ${u.fatigue?'<div class="univ">Move pool universel (fatigué)</div>':outOfPosition(u)?'<div class="univ">Move pool universel (hors position)</div>':''}
    ${benchReady(S)&&R.switch.actif?`<button class="mv" style="margin-top:.2rem" data-click="sw" data-p="${p}" data-i="${i}" ${lock||!canSwitch(p,u)?'disabled':''}><span class="k">${keyLabel(K.switch)}</span><span>Switch</span><span class="meta">prio ${R.switch.priorite}</span></button>`:''}
  </article>`;
}
function launchHTML(M){
  const PL=R.positionsLancement;if(!PL||!PL.actives||!M.depuis||!M.depuis.length)return '';
  const L=lanes(R.tailleTerrain);
  return `<span class="pat from" aria-label="depuis ${esc(M.depuis.join(', '))}" title="depuis : ${esc(M.depuis.join(', '))}">${L.map(l=>`<s class="${M.depuis.includes(l)?'on':''}"></s>`).join('')}</span>›`;
}
function patHTML(M){
  const C=CFG.ciblages[M.cible];
  if(!C.cases)return `<span>${esc(M.cible==='enFace'?'en face':M.cible==='soi'?'soi':'allié')}</span>`;
  const L=lanes(R.tailleTerrain);
  return `<span class="pat" aria-label="${esc(C.nom)}">${L.map(l=>`<s class="${C.cases.includes(l)?'on':''}"></s>`).join('')}</span>`;
}
const pending={acting:null,hit:[],floats:[]};
const cardEl=u=>document.querySelector(`.card[data-uid="${u.uid}"]`);
function animate(u,targets){pending.acting=u;pending.hit.push(...targets);renderArena()}
function floatNum(u,v){pending.floats.push([u,v])}
function flushFx(){
  if(pending.acting){const a=cardEl(pending.acting);if(a)a.classList.add('acting')}
  for(const t of pending.hit){const el=cardEl(t);if(el)el.classList.add('hit')}
  for(const [u,v] of pending.floats){const el=cardEl(u);if(!el)continue;const f=document.createElement('span');
    f.className='float '+(v<0?'dmg':'heal');f.textContent=(v>0?'+':'')+v;el.appendChild(f);setTimeout(()=>f.remove(),1000)}
  pending.hit=[];pending.floats=[];
}

// ================= INFOBULLES =================
const tipEl=document.createElement('div');tipEl.id='tip';tipEl.setAttribute('role','tooltip');document.body.appendChild(tipEl);
let tipLong=false,tipTimer=null;
function effectLines(M){return (M.effets||[]).map(f=>({soin:`Soigne ${f.montant} PV`,regeneration:`Soigne ${f.montant} PV au début des ${f.tours} prochains tours`,racines:`Racines : ni déplacement ni switch (${f.tours} tour${f.tours>1?'s':''})`,drain:`Récupère ${Math.round(f.ratio*100)} % des dégâts infligés`,contrecoup:`Contrecoup : le lanceur subit ${f.montant}`,pousser:`Pousse la cible de ${f.cases} case vers l’arrière`,tirer:`Tire la cible de ${f.cases} case vers l’avant`,echangerCibles:'Échange les deux cases visées',defense:`Déf P et M +${f.bonus} ${f.tours?'jusqu’à la fin du tour suivant':'ce tour'}${f.inamovible?', inamovible':''}`,deplacerSoi:{avant:'Échange avec l’allié devant',arriere:'Échange avec l’allié derrière',arriereSinonAvant:'Échange avec l’allié derrière (devant si à l’arrière)'}[f.direction],modStats:`${f.sur==='cibles'?'Cibles':f.sur==='lanceur'?'Lanceur':'Allié devant'} : ${Object.entries(f.stats||{}).map(([k,v])=>`${CFG.stats[k]} ${v>0?'+':''}${v}`).join(', ')}${f.tours!=null?` (${f.tours} tour(s))`:' jusqu’au banc'}`}[f.type]||f.type))}
function tipHTML(M,canal,u,eqEl){
  const E=CFG.elements[M.element],C=CFG.ciblages[M.cible];
  const rows=[];
  if(M.puissance)rows.push(`Puissance <b>${M.puissance}</b>${M.element!==R.elementNeutre?` · ${canal==='M'?'magique':'physique'}`:''}${R.degats.bonusElementActif&&eqEl===M.element?` · +${R.degats.bonusElement} bonus d’élément`:''}`);
  if(M.priorite)rows.push(`Priorité <b>${M.priorite>0?'+':''}${M.priorite}</b>`);
  rows.push(`Cible : ${esc(C?C.nom:M.cible)}`);
  const PL=R.positionsLancement;
  if(PL&&PL.actives)rows.push(`Depuis : ${M.depuis&&M.depuis.length?esc(M.depuis.join(', ')):'toutes les cases'}`);
  if(M.puissance&&M.element!==R.elementNeutre){const bat=E.bat||[],perd=elKeys().filter(k=>(CFG.elements[k].bat||[]).includes(M.element));rows.push(`Fort contre ${bat.join(', ')||'—'} · faible contre ${perd.join(', ')||'—'}`)}
  let html=`<div class="tt-h ${elCls(M.element)}"><span class="glyph">${E.glyphe}</span><b>${esc(M.nom)}</b><span class="tt-el">${esc(M.element)}</span></div>
    <div class="tt-r">${rows.join('<br>')}</div>`;
  const fx=effectLines(M);if(fx.length)html+=`<ul class="tt-fx">${fx.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  if(u&&G){
    if(!usesUniversal(u)&&!canLaunch(u,M))html+=`<div class="tt-warn">Hors position : lançable depuis ${esc(M.depuis.join(', '))}</div>`;
    else if(M.puissance&&M.cible!=='soi'&&M.cible!=='allieDevant'){
      const me=G.camps[u.p],foe=G.camps[1-u.p],idxs=targetsOf(u,M,me,foe),per=new Map();idxs.forEach(i=>per.set(i,(per.get(i)||0)+1));
      const est=[...per].map(([i,n])=>{const t=foe.terrain[i];if(i<0||!t||t.ko)return `${esc(lanes(foe.terrain.length)[i]||'?')} : case vide`;
        const {v,aff}=calcDamage(u,t,M,canal);return `${esc(t.classe)} (${esc(lanes(foe.terrain.length)[i])}) : <b>${v}${n>1?' ×'+n:''}</b>${aff===2?' avantage':aff===.5?' désavantage':''}${v*n>=t.pv?' — K.O.':''}`});
      html+=`<div class="tt-est">Si personne ne bouge :<br>${est.join('<br>')}</div>`;
    }
  }
  return html;
}
function showTip(el){
  let html='';
  if(el.dataset.tip==='mv'&&G){const u=G.camps[+el.dataset.p].terrain[+el.dataset.i];if(!u)return;const m=movesFor(u)[+el.dataset.k];if(!m)return;html=tipHTML(CFG.attaques[m.id],m.canal,u,u.el)}
  else if(el.dataset.tip==='pool'){const M=CFG.attaques[el.dataset.m];html=tipHTML(M,el.dataset.ch,null,CFG.equipements[el.dataset.eq]?.element)}
  if(!html)return;
  tipEl.innerHTML=html;tipEl.classList.add('on');
  const r=el.getBoundingClientRect(),tw=tipEl.offsetWidth,th=tipEl.offsetHeight,vw=document.documentElement.clientWidth;
  let x=Math.min(Math.max(8,r.left+r.width/2-tw/2),vw-tw-8),y=r.top-th-8;if(y<8)y=r.bottom+8;
  tipEl.style.left=x+'px';tipEl.style.top=y+'px';
}
function hideTip(){tipEl.classList.remove('on')}
document.addEventListener('pointerover',e=>{const el=e.target.closest('[data-tip]');if(el&&e.pointerType!=='touch')showTip(el)});
document.addEventListener('pointerout',e=>{const el=e.target.closest('[data-tip]');if(el&&!el.contains(e.relatedTarget))hideTip()});
document.addEventListener('focusin',e=>{const el=e.target.closest('[data-tip]');if(el)showTip(el)});
document.addEventListener('focusout',hideTip);
document.addEventListener('pointerdown',e=>{tipLong=false;const el=e.target.closest('[data-tip]');if(!el||e.pointerType!=='touch'){if(!el)hideTip();return}
  clearTimeout(tipTimer);tipTimer=setTimeout(()=>{tipLong=true;showTip(el)},450)});
document.addEventListener('pointerup',()=>{clearTimeout(tipTimer);setTimeout(()=>{tipLong=false},0)});
document.addEventListener('pointercancel',()=>clearTimeout(tipTimer));
addEventListener('scroll',hideTip,{passive:true});

// ================= RÉCAPITULATIF =================
const sgn=v=>v>0?'+'+v:String(v);
const modsTxt=m=>Object.entries(m||{}).filter(([,v])=>v).map(([k,v])=>`${CFG.stats[k]} ${sgn(v)}`).join(', ')||'—';
const elTag=e=>`<span class="eltag ${elCls(e)}"><span class="glyph">${CFG.elements[e].glyphe}</span> ${esc(e)}</span>`;
function lanesDots(list,cls){const L=lanes(R.tailleTerrain);return `<span class="pat ${cls||''}">${L.map(l=>`<s class="${list.includes(l)?'on':''}"></s>`).join('')}</span>`}
function targetCell(M){const C=CFG.ciblages[M.cible];return C.cases?`${lanesDots(C.cases)} ${esc(C.nom)}`:esc(C.nom)}
function fromCell(M){return M.depuis&&M.depuis.length?`${lanesDots(M.depuis,'from')} ${esc(M.depuis.join(', '))}`:'toutes'}
function recapHTML(){
  const ELS=elKeys().filter(e=>e!==R.elementNeutre),D=R.degats,F=R.fatigue,PL=R.positionsLancement||{},MO=R.modificateurs||{};
  const owners=id=>Object.entries(CFG.classes).filter(([,C])=>C.movePool.includes(id)).map(([n])=>n);
  const sec=(id,t,body)=>`<section id="rc-${id}"><h2>${t}</h2>${body}</section>`;
  const table=(head,rows,cls='')=>`<div class="tw"><table class="${cls}"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  // types
  const types=`<p>Ligne = élément de l’attaque, colonne = élément de l’équipement du défenseur. Avantage ×${D.multAvantage}, désavantage ÷${D.divDesavantage} (arrondi ${D.arrondi}).</p>`+
    table(['Attaque ↓ / Défense →',...ELS.map(elTag)],ELS.map(a=>`<tr><th>${elTag(a)}</th>${ELS.map(d=>{const f=affinity(a,d);return `<td class="aff ${f===2?'adv':f===.5?'dis':''}">${f===2?'×'+D.multAvantage:f===.5?'÷'+D.divDesavantage:'·'}</td>`}).join('')}</tr>`),'types')+
    `<p class="note">${ELS.map(e=>`${elTag(e)} bat ${(CFG.elements[e].bat||[]).join(', ')||'—'}`).join(' · ')}. Les attaques ${esc(R.elementNeutre)} sont neutres.</p>`;
  // classes
  const classes=table(['Classe',...STATS.map(k=>esc(CFG.stats[k])),'Canal','Équipements','Move pool (défaut en gras)'],
    Object.entries(CFG.classes).map(([n,C])=>`<tr><th>${esc(n)}</th>${STATS.map(k=>`<td class="num">${C.stats[k]}</td>`).join('')}<td>${C.canal}</td>
      <td>${C.equipements.map(e=>`${elTag(CFG.equipements[e].element)} ${esc(CFG.equipements[e].nom)}`).join('<br>')}</td>
      <td>${C.movePool.map(id=>(C.parDefaut||[]).includes(id)?`<b>${esc(CFG.attaques[id].nom)}</b>`:esc(CFG.attaques[id].nom)).join(', ')}</td></tr>`));
  const equip=table(['Équipement','Élément','Modificateurs','Classes'],Object.entries(CFG.equipements).map(([id,E])=>`<tr><th>${esc(E.nom)}</th><td>${elTag(E.element)}</td><td>${esc(modsTxt(E.mods))}</td><td>${Object.entries(CFG.classes).filter(([,C])=>C.equipements.includes(id)).map(([n])=>esc(n)).join(', ')}</td></tr>`));
  const acc=table(['Accessoire','Modificateurs','Effet'],Object.entries(CFG.accessoires).map(([id,A])=>`<tr><th>${esc(A.nom)}</th><td>${esc(modsTxt(A.mods))}</td><td>${esc(accDesc(id).replace(modsTxt(A.mods),'').replace(/^, /,''))||'—'}</td></tr>`));
  const moveRow=(id,M)=>`<tr data-el="${esc(M.element)}" data-cl="${esc(owners(id).join(' '))}" data-n="${esc(M.nom.toLowerCase())}"><th>${esc(M.nom)}</th><td>${elTag(M.element)}</td><td>${esc(owners(id).join(', ')||(CFG.movePoolUniversel.includes(id)?'universel':'—'))}</td>
    <td class="num">${M.puissance||'—'}</td><td class="num">${M.priorite?sgn(M.priorite):'—'}</td><td>${targetCell(M)}</td><td>${fromCell(M)}</td><td>${effectLines(M).map(esc).join('<br>')||'—'}</td></tr>`;
  const moves=`<div class="filters"><select id="rcEl" aria-label="Filtrer par élément"><option value="">Tous les éléments</option>${elKeys().map(e=>`<option>${esc(e)}</option>`).join('')}</select>
    <select id="rcCl" aria-label="Filtrer par classe"><option value="">Toutes les classes</option>${Object.keys(CFG.classes).map(c=>`<option>${esc(c)}</option>`).join('')}</select>
    <input id="rcQ" type="search" placeholder="Rechercher une attaque" aria-label="Rechercher une attaque"></div>`+
    table(['Attaque','Élément','Classes','Puiss.','Prio.','Cible','Depuis','Effets'],Object.entries(CFG.attaques).filter(([id])=>!CFG.movePoolUniversel.includes(id)).map(([id,M])=>moveRow(id,M)),'moves')+
    `<h3>Move pool universel (fatigué${PL.repliSiAucune?' ou hors position':''})</h3>`+
    table(['Attaque','Élément','Classes','Puiss.','Prio.','Cible','Depuis','Effets'],CFG.movePoolUniversel.map(id=>moveRow(id,CFG.attaques[id])));
  const cases=Object.keys(R.cases).sort((a,b)=>b-a);
  const redir=table(['Case visée',...cases.map(n=>`${n} case${n>1?'s':''}`)],lanes(R.tailleTerrain).map(l=>`<tr><th>${esc(l)}</th>${cases.map(n=>{const i=laneIndex(l,+n);return `<td>${i<0?'—':esc(lanes(+n)[i])}</td>`}).join('')}</tr>`));
  const rules=`<ul class="rules">
    <li><b>Dégâts</b> = max(${D.minimum}, (Puissance${D.bonusElementActif?` + ${D.bonusElement} si même élément que l’équipement`:''} + Attaque − Défense) × affinité)${D.bonusFatigueActif?`, puis +${D.bonusFatigue} si la cible est fatiguée`:''}. Attaque et Défense selon le canal (physique ou magique). Une case visée plusieurs fois = plusieurs coups, Défense appliquée à chacun.</li>
    <li><b>Tour</b> : chaque joueur choisit en secret un perso et une attaque (ou un switch). Ordre : priorité, puis Vitesse, puis départage (${esc(R.departage)}).</li>
    <li><b>Fatigue</b>${F.active?` : le perso qui vient d’agir n’a que le move pool universel au tour suivant${F.minPersosDebout>1?` (tant que le camp a au moins ${F.minPersosDebout} persos debout)`:''}.${F.switchFatigue?' Le remplaçant entré par switch est fatigué.':''}${F.bancEfface?' Le banc efface la fatigue.':''}`:' désactivée.'}</li>
    <li><b>Switch</b>${R.switch.actif?` : priorité ${R.switch.priorite}, le premier du banc prend la case du sortant.${R.switch.bloqueParRacines?' Impossible sous Racines.':''}`:' désactivé.'}</li>
    <li><b>Équipe</b> : ${R.tailleTerrain} sur le terrain, ${R.tailleBanc} au banc (caché), ${R.attaquesParPerso} attaques par perso${R.maxParClasse?`, ${R.maxParClasse===1?'chaque classe une seule fois':`${R.maxParClasse} fois max la même classe`}`:''}.</li>
    <li><b>K.O.</b> : ${R.remplacementAuto?'le banc entre automatiquement sur la case libérée en fin de tour. ':''}${R.plateauRetrecit?'Sinon le plateau rétrécit, les survivants gardent leur ordre.':'Les cases vides restent.'} Défaite quand plus aucun perso n’est debout${R.limiteTours?` ; limite à ${R.limiteTours} tours`:''}.</li>
    ${PL.actives?`<li><b>Positions de lancement</b> : certaines attaques ne partent que de certaines cases (redirection appliquée sur plateau réduit).${PL.verifieeALaResolution?' Lanceur déplacé avant d’agir : l’attaque échoue.':''}${PL.repliSiAucune?' Aucune attaque possible depuis sa case : move pool universel.':''}</li>`:''}
    <li><b>Setup et debuff</b> : plafond ±${MO.plafond??2} par stat${MO.reinitialiseAuBanc!==false?', effacés au banc':''}.</li></ul>
    <h3>Report des ciblages sur plateau réduit</h3>${redir}`;
  const ctrl=table(['Joueur','Perso gauche','Perso droite','Perso milieu','Attaques','Switch'],CFG.joueurs.map(j=>{const K=j.clavier;return `<tr><th>${esc(j.nom)}</th><td><kbd>${keyLabel(K.gachetteGauche)}</kbd> / gâchette G</td><td><kbd>${keyLabel(K.gachetteDroite)}</kbd> / gâchette D</td><td>aucune gâchette</td><td>${K.boutons.map(b=>`<kbd>${keyLabel(b)}</kbd>`).join(' ')} / ${CFG.manette.nomsBoutons.join(' ')}</td><td><kbd>${keyLabel(K.switch)}</kbd> / bumper</td></tr>`}));
  const toc=[['types','Table des types'],['regles','Règles'],['classes','Classes'],['equip','Équipements'],['acc','Accessoires'],['moves','Attaques'],['ctrl','Contrôles']];
  return `<div class="recap-in"><header class="recap-top"><h1 id="recapTitle">Récapitulatif</h1><span class="sub">généré depuis la configuration</span><span class="spacer"></span><button onclick="window.print()">Imprimer</button><button class="primary" id="recapClose">Fermer</button></header>
    <nav class="toc">${toc.map(([id,t])=>`<a href="#rc-${id}">${t}</a>`).join('')}</nav>
    ${sec('types','Table des types',types)}${sec('regles','Règles',rules)}${sec('classes','Classes',classes)}${sec('equip','Équipements',equip)}${sec('acc','Accessoires',acc)}${sec('moves','Attaques',moves)}${sec('ctrl','Contrôles',ctrl)}</div>`;
}
let recapFocus=null;
function openRecap(){
  const el=document.getElementById('recap');recapFocus=document.activeElement;
  el.innerHTML=recapHTML();el.classList.remove('hidden');document.body.classList.add('recap-open');el.scrollTop=0;
  document.getElementById('recapClose').onclick=closeRecap;document.getElementById('recapClose').focus();
  el.querySelectorAll('.toc a').forEach(a=>a.onclick=e=>{e.preventDefault();el.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'})});
  const f=()=>{const ev=document.getElementById('rcEl').value,cl=document.getElementById('rcCl').value,q=document.getElementById('rcQ').value.trim().toLowerCase();
    el.querySelectorAll('table.moves tbody tr').forEach(tr=>{tr.hidden=!((!ev||tr.dataset.el===ev)&&(!cl||tr.dataset.cl.split(' ').includes(cl))&&(!q||tr.dataset.n.includes(q)))})};
  ['rcEl','rcCl','rcQ'].forEach(id=>document.getElementById(id).oninput=f);
}
function closeRecap(){document.getElementById('recap').classList.add('hidden');document.body.classList.remove('recap-open');hideTip();if(recapFocus)recapFocus.focus()}
document.getElementById('btnRecap').onclick=openRecap;

// ================= DÉMARRAGE =================
loadConfig();
teams=CFG.joueurs.map((_,p)=>defaultTeam(p));
document.getElementById('btnBack').onclick=renderBuilder;
renderBuilder();
requestAnimationFrame(pollPads);
