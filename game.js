
(() => {
  "use strict";

  // THE DARK WITHIN
  // Move: WASD / Arrow keys
  // Sword: Space / J / Click
  // Water Wheel: M
  // Flame Arrow: K

  const canvas = document.querySelector("canvas") || document.createElement("canvas");
  if (!canvas.isConnected) document.body.appendChild(canvas);

  canvas.id = "darkWithinCanvas";
  canvas.width = 960;
  canvas.height = 540;
  canvas.style.cssText =
    "display:block;width:100%;max-width:960px;height:auto;margin:auto;" +
    "background:#101b18;border:2px solid #42634c;image-rendering:pixelated;";

  document.body.style.background = "#080c0a";
  document.body.style.color = "#e8f3e7";
  document.body.style.fontFamily = "monospace";

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const $ = id => document.getElementById(id);
  const messageBox = $("messageBox");
  const startBtn = $("startBtn");

  // Game interface
  let ui = $("darkWithinUI");
  if (!ui) {
    ui = document.createElement("div");
    ui.id = "darkWithinUI";
    canvas.before(ui);
  }

  ui.style.cssText =
    "max-width:960px;margin:12px auto;padding:12px;display:flex;" +
    "flex-wrap:wrap;justify-content:center;align-items:center;gap:10px;" +
    "background:#101711;border:1px solid #36543b;color:#dfffe1;";

  const status = document.createElement("div");
  status.style.cssText = "width:100%;text-align:center;line-height:1.8;";
  ui.appendChild(status);

  const difficulty = document.createElement("select");
  difficulty.setAttribute("aria-label", "Difficulty");
  difficulty.style.cssText =
    "padding:8px;background:#17271b;color:white;border:1px solid #62b66a;";

  ["Easy", "Medium", "Hard", "Extreme"].forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name + " Mode";
    difficulty.appendChild(option);
  });
  ui.appendChild(difficulty);

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

  const gameButton = makeButton("Start Game", () => {
    if (gameOver) {
      resetGame();
      startGame();
    } else if (chapterCleared) {
      nextChapter();
    } else if (!started) {
      startGame();
    }
  });

  makeButton("Restart", () => {
    resetGame();
    startGame();
  });

  const hint = document.createElement("div");
  hint.style.cssText = "width:100%;font-size:12px;text-align:center;color:#a8c8aa;";
  hint.textContent =
    "MOVE: WASD / Arrows  •  SWORD: Space / Click  •  WATER WHEEL: M  •  FLAME ARROW: K";
  ui.appendChild(hint);

  makeButton("⚔ Sword", swordAttack);
  makeButton("💧 Water Wheel", waterWheel);
  makeButton("🔥 Flame Arrow", flameArrow);

  const W = canvas.width;
  const H = canvas.height;
  const keys = new Set();

  // Eight chapters with distinct background styles.
  const chapters = [
    { name: "The Forgotten Forest", ground: "#17251b", detail: "#315336", type: 0 },
    { name: "The Abandoned Camp", ground: "#352b20", detail: "#80613d", type: 1 },
    { name: "The Frozen Ruins", ground: "#182c38", detail: "#6197a8", type: 2 },
    { name: "The Haunted Swamp", ground: "#172e27", detail: "#477d58", type: 3 },
    { name: "The Crystal Cavern", ground: "#251c39", detail: "#9168c4", type: 4 },
    { name: "The Burning Wastes", ground: "#3b2019", detail: "#b85b35", type: 5 },
    { name: "The Shadow Fortress", ground: "#191a25", detail: "#65627f", type: 6 },
    { name: "The Evil One's Lair", ground: "#300f18", detail: "#b6384b", type: 7 }
  ];

  const settings = {
    Easy:    { hp: 35, damage: 4, speed: 32, count: 3 },
    Medium:  { hp: 55, damage: 7, speed: 42, count: 4 },
    Hard:    { hp: 80, damage: 11, speed: 54, count: 5 },
    Extreme: { hp: 110, damage: 16, speed: 65, count: 7 }
  };

  let player, enemies, projectiles, effects;
  let chapter = 0;
  let started = false;
  let gameOver = false;
  let chapterCleared = false;
  let gameWon = false;
  let lastTime = 0;
  let attackCooldown = 0;
  let waterCooldown = 0;
  let flameCooldown = 0;
  let hurtCooldown = 0;
  let message = "";
  let messageTime = 0;

  function resetGame() {
    chapter = 0;
    started = false;
    gameOver = false;
    chapterCleared = false;
    gameWon = false;
    keys.clear();
    difficulty.disabled = false;
    gameButton.textContent = "Start Game";
    createChapter();
    if (messageBox) messageBox.style.display = "";
    updateStatus();
    draw();
  }

  function createChapter() {
    const mode = settings[difficulty.value] || settings.Medium;

    player = {
      x: W / 2, y: H / 2, r: 12,
      hp: 100, maxHp: 100,
      faceX: 1, faceY: 0, speed: 185, flash: 0
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

    const count = mode.count + Math.floor(chapter / 2);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 180;
      enemies.push({
        x: Math.max(35, Math.min(W - 35, player.x + Math.cos(angle) * distance)),
        y: Math.max(65, Math.min(H - 35, player.y + Math.sin(angle) * distance)),
        r: 13,
        hp: mode.hp + chapter * 10,
        maxHp: mode.hp + chapter * 10,
        damage: mode.damage + chapter,
        speed: mode.speed + chapter * 2,
        flash: 0,
        attack: 0,
        knockX: 0,
        knockY: 0,
        alive: true,
        kind: i % 3,
        phase: Math.random() * 10
      });
    }

    message = "CHAPTER " + (chapter + 1) + ": " + chapters[chapter].name.toUpperCase();
    messageTime = 3.5;
    updateStatus();
  }

  function startGame() {
    if (gameOver || gameWon) return;
    started = true;
    if (messageBox) messageBox.style.display = "none";
    difficulty.disabled = true;
    gameButton.textContent = chapterCleared ? "Continue" : "Playing...";
    lastTime = 0;
    updateStatus();
  }

  function nextChapter() {
    if (!chapterCleared) return;

    if (chapter >= chapters.length - 1) {
      gameWon = true;
      started = false;
      message = "YOU SAVED THE VILLAGERS!";
      draw();
      updateStatus();
      return;
    }

    chapter++;
    createChapter();
    startGame();
  }

  function updateStatus() {
    if (!player) return;
    const remaining = enemies.filter(e => e.alive).length;
    status.textContent =
      "THE DARK WITHIN  |  Chapter " + (chapter + 1) + "/8: " +
      chapters[chapter].name + "  |  " + difficulty.value +
      "  |  Health: " + Math.ceil(player.hp) + "/" + player.maxHp +
      "  |  Monsters: " + remaining +
      (chapterCleared ? "  |  CHAPTER CLEARED!" : "") +
      (gameOver ? "  |  YOU DIED — RESTART" : "") +
      (gameWon ? "  |  GAME COMPLETE!" : "");

    gameButton.disabled = started && !chapterCleared;
    gameButton.style.opacity = gameButton.disabled ? "0.5" : "1";

    if (chapterCleared) gameButton.textContent = chapter === 7 ? "Finish Game" : "Continue to Next Chapter";
    else if (gameOver) gameButton.textContent = "Restart Game";
    else if (!started) gameButton.textContent = "Start Game";
  }

  function addEffect(x, y, color, radius, duration, type = "burst") {
    effects.push({ x, y, color, radius, duration, maxDuration: duration, type });
  }

  function damageEnemy(e, amount, knock = 100) {
    if (!e.alive) return;
    e.hp -= amount;
    e.flash = 0.15;

    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const len = Math.hypot(dx, dy) || 1;
    e.knockX = dx / len * knock;
    e.knockY = dy / len * knock;

    addEffect(e.x, e.y, "#eaffb0", 18, 0.2);

    if (e.hp <= 0) {
      e.alive = false;
      addEffect(e.x, e.y, "#a5e86d", 30, 0.5);
    }

    checkChapterClear();
  }

  function checkChapterClear() {
    if (enemies.length && enemies.every(e => !e.alive) && !chapterCleared) {
      chapterCleared = true;
      started = false;
      message = chapter === 7 ? "THE EVIL ONE IS DEFEATED!" : "CHAPTER CLEARED!";
      messageTime = 999;
      addEffect(W / 2, H / 2, "#baffc0", 140, 1);
      updateStatus();
    }
  }

  function swordAttack() {
    if (!started || gameOver || chapterCleared || attackCooldown > 0) return;
    attackCooldown = 0.35;
    addEffect(player.x + player.faceX * 25, player.y + player.faceY * 25,
      "#f4f2d1", 35, 0.22, "slash");

    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - player.x, dy = e.y - player.y;
      const distance = Math.hypot(dx, dy);
      const dot = (dx * player.faceX + dy * player.faceY) / (distance || 1);
      if (distance < 68 && dot > -0.25) damageEnemy(e, 30, 160);
    }
  }

  function waterWheel() {
    if (!started || gameOver || chapterCleared || waterCooldown > 0) return;
    waterCooldown = 3;
    addEffect(player.x, player.y, "#48cfff", 110, 0.65, "water");

    for (const e of enemies) {
      if (e.alive && Math.hypot(e.x - player.x, e.y - player.y) < 115) {
        damageEnemy(e, 40, 220);
      }
    }
  }

  function flameArrow() {
    if (!started || gameOver || chapterCleared || flameCooldown > 0) return;
    flameCooldown = 1.2;
    projectiles.push({
      x: player.x + player.faceX * 18,
      y: player.y + player.faceY * 18,
      vx: player.faceX * 390,
      vy: player.faceY * 390,
      life: 1.5,
      r: 7
    });
  }

  function hurtPlayer(amount) {
    if (hurtCooldown > 0 || gameOver || chapterCleared) return;
    player.hp -= amount;
    player.flash = 0.2;
    hurtCooldown = 0.65;
    addEffect(player.x, player.y, "#ff5656", 23, 0.3);

    if (player.hp <= 0) {
      player.hp = 0;
      gameOver = true;
      started = false;
      message = "YOU DIED — RESTART THE GAME";
    }
    updateStatus();
  }

  function update(dt) {
    if (!started || gameOver || chapterCleared || gameWon) return;

    attackCooldown = Math.max(0, attackCooldown - dt);
    waterCooldown = Math.max(0, waterCooldown - dt);
    flameCooldown = Math.max(0, flameCooldown - dt);
    hurtCooldown = Math.max(0, hurtCooldown - dt);
    player.flash = Math.max(0, player.flash - dt);
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
    player.y = Math.max(45, Math.min(H - 18, player.y));

    for (const e of enemies) {
      if (!e.alive) continue;
      e.phase += dt * 5;
      e.flash = Math.max(0, e.flash - dt);
      e.attack = Math.max(0, e.attack - dt);

      const dx = player.x - e.x, dy = player.y - e.y;
      const distance = Math.hypot(dx, dy) || 1;

      if (distance > 25) {
        e.x += dx / distance * e.speed * dt;
        e.y += dy / distance * e.speed * dt;
      }

      e.x += e.knockX * dt;
      e.y += e.knockY * dt;
      e.knockX *= Math.pow(0.03, dt);
      e.knockY *= Math.pow(0.03, dt);

      if (distance < player.r + e.r + 4 && e.attack <= 0) {
        e.attack = 0.9;
        hurtPlayer(e.damage);
      }
    }

    for (const p of projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      for (const e of enemies) {
        if (e.alive && Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r + 5) {
          damageEnemy(e, 45, 140);
          addEffect(p.x, p.y, "#ffb83d", 30, 0.3);
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
    const c = chapters[chapter];
    ctx.fillStyle = c.ground;
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += 32) {
      for (let x = 0; x < W; x += 32) {
        const n = (x * 13 + y * 7 + chapter * 11) % 11;
        ctx.fillStyle = n < 4 ? c.detail : c.ground;
        ctx.globalAlpha = n < 4 ? 0.45 : 0.25;
        ctx.fillRect(x + 1, y + 1, 30, 30);
      }
    }
    ctx.globalAlpha = 1;

    // Different scenery for every chapter.
    if (chapter === 0) {
      for (let i = 0; i < 22; i++) {
        const x = (i * 173 + 41) % W, y = (i * 89 + 67) % H;
        ctx.fillStyle = "#0a110d";
        ctx.fillRect(x, y, 13, 30);
        ctx.fillStyle = "#315336";
        ctx.fillRect(x - 9, y + 3, 31, 17);
      }
    } else if (chapter === 1) {
      ctx.fillStyle = "#58422e";
      for (let x = 100; x < W - 80; x += 160) {
        ctx.fillRect(x, 95, 65, 7);
        ctx.fillRect(x, 95, 7, 80);
        ctx.fillRect(x + 58, 95, 7, 80);
      }
    } else if (chapter === 2) {
      for (let i = 0; i < 15; i++) {
        const x = (i * 89 + 30) % W, y = (i * 61 + 45) % H;
        ctx.fillStyle = "#b2dbe5";
        ctx.fillRect(x, y, 25, 3);
        ctx.fillRect(x + 7, y + 3, 3, 16);
      }
    } else if (chapter === 3) {
      for (let i = 0; i < 28; i++) {
        const x = (i * 131 + 13) % W, y = (i * 67 + 20) % H;
        ctx.fillStyle = "#70c99a";
        ctx.fillRect(x, y, 5, 9);
      }
    } else if (chapter === 4) {
      for (let i = 0; i < 18; i++) {
        const x = (i * 97 + 20) % W, y = (i * 83 + 20) % H;
        ctx.fillStyle = "#bd8cff";
        ctx.fillRect(x, y, 5, 22);
        ctx.fillRect(x - 5, y + 7, 15, 5);
      }
    } else if (chapter === 5) {
      for (let i = 0; i < 24; i++) {
        const x = (i * 113 + 10) % W, y = (i * 71 + 10) % H;
        ctx.fillStyle = "#a53d23";
        ctx.fillRect(x, y, 16, 5);
        ctx.fillStyle = "#f17a32";
        ctx.fillRect(x + 4, y + 5, 5, 3);
      }
    } else if (chapter === 6) {
      ctx.fillStyle = "#0b0b13";
      for (let x = 35; x < W; x += 125) ctx.fillRect(x, 0, 16, 120);
      ctx.fillStyle = "#65627f";
      for (let x = 35; x < W; x += 125) ctx.fillRect(x + 5, 35, 6, 70);
    } else {
      ctx.fillStyle = "#14080d";
      ctx.fillRect(0, 0, W, 30);
      ctx.fillRect(0, H - 30, W, 30);
      ctx.fillStyle = "#b6384b";
      ctx.fillRect(W / 2 - 80, 48, 160, 8);
      ctx.fillRect(W / 2 - 60, 56, 120, 8);
    }

    // Chapter exit.
    ctx.fillStyle = chapterCleared ? "#79e6a1" : "#38483a";
    ctx.fillRect(W - 43, H / 2 - 30, 25, 60);
    ctx.fillStyle = "#101711";
    ctx.fillRect(W - 37, H / 2 - 24, 13, 48);
    ctx.fillStyle = "#e2f6d8";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(chapterCleared ? "OPEN" : "LOCKED", W - 10, H / 2 + 42);
    ctx.textAlign = "left";
  }

  function drawPlayer() {
    const x = Math.round(player.x), y = Math.round(player.y);
    ctx.fillStyle = "#080c09";
    ctx.fillRect(x - 11, y + 8, 22, 5);

    ctx.fillStyle = player.flash > 0 ? "#ffffff" : "#315c49";
    ctx.fillRect(x - 10, y - 9, 20, 18);

    ctx.fillStyle = "#e9b78a";
    ctx.fillRect(x - 8, y - 22, 16, 14);
    ctx.fillStyle = "#34281f";
    ctx.fillRect(x - 9, y - 24, 18, 6);
    ctx.fillRect(x - 9, y - 20, 4, 7);

    ctx.fillStyle = "#171b17";
    ctx.fillRect(x + (player.faceX >= 0 ? 3 : -6), y - 17, 3, 3);

    ctx.save();
    ctx.translate(x, y - 2);
    ctx.rotate(Math.atan2(player.faceY, player.faceX));
    ctx.fillStyle = "#d9e9eb";
    ctx.fillRect(8, -2, 23, 4);
    ctx.fillStyle = "#8c613c";
    ctx.fillRect(5, -5, 4, 10);
    ctx.restore();

    ctx.fillStyle = "#080c09";
    ctx.fillRect(x - 19, y - 34, 38, 5);
    ctx.fillStyle = "#72df78";
    ctx.fillRect(x - 18, y - 33, 36 * player.hp / player.maxHp, 3);
  }

  function drawEnemy(e) {
    const x = Math.round(e.x), y = Math.round(e.y + Math.sin(e.phase) * 2);
    const colors = ["#76b74f", "#9a6bb9", "#b56d43"];
    const dark = ["#365d2e", "#553969", "#6b3a29"];

    ctx.fillStyle = "#0b100c";
    ctx.fillRect(x - 14, y + 10, 28, 5);

    ctx.fillStyle = e.flash > 0 ? "#ffffff" : colors[e.kind];
    ctx.fillRect(x - 12, y - 7, 24, 14);
    ctx.fillRect(x - 8, y - 12, 16, 5);
    ctx.fillRect(x - 15, y - 2, 3, 8);
    ctx.fillRect(x + 12, y - 2, 3, 8);

    ctx.fillStyle = dark[e.kind];
    ctx.fillRect(x - 8, y + 4, 16, 4);
    ctx.fillStyle = "#f8f5d7";
    ctx.fillRect(x - 7, y - 4, 5, 5);
    ctx.fillRect(x + 2, y - 4, 5, 5);
    ctx.fillStyle = "#171817";
    ctx.fillRect(x - 5, y - 3, 2, 3);
    ctx.fillRect(x + 4, y - 3, 2, 3);

    if (e.kind === 2) {
      ctx.fillStyle = "#e2c28c";
      ctx.fillRect(x - 11, y - 15, 4, 7);
      ctx.fillRect(x + 7, y - 15, 4, 7);
    }

    ctx.fillStyle = "#080c09";
    ctx.fillRect(x - 17, y - 23, 34, 5);
    ctx.fillStyle = "#e8a65a";
    ctx.fillRect(x - 16, y - 22, 32 * Math.max(0, e.hp) / e.maxHp, 3);
  }

  function drawEffects() {
    for (const fx of effects) {
      const progress = 1 - fx.duration / fx.maxDuration;
      const radius = fx.radius * (0.5 + progress);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = fx.color;
      ctx.fillStyle = fx.color;
      ctx.lineWidth = fx.type === "water" ? 4 : 3;

      if (fx.type === "water" || fx.type === "slash") {
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, radius, 0, Math.PI * 1.7);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, radius, 0, Math.PI * 2);
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
      ctx.restore();
    }
  }

  function drawOverlay() {
    if (!started && !chapterCleared && !gameOver && !gameWon) {
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#d7f6c8";
      ctx.font = "bold 30px monospace";
      ctx.fillText("THE DARK WITHIN", W / 2, H / 2 - 45);
      ctx.fillStyle = "#ffffff";
      ctx.font = "15px monospace";
      ctx.fillText("Press Start Adventure above to begin", W / 2, H / 2);
      ctx.textAlign = "left";
    }

    if (chapterCleared || gameWon || gameOver) {
      ctx.fillStyle = "rgba(0,0,0,.68)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = gameOver ? "#ff8585" : "#baffc0";
      ctx.font = "bold 27px monospace";

      const title = gameWon ? "YOU SAVED THE VILLAGERS!" :
        gameOver ? "YOU DIED" :
        chapter === 7 ? "THE EVIL ONE IS DEFEATED!" : "CHAPTER CLEARED!";

      ctx.fillText(title, W / 2, H / 2 - 18);
      ctx.fillStyle = "#ffffff";
      ctx.font = "15px monospace";
      ctx.fillText(
        gameWon ? "Congratulations! You completed the game." :
        gameOver ? "Press Restart Game to try again." :
        chapter === 7 ? "Press Finish Game above." : "Press Continue to Next Chapter above.",
        W / 2, H / 2 + 20
      );
      ctx.textAlign = "left";
    }

    if (messageTime > 0 && started && !chapterCleared && !gameOver) {
      ctx.textAlign = "center";
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "#e5ffce";
      ctx.fillText(message, W / 2, 35);
      ctx.textAlign = "left";
    }
  }

  function draw() {
    drawBackground();
    for (const e of enemies) if (e.alive) drawEnemy(e);
    drawEffects();
    drawProjectiles();
    if (player) drawPlayer();
    drawOverlay();

    ctx.font = "12px monospace";
    ctx.fillStyle = waterCooldown <= 0 ? "#8fe6ff" : "#657b7c";
    ctx.fillText(waterCooldown <= 0 ? "M: WATER WHEEL READY" :
      "M: WATER " + waterCooldown.toFixed(1) + "s", 15, H - 28);

    ctx.fillStyle = flameCooldown <= 0 ? "#ffb05c" : "#8d7764";
    ctx.fillText(flameCooldown <= 0 ? "K: FLAME ARROW READY" :
      "K: FLAME " + flameCooldown.toFixed(1) + "s", 15, H - 12);
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.04);
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // Connect the original welcome-screen button.
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (gameOver) {
        resetGame();
        startGame();
      } else if (chapterCleared) {
        nextChapter();
      } else {
        startGame();
      }
    });
  }

  window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
      e.preventDefault();
    }
    keys.add(key);
    if (e.repeat) return;
    if (key === " " || key === "j") swordAttack();
    if (key === "m") waterWheel();
    if (key === "k") flameArrow();
  });

  window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => keys.clear());
  canvas.addEventListener("click", swordAttack);

  resetGame();
  requestAnimationFrame(loop);
})();
