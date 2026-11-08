import Phaser from 'phaser';
import './style.css';
const menu=document.querySelector('#menu'),shell=document.querySelector('#game-shell'),win=document.querySelector('#win-screen');
const hpLabel=document.querySelector('#health-label'),killLabel=document.querySelector('#enemy-label'),hint=document.querySelector('#game-hint');
const sticks={move:{x:0,y:0},aim:{x:0,y:0}};let game;
function start(){menu.classList.add('hidden');win.classList.add('hidden');shell.classList.remove('hidden');if(!game)game=new Phaser.Game({type:Phaser.AUTO,parent:'game-container',width:1100,height:650,backgroundColor:'#111923',pixelArt:true,physics:{default:'arcade',arcade:{gravity:{y:1100}}},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[FightScene]});else game.scene.start('FightScene');}
function finish(){shell.classList.add('hidden');win.classList.remove('hidden');game.scene.stop('FightScene');}
class FightScene extends Phaser.Scene{
 constructor(){super('FightScene');this.hp=5;this.kills=0;this.facing=1;this.attackCD=0;this.hurtCD=0;}
 create(){
  this.texturesHero();this.platforms=this.physics.add.staticGroup();
  const bg=this.add.graphics().setDepth(-10);bg.fillGradientStyle(0x101923,0x101923,0x1b2932,0x1b2932,1);bg.fillRect(0,0,2700,1000);
  for(let x=0;x<2700;x+=90){bg.lineStyle(1,0x45606a,.14);bg.lineBetween(x,0,x,1000);}
  this.add.text(70,70,'SECTOR 07 / THE BROKEN OUTPOST',{fontFamily:'monospace',fontSize:'15px',color:'#7fa39d',letterSpacing:3});
  const plats=[{x:1350,y:840,w:2700,h:100},{x:330,y:690,w:220,h:24},{x:660,y:570,w:220,h:24},{x:950,y:710,w:200,h:24},{x:1240,y:560,w:240,h:24},{x:1530,y:450,w:230,h:24},{x:1840,y:650,w:220,h:24},{x:2130,y:530,w:220,h:24},{x:2390,y:690,w:190,h:24},{x:520,y:430,w:150,h:20},{x:1700,y:300,w:180,h:20},{x:2250,y:350,w:160,h:20}];
  plats.forEach(p=>{let o=this.physics.add.staticImage(p.x,p.y,'platform').setDisplaySize(p.w,p.h).refreshBody().setTint(p.h>30?0x243a43:0x526b72);this.platforms.add(o);});
  this.physics.world.setBounds(0,0,2700,1000);
  this.player=this.physics.add.sprite(100,690,'hero').setDepth(5).setCollideWorldBounds(true);this.player.body.setSize(26,43).setOffset(7,5);this.player.setDragX(1500).setMaxVelocity(330,1000);
  this.physics.add.collider(this.player,this.platforms);
  this.enemies=this.physics.add.group({allowGravity:true});this.enemyList=[];
  [[460,690],[760,520],[1100,690],[1430,510],[1760,690],[2100,490],[2420,690]].forEach((p,i)=>this.spawnEnemy(p[0],p[1],i));
  this.physics.add.collider(this.enemies,this.platforms);this.physics.add.collider(this.enemies,this.enemies);this.physics.add.overlap(this.player,this.enemies,this.hitPlayer,null,this);
  this.cursors=this.input.keyboard.createCursorKeys();this.keys=this.input.keyboard.addKeys('A,D,W,SPACE,J');
  this.cameras.main.setBounds(0,0,2700,1000).startFollow(this.player,true,.09,.09).setDeadzone(220,100);
  this.add.rectangle(2590,700,55,120,0x8df0dc,.22).setStrokeStyle(4,0x8df0dc);this.add.text(2590,620,'EXIT',{fontFamily:'monospace',fontSize:'16px',color:'#a6ffed'}).setOrigin(.5);
  this.hud();hint.textContent='Besiege alle Gegner und erreiche das Portal am Ende des Sektors.';
  this.input.keyboard.on('keydown-ESC',()=>{this.scene.pause();shell.classList.add('hidden');menu.classList.remove('hidden');});
 }
 texturesHero(){
  let g=this.make.graphics({x:0,y:0,add:false});g.fillStyle(0xdaf1e9);g.fillRoundedRect(5,3,26,38,7);g.fillStyle(0x24323e);g.fillRect(9,12,18,9);g.fillStyle(0x8df0dc);g.fillRect(12,14,5,3);g.fillStyle(0x334d58);g.fillRect(7,38,9,10);g.fillRect(21,38,9,10);g.generateTexture('hero',36,50);g.destroy();
  g=this.make.graphics({x:0,y:0,add:false});g.fillStyle(0x542b38);g.fillRoundedRect(3,5,34,37,8);g.fillStyle(0xff755e);g.fillRect(7,13,26,12);g.fillStyle(0xffd4a8);g.fillRect(11,16,5,5);g.fillRect(24,16,5,5);g.fillStyle(0x251b28);g.fillRect(8,40,8,8);g.fillRect(24,40,8,8);g.generateTexture('enemy',40,50);g.destroy();
  g=this.make.graphics({x:0,y:0,add:false});g.fillStyle(0x33434c);g.fillRoundedRect(0,0,100,24,4);g.fillStyle(0x60777d);g.fillRect(0,0,100,4);g.generateTexture('platform',100,24);g.destroy();
  g=this.make.graphics({x:0,y:0,add:false});g.fillStyle(0x8df0dc,.25);g.fillCircle(25,25,24);g.fillStyle(0xbafff1);g.fillCircle(25,25,12);g.generateTexture('slash',50,50);g.destroy();
 }
 spawnEnemy(x,y,i){const e=this.enemies.create(x,y,'enemy').setDepth(4).setCollideWorldBounds(true);e.body.setSize(30,42).setOffset(5,5);e.setData('hp',2).setData('dir',i%2?1:-1).setData('origin',x).setData('alive',true);e.setData('bar',this.add.rectangle(x,y-37,36,5,0xff755e).setDepth(8));this.enemyList.push(e);}
 hud(){hpLabel.textContent='♥ '.repeat(this.hp)+'♡ '.repeat(5-this.hp);killLabel.textContent=this.kills+' / '+this.enemyList.length;}
 hitPlayer(p,e){if(!e.getData('alive')||this.hurtCD>0)return;this.hurtCD=850;this.hp--;p.setVelocityX(p.x<e.x?-260:260);p.setVelocityY(-240);p.setTint(0xff8c7b);this.time.delayedCall(250,()=>p.clearTint());if(this.hp<=0){this.hp=5;p.setPosition(100,690);p.setVelocity(0,0);hint.textContent='Zurück zum Start! Die Gegner bleiben. Diesmal nicht hineinlaufen.';}this.hud();}
 attack(){if(this.attackCD>0)return;this.attackCD=350;const a=sticks.aim;if(Math.hypot(a.x,a.y)>.25)this.facing=a.x<0?-1:1;const x=this.player.x+this.facing*52,y=this.player.y+(Math.abs(a.y)>.5?a.y*35:0);const fx=this.add.image(x,y,'slash').setDepth(9).setAlpha(.85);this.tweens.add({targets:fx,alpha:0,scale:1.5,duration:180,onComplete:()=>fx.destroy()});this.enemyList.forEach(e=>{if(!e.active||!e.getData('alive'))return;const dx=e.x-this.player.x,dy=e.y-this.player.y,front=this.facing>0?dx>0&&dx<110:dx<0&&dx>-110;if(front&&(Math.abs(dy)<75||(Math.abs(a.y)>.5&&Math.abs(dy)<130))){let hp=e.getData('hp')-1;e.setData('hp',hp).setTint(0xffffff);this.time.delayedCall(100,()=>e.clearTint());e.setVelocity(this.facing*220,-120);if(hp<=0){e.setData('alive',false);e.getData('bar')?.destroy();this.tweens.add({targets:e,alpha:0,scale:.2,duration:220,onComplete:()=>e.destroy()});this.kills++;this.hud();if(this.kills===this.enemyList.length)hint.textContent='Alle Gegner besiegt! Das Portal ist offen.';}}});}
 update(t,delta){this.attackCD=Math.max(0,this.attackCD-delta);this.hurtCD=Math.max(0,this.hurtCD-delta);
  const left=this.cursors.left.isDown||this.keys.A.isDown||sticks.move.x<-.22,right=this.cursors.right.isDown||this.keys.D.isDown||sticks.move.x>.22,dir=left?-1:right?1:0;
  if(dir){this.player.setVelocityX(dir*270);this.facing=dir;}else this.player.setVelocityX(this.player.body.velocity.x*.84);
  const jump=this.cursors.up.isDown||this.keys.W.isDown||this.keys.SPACE.isDown;if(jump&&this.player.body.blocked.down&&!this.jumpLock){this.player.setVelocityY(-520);this.jumpLock=true;}if(!jump)this.jumpLock=false;
  this.player.setFlipX(this.facing<0);if(Math.hypot(sticks.aim.x,sticks.aim.y)>.3&&this.attackCD<=0)this.attack();if(this.keys.J.isDown&&this.attackCD<=0)this.attack();
  this.enemyList.forEach(e=>{if(!e.active||!e.getData('alive'))return;let d=e.getData('dir');if(Math.abs(e.x-e.getData('origin'))>100)e.setData('dir',-d);e.setVelocityX(e.getData('dir')*65);const b=e.getData('bar');if(b?.active)b.setPosition(e.x,e.y-37).setScale(Math.max(.05,e.getData('hp')/2),1);});
  if(this.player.y>970){this.player.setPosition(100,690);this.player.setVelocity(0,0);this.hp=Math.max(1,this.hp-1);this.hud();}
  if(this.player.x>2530&&this.kills===this.enemyList.length)finish();
 }
}
function bindStick(id,knob,key){const base=document.getElementById(id),dot=document.getElementById(knob);let pid=null;function reset(){pid=null;sticks[key]={x:0,y:0};dot.style.transform='translate(0,0)';}function move(e){const r=base.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width*.34),y=(e.clientY-r.top-r.height/2)/(r.height*.34),l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}sticks[key]={x,y};dot.style.transform=`translate(${x*30}px,${y*30}px)`;}base.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;base.setPointerCapture(pid);move(e);});base.addEventListener('pointermove',e=>{if(e.pointerId===pid)move(e);});['pointerup','pointercancel','lostpointercapture'].forEach(n=>base.addEventListener(n,reset));}
bindStick('move-stick','move-knob','move');bindStick('fight-stick','fight-knob','aim');
document.querySelector('#start-button').addEventListener('click',start);document.querySelector('#replay-button').addEventListener('click',start);
document.querySelector('#jump-button').addEventListener('pointerdown',e=>{e.preventDefault();const s=game?.scene.isActive('FightScene')&&game.scene.getScene('FightScene');if(s?.player.body.blocked.down)s.player.setVelocityY(-520);});
document.querySelector('#exit-button').addEventListener('click',()=>{shell.classList.add('hidden');menu.classList.remove('hidden');game?.scene.stop('FightScene');});
