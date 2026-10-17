
(() => {
  "use strict";

  // ==========================================
  // THEDARKWITHIN — COMPLETE GAME
  // WITH ORIGINAL 8-BIT MUSIC
  // ==========================================

  if (window.__darkWithinRunning) return;
  window.__darkWithinRunning = true;

  const $ = id => document.getElementById(id);

  // ==========================================
  // CREATE GAME SCREEN
  // ==========================================

  $("darkWithinUI")?.remove();
  $("dwGameFrame")?.remove();

  const canvas = document.createElement("canvas");
  canvas.id = "darkWithinCanvas";
  canvas.width = 960;
  canvas.height = 540;

  canvas.style.cssText =
    "display:block;width:100%;height:auto;" +
    "image-rendering:pixelated;background:#101018;" +
    "border:2px solid #343b42;";

  const frame = document.createElement("div");
  frame.id = "dwGameFrame";

  frame.style.cssText =
    "position:relative;width:min(960px,100%);" +
    "margin:15px auto;background:#080a0d;";

  const oldCanvas = $("darkWithinCanvas");

  if (oldCanvas) {
    oldCanvas.replaceWith(frame);
  } else {
    document.body.appendChild(frame);
  }

  frame.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const W = canvas.width;
  const H = canvas.height;

  document.body.style.background = "#080a0d";
  document.body.style.color = "white";

  // ==========================================
  // CONTROL PANEL
  // ==========================================

  const ui = document.createElement("div");
  ui.id = "darkWithinUI";

  ui.style.cssText =
    "max-width:960px;margin:12px auto;" +
    "padding:16px;background:#11161b;" +
    "border:2px solid #314039;color:#eee;" +
    "font:14px monospace;box-sizing:border-box;";

  ui.innerHTML = `
    <h2 style="
      color:#a4ffc0;
      margin:0 0 10px;
      letter-spacing:2px;
    ">
      THEDARKWITHIN
    </h2>

    <div id="dwChapter" style="margin-bottom:8px"></div>
    <div id="dwStatus" style="margin-bottom:12px"></div>

    <div style="
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-bottom:12px;
    ">
      <select id="dwDifficulty">
        <option value="easy">Easy</option>
        <option value="medium" selected>Medium</option>
        <option value="hard">Hard</option>
        <option value="extreme">Extreme</option>
      </select>

      <button id="dwStart">Start Adventure</button>
      <button id="dwRestart">Restart Game</button>
      <button id="dwFullscreen">⛶ Fullscreen</button>
    </div>

    <div style="
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-bottom:12px;
    ">
      <button id="dwSword">SPACE / J — Sword</button>
      <button id="dwSkill">M — Water Wheel</button>
      <button id="dwDivergent">N — Locked</button>
      <button id="dwFlame">K — Flame Arrow</button>
    </div>

    <div id="dwCooldowns" style="
      color:#aeb9b2;
      margin-bottom:14px;
      line-height:1.8;
    "></div>

    <div style="
      display:flex;
      gap:12px;
      flex-wrap:wrap;
      align-items:center;
      padding:12px;
      background:#0a1210;
      border:1px solid #304b3b;
      margin-bottom:12px;
    ">
      <button id="dwMusic">♫ Music On</button>

      <label for="dwVolume">Music Volume</label>

      <input
        type="range"
        id="dwVolume"
        min="0"
        max="100"
        value="35"
        style="accent-color:#77e99e"
      >

      <span id="dwVolumeValue">35%</span>
    </div>

    <div style="color:#aab5af;line-height:1.8">
      Move: WASD / Arrow Keys<br>
      Sword: Space / J / Click<br>
      Water Wheel or Black Flash: M<br>
      Divergent Fist: N<br>
      Flame Arrow: K
    </div>
  `;

  frame.insertAdjacentElement("beforebegin", ui);

  for (const button of ui.querySelectorAll("button")) {
    button.style.cssText =
      "padding:10px 13px;background:#1b2721;" +
      "color:#c5ffd4;border:1px solid #54755d;" +
      "font:13px monospace;cursor:pointer;";
  }

  const difficultySelect = $("dwDifficulty");
  const startButton = $("dwStart");

  // ==========================================
  // IN-GAME CONTINUE BUTTON
  // ==========================================

  const continueButton = document.createElement("button");

  continueButton.textContent = "Continue to Next Chapter";

  continueButton.style.cssText =
    "display:none;position:absolute;" +
    "left:50%;top:65%;" +
    "transform:translate(-50%,-50%);" +
    "padding:15px 22px;" +
    "background:#15592a;color:#d5ffdf;" +
    "border:2px solid #75ef9b;" +
    "font:bold 16px monospace;" +
    "cursor:pointer;z-index:5;";

  frame.appendChild(continueButton);

  // ==========================================
  // CHAPTER DATA
  // ==========================================

  const chapters = [
    {
      name: "The Missing Villagers",
      story: "The villagers have vanished. Find them!",
      enemy: "slime",
      count: 4,
      sky: "#254940",
      ground: "#365c39"
    },
    {
      name: "The Frozen Mountains",
      story: "Cross the mountains and survive the cold.",
      enemy: "ice",
      count: 5,
      sky: "#729ebc",
      ground: "#d4e4ed"
    },
    {
      name: "The Forgotten Desert",
      story: "Follow the trail through the desert.",
      enemy: "sand",
      count: 6,
      sky: "#dba568",
      ground: "#ba874e"
    },
    {
      name: "The Cage of Shadows",
      story: "Find the villagers trapped in the darkness.",
      enemy: "shadow",
      count: 6,
      sky: "#30223e",
      ground: "#38283d"
    },
    {
      name: "The Darkness Below",
      story: "Fight the creatures beneath the world.",
      enemy: "dark",
      count: 7,
      sky: "#171426",
      ground: "#252339"
    },
    {
      name: "The Black Spirit",
      story: "An ancient spirit awakens within you.",
      enemy: "spirit",
      count: 7,
      sky: "#1a0e1b",
      ground: "#211523"
    },
    {
      name: "The Fallen Kingdom",
      story: "Approach the Purple King's domain.",
      enemy: "knight",
      count: 8,
      sky: "#462c35",
      ground: "#32212e"
    },
    {
      name: "The Purple King's Domain",
      story: "Defeat the Purple King and save the villagers.",
      enemy: "boss",
      count: 1,
      sky: "#240f3b",
      ground: "#291a39"
    }
  ];

  const enemyTypes = {
    slime:  { hp:35, speed:55, damage:7, color:"#66cc75", r:17 },
    ice:   { hp:48, speed:65, damage:9, color:"#98e7ff", r:18 },
    sand:  { hp:58, speed:76, damage:11, color:"#e2ad63", r:18 },
    shadow:{ hp:72, speed:85, damage:13, color:"#9958d1", r:20 },
    dark:  { hp:88, speed:95, damage:15, color:"#53386b", r:20 },
    spirit:{ hp:105,speed:105,damage:17, color:"#dc4772", r:21 },
    knight:{ hp:145,speed:85, damage:20, color:"#88859c", r:24 },
    boss:  { hp:1100,speed:65,damage:25,color:"#963be6", r:48 }
  };

  const difficultySettings = {
    easy:    { health:150, enemyHp:0.7, damage:0.6 },
    medium:  { health:110, enemyHp:1, damage:1 },
    hard:    { health:100, enemyHp:1.4, damage:1.5 },
    extreme: { health:90, enemyHp:1.8, damage:2.1 }
  };

  // ==========================================
  // GAME STATE
  // ==========================================

  let chapter = 0;
  let started = false;
  let cleared = false;
  let gameOver = false;
  let victory = false;
  let takeoverComplete = false;

  let cutscene = null;
  let departure = null;

  let enemies = [];
  let projectiles = [];
  let effects = [];

  let elapsed = 0;
  let lastTime = 0;
  let message = "";
  let messageTime = 0;

  const keys = {};

  const player = {
    x: W / 2,
    y: H / 2,
    r: 17,
    speed: 210,
    facing: 1,
    hp: 110,
    maxHp: 110,
    invincible: 0,
    swordCd: 0,
    skillCd: 0,
    divergentCd: 0,
    flameCd: 0,
    attacking: 0
  };

  const rand = (a, b) => a + Math.random() * (b - a);

  const clamp = (n, a, b) =>
    Math.max(a, Math.min(b, n));

  const distance = (a, b, c, d) =>
    Math.hypot(a - c, b - d);

  function say(text, seconds = 3) {
    message = text;
    messageTime = seconds;
  }

  function canAttack() {
    return started && !cleared &&
      !gameOver && !victory &&
      !cutscene && !departure;
  }

  // ==========================================
  // ORIGINAL 8-BIT SOUNDTRACK ENGINE
  // ==========================================

  // These melodies are generated directly
  // by the browser using the Web Audio API.
  // No MP3 files are required.

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  let audioContext = null;
  let musicGain = null;
  let musicEnabled = true;
  let musicVolume = 0.35;
  let musicTimer = null;
  let musicStep = 0;
  let currentTrack = -1;

  // Notes are MIDI numbers.
  // 0 means a rest.

  const soundtracks = [
    // Chapter 1 — Mysterious Forest
    {
      tempo: 158,
      wave: "triangle",
      melody: [64,67,71,67,64,62,60,0,
               64,67,72,71,67,64,62,0],
      bass: [48,48,43,43]
    },

    // Chapter 2 — Frozen Mountains
    {
      tempo: 190,
      wave: "sine",
      melody: [72,71,67,64,67,0,64,62,
               60,64,67,64,62,0,60,0],
      bass: [48,43,45,40]
    },

    // Chapter 3 — Desert
    {
      tempo: 155,
      wave: "square",
      melody: [64,65,68,65,64,61,60,0,
               64,68,70,68,65,64,61,0],
      bass: [45,46,41,44]
    },

    // Chapter 4 — Cage of Shadows
    {
      tempo: 220,
      wave: "triangle",
      melody: [60,63,66,0,60,63,67,0,
               59,62,66,0,58,62,65,0],
      bass: [36,39,35,34]
    },

    // Chapter 5 — Darkness Below
    {
      tempo: 205,
      wave: "sawtooth",
      melody: [48,0,51,54,48,0,55,54,
               47,0,50,53,47,0,51,0],
      bass: [36,34,32,35]
    },

    // Chapter 6 — Black Spirit
    {
      tempo: 140,
      wave: "square",
      melody: [60,63,67,72,67,63,60,0,
               62,65,68,74,68,65,62,0],
      bass: [36,39,38,41]
    },

    // Chapter 7 — Fallen Kingdom
    {
      tempo: 145,
      wave: "square",
      melody: [67,70,72,75,74,70,67,0,
               65,68,72,77,75,72,68,0],
      bass: [43,41,39,36]
    },

    // Chapter 8 — Purple King
    {
      tempo: 105,
      wave: "sawtooth",
      melody: [48,55,60,63,62,55,51,48,
               50,57,62,65,63,57,53,50],
      bass: [36,39,34,38]
    }
  ];

  function midiFrequency(note) {
    return 440 * Math.pow(
      2,
      (note - 69) / 12
    );
  }

  function initializeAudio() {
    if (!AudioContextClass) return false;

    if (!audioContext) {
      audioContext = new AudioContextClass();

      musicGain = audioContext.createGain();
      musicGain.gain.value = musicVolume * 0.17;
      musicGain.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    return true;
  }

  function playNote(note, duration, wave, volume = 1) {
    if (!musicEnabled || !note) return;
    if (!audioContext || !musicGain) return;
    if (audioContext.state !== "running") return;

    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();

    const now = audioContext.currentTime;

    oscillator.type = wave;
    oscillator.frequency.value = midiFrequency(note);

    const length = Math.max(0.04, duration);

    envelope.gain.setValueAtTime(0.0001, now);

    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.001, volume),
      now + 0.012
    );

    envelope.gain.exponentialRampToValueAtTime(
      0.0001,
      now + length
    );

    oscillator.connect(envelope);
    envelope.connect(musicGain);

    oscillator.start(now);
    oscillator.stop(now + length + 0.02);
  }

  function musicTick() {
    if (!musicEnabled) return;

    const track = soundtracks[currentTrack];
    if (!track) return;

    const index = musicStep % track.melody.length;
    const duration = track.tempo / 1000;

    // Lead melody.
    playNote(
      track.melody[index],
      duration * 0.85,
      track.wave,
      0.5
    );

    // Bass notes.
    if (musicStep % 4 === 0) {
      const bassIndex =
        Math.floor(musicStep / 4) % track.bass.length;

      playNote(
        track.bass[bassIndex],
        duration * 3.5,
        "triangle",
        0.55
      );
    }

    // Quiet high arpeggio.
    if (musicStep % 2 === 0 && index % 4 !== 2) {
      const chordNote =
        track.melody[index] || track.bass[0] + 12;

      playNote(
        chordNote + 12,
        duration * 0.32,
        "sine",
        0.13
      );
    }

    musicStep++;
  }

  function selectMusic(chapterIndex) {
    if (currentTrack === chapterIndex && musicTimer) {
      return;
    }

    stopMusic();

    currentTrack = chapterIndex;
    musicStep = 0;

    if (!musicEnabled) return;
    if (!initializeAudio()) return;

    musicTick();

    musicTimer = setInterval(
      musicTick,
      soundtracks[chapterIndex].tempo
    );
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function toggleMusic() {
    musicEnabled = !musicEnabled;

    $("dwMusic").textContent =
      musicEnabled ? "♫ Music On" : "♫ Music Off";

    if (musicEnabled) {
      initializeAudio();
      selectMusic(chapter);
    } else {
      stopMusic();
    }
  }

  $("dwMusic").addEventListener("click", toggleMusic);

  $("dwVolume").addEventListener("input", event => {
    musicVolume = Number(event.target.value) / 100;

    $("dwVolumeValue").textContent =
      event.target.value + "%";

    if (musicGain) {
      musicGain.gain.value = musicVolume * 0.17;
    }
  });

  // ==========================================
  // ENEMY CREATION
  // ==========================================

  function spawnEnemies() {
    enemies = [];

    const info = chapters[chapter];
    const base = enemyTypes[info.enemy];
    const difficulty = difficultySettings[
      difficultySelect.value
    ];

    for (let i = 0; i < info.count; i++) {
      let x;
      let y;
      let attempts = 0;

      do {
        x = rand(65, W - 65);
        y = rand(100, H - 55);
        attempts++;
      } while (
        distance(x, y, player.x, player.y) < 180 &&
        attempts < 100
      );

      const hp = Math.round(
        base.hp * difficulty.enemyHp
      );

      enemies.push({
        x, y,
        type: info.enemy,
        color: base.color,
        r: base.r,
        speed: base.speed,
        damage: Math.round(
          base.damage * difficulty.damage
        ),
        hp,
        maxHp: hp,
        attackCd: rand(0.4, 1.3),
        shootCd: 1,
        flash: 0,
        dead: false,
        animation: rand(0, 10)
      });
    }
  }

  // ==========================================
  // SPECIAL EFFECTS
  // ==========================================

  function burst(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 190);

      effects.push({
        type: "particle",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: rand(0.25, 0.7),
        maxLife: 0.7
      });
    }
  }

  function ring(x, y, color, radius, life = 0.4) {
    effects.push({
      type: "ring",
      x, y,
      color,
      radius,
      life,
      maxLife: life
    });
  }

  // ==========================================
  // DAMAGE
  // ==========================================

  function damagePlayer(amount) {
    if (!canAttack()) return;
    if (player.invincible > 0) return;

    player.hp = Math.max(0, player.hp - amount);
    player.invincible = 0.75;

    burst(player.x, player.y, "#ff4260", 12);

    if (player.hp <= 0) {
      gameOver = true;
      started = false;
      stopMusic();

      say("YOU HAVE FALLEN!", 5);
    }
  }

  function damageEnemy(enemy, amount, color = "#ffffff") {
    if (enemy.dead) return;

    enemy.hp -= amount;
    enemy.flash = 0.15;

    burst(enemy.x, enemy.y, color, 8);

    if (enemy.hp <= 0) {
      enemy.dead = true;
      enemy.hp = 0;

      burst(enemy.x, enemy.y, enemy.color, 25);
      ring(enemy.x, enemy.y, enemy.color, 50);
    }
  }

  // ==========================================
  // SWORD — SPACE / J
  // ==========================================

  function swordAttack() {
    if (!canAttack() || player.swordCd > 0) return;

    player.swordCd = 0.38;
    player.attacking = 0.2;

    ring(
      player.x + player.facing * 30,
      player.y,
      "#d9eaff",
      50,
      0.2
    );

    for (const enemy of enemies) {
      if (enemy.dead) continue;

      const dx = enemy.x - player.x;

      if (
        distance(player.x, player.y, enemy.x, enemy.y)
          < 85 + enemy.r &&
        dx * player.facing >= -15
      ) {
        damageEnemy(
          enemy,
          takeoverComplete ? 40 : 28
        );
      }
    }

    checkChapterClear();
  }

  // ==========================================
  // WATER WHEEL — M
  // ==========================================

  function waterWheel() {
    if (!canAttack() || takeoverComplete) return;
    if (player.skillCd > 0) return;

    player.skillCd = 2.5;

    effects.push({
      type: "water",
      x: player.x,
      y: player.y,
      radius: 95,
      rotation: 0,
      life: 0.8,
      maxLife: 0.8
    });

    burst(player.x, player.y, "#5bd9ff", 45);

    for (const enemy of enemies) {
      if (enemy.dead) continue;

      if (
        distance(player.x, player.y, enemy.x, enemy.y)
          < 110 + enemy.r
      ) {
        damageEnemy(enemy, 65, "#77eaff");
      }
    }

    say("WATER WHEEL!", 1);
    checkChapterClear();
  }

  // ==========================================
  // BLACK FLASH — M AFTER TAKEOVER
  // ==========================================

  function blackFlash() {
    if (!canAttack() || !takeoverComplete) return;
    if (player.skillCd > 0) return;

    player.skillCd = 1.25;

    ring(player.x, player.y, "#ff1744", 125);
    ring(player.x, player.y, "#230819", 90);

    burst(player.x, player.y, "#ff1646", 55);
    burst(player.x, player.y, "#140b20", 25);

    for (const enemy of enemies) {
      if (enemy.dead) continue;

      if (
        distance(player.x, player.y, enemy.x, enemy.y)
          < 140 + enemy.r
      ) {
        damageEnemy(enemy, 125, "#ff1744");
      }
    }

    say("BLACK FLASH!", 1);
    checkChapterClear();
  }

  // ==========================================
  // DIVERGENT FIST — N
  // ==========================================

  function divergentFist() {
    if (!canAttack() || !takeoverComplete) return;
    if (player.divergentCd > 0) return;

    player.divergentCd = 3;

    const targets = [];

    for (const enemy of enemies) {
      if (enemy.dead) continue;

      const dx = enemy.x - player.x;

      if (
        distance(player.x, player.y, enemy.x, enemy.y)
          < 105 + enemy.r &&
        dx * player.facing >= -15
      ) {
        damageEnemy(enemy, 55, "#c68aff");
        targets.push(enemy);
      }
    }

    effects.push({
      type: "delayed",
      x: player.x + player.facing * 40,
      y: player.y,
      targets,
      delay: 0.28,
      life: 0.4,
      maxLife: 0.4,
      activated: false
    });

    say("DIVERGENT FIST!", 1);
    checkChapterClear();
  }

  // ==========================================
  // FLAME ARROW — K
  // ==========================================

  function flameArrow() {
    if (!canAttack() || player.flameCd > 0) return;

    player.flameCd = 1.5;

    projectiles.push({
      type: "flame",
      x: player.x + player.facing * 25,
      y: player.y - 5,
      vx: player.facing * 490,
      vy: 0,
      r: 12,
      damage: takeoverComplete ? 80 : 50,
      life: 1.8,
      enemyOwned: false
    });

    burst(
      player.x + player.facing * 20,
      player.y,
      "#ff9a32",
      16
    );

    say("FLAME ARROW!", 0.8);
  }

  // ==========================================
  // CHAPTER PROGRESSION
  // ==========================================

  function checkChapterClear() {
    if (!started || cleared || gameOver || departure) {
      return;
    }

    if (enemies.some(e => !e.dead)) return;

    started = false;

    if (chapter === 7) {
      departure = { time: 0, duration: 5 };
      say("THE PURPLE KING HAS FALLEN!", 5);
      return;
    }

    cleared = true;
    say("CHAPTER CLEARED!", 5);
  }

  function beginChapter() {
    initializeAudio();

    if (victory || gameOver) return;

    if (cleared) chapter++;

    if (chapter >= chapters.length) return;

    cleared = false;
    started = true;

    enemies = [];
    projectiles = [];
    effects = [];

    player.x = W / 2;
    player.y = H / 2;
    player.invincible = 1;

    player.swordCd = 0;
    player.skillCd = 0;
    player.flameCd = 0;
    player.divergentCd = 0;

    spawnEnemies();

    if (chapter === 5 && !takeoverComplete) {
      cutscene = { time: 0, duration: 8 };
    }

    selectMusic(chapter);

    say(
      "CHAPTER " + (chapter + 1) +
      ": " + chapters[chapter].name,
      4
    );
  }

  function resetGame() {
    stopMusic();

    chapter = 0;
    started = false;
    cleared = false;
    gameOver = false;
    victory = false;
    takeoverComplete = false;

    cutscene = null;
    departure = null;

    enemies = [];
    projectiles = [];
    effects = [];

    player.x = W / 2;
    player.y = H / 2;

    player.maxHp =
      difficultySettings[difficultySelect.value].health;

    player.hp = player.maxHp;

    player.swordCd = 0;
    player.skillCd = 0;
    player.divergentCd = 0;
    player.flameCd = 0;
    player.invincible = 0;

    say("Welcome to TheDarkWithin!", 5);
  }

  // ==========================================
  // PLAYER MOVEMENT
  // ==========================================

  function movePlayer(dt) {
    let dx = 0;
    let dy = 0;

    if (keys.w || keys.arrowup) dy--;
    if (keys.s || keys.arrowdown) dy++;
    if (keys.a || keys.arrowleft) dx--;
    if (keys.d || keys.arrowright) dx++;

    const length = Math.hypot(dx, dy);

    if (!length) return;

    dx /= length;
    dy /= length;

    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;

    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;

    player.x = clamp(player.x, 25, W - 25);
    player.y = clamp(player.y, 85, H - 30);
  }

  // ==========================================
  // ENEMY AI
  // ==========================================

  function updateEnemies(dt) {
    for (const enemy of enemies) {
      if (enemy.dead) continue;

      enemy.animation += dt * 5;

      enemy.attackCd = Math.max(
        0,
        enemy.attackCd - dt
      );

      enemy.shootCd = Math.max(
        0,
        enemy.shootCd - dt
      );

      enemy.flash = Math.max(
        0,
        enemy.flash - dt
      );

      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const d = Math.hypot(dx, dy) || 1;

      const nx = dx / d;
      const ny = dy / d;

      if (d > enemy.r + player.r + 7) {
        enemy.x += nx * enemy.speed * dt;
        enemy.y += ny * enemy.speed * dt;
      }

      if (
        d < enemy.r + player.r + 12 &&
        enemy.attackCd === 0
      ) {
        damagePlayer(enemy.damage);
        enemy.attackCd = enemy.type === "boss"
          ? 1.3 : 1.1;
      }

      // Purple King toxic projectiles.
      if (
        enemy.type === "boss" &&
        enemy.shootCd === 0
      ) {
        projectiles.push({
          type: "poison",
          x: enemy.x,
          y: enemy.y,
          vx: nx * 270,
          vy: ny * 270,
          r: 14,
          damage: 16,
          life: 3,
          enemyOwned: true
        });

        enemy.shootCd = rand(0.9, 1.5);
      }

      enemy.x = clamp(enemy.x, enemy.r, W - enemy.r);
      enemy.y = clamp(enemy.y, 85, H - enemy.r);
    }
  }

  // ==========================================
  // PROJECTILE UPDATE
  // ==========================================

  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      let hit = false;

      if (p.enemyOwned) {
        if (
          distance(p.x, p.y, player.x, player.y)
            < p.r + player.r
        ) {
          damagePlayer(p.damage);
          burst(p.x, p.y, "#a94cff", 15);
          hit = true;
        }
      } else {
        for (const enemy of enemies) {
          if (enemy.dead) continue;

          if (
            distance(p.x, p.y, enemy.x, enemy.y)
              < p.r + enemy.r
          ) {
            damageEnemy(enemy, p.damage, "#ffac4c");
            burst(p.x, p.y, "#ff7a22", 18);
            hit = true;
            break;
          }
        }
      }

      if (
        hit || p.life <= 0 ||
        p.x < -50 || p.x > W + 50 ||
        p.y < -50 || p.y > H + 50
      ) {
        projectiles.splice(i, 1);
      }
    }

    checkChapterClear();
  }

  // ==========================================
  // EFFECT UPDATE
  // ==========================================

  function updateEffects(dt) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];

      effect.life -= dt;

      if (effect.type === "particle") {
        effect.x += effect.vx * dt;
        effect.y += effect.vy * dt;
      }

      if (effect.type === "water") {
        effect.rotation += dt * 12;
      }

      if (
        effect.type === "delayed" &&
        !effect.activated
      ) {
        effect.delay -= dt;

        if (effect.delay <= 0) {
          effect.activated = true;

          ring(
            effect.x,
            effect.y,
            "#cc7dff",
            75
          );

          for (const enemy of effect.targets) {
            if (!enemy.dead) {
              damageEnemy(enemy, 85, "#cc7dff");
            }
          }

          checkChapterClear();
        }
      }

      if (effect.life <= 0) {
        effects.splice(i, 1);
      }
    }
  }

  // ==========================================
  // CUTSCENE UPDATES
  // ==========================================

  function updateCutscene(dt) {
    cutscene.time += dt;

    if (Math.random() < 0.5) {
      burst(
        player.x + rand(-20, 20),
        player.y,
        "#bc234f",
        2
      );
    }

    if (cutscene.time >= cutscene.duration) {
      cutscene = null;
      takeoverComplete = true;
      player.hp = player.maxHp;

      say(
        "BLACK SPIRIT AWAKENED! " +
        "M = BLACK FLASH, N = DIVERGENT FIST",
        6
      );
    }
  }

  function updateDeparture(dt) {
    departure.time += dt;

    if (Math.random() < 0.65) {
      burst(
        player.x + rand(-30, 30),
        player.y - departure.time * 35,
        "#b31b55",
        2
      );
    }

    if (departure.time >= departure.duration) {
      departure = null;
      victory = true;
      takeoverComplete = true;

      stopMusic();

      say(
        "THE BLACK SPIRIT HAS LEFT. " +
        "YOUR POWERS REMAIN!",
        10
      );
    }
  }

  // ==========================================
  // MAIN UPDATE
  // ==========================================

  function update(dt) {
    elapsed += dt;
    messageTime = Math.max(0, messageTime - dt);

    if (cutscene) {
      updateCutscene(dt);
      updateEffects(dt);
      return;
    }

    if (departure) {
      updateDeparture(dt);
      updateEffects(dt);
      return;
    }

    if (!started || gameOver || victory || cleared) {
      updateEffects(dt);
      return;
    }

    player.invincible = Math.max(
      0,
      player.invincible - dt
    );

    player.swordCd = Math.max(
      0,
      player.swordCd - dt
    );

    player.skillCd = Math.max(
      0,
      player.skillCd - dt
    );

    player.divergentCd = Math.max(
      0,
      player.divergentCd - dt
    );

    player.flameCd = Math.max(
      0,
      player.flameCd - dt
    );

    player.attacking = Math.max(
      0,
      player.attacking - dt
    );

    movePlayer(dt);
    updateEnemies(dt);

    if (!gameOver) {
      updateProjectiles(dt);
    }

    updateEffects(dt);
    checkChapterClear();
  }

  // ==========================================
  // CHAPTER BACKGROUNDS
  // ==========================================

  function drawBackground() {
    const info = chapters[chapter];

    ctx.fillStyle = info.sky;
    ctx.fillRect(0, 0, W, H);

    // Distant scenery.
    for (let i = 0; i < 11; i++) {
      const x = i * 100;
      const height = 75 + (i * 37) % 90;

      ctx.fillStyle =
        chapter === 1 ? "#9bc3d8" :
        chapter === 2 ? "#ac7746" :
        chapter >= 3 ? "#1a1426" :
        "#204536";

      ctx.beginPath();
      ctx.moveTo(x - 50, 350);
      ctx.lineTo(x + 30, 350 - height);
      ctx.lineTo(x + 115, 350);
      ctx.fill();
    }

    ctx.fillStyle = info.ground;
    ctx.fillRect(0, 350, W, 190);

    // Pixel ground details.
    for (let i = 0; i < 65; i++) {
      const x = (i * 137 + 30) % W;
      const y = 365 + (i * 71) % 165;

      ctx.fillStyle =
        i % 2 === 0
          ? "#ffffff18"
          : "#00000022";

      ctx.fillRect(x, y, 9, 4);
    }

    // Forest trees.
    if (chapter === 0) {
      for (let i = 0; i < 8; i++) {
        const x = i * 135 + 25;

        ctx.fillStyle = "#5b3c2a";
        ctx.fillRect(x, 290, 18, 70);

        ctx.fillStyle = "#236c46";
        ctx.fillRect(x - 28, 245, 75, 52);

        ctx.fillStyle = "#319558";
        ctx.fillRect(x - 16, 226, 51, 35);
      }
    }

    // Snowy mountains.
    if (chapter === 1) {
      for (let i = 0; i < 6; i++) {
        const x = i * 185;

        ctx.fillStyle = "#f4f9ff";
        ctx.beginPath();
        ctx.moveTo(x - 50, 350);
        ctx.lineTo(x + 75, 145);
        ctx.lineTo(x + 195, 350);
        ctx.fill();
      }
    }

    // Underground spikes.
    if (chapter === 4 || chapter === 5) {
      ctx.fillStyle = "#100d19";

      for (let i = 0; i < 18; i++) {
        const x = i * 58;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 27, 65 + (i % 4) * 20);
        ctx.lineTo(x + 58, 0);
        ctx.fill();
      }
    }

    // Purple King arena.
    if (chapter === 7) {
      ctx.strokeStyle = "#873cb2";
      ctx.lineWidth = 5;

      ctx.beginPath();
      ctx.ellipse(
        W / 2,
        H / 2 + 100,
        280,
        110,
        0, 0, Math.PI * 2
      );
      ctx.stroke();
    }
  }

  // ==========================================
  // DRAW PLAYER
  // ==========================================

  function drawPlayer() {
    const x = Math.round(player.x);
    const y = Math.round(player.y);

    if (
      player.invincible > 0 &&
      Math.floor(elapsed * 15) % 2 === 0
    ) {
      return;
    }

    const bob = Math.sin(elapsed * 5) * 2;

    ctx.save();
    ctx.translate(x, y + bob);

    ctx.fillStyle = "#0006";
    ctx.fillRect(-19, 20, 38, 8);

    // Boots.
    ctx.fillStyle = "#292331";
    ctx.fillRect(-13, 8, 11, 21);
    ctx.fillRect(4, 8, 11, 21);

    // Armor.
    ctx.fillStyle =
      takeoverComplete ? "#110e19" : "#3869a1";

    ctx.fillRect(-17, -20, 34, 36);

    // Head.
    ctx.fillStyle =
      takeoverComplete ? "#21192a" : "#e0ab83";

    ctx.fillRect(-13, -43, 26, 25);

    ctx.fillStyle = "#30232a";
    ctx.fillRect(-15, -47, 30, 10);

    // Eyes.
    ctx.fillStyle =
      takeoverComplete ? "#ff204c" : "#15151d";

    ctx.fillRect(
      player.facing === 1 ? 5 : -9,
      -33,
      6,
      5
    );

    if (takeoverComplete) {
      // Dragon horns.
      ctx.fillStyle = "#09080d";

      ctx.beginPath();
      ctx.moveTo(-13, -40);
      ctx.lineTo(-22, -62);
      ctx.lineTo(-2, -42);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(13, -40);
      ctx.lineTo(22, -62);
      ctx.lineTo(2, -42);
      ctx.fill();

      // Crimson chest gem.
      ctx.fillStyle = "#bf2346";
      ctx.fillRect(-5, -10, 10, 17);
    }

    // Sword.
    ctx.fillStyle = "#dcefff";
    ctx.fillRect(
      player.facing * 23,
      -25,
      6,
      47
    );

    ctx.fillStyle = "#94714f";
    ctx.fillRect(
      player.facing * 16,
      14,
      18,
      5
    );

    ctx.restore();
  }

  // ==========================================
  // DRAW ENEMIES
  // ==========================================

  function drawEnemies() {
    for (const enemy of enemies) {
      if (enemy.dead) continue;

      const bob = Math.sin(enemy.animation) * 3;

      ctx.save();
      ctx.translate(enemy.x, enemy.y + bob);

      const r = enemy.r;

      ctx.fillStyle = "#0005";
      ctx.beginPath();
      ctx.ellipse(0, r + 7, r, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (enemy.type === "boss") {
        // Purple King's cloak.
        ctx.fillStyle = "#240e36";
        ctx.fillRect(-42, -22, 84, 90);

        // Body.
        ctx.fillStyle =
          enemy.flash > 0 ? "#fff" : "#742caf";

        ctx.fillRect(-35, -43, 70, 80);

        // Head.
        ctx.fillStyle = "#461565";
        ctx.fillRect(-28, -80, 56, 40);

        // Crown.
        ctx.fillStyle = "#e4bd70";
        ctx.beginPath();
        ctx.moveTo(-32, -76);
        ctx.lineTo(-28, -108);
        ctx.lineTo(-9, -87);
        ctx.lineTo(0, -117);
        ctx.lineTo(11, -87);
        ctx.lineTo(29, -108);
        ctx.lineTo(33, -76);
        ctx.fill();

        // Glowing eyes.
        ctx.fillStyle = "#ff2e94";
        ctx.fillRect(-18, -63, 12, 7);
        ctx.fillRect(7, -63, 12, 7);

        ctx.fillStyle = "#da4dff";
        ctx.fillRect(-8, -15, 16, 23);
      } else {
        ctx.fillStyle =
          enemy.flash > 0 ? "#fff" : enemy.color;

        ctx.beginPath();
        ctx.ellipse(
          0, 0, r, r * 1.1,
          0, 0, Math.PI * 2
        );
        ctx.fill();

        // Horns.
        ctx.fillStyle = "#1d1826";

        ctx.beginPath();
        ctx.moveTo(-r + 3, -r / 2);
        ctx.lineTo(-r - 8, -r - 13);
        ctx.lineTo(-3, -r + 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(r - 3, -r / 2);
        ctx.lineTo(r + 8, -r - 13);
        ctx.lineTo(3, -r + 2);
        ctx.fill();

        // Eyes.
        ctx.fillStyle =
          chapter >= 3 ? "#ff315d" : "#111";

        ctx.fillRect(-10, -5, 6, 6);
        ctx.fillRect(5, -5, 6, 6);
      }

      // Health bar.
      const width = enemy.type === "boss" ? 110 : 45;
      const barY = enemy.type === "boss" ? -135 : -r - 29;

      ctx.fillStyle = "#15151a";
      ctx.fillRect(-width / 2, barY, width, 8);

      ctx.fillStyle =
        enemy.type === "boss" ? "#b24cff" : "#e64357";

      ctx.fillRect(
        -width / 2,
        barY,
        width * (enemy.hp / enemy.maxHp),
        8
      );

      ctx.restore();
    }
  }

  // ==========================================
  // DRAW PROJECTILES
  // ==========================================

  function drawProjectiles() {
    for (const p of projectiles) {
      ctx.fillStyle =
        p.type === "flame" ? "#ff8025" : "#a72bdb";

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle =
        p.type === "flame" ? "#ffe17a" : "#f3a0ff";

      ctx.beginPath();
      ctx.arc(p.x - 3, p.y - 3, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================
  // DRAW EFFECTS
  // ==========================================

  function drawEffects() {
    for (const effect of effects) {
      const alpha = clamp(
        effect.life / effect.maxLife,
        0,
        1
      );

      ctx.save();
      ctx.globalAlpha = alpha;

      if (effect.type === "particle") {
        ctx.fillStyle = effect.color;
        ctx.fillRect(effect.x, effect.y, 5, 5);
      }

      if (effect.type === "ring") {
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 8;

        ctx.beginPath();
        ctx.arc(
          effect.x,
          effect.y,
          effect.radius * (1 - alpha * 0.45),
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      if (effect.type === "water") {
        ctx.translate(effect.x, effect.y);
        ctx.rotate(effect.rotation);

        ctx.strokeStyle = "#37baff";
        ctx.lineWidth = 11;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.arc(0, 0, 87, -0.5, Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = "#c5faff";
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.arc(0, 0, 65, 0.4, Math.PI * 1.9);
        ctx.stroke();

        // Eight spinning water streams.
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;

          ctx.strokeStyle =
            i % 2 ? "#127fc7" : "#77eaff";

          ctx.lineWidth = 5;

          ctx.beginPath();
          ctx.moveTo(
            Math.cos(a) * 35,
            Math.sin(a) * 35
          );

          ctx.quadraticCurveTo(
            Math.cos(a + 0.3) * 65,
            Math.sin(a + 0.3) * 65,
            Math.cos(a + 0.6) * 92,
            Math.sin(a + 0.6) * 92
          );

          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  // ==========================================
  // CUTSCENE DRAWING
  // ==========================================

  function drawCutsceneOverlay() {
    if (!cutscene && !departure) return;

    ctx.fillStyle = "#000a";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";

    if (cutscene) {
      const size = 45 + cutscene.time * 12;

      ctx.strokeStyle = "#d32856";
      ctx.lineWidth = 8;

      ctx.beginPath();
      ctx.arc(
        player.x,
        player.y,
        size,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.fillStyle = "#ff3e68";
      ctx.font = "bold 28px monospace";
      ctx.fillText(
        "THE BLACK SPIRIT AWAKENS",
        W / 2,
        95
      );

      ctx.fillStyle = "#eee";
      ctx.font = "17px monospace";
      ctx.fillText(
        "Something is taking control...",
        W / 2,
        125
      );
    }

    if (departure) {
      const rise = departure.time * 50;
      const opacity = clamp(
        1 - departure.time / departure.duration,
        0,
        1
      );

      ctx.globalAlpha = opacity;

      ctx.fillStyle = "#150c20";

      ctx.beginPath();
      ctx.ellipse(
        player.x,
        player.y - rise,
        40,
        58,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = "#ff2856";
      ctx.fillRect(player.x - 19, player.y - rise - 15, 11, 6);
      ctx.fillRect(player.x + 8, player.y - rise - 15, 11, 6);

      ctx.globalAlpha = 1;

      ctx.fillStyle = "#ff5b82";
      ctx.font = "bold 28px monospace";
      ctx.fillText(
        "THE BLACK SPIRIT DEPARTS",
        W / 2,
        90
      );

      ctx.fillStyle = "#fff";
      ctx.font = "17px monospace";
      ctx.fillText(
        "Your powers will remain.",
        W / 2,
        122
      );
    }

    ctx.textAlign = "left";
  }

  // ==========================================
  // GAME HUD
  // ==========================================

  function drawHUD() {
    ctx.fillStyle = "#05070ddd";
    ctx.fillRect(0, 0, W, 62);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px monospace";

    ctx.fillText(
      "CHAPTER " + (chapter + 1) +
      " — " + chapters[chapter].name,
      15,
      23
    );

    ctx.fillStyle = "#4c2130";
    ctx.fillRect(15, 36, 210, 14);

    ctx.fillStyle = "#ed3c5f";
    ctx.fillRect(
      15,
      36,
      210 * (player.hp / player.maxHp),
      14
    );

    ctx.strokeStyle = "#eee";
    ctx.strokeRect(15, 36, 210, 14);

    ctx.fillStyle = "#fff";
    ctx.font = "12px monospace";

    ctx.fillText(
      Math.ceil(player.hp) + "/" + player.maxHp,
      83,
      47
    );

    const remaining =
      enemies.filter(e => !e.dead).length;

    ctx.font = "bold 15px monospace";
    ctx.fillText(
      "ENEMIES: " + remaining,
      W - 160,
      26
    );

    if (messageTime > 0) {
      ctx.fillStyle = "#000c";
      ctx.fillRect(105, H - 75, W - 210, 48);

      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 15px monospace";

      ctx.fillText(
        message,
        W / 2,
        H - 45
      );

      ctx.textAlign = "left";
    }

    if (cleared) {
      ctx.fillStyle = "#0009";
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";
      ctx.fillStyle = "#82ffa3";
      ctx.font = "bold 36px monospace";

      ctx.fillText(
        "CHAPTER CLEARED!",
        W / 2,
        190
      );

      ctx.fillStyle = "#fff";
      ctx.font = "17px monospace";

      ctx.fillText(
        "All enemies defeated!",
        W / 2,
        235
      );

      ctx.textAlign = "left";
    }

    if (gameOver || victory) {
      ctx.fillStyle = "#000d";
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";

      ctx.fillStyle =
        victory ? "#a8ffbd" : "#ff4a67";

      ctx.font = "bold 38px monospace";

      ctx.fillText(
        victory ? "YOU SAVED THE VILLAGERS!" : "GAME OVER",
        W / 2,
        H / 2 - 30
      );

      ctx.fillStyle = "#eee";
      ctx.font = "17px monospace";

      ctx.fillText(
        victory
          ? "The Purple King has fallen."
          : "Press Restart Game to try again.",
        W / 2,
        H / 2 + 15
      );

      if (victory) {
        ctx.fillText(
          "The Black Spirit is gone, but your powers remain.",
          W / 2,
          H / 2 + 50
        );
      }

      ctx.textAlign = "left";
    }
  }

  // ==========================================
  // INTERFACE UPDATES
  // ==========================================

  function cooldown(value) {
    return value > 0
      ? value.toFixed(1) + "s"
      : "Ready";
  }

  function refreshUI() {
    $("dwChapter").textContent =
      "Chapter " + (chapter + 1) +
      " of 8 — " + chapters[chapter].name;

    const remaining = enemies.filter(e => !e.dead).length;

    $("dwStatus").textContent =
      victory ? "VICTORY! You completed TheDarkWithin." :
      gameOver ? "Game Over! Press Restart." :
      departure ? "The Black Spirit is leaving..." :
      cutscene ? "The Black Spirit is awakening..." :
      cleared ? "Chapter Cleared! Continue inside the game." :
      started ? chapters[chapter].story +
        " Enemies remaining: " + remaining :
      "Press Start Adventure to begin.";

    $("dwSkill").textContent =
      takeoverComplete
        ? "M — Black Flash"
        : "M — Water Wheel";

    $("dwDivergent").textContent =
      takeoverComplete
        ? "N — Divergent Fist"
        : "N — Locked";

    $("dwCooldowns").textContent =
      "Sword: " + cooldown(player.swordCd) +
      " | " +
      (takeoverComplete ? "Black Flash" : "Water Wheel") +
      ": " + cooldown(player.skillCd) +
      " | Divergent Fist: " +
      (takeoverComplete
        ? cooldown(player.divergentCd)
        : "Locked") +
      " | Flame Arrow: " + cooldown(player.flameCd);

    const active = canAttack();

    $("dwSword").disabled =
      !active || player.swordCd > 0;

    $("dwSkill").disabled =
      !active || player.skillCd > 0;

    $("dwDivergent").disabled =
      !active || !takeoverComplete ||
      player.divergentCd > 0;

    $("dwFlame").disabled =
      !active || player.flameCd > 0;

    continueButton.style.display =
      cleared ? "block" : "none";

    startButton.disabled =
      started || cleared || gameOver || victory;

    startButton.textContent =
      started ? "Adventure Running" :
      cleared ? "Chapter Cleared" :
      victory ? "Game Complete" :
      gameOver ? "Restart Required" :
      "Start Adventure";
  }

  // ==========================================
  // BUTTON CONTROLS
  // ==========================================

  startButton.addEventListener("click", () => {
    if (!started && !cleared && !gameOver && !victory) {
      beginChapter();
    }
  });

  continueButton.addEventListener("click", () => {
    if (cleared && !gameOver && !victory) {
      beginChapter();
    }
  });

  $("dwRestart").addEventListener("click", resetGame);

  difficultySelect.addEventListener(
    "change",
    resetGame
  );

  $("dwSword").addEventListener("click", swordAttack);

  $("dwSkill").addEventListener("click", () => {
    takeoverComplete ? blackFlash() : waterWheel();
  });

  $("dwDivergent").addEventListener(
    "click",
    divergentFist
  );

  $("dwFlame").addEventListener(
    "click",
    flameArrow
  );

  canvas.addEventListener("click", swordAttack);

  // ==========================================
  // FULLSCREEN
  // ==========================================

  $("dwFullscreen").addEventListener(
    "click",
    async () => {
      try {
        if (!document.fullscreenElement) {
          await frame.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        say("Fullscreen unavailable.", 3);
      }
    }
  );

  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement === frame) {
      frame.style.width = "100vw";
      frame.style.height = "100vh";
      frame.style.display = "flex";
      frame.style.alignItems = "center";
      frame.style.justifyContent = "center";
      frame.style.background = "#080a0d";

      canvas.style.maxHeight = "100vh";
      canvas.style.objectFit = "contain";
    } else {
      frame.style.width = "min(960px,100%)";
      frame.style.height = "auto";
      frame.style.display = "block";

      canvas.style.maxHeight = "";
      canvas.style.objectFit = "";
    }
  });

  // ==========================================
  // KEYBOARD CONTROLS
  // ==========================================

  window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    const target = event.target;

    if (
      target instanceof HTMLElement &&
      (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          target.tagName
        )
      )
    ) {
      return;
    }

    if (
      [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " "
      ].includes(key)
    ) {
      event.preventDefault();
    }

    keys[key] = true;

    if (event.repeat) return;

    if (key === " " || key === "j") {
      swordAttack();
    }

    if (key === "m") {
      takeoverComplete ? blackFlash() : waterWheel();
    }

    if (key === "n") divergentFist();
    if (key === "k") flameArrow();
  });

  window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
  });

  window.addEventListener("blur", () => {
    for (const key in keys) {
      keys[key] = false;
    }
  });

  // ==========================================
  // DRAW COMPLETE GAME
  // ==========================================

  function draw() {
    ctx.clearRect(0, 0, W, H);

    drawBackground();
    drawEnemies();
    drawPlayer();
    drawProjectiles();
    drawEffects();
    drawCutsceneOverlay();
    drawHUD();
  }

  // ==========================================
  // MAIN GAME LOOP
  // ==========================================

  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;

    const dt = Math.min(
      (timestamp - lastTime) / 1000,
      0.05
    );

    lastTime = timestamp;

    update(dt);
    refreshUI();
    draw();

    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // STARTUP
  // ==========================================

  // Hide old welcome popup if one exists.
  const oldMessage = $("messageBox");

  if (oldMessage) {
    oldMessage.style.display = "none";
  }

  resetGame();

  requestAnimationFrame(gameLoop);

  console.log(
    "TheDarkWithin loaded with 8-bit music!"
  );

})();
