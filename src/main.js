import Phaser from 'phaser';
import { supabase } from './supabase.js';
import './style.css';

const SAVE_KEY = 'riftbound-save-v1';
const menu = document.querySelector('#menu');
const shell = document.querySelector('#game-shell');
const winScreen = document.querySelector('#win-screen');
const backendStatus = document.querySelector('#backend-status');
const shardCount = document.querySelector('#shard-count');
const phaseLabel = document.querySelector('#phase-label');
const objective = document.querySelector('#objective');
const hint = document.querySelector('#game-hint');
let game;
let pendingSave = null;
const touchKeys = new Set();

function readSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); }
  catch { return null; }
}
function showMenu() {
  continueButton.disabled = !readSave();
  shell.classList.add('hidden');
  winScreen.classList.add('hidden');
  menu.classList.remove('hidden');
  if (game) game.scene.stop('WorldScene');
}
function startGame(save = null) {
  if (!save) localStorage.removeItem(SAVE_KEY);
  continueButton.disabled = !readSave();
  menu.classList.add('hidden');
  winScreen.classList.add('hidden');
  shell.classList.remove('hidden');
  if (!game) {
    pendingSave = save;
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 1100,
      height: 650,
      backgroundColor: '#101a20',
      pixelArt: true,
      antialias: false,
      physics: { default: 'arcade', arcade: { debug: false } },
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1100, height: 650 },
      scene: [WorldScene]
    });
  } else {
    game.scene.start('WorldScene', { save });
  }
}
function updateHud(data) {
  shardCount.textContent = `${data.shards} / 3`;
  phaseLabel.textContent = data.phase === 0 ? 'STABIL' : 'RIFT';
  phaseLabel.classList.toggle('rift-text', data.phase === 1);
  objective.textContent = data.shards === 3 ? 'ZIEL: ERREICHE DAS EXTRACTION GATE' : 'ZIEL: FINDE 3 ENERGIEFRAGMENTE';
  document.body.classList.toggle('rift-mode', data.phase === 1);
}
function completeGame() {
  shell.classList.add('hidden');
  winScreen.classList.remove('hidden');
  localStorage.removeItem(SAVE_KEY);
  continueButton.disabled = true;
}

