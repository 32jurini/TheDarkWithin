
(() => {
  "use strict";

  // ============================================================
  // THEDARKWITHIN - COMPLETE GAME ENGINE
  // Controls:
  // WASD / Arrows = Move
  // Space / J / Click canvas = Sword
  // M = Water Wheel (Chapters 1-5) / Black Flash (Chapter 6+)
  // N = Divergent Fist (Chapter 6+)
  // K = Flame Arrow
  // ============================================================

  const old = document.getElementById("darkWithinUI");
  if (old) old.remove();

  const canvas =
    document.getElementById("darkWithinCanvas") ||
    document.querySelector("canvas") ||
    document.createElement("canvas");

  canvas.id = "darkWithinCanvas";
  canvas.width = 960;
  canvas.height = 540;

  if (!canvas.isConnected) document.body.appendChild(canvas);

  document.body.style.background = "#08080d";
  document.body.style.color = "#eee";
  document.body.style.margin = "0";
  document.body.style.fontFamily = "monospace";
  document.body.style.overflowX = "hidden";

  canvas.style.display = "block";
  canvas.style.width = "min(960px, 100%)";
  canvas.style.height = "auto";
  canvas.style.margin = "12px auto";
  canvas.style.border = "2px solid #34343d";
  canvas.style.imageRendering = "pixelated";
  canvas.style.background = "#111";

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // ---------------- UI ----------------

  const ui = document.createElement("div");
  ui.id = "darkWithinUI";
  ui.style.cssText = `
    max-width:960px;margin:12px auto;padding:12px;
    box-sizing:border-box;background:#111116;
    border:2px solid #34343d;color:#eee;
    font:14px monospace;
  `;
  canvas.insertAdjacentElement("beforebegin", ui);

  ui.innerHTML = `
    <div style="font-size:25px;font-weight:bold;color:#e9e9ed;
      margin-bottom:8px">THE DARK WITHIN</div>
    <div id="dwChapter" style="color:#aaa;margin-bottom:5px">
      Chapter 1
    </div>
    <div id="dwStatus" style="margin-bottom:12px">
      Find the missing villagers.
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;
      margin-bottom:12px">
      <label for="dwDifficulty">Difficulty:</label>
      <select id="dwDifficulty" style="padding:7px;background:#202027;
        color:white;border:1px solid #555">
        <option value="easy">Easy</option>
        <option value="medium" selected>Medium</option>
        <option value="hard">Hard</option>
        <option value="extreme">Extreme</option>
      </select>
      <button id="dwStart">Start Adventure</button>
      <button id="dwRestart">Restart Game</button>
    </div>

    <div style="line-height:1.9;color:#ccc">
      <b>Move:</b> WASD / Arrow Keys &nbsp; | &nbsp;
      <b>Sword:</b> Space / J / Click the game<br>
      <b>M:</b> Water Wheel before the takeover; Black Flash after it
      &nbsp; | &nbsp; <b>N:</b> Divergent Fist after takeover
      &nbsp; | &nbsp; <b>K:</b> Flame Arrow
    </div>

    <div id="dwMoves" style="margin-top:8px;color:#b9b9c7">
      Water Wheel: M &nbsp; | &nbsp; Flame Arrow: K
    </div>
  `;

  const chapterLabel = document.getElementById("dwChapter");
  const statusLabel = document.getElementById("dwStatus");
  const movesLabel = document.getElementById("dwMoves");
  const difficultySelect = document.getElementById("dwDifficulty");
  const startButton = document.getElementById("dwStart");

  for (const b of ui.querySelectorAll("button")) {
    b.style.cssText = `
      padding:9px 12px;background:#19191f;color:#eee;
      border:1px solid #50505a;cursor:pointer;font:inherit;
    `;
    b.addEventListener("mouseenter", () => {
      b.style.borderColor = "#66ee88";
      b.style.color = "#8cff9d";
    });
    b.addEventListener("mouseleave", () => {
      b.style.borderColor = "#50505a";
      b.style.color = "#eee";
    });
  }

  // ---------------- CHAPTERS ----------------

  const chapters = [
    {
      name: "The Missing Villagers",
      story: "Search the forest and defeat every enemy.",
      sky: "#233d42", ground: "#294e35", accent: "#8bb86a",
      enemies: 4, type: "slime"
    },
    {
      name: "The Frozen Mountains",
      story: "Cross the frozen mountains and survive.",
      sky: "#8baebc", ground: "#d2e1e5", accent: "#547c9c",
      enemies: 5, type: "ice"
    },
    {
      name: "The Forgotten Desert",
      story: "Follow the tracks through the burning sands.",
      sky: "#d99a55", ground: "#c58a45", accent: "#f3d18b",
      enemies: 6, type: "sand"
    },
    {
      name: "The Cage of Shadows",
      story: "Find the villagers' cages. Something is waiting.",
      sky: "#30233f", ground: "#33243b", accent: "#8761a0",
      enemies: 6, type: "shadow"
    },
    {
      name: "The Darkness Below",
      story: "Fight your way through the underground darkness.",
      sky: "#151526", ground: "#24243a", accent: "#6666a7",
      enemies: 7, type: "dark"
    },
    {
      name: "The Black Spirit",
      story: "The spirit awakens. Survive the takeover.",
      sky: "#100d19", ground: "#191421", accent: "#a52b43",
      enemies: 7, type: "spirit"
    },
    {
      name: "The Fallen Kingdom",
      story: "Master your new power and face the fallen kingdom.",
      sky: "#38202c", ground: "#35202a", accent: "#c54a57",
      enemies: 8, type: "knight"
    },
    {
      name: "The Purple King's Domain",
      story: "Defeat the Purple King and end the darkness.",
      sky: "#29153d", ground: "#281c35", accent: "#b34bff",
      enemies: 1, type: "boss"
    }
  ];

  const difficulty = {
    easy:   { enemyHealth: 0.7, damage: 0.6, playerHealth: 150 },
    medium: { enemyHealth: 1.0, damage: 1.0, playerHealth: 110 },
    hard:   { enemyHealth: 1.35, damage: 1.5, playerHealth: 100 },
    extreme:{ enemyHealth: 1.8, damage: 2.1, playerHealth: 90 }
  };

  // ---------------- GAME STATE ----------------

  let running = false;
  let gameOver = false;
  let victory = false;
  let chapterCleared = false;
  let chapter = 0;
  let player;
  let enemies = [];
  let projectiles = [];
  let effects = [];
  let keys = {};
  let lastTime = 0;
  let elapsed = 0;
  let screenShake = 0;
  let message = "";
  let messageTimer = 0;
  let cutscene = null;
  let takeoverComplete = false;
  let boss = null;
  let difficultySettings = difficulty.medium;

  const W = canvas.width;
  const H = canvas.height;

  const rand = (min, max) => Math.random() * (max - min) + min;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function newPlayer() {
    return {
      x: 120, y: 350, w: 28, h: 40,
      speed: 190,
      hp: difficultySettings.playerHealth,
      maxHp: difficultySettings.playerHealth,
      facing: 1,
      attackCooldown: 0,
      skillCooldown: 0,
      divergentCooldown: 0,
      arrowCooldown: 0,
      invulnerable: 0,
      moving: false,
      anim: 0
    };
  }

  function showMessage(text, seconds = 2.5) {
    message = text;
    messageTimer = seconds;
  }

  function updateLabels() {
    const data = chapters[chapter];
    chapterLabel.textContent =
      `Chapter ${chapter + 1}/8 — ${data.name}`;

    if (chapter < 5) {
      movesLabel.textContent =
        "Sword: Space/J/Click | Water Wheel: M | Flame Arrow: K";
    } else {
      movesLabel.textContent =
        "Black Dragon Armor | Black Flash: M | Divergent Fist: N | Flame Arrow: K";
    }

    if (gameOver) statusLabel.textContent = "You have fallen. Restart to try again.";
    else if (victory) statusLabel.textContent = "The darkness has been defeated!";
    else if (cutscene) statusLabel.textContent = "The Black Spirit is taking over...";
    else if (chapterCleared) statusLabel.textContent =
      "Chapter cleared! Press Continue to enter the next chapter.";
    else statusLabel.textContent =
      `${data.story} Enemies remaining: ${enemies.filter(e => e.hp > 0).length}`;
  }

  // ---------------- ENEMIES ----------------

  function makeEnemy(type, x, y, hp, size = 28) {
    return {
      type, x, y, w: size, h: size,
      hp, maxHp: hp,
      speed: rand(28, 54),
      damage: 8 * difficultySettings.damage,
      attackTimer: rand(0.4, 1.8),
      flash: 0,
      alive: true,
      phase: rand(0, 6),
      cooldown: rand(0.5, 2),
      vx: 0
    };
  }

  function spawnChapterEnemies() {
    enemies = [];
    projectiles = [];
    effects = [];
    boss = null;

    const data = chapters[chapter];

    if (data.type === "boss") {
      boss = makeEnemy("boss", 710, 300,
        550 * difficultySettings.enemyHealth, 82);
      boss.w = 82;
      boss.h = 92;
      boss.speed = 42;
      boss.damage = 17 * difficultySettings.damage;
      enemies.push(boss);
      return;
    }

    for (let i = 0; i < data.enemies; i++) {
      const x = rand(340, 870);
      const y = rand(290, 430);
      let hp = rand(30, 45) * difficultySettings.enemyHealth;
      let size = 28;

      if (data.type === "knight" || data.type === "spirit") {
        hp *= 1.35;
        size = 34;
      }

      enemies.push(makeEnemy(data.type, x, y, hp, size));
    }
  }

  // ---------------- START / CHAPTER PROGRESSION ----------------

  function startGame() {
    if (gameOver || victory) resetGame();

    running = true;
    gameOver = false;
    victory = false;
    chapterCleared = false;
    cutscene = null;

    startButton.textContent = "Continue to Next Chapter";
    difficultySelect.disabled = true;

    if (chapter === 5 && !takeoverComplete) {
      beginTakeoverCutscene();
    }

    showMessage(chapters[chapter].story, 3);
    updateLabels();
  }

  function resetGame() {
    chapter = 0;
    running = false;
    gameOver = false;
    victory = false;
    chapterCleared = false;
    takeoverComplete = false;
    cutscene = null;
    elapsed = 0;
    screenShake = 0;
    difficultySelect.disabled = false;
    startButton.textContent = "Start Adventure";

    difficultySettings = difficulty[difficultySelect.value] || difficulty.medium;
    player = newPlayer();
    spawnChapterEnemies();
    showMessage("Find the missing villagers.", 3);
    updateLabels();
  }

  function nextChapter() {
    if (!chapterCleared || gameOver || victory) return;

    if (chapter >= chapters.length - 1) {
      victory = true;
      running = false;
      showMessage("You defeated the Purple King!", 8);
      updateLabels();
      return;
    }

    chapter++;
    chapterCleared = false;
    player.x = 100;
    player.y = 350;
    player.hp = Math.min(player.maxHp, player.hp + 25);
    player.invulnerable = 1.5;

    spawnChapterEnemies();

    if (chapter === 5 && !takeoverComplete) {
      beginTakeoverCutscene();
    } else {
      showMessage(`Chapter ${chapter + 1}: ${chapters[chapter].name}`, 3);
    }

    updateLabels();
  }

  function checkChapterClear() {
    if (chapterCleared || gameOver || victory) return;
    if (enemies.some(e => e.hp > 0)) return;

    chapterCleared = true;
    running = false;
    showMessage("All enemies defeated! Continue to the next chapter.", 5);
    startButton.textContent =
      chapter === chapters.length - 1 ? "Finish Game" : "Continue to Next Chapter";
    updateLabels();
  }

  // ---------------- BLACK SPIRIT CUTSCENE ----------------

  function beginTakeoverCutscene() {
    running = false;
    cutscene = {
      time: 0,
      duration: 8.5,
      stage: 0,
      completed: false
    };
    showMessage("Something ancient is waking inside you...", 8);
    screenShake = 4;
    updateLabels();
  }

  function completeTakeover() {
    takeoverComplete = true;
    cutscene = null;
    player.hp = player.maxHp;
    player.invulnerable = 2;
    running = true;
    showMessage("BLACK DRAGON ARMOR AWAKENED!", 4);
    screenShake = 16;
    addBurst(player.x + 12, player.y + 15, "#ff253f", 45, 170);
    addBurst(player.x + 12, player.y + 15, "#111018", 55, 120);
    updateLabels();
  }

  function updateCutscene(dt) {
    if (!cutscene) return;

    cutscene.time += dt;
    const t = cutscene.time;

    if (t < 1.5) cutscene.stage = 0;
    else if (t < 3.1) cutscene.stage = 1;
    else if (t < 5.8) cutscene.stage = 2;
    else if (t < 7.2) cutscene.stage = 3;
    else cutscene.stage = 4;

    if (t > 2.8 && Math.random() < 0.45) {
      addBurst(
        player.x + rand(-30, 30),
        player.y + rand(-30, 30),
        Math.random() < 0.5 ? "#17121e" : "#a91c38",
        2, 55
      );
    }

    if (t > 3 && t < 6.8) screenShake = Math.max(screenShake, 1.8);

    if (t >= cutscene.duration && !cutscene.completed) {
      cutscene.completed = true;
      completeTakeover();
    }
  }

  // ---------------- VISUAL EFFECTS ----------------

  function addBurst(x, y, color, count = 18, power = 100) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(power * 0.25, power);
      effects.push({
        kind: "particle", x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: rand(0.25, 0.85),
        maxLife: 0.85,
        color,
        size: rand(2, 6)
      });
    }
  }

  function addSlash(x, y, facing, color, count = 4) {
    for (let i = 0; i < count; i++) {
      effects.push({
        kind: "slash",
        x: x + facing * rand(0, 25),
        y: y + rand(-20, 20),
        vx: facing * rand(120, 260),
        vy: rand(-150, 150),
        life: rand(0.18, 0.4),
        maxLife: 0.4,
        color,
        size: rand(18, 48)
      });
    }
  }

  function addExplosion(x, y, color, radius, life = 0.5) {
    effects.push({
      kind: "explosion", x, y,
      radius, life, maxLife: life, color
    });
  }

  function updateEffects(dt) {
    for (const e of effects) {
      e.life -= dt;
      if (e.kind === "particle" || e.kind === "slash") {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vy += 60 * dt;
      }
    }
    effects = effects.filter(e => e.life > 0);
    screenShake = Math.max(0, screenShake - dt * 18);
  }

  function drawEffects() {
    for (const e of effects) {
      const alpha = clamp(e.life / e.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;

      if (e.kind === "particle") {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.size, e.size);
      } else if (e.kind === "slash") {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = Math.max(2, e.size / 8);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x - e.size, e.y - e.size * 0.45);
        ctx.stroke();
      } else if (e.kind === "explosion") {
        const progress = 1 - alpha;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4 + alpha * 5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * progress, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.28;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * progress, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // ---------------- PLAYER ATTACKS ----------------

  function damageEnemy(enemy, amount, knockback = 0) {
    if (!enemy || enemy.hp <= 0) return;

    enemy.hp -= amount;
    enemy.flash = 0.15;
    enemy.vx = knockback;

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.alive = false;
      addBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2,
        enemy.type === "boss" ? "#bb55ff" : "#e34b64",
        enemy.type === "boss" ? 60 : 15,
        enemy.type === "boss" ? 190 : 100);
    }

    if (enemy.type === "boss" && enemy.hp <= 0) {
      victory = true;
      running = false;
      chapterCleared = true;
      showMessage("THE PURPLE KING HAS FALLEN!", 8);
    }

    checkChapterClear();
    updateLabels();
  }

  function swordAttack() {
    if (!running || cutscene || gameOver || chapterCleared) return;
    if (player.attackCooldown > 0) return;

    player.attackCooldown = 0.38;
    const px = player.x + player.w / 2 + player.facing * 22;
    const py = player.y + player.h / 2;

    addSlash(px, py, player.facing, "#e8e8f2", 3);

    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const dx = e.x + e.w / 2 - px;
      const dy = e.y + e.h / 2 - py;

      if (Math.abs(dx) < 65 && Math.abs(dy) < 48 &&
          Math.sign(dx || player.facing) === player.facing) {
        damageEnemy(e, 16, player.facing * 100);
      }
    }
  }

  function waterWheel() {
    if (!running || cutscene || chapter >= 5 || player.skillCooldown > 0) return;

    player.skillCooldown = 2.3;
    const x = player.x + player.w / 2 + player.facing * 28;
    const y = player.y + player.h / 2;

    addExplosion(x, y, "#48baff", 88, 0.45);
    addSlash(x, y, player.facing, "#70e5ff", 14);
    screenShake = 5;

    for (const e of enemies) {
      if (e.hp <= 0) continue;
      if (Math.abs(e.x - x) < 105 && Math.abs(e.y - y) < 75) {
        damageEnemy(e, 28, player.facing * 180);
      }
    }
  }

  // BLACK FLASH: black slashes with red energy streaks.
  function blackFlash() {
    if (!running || cutscene || !takeoverComplete ||
        player.skillCooldown > 0 || gameOver) return;

    player.skillCooldown = 1.25;
    const x = player.x + player.w / 2 + player.facing * 38;
    const y = player.y + player.h / 2;

    screenShake = 8;
    addSlash(x, y, player.facing, "#07070b", 16);
    addSlash(x, y, player.facing, "#ff173b", 13);
    addBurst(x, y, "#ff233e", 16, 180);
    addExplosion(x, y, "#a30c2d", 62, 0.25);

    // Dash forward.
    player.x = clamp(player.x + player.facing * 38, 0, W - player.w);

    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const dx = e.x + e.w / 2 - x;
      const dy = e.y + e.h / 2 - y;

      if (Math.abs(dx) < 105 && Math.abs(dy) < 68 &&
          Math.sign(dx || player.facing) === player.facing) {
        damageEnemy(e, 38, player.facing * 260);
        addSlash(e.x + e.w / 2, e.y + e.h / 2,
          player.facing, "#ff263f", 7);
      }
    }

    showMessage("BLACK FLASH!", 0.65);
  }

  // DIVERGENT FIST: blue punch, followed by a larger blue explosion.
  function divergentFist() {
    if (!running || cutscene || !takeoverComplete ||
        player.divergentCooldown > 0 || gameOver) return;

    player.divergentCooldown = 3;
    const x = player.x + player.w / 2 + player.facing * 42;
    const y = player.y + player.h / 2;

    screenShake = 5;
    addBurst(x, y, "#42caff", 24, 130);
    addExplosion(x, y, "#3bbcff", 42, 0.25);
    showMessage("DIVERGENT FIST!", 0.8);

    // First impact.
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      if (Math.abs(e.x + e.w / 2 - x) < 80 &&
          Math.abs(e.y + e.h / 2 - y) < 55) {
        damageEnemy(e, 12, player.facing * 140);
      }
    }

    // Second impact, delayed to make the explosion feel distinct.
    window.setTimeout(() => {
      if (gameOver || victory) return;

      addExplosion(x + player.facing * 18, y, "#1788ff", 125, 0.55);
      addBurst(x + player.facing * 18, y, "#70ddff", 38, 220);
      addBurst(x + player.facing * 18, y, "#187aff", 28, 160);

      for (const e of enemies) {
        if (e.hp <= 0) continue;
        if (Math.abs(e.x + e.w / 2 - x) < 145 &&
            Math.abs(e.y + e.h / 2 - y) < 100) {
          damageEnemy(e, 28, player.facing * 240);
        }
      }
      screenShake = 8;
    }, 190);
  }

  function flameArrow() {
    if (!running || cutscene || gameOver || player.arrowCooldown > 0) return;

    player.arrowCooldown = 1.15;
    projectiles.push({
      x: player.x + player.w / 2 + player.facing * 15,
      y: player.y + 18,
      vx: player.facing * 360,
      vy: 0,
      life: 1.6,
      damage: 22,
      color: "#ff7733"
    });

    addBurst(player.x + player.w / 2, player.y + 18, "#ff7b35", 8, 60);
  }

  // ---------------- ENEMY AI ----------------

  function enemyAttack(e) {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const ex = e.x + e.w / 2;
    const ey = e.y + e.h / 2;

    if (e.type === "boss") {
      const choice = Math.random();

      if (choice < 0.38) {
        // Purple toxic mist.
        projectiles.push({
          x: ex, y: ey,
          vx: (px - ex) * 0.42,
          vy: (py - ey) * 0.42,
          life: 2.2,
          damage: 15 * difficultySettings.damage,
          color: "#bd35ff",
          radius: 22,
          toxic: true
        });
        showMessage("The Purple King releases toxic mist!", 1.2);
      } else if (choice < 0.7) {
        // Heavy ground slam.
        addExplosion(ex, ey, "#c64cff", 150, 0.55);
        screenShake = 11;

        if (Math.abs(px - ex) < 180 && Math.abs(py - ey) < 115) {
          hurtPlayer(e.damage * 1.5);
        }
      } else {
        // Fast charge.
        e.vx = Math.sign(px - ex) * 360;
        addBurst(ex, ey, "#7d20ba", 18, 120);
      }
      return;
    }

    if (Math.abs(px - ex) < 46 && Math.abs(py - ey) < 45) {
      hurtPlayer(e.damage);
      addBurst(px, py, "#e34b64", 5, 55);
    } else if (e.type === "spirit" && Math.random() < 0.55) {
      projectiles.push({
        x: ex, y: ey,
        vx: Math.sign(px - ex) * 145,
        vy: Math.sign(py - ey) * 55,
        life: 2,
        damage: e.damage,
        color: "#a94aff",
        radius: 7
      });
    }
  }

  function hurtPlayer(amount) {
    if (player.invulnerable > 0 || gameOver || cutscene) return;

    player.hp -= amount;
    player.invulnerable = 0.75;
    screenShake = 4;

    if (player.hp <= 0) {
      player.hp = 0;
      gameOver = true;
      running = false;
      showMessage("You have fallen into darkness.", 8);
    }

    updateLabels();
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      if (e.hp <= 0) continue;

      e.flash = Math.max(0, e.flash - dt);
      e.attackTimer -= dt;
      e.cooldown -= dt;

      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      const ex = e.x + e.w / 2;
      const ey = e.y + e.h / 2;

      const dx = px - ex;
      const dy = py - ey;
      const distance = Math.hypot(dx, dy) || 1;

      if (e.type === "boss") {
        e.phase += dt;

        if (e.vx) {
          e.x += e.vx * dt;
          e.vx *= Math.pow(0.04, dt);
          if (Math.abs(e.vx) < 12) e.vx = 0;
        } else if (distance > 120) {
          e.x += dx / distance * e.speed * dt;
          e.y += dy / distance * e.speed * dt;
        }

        e.y += Math.sin(e.phase * 2.2) * 10 * dt;

        if (e.attackTimer <= 0) {
          enemyAttack(e);
          e.attackTimer = rand(1.0, 1.9);
        }
      } else {
        if (distance > 34) {
          e.x += dx / distance * e.speed * dt;
          e.y += dy / distance * e.speed * dt;
        }

        if (e.attackTimer <= 0) {
          enemyAttack(e);
          e.attackTimer = rand(0.8, 1.8);
        }
      }

      e.x = clamp(e.x, 0, W - e.w);
      e.y = clamp(e.y, 265, H - e.h);
    }
  }

  function updateProjectiles(dt) {
    for (const p of projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.color === "#ff7733") {
        for (const e of enemies) {
          if (e.hp <= 0) continue;
          if (Math.abs(e.x + e.w / 2 - p.x) < e.w / 2 + 10 &&
              Math.abs(e.y + e.h / 2 - p.y) < e.h / 2 + 10) {
            damageEnemy(e, p.damage, player.facing * 100);
            p.life = 0;
            addBurst(p.x, p.y, "#ff963d", 12, 90);
            break;
          }
        }
      } else {
        if (Math.hypot(
          player.x + player.w / 2 - p.x,
          player.y + player.h / 2 - p.y
        ) < (p.radius || 10) + 12) {
          hurtPlayer(p.damage);
          p.life = 0;
        }
      }
    }

    projectiles = projectiles.filter(p => p.life > 0);
  }

  // ---------------- DRAW BACKGROUNDS ----------------

  function drawBackground() {
    const data = chapters[chapter];

    ctx.fillStyle = data.sky;
    ctx.fillRect(0, 0, W, H);

    // Distant mountains or hills.
    ctx.fillStyle = "rgba(10,10,20,0.22)";
    for (let i = 0; i < 8; i++) {
      const x = i * 145 - 30;
      ctx.beginPath();
      ctx.moveTo(x, 310);
      ctx.lineTo(x + 65, 170 + (i % 3) * 25);
      ctx.lineTo(x + 150, 310);
      ctx.fill();
    }

    ctx.fillStyle = data.ground;
    ctx.fillRect(0, 280, W, H - 280);

    // Ground tiles.
    for (let x = 0; x < W; x += 32) {
      ctx.fillStyle = x % 64 === 0
        ? "rgba(0,0,0,0.10)"
        : "rgba(255,255,255,0.035)";
      ctx.fillRect(x, 280 + (x % 3) * 4, 30, 18);
    }

    if (chapter === 0) {
      // Forest trees.
      for (let x = 35; x < W; x += 145) {
        ctx.fillStyle = "#543c2c";
        ctx.fillRect(x + 23, 190, 18, 100);
        ctx.fillStyle = "#244b36";
        ctx.fillRect(x, 165, 65, 65);
        ctx.fillStyle = "#356746";
        ctx.fillRect(x + 10, 145, 45, 45);
        ctx.fillStyle = "#548753";
        ctx.fillRect(x + 22, 130, 22, 28);
      }
    } else if (chapter === 1) {
      // Snowy mountains.
      ctx.fillStyle = "#edf6ff";
      for (let x = 0; x < W; x += 170) {
        ctx.beginPath();
        ctx.moveTo(x, 300);
        ctx.lineTo(x + 85, 155);
        ctx.lineTo(x + 170, 300);
        ctx.fill();
      }
    } else if (chapter === 2) {
      // Desert cacti and dunes.
      ctx.fillStyle = "#e9b765";
      ctx.beginPath();
      ctx.ellipse(250, 315, 260, 55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(750, 320, 300, 65, 0, 0, Math.PI * 2);
      ctx.fill();

      for (const x of [120, 440, 820]) {
        ctx.fillStyle = "#497348";
        ctx.fillRect(x, 225, 15, 70);
        ctx.fillRect(x - 12, 245, 12, 9);
        ctx.fillRect(x - 12, 236, 8, 16);
      }
    } else if (chapter >= 3) {
      // Underground ruins.
      for (let x = 25; x < W; x += 120) {
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.fillRect(x, 180, 30, 115);
        ctx.fillRect(x - 10, 175, 50, 14);
        ctx.fillStyle = "rgba(170,90,220,0.16)";
        ctx.fillRect(x + 7, 205, 5, 55);
      }
    }

    // Chapter 6 and beyond: dark red atmosphere.
    if (chapter >= 5) {
      ctx.fillStyle = "rgba(20,0,12,0.25)";
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < 14; i++) {
        const x = (i * 91 + elapsed * (12 + i % 4)) % W;
        const y = (i * 53 + Math.sin(elapsed + i) * 15) % 290;
        ctx.fillStyle = i % 2 ? "rgba(255,30,60,0.3)" : "rgba(0,0,0,0.35)";
        ctx.fillRect(x, y, 3, 3);
      }
    }
  }

  // ---------------- DRAW CHARACTERS ----------------

  function drawHealthBar(x, y, width, hp, maxHp, color = "#ff5267") {
    ctx.fillStyle = "#17151d";
    ctx.fillRect(x, y, width, 6);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * clamp(hp / maxHp, 0, 1), 6);
    ctx.strokeStyle = "#050508";
    ctx.strokeRect(x, y, width, 6);
  }

  function drawPlayer() {
    const p = player;
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const moving = p.moving;
    const bob = moving ? Math.sin(p.anim * 13) * 2 : 0;

    ctx.save();

    if (p.invulnerable > 0 && Math.floor(elapsed * 16) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    // Shadow under feet.
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x - 4, y + 36, 36, 8);

    if (takeoverComplete) {
      drawBlackDragonArmor(x, y + bob);
    } else {
      // Original adventurer.
      ctx.fillStyle = "#342a42";
      ctx.fillRect(x + 5, y + 19 + bob, 19, 17);

      ctx.fillStyle = "#51415d";
      ctx.fillRect(x + 7, y + 20 + bob, 15, 5);

      ctx.fillStyle = "#d7ad8c";
      ctx.fillRect(x + 7, y + 2 + bob, 15, 17);

      ctx.fillStyle = "#3b2926";
      ctx.fillRect(x + 5, y + bob, 19, 8);
      ctx.fillRect(x + 5, y + 5 + bob, 4, 9);

      ctx.fillStyle = "#f2f2f2";
      ctx.fillRect(x + (p.facing > 0 ? 17 : 8), y + 9 + bob, 4, 3);

      ctx.fillStyle = "#25202b";
      ctx.fillRect(x + 6, y + 34 + bob, 7, 7);
      ctx.fillRect(x + 17, y + 34 + bob, 7, 7);

      ctx.fillStyle = "#6f8a9c";
      ctx.fillRect(x + (p.facing > 0 ? 24 : -3), y + 21 + bob, 8, 4);
    }

    // Sword is visible when swinging.
    if (p.attackCooldown > 0.2) {
      ctx.save();
      ctx.translate(x + p.w / 2, y + 22 + bob);
      ctx.scale(p.facing, 1);
      ctx.rotate(-0.7);
      ctx.fillStyle = takeoverComplete ? "#ff2948" : "#dfe9f0";
      ctx.fillRect(7, -23, 5, 29);
      ctx.fillStyle = "#9b8a70";
      ctx.fillRect(4, 2, 11, 4);
      ctx.restore();
    }

    ctx.restore();
  }

  // Pixel-style black dragon armor, drawn directly on the player.
  function drawBlackDragonArmor(x, y) {
    const pulse = Math.sin(elapsed * 8) * 0.5 + 0.5;

    // Black aura.
    ctx.fillStyle = `rgba(8,3,13,${0.22 + pulse * 0.16})`;
    ctx.fillRect(x - 9, y - 9, 47, 55);

    // Dark cape / wings.
    ctx.fillStyle = "#100d17";
    ctx.fillRect(x - 7, y + 10, 8, 26);
    ctx.fillRect(x + 25, y + 10, 10, 24);
    ctx.fillRect(x - 11, y + 17, 8, 12);
    ctx.fillRect(x + 32, y + 17, 7, 11);

    // Legs and boots.
    ctx.fillStyle = "#111018";
    ctx.fillRect(x + 4, y + 30, 9, 12);
    ctx.fillRect(x + 17, y + 30, 9, 12);
    ctx.fillStyle = "#35303f";
    ctx.fillRect(x + 3, y + 37, 11, 5);
    ctx.fillRect(x + 16, y + 37, 11, 5);

    // Armored body.
    ctx.fillStyle = "#09090e";
    ctx.fillRect(x + 3, y + 12, 24, 21);
    ctx.fillStyle = "#24212e";
    ctx.fillRect(x + 6, y + 14, 18, 14);

    // Dragon scales.
    ctx.fillStyle = "#454050";
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillRect(x + 7 + col * 6, y + 15 + row * 5, 4, 3);
      }
    }

    // Glowing chest mark.
    ctx.fillStyle = "#8e142c";
    ctx.fillRect(x + 12, y + 17, 7, 9);
    ctx.fillStyle = "#ff2848";
    ctx.fillRect(x + 14, y + 19, 3, 5);

    // Shoulder plates.
    ctx.fillStyle = "#0a0910";
    ctx.fillRect(x - 1, y + 12, 11, 10);
    ctx.fillRect(x + 22, y + 12, 11, 10);
    ctx.fillStyle = "#504757";
    ctx.fillRect(x + 1, y + 13, 7, 4);
    ctx.fillRect(x + 24, y + 13, 7, 4);

    // Head and horned helmet.
    ctx.fillStyle = "#15121e";
    ctx.fillRect(x + 5, y + 1, 20, 17);
    ctx.fillStyle = "#393241";
    ctx.fillRect(x + 8, y + 3, 14, 9);

    // Horns.
    ctx.fillStyle = "#07070b";
    ctx.fillRect(x + 3, y - 4, 5, 10);
    ctx.fillRect(x + 23, y - 5, 5, 11);
    ctx.fillStyle = "#777081";
    ctx.fillRect(x + 4, y - 4, 3, 5);
    ctx.fillRect(x + 24, y - 5, 3, 5);

    // Helmet faceplate.
    ctx.fillStyle = "#08070c";
    ctx.fillRect(x + 7, y + 7, 16, 8);

    // Glowing red eyes.
    ctx.fillStyle = "#ff173c";
    ctx.fillRect(x + (player.facing > 0 ? 16 : 9), y + 8, 5, 3);
    ctx.fillStyle = "#ff7386";
    ctx.fillRect(x + (player.facing > 0 ? 17 : 10), y + 8, 2, 1);

    // Forearm armor.
    ctx.fillStyle = "#17131e";
    ctx.fillRect(x - 1, y + 21, 8, 12);
    ctx.fillRect(x + 24, y + 21, 8, 12);
    ctx.fillStyle = "#a91b37";
    ctx.fillRect(x + (player.facing > 0 ? 27 : 1), y + 24, 3, 5);

    // Small red embers.
    if (Math.random() < 0.35) {
      effects.push({
        kind: "particle",
        x: x + rand(0, 28),
        y: y + rand(0, 38),
        vx: rand(-12, 12),
        vy: rand(-35, -8),
        life: 0.4,
        maxLife: 0.4,
        color: "#ed2346",
        size: 2
      });
    }
  }

  function drawEnemy(e) {
    if (e.hp <= 0) return;

    const x = Math.round(e.x);
    const y = Math.round(e.y);
    const bob = Math.sin(elapsed * 4 + e.phase) * 2;

    ctx.save();

    if (e.flash > 0) ctx.globalAlpha = 0.45;

    if (e.type === "boss") {
      // Purple King: large, armored, spiky boss.
      ctx.fillStyle = "rgba(160,35,255,0.16)";
      ctx.fillRect(x - 18, y - 18, e.w + 36, e.h + 35);

      // Feet.
      ctx.fillStyle = "#21122f";
      ctx.fillRect(x + 8, y + e.h - 10, 22, 14);
      ctx.fillRect(x + 52, y + e.h - 10, 22, 14);

      // Body.
      ctx.fillStyle = "#4a2076";
      ctx.fillRect(x + 8, y + 20 + bob, 66, 57);
      ctx.fillStyle = "#7e36b7";
      ctx.fillRect(x + 17, y + 25 + bob, 49, 38);

      // Belly.
      ctx.fillStyle = "#bb82db";
      ctx.fillRect(x + 28, y + 42 + bob, 26, 22);

      // Spikes.
      ctx.fillStyle = "#2a123d";
      ctx.fillRect(x - 3, y + 25, 13, 15);
      ctx.fillRect(x + 72, y + 26, 13, 15);
      ctx.fillRect(x + 14, y + 8, 12, 17);
      ctx.fillRect(x + 32, y + 2, 12, 19);
      ctx.fillRect(x + 50, y + 8, 12, 17);

      // Head and horns.
      ctx.fillStyle = "#572184";
      ctx.fillRect(x + 14, y + 4 + bob, 56, 31);
      ctx.fillStyle = "#34124d";
      ctx.fillRect(x + 10, y - 4 + bob, 15, 19);
      ctx.fillRect(x + 58, y - 4 + bob, 15, 19);

      // Glowing eyes.
      ctx.fillStyle = "#faff4f";
      ctx.fillRect(x + 25, y + 15 + bob, 12, 7);
      ctx.fillRect(x + 49, y + 15 + bob, 12, 7);

      // Mouth.
      ctx.fillStyle = "#160b20";
      ctx.fillRect(x + 30, y + 28 + bob, 25, 6);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + 34, y + 28 + bob, 4, 4);
      ctx.fillRect(x + 47, y + 28 + bob, 4, 4);

      drawHealthBar(x - 5, y - 17, e.w + 10, e.hp, e.maxHp, "#c54bff");
      ctx.fillStyle = "#f2d6ff";
      ctx.font = "bold 13px monospace";
      ctx.fillText("THE PURPLE KING", x - 10, y - 24);
    } else {
      let body = "#639b67";
      let head = "#80c780";

      if (e.type === "ice") { body = "#527eae"; head = "#a9e7ff"; }
      if (e.type === "sand") { body = "#b57a32"; head = "#edbc64"; }
      if (e.type === "shadow" || e.type === "dark") { body = "#30263f"; head = "#6e4b91"; }
      if (e.type === "spirit") { body = "#481b5e"; head = "#b14bdf"; }
      if (e.type === "knight") { body = "#4b313b"; head = "#a34a5c"; }

      // Body and head.
      ctx.fillStyle = body;
      ctx.fillRect(x + 3, y + 11 + bob, e.w - 6, e.h - 10);
      ctx.fillStyle = head;
      ctx.fillRect(x + 2, y + 2 + bob, e.w - 4, 16);

      // Eyes.
      ctx.fillStyle = e.type === "spirit" ? "#ff3a65" : "#f7f5dc";
      ctx.fillRect(x + 7, y + 8 + bob, 4, 4);
      ctx.fillRect(x + e.w - 11, y + 8 + bob, 4, 4);

      // Little feet.
      ctx.fillStyle = "#17131e";
      ctx.fillRect(x + 5, y + e.h - 4 + bob, 7, 6);
      ctx.fillRect(x + e.w - 12, y + e.h - 4 + bob, 7, 6);

      if (e.hp < e.maxHp) {
        drawHealthBar(x, y - 9, e.w, e.hp, e.maxHp);
      }
    }

    ctx.restore();
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      ctx.save();

      if (p.color === "#ff7733") {
        ctx.fillStyle = "#ff7733";
        ctx.fillRect(p.x - 7, p.y - 3, 15, 6);
        ctx.fillStyle = "#ffe18b";
        ctx.fillRect(p.x - 3, p.y - 1, 8, 2);
      } else if (p.toxic) {
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = "#a8ff3d";
        ctx.beginPath();
        ctx.arc(p.x + 4, p.y - 3, (p.radius || 22) * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // ---------------- HUD / OVERLAYS ----------------

  function drawHUD() {
    // Player health.
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(14, 14, 220, 43);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px monospace";
    ctx.fillText(takeoverComplete ? "BLACK DRAGON" : "ADVENTURER", 23, 30);
    drawHealthBar(23, 38, 195, player.hp, player.maxHp,
      takeoverComplete ? "#e51c43" : "#65d975");

    // Chapter / enemies.
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(W - 230, 14, 216, 32);
    ctx.fillStyle = "#f2f2f7";
    ctx.font = "12px monospace";
    ctx.fillText(`CHAPTER ${chapter + 1}/8`, W - 218, 34);

    if (messageTimer > 0 && message) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, messageTimer * 2);
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(100, H - 62, W - 200, 42);
      ctx.strokeStyle = takeoverComplete ? "#b52c4a" : "#72727f";
      ctx.strokeRect(100, H - 62, W - 200, 42);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "center";
      ctx.fillText(message, W / 2, H - 36);
      ctx.textAlign = "left";
      ctx.restore();
    }

    if (chapterCleared && !victory) {
      drawOverlay("CHAPTER CLEARED", "All enemies defeated. Press Continue above.");
    }

    if (gameOver) {
      drawOverlay("YOU HAVE FALLEN", "Press Restart Game to try again.");
    }

    if (victory) {
      drawOverlay("THE DARKNESS IS DEFEATED", "You have completed TheDarkWithin!");
    }
  }

  function drawOverlay(title, subtitle) {
    ctx.fillStyle = "rgba(0,0,0,0.76)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = victory ? "#8dffad" : "#f3f0f7";
    ctx.font = "bold 29px monospace";
    ctx.fillText(title, W / 2, H / 2 - 12);
    ctx.fillStyle = "#d3d0dc";
    ctx.font = "15px monospace";
    ctx.fillText(subtitle, W / 2, H / 2 + 25);
    ctx.textAlign = "left";
  }

  // ---------------- CUTSCENE DRAWING ----------------

  function drawTakeoverCutscene() {
    if (!cutscene) return;

    const t = cutscene.time;
    const darkness = clamp(t / 1.8, 0, 0.94);

    ctx.fillStyle = `rgba(0,0,0,${darkness})`;
    ctx.fillRect(0, 0, W, H);

    // A huge shadow spirit rises behind the player.
    if (t > 1.2) {
      const reveal = clamp((t - 1.2) / 1.8, 0, 1);
      ctx.save();
      ctx.globalAlpha = reveal * 0.92;

      ctx.fillStyle = "#08060d";
      ctx.beginPath();
      ctx.ellipse(480, 260, 90 + reveal * 30, 145 + reveal * 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Spirit horns.
      ctx.fillStyle = "#1b101f";
      ctx.fillRect(410, 90, 25, 100);
      ctx.fillRect(525, 90, 25, 100);

      // Spirit eyes.
      ctx.fillStyle = "#ff173b";
      ctx.fillRect(435, 205, 24, 10);
      ctx.fillRect(495, 205, 24, 10);
      ctx.fillStyle = "#ff7890";
      ctx.fillRect(440, 207, 10, 3);
      ctx.fillRect(500, 207, 10, 3);

      // Black tendrils reaching for the player.
      ctx.strokeStyle = "#17121e";
      ctx.lineWidth = 15;
      for (let i = 0; i < 7; i++) {
        const startX = 420 + i * 20;
        ctx.beginPath();
        ctx.moveTo(startX, 300);
        ctx.quadraticCurveTo(
          250 + i * 55,
          240 + Math.sin(t * 3 + i) * 45,
          player.x + player.w / 2,
          player.y + player.h / 2
        );
        ctx.stroke();
      }

      ctx.restore();
    }

    // Player silhouette gradually changes into armor.
    if (t > 2.4 && t < 7.3) {
      ctx.save();
      ctx.globalAlpha = clamp((t - 2.4) / 2.2, 0, 1);
      drawBlackDragonArmor(player.x, player.y);
      ctx.restore();
    } else if (t <= 2.4) {
      drawPlayer();
    }

    // Screen text by stage.
    let title = "THE WORLD FALLS SILENT";
    let subtitle = "Something is watching you...";

    if (t >= 1.5 && t < 3.1) {
      title = "THE BLACK SPIRIT";
      subtitle = "Your body no longer belongs to you.";
    } else if (t >= 3.1 && t < 5.8) {
      title = "THE TAKEOVER";
      subtitle = "The darkness coils around your soul.";
    } else if (t >= 5.8 && t < 7.3) {
      title = "BLACK DRAGON ARMOR";
      subtitle = "A new power awakens.";
    } else if (t >= 7.3) {
      title = "AWAKEN";
      subtitle = "Black Flash and Divergent Fist unlocked.";
    }

    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(90, 28, W - 180, 65);
    ctx.textAlign = "center";
    ctx.fillStyle = t > 3 ? "#ff4a62" : "#f0edf7";
    ctx.font = "bold 23px monospace";
    ctx.fillText(title, W / 2, 54);
    ctx.fillStyle = "#e5dfe9";
    ctx.font = "13px monospace";
    ctx.fillText(subtitle, W / 2, 77);
    ctx.textAlign = "left";

    // Red flash as the armor locks into place.
    if (t > 6.9 && t < 7.5) {
      const alpha = Math.sin((t - 6.9) / 0.6 * Math.PI) * 0.7;
      ctx.fillStyle = `rgba(255,20,55,${Math.max(0, alpha)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------------- MAIN UPDATE / RENDER ----------------

  function update(dt) {
    elapsed += dt;

    if (messageTimer > 0) messageTimer -= dt;

    if (cutscene) {
      updateCutscene(dt);
      updateEffects(dt);
      return;
    }

    if (!running || gameOver || victory || chapterCleared) {
      updateEffects(dt);
      return;
    }

    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.skillCooldown = Math.max(0, player.skillCooldown - dt);
    player.divergentCooldown = Math.max(0, player.divergentCooldown - dt);
    player.arrowCooldown = Math.max(0, player.arrowCooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);

    let mx = 0;
    let my = 0;

    if (keys.ArrowLeft || keys.a || keys.A) mx--;
    if (keys.ArrowRight || keys.d || keys.D) mx++;
    if (keys.ArrowUp || keys.w || keys.W) my--;
    if (keys.ArrowDown || keys.s || keys.S) my++;

    const length = Math.hypot(mx, my) || 1;
    mx /= length;
    my /= length;

    player.moving = !!(mx || my);
    player.anim += dt;

    if (mx !== 0) player.facing = Math.sign(mx);

    player.x += mx * player.speed * dt;
    player.y += my * player.speed * dt;
    player.x = clamp(player.x, 5, W - player.w - 5);
    player.y = clamp(player.y, 270, H - player.h - 5);

    updateEnemies(dt);
    updateProjectiles(dt);
    updateEffects(dt);
    updateLabels();
  }

  function render() {
    ctx.save();

    if (screenShake > 0) {
      ctx.translate(rand(-screenShake, screenShake), rand(-screenShake, screenShake));
    }

    drawBackground();

    // Draw characters in vertical order for depth.
    const actors = [
      ...enemies.filter(e => e.hp > 0).map(e => ({ y: e.y + e.h, type: "enemy", obj: e })),
      { y: player.y + player.h, type: "player", obj: player }
    ].sort((a, b) => a.y - b.y);

    for (const a of actors) {
      if (a.type === "player") drawPlayer();
      else drawEnemy(a.obj);
    }

    drawProjectiles();
    drawEffects();
    drawHUD();

    if (cutscene) drawTakeoverCutscene();

    ctx.restore();
  }

  function loop(time) {
    const dt = Math.min((time - (lastTime || time)) / 1000, 0.04);
    lastTime = time;

    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // ---------------- CONTROLS ----------------

  window.addEventListener("keydown", event => {
    const key = event.key;

    if ([
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "
    ].includes(key)) {
      event.preventDefault();
    }

    keys[key] = true;

    if (event.repeat) return;

    if (key === " " || key === "j" || key === "J") {
      swordAttack();
    }

    if (key === "m" || key === "M") {
      if (takeoverComplete) blackFlash();
      else waterWheel();
    }

    if (key === "n" || key === "N") {
      divergentFist();
    }

    if (key === "k" || key === "K") {
      flameArrow();
    }
  });

  window.addEventListener("keyup", event => {
    keys[event.key] = false;
  });

  canvas.addEventListener("click", () => {
    swordAttack();
  });

  startButton.addEventListener("click", () => {
    if (victory) {
      resetGame();
      return;
    }

    if (chapterCleared) {
      if (chapter === chapters.length - 1) {
        victory = true;
        running = false;
        showMessage("You defeated the Purple King!", 8);
        updateLabels();
      } else {
        nextChapter();
        startButton.textContent = "Continue to Next Chapter";
      }
      return;
    }

    if (!running && !cutscene && !gameOver) {
      startGame();
    }
  });

  document.getElementById("dwRestart").addEventListener("click", () => {
    resetGame();
    startGame();
  });

  difficultySelect.addEventListener("change", () => {
    if (!difficultySelect.disabled) {
      difficultySettings = difficulty[difficultySelect.value] || difficulty.medium;
      resetGame();
    }
  });

  // ---------------- OPTIONAL EXISTING HTML OVERLAY ----------------
  // If game.html already has a Start Adventure button, connect it too.

  const existingStart = document.getElementById("startBtn");
  if (existingStart) {
    existingStart.addEventListener("click", () => {
      const box = document.getElementById("messageBox");
      if (box) box.style.display = "none";

      if (chapterCleared) {
        nextChapter();
      } else if (!running && !cutscene && !gameOver) {
        startGame();
      }
    });
  }

  // ---------------- INITIALIZE ----------------

  resetGame();
  requestAnimationFrame(loop);

})();
