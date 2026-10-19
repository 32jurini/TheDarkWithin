
(()=>{
"use strict";

if(window.__darkWithinRunning)return;
window.__darkWithinRunning=true;

const $=id=>document.getElementById(id);
const W=960,H=540;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const rand=(a,b)=>a+Math.random()*(b-a);
const TAU=Math.PI*2;

const oldFrame=$("dwGameFrame");
const oldUI=$("darkWithinUI");
if(oldFrame)oldFrame.remove();
if(oldUI)oldUI.remove();

const frame=document.createElement("div");
frame.id="dwGameFrame";
frame.style.cssText="position:relative;width:min(960px,100%);margin:14px auto;background:#080b10;overflow:hidden;border-radius:12px";

const canvas=document.createElement("canvas");
canvas.id="darkWithinCanvas";
canvas.width=W;
canvas.height=H;
canvas.style.cssText="display:block;width:100%;height:auto;image-rendering:auto";
frame.appendChild(canvas);

const mount=$("gameMount")||document.body;
mount.appendChild(frame);

const ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=true;

const ui=document.createElement("div");
ui.id="darkWithinUI";
ui.style.cssText="max-width:960px;margin:15px auto;padding:18px;background:#101b18;border:1px solid #427657;border-radius:12px;color:#eafff0;font:13px Arial";

ui.innerHTML=`
<h2 style="color:#90fbb3;margin:0 0 12px">THEDARKWITHIN — 2.5D EDITION</h2>
<div id="dwChapter" style="margin-bottom:8px"></div>
<div id="dwStatus" style="margin-bottom:12px"></div>
<div style="display:flex;gap:9px;flex-wrap:wrap;margin:10px 0">
<select id="dwDifficulty">
<option value="easy">Easy</option>
<option value="medium" selected>Medium</option>
<option value="hard">Hard</option>
<option value="extreme">Extreme</option>
</select>
<button id="dwStart">START ADVENTURE</button>
<button id="dwRestart">RESTART</button>
<button id="dwFullscreen">⛶ FULLSCREEN</button>
</div>
<div style="display:flex;gap:9px;flex-wrap:wrap;margin:10px 0">
<button id="dwSword">J / SPACE — SWORD</button>
<button id="dwSkill">M — WATER WHEEL</button>
<button id="dwDivergent">N — LOCKED</button>
<button id="dwFlame">K — FLAME ARROW</button>
</div>
<div id="dwCooldowns" style="color:#b4cebc;line-height:1.7"></div>
<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:14px">
<button id="dwMusic">♫ MUSIC ON</button>
<label>VOLUME <input id="dwVolume" type="range" min="0" max="100" value="35"></label>
</div>
<p style="color:#a6c0af;line-height:1.7;margin-bottom:0">
WASD / ARROWS — MOVE • J / SPACE / CLICK — SWORD<br>
M — WATER WHEEL / BLACK FLASH • N — DIVERGENT FIST • K — FLAME ARROW
</p>`;

mount.appendChild(ui);

for(const b of ui.querySelectorAll("button,select")){
b.style.cssText="padding:11px 13px;background:#203b2d;color:#d9ffe5;border:1px solid #6aa87f;border-radius:8px;cursor:pointer;font-weight:bold";
}

const chapters=[
{name:"The Missing Villagers",story:"The villagers have disappeared into the forest. Find them and defeat the monsters blocking your path.",enemy:"slime",count:4},
{name:"The Frozen Mountains",story:"Follow the villagers' trail into the frozen mountains. Survive the icy creatures guarding the pass.",enemy:"ice",count:5},
{name:"The Forgotten Desert",story:"The journey continues across an ancient desert where dangerous creatures hide among forgotten ruins.",enemy:"sand",count:6},
{name:"The Cage of Shadows",story:"You've found the captured villagers, but the darkness seals the way out. Fight to free them.",enemy:"shadow",count:6},
{name:"The Darkness Below",story:"Trapped beneath the world, you must defeat the creatures lurking in the underground kingdom.",enemy:"dark",count:7},
{name:"The Black Spirit",story:"A mysterious spirit enters your body. Your powers transform, and a dark new strength awakens.",enemy:"spirit",count:7},
{name:"The Fallen Kingdom",story:"Now wearing black dragon armor, you approach the Purple King's ruined kingdom.",enemy:"knight",count:8},
{name:"The Purple King's Domain",story:"Face the Purple King, end the corruption, and save the villagers once and for all.",enemy:"boss",count:1}
];

const enemyTypes={
slime:{hp:35,speed:55,damage:7,r:20,color:"#70c897"},
ice:{hp:48,speed:65,damage:9,r:21,color:"#a1e8ff"},
sand:{hp:58,speed:76,damage:11,r:21,color:"#d8ad72"},
shadow:{hp:72,speed:85,damage:13,r:23,color:"#ac7adc"},
dark:{hp:88,speed:95,damage:15,r:24,color:"#75618d"},
spirit:{hp:105,speed:105,damage:17,r:25,color:"#df749a"},
knight:{hp:145,speed:85,damage:20,r:29,color:"#a6a4b6"},
boss:{hp:1100,speed:65,damage:25,r:58,color:"#a95bea"}
};

const difficulties={
easy:{health:150,enemyHp:.7,damage:.6},
medium:{health:110,enemyHp:1,damage:1},
hard:{health:100,enemyHp:1.4,damage:1.5},
extreme:{health:90,enemyHp:1.8,damage:2.1}
};

let difficulty="medium";
let chapter=0;
let started=false;
let cleared=false;
let gameOver=false;
let victory=false;
let transformed=false;
let elapsed=0;
let previous=0;
let message="";
let messageTime=0;
let enemies=[];
let projectiles=[];
let effects=[];
let particles=[];
let cameraX=0;
let scene=null;
let sceneIndex=0;
let sceneDone=null;
let sceneWasStarted=false;
let bossPhase=1;

const keys={};

const player={
x:480,y:435,r:19,
facing:1,speed:220,
hp:110,maxHp:110,
inv:0,swordCd:0,skillCd:0,
divergentCd:0,flameCd:0,
attack:0,skillVisual:0,
divergentVisual:0,walk:0
};

function notice(text,seconds=2.7){
message=text;
messageTime=seconds;
}

function glow(x,y,r,color){
const g=ctx.createRadialGradient(x,y,0,x,y,r);
g.addColorStop(0,color);
g.addColorStop(1,"rgba(0,0,0,0)");
ctx.fillStyle=g;
ctx.fillRect(x-r,y-r,r*2,r*2);
}

function gradient(x,y,w,h,colors){
const g=ctx.createLinearGradient(x,y,x+w,y+h);
colors.forEach((c,i)=>g.addColorStop(i/(colors.length-1),c));
return g;
}

function ellipse(x,y,rx,ry,color){
ctx.fillStyle=color;
ctx.beginPath();
ctx.ellipse(x,y,rx,ry,0,0,TAU);
ctx.fill();
}

function spark(x,y,color,count=18){
for(let i=0;i<count;i++){
const a=Math.random()*TAU;
const s=rand(45,245);
particles.push({
x,y,vx:Math.cos(a)*s,
vy:Math.sin(a)*s,
life:rand(.25,.75),
max:.75,size:rand(2,5),color
});
}
}

function spawnRing(x,y,color,r=60){
effects.push({type:"ring",x,y,color,r,life:.5,max:.5});
}

function textLine(text,x,y,size=18,color="#fff",align="left"){
ctx.font=`bold ${size}px Arial`;
ctx.fillStyle=color;
ctx.textAlign=align;
ctx.fillText(text,x,y);
ctx.textAlign="left";
}

function darkOverlay(){
ctx.fillStyle="#050509aa";
ctx.fillRect(0,0,W,H);
}

/* 2.5D SCENERY */

const themes=[
{top:"#193e37",middle:"#466a54",light:"#bbf2aa",ground:"#384e3b"},
{top:"#506e96",middle:"#b3d1de",light:"#fff2d2",ground:"#9bb3bd"},
{top:"#ac7654",middle:"#efba83",light:"#fff1b8",ground:"#8e6248"},
{top:"#392947",middle:"#6b4a75",light:"#e4a1ff",ground:"#382d41"},
{top:"#161b31",middle:"#363452",light:"#8b8df3",ground:"#26263a"},
{top:"#241326",middle:"#57304d",light:"#ef91c8",ground:"#281b31"},
{top:"#503044",middle:"#9a5d69",light:"#ffb6a0",ground:"#352632"},
{top:"#1a0e30",middle:"#49205d",light:"#dd87ff",ground:"#30193e"}
];

function mountains(layer){
const t=themes[chapter];
const parallax=[.08,.2,.4][layer];
const y=[346,367,395][layer];
const height=[130,180,155][layer];

ctx.fillStyle=layer===0?"#e2d7f022":
layer===1?"#2a2c4380":"#151d2ca3";

ctx.beginPath();
ctx.moveTo(0,H);

for(let i=-1;i<=13;i++){
const x=i*112-cameraX*parallax;
const h=height+(i*53+chapter*31)%100;
ctx.lineTo(x,y);
ctx.lineTo(x+56,y-h);
ctx.lineTo(x+112,y);
}

ctx.lineTo(W,H);
ctx.closePath();
ctx.fill();
}

function tree(x,y,s=1,leaf="#2e6950"){
ctx.save();
ctx.translate(x,y);
ctx.scale(s,s);

ellipse(0,7,29,8,"#080e0d6b");

ctx.strokeStyle="#483124";
ctx.lineWidth=19;
ctx.lineCap="round";
ctx.beginPath();
ctx.moveTo(0,5);
ctx.quadraticCurveTo(-5,-83,7,-143);
ctx.stroke();

ctx.lineWidth=8;
ctx.beginPath();
ctx.moveTo(0,-95);
ctx.lineTo(-43,-130);
ctx.moveTo(5,-115);
ctx.lineTo(43,-150);
ctx.stroke();

for(const [dx,dy,r] of [
[-39,-155,42],[11,-177,55],[45,-143,41],
[-7,-122,48]
]){
const g=ctx.createRadialGradient(dx-15,dy-18,0,dx,dy,r);
g.addColorStop(0,"#619a72");
g.addColorStop(.55,leaf);
g.addColorStop(1,"#142b29");

ctx.fillStyle=g;
ctx.beginPath();
ctx.arc(dx,dy,r,0,TAU);
ctx.fill();
}

ctx.restore();
}

function pine(x,y,s=1,snow=false){
ctx.save();
ctx.translate(x,y);
ctx.scale(s,s);

ctx.fillStyle="#45352b";
ctx.fillRect(-6,-160,12,175);

for(let j=0;j<4;j++){
const level=j*35;
ctx.fillStyle=snow?"#456b74":"#223e37";
ctx.beginPath();
ctx.moveTo(0,-220+level);
ctx.lineTo(70-level*.18,-95+level);
ctx.lineTo(-70+level*.18,-95+level);
ctx.closePath();
ctx.fill();

if(snow){
ctx.strokeStyle="#f3fbff";
ctx.lineWidth=5;
ctx.beginPath();
ctx.moveTo(0,-220+level);
ctx.lineTo(39-level*.1,-145+level);
ctx.stroke();
}
}

ctx.restore();
}

function castle(x,y,s=1,corrupt=false){
ctx.save();
ctx.translate(x,y);
ctx.scale(s,s);

ctx.fillStyle="#1d1424";
ctx.fillRect(-135,-155,270,155);

const wall=gradient(-120,-180,120,0,
corrupt?["#5a3f63","#21182b"]:["#a1a0ae","#464151"]);

ctx.fillStyle=wall;
ctx.fillRect(-125,-150,250,145);

for(const dx of [-120,0,120]){
ctx.fillStyle=corrupt?"#493453":"#787b8c";
ctx.fillRect(dx-36,-255,72,255);

ctx.fillStyle=corrupt?"#4a215d":"#39334e";
ctx.beginPath();
ctx.moveTo(dx-49,-255);
ctx.lineTo(dx,-327);
ctx.lineTo(dx+49,-255);
ctx.fill();

ctx.fillStyle=corrupt?"#e392ff":"#ffce85";
ctx.fillRect(dx-8,-210,16,51);
}

ctx.fillStyle="#100d1b";
ctx.beginPath();
ctx.arc(0,-42,40,Math.PI,0);
ctx.lineTo(40,0);
ctx.lineTo(-40,0);
ctx.fill();

ctx.restore();
}

function desertRuin(x,y,s){
ctx.save();
ctx.translate(x,y);
ctx.scale(s,s);

ctx.fillStyle="#8b614b";
ctx.fillRect(-65,-115,35,115);
ctx.fillRect(35,-135,35,135);

ctx.fillStyle="#d1a57b";
ctx.fillRect(-78,-123,60,17);
ctx.fillRect(23,-143,60,17);

ctx.strokeStyle="#5e3b34";
ctx.lineWidth=5;
ctx.beginPath();
ctx.arc(0,-82,55,Math.PI,0);
ctx.stroke();

ctx.restore();
}

function drawBackground(){
const t=themes[chapter];

ctx.fillStyle=gradient(0,0,0,H,[t.top,t.middle,t.ground]);
ctx.fillRect(0,0,W,H);

const sunX=730-cameraX*.02;

glow(sunX,115,225,t.light+"55");
ellipse(sunX,115,48,48,t.light);

if(chapter>=3){
ellipse(sunX,115,45,45,"#1a1123");
ctx.strokeStyle=t.light;
ctx.lineWidth=7;
ctx.shadowColor=t.light;
ctx.shadowBlur=24;
ctx.beginPath();
ctx.arc(sunX,115,57,0,TAU);
ctx.stroke();
ctx.shadowBlur=0;
}

for(let i=0;i<90;i++){
const x=((i*157-cameraX*.08)%1050+1050)%1050;
const y=(i*83)%350;
ellipse(x,y,1.2,1.2,"#ffffff55");
}

mountains(0);
mountains(1);

if(chapter===0){
for(let i=-2;i<14;i++){
tree(i*155-cameraX*.25,373,.5+(i%3)*.1);
}
}

if(chapter===1){
for(let i=-2;i<12;i++){
pine(i*190-cameraX*.25,388,.6+(i%3)*.13,true);
}
}

if(chapter===2){
for(let i=-2;i<12;i++){
desertRuin(i*235-cameraX*.2,377,.5+(i%3)*.13);
}
}

if(chapter===3||chapter===6){
castle(480-cameraX*.15,375,.9,chapter===6);
}

if(chapter===4||chapter===5){
for(let i=0;i<15;i++){
const x=i*77-cameraX*.12;
ctx.fillStyle="#100b1b";
ctx.beginPath();
ctx.moveTo(x,0);
ctx.lineTo(x+33,90+(i%4)*24);
ctx.lineTo(x+77,0);
ctx.fill();
}
for(let i=0;i<9;i++){
const x=i*145-cameraX*.16;
glow(x,310,70,chapter===5?"#cb56d044":"#6675de33");
}
}

if(chapter===7){
castle(480,390,1.4,true);
glow(480,365,280,"#ac53ec55");
ctx.strokeStyle="#be64e9";
ctx.lineWidth=8;
ctx.shadowColor="#c87aff";
ctx.shadowBlur=26;
ctx.beginPath();
ctx.ellipse(480,435,270,79,0,0,TAU);
ctx.stroke();
ctx.shadowBlur=0;
}

mountains(2);

if(chapter===0){
for(let i=-1;i<11;i++){
tree(i*170-cameraX*.44,395,.65,"#225f46");
}
}

if(chapter===1){
for(let i=-1;i<11;i++){
pine(i*145-cameraX*.45,405,.55,true);
}
}

const floor=gradient(0,350,0,540,
[t.ground,chapter===1?"#e3eef4":"#242a27","#0d1017"]);

ctx.fillStyle=floor;
ctx.fillRect(0,350,W,190);

ctx.strokeStyle=chapter===1?"#d2e1ed55":"#ffffff13";
ctx.lineWidth=1.5;

for(let y=355;y<H;y+=17+(y-350)*.08){
ctx.beginPath();
ctx.moveTo(0,y);
ctx.lineTo(W,y);
ctx.stroke();
}

for(let x=-600;x<1600;x+=115){
ctx.beginPath();
ctx.moveTo(480,350);
ctx.lineTo(x,H);
ctx.stroke();
}

for(let i=0;i<70;i++){
const x=(i*137)%W;
const y=365+(i*73)%175;
ellipse(x,y,2+(i%4),1.5,"#ffffff19");
}

for(let i=0;i<6;i++){
const x=i*240+Math.sin(elapsed*.25+i)*35;
glow(x,388,160,t.light+"0c");
}

// Foreground foliage creates a depth layer.
if(chapter===0){
for(let i=0;i<9;i++){
const x=i*135-cameraX*.7;
ellipse(x,520,70,24,"#10291f99");
}
}

const vignette=ctx.createRadialGradient(480,260,160,480,270,630);
vignette.addColorStop(0,"#00000000");
vignette.addColorStop(1,"#03030999");

ctx.fillStyle=vignette;
ctx.fillRect(0,0,W,H);
}

/* SMOOTH 2.5D CHARACTER */

function knight(x,y,dragon=false,scale=1){
ctx.save();
ctx.translate(x,y);
ctx.scale(scale,scale);

const moving=Math.hypot(player.x-x,player.y-y)<5&&
(keys.w||keys.a||keys.s||keys.d||
keys.arrowup||keys.arrowdown||keys.arrowleft||keys.arrowright);

const stride=moving?Math.sin(elapsed*13)*6:0;
const bob=moving?Math.abs(Math.sin(elapsed*13))*2:Math.sin(elapsed*2)*1.4;

ellipse(0,27,31,8,"#00000077");

// Flowing cape
const cape=ctx.createLinearGradient(-25,-30,25,32);
cape.addColorStop(0,dragon?"#6e1738":"#346c85");
cape.addColorStop(1,"#13111f");

ctx.fillStyle=cape;
ctx.beginPath();
ctx.moveTo(-13,-29+bob);
ctx.quadraticCurveTo(-35,-15,-28,28+Math.sin(elapsed*6)*3);
ctx.lineTo(17,25);
ctx.lineTo(14,-28+bob);
ctx.closePath();
ctx.fill();

// Animated armored legs
for(const side of [-1,1]){
ctx.save();
ctx.translate(side*10,8);
ctx.rotate(side*stride*.014);

ctx.fillStyle="#252533";
ctx.beginPath();
ctx.roundRect(-6,0,12,23,4);
ctx.fill();

ctx.fillStyle=dragon?"#5b3c54":"#8098b5";
ctx.beginPath();
ctx.roundRect(-7,13,14,14,3);
ctx.fill();

ctx.restore();
}

// Chest plate
const armor=ctx.createLinearGradient(-20,-28,22,17);
armor.addColorStop(0,dragon?"#69606f":"#b9cedc");
armor.addColorStop(.45,dragon?"#2b2438":"#5a91be");
armor.addColorStop(1,"#172034");

ctx.fillStyle=armor;
ctx.beginPath();
ctx.moveTo(-18,-27+bob);
ctx.quadraticCurveTo(0,-35+bob,18,-27+bob);
ctx.lineTo(20,8+bob);
ctx.quadraticCurveTo(0,24+bob,-20,8+bob);
ctx.closePath();
ctx.fill();

ctx.strokeStyle=dragon?"#9e4663":"#d3e9ef";
ctx.lineWidth=2;
ctx.stroke();

// Shoulder pieces
for(const s of [-1,1]){
ctx.fillStyle=dragon?"#3e3549":"#7897b5";
ctx.beginPath();
ctx.ellipse(s*20,-20+bob,12,13,s*.2,0,TAU);
ctx.fill();
ctx.stroke();
}

// Face
ellipse(0,-41+bob,13,16,dragon?"#30283c":"#e3b899");

// Helmet / hair
ctx.fillStyle=dragon?"#171320":"#3b303b";
ctx.beginPath();
ctx.moveTo(-16,-41+bob);
ctx.quadraticCurveTo(-17,-67+bob,0,-59+bob);
ctx.quadraticCurveTo(18,-65+bob,16,-42+bob);
ctx.lineTo(11,-34+bob);
ctx.lineTo(-11,-34+bob);
ctx.closePath();
ctx.fill();

// Eyes
const eye=dragon?"#ff426c":"#c6fbff";
ctx.fillStyle=eye;
ctx.shadowColor=eye;
ctx.shadowBlur=dragon?16:7;
ctx.fillRect(player.facing>0?3:-9,-43+bob,7,4);
ctx.shadowBlur=0;

// Black dragon armor horns
if(dragon){
ctx.fillStyle="#17111c";

for(const s of [-1,1]){
ctx.beginPath();
ctx.moveTo(s*11,-53+bob);
ctx.lineTo(s*24,-83+bob);
ctx.lineTo(s*4,-60+bob);
ctx.fill();
}

glow(0,-4+bob,26,"#ff335044");

ctx.fillStyle="#ed4466";
ctx.beginPath();
ctx.moveTo(0,-15+bob);
ctx.lineTo(8,-3+bob);
ctx.lineTo(0,12+bob);
ctx.lineTo(-8,-3+bob);
ctx.fill();
}

// Sword, with angular hilt and glowing blade
ctx.save();
ctx.translate(player.facing*22,-7+bob);
ctx.rotate(player.facing>0?-.25:Math.PI+.25);

ctx.shadowColor=dragon?"#ff667e":"#b2eaff";
ctx.shadowBlur=16;
ctx.fillStyle=dragon?"#e7aab9":"#d6f1ff";

ctx.beginPath();
ctx.moveTo(-4,2);
ctx.lineTo(-6,-58);
ctx.lineTo(0,-72);
ctx.lineTo(6,-58);
ctx.lineTo(4,2);
ctx.closePath();
ctx.fill();

ctx.shadowBlur=0;
ctx.fillStyle="#d8af76";
ctx.fillRect(-15,-2,30,7);
ctx.fillStyle="#43303a";
ctx.fillRect(-4,4,8,19);
ctx.restore();

ctx.restore();
}

/* ENEMIES */

function monster(e){
const bob=Math.sin(elapsed*3+e.x*.02)*4;
const x=e.x,y=e.y+bob;
const r=e.r;

ctx.save();
ctx.translate(x,y);

ellipse(0,r+13,r*1.2,9,"#0009");

const g=ctx.createRadialGradient(-r*.3,-r*.5,1,0,0,r*1.4);
g.addColorStop(0,e.flash>0?"#ffffff":"#ddd2e8");
g.addColorStop(.28,e.flash>0?"#ffffff":e.color);
g.addColorStop(1,"#181222");

ctx.fillStyle=g;
ctx.shadowColor=e.color;
ctx.shadowBlur=10;

ctx.beginPath();
ctx.moveTo(-r*.85,-r*.35);
ctx.quadraticCurveTo(-r*.9,-r*1.2,0,-r*1.2);
ctx.quadraticCurveTo(r*.95,-r*1.2,r*.85,-r*.35);
ctx.lineTo(r*.75,r*.75);
ctx.quadraticCurveTo(0,r*1.4,-r*.75,r*.75);
ctx.closePath();
ctx.fill();
ctx.shadowBlur=0;

// Curved horns
ctx.strokeStyle="#191522";
ctx.lineWidth=Math.max(4,r*.25);
ctx.lineCap="round";

for(const s of [-1,1]){
ctx.beginPath();
ctx.moveTo(s*r*.53,-r*.35);
ctx.quadraticCurveTo(s*r*1.25,-r*1.2,s*r*.85,-r*1.65);
ctx.stroke();
}

// Glowing eyes
ctx.fillStyle=chapter>=3?"#ff668d":"#d5fbff";
ctx.shadowColor=ctx.fillStyle;
ctx.shadowBlur=13;

for(const side of [-1,1]){
ctx.beginPath();
ctx.ellipse(side*r*.32,-r*.12,r*.14,3,0,0,TAU);
ctx.fill();
}

ctx.shadowBlur=0;

if(e.type==="knight"){
ctx.fillStyle="#777483";
ctx.beginPath();
ctx.moveTo(-r,-r*.5);
ctx.lineTo(0,-r*1.6);
ctx.lineTo(r,-r*.5);
ctx.lineTo(r*.65,r);
ctx.lineTo(-r*.65,r);
ctx.fill();
}

if(e.type==="boss"){
drawPurpleKing(e);
}

ctx.restore();

// Enemy health bar
const w=e.type==="boss"?155:48;
const h=e.type==="boss"?12:7;
const top=e.y-(e.type==="boss"?174:r+43);

ctx.fillStyle="#1a1022";
ctx.fillRect(e.x-w/2,top,w,h);
ctx.fillStyle=e.type==="boss"?"#ce73ff":"#f17c93";
ctx.fillRect(e.x-w/2,top,w*clamp(e.hp/e.maxHp,0,1),h);
}

function drawPurpleKing(e){
const r=e.r;

// Huge trailing mantle
const cape=ctx.createLinearGradient(-80,-80,80,140);
cape.addColorStop(0,"#5e2b82");
cape.addColorStop(1,"#190f2a");

ctx.fillStyle=cape;
ctx.beginPath();
ctx.moveTo(-47,-58);
ctx.quadraticCurveTo(-95,30,-80,112);
ctx.lineTo(0,130);
ctx.lineTo(80,112);
ctx.quadraticCurveTo(95,30,47,-58);
ctx.fill();

// Plate armor
const armor=ctx.createLinearGradient(-63,-85,80,60);
armor.addColorStop(0,"#df9cff");
armor.addColorStop(.35,"#7838a3");
armor.addColorStop(1,"#29143a");

ctx.fillStyle=e.flash>0?"#fff":armor;
ctx.beginPath();
ctx.moveTo(-53,-66);
ctx.lineTo(0,-94);
ctx.lineTo(53,-66);
ctx.lineTo(69,35);
ctx.lineTo(0,68);
ctx.lineTo(-69,35);
ctx.closePath();
ctx.fill();

ctx.strokeStyle="#c77bed";
ctx.lineWidth=5;
ctx.stroke();

// King's face
ellipse(0,-101,39,44,"#24102f");

// Crown
ctx.fillStyle="#f3c578";
ctx.shadowColor="#f6bc8a";
ctx.shadowBlur=13;
ctx.beginPath();
ctx.moveTo(-49,-120);
ctx.lineTo(-57,-172);
ctx.lineTo(-26,-144);
ctx.lineTo(0,-184);
ctx.lineTo(25,-144);
ctx.lineTo(57,-172);
ctx.lineTo(49,-120);
ctx.closePath();
ctx.fill();
ctx.shadowBlur=0;

// Toxic glow and eyes
glow(0,-7,55,"#cf35eb66");
ctx.fillStyle="#ff89bf";
ctx.shadowColor="#ed56ff";
ctx.shadowBlur=24;
ctx.fillRect(-29,-110,19,8);
ctx.fillRect(10,-110,19,8);
ctx.shadowBlur=0;

ctx.fillStyle="#ef85ff";
ctx.beginPath();
ctx.moveTo(0,-30);
ctx.lineTo(15,-5);
ctx.lineTo(0,21);
ctx.lineTo(-15,-5);
ctx.fill();
}

/* COMBAT */

function canAct(){
return started&&!cleared&&!gameOver&&!victory&&!scene;
}

function hurtEnemy(e,dmg){
if(e.dead)return;

e.hp-=dmg;
e.flash=.15;
spark(e.x,e.y,e.color,9);

if(e.hp<=0){
e.dead=true;
spark(e.x,e.y,e.color,32);
}
}

function hurtPlayer(dmg){
if(player.inv>0||!canAct())return;

player.hp-=dmg;
player.inv=.8;
spark(player.x,player.y,"#ff7e9a",18);

if(player.hp<=0){
gameOver=true;
notice("YOU FELL — PRESS START TO RETRY");
$("dwStart").textContent="RETRY CHAPTER";
}
}

function sword(){
if(!canAct()||player.swordCd>0)return;

player.swordCd=.32;
player.attack=.22;
spark(player.x+player.facing*40,player.y-12,"#d7efff",12);

for(const e of enemies){
if(!e.dead&&dist(player.x,player.y,e.x,e.y)<105+e.r&&
(e.x-player.x)*player.facing>-32){
hurtEnemy(e,35);
}
}
}

function special(){
if(!canAct()||player.skillCd>0)return;

player.skillCd=transformed?4.5:4;
player.skillVisual=.6;

const radius=transformed?190:165;

for(const e of enemies){
if(!e.dead&&dist(player.x,player.y,e.x,e.y)<radius+e.r){
hurtEnemy(e,transformed?150:95);
}
}

if(transformed){
spark(player.x,player.y,"#ff426d",65);
spawnRing(player.x,player.y,"#ff315d",175);
notice("BLACK FLASH!");
}else{
spark(player.x,player.y,"#77dfff",60);
spawnRing(player.x,player.y,"#7feaff",150);
notice("WATER WHEEL!");
}
}

function divergent(){
if(!canAct()||!transformed||player.divergentCd>0)return;

player.divergentCd=6.5;
player.divergentVisual=.6;

for(const e of enemies){
if(!e.dead&&dist(player.x,player.y,e.x,e.y)<220+e.r){
hurtEnemy(e,185);
}
}

spark(player.x,player.y,"#55baff",75);
spawnRing(player.x,player.y,"#84d9ff",200);
notice("DIVERGENT FIST!");
}

function flame(){
if(!canAct()||player.flameCd>0)return;

player.flameCd=1.3;

projectiles.push({
x:player.x+player.facing*24,
y:player.y-15,
vx:player.facing*540,
vy:0,
r:13,dmg:90,life:2.5,
friendly:true,type:"flame"
});

spark(player.x,player.y,"#ffb363",16);
}

function spawnChapter(){
const data=chapters[chapter];
const type=enemyTypes[data.enemy];
const d=difficulties[difficulty];

enemies=[];
projectiles=[];
effects=[];
particles=[];

for(let i=0;i<data.count;i++){
const angle=TAU*i/data.count;
const boss=data.enemy==="boss";

const x=boss?710:
clamp(480+Math.cos(angle)*(230+(i%2)*75),50,910);

const y=boss?280:
clamp(290+Math.sin(angle)*125,205,450);

enemies.push({
x,y,
r:type.r,
type:data.enemy,
color:type.color,
hp:type.hp*d.enemyHp,
maxHp:type.hp*d.enemyHp,
speed:type.speed,
damage:type.damage*d.damage,
flash:0,animation:i,
attack:rand(.4,1.5),
shoot:rand(1,2.4),
dead:false
});
}

cameraX=0;
bossPhase=1;
cleared=false;
gameOver=false;
started=true;
player.hp=player.maxHp;
player.inv=1.2;
player.x=200;
player.y=420;
}

function startChapter(n){
chapter=clamp(n,0,7);
transformed=chapter>=5||transformed;
spawnChapter();
musicStart();

$("dwSkill").textContent=transformed?
"M — BLACK FLASH":"M — WATER WHEEL";
$("dwDivergent").textContent=transformed?
"N — DIVERGENT FIST":"N — LOCKED";

notice("CHAPTER "+(chapter+1)+" — "+chapters[chapter].name,3);
}

/* CUTSCENES */

function storyScene(lines,done){
scene=lines;
sceneIndex=0;
sceneDone=done;
sceneWasStarted=started;
started=false;
advanceScene();
}

function advanceScene(){
sceneIndex++;

if(!scene||sceneIndex>scene.length){
scene=null;
started=sceneWasStarted;
const done=sceneDone;
sceneDone=null;
if(done)done();
}
}

function chapterComplete(){
if(cleared||gameOver)return;

cleared=true;

if(chapter===7){
victory=true;
started=false;
storyScene([
"The Purple King falls, and his toxic mist dissolves.",
"The dark spirit leaves your body, but your abilities remain.",
"The villagers are finally free.",
"The journey through TheDarkWithin is complete."
],()=>{
$("dwStart").textContent="REPLAY STORY";
notice("THE END — VICTORY!",8);
});
return;
}

const next=chapter+1;

const lines=[
"CHAPTER "+(chapter+1)+" COMPLETE",
chapters[chapter].story,
"All monsters have been defeated."
];

if(chapter===4){
lines.push("A black spirit emerges from the darkness and enters your body.");
lines.push("Your armor transforms into black dragon armor.");
lines.push("WATER WHEEL EVOLVES INTO BLACK FLASH.");
lines.push("DIVERGENT FIST HAS BEEN UNLOCKED.");
}

storyScene(lines,()=>{
if(next===5)transformed=true;
startChapter(next);
});
}

/* MUSIC */

let audio=null;
let gain=null;
let musicEnabled=true;
let volume=.35;
let musicTimer=null;
let musicStep=0;

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

function note(midi,bass=false){
if(!audio||!gain||!musicEnabled||!midi)return;

const o=audio.createOscillator();
const g=audio.createGain();
const now=audio.currentTime;

o.type=bass?"triangle":"square";
o.frequency.value=440*Math.pow(2,(midi-69)/12);

g.gain.setValueAtTime(.0001,now);
g.gain.linearRampToValueAtTime(bass?.17:.08,now+.02);
g.gain.exponentialRampToValueAtTime(.0001,now+(bass?.43:.2));

o.connect(g);
g.connect(gain);
o.start(now);
o.stop(now+(bass?.45:.22));
}

function musicStart(){
if(!musicEnabled)return;

try{
if(!audio){
const AC=window.AudioContext||window.webkitAudioContext;
if(!AC)return;
audio=new AC();
gain=audio.createGain();
gain.gain.value=volume*.5;
gain.connect(audio.destination);
}

audio.resume().catch(()=>{});

if(!musicTimer){
musicTimer=setInterval(()=>{
if(!started||scene||!musicEnabled)return;

const seq=melodies[chapter];
note(seq[musicStep%seq.length]);

if(musicStep%4===0){
note((seq[musicStep%seq.length]||48)-24,true);
}

musicStep++;
},190);
}
}catch(e){}
}

/* UPDATE */

function update(dt){
elapsed+=dt;
cameraX+=dt*7;

if(messageTime>0)messageTime-=dt;

for(let i=particles.length-1;i>=0;i--){
const p=particles[i];
p.x+=p.vx*dt;
p.y+=p.vy*dt;
p.life-=dt;
if(p.life<=0)particles.splice(i,1);
}

for(let i=effects.length-1;i>=0;i--){
effects[i].life-=dt;
if(effects[i].life<=0)effects.splice(i,1);
}

if(!started||cleared||gameOver||victory||scene)return;

for(const key of [
"inv","swordCd","skillCd","divergentCd",
"flameCd","attack","skillVisual","divergentVisual"
]){
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

if(dx)player.facing=dx>0?1:-1;
}

player.x=clamp(player.x,25,W-25);
player.y=clamp(player.y,205,495);

for(const e of enemies){
if(e.dead)continue;

e.flash=Math.max(0,e.flash-dt);
e.animation+=dt*3;
e.attack-=dt;
e.shoot-=dt;

const x=player.x-e.x;
const y=player.y-e.y;
const d=Math.hypot(x,y)||1;

if(d>e.r+player.r+5){
e.x+=x/d*e.speed*dt;
e.y+=y/d*e.speed*dt;
}else if(e.attack<=0){
hurtPlayer(e.damage);
e.attack=1;
}

if(e.type==="boss"&&e.shoot<=0){
const phase=e.hp/e.maxHp<.35?3:e.hp/e.maxHp<.7?2:1;

if(phase!==bossPhase){
bossPhase=phase;
notice("PURPLE KING — PHASE "+phase);
spark(e.x,e.y,"#ed87ff",60);
}

const count=phase*2+1;

for(let i=0;i<count;i++){
const a=Math.atan2(y,x)+(i-(count-1)/2)*.24;

projectiles.push({
x:e.x,y:e.y,
vx:Math.cos(a)*(190+phase*40),
vy:Math.sin(a)*(190+phase*40),
r:11,dmg:e.damage,
life:4,friendly:false,type:"toxic"
});
}

e.shoot=2.3-phase*.28;
}

if(gameOver)break;
}

for(let i=projectiles.length-1;i>=0;i--){
const p=projectiles[i];

p.x+=p.vx*dt;
p.y+=p.vy*dt;
p.life-=dt;

let hit=false;

if(p.friendly){
for(const e of enemies){
if(!e.dead&&dist(p.x,p.y,e.x,e.y)<p.r+e.r){
hurtEnemy(e,p.dmg);
hit=true;
break;
}
}
}else if(dist(p.x,p.y,player.x,player.y)<p.r+player.r){
hurtPlayer(p.dmg);
hit=true;
}

if(hit||p.life<=0||p.x<0||p.x>W||p.y<0||p.y>H){
projectiles.splice(i,1);
}
}

if(!gameOver&&enemies.every(e=>e.dead)){
chapterComplete();
}

updateHUD();
}

function updateHUD(){
$("dwChapter").textContent=
"CHAPTER "+(chapter+1)+" — "+chapters[chapter].name;

$("dwStatus").textContent=
"HP "+Math.ceil(Math.max(0,player.hp))+"/"+player.maxHp+
" | ENEMIES "+enemies.filter(e=>!e.dead).length;

$("dwCooldowns").textContent=
"SWORD "+(player.swordCd<=0?"READY":player.swordCd.toFixed(1)+"s")+
" • "+(transformed?"BLACK FLASH":"WATER WHEEL")+" "+
(player.skillCd<=0?"READY":player.skillCd.toFixed(1)+"s")+
" • DIVERGENT "+(!transformed?"LOCKED":player.divergentCd<=0?"READY":player.divergentCd.toFixed(1)+"s")+
" • FLAME "+(player.flameCd<=0?"READY":player.flameCd.toFixed(1)+"s");
}

/* DRAW MAGIC */

function drawMagic(){
for(const p of projectiles){
const color=p.friendly?"#ff9d54":"#c363eb";
glow(p.x,p.y,48,color+"88");
ellipse(p.x,p.y,p.r,p.r,color);
ellipse(p.x-4,p.y-4,p.r*.38,p.r*.38,"#fff6cc");
}

for(const effect of effects){
const alpha=clamp(effect.life/effect.max,0,1);
ctx.save();
ctx.globalAlpha=alpha;
ctx.strokeStyle=effect.color;
ctx.lineWidth=12;
ctx.shadowColor=effect.color;
ctx.shadowBlur=23;
ctx.beginPath();
ctx.arc(effect.x,effect.y,effect.r*(1+(1-alpha)*.45),0,TAU);
ctx.stroke();
ctx.restore();
}

if(player.skillVisual>0){
const a=player.skillVisual/.6;
ctx.save();
ctx.translate(player.x,player.y);

if(transformed){
ctx.strokeStyle="#ff3a64";
ctx.shadowColor="#f6004c";
ctx.shadowBlur=32;
ctx.lineWidth=16;

for(let i=0;i<4;i++){
ctx.save();
ctx.rotate(elapsed*3+i*TAU/4);
ctx.beginPath();
ctx.moveTo(-110,-60);
ctx.lineTo(100,55);
ctx.stroke();
ctx.restore();
}
}else{
ctx.rotate(elapsed*7);
ctx.strokeStyle="#52caff";
ctx.shadowColor="#6cefff";
ctx.shadowBlur=30;
ctx.lineWidth=15;

ctx.beginPath();
ctx.arc(0,0,100,0,TAU);
ctx.stroke();

ctx.strokeStyle="#d9faff";
ctx.lineWidth=5;
ctx.beginPath();
ctx.arc(0,0,72,0,TAU);
ctx.stroke();
}

ctx.restore();
}

if(player.divergentVisual>0){
glow(player.x,player.y,190,"#459cfc77");
ctx.strokeStyle="#9ddcff";
ctx.shadowColor="#60c4ff";
ctx.shadowBlur=35;
ctx.lineWidth=16;
ctx.beginPath();
ctx.arc(player.x,player.y,170*(1-player.divergentVisual/.8),0,TAU);
ctx.stroke();
ctx.shadowBlur=0;
}

if(player.attack>0){
ctx.strokeStyle=transformed?"#fa7895":"#d3efff";
ctx.shadowColor=ctx.strokeStyle;
ctx.shadowBlur=28;
ctx.lineWidth=14;
ctx.beginPath();
ctx.arc(player.x+player.facing*40,player.y-15,75,
player.facing>0?-.9:Math.PI-.9,
player.facing>0?.9:Math.PI+.9);
ctx.stroke();
ctx.shadowBlur=0;
}
}

function drawHUD(){
ctx.fillStyle="#071012da";
ctx.fillRect(0,0,W,65);

textLine("CHAPTER "+(chapter+1)+" — "+chapters[chapter].name,16,24,18);
textLine("ENEMIES: "+enemies.filter(e=>!e.dead).length,805,24,16);

ctx.fillStyle="#321a29";
ctx.fillRect(17,39,238,14);

ctx.fillStyle="#ff5884";
ctx.fillRect(17,39,238*clamp(player.hp/player.maxHp,0,1),14);

ctx.strokeStyle="#f9d6dc";
ctx.lineWidth=1;
ctx.strokeRect(17,39,238,14);

textLine(Math.ceil(Math.max(0,player.hp))+"/"+player.maxHp,110,51,12,"#fff","center");

if(messageTime>0){
ctx.fillStyle="#100d1ad9";
ctx.fillRect(230,75,500,43);
textLine(message,480,103,18,"#fff4d6","center");
}

if(scene){
darkOverlay();

textLine("THE DARK WITHIN",480,120,39,"#bbf7d0","center");

ctx.fillStyle="#171325ef";
ctx.fillRect(110,178,740,184);
ctx.strokeStyle="#9decb7";
ctx.lineWidth=2;
ctx.strokeRect(110,178,740,184);

const line=scene[sceneIndex-1]||"";
ctx.textAlign="center";
ctx.font="bold 22px Arial";
ctx.fillStyle="#f0e8ff";

const words=line.split(" ");
let current="";
let y=245;

for(const word of words){
if(ctx.measureText(current+" "+word).width>660){
ctx.fillText(current,480,y);
current=word;
y+=32;
}else{
current+=(current?" ":"")+word;
}
}
ctx.fillText(current,480,y);

textLine("CLICK OR PRESS ENTER TO CONTINUE",480,399,16,"#d2fadd","center");
}

if(!started&&!scene){
darkOverlay();

const headline=victory?"THE DARKNESS IS DEFEATED":
gameOver?"YOU HAVE FALLEN":
"THE DARK WITHIN";

textLine(headline,480,215,42,"#b8ffd0","center");

const subtitle=victory?
"The Purple King has fallen. The villagers are free.":
gameOver?
"Press Start Adventure to retry this chapter.":
"Eight chapters. One journey into the darkness.";

textLine(subtitle,480,270,19,"#fff0d6","center");
textLine("USE THE START ADVENTURE BUTTON BELOW",480,320,17,"#cbfad9","center");
}
}

/* RENDER */

function draw(){
ctx.clearRect(0,0,W,H);
drawBackground();

const sorted=enemies.filter(e=>!e.dead).sort((a,b)=>a.y-b.y);

for(const e of sorted){
monster(e);
}

if(player.inv<=0||Math.floor(elapsed*15)%2===0){
knight(player.x,player.y,transformed);
}

drawMagic();

for(const p of particles){
const alpha=clamp(p.life/p.max,0,1);
ctx.globalAlpha=alpha;
ctx.fillStyle=p.color;
ctx.shadowColor=p.color;
ctx.shadowBlur=9;
ellipse(p.x,p.y,p.size,p.size,p.color);
}

ctx.globalAlpha=1;
ctx.shadowBlur=0;

drawHUD();
}

function loop(t){
const dt=Math.min((t-(previous||t))/1000,.04);
previous=t;
update(dt);
draw();
requestAnimationFrame(loop);
}

/* INPUT */

function handleKey(e){
const key=e.key.toLowerCase();

if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(key)){
e.preventDefault();
}

keys[key]=true;

if(e.repeat)return;

if(scene&&(key==="enter"||key===" ")){
advanceScene();
return;
}

if(key==="j"||key===" ")sword();
if(key==="m")special();
if(key==="n")divergent();
if(key==="k")flame();
}

window.addEventListener("keydown",handleKey);
window.addEventListener("keyup",e=>{
keys[e.key.toLowerCase()]=false;
});

window.addEventListener("blur",()=>{
for(const k in keys)keys[k]=false;
});

canvas.addEventListener("click",()=>{
if(scene)advanceScene();
else sword();
});

$("dwSword").onclick=sword;
$("dwSkill").onclick=special;
$("dwDivergent").onclick=divergent;
$("dwFlame").onclick=flame;

$("dwDifficulty").onchange=e=>{
difficulty=e.target.value;
const h=difficulties[difficulty].health;
player.hp=h;
player.maxHp=h;
};

$("dwStart").onclick=()=>{
musicStart();

if(victory){
victory=false;
transformed=false;
startChapter(0);
return;
}

if(gameOver){
startChapter(chapter);
return;
}

if(!started&&!scene){
startChapter(chapter);
}
};

$("dwRestart").onclick=()=>{
if(!confirm("Restart the story from Chapter 1?"))return;
victory=false;
transformed=false;
scene=null;
chapter=0;
startChapter(0);
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

$("dwMusic").onclick=()=>{
musicEnabled=!musicEnabled;
$("dwMusic").textContent=musicEnabled?"♫ MUSIC ON":"♫ MUSIC OFF";

if(gain&&audio){
gain.gain.setTargetAtTime(
musicEnabled?volume*.5:0,
audio.currentTime,.04
);
}

if(musicEnabled)musicStart();
};

$("dwVolume").oninput=e=>{
volume=Number(e.target.value)/100;

if(gain&&audio){
gain.gain.setTargetAtTime(
musicEnabled?volume*.5:0,
audio.currentTime,.04
);
}
};

updateHUD();
requestAnimationFrame(loop);

})();
