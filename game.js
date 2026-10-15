(() => {
  "use strict";

  // THE DARK WITHIN — 8 Chapter Combat System
  // WASD / arrows = move, Space / click = sword
  // M = Water Wheel, K = Flame Arrow

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

  let ui = document.getElementById("darkWithinUI");
  if (!ui) {
    ui = document.createElement("div");
    ui.id = "darkWithinUI";
    canvas.before(ui);
  }

  ui.style.cssText =
    "max-width:960px;margin:
  function drawBackground() {
    const backgrounds = [
      { name: "THE FORGOTTEN FOREST", sky: "#101b18", floor: "#17251b", tile: "#14231b", detail: "#315336", accent: "#79a95c", type: "forest" },
      { name: "THE ABANDONED VILLAGE", sky: "#211b26", floor: "#30252b", tile: "#382a2c", detail: "#725044", accent: "#e0a45c", type: "village" },
      { name: "THE GRAVEYARD", sky: "#151b31", floor: "#252b3c", tile: "#202638", detail: "#6e7891", accent: "#a5b7e8", type: "graveyard" },
      { name: "THE ANCIENT DUNGEON", sky: "#17191d", floor: "#303238", tile: "#282a30", detail: "#575b63", accent: "#e6a65d", type: "dungeon" },
      { name: "THE FROZEN WASTELAND", sky: "#152b38", floor: "#294452", tile: "#24404e", detail: "#6e9dad", accent: "#b9f1ff", type: "ice" },
      { name: "THE CURSED SWAMP", sky: "#111e1c", floor: "#1d3027", tile: "#192a24", detail: "#42674a", accent: "#9bea75", type: "swamp" },
      { name: "THE BURNING FORTRESS", sky: "#2a1412", floor: "#38201b", tile: "#301b18", detail: "#78382a", accent: "#ff8b3d", type: "fire" },
      { name: "THE FINAL THRONE", sky: "#1b0b17", floor: "#2c1427", tile: "#251022", detail: "#632b54", accent: "#ff4e68", type: "final" }
    ];

    const scene = backgrounds[Math.min(chapter - 1, 7)];
    ctx.fillStyle = scene.sky;
    ctx.fillRect(0, 0, W, H);

    // Pixel-art ground tiles
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

    // Forest and swamp trees
    if (scene.type === "forest" || scene.type === "swamp") {
      for (let i = 0; i < 20; i++) {
        const x = (i * 173 + 41) % W;
        const y = 50 + ((i * 89 + 67) % (H - 70));
        ctx.fillStyle = scene.detail;
        ctx.fillRect(x, y, 6, 15);
        ctx.fillRect(x - 5, y + 4, 5, 5);
        ctx.fillRect(x + 6, y + 2, 5, 6);

        if (scene.type === "swamp" && i % 3 === 0) {
          ctx.fillStyle = "rgba(139,255,105,.22)";
          ctx.fillRect(x - 8, y + 14, 24, 3);
        }
      }
    }

    // Abandoned village houses
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

    // Graveyard headstones and moon
    if (scene.type === "graveyard") {
      for (let i = 0; i < 12; i++) {
        const x = (i * 79 + 35) % W;
        const y = 100 + (i * 47) % 350;
        ctx.fillStyle = "#727b91";
        ctx.fillRect(x, y, 18, 25);
        ctx.fillRect(x + 5, y - 7, 8, 8);
        ctx.fillStyle = "#30364a";
        ctx.fillRect(x + 5, y + 9, 2, 10);
      }
      ctx.fillStyle = "#c3d2ef";
      ctx.fillRect(770, 55, 38, 38);
      ctx.fillStyle = scene.sky;
      ctx.fillRect(782, 48, 34, 34);
    }

    // Dungeon stone walls and torches
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

    // Frozen ice spikes
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

    // Burning fortress and final throne
    if (scene.type === "fire" || scene.type === "final") {
      for (let i = 0; i < 13; i++) {
        const x = (i * 83 + 19) % W;
        ctx.fillStyle = scene.detail;
        ctx.fillRect(x, 35, 24, 150 + (i % 4) * 28);
        ctx.fillStyle = scene.accent;
        ctx.fillRect(x + 7, 45 + (i % 3) * 20, 4, 15);
      }

      if (scene.type === "final") {
        ctx.fillStyle = "#100811";
        ctx.fillRect(W / 2 - 70, 75, 140, 170);
        ctx.fillRect(W / 2 - 95, 125, 190, 115);
        ctx.fillStyle = "#7b244f";
        ctx.fillRect(W / 2 - 45, 100, 90, 125);
        ctx.fillStyle = "#ff4e68";
        ctx.fillRect(W / 2 - 22, 130, 12, 8);
        ctx.fillRect(W / 2 + 10, 130, 12, 8);
      }
    }

    // Chapter title banner
    ctx.fillStyle = "rgba(0,0,0,.48)";
    ctx.fillRect(0, 28, W, 25);
    ctx.fillStyle = scene.accent;
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CHAPTER " + chapter + " — " + scene.name, W / 2, 45);
    ctx.textAlign = "left";

    // Locked exit becomes open after the chapter is cleared
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
      chapterCleared ? (chapter === 8 ? "END OPEN" : "EXIT OPEN") : "LOCKED",
      W - 14, H / 2 + 43
    );
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

    ctx.fillStyle = "#080c09";
    ctx.fillRect(x - 11, y + 8, 22, 5);

    ctx.fillStyle = "#50382b";
    ctx.fillRect(x - 9, y + 3, 7, 8);
    ctx.fillRect(x + 2, y + 3, 7, 8);

    ctx.fillStyle = player.flash > 0 ? "#ffffff" : "#315c49";
    ctx.fillRect(x - 10, y - 9, 20, 17);
    ctx.fillStyle = "#203e31";
    ctx.fillRect(x - 9, y + 2, 18, 4);

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
    ctx.fillStyle = "#849a9c";
    ctx.fillRect(8, -1, 21, 1);
    ctx.fillStyle = "#8c613c";
    ctx.fillRect(5, -5, 4, 10);
    ctx.fillStyle = "#dfc98a";
    ctx.fillRect(4, -6, 3, 12);
    ctx.restore();

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

    ctx.fillStyle = "#0b100c";
    ctx.fillRect(x - 14, y + 10, 28, 5);

    ctx.fillStyle = e.flash > 0 ? "#ffffff" : color;
    ctx.fillRect(x - 12, y - 7, 24, 14);
    ctx.fillRect(x - 8, y - 12, 16, 5);
    ctx.fillRect(x - 15, y - 2, 3, 8);
    ctx.fillRect(x + 12, y - 2, 3, 8);

    ctx.fillStyle = dark;
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
      ctx.fillStyle = "rgba(0,0,0,.65)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#baffc0";
      ctx.font = "bold 28px monospace";
      ctx.fillText(
        gameWon ? "YOU SAVED THE DARK WITHIN!" : "CHAPTER " + chapter + " CLEARED!",
        W / 2, H / 2 - 20
      );
      ctx.font = "15px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        gameWon
          ? "The final monsters are defeated. Your journey is complete."
          : "Every monster has been defeated.",
        W / 2, H / 2 + 12
      );
      ctx.fillText(
        gameWon
          ? "Thank you for playing! Press Restart to play again."
          : "Press Continue to Next Chapter above.",
        W / 2, H / 2 + 40
      );
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

    for (const e of enemies) {
      if (e.alive) drawEnemy(e);
    }

    drawEffects();
    drawProjectiles();
    if (player) drawPlayer();
    drawOverlay();

    ctx.font = "12px monospace";
    ctx.fillStyle = waterCooldown <= 0 ? "#8fe6ff" : "#657b7c";
    ctx.fillText(
      waterCooldown <= 0
        ? "M: WATER WHEEL READY"
        : "M: WATER " + waterCooldown.toFixed(1) + "s",
      15, H - 28
    );

    ctx.fillStyle = flameCooldown <= 0 ? "#ffb05c" : "#8d7764";
    ctx.fillText(
      flameCooldown <= 0
        ? "K: FLAME ARROW READY"
        : "K: FLAME " + flameCooldown.toFixed(1) + "s",
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

  makeButton("⚔ Sword", swordAttack);
  makeButton("💧 Water Wheel", waterWheel);
  makeButton("🔥 Flame Arrow", flameArrow);

  resetGame();
  requestAnimationFrame(loop);
})();
