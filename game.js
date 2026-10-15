
(() => {
  "use strict";

  // THE DARK WITHIN — Chapter Combat System
  // Controls: WASD / arrows = move, Space / click = sword,
  // M = Water Wheel, K = Flame Arrow.

  const oldCanvas = document.querySelector("canvas");
  const canvas = oldCanvas || document.createElement("canvas");

  if (!oldCanvas) document.body.appendChild(canvas);

  canvas.id = "darkWithinCanvas";
  canvas.width = 960;
  canvas.height = 540;
  canvas.style.cssText =
    "display:block;width:100%;max-width:960px;margin:auto;" +
    "background:#101b18;border:2px solid #42634c;image-rendering:pixelated;";

  document.body.style.cssText =
    "margin:0;background:#080c0a;color:#e8f3e7;" +
    "font-family:monospace;text-align:center;";

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // Create our own game interface so this works with existing HTML.
  let ui = document.getElementById("darkWithinUI");
  if (!ui) {
    ui = document.createElement("div");
    ui.id = "darkWithinUI";
    canvas.before(ui);
  }

  ui.style.cssText =
    "max-width:960px;margin:12px auto;padding:12px;" +
    "display:flex;flex-wrap:wrap;justify-content:center;" +
    "align-items:center;gap:10px;background:#101711;" +
    "border:1px solid #36543b;color:#dfffe1;";

  const status = document.createElement("div");
  status.style.cssText = "width:100%;line-height:1.8;";
  ui.appendChild(status);

  const difficultySelect = document.createElement("select");
  difficultySelect.setAttribute("aria-label", "Difficulty");
  difficultySelect.style.cssText =
    "padding:8px;background:#17271b;color:white;border:1px solid #62b66a;";

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
      "padding:9px 13px;background:#192c1d;color:#efffee;" +
      "border:1px solid #58a863;cursor:pointer;font:bold 13px monospace;";
    button.addEventListener("click", callback);
    ui.appendChild(button);
    return button;
  }

  const startButton = makeButton("Start Game", () => {
    if (!started) startGame();
    else if (chapterCleared) nextChapter();
  });

  makeButton("Restart", () => {
    resetGame();
    startGame();
  });

  const hint = document.createElement("div");
  hint.style.cssText =
    "width:100%;font-size:12px;color:#a8c8aa;line-height:1.8;";
  hint.textContent =
    "MOVE: WASD / Arrows  •  SWORD: Space / Click  •  WATER WHEEL: M  •  FLAME ARROW: K";
  ui.appendChild(hint);

  const W = canvas.width;
  const H = canvas.height;
  const keys = new Set();

  const settings = {
    Easy:    { hp: 45, damage: 5,  speed: 35, count: 4 },
    Medium:  { hp: 70, damage: 10, speed: 48, count: 5 },
    Hard:    { hp: 105, damage: 17, speed: 62, count: 7 },
    Extreme: { hp: 160, damage: 27, speed: 78, count: 9 }
  };

  let player, enemies, projectiles, effects;
  let chapter = 1;
  let started = false;
  let gameOver = false;
  let chapterCleared = false;
  let lastTime = 0;
  let attackCooldown = 0;
  let waterCooldown = 0;
  let flameCooldown = 0;
  let hurtCooldown = 0;
  let time = 0;
  let message = "";
  let messageTime = 0;

  function resetGame() {
    chapter = 1;
    started = false;
    gameOver = false;
    chapterCleared = false;
    lastTime = 0;
    keys.clear();
    difficultySelect.disabled = false;
    startButton.textContent = "Start Game";
    createChapter();
    draw();
    updateStatus();
  }

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
    chapterCleared = false;
    gameOver = false;
    attackCooldown = 0;
    waterCooldown = 0;
    flameCooldown = 0;
    hurtCooldown = 0;

    // More enemies in later chapters; difficulty also increases toughness.
    const count = mode.count + Math.min(chapter - 1, 6);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 130 + Math.random() * 190;
      const x = Math.max(35, Math.min(W - 35,
        player.x + Math.cos(angle) * distance));
      const y = Math.max(65, Math.min(H - 35,
        player.y + Math.sin(angle) * distance));

      enemies.push({
        x, y,
        r: 12 + Math.random() * 4,
        hp: mode.hp + (chapter - 1) * 12,
        maxHp: mode.hp + (chapter - 1) * 12,
        damage: mode.damage + Math.floor((chapter - 1) * 1.5),
        speed: mode.speed + Math.min((chapter - 1) * 2, 20),
        phase: Math.random() * 10,
        flash: 0,
        attack: 0,
        knockX: 0,
        knockY: 0,
        alive: true,
        kind: i % 3
      });
    }

    message = "CHAPTER " + chapter + " — DEFEAT EVERY MONSTER!";
    messageTime = 3.5;
  }

  function startGame() {
    started = true;
   document.getElementById("messageBox")?.style.setProperty("display", "none");
    gameOver = false;
    chapterCleared = false;
    difficultySelect.disabled = true;
    startButton.textContent = "Continue to Next Chapter";
    messageTime = 3;
    lastTime = 0;
    updateStatus();
  }

  function nextChapter() {
    if (!chapterCleared || gameOver) return;
    chapter++;
    createChapter();
    startGame();
  }

  function updateStatus() {
    if (!player) return;
    const remaining = enemies.filter(e => e.alive).length;
    status.innerHTML =
      "<strong>THE DARK WITHIN</strong> &nbsp; | &nbsp;" +
      "Chapter " + chapter + " &nbsp; | &nbsp;" +
      difficultySelect.value + " &nbsp; | &nbsp;" +
      "Health: " + Math.ceil(player.hp) + "/" + player.maxHp +
      " &nbsp; | &nbsp; Monsters: " + remaining +
      (chapterCleared ? " &nbsp; | &nbsp; CHAPTER CLEARED!" : "") +
      (gameOver ? " &nbsp; | &nbsp; YOU DIED — RESTART" : "");
    startButton.disabled = !chapterCleared || gameOver;
    startButton.style.opacity = startButton.disabled ? "0.5" : "1";
    if (!started && !gameOver) startButton.disabled = false;
  }

  function addEffect(x, y, color, radius, duration, type = "burst") {
    effects.push({ x, y, color, radius, duration, maxDuration: duration, type });
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
    addEffect(enemy.x, enemy.y, "#eaffb0", 18, 0.2);

    if (enemy.hp <= 0) {
      enemy.alive = false;
      addEffect(enemy.x, enemy.y, "#a5e86d", 30, 0.55);
      for (let i = 0; i < 7; i++) {
        addEffect(enemy.x + (Math.random() - .5) * 20,
          enemy.y + (Math.random() - .5) * 20,
          ["#a5e86d", "#e9ffc2", "#548b56"][i % 3],
          3 + Math.random() * 4, 0.45, "particle");
      }
    }

    checkChapterClear();
  }

  function checkChapterClear() {
    if (enemies.every(e => !e.alive) && !chapterCleared) {
      chapterCleared = true;
      message = "ALL MONSTERS DEFEATED! CHAPTER CLEARED!";
      messageTime = 999;
      addEffect(W / 2, H / 2, "#baffc0", 150, 1.3);
      updateStatus();
    }
  }

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
      if (distance > 66) continue;
      const dot = (dx * player.faceX + dy * player.faceY) / (distance || 1);
      if (dot > -0.15) damageEnemy(e, 30, 175);
    }
  }

  function waterWheel() {
    if (!started || gameOver || chapterCleared || waterCooldown > 0) return;
    waterCooldown = 3.0;
    addEffect(player.x, player.y, "#48cfff", 105, 0.65, "water");
    addEffect(player.x, player.y, "#b7f4ff", 70, 0.55, "water");

    for (const e of enemies) {
      if (e.alive && Math.hypot(e.x - player.x, e.y - player.y) < 112) {
        damageEnemy(e, 42, 230);
      }
    }
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

    addEffect(player.x + player.faceX * 20,
      player.y + player.faceY * 20, "#ff9b36", 18, 0.25);
  }

  function hurtPlayer(amount) {
    if (hurtCooldown > 0 || gameOver || chapterCleared) return;
    player.hp -= amount;
    player.flash = 0.22;
    hurtCooldown = 0.65;
    addEffect(player.x, player.y, "#ff5656", 23, 0.3);
    if (player.hp <= 0) {
      player.hp = 0;
      gameOver = true;
      started = false;
      message = "YOU DIED — PRESS RESTART";
      messageTime = 999;
      updateStatus();
    }
  }

  function update(dt) {
    if (!started || gameOver || chapterCleared) return;

    time += dt;
    attackCooldown = Math.max(0, attackCooldown - dt);
    waterCooldown = Math.max(0, waterCooldown - dt);
    flameCooldown = Math.max(0, flameCooldown - dt);
    hurtCooldown = Math.max(0, hurtCooldown - dt);
    player.flash = Math.max(0, player.flash - dt);
    player.walk += dt * 11;
    messageTime = Math.max(0, messageTime - dt);

    let mx = 0, my = 0;
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

      if (distance > 25) {
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

    for (const p of projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      addEffect(p.x, p.y, "#ff7b24", 5, 0.15, "particle");

      for (const e of enemies) {
        if (e.alive && Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r + 5) {
          damageEnemy(e, 48, 145);
          addEffect(p.x, p.y, "#ffb83d", 32, 0.35);
          p.life = 0;
          break;
        }
      }
    }

    projectiles = projectiles.filter(p =>
      p.life > 0 && p.x > -30 && p.x < W + 30 && p.y > -30 && p.y < H + 30
    );

    for (const fx of effects) fx.duration -= dt;
    effects = effects.filter(fx => fx.duration > 0);

    updateStatus();
  }

  function drawBackground() {
    ctx.fillStyle = "#101b18";
    ctx.fillRect(0, 0, W, H);

    // Forest floor tiles
    for (let y = 0; y < H; y += 32) {
      for (let x = 0; x < W; x += 32) {
        const n = ((x * 13 + y * 7) % 11);
        ctx.fillStyle = n < 3 ? "#14231b" : "#17251b";
        ctx.fillRect(x, y, 31, 31);

        if (n === 2) {
          ctx.fillStyle = "#29412a";
          ctx.fillRect(x + 7, y + 12, 3, 3);
          ctx.fillRect(x + 23, y + 25, 2, 2);
        }

        if (n === 7) {
          ctx.fillStyle = "#263c29";
          ctx.fillRect(x + 12, y + 7, 5, 2);
          ctx.fillRect(x + 14, y + 9, 2, 5);
        }
      }
    }

    // Forest edges and small plants
    ctx.fillStyle = "#0a110d";
    ctx.fillRect(0, 0, W, 28);
    ctx.fillRect(0, H - 8, W, 8);

    for (let i = 0; i < 24; i++) {
      const x = (i * 173 + 41) % W;
      const y = (i * 89 + 67) % H;
      ctx.fillStyle = "#315336";
      ctx.fillRect(x, y, 5, 8);
      ctx.fillRect(x - 3, y + 3, 3, 3);
      ctx.fillRect(x + 5, y + 2, 3, 3);
    }

    // Exit gate, remains locked until the chapter is cleared
    ctx.fillStyle = chapterCleared ? "#79e6a1" : "#38483a";
    ctx.fillRect(W - 45, H / 2 - 32, 27, 64);
    ctx.fillStyle = "#101711";
    ctx.fillRect(W - 39, H / 2 - 25, 15, 53);
    ctx.fillStyle = chapterCleared ? "#d6ffbd" : "#657366";
    ctx.fillRect(W - 34, H / 2 - 19, 5, 4);
    ctx.fillStyle = "#e2f6d8";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText(chapterCleared ? "EXIT OPEN" : "LOCKED", W - 14, H / 2 + 43);
    ctx.textAlign = "left";
  }

  function drawPlayer() {
    const moving = keys.has("w") || keys.has("a") ||
      keys.has("s") || keys.has("d") ||
      keys.has("arrowup") || keys.has("arrowdown") ||
      keys.has("arrowleft") || keys.has("arrowright");
    const bob = moving ? Math.sin(player.walk) * 2 : 0;
    const x = Math.round(player.x);
    const y = Math.round(player.y + bob);

    // Shadow
    ctx.fillStyle = "#080c09";
    ctx.fillRect(x - 11, y + 8, 22, 5);

    // Boots
    ctx.fillStyle = "#50382b";
    ctx.fillRect(x - 9, y + 3, 7, 8);
    ctx.fillRect(x + 2, y + 3, 7, 8);

    // Body and clothes
    ctx.fillStyle = player.flash > 0 ? "#ffffff" : "#315c49";
    ctx.fillRect(x - 10, y - 9, 20, 17);
    ctx.fillStyle = "#203e31";
    ctx.fillRect(x - 9, y + 2, 18, 4);

    // Head and hair
    ctx.fillStyle = "#e9b78a";
    ctx.fillRect(x - 8, y - 22, 16, 14);
    ctx.fillStyle = "#34281f";
    ctx.fillRect(x - 9, y - 24, 18, 6);
    ctx.fillRect(x - 9, y - 20, 4, 7);

    // Eyes face toward direction of movement/attack
    ctx.fillStyle = "#171b17";
    ctx.fillRect(x + (player.faceX >= 0 ? 3 : -6), y - 17, 3, 3);

    // Sword
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

    // Health bar above player
    ctx.fillStyle = "#080c09";
    ctx.fillRect(x - 19, y - 34, 38, 5);
    ctx.fillStyle = "#72df78";
    ctx.fillRect(x - 18, y - 33, 36 * player.hp / player.maxHp, 3);
  }

  function drawEnemy(e) {
    const x = Math.round(e.x);
    const y = Math.round(e.y + Math.sin(e.phase) * 2);
    const color = e.kind === 0 ? "#76b74f" :
                  e.kind === 1 ? "#9a6bb9" : "#b56d43";
    const dark = e.kind === 0 ? "#365d2e" :
                 e.kind === 1 ? "#553969" : "#6b3a29";

    // Shadow
    ctx.fillStyle = "#0b100c";
    ctx.fillRect(x - 14, y + 10, 28, 5);

    // Blob body with pixel-art shape
    ctx.fillStyle = e.flash > 0 ? "#ffffff" : color;
    ctx.fillRect(x - 12, y - 7, 24, 14);
    ctx.fillRect(x - 8, y - 12, 16, 5);
    ctx.fillRect(x - 15, y - 2, 3, 8);
    ctx.fillRect(x + 12, y - 2, 3, 8);

    // Face and expressive eyes
    ctx.fillStyle = dark;
    ctx.fillRect(x - 8, y + 4, 16, 4);
    ctx.fillStyle = "#f8f5d7";
    ctx.fillRect(x - 7, y - 4, 5, 5);
    ctx.fillRect(x + 2, y - 4, 5, 5);
    ctx.fillStyle = "#171817";
    ctx.fillRect(x - 5, y - 3, 2, 3);
    ctx.fillRect(x + 4, y - 3, 2, 3);

    // Decorative horns for tougher-looking creatures
    if (e.kind === 2) {
      ctx.fillStyle = "#e2c28c";
      ctx.fillRect(x - 11, y - 15, 4, 7);
      ctx.fillRect(x + 7, y - 15, 4, 7);
    }

    // Enemy health bar
    ctx.fillStyle = "#080c09";
    ctx.fillRect(x - 17, y - 23, 34, 5);
    ctx.fillStyle = e.hp / e.maxHp < .3 ? "#ff4d4d" : "#e8a65a";
    ctx.fillRect(x - 16, y - 22, 32 * Math.max(0, e.hp) / e.maxHp, 3);
  }

  function drawEffects() {
    for (const fx of effects) {
      const progress = 1 - fx.duration / fx.maxDuration;
      const r = fx.radius * (fx.type === "particle" ? 1 : 0.5 + progress);

      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = fx.color;
      ctx.fillStyle = fx.color;
      ctx.lineWidth = fx.type === "water" ? 4 : 3;

      if (fx.type === "water") {
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, progress * Math.PI * 2,
          progress * Math.PI * 2 + Math.PI * 1.45);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r * .7, -progress * Math.PI * 2,
          -progress * Math.PI * 2 + Math.PI * 1.35);
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

      // Flaming arrow with glowing tail
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

  function drawOverlay() {
    if (!started && !gameOver && !chapterCleared) {
      ctx.fillStyle = "rgba(0,0,0,.65)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#d7f6c8";
      ctx.font = "bold 31px monospace";
      ctx.fillText("THE DARK WITHIN", W / 2, H / 2 - 55);
      ctx.font = "16px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Choose a difficulty and press Start Game", W / 2, H / 2 - 10);
      ctx.fillText("Defeat every monster to unlock the exit", W / 2, H / 2 + 20);
      ctx.textAlign = "left";
    }

    if (chapterCleared) {
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#baffc0";
      ctx.font = "bold 28px monospace";
      ctx.fillText("CHAPTER " + chapter + " CLEARED!", W / 2, H / 2 - 20);
      ctx.font = "15px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Every monster has been defeated.", W / 2, H / 2 + 12);
      ctx.fillText("Press Continue to Next Chapter above.", W / 2, H / 2 + 40);
      ctx.textAlign = "left";
    }

    if (gameOver) {
      ctx.fillStyle = "rgba(30,0,0,.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff8585";
      ctx.font = "bold 34px monospace";
      ctx.fillText("YOU DIED", W / 2, H / 2);
      ctx.font = "16px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Press Restart to try again.", W / 2, H / 2 + 35);
      ctx.textAlign = "left";
    }

    if (messageTime > 0 && started && !chapterCleared && !gameOver) {
      ctx.textAlign = "center";
      ctx.font = "bold 17px monospace";
      ctx.fillStyle = "#e5ffce";
      ctx.fillText(message, W / 2, 45);
      ctx.textAlign = "left";
    }
  }

  function draw() {
    drawBackground();

    // Draw enemies before player so the player is visible in front.
    for (const e of enemies) {
      if (e.alive) drawEnemy(e);
    }

    drawEffects();
    drawProjectiles();
    if (player) drawPlayer();
    drawOverlay();

    // Cooldown indicators
    ctx.font = "12px monospace";
    ctx.fillStyle = waterCooldown <= 0 ? "#8fe6ff" : "#657b7c";
    ctx.fillText(
      waterCooldown <= 0 ? "M: WATER WHEEL READY" :
        "M: WATER " + waterCooldown.toFixed(1) + "s",
      15, H - 28
    );
    ctx.fillStyle = flameCooldown <= 0 ? "#ffb05c" : "#8d7764";
    ctx.fillText(
      flameCooldown <= 0 ? "K: FLAME ARROW READY" :
        "K: FLAME " + flameCooldown.toFixed(1) + "s",
      15, H - 12
    );
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.04);
    lastTime = timestamp;

    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
      .includes(key)) e.preventDefault();

    keys.add(key);

    if (e.repeat) return;
    if (key === " " || key === "j") swordAttack();
    if (key === "m") waterWheel();
    if (key === "k") flameArrow();
  });

  window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => keys.clear());

  canvas.addEventListener("click", () => swordAttack());

  // Allow mobile users to tap attack buttons too.
  makeButton("⚔ Sword", swordAttack);
  makeButton("💧 Water Wheel", waterWheel);
  makeButton("🔥 Flame Arrow", flameArrow);

  resetGame();
  requestAnimationFrame(loop);
})();
