
(() => {
"use strict";

if (window.__darkWithinRunning) return;
window.__darkWithinRunning = true;

const $ = id => document.getElementById(id);
const W = 960, H = 540, TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const distance = (a,b,c,d) => Math.hypot(a-c,b-d);
const random = (a,b) => a+Math.random()*(b-a);

/* CREATE ONE PLAYABLE GAME */

$("dwGameFrame")?.remove();
$("darkWithinUI")?.remove();

const frame = document.createElement("div");
frame.id = "dwGameFrame";
frame.style.cssText =
"position:relative;width:min(960px,100%);margin:14px auto;"+
"overflow:hidden;border:2px solid #5e9b73;border-radius:12px;"+
"background:#070b10";

const canvas = document.createElement("canvas");
canvas.id = "darkWithinCanvas";
canvas.width = W;
canvas.height = H;
canvas.style.cssText =
"display:block;width:100%;height:auto;image-rendering:auto";

frame.appendChild(canvas);

const mount = $("gameMount") || document.body;
mount.appendChild(frame);

const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

const ui = document.createElement("div");
ui.id = "darkWithinUI";
ui.style.cssText =
"max-width:960px;margin:14px auto;padding:16px;"+
"background:#111d17;color:#edfff1;border:1px solid #528266;"+
"border-radius:12px;font:13px Arial";

ui.innerHTML = `
<h2 style="margin:0 0 12px;color:#90f7b3">
THEDARKWITHIN — 2.5D EDITION
</h2>
<div id="dwChapter" style="margin-bottom:7px"></div>
<div id="dwStatus" style="margin-bottom:12px"></div>

<div class="dwRow">
<select id="dwDifficulty">
<option value="easy">Easy</option>
<option value="medium" selected>Medium</option>
<option value="hard">Hard</option>
<option value="extreme">Extreme</option>
</select>
<button id="dwStart">START ADVENTURE</button>
<button id="dwRestart">RESTART STORY</button>
<button id="dwFullscreen">⛶ FULLSCREEN</button>
</div>

<div class="dwRow">
<button id="dwSword">J / SPACE — SWORD</button>
<button id="dwSkill">M — WATER WHEEL</button>
<button id="dwDivergent">N — LOCKED</button>
<button id="dwFlame">K — FLAME ARROW</button>
</div>

<div id="dwCooldowns" style="margin:12px 0;color:#abcab5"></div>

<div class="dwRow">
<button id="dwMusic">♫ MUSIC ON</button>
<label>VOLUME
<input id="dwVolume" type="range" min="0" max="100" value="35">
</label>
</div>

<p style="line-height:1.8;color:#b6c9bc">
WASD / ARROWS — MOVE<br>
J / SPACE / CLICK — SWORD<br>
M — WATER WHEEL / BLACK FLASH<br>
N — DIVERGENT FIST<br>
K — FLAME ARROW
</p>

<style>
.dwRow {
 display:flex;
 gap:8px;
 flex-wrap:wrap;
 margin:10px 0;
 align-items:center;
}
#darkWithinUI button,
#darkWithinUI select {
 padding:11px;
 border-radius:7px;
 border:1px solid #64b27b;
 background:#1b3527;
 color:#e7ffed;
 cursor:pointer;
 font-weight:bold;
}
#darkWithinUI button:hover {background:#306547}
</style>`;

mount.appendChild(ui);

/* STORY */

const chapters = [
{
 name:"The Missing Villagers",
 story:"The villagers have vanished. Find them.",
 type:"slime",count:4
},
{
 name:"The Frozen Mountains",
 story:"Follow their trail through the frozen mountains.",
 type:"ice",count:5
},
{
 name:"The Forgotten Desert",
 story:"Cross ancient desert ruins in search of the missing villagers.",
 type:"sand",count:6
},
{
 name:"The Cage of Shadows",
 story:"The villagers have been found, but darkness blocks their escape.",
 type:"shadow",count:6
},
{
 name:"The Darkness Below",
 story:"Trapped beneath the world, defeat the monsters guarding the path.",
 type:"dark",count:7
},
{
 name:"The Black Spirit",
 story:"An ancient dark spirit takes over your body and awakens new powers.",
 type:"spirit",count:7
},
{
 name:"The Fallen Kingdom",
 story:"Wearing black dragon armor, enter the Purple King's ruined kingdom.",
 type:"knight",count:8
},
{
 name:"The Purple King's Domain",
 story:"Defeat the Purple King and free the villagers.",
 type:"boss",count:1
}
];

const types = {
 slime:{hp:36,damage:7,speed:58,r:21,color:"#7acc9c"},
 ice:{hp:49,damage:9,speed:65,r:22,color:"#b7eaff"},
 sand:{hp:60,damage:11,speed:75,r:23,color:"#d8ae7b"},
 shadow:{hp:73,damage:13,speed:87,r:24,color:"#a275d5"},
 dark:{hp:89,damage:15,speed:97,r:25,color:"#76638e"},
 spirit:{hp:108,damage:17,speed:106,r:26,color:"#d46c9e"},
 knight:{hp:145,damage:20,speed:84,r:30,color:"#aca7bb"},
 boss:{hp:1300,damage:25,speed:57,r:63,color:"#a54bde"}
};

const difficulties = {
 easy:{hp:150,enemy:.7,damage:.6},
 medium:{hp:110,enemy:1,damage:1},
 hard:{hp:90,enemy:1.4,damage:1.5},
 extreme:{hp:65,enemy:1.9,damage:2}
};

const palette = [
 ["#23443f","#678971","#344d40","#c8f6c0"],
 ["#547b9d","#bad7e3","#a6b9c5","#f2fbff"],
 ["#a66a52","#e9bc91","#986c50","#fff0bd"],
 ["#382943","#71527e","#372940","#dfb0ff"],
 ["#1a1b32","#353858","#26243a","#a3a8ff"],
 ["#29172f","#613b59","#291c37","#ff91c7"],
 ["#553649","#9b6773","#42303f","#ffbdad"],
 ["#1d1133","#4d2862","#2c1c3d","#e49aff"]
];

/* GAME STATE */

let chapter=0;
let mode="menu";
let time=0;
let lastFrame=0;
let enemies=[];
let shots=[];
let particles=[];
let animations=[];
let sceneLines=[];
let sceneIndex=0;
let sceneCallback=null;
let sceneKind="story";
let camera=0;
let message="";
let messageTimer=0;
let difficulty="medium";
let transformed=false;
let spiritDeparted=false;
let bossPhase=1;
let finished=false;

const keys={};

const player = {
 x:200,y:425,r:20,
 hp:110,maxHp:110,
 speed:225,dir:1,
 inv:0,swordCd:0,
 skillCd:0,divCd:0,
 flameCd:0,slash:0,
 walk:0
};

function notify(t,d=2){
 message=t;
 messageTimer=d;
}

function isPlaying(){return mode==="playing"}

function effects(x,y,color,count=18,power=175){
 for(let i=0;i<count;i++){
  const a=random(0,TAU);
  const s=random(35,power);
  particles.push({
   x,y,
   vx:Math.cos(a)*s,
   vy:Math.sin(a)*s,
   size:random(2,5),
   life:random(.3,.8),
   color
  });
 }
}

function ring(x,y,color,r){
 animations.push({
  type:"ring",x,y,color,r,
  life:.45,max:.45
 });
}

/* STORY CUTSCENES */

function showScene(lines,callback,kind="story"){
 sceneLines=lines;
 sceneIndex=0;
 sceneCallback=callback;
 sceneKind=kind;
 mode="scene";
}

function advanceScene(){
 if(mode!=="scene")return;
 sceneIndex++;

 if(sceneIndex>=sceneLines.length){
  const done=sceneCallback;
  sceneCallback=null;
  sceneLines=[];
  mode="playing";
  if(done)done();
 }
}

function chapterIntro(n){
 const intros=[
 [
 "NARRATOR: The village has fallen silent.",
 "VILLAGER: Someone has taken our people into the wilderness!",
 "HERO: I'll find them, no matter how far I have to go."
 ],
 [
 "NARRATOR: The trail climbs toward the frozen mountain pass.",
 "HERO: The cold is getting worse, but I can still see their footprints."
 ],
 [
 "NARRATOR: Beyond the mountains lies a forgotten desert.",
 "HERO: These ruins must be hiding something."
 ],
 [
 "HERO: I found the missing villagers!",
 "VILLAGER: Please hurry! The darkness is coming!",
 "NARRATOR: Before they can escape, shadow creatures surround the prison."
 ],
 [
 "NARRATOR: The hero is pulled into the Darkness Below.",
 "HERO: I can't see the sky anymore...",
 "UNKNOWN VOICE: You will not escape this place."
 ],
 [
 "NARRATOR: After the darkness is defeated, a black spirit appears.",
 "BLACK SPIRIT: Your strength is not enough to end this war.",
 "HERO: Who are you?",
 "BLACK SPIRIT: I am the power left behind by the forgotten kingdom.",
 "HERO: Stay away from me!",
 "NARRATOR: The dark spirit enters the hero's body.",
 "NARRATOR: Black dragon armor forms around the hero.",
 "BLACK SPIRIT: Your power is awakening.",
 "NARRATOR: WATER WHEEL HAS EVOLVED INTO BLACK FLASH.",
 "NARRATOR: DIVERGENT FIST HAS BEEN UNLOCKED.",
 "HERO: Then I'll use this power to save everyone."
 ],
 [
 "NARRATOR: A corrupted kingdom stands beneath a blood-red sky.",
 "HERO: The Purple King is close. I can feel it."
 ],
 [
 "PURPLE KING: ANOTHER HERO HAS COME TO CHALLENGE ME?",
 "HERO: Release the villagers and end this darkness!",
 "PURPLE KING: THEN FACE THE TRUE POWER OF MY KINGDOM!"
 ]
 ];

 return intros[n];
}

function startChapter(n){
 chapter=n;
 finished=false;
 bossPhase=1;

 const d=difficulties[difficulty];
 player.maxHp=d.hp;
 player.hp=d.hp;
 player.x=190;
 player.y=420;
 player.inv=1;
 player.swordCd=0;
 player.skillCd=0;
 player.divCd=0;
 player.flameCd=0;
 player.slash=0;

 enemies=[];
 shots=[];
 particles=[];
 animations=[];

 const t=types[chapters[n].type];

 for(let i=0;i<chapters[n].count;i++){
  const angle=i*TAU/chapters[n].count;
  const isBoss=n===7;
  const x=isBoss?720:clamp(560+Math.cos(angle)*230,350,915);
  const y=isBoss?295:clamp(305+Math.sin(angle)*140,165,475);
  const hp=t.hp*d.enemy;

  enemies.push({
   x,y,baseX:x,baseY:y,
   r:t.r,hp,maxHp:hp,
   speed:t.speed,
   damage:t.damage*d.damage,
   color:t.color,
   type:chapters[n].type,
   attackCd:1,
   shotCd:1.7,
   flash:0,phase:i,
   dead:false
  });
 }

 $("dwSkill").textContent=transformed?
 "M — BLACK FLASH":"M — WATER WHEEL";
 $("dwDivergent").textContent=transformed?
 "N — DIVERGENT FIST":"N — LOCKED";

 Music.setChapter(n);
 Music.start();

 showScene(chapterIntro(n),()=>{
  if(n===5){
   transformed=true;
   $("dwSkill").textContent="M — BLACK FLASH";
   $("dwDivergent").textContent="N — DIVERGENT FIST";
   effects(player.x,player.y,"#f1426f",80,250);
   notify("BLACK FLASH AND DIVERGENT FIST UNLOCKED!",3);
  }
 },"intro");
}

function completeChapter(){
 if(finished||mode!=="playing")return;
 if(enemies.some(e=>!e.dead))return;

 finished=true;

 if(chapter===7){
  finale();
  return;
 }

 showScene([
  "CHAPTER "+(chapter+1)+" COMPLETE",
  chapters[chapter].story,
  "All monsters have been defeated. The path forward is open."
 ],()=>{
  startChapter(chapter+1);
 },"complete");
}

/* ENDING CUTSCENE */

function finale(){
 showScene([
  "NARRATOR: The Purple King falls to his knees.",
  "PURPLE KING: NO... MY KINGDOM... MY POWER...",
  "HERO: It's over. The villagers are free.",
  "NARRATOR: The Purple King's toxic mist disappears.",
  "BLACK SPIRIT: You no longer need me.",
  "HERO: Wait! What happens to my powers?",
  "BLACK SPIRIT: They belong to you now.",
  "NARRATOR: The dark spirit rises from the hero's body and disappears into the sky.",
  "NARRATOR: Black Flash and Divergent Fist remain available.",
  "VILLAGER: You saved us!",
  "HERO: The darkness is gone... for now."
 ],()=>{
  spiritDeparted=true;
  mode="ending";
 },"ending");
}

/* DAMAGE */

function hurtEnemy(e,damage,color="#ffe6b5"){
 if(e.dead)return;

 e.hp-=damage;
 e.flash=.15;
 effects(e.x,e.y,color,9);

 if(e.hp<=0){
  e.dead=true;
  effects(e.x,e.y,e.color,35,240);
  ring(e.x,e.y,e.color,55);
 }
}

function hurtPlayer(amount){
 if(mode!=="playing"||player.inv>0)return;

 player.hp-=amount;
 player.inv=.85;
 effects(player.x,player.y,"#ff668a",15);

 if(player.hp<=0){
  mode="dead";
  notify("YOU HAVE FALLEN",5);
 }
}

/* COMBAT */

function sword(){
 if(!isPlaying()||player.swordCd>0)return;

 player.swordCd=.32;
 player.slash=.23;

 animations.push({
  type:"sword",
  x:player.x+player.dir*44,
  y:player.y-8,
  dir:player.dir,
  life:.23,max:.23
 });

 for(const e of enemies){
  if(!e.dead&&
   distance(player.x,player.y,e.x,e.y)<115+e.r&&
   (e.x-player.x)*player.dir>-25){
   hurtEnemy(e,transformed?45:34);
  }
 }

 completeChapter();
}

function waterWheel(){
 if(!isPlaying()||transformed||player.skillCd>0)return;

 player.skillCd=3;

 animations.push({
  type:"water",
  x:player.x,y:player.y,
  life:.78,max:.78
 });

 effects(player.x,player.y,"#6edfff",48);

 for(const e of enemies){
  if(!e.dead&&distance(player.x,player.y,e.x,e.y)<155+e.r){
   hurtEnemy(e,90,"#b1f2ff");
  }
 }

 notify("WATER WHEEL!",1);
 completeChapter();
}

function blackFlash(){
 if(!isPlaying()||!transformed||player.skillCd>0)return;

 player.skillCd=3.3;

 animations.push({
  type:"blackflash",
  x:player.x+player.dir*35,
  y:player.y-8,
  dir:player.dir,
  life:.36,max:.36,
  seed:random(0,100)
 });

 // Black and crimson sparks, not water rings.
 effects(player.x,player.y,"#ff1748",50,340);
 effects(player.x,player.y,"#13070e",32,280);

 for(const e of enemies){
  if(!e.dead&&distance(player.x,player.y,e.x,e.y)<190+e.r){
   hurtEnemy(e,145,"#ff2755");
  }
 }

 notify("BLACK FLASH!",1.2);
 completeChapter();
}

function divergentFist(){
 if(!isPlaying()||!transformed||player.divCd>0)return;

 player.divCd=5.2;

 const targets=[];

 for(const e of enemies){
  if(!e.dead&&
   distance(player.x,player.y,e.x,e.y)<150+e.r){
   hurtEnemy(e,60,"#acd9ff");
   targets.push(e);
  }
 }

 animations.push({
  type:"divergent",
  x:player.x+player.dir*43,
  y:player.y,
  life:.8,max:.8,
  delay:.28,triggered:false,
  targets
 });

 notify("DIVERGENT FIST!",1.2);
 completeChapter();
}

function flameArrow(){
 if(!isPlaying()||player.flameCd>0)return;

 player.flameCd=1.4;

 shots.push({
  x:player.x+player.dir*25,
  y:player.y-10,
  vx:player.dir*625,
  vy:0,r:13,damage:90,
  enemy:false,life:2
 });

 effects(player.x,player.y,"#ffa752",15);
}

/* MUSIC */

const Music=(()=>{
 let audio,gain,timer;
 let enabled=true,volume=.35;
 let musicChapter=-1,step=0,next=0;

 const melodies=[
 [64,67,71,67,64,62,60,0],
 [72,71,67,64,67,64,62,0],
 [64,65,68,65,64,61,60,0],
 [60,63,66,0,60,63,67,0],
 [48,51,54,48,55,54,51,0],
 [60,63,67,72,67,63,60,0],
 [67,70,72,75,74,70,67,0],
 [48,55,60,63,62,55,51,48]
 ];

 function note(midi,when,length,bass=false){
  if(!audio||!enabled||!midi)return;

  const o=audio.createOscillator();
  const g=audio.createGain();

  o.type=bass?"triangle":"square";
  o.frequency.value=440*Math.pow(2,(midi-69)/12);

  g.gain.setValueAtTime(.0001,when);
  g.gain.linearRampToValueAtTime(bass?.11:.07,when+.015);
  g.gain.exponentialRampToValueAtTime(.0001,when+length);

  o.connect(g);
  g.connect(gain);
  o.start(when);
  o.stop(when+length+.02);
 }

 function tick(){
  if(!audio||audio.state!=="running"||!enabled)return;

  const notes=melodies[chapter];
  const beat=.18;

  while(next<audio.currentTime+.16){
   const i=step%8;
   note(notes[i],next,beat*.85);
   if(i%4===0)note((notes[i]||48)-24,next,beat*3.5,true);
   step++;
   next+=beat;
  }
 }

 async function start(){
  try{
   if(!audio){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    audio=new AC();
    gain=audio.createGain();
    gain.gain.value=volume*.45;
    gain.connect(audio.destination);
   }

   await audio.resume();

   if(!timer){
    next=audio.currentTime+.05;
    timer=setInterval(tick,60);
   }
  }catch(e){}
 }

 function setChapter(n){
  musicChapter=n;
  step=0;
  if(audio)next=audio.currentTime+.07;
 }

 function toggle(){
  enabled=!enabled;
  $("dwMusic").textContent=enabled?"♫ MUSIC ON":"♫ MUSIC OFF";

  if(gain&&audio)
   gain.gain.setTargetAtTime(enabled?volume*.45:0,audio.currentTime,.03);

  if(enabled)start();
 }

 function setVolume(v){
  volume=Number(v)/100;
  if(gain&&audio)
   gain.gain.setTargetAtTime(enabled?volume*.45:0,audio.currentTime,.03);
 }

 return{start,setChapter,toggle,setVolume};
})();

/* UPDATE */

function update(dt){
 time+=dt;
 camera+=dt*8;
 messageTimer=Math.max(0,messageTimer-dt);

 for(let i=particles.length-1;i>=0;i--){
  const p=particles[i];
  p.x+=p.vx*dt;
  p.y+=p.vy*dt;
  p.life-=dt;
  if(p.life<=0)particles.splice(i,1);
 }

 for(let i=animations.length-1;i>=0;i--){
  const a=animations[i];
  a.life-=dt;

  if(a.type==="divergent"&&!a.triggered){
   a.delay-=dt;

   if(a.delay<=0){
    a.triggered=true;
    effects(a.x,a.y,"#54bdff",65,320);

    for(const target of a.targets){
     if(!target.dead)hurtEnemy(target,115,"#84ceff");
    }
   }
  }

  if(a.life<=0)animations.splice(i,1);
 }

 if(mode!=="playing")return;

 for(const key of ["inv","swordCd","skillCd","divCd","flameCd","slash"]){
  player[key]=Math.max(0,player[key]-dt);
 }

 let dx=Number(!!(keys.d||keys.arrowright))-
        Number(!!(keys.a||keys.arrowleft));
 let dy=Number(!!(keys.s||keys.arrowdown))-
        Number(!!(keys.w||keys.arrowup));

 const length=Math.hypot(dx,dy);

 if(length){
  dx/=length;
  dy/=length;

  player.x+=dx*player.speed*dt;
  player.y+=dy*player.speed*dt;

  if(dx)player.dir=dx>0?1:-1;
  player.walk+=dt*12;
 }

 player.x=clamp(player.x,28,932);
 player.y=clamp(player.y,125,485);

 for(const e of enemies){
  if(e.dead)continue;

  e.attackCd-=dt;
  e.shotCd-=dt;
  e.flash=Math.max(0,e.flash-dt);
  e.phase+=dt;

  const d=distance(player.x,player.y,e.x,e.y)||1;
  const vx=(player.x-e.x)/d;
  const vy=(player.y-e.y)/d;

  if(d>e.r+player.r+9){
   e.x+=vx*e.speed*dt;
   e.y+=vy*e.speed*dt;
  }else if(e.attackCd<=0){
   hurtPlayer(e.damage);
   e.attackCd=1.1;
  }

  if(e.type==="boss"&&e.shotCd<=0){
   const ratio=e.hp/e.maxHp;
   const phase=ratio<=.33?3:ratio<=.66?2:1;

   if(phase!==bossPhase){
    bossPhase=phase;
    notify("PURPLE KING — PHASE "+phase,2);
    effects(e.x,e.y,"#c974ff",75,270);
   }

   const number=phase*2+1;
   const angle=Math.atan2(player.y-e.y,player.x-e.x);

   for(let i=0;i<number;i++){
    const a=angle+(i-(number-1)/2)*.18;
    const speed=210+phase*30;

    shots.push({
     x:e.x,y:e.y,
     vx:Math.cos(a)*speed,
     vy:Math.sin(a)*speed,
     r:12,damage:e.damage*.7,
     enemy:true,life:4
    });
   }

   e.shotCd=2.25-phase*.3;
  }

  if(mode!=="playing")break;
 }

 for(let i=shots.length-1;i>=0;i--){
  const p=shots[i];
  p.x+=p.vx*dt;
  p.y+=p.vy*dt;
  p.life-=dt;

  let hit=false;

  if(p.enemy){
   if(distance(p.x,p.y,player.x,player.y)<p.r+player.r){
    hurtPlayer(p.damage);
    hit=true;
   }
  }else{
   for(const e of enemies){
    if(!e.dead&&distance(p.x,p.y,e.x,e.y)<p.r+e.r){
     hurtEnemy(e,p.damage,"#ffbf73");
     hit=true;
     break;
    }
   }
  }

  if(hit||p.life<=0||p.x<0||p.x>W||p.y<0||p.y>H){
   shots.splice(i,1);
  }
 }

 updateHUD();
 completeChapter();
}

function updateHUD(){
 $("dwChapter").textContent=
 "CHAPTER "+(chapter+1)+" — "+chapters[chapter].name;

 $("dwStatus").textContent=
 "HEALTH: "+Math.ceil(Math.max(0,player.hp))+"/"+player.maxHp+
 " | ENEMIES: "+enemies.filter(e=>!e.dead).length;

 $("dwCooldowns").textContent=
 "SWORD "+(player.swordCd<=0?"READY":player.swordCd.toFixed(1)+"s")+
 " • "+(transformed?"BLACK FLASH":"WATER WHEEL")+" "+
 (player.skillCd<=0?"READY":player.skillCd.toFixed(1)+"s")+
 " • DIVERGENT "+(!transformed?"LOCKED":player.divCd<=0?"READY":player.divCd.toFixed(1)+"s")+
 " • FLAME "+(player.flameCd<=0?"READY":player.flameCd.toFixed(1)+"s");
}

/* 2.5D DRAWING */

function glow(x,y,r,color){
 const g=ctx.createRadialGradient(x,y,0,x,y,r);
 g.addColorStop(0,color);
 g.addColorStop(1,"transparent");
 ctx.fillStyle=g;
 ctx.fillRect(x-r,y-r,2*r,2*r);
}

function ellipse(x,y,rx,ry,color){
 ctx.fillStyle=color;
 ctx.beginPath();
 ctx.ellipse(x,y,rx,ry,0,0,TAU);
 ctx.fill();
}

function mountain(x,y,w,h,color){
 ctx.fillStyle=color;
 ctx.beginPath();
 ctx.moveTo(x-w/2,y);
 ctx.lineTo(x,y-h);
 ctx.lineTo(x+w/2,y);
 ctx.closePath();
 ctx.fill();

 ctx.fillStyle="#ffffff12";
 ctx.beginPath();
 ctx.moveTo(x,y-h);
 ctx.lineTo(x-w*.16,y-h*.4);
 ctx.lineTo(x,y-h*.52);
 ctx.fill();
}

function tree(x,y,s,snow=false){
 ctx.save();
 ctx.translate(x,y);
 ctx.scale(s,s);

 ctx.strokeStyle="#49362f";
 ctx.lineWidth=17;
 ctx.lineCap="round";
 ctx.beginPath();
 ctx.moveTo(0,7);
 ctx.quadraticCurveTo(-10,-85,8,-145);
 ctx.stroke();

 ctx.lineWidth=7;
 ctx.beginPath();
 ctx.moveTo(-2,-95);
 ctx.lineTo(-45,-127);
 ctx.moveTo(4,-116);
 ctx.lineTo(48,-148);
 ctx.stroke();

 for(const [dx,dy,r] of [
 [-39,-150,40],[10,-170,54],
 [46,-140,39],[-7,-125,45]
 ]){
  const g=ctx.createRadialGradient(dx-16,dy-15,1,dx,dy,r);
  g.addColorStop(0,snow?"#eaf8ff":"#699e7b");
  g.addColorStop(.5,snow?"#9dbfca":"#337351");
  g.addColorStop(1,"#162d2b");

  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.arc(dx,dy,r,0,TAU);
  ctx.fill();
 }

 ctx.restore();
}

function castle(x,y,s=1,purple=false){
 ctx.save();
 ctx.translate(x,y);
 ctx.scale(s,s);

 const g=ctx.createLinearGradient(-180,0,180,0);
 g.addColorStop(0,"#292031");
 g.addColorStop(.45,purple?"#80638e":"#a49baa");
 g.addColorStop(1,"#30263e");

 ctx.fillStyle=g;
 ctx.fillRect(-130,-180,260,180);

 for(const dx of [-115,0,115]){
  ctx.fillStyle=purple?"#60436c":"#898b99";
  ctx.fillRect(dx-36,-246,72,246);

  ctx.fillStyle=purple?"#502760":"#49435c";
  ctx.beginPath();
  ctx.moveTo(dx-46,-246);
  ctx.lineTo(dx,-310);
  ctx.lineTo(dx+46,-246);
  ctx.fill();

  ctx.fillStyle=purple?"#e998ff":"#ffd998";
  ctx.shadowColor=ctx.fillStyle;
  ctx.shadowBlur=14;
  ctx.fillRect(dx-9,-198,18,57);
  ctx.shadowBlur=0;
 }

 ctx.fillStyle="#181020";
 ctx.beginPath();
 ctx.arc(0,-35,37,Math.PI,0);
 ctx.lineTo(37,0);
 ctx.lineTo(-37,0);
 ctx.fill();

 ctx.restore();
}

function ruins(x,y,s){
 ctx.save();
 ctx.translate(x,y);
 ctx.scale(s,s);

 ctx.fillStyle="#b28c76";
 ctx.fillRect(-60,-125,38,125);
 ctx.fillRect(30,-143,38,143);

 ctx.fillStyle="#ddad85";
 ctx.fillRect(-73,-134,64,15);
 ctx.fillRect(17,-152,64,15);

 ctx.restore();
}

function background(){
 const p=palette[chapter];
 const sky=ctx.createLinearGradient(0,0,0,H);

 sky.addColorStop(0,p[0]);
 sky.addColorStop(.65,p[1]);
 sky.addColorStop(1,p[2]);

 ctx.fillStyle=sky;
 ctx.fillRect(0,0,W,H);

 glow(720,110,225,p[3]+"55");
 ellipse(720,110,48,48,p[3]);

 if(chapter>=3){
  ellipse(720,110,43,43,"#20142e");
  ctx.strokeStyle=p[3];
  ctx.lineWidth=6;
  ctx.beginPath();
  ctx.arc(720,110,58,0,TAU);
  ctx.stroke();
 }

 for(let layer=0;layer<3;layer++){
  const speed=[.15,.32,.6][layer];
  const color=["#c2c9db33","#393b5877","#192636b4"][layer];

  for(let i=-2;i<13;i++){
   const x=i*130-(camera*speed%130);
   const h=100+(Math.abs(i*37+layer*49)%115);
   mountain(x,375,230,h,color);
  }
 }

 if(chapter===0||chapter===1){
  for(let i=-2;i<11;i++){
   tree(i*155-(camera*.28%155),383,.55+(i%3)*.1,chapter===1);
  }
 }

 if(chapter===2){
  for(let i=-1;i<9;i++){
   ruins(i*195-(camera*.24%195),382,.65);
  }
 }

 if([3,6,7].includes(chapter)){
  castle(480,376,chapter===7?1.4:1,chapter!==3);
 }

 if(chapter===4||chapter===5){
  for(let i=0;i<16;i++){
   const x=i*68;
   ctx.fillStyle="#110e20";
   ctx.beginPath();
   ctx.moveTo(x,0);
   ctx.lineTo(x+28,64+i%4*20);
   ctx.lineTo(x+68,0);
   ctx.fill();
  }
 }

 const ground=ctx.createLinearGradient(0,355,0,540);
 ground.addColorStop(0,p[2]);
 ground.addColorStop(1,"#10151a");

 ctx.fillStyle=ground;
 ctx.fillRect(0,355,W,185);

 ctx.strokeStyle="#ffffff18";
 ctx.lineWidth=1.5;

 for(let y=367;y<H;y+=19+(y-350)*.08){
  ctx.beginPath();
  ctx.moveTo(0,y);
  ctx.lineTo(W,y);
  ctx.stroke();
 }

 for(let x=-600;x<=1600;x+=125){
  ctx.beginPath();
  ctx.moveTo(480,355);
  ctx.lineTo(x,H);
  ctx.stroke();
 }

 for(let i=0;i<60;i++){
  const x=(i*149)%W;
  const y=370+(i*83)%165;
  ellipse(x,y,3,1.5,"#ffffff19");
 }

 for(let i=0;i<38;i++){
  const x=((i*177+time*(3+i%5))%1050+1050)%1050;
  const y=(i*79)%H;
  ellipse(x,y,1.5,1.5,p[3]+"66");
 }

 const fog=ctx.createLinearGradient(0,340,0,H);
 fog.addColorStop(0,"#ffffff00");
 fog.addColorStop(1,p[3]+"12");
 ctx.fillStyle=fog;
 ctx.fillRect(0,340,W,200);
}

/* HERO AND ARMOR */

function hero(){
 if(player.inv>0&&Math.floor(time*12)%2===0)return;

 const x=player.x,y=player.y;
 const bob=Math.sin(player.walk)*1.5;

 ctx.save();
 ctx.translate(x,y+bob);

 ellipse(0,30,30,8,"#0009");

 // Flowing cloak
 const cape=ctx.createLinearGradient(-25,-30,20,30);
 cape.addColorStop(0,transformed?"#762542":"#446e9c");
 cape.addColorStop(1,"#191625");

 ctx.fillStyle=cape;
 ctx.beginPath();
 ctx.moveTo(-13,-25);
 ctx.quadraticCurveTo(-38,-4,-28,28+Math.sin(time*5)*4);
 ctx.lineTo(15,24);
 ctx.lineTo(16,-28);
 ctx.fill();

 // Boots
 ctx.fillStyle="#252333";
 ctx.fillRect(-12,8,10,20);
 ctx.fillRect(3,8,10,20);

 // Chest armor
 const armor=ctx.createLinearGradient(-20,-32,20,15);
 armor.addColorStop(0,transformed?"#8a7c91":"#d2e6f1");
 armor.addColorStop(.45,transformed?"#242132":"#7c9dbd");
 armor.addColorStop(1,"#242333");

 ctx.fillStyle=armor;
 ctx.beginPath();
 ctx.moveTo(-18,-26);
 ctx.quadraticCurveTo(0,-34,18,-26);
 ctx.lineTo(20,9);
 ctx.quadraticCurveTo(0,21,-20,9);
 ctx.closePath();
 ctx.fill();

 ctx.strokeStyle=transformed?"#e14d72":"#b5dcf1";
 ctx.lineWidth=2;
 ctx.stroke();

 // Shoulder armor
 for(const side of [-1,1]){
  ctx.fillStyle=transformed?"#45354a":"#799dbb";
  ctx.beginPath();
  ctx.ellipse(side*20,-20,12,14,side*.2,0,TAU);
  ctx.fill();
 }

 // Face
 ellipse(0,-42,13,16,transformed?"#8b6e83":"#e1bb9d");

 // Helmet
 ctx.fillStyle=transformed?"#1a1425":"#353040";
 ctx.beginPath();
 ctx.moveTo(-16,-43);
 ctx.quadraticCurveTo(-17,-65,0,-60);
 ctx.quadraticCurveTo(17,-66,16,-43);
 ctx.lineTo(10,-32);
 ctx.lineTo(-10,-32);
 ctx.fill();

 if(transformed){
  // Dragon armor horns
  for(const s of [-1,1]){
   ctx.beginPath();
   ctx.moveTo(s*9,-57);
   ctx.lineTo(s*25,-83);
   ctx.lineTo(s*4,-63);
   ctx.fill();
  }
 }

 const eye=transformed?"#ff426c":"#bdefff";
 ctx.fillStyle=eye;
 ctx.shadowColor=eye;
 ctx.shadowBlur=13;
 ctx.fillRect(player.dir>0?3:-10,-44,7,4);
 ctx.shadowBlur=0;

 if(transformed){
  glow(0,-7,30,"#eb315542");
  ctx.fillStyle="#e54b71";
  ctx.beginPath();
  ctx.moveTo(0,-19);
  ctx.lineTo(8,-6);
  ctx.lineTo(0,10);
  ctx.lineTo(-8,-6);
  ctx.fill();
 }

 // Sword
 ctx.save();
 ctx.translate(player.dir*23,-4);
 ctx.rotate(player.dir>0?-.22:Math.PI+.22);

 ctx.shadowColor=transformed?"#ff6288":"#b4e9ff";
 ctx.shadowBlur=15;
 ctx.fillStyle=transformed?"#ffc6d1":"#e3f3ff";

 ctx.beginPath();
 ctx.moveTo(-5,2);
 ctx.lineTo(-6,-61);
 ctx.lineTo(0,-75);
 ctx.lineTo(6,-61);
 ctx.lineTo(5,2);
 ctx.closePath();
 ctx.fill();

 ctx.shadowBlur=0;
 ctx.fillStyle="#cfa777";
 ctx.fillRect(-14,-3,28,7);
 ctx.fillStyle="#43313c";
 ctx.fillRect(-4,4,8,18);
 ctx.restore();

 ctx.restore();
}

/* ENEMIES */

function drawBoss(e){
 const x=e.x,y=e.y+Math.sin(time*2)*4;

 glow(x,y,185,"#a448df33");

 ctx.save();
 ctx.translate(x,y);

 // King's cloak
 ctx.fillStyle="#281438";
 ctx.beginPath();
 ctx.moveTo(-75,-60);
 ctx.lineTo(-100,65);
 ctx.lineTo(-45,135);
 ctx.lineTo(0,155);
 ctx.lineTo(45,135);
 ctx.lineTo(100,65);
 ctx.lineTo(75,-60);
 ctx.fill();

 // Huge armor
 const armor=ctx.createLinearGradient(-80,-80,90,90);
 armor.addColorStop(0,"#b388d3");
 armor.addColorStop(.4,e.flash>0?"#ffffff":"#654281");
 armor.addColorStop(1,"#291538");

 ctx.fillStyle=armor;
 ctx.beginPath();
 ctx.moveTo(-78,-65);
 ctx.lineTo(0,-108);
 ctx.lineTo(78,-65);
 ctx.lineTo(61,39);
 ctx.lineTo(0,73);
 ctx.lineTo(-61,39);
 ctx.closePath();
 ctx.fill();

 ctx.strokeStyle="#cb84f7";
 ctx.lineWidth=6;
 ctx.stroke();

 // Face
 ellipse(0,-115,42,46,"#251330");

 // Crown
 ctx.fillStyle="#f2c77f";
 ctx.shadowColor="#d68cff";
 ctx.shadowBlur=18;
 ctx.beginPath();
 ctx.moveTo(-49,-135);
 ctx.lineTo(-58,-187);
 ctx.lineTo(-24,-161);
 ctx.lineTo(0,-206);
 ctx.lineTo(25,-161);
 ctx.lineTo(58,-187);
 ctx.lineTo(49,-135);
 ctx.fill();
 ctx.shadowBlur=0;

 // Toxic eyes
 ctx.fillStyle="#ff91d2";
 ctx.shadowColor="#fa70ff";
 ctx.shadowBlur=18;
 ctx.fillRect(-30,-122,20,9);
 ctx.fillRect(10,-122,20,9);
 ctx.shadowBlur=0;

 glow(0,-4,65,"#bd39e766");
 ctx.fillStyle="#f2a7ff";
 ctx.beginPath();
 ctx.moveTo(0,-40);
 ctx.lineTo(19,-5);
 ctx.lineTo(0,29);
 ctx.lineTo(-19,-5);
 ctx.fill();

 ctx.restore();
}

function monster(e){
 if(e.type==="boss"){
  drawBoss(e);
 }else{
  const x=e.x;
  const y=e.y+Math.sin(e.phase*2)*3;
  const r=e.r;

  ellipse(x,y+r+12,r*1.2,8,"#0008");
  glow(x,y,r*2.5,e.color+"33");

  const g=ctx.createRadialGradient(x-r*.35,y-r*.5,1,x,y,r*1.4);
  g.addColorStop(0,e.flash>0?"#fff":"#d9d2e8");
  g.addColorStop(.35,e.flash>0?"#fff":e.color);
  g.addColorStop(1,"#181323");

  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(x-r,y-r*.25);
  ctx.quadraticCurveTo(x-r,y-r*1.3,x,y-r*1.2);
  ctx.quadraticCurveTo(x+r,y-r*1.3,x+r,y-r*.25);
  ctx.lineTo(x+r*.8,y+r);
  ctx.quadraticCurveTo(x,y+r*1.3,x-r*.8,y+r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle=chapter>=3?"#ff88b3":"#c7f3ff";
  ctx.shadowColor=ctx.fillStyle;
  ctx.shadowBlur=13;
  ctx.fillRect(x-r*.55,y-7,r*.35,5);
  ctx.fillRect(x+r*.2,y-7,r*.35,5);
  ctx.shadowBlur=0;
 }

 const w=e.type==="boss"?190:52;
 const top=e.y-(e.type==="boss"?218:e.r+44);

 ctx.fillStyle="#150e20";
 ctx.fillRect(e.x-w/2,top,w,9);
 ctx.fillStyle="#e17bba";
 ctx.fillRect(e.x-w/2,top,w*clamp(e.hp/e.maxHp,0,1),9);
}

/* ATTACK VISUALS */

function drawAnimations(){
 for(const a of animations){
  const progress=1-a.life/a.max;

  ctx.save();
  ctx.globalAlpha=clamp(a.life/a.max,0,1);

  if(a.type==="ring"){
   ctx.strokeStyle=a.color;
   ctx.shadowColor=a.color;
   ctx.shadowBlur=23;
   ctx.lineWidth=10;
   ctx.beginPath();
   ctx.arc(a.x,a.y,a.r*(.3+progress),0,TAU);
   ctx.stroke();
  }

  if(a.type==="sword"){
   ctx.strokeStyle=transformed?"#ff9ab0":"#d7f3ff";
   ctx.shadowColor=ctx.strokeStyle;
   ctx.shadowBlur=24;
   ctx.lineWidth=13;
   ctx.beginPath();
   const angle=a.dir>0?0:Math.PI;
   ctx.arc(a.x,a.y,74,angle-.95,angle+.95);
   ctx.stroke();
  }

  if(a.type==="water"){
   ctx.translate(a.x,a.y);
   ctx.rotate(time*10);
   ctx.strokeStyle="#67dfff";
   ctx.shadowColor="#68ddff";
   ctx.shadowBlur=29;
   ctx.lineWidth=13;

   for(let i=0;i<3;i++){
    ctx.beginPath();
    ctx.arc(0,0,90-i*16,i*2.1,i*2.1+2.2);
    ctx.stroke();
   }

   ctx.strokeStyle="#e4fcff";
   ctx.lineWidth=4;
   ctx.beginPath();
   ctx.arc(0,0,68,0,TAU);
   ctx.stroke();
  }

  if(a.type==="blackflash"){
   ctx.translate(a.x,a.y);

   // BLACK FLASH: jagged red lightning, black cracks
   // and flying crimson sparks. No spinning rings.
   ctx.globalCompositeOperation="lighter";

   for(let i=0;i<18;i++){
    const angle=i*TAU/18+a.seed;
    const reach=40+(i%5)*19+progress*90;
    const endX=Math.cos(angle)*reach;
    const endY=Math.sin(angle)*reach;

    ctx.shadowColor="#ff1747";
    ctx.shadowBlur=28;
    ctx.strokeStyle=i%4===0?"#ffb5c5":"#ff1749";
    ctx.lineWidth=i%4===0?5:10;

    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(
     endX*.32+Math.sin(i*7)*22,
     endY*.3
    );
    ctx.lineTo(
     endX*.65-Math.cos(i*5)*18,
     endY*.7
    );
    ctx.lineTo(endX,endY);
    ctx.stroke();

    ctx.strokeStyle="#09030b";
    ctx.lineWidth=3;
    ctx.shadowBlur=0;
    ctx.stroke();
   }

   // Black impact center
   ctx.globalCompositeOperation="source-over";
   ctx.fillStyle="#12030a";
   ctx.beginPath();
   ctx.arc(0,0,29+progress*14,0,TAU);
   ctx.fill();

   // Random-looking deterministic sparks
   for(let i=0;i<38;i++){
    const angle=i*2.399+a.seed;
    const radius=25+(i*29)%145+progress*65;
    const x=Math.cos(angle)*radius;
    const y=Math.sin(angle)*radius;

    ctx.fillStyle=i%3===0?"#ffd2d8":"#ff1645";
    ctx.shadowColor="#ff1645";
    ctx.shadowBlur=15;
    ctx.fillRect(x,y,2+i%4,2+i%4);
   }
  }

  if(a.type==="divergent"){
   if(a.triggered){
    ctx.strokeStyle="#8bd7ff";
    ctx.shadowColor="#3db6ff";
    ctx.shadowBlur=38;
    ctx.lineWidth=18;
    ctx.beginPath();
    ctx.arc(a.x,a.y,40+progress*170,0,TAU);
    ctx.stroke();

    glow(a.x,a.y,145,"#45aaff55");
   }else{
    glow(a.x,a.y,45,"#a8dcff99");
   }
  }

  ctx.restore();
 }
}

function drawShots(){
 for(const s of shots){
  const color=s.enemy?"#c76cff":"#ffb96e";
  glow(s.x,s.y,42,color+"66");
  ellipse(s.x,s.y,s.r,s.r,color);
  ellipse(s.x-4,s.y-4,s.r*.3,s.r*.3,"#fff9dc");
 }
}

function drawParticles(){
 ctx.save();

 for(const p of particles){
  ctx.globalAlpha=clamp(p.life*1.7,0,1);
  ctx.fillStyle=p.color;
  ctx.shadowColor=p.color;
  ctx.shadowBlur=8;
  ctx.beginPath();
  ctx.arc(p.x,p.y,p.size,0,TAU);
  ctx.fill();
 }

 ctx.restore();
}

/* HUD AND CUTSCENES */

function text(t,x,y,size=18,color="#fff",align="left"){
 ctx.fillStyle=color;
 ctx.font=`bold ${size}px Arial`;
 ctx.textAlign=align;
 ctx.fillText(t,x,y);
 ctx.textAlign="left";
}

function wrapped(t,x,y,maxWidth,lineHeight=29){
 ctx.font="bold 21px Arial";
 ctx.textAlign="center";

 let line="";
 const words=t.split(" ");

 for(const word of words){
  const test=line?line+" "+word:word;

  if(ctx.measureText(test).width>maxWidth&&line){
   ctx.fillText(line,x,y);
   y+=lineHeight;
   line=word;
  }else line=test;
 }

 ctx.fillText(line,x,y);
 ctx.textAlign="left";
}

function overlay(){
 ctx.fillStyle="#060911cf";
 ctx.fillRect(0,0,W,H);

 if(mode==="scene"){
  // Cinematic cutscene frame
  ctx.fillStyle="#0009";
  ctx.fillRect(0,0,W,70);
  ctx.fillRect(0,H-70,W,70);

  text(
   sceneKind==="intro"?"STORY CUTSCENE":
   sceneKind==="ending"?"THE FINALE":"CHAPTER COMPLETE",
   480,105,19,"#94ffc3","center"
  );

  ctx.fillStyle="#191329ed";
  ctx.fillRect(90,154,780,200);
  ctx.strokeStyle="#c9a0f2";
  ctx.lineWidth=2;
  ctx.strokeRect(90,154,780,200);

  ctx.fillStyle="#fff0e6";
  wrapped(sceneLines[sceneIndex]||"",480,235,700);

  text("CLICK OR PRESS ENTER TO CONTINUE",
   480,410,16,"#b9ffd2","center");
  return;
 }

 let title="THE DARK WITHIN";
 let desc="Press START ADVENTURE below to begin.";

 if(mode==="dead"){
  title="YOU HAVE FALLEN";
  desc="Press START ADVENTURE to retry this chapter.";
 }
 if(mode==="ending"){
  title="THE END";
  desc="The villagers are free. The Black Spirit has departed.";
 }

 text(title,480,210,42,"#adffca","center");
 text(desc,480,270,18,"#fff0d7","center");
 text("THEDARKWITHIN — 2.5D EDITION",
  480,326,15,"#a6c8b2","center");
}

function drawHUD(){
 ctx.fillStyle="#071013e5";
 ctx.fillRect(0,0,W,64);

 text("CHAPTER "+(chapter+1)+" — "+chapters[chapter].name,
  16,25,17);

 text("ENEMIES: "+enemies.filter(e=>!e.dead).length,
  800,25,16);

 ctx.fillStyle="#341d2a";
 ctx.fillRect(16,39,240,14);

 ctx.fillStyle="#fa5b83";
 ctx.fillRect(16,39,240*clamp(player.hp/player.maxHp,0,1),14);

 ctx.strokeStyle="#ffc7d2";
 ctx.lineWidth=1;
 ctx.strokeRect(16,39,240,14);

 text(Math.ceil(Math.max(0,player.hp))+"/"+player.maxHp,
  136,51,12,"#fff","center");

 if(messageTimer>0&&mode==="playing"){
  ctx.fillStyle="#161022e6";
  ctx.fillRect(240,75,480,43);
  text(message,480,103,17,"#fff0c9","center");
 }

 if(mode!=="playing")overlay();
}

function draw(){
 ctx.clearRect(0,0,W,H);
 background();

 for(const e of enemies.filter(e=>!e.dead).sort((a,b)=>a.y-b.y)){
  monster(e);
 }

 hero();
 drawShots();
 drawAnimations();
 drawParticles();
 drawHUD();
}

function frameLoop(timestamp){
 const dt=Math.min((timestamp-(lastFrame||timestamp))/1000,.035);
 lastFrame=timestamp;

 update(dt);
 draw();
 requestAnimationFrame(frameLoop);
}

/* KEYBOARD AND BUTTONS */

window.addEventListener("keydown",e=>{
 const key=e.key.toLowerCase();

 if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(key)){
  e.preventDefault();
 }

 keys[key]=true;

 if(e.repeat)return;

 if(mode==="scene"){
  if(key==="enter"||key===" ")advanceScene();
  return;
 }

 if(key==="j"||key===" ")sword();
 if(key==="m"){
  if(transformed)blackFlash();
  else waterWheel();
 }
 if(key==="n")divergentFist();
 if(key==="k")flameArrow();
});

window.addEventListener("keyup",e=>{
 keys[e.key.toLowerCase()]=false;
});

window.addEventListener("blur",()=>{
 for(const k in keys)keys[k]=false;
});

canvas.addEventListener("click",()=>{
 if(mode==="scene")advanceScene();
 else sword();
});

$("dwSword").onclick=sword;
$("dwSkill").onclick=()=>{
 if(transformed)blackFlash();
 else waterWheel();
};
$("dwDivergent").onclick=divergentFist;
$("dwFlame").onclick=flameArrow;

$("dwStart").onclick=()=>{
 Music.start();

 if(mode==="scene"){
  advanceScene();
  return;
 }

 if(mode==="ending"){
  chapter=0;
  transformed=false;
  spiritDeparted=false;
  startChapter(0);
  return;
 }

 if(mode==="dead"){
  startChapter(chapter);
  return;
 }

 if(mode==="menu"){
  startChapter(chapter);
 }
};

$("dwRestart").onclick=()=>{
 if(!confirm("Restart TheDarkWithin from Chapter 1?"))return;

 chapter=0;
 transformed=false;
 spiritDeparted=false;
 finished=false;
 startChapter(0);
};

$("dwDifficulty").onchange=e=>{
 difficulty=e.target.value;

 if(mode==="playing"||mode==="dead"){
  startChapter(chapter);
 }
};

$("dwFullscreen").onclick=async()=>{
 try{
  if(document.fullscreenElement){
   await document.exitFullscreen();
  }else{
   await frame.requestFullscreen();
  }
 }catch(e){
  alert("Fullscreen is unavailable in this browser.");
 }
};

$("dwMusic").onclick=Music.toggle;
$("dwVolume").oninput=e=>Music.setVolume(e.target.value);

updateHUD();
requestAnimationFrame(frameLoop);

})();
