
(() => {
  "use strict";

  // =========================================================
  // THE DARK WITHIN — COMPLETE GAME
  // Movement: WASD / Arrow keys
  // Sword: Space / J / Mouse click
  // M: Water Wheel (Chapters 1-5) / Black Flash (Chapters 6-8)
  // N: Divergent Fist (Chapters 6-8)
  // K: Flame Arrow
  // =========================================================

  const W = 960;
  const H = 540;
  const MAX_CHAPTER = 8;

  // Reuse the canvas if the HTML already contains one.
  let canvas = document.querySelector("canvas");

  if (!canvas) {
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
  }

  canvas.id = "darkWithinCanvas";
  canvas.width = W;
  canvas.height = H;
  canvas.style.cssText =
    "display:block;width:100%;max-width:960px;height:auto;" +
    "margin:12px auto;background:#101010;" +
    "border:2px solid #624078;image-rendering:pixelated;";

  document.body.style.cssText =
    "margin:0;background:#08070b;color:#f0e8ff;" +
    "font-family:monospace;text-align:center;";

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // -------------------- GAME INTERFACE --------------------

  let ui = document.getElementById("darkWithinUI");

  if (!ui) {
    ui = document.createElement("div");
    ui.id = "darkWithinUI";
    canvas.before(ui);
  }

  ui.innerHTML = "";
  ui.style.cssText =
    "max-width:960px;margin:12px auto;padding:12px;" +
    "display:flex;flex-wrap:wrap;justify-content:center;" +
    "align-items:center;gap:10px;background:#120d18;" +
    "border:1px solid #624078;color:#f0e8ff;";

  const status = document.createElement("div");
  status.style.cssText =
    "width:100%;line-height:1.8;font-size:13px;";
  ui.appendChild(status);

  const difficultySelect = document.createElement("select");
  difficultySelect.setAttribute("aria-label", "Difficulty");
  difficultySelect.style.cssText =
    "padding:9px;background:#20152b;color:white;" +
    "border:1px solid #a66bea;font-family:monospace;";

  ["Easy", "Medium", "Hard", "Extreme"].forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name + " Mode";
    difficultySelect.appendChild(option);
  });

  ui.appendChild(difficultySelect);

  function makeButton(label, callback) {
    const button = document.createElement("button");
    button.textContent = label;
    button.style.cssText =
      "padding:9px 13px;background:#251530;color:#fff;" +
      "border:1px solid #a66bea;cursor:pointer;" +
      "font:bold 13px monospace;";
    button.addEventListener("click", callback);
    ui.appendChild(button);
    return button;
  }

  let player;
  let enemies = [];
  let projectiles = [];
  let effects = [];
  let toxicClouds = [];

  let chapter = 1;
  let started = false;
  let gameOver = false;
  let chapterCleared = false;
  let gameWon = false;

  let lastTime = 0;
  let time = 0;
  let message = "";
  let messageTime = 0;

  let attackCooldown = 0;
  let waterCooldown = 0;
  let flameCooldown = 0;
  let divergentCooldown = 0;
  let hurtCooldown = 0;

  const keys = new Set();

  const settings = {
    Easy:    { hp: 45,  damage: 5,  speed: 35, count: 4 },
    Medium:  { hp: 70,  damage: 10, speed: 48, count: 5 },
    Hard:    { hp: 105, damage: 17, speed: 62, count: 7 },
    Extreme: { hp: 160, damage: 27, speed: 78, count: 9 }
  };

  const scenes = [
    {
      name: "THE FORGOTTEN FOREST",
      sky: "#101b18", floor: "#17251b",
      tile: "#14231b", detail: "#315336",
      accent: "#79a95c", type: "forest"
    },
    {
      name: "THE ABANDONED VILLAGE",
      sky: "#211b26", floor: "#30252b",
      tile: "#382a2c", detail: "#725044",
      accent: "#e0a45c", type: "village"
    },
    {
      name: "THE GRAVEYARD",
      sky: "#151b31", floor: "#252b3c",
      tile: "#202638", detail: "#6e7891",
      accent: "#a5b7e8", type: "graveyard"
    },
    {
      name: "THE ANCIENT DUNGEON",
      sky: "#17191d", floor: "#303238",
      tile: "#282a30", detail: "#575b63",
      accent: "#e6a65d", type: "dungeon"
    },
    {
      name: "THE FROZEN WASTELAND",
      sky: "#152b38", floor: "#294452",
      tile: "#24404e", detail: "#6e9dad",
      accent: "#b9f1ff", type: "ice"
    },
    {
      name: "THE DARK SPIRIT",
      sky: "#10081d", floor: "#20152d",
      tile: "#1b1028", detail: "#593578",
      accent: "#c28aff", type: "spirit"
    },
    {
      name: "THE BURNING FORTRESS",
      sky: "#2a1412", floor: "#38201b",
      tile: "#301b18", detail: "#78382a",
      accent: "#ff8b3d", type: "fire"
    },
    {
      name: "THE PURPLE KING'S THRONE",
      sky: "#17051d", floor: "#29102f",
      tile: "#210b28", detail: "#65247d",
      accent: "#e05cff", type: "final"
    }
  ];

  const startButton = makeButton("Start Adventure", () => {
    if (gameOver || gameWon) {
      resetGame();
      startGame();
    } else if (chapterCleared && chapter < MAX_CHAPTER) {
      nextChapter();
    } else if (!started) {
      startGame();
    }
  });

  makeButton("Restart Game", () => {
    resetGame();
    startGame();
  });

  makeButton("⚔ Sword", swordAttack);
  makeButton("💧 Water Wheel / Black Flash", blackFlashOrWater);
  makeButton("👊 Divergent Fist", divergentFist);
  makeButton("🔥 Flame Arrow", flameArrow);

  const hint = document.createElement("div");
  hint.style.cssText =
    "width:100%;font-size:12px;color:#c7addb;line-height:1.9;";
  hint.textContent =
    "MOVE: WASD / ARROWS • SWORD: SPACE / J / CLICK • " +
    "M: WATER WHEEL / BLACK FLASH • N: DIVERGENT FIST • K: FLAME ARROW";
  ui.appendChild(hint);

  // -------------------- CHAPTERS --------------------

  function createChapter() {
    const mode = settings[difficultySelect.value] || settings.Medium;

    player = {
      x: W / 2,
      y: H / 2,
      r: 12,
      hp: 100,
      maxHp: 100,
      faceX: 1,
      faceY: 0,
      speed: 185,
      flash: 0,
      walk: 0
    };

    enemies = [];
    projectiles = [];
    effects = [];
    toxicClouds = [];

    chapterCleared = false;
    gameOver = false;
    gameWon = false;

    attackCooldown = 0;
    waterCooldown = 0;
    flameCooldown = 0;
    divergentCooldown = 0;
    hurtCooldown = 0;

    if (chapter === MAX_CHAPTER) {
      // One powerful boss instead of regular monsters.
      const bossHp = mode.hp * 18;

      enemies.push({
        x: W - 155,
        y: H / 2,
        r: 34,
        hp: bossHp,
        maxHp: bossHp,
        damage: mode.damage * 1.6,
        speed: 47 + mode.speed * 0.12,
        phase: 0,
        flash: 0,
        attack: 1.7,
        knockX: 0,
        knockY: 0,
        alive: true,
        kind: 3,
        isBoss: true,
        mistTimer: 2.4,
        slamTimer: 3.5,
        chargeTimer: 5,
        charging: 0
      });

      message = "THE PURPLE KING HAS AWAKENED!";
      messageTime = 4;
      return;
    }

    const count = mode.count + Math.min(chapter - 1, 6);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 130 + Math.random() * 190;

      const x = Math.max(
        35, Math.min(W - 35, player.x + Math.cos(angle) * distance)
      );

      const y = Math.max(
        65, Math.min(H - 35, player.y + Math.sin(angle) * distance)
      );

      const hp = mode.hp + (chapter - 1) * 12;

      enemies.push({
        x, y,
        r: 12 + Math.random() * 4,
        hp,
        maxHp: hp,
        damage: mode.damage + Math.floor((chapter - 1) * 1.5),
        speed: mode.speed + Math.min((chapter - 1) * 2, 20),
        phase: Math.random() * 10,
        flash: 0,
        attack: Math.random(),
        knockX: 0,
        knockY: 0,
        alive: true,
        kind: i % 3,
        isBoss: false
      });
    }

    if (chapter === 6) {
      message = "THE DARK SPIRIT AWAKENS! BLACK FLASH UNLOCKED!";
    } else {
      message = "CHAPTER " + chapter + " — DEFEAT EVERY MONSTER!";
    }

    messageTime = 3.5;
  }

  function startGame() {
    if (gameWon || gameOver) return;

    started = true;
    chapterCleared = false;

    const overlay = document.getElementById("messageBox");
    if (overlay) overlay.style.display = "none";

    difficultySelect.disabled = true;
    startButton.textContent = "Adventure In Progress";
    lastTime = 0;
    messageTime = 2.5;

    updateStatus();
  }

  function nextChapter() {
    if (!chapterCleared || gameOver || gameWon) return;
    if (chapter >= MAX_CHAPTER) return;

    chapter++;
    createChapter();
    startGame();
  }

  function resetGame() {
    chapter = 1;
    started = false;
    gameOver = false;
    chapterCleared = false;
    gameWon = false;
    time = 0;
    lastTime = 0;

    keys.clear();
    difficultySelect.disabled = false;
    startButton.textContent = "Start Adventure";

    createChapter();
    updateStatus();
    draw();
  }

  function updateStatus() {
    if (!player) return;

    const remaining = enemies.filter(e => e.alive).length;
    const boss = enemies.find(e => e.alive && e.isBoss);

    status.textContent =
      "THE DARK WITHIN  |  Chapter " + chapter +
      "/" + MAX_CHAPTER +
      "  |  " + difficultySelect.value +
      "  |  Health: " + Math.ceil(player.hp) + "/" + player.maxHp +
      (boss
        ? "  |  PURPLE KING HP: " + Math.ceil(boss.hp) + "/" + boss.maxHp
        : "  |  Monsters: " + remaining) +
      (chapterCleared ? "  |  CHAPTER CLEARED!" : "") +
      (gameOver ? "  |  YOU DIED" : "") +
      (gameWon ? "  |  GAME COMPLETED!" : "");

    if (gameWon) {
      startButton.textContent = "Play Again";
    } else if (gameOver) {
      startButton.textContent = "Try Again";
    } else if (chapterCleared && chapter < MAX_CHAPTER) {
      startButton.textContent = "Continue to Chapter " + (chapter + 1);
    } else if (chapterCleared && chapter === MAX_CHAPTER) {
      startButton.textContent = "Victory!";
    } else if (!started) {
      startButton.textContent = "Start Adventure";
    } else {
      startButton.textContent = "Adventure In Progress";
    }
  }

  // -------------------- EFFECTS AND DAMAGE --------------------

  function addEffect(x, y, color, radius, duration, type = "burst") {
    effects.push({
      x, y, color, radius,
      duration,
      maxDuration: duration,
      type
    });
  }

  function damageEnemy(enemy, amount, knock = 90) {
    if (!enemy.alive) return;

    enemy.hp -= amount;
    enemy.flash = 0.16;

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const len = Math.hypot(dx, dy) || 1;

    enemy.knockX = dx / len * knock;
    enemy.knockY = dy / len * knock;

    addEffect(enemy.x, enemy.y, "#f4dcff", 18, 0.2);

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.alive = false;

      addEffect(
        enemy.x, enemy.y,
        enemy.isBoss ? "#d84cff" : "#a5e86d",
        enemy.isBoss ? 100 : 30,
        enemy.isBoss ? 1.5 : 0.55
      );

      for (let i = 0; i < 10; i++) {
        const colors = enemy.isBoss
          ? ["#c43cff", "#f4d7ff", "#7510b5"]
          : ["#a5e86d", "#e9ffc2", "#548b56"];

        addEffect(
          enemy.x + (Math.random() - 0.5) * 35,
          enemy.y + (Math.random() - 0.5) * 35,
          colors[i % colors.length],
          3 + Math.random() * 6,
          0.5,
          "particle"
        );
      }
    }

    checkChapterClear();
  }

  function checkChapterClear() {
    if (chapterCleared || !enemies.every(e => !e.alive)) return;

    chapterCleared = true;
    started = false;

    if (chapter === MAX_CHAPTER) {
      gameWon = true;
      message = "THE PURPLE KING HAS FALLEN!";
      startButton.textContent = "Play Again";
    } else {
      message = "ALL MONSTERS DEFEATED! CHAPTER CLEARED!";
      startButton.textContent = "Continue to Chapter " + (chapter + 1);
    }

    messageTime = 999;
    addEffect(W / 2, H / 2, "#e9c5ff", 160, 1.5);
    updateStatus();
  }

  // -------------------- PLAYER ATTACKS --------------------

  function swordAttack() {
    if (!started || gameOver || chapterCleared || attackCooldown > 0) return;

    attackCooldown = 0.36;

    addEffect(
      player.x + player.faceX * 27,
      player.y + player.faceY * 27,
      "#f4f2d1", 37, 0.22, "slash"
    );

    for (const e of enemies) {
      if (!e.alive) continue;

      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const distance = Math.hypot(dx, dy);
      const dot = (dx * player.faceX + dy * player.faceY) / (distance || 1);

      if (distance <= 66 && dot > -0.15) {
        damageEnemy(e, e.isBoss ? 24 : 30, 175);
      }
    }
  }

  function blackFlashOrWater() {
    if (chapter < 6) {
      waterWheel();
    } else {
      blackFlash();
    }
  }

  function waterWheel() {
    if (!started || gameOver || chapterCleared || waterCooldown > 0) return;

    waterCooldown = 3;

    addEffect(player.x, player.y, "#48cfff", 105, 0.65, "water");
    addEffect(player.x, player.y, "#b7f4ff", 70, 0.55, "water");

    for (const e of enemies) {
      if (e.alive && Math.hypot(e.x - player.x, e.y - player.y) < 112) {
        damageEnemy(e, e.isBoss ? 35 : 42, 230);
      }
    }
  }

  function blackFlash() {
    if (!started || gameOver || chapterCleared || waterCooldown > 0) return;

    waterCooldown = 1.8;

    addEffect(
      player.x + player.faceX * 35,
      player.y + player.faceY * 35,
      "#080808", 95, 0.45, "blackflash"
    );

    addEffect(
      player.x + player.faceX * 35,
      player.y + player.faceY * 35,
      "#b77aff", 65, 0.38, "blackflash"
    );

    for (const e of enemies) {
      if (!e.alive) continue;

      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const distance = Math.hypot(dx, dy);
      const dot = (dx * player.faceX + dy * player.faceY) / (distance || 1);

      if (distance < 125 && dot > 0.05) {
        damageEnemy(e, e.isBoss ? 75 : 65, 300);
        addEffect(e.x, e.y, "#ffffff", 45, 0.25, "blackflash");
      }
    }

    message = "BLACK FLASH!";
    messageTime = 0.8;
  }

  function divergentFist() {
    if (chapter < 6) {
      message = "DIVERGENT FIST UNLOCKS IN CHAPTER 6!";
      messageTime = 1.5;
      return;
    }

    if (!started || gameOver || chapterCleared || divergentCooldown > 0) return;

    divergentCooldown = 2.8;

    addEffect(
      player.x + player.faceX * 35,
      player.y + player.faceY * 35,
      "#222222", 48, 0.25, "burst"
    );

    const hitEnemies = [];

    for (const e of enemies) {
      if (!e.alive) continue;

      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const distance = Math.hypot(dx, dy);
      const dot = (dx * player.faceX + dy * player.faceY) / (distance || 1);

      if (distance < 90 && dot > -0.1) {
        damageEnemy(e, e.isBoss ? 22 : 25, 180);
        hitEnemies.push(e);
      }
    }

    // Second impact lands shortly after the first.
    window.setTimeout(() => {
      if (!player || gameOver) return;

      for (const e of hitEnemies) {
        if (!e.alive) continue;

        damageEnemy(e, e.isBoss ? 35 : 45, 260);
        addEffect(e.x, e.y, "#a855f7", 60, 0.4, "burst");
      }
    }, 350);

    message = "DIVERGENT FIST!";
    messageTime = 0.8;
  }

  function flameArrow() {
    if (!started || gameOver || chapterCleared || flameCooldown > 0) return;

    flameCooldown = 1.25;

    projectiles.push({
      x: player.x + player.faceX * 18,
      y: player.y + player.faceY * 18,
      vx: player.faceX * 390,
      vy: player.faceY * 390,
      life: 1.6,
      r: 7
    });

    addEffect(
      player.x + player.faceX * 20,
      player.y + player.faceY * 20,
      "#ff9b36", 18, 0.25
    );
  }

  // -------------------- PLAYER DAMAGE --------------------

  function hurtPlayer(amount) {
    if (hurtCooldown > 0 || gameOver || chapterCleared) return;

    player.hp -= amount;
    player.flash = 0.22;
    hurtCooldown = 0.55;

    addEffect(player.x, player.y, "#ff5656", 23, 0.3);

    if (player.hp <= 0) {
      player.hp = 0;
      gameOver = true;
      started = false;
      message = "YOU DIED — RESTART TO TRY AGAIN";
      messageTime = 999;
      updateStatus();
    }
  }

  // -------------------- UPDATE GAME --------------------

  function update(dt) {
    if (!started || gameOver || chapterCleared) return;

    time += dt;

    attackCooldown = Math.max(0, attackCooldown - dt);
    waterCooldown = Math.max(0, waterCooldown - dt);
    flameCooldown = Math.max(0, flameCooldown - dt);
    divergentCooldown = Math.max(0, divergentCooldown - dt);
    hurtCooldown = Math.max(0, hurtCooldown - dt);
    player.flash = Math.max(0, player.flash - dt);
    player.walk += dt * 11;
    messageTime = Math.max(0, messageTime - dt);

    let mx = 0;
    let my = 0;

    if (keys.has("a") || keys.has("arrowleft")) mx--;
    if (keys.has("d") || keys.has("arrowright")) mx++;
    if (keys.has("w") || keys.has("arrowup")) my--;
    if (keys.has("s") || keys.has("arrowdown")) my++;

    const len = Math.hypot(mx, my) || 1;

    if (mx || my) {
      mx /= len;
      my /= len;

      player.faceX = mx;
      player.faceY = my;
      player.x += mx * player.speed * dt;
      player.y += my * player.speed * dt;
    }

    player.x = Math.max(18, Math.min(W - 18, player.x));
    player.y = Math.max(48, Math.min(H - 18, player.y));

    const mode = settings[difficultySelect.value] || settings.Medium;

    for (const e of enemies) {
      if (!e.alive) continue;

      e.phase += dt * 5;
      e.flash = Math.max(0, e.flash - dt);
      e.attack = Math.max(0, e.attack - dt);

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const distance = Math.hypot(dx, dy) || 1;

      if (e.isBoss) {
        updateBoss(e, dt, distance, dx, dy);
      } else {
        if (distance > player.r + e.r + 3) {
          e.x += dx / distance * e.speed * dt;
          e.y += dy / distance * e.speed * dt;
        }

        if (Math.hypot(e.knockX, e.knockY) > 2) {
          e.x += e.knockX * dt;
          e.y += e.knockY * dt;
          e.knockX *= Math.pow(0.025, dt);
          e.knockY *= Math.pow(0.025, dt);
        }

        if (distance < player.r + e.r + 4 && e.attack <= 0) {
          e.attack = 0.9;
          hurtPlayer(e.damage);
        }
      }

      e.x = Math.max(25, Math.min(W - 25, e.x));
      e.y = Math.max(55, Math.min(H - 25, e.y));
    }

    // Toxic mist clouds damage the player while they remain inside.
    for (const cloud of toxicClouds) {
      cloud.life -= dt;

      if (cloud.life > 0 &&
          Math.hypot(player.x - cloud.x, player.y - cloud.y) < cloud.r) {
        hurtPlayer(cloud.damage * dt);
      }
    }

    toxicClouds = toxicClouds.filter(c => c.life > 0);

    // Flame Arrow projectile collision.
    for (const p of projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      addEffect(p.x, p.y, "#ff7b24", 5, 0.15, "particle");

      for (const e of enemies) {
        if (e.alive &&
            Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r + 5) {
          damageEnemy(e, e.isBoss ? 45 : 48, 145);
          addEffect(p.x, p.y, "#ffb83d", 32, 0.35);
          p.life = 0;
          break;
        }
      }
    }

    projectiles = projectiles.filter(p =>
      p.life > 0 &&
      p.x > -30 && p.x < W + 30 &&
      p.y > -30 && p.y < H + 30
    );

    for (const fx of effects) {
      fx.duration -= dt;
    }

    effects = effects.filter(fx => fx.duration > 0);

    updateStatus();
  }

  // -------------------- FINAL BOSS AI --------------------

  function updateBoss(e, dt, distance, dx, dy) {
    e.mistTimer -= dt;
    e.slamTimer -= dt;
    e.chargeTimer -= dt;

    const direction = Math.atan2(dy, dx);

    // Slowly pursue the player.
    if (distance > 100 && e.charging <= 0) {
      e.x += dx / distance * e.speed * dt;
      e.y += dy / distance * e.speed * dt;
    }

    // Phase two: the boss becomes more aggressive below half health.
    const phaseTwo = e.hp < e.maxHp * 0.5;
    const mistInterval = phaseTwo ? 1.7 : 2.8;

    if (e.mistTimer <= 0) {
      e.mistTimer = mistInterval;

      const spread = phaseTwo ? 115 : 80;
      const cloudX = Math.max(
        45, Math.min(W - 45, player.x + (Math.random() - 0.5) * spread)
      );
      const cloudY = Math.max(
        75, Math.min(H - 45, player.y + (Math.random() - 0.5) * spread)
      );

      toxicClouds.push({
        x: cloudX,
        y: cloudY,
        r: phaseTwo ? 100 : 82,
        life: phaseTwo ? 3 : 2.4,
        damage: phaseTwo ? 24 : 18
      });

      addEffect(cloudX, cloudY, "#a020f0", 105, 1.9, "toxic");
      addEffect(cloudX, cloudY, "#6f00a8", 75, 1.6, "toxic");

      message = phaseTwo ? "PURPLE KING: TOXIC STORM!" : "TOXIC MIST! MOVE!";
      messageTime = 1.1;
    }

    // Ground slam: dangerous if the player is close.
    if (e.slamTimer <= 0) {
      e.slamTimer = phaseTwo ? 2.0 : 3.1;

      addEffect(e.x, e.y, "#c000ff", phaseTwo ? 190 : 145, 0.7, "toxic");
      addEffect(e.x, e.y, "#f3baff", 75, 0.5, "burst");

      if (distance < (phaseTwo ? 175 : 135)) {
        hurtPlayer(phaseTwo ? 30 : 22);
      } else {
        message = "GROUND SLAM!";
        messageTime = 0.7;
      }
    }

    // Fast charge attack.
    if (e.charging > 0) {
      e.x += Math.cos(e.chargeAngle) * (phaseTwo ? 260 : 210) * dt;
      e.y += Math.sin(e.chargeAngle) * (phaseTwo ? 260 : 210) * dt;
      e.charging -= dt;

      if (Math.hypot(player.x - e.x, player.y - e.y) < player.r + e.r + 8) {
        hurtPlayer(phaseTwo ? 28 : 20);
        e.charging = 0;
      }
    } else if (e.chargeTimer <= 0) {
      e.chargeTimer = phaseTwo ? 2.5 : 4.5;
      e.charging = 0.45;
      e.chargeAngle = direction;

      message = "PURPLE KING CHARGES!";
      messageTime = 0.8;
    }

    // Boss contact also hurts the player.
    if (distance < player.r + e.r && e.attack <= 0) {
      e.attack = 0.9;
      hurtPlayer(phaseTwo ? 25 : 18);
    }

    if (Math.hypot(e.knockX, e.knockY) > 2) {
      e.x += e.knockX * dt;
      e.y += e.knockY * dt;
      e.knockX *= Math.pow(0.025, dt);
      e.knockY *= Math.pow(0.025, dt);
    }
  }

  // -------------------- BACKGROUNDS --------------------

  function drawBackground() {
    const scene = scenes[Math.min(chapter - 1, scenes.length - 1)];

    ctx.fillStyle = scene.sky;
    ctx.fillRect(0, 0, W, H);

    // Pixel tiled ground.
    for (let y = 28; y < H; y += 32) {
      for (let x = 0; x < W; x += 32) {
        const n = (x * 13 + y * 7 + chapter * 5) % 11;

        ctx.fillStyle = n < 4 ? scene.tile : scene.floor;
        ctx.fillRect(x, y, 31, 31);

        if (n === 2 || n === 7) {
          ctx.fillStyle = scene.detail;
          ctx.fillRect(x + 8, y + 12, 4, 3);
          ctx.fillRect(x + 22, y + 23, 3, 3);
        }
      }
    }

    if (scene.type === "forest" || scene.type === "spirit") {
      for (let i = 0; i < 20; i++) {
        const x = (i * 173 + 41) % W;
        const y = 50 + ((i * 89 + 67) % (H - 70));

        ctx.fillStyle = scene.detail;
        ctx.fillRect(x, y, 6, 15);
        ctx.fillRect(x - 5, y + 4, 5, 5);
        ctx.fillRect(x + 6, y + 2, 5, 6);

        if (scene.type === "spirit") {
          ctx.fillStyle = "rgba(170,65,255,0.35)";
          ctx.fillRect(x - 9, y + 15, 25, 3);
        }
      }
    }

    if (scene.type === "village") {
      for (let i = 0; i < 6; i++) {
        const x = 35 + i * 165;
        const y = 72 + (i % 2) * 36;

        ctx.fillStyle = "#211b20";
        ctx.fillRect(x, y, 72, 62);
        ctx.fillStyle = "#69413a";
        ctx.fillRect(x - 8, y - 12, 88, 17);
        ctx.fillStyle = "#e7a45a";
        ctx.fillRect(x + 15, y + 18, 9, 13);
        ctx.fillRect(x + 48, y + 18, 9, 13);
      }
    }

    if (scene.type === "graveyard") {
      for (let i = 0; i < 12; i++) {
        const x = (i * 79 + 35) % W;
        const y = 100 + (i * 47) % 350;

        ctx.fillStyle = "#727b91";
        ctx.fillRect(x, y, 18, 25);
        ctx.fillRect(x + 5, y - 7, 8, 8);
      }

      ctx.fillStyle = "#c3d2ef";
      ctx.fillRect(770, 55, 38, 38);
      ctx.fillStyle = scene.sky;
      ctx.fillRect(782, 48, 34, 34);
    }

    if (scene.type === "dungeon") {
      for (let y = 35; y < H; y += 48) {
        for (let x = 0; x < W; x += 96) {
          ctx.strokeStyle = "#555861";
          ctx.strokeRect(x, y, 96, 48);
        }
      }

      for (const x of [100, 290, 670, 850]) {
        ctx.fillStyle = "#6c625b";
        ctx.fillRect(x, 60, 14, 180);
        ctx.fillStyle = "#ffb14d";
        ctx.fillRect(x - 4, 95, 22, 8);
        ctx.fillStyle = "#ff6c31";
        ctx.fillRect(x + 3, 85, 8, 12);
      }
    }

    if (scene.type === "ice") {
      for (let i = 0; i < 12; i++) {
        const x = (i * 91 + 18) % W;

        ctx.fillStyle = "#719eaf";
        ctx.fillRect(x, 45 + (i % 4) * 15, 4, 70 + (i % 3) * 20);
        ctx.fillStyle = "#c0f4ff";
        ctx.fillRect(x + 4, 70 + (i % 4) * 15, 3, 42);
      }

      ctx.fillStyle = "rgba(180,235,255,.16)";
      ctx.fillRect(0, H - 100, W, 50);
    }

    if (scene.type === "fire" || scene.type === "final") {
      for (let i = 0; i < 13; i++) {
        const x = (i * 83 + 19) % W;

        ctx.fillStyle = scene.detail;
        ctx.fillRect(x, 35, 24, 150 + (i % 4) * 28);

        ctx.fillStyle = scene.accent;
        ctx.fillRect(x + 7, 45 + (i % 3) * 20, 4, 15);
      }
    }

    if (scene.type === "final") {
      // Purple throne behind the boss.
      ctx.fillStyle = "#100811";
      ctx.fillRect(W / 2 - 70, 75, 140, 170);
      ctx.fillRect(W / 2 - 95, 125, 190, 115);

      ctx.fillStyle = "#7b244f";
      ctx.fillRect(W / 2 - 45, 100, 90, 125);

      ctx.fillStyle = "#ff4eeb";
      ctx.fillRect(W / 2 - 22, 130, 12, 8);
      ctx.fillRect(W / 2 + 10, 130, 12, 8);

      // Atmospheric purple haze.
      ctx.fillStyle = "rgba(125,0,180,0.08)";
      ctx.fillRect(0, 28, W, H - 28);
    }

    // Chapter name banner.
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(0, 28, W, 25);

    ctx.fillStyle = scene.accent;
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "CHAPTER " + chapter + " — " + scene.name,
      W / 2, 45
    );
    ctx.textAlign = "left";

    // Locked gate / exit.
    ctx.fillStyle = chapterCleared ? "#79e6a1" : scene.detail;
    ctx.fillRect(W - 45, H / 2 - 32, 27, 64);

    ctx.fillStyle = "#101711";
    ctx.fillRect(W - 39, H / 2 - 25, 15, 53);

    ctx.fillStyle = chapterCleared ? "#d6ffbd" : scene.accent;
    ctx.fillRect(W - 34, H / 2 - 19, 5, 4);

    ctx.fillStyle = "#e2f6d8";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText(
      chapterCleared
        ? (chapter === MAX_CHAPTER ? "VICTORY" : "EXIT OPEN")
        : "LOCKED",
      W - 14, H / 2 + 43
    );
    ctx.textAlign = "left";
  }

  // -------------------- DRAW PLAYER --------------------

  function drawPlayer() {
    const moving =
      keys.has("w") || keys.has("a") ||
      keys.has("s") || keys.has("d") ||
      keys.has("arrowup") || keys.has("arrowdown") ||
      keys.has("arrowleft") || keys.has("arrowright");

    const bob = moving ? Math.sin(player.walk) * 2 : 0;
    const x = Math.round(player.x);
    const y = Math.round(player.y + bob);

    // Shadow.
    ctx.fillStyle = "#080c09";
    ctx.fillRect(x - 11, y + 8, 22, 5);

    // Boots.
    ctx.fillStyle = "#50382b";
    ctx.fillRect(x - 9, y + 3, 7, 8);
    ctx.fillRect(x + 2, y + 3, 7, 8);

    // Body and clothes.
    ctx.fillStyle = player.flash > 0 ? "#ffffff" : "#315c49";
    ctx.fillRect(x - 10, y - 9, 20, 17);

    ctx.fillStyle = "#203e31";
    ctx.fillRect(x - 9, y + 2, 18, 4);

    // Head and hair.
    ctx.fillStyle = "#e9b78a";
    ctx.fillRect(x - 8, y - 22, 16, 14);

    ctx.fillStyle = chapter >= 6 ? "#100817" : "#34281f";
    ctx.fillRect(x - 9, y - 24, 18, 6);
    ctx.fillRect(x - 9, y - 20, 4, 7);

    // Eyes.
    ctx.fillStyle = chapter >= 6 ? "#cf73ff" : "#171b17";
    ctx.fillRect(x + (player.faceX >= 0 ? 3 : -6), y - 17, 3, 3);

    // Sword.
    ctx.save();
    ctx.translate(x, y - 2);
    ctx.rotate(Math.atan2(player.faceY, player.faceX));

    ctx.fillStyle = "#d9e9eb";
    ctx.fillRect(8, -2, 23, 4);

    ctx.fillStyle = "#849a9c";
    ctx.fillRect(8, -1, 21, 1);

    ctx.fillStyle = "#8c613c";
    ctx.fillRect(5, -5, 4, 10);

    ctx.fillStyle = "#dfc98a";
    ctx.fillRect(4, -6, 3, 12);

    ctx.restore();

    // Player health bar.
    ctx.fillStyle = "#080c09";
    ctx.fillRect(x - 19, y - 34, 38, 5);

    ctx.fillStyle = "#72df78";
    ctx.fillRect(
      x - 18, y - 33,
      36 * Math.max(0, player.hp) / player.maxHp, 3
    );

    // Dark Spirit aura after Chapter 6.
    if (chapter >= 6) {
      ctx.strokeStyle = "rgba(177,80,255,0.65)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 15, y - 28, 30, 42);

      if (Math.random() < 0.15) {
        addEffect(
          x + (Math.random() - 0.5) * 25,
          y + (Math.random() - 0.5) * 25,
          "#a855f7", 5, 0.35, "particle"
        );
      }
    }
  }

  // -------------------- DRAW ENEMIES --------------------

  function drawEnemy(e) {
    const x = Math.round(e.x);
    const y = Math.round(e.y + Math.sin(e.phase) * 2);

    if (e.isBoss) {
      drawPurpleKing(e, x, y);
      return;
    }

    const color =
      e.kind === 0 ? "#76b74f" :
      e.kind === 1 ? "#9a6bb9" : "#b56d43";

    const dark =
      e.kind === 0 ? "#365d2e" :
      e.kind === 1 ? "#553969" : "#6b3a29";

    // Shadow.
    ctx.fillStyle = "#0b100c";
    ctx.fillRect(x - 14, y + 10, 28, 5);

    // Body.
    ctx.fillStyle = e.flash > 0 ? "#ffffff" : color;
    ctx.fillRect(x - 12, y - 7, 24, 14);
    ctx.fillRect(x - 8, y - 12, 16, 5);
    ctx.fillRect(x - 15, y - 2, 3, 8);
    ctx.fillRect(x + 12, y - 2, 3, 8);

    // Face.
    ctx.fillStyle = dark;
    ctx.fillRect(x - 8, y + 4, 16, 4);

    ctx.fillStyle = "#f8f5d7";
    ctx.fillRect(x - 7, y - 4, 5, 5);
    ctx.fillRect(x + 2, y - 4, 5, 5);

    ctx.fillStyle = "#171817";
    ctx.fillRect(x - 5, y - 3, 2, 3);
    ctx.fillRect(x + 4, y - 3, 2, 3);

    // Horns.
    if (e.kind === 2) {
      ctx.fillStyle = "#e2c28c";
      ctx.fillRect(x - 11, y - 15, 4, 7);
      ctx.fillRect(x + 7, y - 15, 4, 7);
    }

    // Enemy health bar.
    ctx.fillStyle = "#080c09";
    ctx.fillRect(x - 17, y - 23, 34, 5);

    ctx.fillStyle = e.hp / e.maxHp < 0.3 ? "#ff4d4d" : "#e8a65a";
    ctx.fillRect(
      x - 16, y - 22,
      32 * Math.max(0, e.hp) / e.maxHp, 3
    );
  }

  function drawPurpleKing(e, x, y) {
    const phaseTwo = e.hp < e.maxHp * 0.5;

    // Glowing aura.
    ctx.fillStyle = "rgba(150,0,255,0.20)";
    ctx.beginPath();
    ctx.arc(x, y, 68 + Math.sin(e.phase * 2) * 5, 0, Math.PI * 2);
    ctx.fill();

    // Shell.
    ctx.fillStyle = e.flash > 0 ? "#ffffff" : "#6420a0";
    ctx.fillRect(x - 34, y - 25, 68, 53);

    ctx.fillStyle = "#9b35ef";
    ctx.fillRect(x - 27, y - 32, 54, 12);
    ctx.fillRect(x - 42, y - 12, 12, 27);
    ctx.fillRect(x + 30, y - 12, 12, 27);

    // Spikes.
    ctx.fillStyle = "#d9c5ff";

    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(x + i * 13 - 4, y - 39, 8, 15);
      ctx.fillRect(x + i * 13 - 4, y + 19, 8, 13);
    }

    // Head and horns.
    ctx.fillStyle = "#7b27c7";
    ctx.fillRect(x - 22, y - 39, 44, 28);

    ctx.fillStyle = "#d9c5ff";
    ctx.fillRect(x - 22, y - 48, 8, 15);
    ctx.fillRect(x + 14, y - 48, 8, 15);

    // Glowing eyes.
    ctx.fillStyle = phaseTwo ? "#ff2929" : "#ff3df2";
    ctx.fillRect(x - 14, y - 29, 10, 7);
    ctx.fillRect(x + 5, y - 29, 10, 7);

    // Toxic mouth.
    ctx.fillStyle = "#aaff55";
    ctx.fillRect(x - 10, y - 15, 20, 5);

    // Boss health bar above the boss.
    ctx.fillStyle = "#100817";
    ctx.fillRect(x - 48, y - 61, 96, 8);

    ctx.fillStyle = phaseTwo ? "#ff3030" : "#b42cff";
    ctx.fillRect(
      x - 46, y - 59,
      92 * Math.max(0, e.hp) / e.maxHp, 4
    );

    ctx.fillStyle = "#f0caff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("THE PURPLE KING", x, y - 70);

    if (phaseTwo) {
      ctx.fillStyle = "#ff5555";
      ctx.fillText("ENRAGED!", x, y + 48);
    }

    ctx.textAlign = "left";
  }

  // -------------------- DRAW EFFECTS --------------------

  function drawEffects() {
    for (const fx of effects) {
      const progress = 1 - fx.duration / fx.maxDuration;
      const r = fx.radius * (fx.type === "particle" ? 1 : 0.5 + progress);

      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = fx.color;
      ctx.fillStyle = fx.color;
      ctx.lineWidth = fx.type === "water" ? 4 : 3;

      if (fx.type === "toxic") {
        ctx.globalAlpha = Math.max(0, 0.30 * (1 - progress));
        ctx.fillStyle = fx.color;

        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = Math.max(0, 0.8 * (1 - progress));
        ctx.strokeStyle = "#d66bff";
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.arc(
          fx.x, fx.y, r * 0.75,
          progress * 5, progress * 5 + Math.PI * 1.5
        );
        ctx.stroke();
      } else if (fx.type === "blackflash") {
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.strokeStyle = progress < 0.5 ? "#ffffff" : "#a855f7";
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.moveTo(fx.x - r, fx.y - r * 0.5);
        ctx.lineTo(fx.x - r * 0.2, fx.y);
        ctx.lineTo(fx.x + r * 0.15, fx.y - r * 0.65);
        ctx.lineTo(fx.x + r, fx.y + r * 0.3);
        ctx.stroke();
      } else if (fx.type === "water") {
        ctx.beginPath();
        ctx.arc(
          fx.x, fx.y, r,
          progress * Math.PI * 2,
          progress * Math.PI * 2 + Math.PI * 1.45
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
          fx.x, fx.y, r * 0.7,
          -progress * Math.PI * 2,
          -progress * Math.PI * 2 + Math.PI * 1.35
        );
        ctx.stroke();
      } else if (fx.type === "slash") {
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, -1.0, 1.0);
        ctx.stroke();
      } else if (fx.type === "particle") {
        ctx.fillRect(fx.x - 2, fx.y - 2, 4, 4);
      } else {
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx));

      ctx.fillStyle = "#ff4d20";
      ctx.fillRect(-17, -4, 24, 8);

      ctx.fillStyle = "#ffae32";
      ctx.fillRect(-11, -2, 24, 4);

      ctx.fillStyle = "#fff0a0";
      ctx.fillRect(8, -2, 12, 4);

      ctx.fillStyle = "#fff5cb";
      ctx.fillRect(17, -5, 6, 10);

      ctx.restore();
    }
  }

  // -------------------- SCREEN OVERLAYS --------------------

  function drawOverlay() {
    if (!started && !gameOver && !chapterCleared) {
      ctx.fillStyle = "rgba(0,0,0,.68)";
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";
      ctx.fillStyle = "#e2c4ff";
      ctx.font = "bold 31px monospace";
      ctx.fillText("THE DARK WITHIN", W / 2, H / 2 - 55);

      ctx.font = "16px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        "Choose a difficulty and press Start Adventure",
        W / 2, H / 2 - 10
      );
      ctx.fillText(
        "Defeat every monster to unlock the exit",
        W / 2, H / 2 + 20
      );

      ctx.textAlign = "left";
    }

    if (chapterCleared) {
      ctx.fillStyle = "rgba(0,0,0,.68)";
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";
      ctx.fillStyle = gameWon ? "#e8baff" : "#baffc0";
      ctx.font = "bold 28px monospace";

      ctx.fillText(
        gameWon
          ? "THE PURPLE KING HAS FALLEN!"
          : "CHAPTER " + chapter + " CLEARED!",
        W / 2, H / 2 - 20
      );

      ctx.font = "15px monospace";
      ctx.fillStyle = "#ffffff";

      ctx.fillText(
        gameWon
          ? "You defeated the final boss. Your journey is complete!"
          : "Every enemy has been defeated.",
        W / 2, H / 2 + 12
      );

      ctx.fillText(
        gameWon
          ? "Press Play Again to start a new journey."
          : "Press Continue to begin the next chapter.",
        W / 2, H / 2 + 40
      );

      ctx.textAlign = "left";
    }

    if (gameOver) {
      ctx.fillStyle = "rgba(30,0,0,.75)";
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";
      ctx.fillStyle = "#ff8585";
      ctx.font = "bold 34px monospace";
      ctx.fillText("YOU DIED", W / 2, H / 2);

      ctx.font = "16px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Press Try Again to restart.", W / 2, H / 2 + 35);

      ctx.textAlign = "left";
    }

    if (messageTime > 0 && started && !chapterCleared && !gameOver) {
      ctx.textAlign = "center";
      ctx.font = "bold 17px monospace";
      ctx.fillStyle = chapter >= 6 ? "#e5c2ff" : "#e5ffce";
      ctx.fillText(message, W / 2, 70);
      ctx.textAlign = "left";
    }
  }

  // -------------------- DRAW FRAME --------------------

  function draw() {
    drawBackground();

    for (const cloud of toxicClouds) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.36, cloud.life * 0.14);
      ctx.fillStyle = "#a020f0";
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const e of enemies) {
      if (e.alive) drawEnemy(e);
    }

    drawEffects();
    drawProjectiles();

    if (player) drawPlayer();

    drawOverlay();

    // Ability cooldown labels.
    ctx.font = "12px monospace";

    ctx.fillStyle = waterCooldown <= 0 ? "#d8a5ff" : "#766580";
    ctx.fillText(
      chapter < 6
        ? (waterCooldown <= 0
          ? "M: WATER WHEEL READY"
          : "M: WATER " + waterCooldown.toFixed(1) + "s")
        : (waterCooldown <= 0
          ? "M: BLACK FLASH READY"
          : "M: BLACK FLASH " + waterCooldown.toFixed(1) + "s"),
      15, H - 28
    );

    ctx.fillStyle = chapter >= 6
      ? (divergentCooldown <= 0 ? "#cda4ff" : "#766580")
      : "#a0a0a0";

    ctx.fillText(
      chapter >= 6
        ? (divergentCooldown <= 0
          ? "N: DIVERGENT FIST READY"
          : "N: DIVERGENT " + divergentCooldown.toFixed(1) + "s")
        : "N: UNLOCKS IN CHAPTER 6",
      15, H - 12
    );

    ctx.fillStyle = flameCooldown <= 0 ? "#ffb05c" : "#8d7764";
    ctx.fillText(
      flameCooldown <= 0
        ? "K: FLAME ARROW READY"
        : "K: FLAME " + flameCooldown.toFixed(1) + "s",
      W - 200, H - 12
    );
  }

  // -------------------- INPUT --------------------

  window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    if (
      ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
        .includes(key)
    ) {
      event.preventDefault();
    }

    keys.add(key);

    if (event.repeat) return;

    if (key === " " || key === "j") swordAttack();
    if (key === "m") blackFlashOrWater();
    if (key === "n") divergentFist();
    if (key === "k") flameArrow();
  });

  window.addEventListener("keyup", event => {
    keys.delete(event.key.toLowerCase());
  });

  window.addEventListener("blur", () => keys.clear());

  canvas.addEventListener("click", () => swordAttack());

  // -------------------- MAIN LOOP --------------------

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.04);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  // -------------------- START --------------------

  resetGame();
  requestAnimationFrame(loop);
})();
