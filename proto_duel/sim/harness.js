// Harnais : charge le prototype dans jsdom, sans rendu ni délais. npm i jsdom
const {JSDOM}=require('jsdom');const fs=require('fs');
function makeEnv(){
  const path=require('path');const dir=path.join(__dirname,'..');
  // index.html + config.js + game.js inlinés
  let html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  for(const f of ['config.js','game.js'])html=html.replace(`<script src="${f}"></script>`,()=>'<script>'+fs.readFileSync(path.join(dir,f),'utf8')+'</script>');
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/'});
  const w=dom.window;
  w.addEventListener('error',e=>console.log('ERR',e.message));
  w.eval(`
    renderArena=()=>{};flushFx=()=>{};animate=()=>{};floatNum=()=>{};renderBuilder=()=>{};
    CFG.affichage.vitesseIaVsIa=0;
    window.setTimeout=(f)=>{queueMicrotask(f);return 0};
    CFG.ia.joueurs=[true,true];R.limiteTours=60;
    window.__done=null;
    const _fin=finish; finish=(t)=>{phase='over';G.fin=t;window.__done&&window.__done(t)};
    window.playGame=(a,b)=>new Promise(res=>{window.__done=res;teams=[a,b];startGame();});
  `);
  return w;
}
module.exports={makeEnv};