class WorldScene extends Phaser.Scene {
  constructor() { super('WorldScene'); this.phase = 0; this.shards = 0; this.collected = new Set(); }
  init(data) {
    const save = data?.save ?? pendingSave;
    pendingSave = null;
    this.phase = save?.phase === 1 ? 1 : 0;
    this.shards = Math.min(3, Math.max(0, Number(save?.shards) || 0));
    this.collected = new Set(Array.isArray(save?.collected) ? save.collected : []);
    this.spawn = { x: Number(save?.x) || 180, y: Number(save?.y) || 210 };
  }
  create() {
    this.makeTextures();
    this.drawWorld();
    this.physics.world.setBounds(0, 0, 2300, 1550);
    this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, 'player');
    this.player.setDepth(10).setCollideWorldBounds(true).setDrag(900, 900).setMaxVelocity(190, 190);
    this.player.body.setSize(18, 22).setOffset(7, 7);
    this.obstacles = this.physics.add.staticGroup();
    this.addObstacles();
    this.physics.add.collider(this.player, this.obstacles);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE');
    this.camera = this.cameras.main;
    this.camera.setBounds(0, 0, 2300, 1550);
    this.camera.startFollow(this.player, true, 0.09, 0.09);
    this.camera.setZoom(Math.min(1.1, Math.max(0.78, this.scale.width / 1000)));
    this.createInteractables();
    this.events.on('hud', updateHud);
    this.events.emit('hud', { phase: this.phase, shards: this.shards });
    this.input.keyboard.on('keydown-ESC', showMenu);
    this.phaseKeyLock = false;
    this.interactLock = false;
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.autosave() });
    this.updatePhase();
  }
  makeTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xd7e4df); g.fillRoundedRect(7, 3, 18, 25, 5);
    g.fillStyle(0x202c35); g.fillRect(10, 9, 12, 5);
    g.fillStyle(0x8fe4d4); g.fillRect(11, 10, 4, 2);
    g.fillStyle(0x263d48); g.fillRect(8, 24, 7, 7); g.fillRect(17, 24, 7, 7);
    g.generateTexture('player', 32, 34); g.destroy();
    const s = this.make.graphics({ x: 0, y: 0, add: false });
    s.fillStyle(0x70f0db, 0.2); s.fillCircle(12, 12, 11);
    s.fillStyle(0xa8fff0); s.fillPoints([{x:12,y:1},{x:20,y:12},{x:12,y:23},{x:4,y:12}], true);
    s.fillStyle(0xffffff); s.fillCircle(12, 12, 3);
    s.generateTexture('shard', 24, 24); s.destroy();
    const e = this.make.graphics({ x: 0, y: 0, add: false });
    e.fillStyle(0xff795e, 0.2); e.fillCircle(16, 16, 15);
    e.fillStyle(0xff795e); e.fillCircle(16, 16, 7);
    e.fillStyle(0xffe3d7); e.fillCircle(16, 16, 2);
    e.generateTexture('wisp', 32, 32); e.destroy();
  }
  drawWorld() {
    const bg = this.add.graphics().setDepth(-20);
    bg.fillStyle(0x17242a); bg.fillRect(0, 0, 2300, 1550);
    for (let y = 0; y < 1550; y += 48) for (let x = 0; x < 2300; x += 48) {
      const alt = ((x / 48 + y / 48) % 2) === 0;
      bg.fillStyle(alt ? 0x1a2a30 : 0x1c2d33, 1);
      bg.fillRect(x + 1, y + 1, 46, 46);
      bg.lineStyle(1, 0x263b40, 0.45); bg.strokeRect(x + 1, y + 1, 46, 46);
    }
    // Main research facility floor and structural outlines.
    const deco = this.add.graphics().setDepth(-10);
    deco.fillStyle(0x24373c); deco.fillRect(350, 170, 720, 430);
    deco.lineStyle(5, 0x53676a, 0.7); deco.strokeRect(350, 170, 720, 430);
    deco.fillStyle(0x22343a); deco.fillRect(1260, 760, 690, 500);
    deco.lineStyle(5, 0x53676a, 0.7); deco.strokeRect(1260, 760, 690, 500);
    deco.lineStyle(2, 0x6c8580, 0.24);
    for (let x = 390; x < 1050; x += 60) deco.lineBetween(x, 190, x, 580);
    for (let y = 210; y < 590; y += 60) deco.lineBetween(370, y, 1050, y);
    // Scattered markings and lights.
    for (let i = 0; i < 46; i++) {
      const x = 90 + ((i * 173) % 2110), y = 90 + ((i * 97) % 1360);
      deco.fillStyle(i % 3 ? 0x6d8b86 : 0xe7a86c, 0.45);
      deco.fillCircle(x, y, i % 4 === 0 ? 3 : 1.5);
    }
    this.add.text(380, 185, 'LAB / 07-A', { fontFamily: 'monospace', fontSize: '12px', color: '#93aaa3', letterSpacing: 3 }).setDepth(1);
    this.add.text(1290, 775, 'RIFT CONTAINMENT', { fontFamily: 'monospace', fontSize: '12px', color: '#93aaa3', letterSpacing: 3 }).setDepth(1);
    // Central dimensional rupture.
    const rift = this.add.graphics().setDepth(2);
    rift.fillStyle(0x60e4d0, 0.06); rift.fillCircle(1130, 700, 125);
    rift.lineStyle(3, 0x7fffea, 0.75); rift.strokeCircle(1130, 700, 78);
    rift.lineStyle(1, 0x7fffea, 0.35); rift.strokeCircle(1130, 700, 98);
    rift.fillStyle(0x75fff0, 0.8); rift.fillEllipse(1130, 700, 20, 70);
    this.add.text(1130, 820, 'RIFT ANCHOR', { fontFamily: 'monospace', fontSize: '11px', color: '#8fffee', letterSpacing: 2 }).setOrigin(0.5).setDepth(3);
    // Extraction gate.
    const gate = this.add.graphics().setDepth(3);
    gate.lineStyle(5, 0xd9a66a, 0.9); gate.strokeRoundedRect(2070, 1210, 100, 150, 8);
    gate.lineStyle(2, 0xffd59c, 0.8); gate.strokeRoundedRect(2082, 1222, 76, 126, 5);
    gate.fillStyle(0xe9ad70, 0.2); gate.fillRect(2090, 1230, 60, 110);
    this.add.text(2120, 1380, 'EXTRACTION', { fontFamily: 'monospace', fontSize: '11px', color: '#f0c18b', letterSpacing: 2 }).setOrigin(0.5).setDepth(3);
    // Boundary rails.
    const rails = this.add.graphics().setDepth(-5);
    rails.lineStyle(12, 0x0b1318, 1); rails.strokeRect(18, 18, 2264, 1514);
    rails.lineStyle(2, 0x52696b, 0.7); rails.strokeRect(25, 25, 2250, 1500);
  }
  addObstacles() {
    const blocks = [
      [320,330,110,28,0],[530,260,28,160,0],[760,480,180,28,0],[970,300,28,180,0],
      [1390,900,180,28,0],[1650,1030,28,180,0],[1850,850,150,28,0],[1980,1080,28,110,0],
      [680,720,170,28,1],[850,850,28,190,1],[1050,1030,210,28,1],[1440,560,28,170,1],
      [1540,620,180,28,1],[1800,440,28,180,1],[420,1120,200,28,1]
    ];
    this.phaseBlocks = [];
    blocks.forEach(([x,y,w,h,phase]) => {
      const box = this.add.rectangle(x, y, w, h, phase ? 0x8a6bba : 0x344a50, 1).setStrokeStyle(2, phase ? 0xc5a5ff : 0x71898a, 0.9);
      this.physics.add.existing(box, true);
      this.obstacles.add(box);
      box.phase = phase;
      this.phaseBlocks.push(box);
    });
    // Low cover and crates.
    [[240,700],[300,720],[1320,380],[1370,380],[1920,650],[1980,650],[980,1220]].forEach(([x,y]) => {
      const crate = this.add.rectangle(x,y,42,42,0x705a42).setStrokeStyle(3,0xb58b5d);
      this.physics.add.existing(crate,true); this.obstacles.add(crate); crate.phase = -1;
    });
  }
  createInteractables() {
    this.shardObjects = [
      { id:'a', x:650, y:370 }, { id:'b', x:1510, y:920 }, { id:'c', x:1930, y:300 }
    ].map(item => {
      const sprite = this.physics.add.staticSprite(item.x,item.y,'shard').setDepth(5);
      sprite.setScale(1.15);
      this.tweens.add({ targets:sprite, y:item.y-9, duration:900, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
      sprite.shardId = item.id;
      if (this.collected.has(item.id)) sprite.setVisible(false).body.enable = false;
      return sprite;
    });
    this.wisp = this.physics.add.sprite(1150, 1060, 'wisp').setDepth(6).setImmovable(true);
    this.tweens.add({ targets:this.wisp, x:1250, y:1000, duration:2600, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
  }
  updatePhase() {
    this.phaseBlocks.forEach(block => {
      const active = block.phase === -1 || block.phase === this.phase;
      block.body.enable = active;
      block.setVisible(active);
    });
    this.cameras.main.setBackgroundColor(this.phase === 0 ? '#101a20' : '#171326');
    this.events.emit('hud', { phase:this.phase, shards:this.shards });
    this.tweens.add({ targets:this.player, alpha:0.35, duration:80, yoyo:true, repeat:2 });
    this.autosave();
  }
  togglePhase() {
    this.phase = this.phase === 0 ? 1 : 0;
    this.updatePhase();
    hint.textContent = this.phase === 1 ? 'RIFT-REALITÄT AKTIV — neue Wege werden sichtbar.' : 'STABILE REALITÄT AKTIV — die Welt kehrt zurück.';
    this.time.delayedCall(1900, () => { hint.textContent = 'Finde die drei Energiefragmente. Die Risse führen in eine andere Realität.'; });
  }
  interact() {
    let nearest = null, distance = 70;
    this.shardObjects.forEach(shard => {
      if (!shard.visible || !shard.body.enable) return;
      const d = Phaser.Math.Distance.Between(this.player.x,this.player.y,shard.x,shard.y);
      if (d < distance) { nearest = shard; distance = d; }
    });
    if (nearest) {
      if (this.phase !== 1) { hint.textContent = 'DIE FRAGMENTE SIND NUR IN DER RIFT-REALITÄT SICHTBAR.'; return; }
      nearest.setVisible(false); nearest.body.enable = false;
      this.collected.add(nearest.shardId); this.shards += 1;
      this.events.emit('hud',{phase:this.phase,shards:this.shards});
      hint.textContent = 'ENERGIEFRAGMENT GESICHERT.';
      this.autosave();
      return;
    }
    const gateDistance = Phaser.Math.Distance.Between(this.player.x,this.player.y,2120,1280);
    if (gateDistance < 100) {
      if (this.shards < 3) { hint.textContent = `EXTRACTION GESPERRT — NOCH ${3-this.shards} FRAGMENTE FEHLEN.`; return; }
      completeGame();
    } else {
      hint.textContent = 'NICHTS IN REICHWEITE. SUCHE NACH EINEM INTERAKTIVEN OBJEKT.';
    }
  }
  autosave() {
    if (!this.player) return;
    const data = { x:Math.round(this.player.x), y:Math.round(this.player.y), phase:this.phase, shards:this.shards, collected:[...this.collected] };
    localStorage.setItem(SAVE_KEY,JSON.stringify({...data,savedAt:new Date().toISOString()}));
  }
  update() {
    if (!this.player?.active) return;
    const left = this.cursors.left.isDown || this.keys.A.isDown || touchKeys.has('left');
    const right = this.cursors.right.isDown || this.keys.D.isDown || touchKeys.has('right');
    const up = this.cursors.up.isDown || this.keys.W.isDown || touchKeys.has('up');
    const down = this.cursors.down.isDown || this.keys.S.isDown || touchKeys.has('down');
    const vx = (right ? 1 : 0) - (left ? 1 : 0);
    const vy = (down ? 1 : 0) - (up ? 1 : 0);
    const vector = new Phaser.Math.Vector2(vx,vy).normalize().scale(190);
    this.player.setVelocity(vx || vy ? vector.x : 0, vx || vy ? vector.y : 0);
    if (this.keys.SPACE.isDown && !this.phaseKeyLock) { this.phaseKeyLock = true; this.togglePhase(); }
    if (!this.keys.SPACE.isDown) this.phaseKeyLock = false;
    if (this.keys.E.isDown && !this.interactLock) { this.interactLock = true; this.interact(); }
    if (!this.keys.E.isDown) this.interactLock = false;
    this.player.setFlipX(vx < 0);
  }
}

document.querySelector('#start-button').addEventListener('click', () => startGame(null));
document.querySelector('#continue-button').addEventListener('click', () => startGame(readSave()));
document.querySelector('#exit-button').addEventListener('click', showMenu);
document.querySelector('#replay-button').addEventListener('click', () => startGame(null));
document.querySelectorAll('[data-dir]').forEach(button => {
  const dir = button.dataset.dir;
  button.addEventListener('pointerdown', e => { e.preventDefault(); touchKeys.add(dir); button.setPointerCapture(e.pointerId); });
  const release = () => touchKeys.delete(dir);
  button.addEventListener('pointerup',release); button.addEventListener('pointercancel',release); button.addEventListener('lostpointercapture',release);
});
document.querySelector('#touch-phase').addEventListener('pointerdown', e => { e.preventDefault(); if (game?.scene.isActive('WorldScene')) game.scene.getScene('WorldScene').togglePhase(); });
document.querySelector('#touch-interact').addEventListener('pointerdown', e => { e.preventDefault(); if (game?.scene.isActive('WorldScene')) game.scene.getScene('WorldScene').interact(); });
document.querySelector('#save-button').addEventListener('click', () => {
  const scene = game?.scene.isActive('WorldScene') ? game.scene.getScene('WorldScene') : null;
  if (scene) { scene.autosave(); hint.textContent = 'SPIELSTAND GESPEICHERT'; }
});
const continueButton = document.querySelector('#continue-button');
continueButton.disabled = !readSave();
window.addEventListener('storage', () => { continueButton.disabled = !readSave(); });
(async () => {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) throw error;
    backendStatus.textContent = 'SUPABASE CLIENT BEREIT · CLOUD-SAVES AB 0.2';
  } catch {
    backendStatus.textContent = 'OFFLINE-MODUS · LOKALER SPIELSTAND';
  }
})();
