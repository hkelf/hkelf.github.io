// Usage : node meta.js [nombre de parties aléatoires, défaut 20000]
// Phase 1 : parties entre équipes aléatoires (taux de victoire par composant)
// Phase 2 : algorithme génétique (3 runs) pour faire émerger les équipes dominantes
// Phase 3 : validation des meilleures équipes contre l'aléatoire et entre elles
const {makeEnv}=require('./harness');const fs=require('fs');const w=makeEnv();
const CFG=JSON.parse(w.eval('JSON.stringify(CFG)'));const R=CFG.regles;
const POS=['avant','centre','arrière','banc'];
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const randomTeam=()=>JSON.parse(w.eval('JSON.stringify(randomTeam())'));
async function play(a,b){const r=await Promise.race([w.playGame(a,b),new Promise(r=>setTimeout(()=>r('STUCK'),2000))]);
  const t=w.eval('G.tour');return {w:r.includes('Joueur 1')?0:r.includes('Joueur 2')?1:-1,limit:r.includes('Limite'),t,stuck:r==='STUCK'}}
const S={};const add=(k,win)=>{(S[k]=S[k]||[0,0]);S[k][0]+=win;S[k][1]++};
function record(team,win){
  team.forEach((s,i)=>{const p=POS[i],el=CFG.equipements[s.equipement].element;
    add('classe|'+s.classe,win);add('pos|'+s.classe+'@'+p,win);add('equip|'+s.classe+'+'+s.equipement,win);
    add('elem|'+el,win);add('acc|'+s.accessoire,win);add('accCl|'+s.classe+'+'+s.accessoire,win);
    for(const m of s.attaques){add('move|'+s.classe+':'+m.id,win);add('moveCh|'+s.classe+':'+m.id+':'+m.canal,win)}});
}
const key=t=>t.map(s=>`${s.classe}/${s.equipement}/${s.accessoire}/${s.attaques.map(m=>m.id+m.canal).sort().join(',')}`).join(' | ');
function mutate(t){t=JSON.parse(JSON.stringify(t));const i=Math.floor(Math.random()*4),s=t[i],C=CFG.classes[s.classe];const r=Math.random();
  if(r<.2){const c=rnd(Object.keys(CFG.classes)),CC=CFG.classes[c];const mv=[...CC.movePool].sort(()=>Math.random()-.5).slice(0,4);t[i]={classe:c,equipement:rnd(CC.equipements),accessoire:rnd(Object.keys(CFG.accessoires)),attaques:mv.map(id=>({id,canal:CFG.attaques[id].canal||CC.canal}))}}
  else if(r<.35)s.equipement=rnd(C.equipements);
  else if(r<.55)s.accessoire=rnd(Object.keys(CFG.accessoires));
  else if(r<.8){const out=C.movePool.filter(id=>!s.attaques.some(m=>m.id===id));if(out.length){s.attaques[Math.floor(Math.random()*4)]={id:rnd(out),canal:C.canal}}}
  else if(r<.9){const m=rnd(s.attaques);if(CFG.attaques[m.id].puissance)m.canal=m.canal==='P'?'M':'P'}
  else{const j=Math.floor(Math.random()*4);[t[i],t[j]]=[t[j],t[i]]}
  return t}
function cross(a,b){return a.map((s,i)=>JSON.parse(JSON.stringify(Math.random()<.5?s:b[i])))}
// respecte regles.maxParClasse : on retente jusqu'à obtenir une équipe valide
function legal(f){for(let k=0;k<50;k++){const t=f();if(!w.teamError(t))return t}return randomTeam()}
(async()=>{
  const out={};
  // PHASE 1
  const N1=+process.argv[2]||20000;let side=[0,0,0],turns=0,lim=0,stuck=0;
  for(let g=0;g<N1;g++){const a=randomTeam(),b=randomTeam();const r=await play(a,b);
    if(r.stuck){stuck++;continue}turns+=r.t;if(r.limit)lim++;side[r.w<0?2:r.w]++;
    record(a,r.w===0?1:r.w<0?.5:0);record(b,r.w===1?1:r.w<0?.5:0)}
  out.phase1={games:N1,J1:side[0],J2:side[1],nuls:side[2],limite:lim,bloquees:stuck,toursMoy:+(turns/N1).toFixed(2),stats:S};
  fs.writeFileSync(__dirname+'/meta_p1.json',JSON.stringify(out.phase1));console.log('phase1 ok',side,lim,stuck,turns/N1);
  // PHASE 2 GA
  out.ga=[];
  for(let run=0;run<3;run++){
    let pop=Array.from({length:48},randomTeam);
    for(let gen=0;gen<35;gen++){
      const sc=pop.map(()=>[0,0]);
      for(let i=0;i<pop.length;i++)for(let k=0;k<12;k++){const j=Math.floor(Math.random()*pop.length);if(j===i)continue;
        const [x,y]=Math.random()<.5?[i,j]:[j,i];const r=await play(pop[x],pop[y]);if(r.stuck)continue;
        sc[x][0]+=r.w===0?1:r.w<0?.5:0;sc[y][0]+=r.w===1?1:r.w<0?.5:0;sc[x][1]++;sc[y][1]++}
      const ranked=pop.map((t,i)=>({t,s:sc[i][0]/Math.max(1,sc[i][1])})).sort((a,b)=>b.s-a.s);
      const elite=ranked.slice(0,12).map(r=>r.t);
      pop=[...elite];
      while(pop.length<48){const r=Math.random();pop.push(r<.5?legal(()=>mutate(rnd(elite))):r<.8?legal(()=>mutate(cross(rnd(elite),rnd(elite)))):randomTeam())}
      if(gen===34)out.ga.push({run,final:ranked.slice(0,12).map(r=>({s:+r.s.toFixed(3),t:r.t}))});
    }
    console.log('ga run',run,'done');
  }
  // VALIDATION : top équipes contre aléatoire et entre elles
  const tops=out.ga.flatMap(g=>g.final.slice(0,4).map(f=>f.t));
  out.validation=[];
  for(const t of tops){let s=0,n=0;for(let g=0;g<400;g++){const o=randomTeam();const sw=g%2;const r=await play(sw?o:t,sw?t:o);if(r.stuck)continue;const me=sw?1:0;s+=r.w===me?1:r.w<0?.5:0;n++}
    let s2=0,n2=0;for(const u of tops){if(u===t)continue;for(let g=0;g<20;g++){const sw=g%2;const r=await play(sw?u:t,sw?t:u);const me=sw?1:0;s2+=r.w===me?1:r.w<0?.5:0;n2++}}
    out.validation.push({team:key(t),vsRandom:+(s/n).toFixed(3),vsTops:+(s2/n2).toFixed(3)})}
  fs.writeFileSync(__dirname+'/meta.json',JSON.stringify(out,null,1));console.log('done');process.exit(0);
})();
