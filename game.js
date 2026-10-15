
(() => {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const chapters = [
    {
      name: "The Missing",
      text: "Search the forest and follow the trail.",
      world: "forest",
      goal: "You discover a trail leading toward the cages."
    },
    {
      name: "The Cages",
      text: "Find the villagers and escape the prison.",
      world: "cages",
      goal: "The rescue fails! You fall into the Darkness Below."
    },
    {
      name: "The Monsters",
      text: "Defeat five monsters to unlock the next passage.",
      world: "cave",
      goal: "Five monsters defeated! The passage opens."
    },
    {
      name: "The Dark Spirit",
      text: "Follow the strange light through the darkness.",
      world: "spirit",
      goal: "The dark spirit takes over you and reveals the Evil One's lair."
    },
    {
      name: "The Evil One's Lair",
      text: "Defeat the minions and save the villagers.",
      world: "lair",
      goal: "The villagers are saved, but the dark spirit still controls you. The story ends here."
    }
  ];

  const keys = new Set();

  let stage = 0;
  let health = 5;
  let kills = 0;
  let running = false;
  let completed = false;
  let punchTimer = 0;
  let lastTime = 0;
  let attackCooldown = 0;
  let exitNotice = 0;

  const player = {
    x: 90,
    y: 300,
    w: 24,
    h: 32,
    speed: 190,
    dir: 1,
    invulnerable: 0
  };

  let enemies = [];

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function makeEnemies() {
    enemies = [];

    const count = stage === 2 ? 5 : 4;

    for (let i = 0; i < count; i++) {
      enemies.push({
        x: random(350, 820),
        y: random(120, 450),
        w: 26,
        h: 26,
        alive: true,
        phase: random(0, 6)
      });
    }
  }

  function resetStage() {
    player.x = 90;
    player.y = 300;
    player.dir = 1;
    player.invulnerable = 0;

    health = 5;
    kills = 0;
    completed = false;
    punchTimer = 0;
    attackCooldown = 0;
    exitNotice = 0;

    makeEnemies();
    updateHUD();
    draw();
  }

  function updateHUD() {
    document.getElementById("chapterTitle").textContent =
      `Chapter ${stage + 1}: ${chapters[stage].name}`;

    document.getElementById("chapterText").textContent =
      chapters[stage].text;

    document.getElementById("health").textContent = health;
    document.getElementById("kills").textContent = kills;
  }

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function drawWorld() {
    const world = chapters[stage].world;

    const backgrounds = {
      forest: "#327b42",
      cages: "#353945",
      cave: "#171d3a",
      spirit: "#281239",
      lair: "#381322"
    };

    rect(0, 0, W, H, backgrounds[world]);

    // Pixel ground tiles.
    for (let y = 0; y < H; y += 32) {
      for (let x = 0; x < W; x += 32) {
        if ((x / 32 + y / 32) % 3 === 0) {
          const colors = {
            forest: "#286638",
            cages: "#424650",
            cave: "#202748",
            spirit: "#351747",
            lair: "#4b1928"
          };

          rect(x, y, 16, 12, colors[world]);
        }
      }
    }

    if (world === "forest") {
      // Trees.
      for (let x = 15; x < W; x += 100) {
        if (Math.abs(x - player.x) < 45) continue;

        rect(x + 12, 90, 12, 45, "#754522");
        rect(x, 60, 36, 36, "#176237");
        rect(x + 5, 45, 26, 28, "#25934a");
        rect(x + 10, 35, 15, 18, "#40bd5c");
      }

      // Small village houses.
      drawHouse(590, 120);
      drawHouse(730, 175);

      // Dirt trail.
      rect(0, 390, W, 35, "#a78351");
      rect(0, 400, W, 6, "#c3a36a");
    }

    if (world === "cages") {
      // Prison bars.
      for (let x = 230; x < 740; x += 30) {
        rect(x, 100, 6, 330, "#a4afb0");
      }

      rect(220, 100, 520, 7, "#7b8587");
      rect(220, 425, 520, 7, "#7b8587");

      for (let i = 0; i < 4; i++) {
        rect(280 + i * 110, 250, 40, 70, "#996b40");
        rect(289 + i * 110, 260, 22, 50, "#18202a");
      }
    }

    if (world === "cave" || world === "spirit" || world === "lair") {
      for (let i = 0; i < 18; i++) {
        const x = (i * 83) % W;
        const y = 70 + (i * 61) % 390;

        rect(
          x,
          y,
          22,
          14,
          world === "lair" ? "#70243b" :
          world === "spirit" ? "#552166" : "#414c79"
        );
      }

      if (world === "spirit") {
        ctx.fillStyle = "#ba2bff";
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(720, 240, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        drawSpirit(720, 210);
      }

      if (world === "lair") {
        rect(720, 80, 160, 180, "#611b2d");
        rect(745, 95, 110, 150, "#36101d");
        drawBoss(790, 210);
      }
    }

    // Exit gate.
    rect(915, 240, 22, 90, "#b8a16a");
    rect(907, 232, 38, 10, "#f2d17a");
    rect(921, 250, 10, 72, "#5e3a22");

    if (exitNotice > 0) {
      ctx.fillStyle = "#030906";
      ctx.fillRect(270, 45, 420, 40);

      ctx.fillStyle = "#47ff91";
      ctx.font = '22px "VT323", monospace';
      ctx.fillText("Defeat all five monsters first!", 340, 72);
    }
  }

  function drawHouse(x, y) {
    rect(x, y + 20, 70, 55, "#a57543");
    rect(x - 8, y + 10, 86, 17, "#633d2b");
    rect(x + 4, y, 62, 20, "#315f9a");
    rect(x + 12, y + 34, 14, 14, "#91e8ff");
    rect(x + 45, y + 42, 14, 33, "#493021");
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;

    if (
      player.invulnerable > 0 &&
      Math.floor(performance.now() / 80) % 2 === 0
    ) return;

    // Hair and face.
    rect(x + 5, y, 15, 9, "#603a25");
    rect(x + 6, y + 5, 14, 10, "#edbd8b");
    rect(x + 8, y + 8, 3, 3, "#14271b");
    rect(x + 16, y + 8, 3, 3, "#14271b");

    // Shirt and arms.
    rect(x + 4, y + 14, 17, 12, "#398bd1");
    rect(x + 1, y + 15, 5, 12, "#edbd8b");
    rect(x + 20, y + 15, 5, 12, "#edbd8b");

    // Legs.
    rect(x + 6, y + 25, 6, 7, "#593a2d");
    rect(x + 15, y + 25, 6, 7, "#593a2d");

    // Punch animation.
    if (punchTimer > 0) {
      const armX = player.dir > 0 ? x + 23 : x - 16;
      rect(armX, y + 14, 16, 7, "#f6e4a0");
      rect(armX + (player.dir > 0 ? 10 : 0), y + 11, 6, 12, "#fff4c5");
    }
  }

  function drawEnemy(enemy) {
    if (!enemy.alive) return;

    const x = enemy.x;
    const y = enemy.y;

    const main = stage === 4 ? "#a82b40" :
      stage === 3 ? "#a32ed0" : "#35a953";

    const bright = stage === 4 ? "#ff7452" :
      stage === 3 ? "#ef70ff" : "#7cff69";

    rect(x + 5, y + 4, 17, 18, main);
    rect(x, y + 10, 8, 9, main);
    rect(x + 20, y + 10, 8, 9, main);
    rect(x + 8, y + 21, 5, 5, bright);
    rect(x + 17, y + 21, 5, 5, bright);

    rect(x + 8, y + 9, 4, 4, "#fff4bd");
    rect(x + 17, y + 9, 4, 4, "#fff4bd");
    rect(x + 9, y + 10, 2, 3, "#111");
    rect(x + 18, y + 10, 2, 3, "#111");
  }

  function drawSpirit(x, y) {
    rect(x - 9, y - 23, 18, 18, "#c94aff");
    rect(x - 15, y - 7, 30, 30, "#9b2bcc");
    rect(x - 24, y, 9, 22, "#9b2bcc");
    rect(x + 15, y, 9, 22, "#9b2bcc");
    rect(x - 12, y + 22, 9, 18, "#d44dff");
    rect(x + 4, y + 22, 9, 18, "#d44dff");
    rect(x - 5, y - 15, 4, 4, "#fff");
    rect(x + 3, y - 15, 4, 4, "#fff");
  }

  function drawBoss(x, y) {
    rect(x - 20, y - 35, 42, 42, "#a72b39");
    rect(x - 27, y - 18, 12, 38, "#70213a");
    rect(x + 18, y - 18, 12, 38, "#70213a");
    rect(x - 18, y + 7, 14, 23, "#752238");
    rect(x + 5, y + 7, 14, 23, "#752238");
    rect(x - 15, y - 29, 8, 7, "#ffdd71");
    rect(x + 5, y - 29, 8, 7, "#ffdd71");
    rect(x - 7, y - 9, 15, 5, "#210b15");
    rect(x - 25, y - 42, 10, 14, "#ffca55");
    rect(x + 13, y - 42, 10, 14, "#ffca55");
  }

  function draw() {
    drawWorld();

    enemies.forEach(drawEnemy);
    drawPlayer();

    ctx.fillStyle = "#8cffb3";
    ctx.font = '20px "VT323", monospace';
    ctx.fillText(`CHAPTER ${stage + 1}/5`, 18, 28);

    if (stage === 2) {
      ctx.fillStyle = "#ffcf70";
      ctx.fillText(`MONSTERS: ${kills}/5`, 18, 52);
    }
  }

  function punch() {
    if (!running || completed || attackCooldown > 0) return;

    attackCooldown = 0.24;
    punchTimer = 0.16;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      const dx = enemy.x + enemy.w / 2 -
        (player.x + player.w / 2);

      const dy = enemy.y + enemy.h / 2 -
        (player.y + player.h / 2);

      if (
        Math.abs(dx) < 58 &&
        Math.abs(dy) < 42 &&
        dx * player.dir > -12
      ) {
        enemy.alive = false;
        kills++;

        document.getElementById("kills").textContent = kills;

        if (stage === 2 && kills >= 5) {
          finishStage();
          return;
        }
      }
    }
  }

  function showMessage(title, message, buttonText) {
    running = false;

    document.getElementById("messageTitle").textContent = title;
    document.getElementById("messageText").textContent = message;
    document.getElementById("startBtn").textContent =
      buttonText || "Start Adventure";

    document.getElementById("messageBox").classList.remove("hidden");
  }

  function finishStage() {
    if (completed) return;

    completed = true;
    running = false;

    document.getElementById("modalTitle").textContent =
      stage === 4 ? "The Villagers Are Free!" :
      `Chapter ${stage + 1} Complete`;

    document.getElementById("modalText").textContent =
      chapters[stage].goal;

    const next = document.getElementById("nextBtn");
    const menu = document.getElementById("menuLink");

    if (stage === 4) {
      next.classList.add("hidden");
      menu.classList.remove("hidden");
    } else {
      next.classList.remove("hidden");
      menu.classList.add("hidden");
    }

    document.getElementById("chapterModal").classList.remove("hidden");
  }

  function update(dt) {
    if (!running || completed) return;

    attackCooldown = Math.max(0, attackCooldown - dt);
    punchTimer = Math.max(0, punchTimer - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    exitNotice = Math.max(0, exitNotice - dt);

    let dx = 0;
    let dy = 0;

    if (keys.has("a") || keys.has("arrowleft")) dx--;
    if (keys.has("d") || keys.has("arrowright")) dx++;
    if (keys.has("w") || keys.has("arrowup")) dy--;
    if (keys.has("s") || keys.has("arrowdown")) dy++;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);

      player.x += dx / length * player.speed * dt;
      player.y += dy / length * player.speed * dt;

      if (dx !== 0) player.dir = Math.sign(dx);
    }

    player.x = Math.max(8, Math.min(W - player.w - 8, player.x));
    player.y = Math.max(55, Math.min(H - player.h - 12, player.y));

    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      const dxEnemy = player.x - enemy.x;
      const dyEnemy = player.y - enemy.y;
      const distance = Math.hypot(dxEnemy, dyEnemy);

      // Enemies follow the player when nearby.
      if (distance < 180 && distance > 1) {
        enemy.x += dxEnemy / distance * 40 * dt;
        enemy.y += dyEnemy / distance * 30 * dt;
      }

      // Enemy contact deals damage.
      if (
        Math.abs(dxEnemy) < 24 &&
        Math.abs(dyEnemy) < 27 &&
        player.invulnerable <= 0
      ) {
        health--;
        player.invulnerable = 1;
        document.getElementById("health").textContent = health;

        if (health <= 0) {
          showMessage(
            "Lost in the Darkness",
            "You ran out of hearts. Restart the chapter and try again.",
            "Try Again"
          );
          return;
        }
      }
    }

    // The exit gate is at the right side of the screen.
    if (
      player.x > 880 &&
      player.y > 220 &&
      player.y < 340
    ) {
      if (stage === 2 && kills < 5) {
        player.x = 850;
        exitNotice = 2;
      } else {
        finishStage();
      }
    }
  }

  function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.04);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  function startGame() {
    document.getElementById("messageBox").classList.add("hidden");
    running = true;
    canvas.focus();
  }

  window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
      .includes(key)) {
      event.preventDefault();
    }

    keys.add(key);

    if (key === " " && running) {
      punch();
    }
  });

  window.addEventListener("keyup", event => {
    keys.delete(event.key.toLowerCase());
  });

  // Clicking the canvas also performs a punch.
  canvas.addEventListener("pointerdown", () => {
    if (running) punch();
  });

  document.getElementById("startBtn").addEventListener(
    "click",
    startGame
  );

  document.getElementById("restartBtn").addEventListener("click", () => {
    document.getElementById("chapterModal").classList.add("hidden");
    resetStage();

    showMessage(
      "Ready to try again?",
      chapters[stage].text,
      "Start Chapter"
    );
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (stage >= 4) return;

    stage++;

    document.getElementById("chapterModal").classList.add("hidden");

    resetStage();

    showMessage(
      `Chapter ${stage + 1}: ${chapters[stage].name}`,
      chapters[stage].text,
      "Start Chapter"
    );
  });

  resetStage();

  showMessage(
    "Welcome to TheDarkWithin",
    "Find the missing villagers. Move with WASD or arrow keys, and press Space to punch nearby monsters.",
    "Start Adventure"
  );

  requestAnimationFrame(loop);
})();

