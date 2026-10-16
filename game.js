
(() => {
  "use strict";

  // ==========================================
  // THEDARKWITHIN — GAME ENGINE
  // ==========================================
  // Move: WASD / Arrow Keys
  // Sword: Space / J / Click
  // M: Water Wheel / Black Flash
  // N: Divergent Fist
  // K: Flame Arrow
  // ==========================================

  if (window.__darkWithinRunning) return;
  window.__darkWithinRunning = true;

  const $ = id => document.getElementById(id);

  $("darkWithinUI")?.remove();

  const canvas =
    $("darkWithinCanvas") ||
    document.querySelector("canvas") ||
    document.createElement("canvas");

  canvas.id = "darkWithinCanvas";
  canvas.width = 960;
  canvas.height = 540;

  canvas.style.cssText =
    "display:block;width:min(960px,100%);" +
    "height:auto;margin:12px auto;" +
    "border:2px solid #373741;" +
    "image-rendering:pixelated;background:#111;";

  const gameFrame = document.createElement("div");
  gameFrame.id = "dwGameFrame";

  gameFrame.style.cssText =
    "position:relative;width:min(960px,100%);" +
    "margin:12px auto;";

  if (canvas.isConnected) {
    canvas.parentNode.insertBefore(gameFrame, canvas);
  } else {
    document.body.appendChild(gameFrame);
  }

  gameFrame.appendChild(canvas);

  canvas.style.margin = "0";
  canvas.style.width = "100%";

  document.body.style.background = "#08080d";
  document.body.style.color = "#eee";
  document.body.style.fontFamily = "monospace";

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // ==========================================
  // USER INTERFACE
  // ==========================================

  const ui = document.createElement("div");
  ui.id = "darkWithinUI";

  ui.style.cssText =
    "max-width:960px;box-sizing:border-box;" +
    "margin:12px auto;padding:14px;" +
    "background:#111116;" +
    "border:2px solid #34343d;" +
    "color:#eee;font:14px monospace;";

  ui.innerHTML = `
    <div style="
      font-size:25px;
      font-weight:bold;
      margin-bottom:8px;
    ">
      THEDARKWITHIN
    </div>

    <div id="dwChapter"
      style="color:#aaa;margin-bottom:5px">
    </div>

    <div id="dwStatus"
      style="margin-bottom:12px">
    </div>

    <div style="
      display:flex;
      flex-wrap:wrap;
      align-items:center;
      gap:8px;
      margin-bottom:12px;
    ">

      <label for="dwDifficulty">
        Difficulty:
      </label>

      <select id="dwDifficulty" style="
        padding:8px;
        background:#222;
        color:#fff;
        border:1px solid #555;
      ">
        <option value="easy">Easy</option>
        <option value="medium" selected>Medium</option>
        <option value="hard">Hard</option>
        <option value="extreme">Extreme</option>
      </select>

      <button id="dwStart">
        Start Adventure
      </button>

      <button id="dwRestart">
        Restart Game
      </button>

      <button id="dwFullscreen">
        ⛶ Full Screen
      </button>

    </div>

    <div style="
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-bottom:8px;
    ">

      <button id="dwSword" type="button">
        SPACE / J — Sword
      </button>

      <button id="dwSkill" type="button">
        M — Water Wheel
      </button>

      <button id="dwDivergent"
        type="button" disabled>
        N — Locked
      </button>

      <button id="dwFlame" type="button">
        K — Flame Arrow
      </button>

    </div>

    <div id="dwCooldowns" style="
      display:flex;
      flex-wrap:wrap;
      gap:12px;
      margin-bottom:10px;
      color:#aaa;
    ">

      <span id="dwSwordCD">
        Sword: Ready
      </span>

      <span id="dwSkillCD">
        Water Wheel: Ready
      </span>

      <span id="dwDivergentCD">
        Divergent Fist: Locked
      </span>

      <span id="dwFlameCD">
        Flame Arrow: Ready
      </span>

    </div>

    <div style="color:#aaa;line-height:1.8">
      Move: WASD or arrow keys.
      Click inside the game to use your sword.
      Defeat every enemy to unlock the next chapter.
    </div>
  `;

  canvas.insertAdjacentElement("beforebegin", ui);

  // ==========================================
  // CONTINUE BUTTON INSIDE THE GAME
  // ==========================================

  const chapterButton = document.createElement("button");

  chapterButton.id = "dwInGameContinue";
  chapterButton.textContent = "Continue to Next Chapter";

  chapterButton.style.cssText =
    "display:none;" +
    "position:absolute;" +
    "left:50%;top:62%;" +
    "transform:translate(-50%,-50%);" +
    "z-index:5;" +
    "padding:13px 18px;" +
    "background:#17351f;" +
    "color:#b7ffbf;" +
    "border:2px solid #63e879;" +
    "font:bold 15px monospace;" +
    "cursor:pointer;" +
    "box-shadow:0 0 18px rgba(65,255,100,.3);";

  gameFrame.appendChild(chapterButton);

  for (const button of ui.querySelectorAll("button")) {
    button.style.cssText =
      "padding:9px 12px;" +
      "background:#1b1b22;" +
      "color:#eee;" +
      "border:1px solid #555;" +
      "cursor:pointer;" +
      "font:inherit;";
  }

  const chapterText = $("dwChapter");
  const statusText = $("dwStatus");
  const startButton = $("dwStart");
  const difficultySelect = $("dwDifficulty");

  const skillLabel = $("dwSkill");
  const divergentLabel = $("dwDivergent");
  const swordLabel = $("dwSword");
  const flameLabel = $("dwFlame");

  const swordCDLabel = $("dwSwordCD");
  const skillCDLabel = $("dwSkillCD");
  const divergentCDLabel = $("dwDivergentCD");
  const flameCDLabel = $("dwFlameCD");

  const fullscreenButton = $("dwFullscreen");

  // ==========================================
  // THE EIGHT CHAPTERS
  // ==========================================

  const chapters = [

    {
      name: "The Missing Villagers",
      description: "Search the forest and defeat every enemy.",
      sky: "#253e43",
      ground: "#294e35",
      enemies: 4,
      type: "slime"
    },

    {
      name: "The Frozen Mountains",
      description: "Cross the frozen mountains and survive.",
      sky: "#91b9ce",
      ground: "#d1e2e8",
      enemies: 5,
      type: "ice"
    },

    {
      name: "The Forgotten Desert",
      description: "Follow the tracks through the burning sands.",
      sky: "#dba05b",
      ground: "#c58a45",
      enemies: 6,
      type: "sand"
    },

    {
      name: "The Cage of Shadows",
      description: "Find the villagers' cages. Something is waiting.",
      sky: "#30223e",
      ground: "#33243b",
      enemies: 6,
      type: "shadow"
    },

    {
      name: "The Darkness Below",
      description: "Fight through the underground darkness.",
      sky: "#151526",
      ground: "#24243a",
      enemies: 7,
      type: "dark"
    },

    {
      name: "The Black Spirit",
      description: "The Black Spirit awakens within you.",
      sky: "#100d19",
      ground: "#191421",
      enemies: 7,
      type: "spirit"
    },

    {
      name: "The Fallen Kingdom",
      description: "Master your new power and face the fallen kingdom.",
      sky: "#38202c",
      ground: "#35202a",
      enemies: 8,
      type: "knight"
    },

    {
      name: "The Purple King's Domain",
      description: "Defeat the Purple King and end the darkness.",
      sky: "#29153d",
      ground: "#281c35",
      enemies: 1,
      type: "boss"
    }

  ];

  // ==========================================
  // DIFFICULTY SETTINGS
  // ==========================================

  const difficultySettings = {

    easy: {
      enemyHp: 0.7,
      damage: 0.6,
      playerHp: 150
    },

    medium: {
      enemyHp: 1,
      damage: 1,
      playerHp: 110
    },

    hard: {
      enemyHp: 1.35,
      damage: 1.5,
      playerHp: 100
    },

    extreme: {
      enemyHp: 1.8,
      damage: 2.1,
      playerHp: 90
    }

  };

  // ==========================================
  // PART 2 — PLAYER AND ENEMY SYSTEM
  // ==========================================

  const W = canvas.width;
  const H = canvas.height;

  // ==========================================
  // GAME STATE
  // ==========================================

  let chapter = 0;
  let started = false;
  let chapterCleared = false;
  let gameOver = false;
  let victory = false;

  let takeoverComplete = false;
  let cutscene = null;
  let spiritDeparture = null;

  let elapsed = 0;
  let shake = 0;
  let message = "";
  let messageTimer = 0;

  let enemies = [];
  let projectiles = [];
  let effects = [];

  const keys = {};

  // ==========================================
  // PLAYER
  // ==========================================

  const player = {
    x: W / 2,
    y: H / 2,

    radius: 17,
    speed: 205,

    hp: 110,
    maxHp: 110,

    facing: 1,

    swordCd: 0,
    skillCd: 0,
    divergentCd: 0,
    flameCd: 0,

    invincible: 0,

    attacking: 0,
    attackType: "",

    armor: false
  };

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function say(text, duration = 3) {
    message = text;
    messageTimer = duration;
  }

  function getDifficulty() {
    return difficultySettings[
      difficultySelect.value
    ] || difficultySettings.medium;
  }

  function currentChapter() {
    return chapters[chapter];
  }

  function canAttack() {
    return (
      started &&
      !chapterCleared &&
      !gameOver &&
      !victory &&
      !cutscene &&
      !spiritDeparture
    );
  }

  // ==========================================
  // ENEMY TYPES
  // ==========================================

  const enemyTypes = {
    slime: {
      color: "#65c76b",
      hp: 35,
      speed: 53,
      damage: 7,
      radius: 17
    },

    ice: {
      color: "#8deaff",
      hp: 48,
      speed: 65,
      damage: 9,
      radius: 17
    },

    sand: {
      color: "#e5ac56",
      hp: 58,
      speed: 75,
      damage: 11,
      radius: 18
    },

    shadow: {
      color: "#9261d4",
      hp: 70,
      speed: 85,
      damage: 12,
      radius: 19
    },

    dark: {
      color: "#38254d",
      hp: 88,
      speed: 95,
      damage: 15,
      radius: 20
    },

    spirit: {
      color: "#dd426e",
      hp: 105,
      speed: 105,
      damage: 17,
      radius: 20
    },

    knight: {
      color: "#777384",
      hp: 140,
      speed: 84,
      damage: 20,
      radius: 23
    },

    boss: {
      color: "#8e36de",
      hp: 1200,
      speed: 77,
      damage: 26,
      radius: 48
    }
  };

  // ==========================================
  // CREATE ENEMIES
  // ==========================================

  function createEnemy(type, x, y) {
    const base = enemyTypes[type];
    const difficulty = getDifficulty();

    const health = Math.round(
      base.hp * difficulty.enemyHp
    );

    return {
      type: type,

      x: x,
      y: y,

      radius: base.radius,
      color: base.color,

      hp: health,
      maxHp: health,

      speed: base.speed,

      damage: Math.round(
        base.damage * difficulty.damage
      ),

      attackCd: rand(0.5, 1.5),
      shootCd: rand(1, 2),

      flash: 0,
      animation: rand(0, 10),

      dead: false
    };
  }

  // ==========================================
  // SPAWN ENEMIES
  // ==========================================

  function spawnEnemies() {
    enemies = [];

    const info = currentChapter();

    for (let i = 0; i < info.enemies; i++) {
      let x;
      let y;

      let attempts = 0;

      do {
        x = rand(65, W - 65);
        y = rand(90, H - 65);

        attempts++;
      } while (
        distance(
          x, y,
          player.x, player.y
        ) < 170 &&
        attempts < 100
      );

      enemies.push(
        createEnemy(info.type, x, y)
      );
    }
  }

  // ==========================================
  // PARTICLES AND VISUAL EFFECTS
  // ==========================================

  function particles(
    x,
    y,
    color,
    count = 10,
    speed = 100
  ) {
    for (let i = 0; i < count; i++) {
      const angle = rand(
        0,
        Math.PI * 2
      );

      const velocity = rand(
        speed * 0.25,
        speed
      );

      const life = rand(0.2, 0.7);

      effects.push({
        type: "particle",

        x: x,
        y: y,

        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,

        color: color,

        size: rand(2, 6),

        life: life,
        maxLife: life
      });
    }
  }

  function explosion(
    x,
    y,
    color,
    radius = 65,
    duration = 0.35
  ) {
    effects.push({
      type: "explosion",

      x: x,
      y: y,

      color: color,
      radius: radius,

      life: duration,
      maxLife: duration
    });
  }

  function slashEffect(
    x,
    y,
    color,
    size = 30,
    direction = 1
  ) {
    effects.push({
      type: "slash",

      x: x,
      y: y,

      color: color,
      radius: size,
      direction: direction,

      life: 0.2,
      maxLife: 0.2
    });
  }

  // ==========================================
  // DAMAGE PLAYER
  // ==========================================

  function damagePlayer(amount) {
    if (
      !canAttack() ||
      player.invincible > 0
    ) {
      return;
    }

    player.hp -= amount;
    player.invincible = 0.7;

    shake = 6;

    particles(
      player.x,
      player.y,
      "#ff4055",
      12,
      115
    );

    if (player.hp <= 0) {
      player.hp = 0;

      gameOver = true;
      started = false;

      say(
        "YOU HAVE FALLEN! RESTART TO TRY AGAIN.",
        6
      );

      refreshUI();
    }
  }

  // ==========================================
  // DAMAGE ENEMY
  // ==========================================

  function damageEnemy(
    enemy,
    amount,
    color = "#ffffff"
  ) {
    if (enemy.dead) return;

    enemy.hp -= amount;
    enemy.flash = 0.16;

    particles(
      enemy.x,
      enemy.y,
      color,
      7,
      90
    );

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.dead = true;

      explosion(
        enemy.x,
        enemy.y,
        enemy.color,
        enemy.radius * 2
      );

      particles(
        enemy.x,
        enemy.y,
        enemy.color,
        20,
        145
      );
    }
  }

  // ==========================================
  // PLAYER MOVEMENT
  // ==========================================

  function movePlayer(dt) {
    let dx = 0;
    let dy = 0;

    if (
      keys["w"] ||
      keys["arrowup"]
    ) {
      dy -= 1;
    }

    if (
      keys["s"] ||
      keys["arrowdown"]
    ) {
      dy += 1;
    }

    if (
      keys["a"] ||
      keys["arrowleft"]
    ) {
      dx -= 1;
    }

    if (
      keys["d"] ||
      keys["arrowright"]
    ) {
      dx += 1;
    }

    if (dx === 0 && dy === 0) {
      return;
    }

    const length = Math.hypot(dx, dy);

    dx /= length;
    dy /= length;

    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;

    if (dx !== 0) {
      player.facing = dx > 0 ? 1 : -1;
    }

    player.x = clamp(
      player.x,
      25,
      W - 25
    );

    player.y = clamp(
      player.y,
      65,
      H - 25
    );
  }

  // ==========================================
  // START A CHAPTER
  // ==========================================

  function beginChapter() {
    if (victory) return;

    if (chapterCleared) {
      chapter++;

      if (chapter >= chapters.length) {
        victory = true;
        started = false;
        refreshUI();
        return;
      }
    }

    chapterCleared = false;
    gameOver = false;
    started = true;

    player.x = W / 2;
    player.y = H / 2;

    player.invincible = 1;

    player.swordCd = 0;
    player.skillCd = 0;
    player.divergentCd = 0;
    player.flameCd = 0;

    projectiles = [];
    effects = [];

    spawnEnemies();

    // The Black Spirit awakens in chapter 6.
    if (
      chapter === 5 &&
      !takeoverComplete
    ) {
      cutscene = {
        time: 0,
        duration: 8
      };
    }

    say(
      "CHAPTER " +
      (chapter + 1) +
      ": " +
      currentChapter().name,
      4
    );

    refreshUI();
  }

  // ==========================================
  // CHECK CHAPTER COMPLETION
  // ==========================================

  function checkChapterClear() {
    if (
      !started ||
      chapterCleared ||
      gameOver ||
      victory
    ) {
      return;
    }

    const remaining = enemies.filter(
      enemy => !enemy.dead
    );

    if (remaining.length > 0) {
      return;
    }

    // Final boss defeat will trigger
    // the Black Spirit ending in Part 3.
    if (chapter === chapters.length - 1) {
      started = false;

      spiritDeparture = {
        time: 0,
        duration: 4.5
      };

      say(
        "THE PURPLE KING HAS FALLEN!",
        5
      );

      refreshUI();
      return;
    }

    chapterCleared = true;
    started = false;

    say(
      "CHAPTER CLEARED! CONTINUE INSIDE THE GAME.",
      5
    );

    refreshUI();
  }

  // ==========================================
  // RESET THE ENTIRE GAME
  // ==========================================

  function resetGame() {
    chapter = 0;

    started = false;
    chapterCleared = false;
    gameOver = false;
    victory = false;

    takeoverComplete = false;
    cutscene = null;
    spiritDeparture = null;

    elapsed = 0;
    shake = 0;

    enemies = [];
    projectiles = [];
    effects = [];

    const difficulty = getDifficulty();

    player.maxHp = difficulty.playerHp;
    player.hp = player.maxHp;

    player.x = W / 2;
    player.y = H / 2;

    player.armor = false;

    player.invincible = 0;
    player.attacking = 0;

    player.swordCd = 0;
    player.skillCd = 0;
    player.divergentCd = 0;
    player.flameCd = 0;

    say(
      "Welcome to TheDarkWithin. Press Start Adventure!",
      6
    );

    refreshUI();
  }

  // ==========================================
  // END OF PART 2
  // ==========================================

  // DO NOT CLOSE THE MAIN (() => { FUNCTION YET.
  // PART 3 GOES DIRECTLY BELOW THIS LINE.

  // ==========================================
  // PART 3 — COMBAT AND SPECIAL ABILITIES
  // ==========================================

  // ==========================================
  // SWORD ATTACK — SPACE / J
  // ==========================================

  function swordAttack() {
    if (!canAttack()) return;
    if (player.swordCd > 0) return;

    player.swordCd = 0.38;
    player.attacking = 0.22;
    player.attackType = "sword";

    const range = 85;

    slashEffect(
      player.x + player.facing * 30,
      player.y,
      "#ffffff",
      55,
      player.facing
    );

    particles(
      player.x + player.facing * 35,
      player.y,
      "#ddeeff",
      12,
      145
    );

    for (const enemy of enemies) {
      if (enemy.dead) continue;

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;

      const dist = Math.hypot(dx, dy);

      const facingEnemy =
        dx * player.facing >= -15;

      if (
        dist < range + enemy.radius &&
        facingEnemy
      ) {
        damageEnemy(
          enemy,
          takeoverComplete ? 38 : 28,
          "#e9faff"
        );

        enemy.x += player.facing * 18;
      }
    }

    checkChapterClear();
  }

  // ==========================================
  // WATER WHEEL — M
  // AVAILABLE BEFORE SPIRIT TAKEOVER
  // ==========================================

  function waterWheel() {
    if (!canAttack()) return;
    if (takeoverComplete) return;
    if (player.skillCd > 0) return;

    player.skillCd = 2.5;
    player.attacking = 0.65;
    player.attackType = "water";

    const x = player.x;
    const y = player.y;

    // Create a rotating water wheel.
    effects.push({
      type: "waterWheel",
      x: x,
      y: y,
      radius: 90,
      rotation: 0,
      life: 0.8,
      maxLife: 0.8,
      color: "#42cfff"
    });

    explosion(
      x,
      y,
      "#39baff",
      90,
      0.5
    );

    particles(
      x,
      y,
      "#46caff",
      32,
      165
    );

    particles(
      x,
      y,
      "#d8fbff",
      18,
      125
    );

    for (const enemy of enemies) {
      if (enemy.dead) continue;

      const dist = distance(
        x,
        y,
        enemy.x,
        enemy.y
      );

      if (dist < 110 + enemy.radius) {
        damageEnemy(
          enemy,
          65,
          "#65eaff"
        );

        const angle = Math.atan2(
          enemy.y - y,
          enemy.x - x
        );

        enemy.x += Math.cos(angle) * 42;
        enemy.y += Math.sin(angle) * 42;
      }
    }

    shake = 5;

    say("WATER WHEEL!", 1);

    checkChapterClear();
  }

  // ==========================================
  // BLACK FLASH — M
  // UNLOCKED AFTER BLACK SPIRIT TAKEOVER
  // ==========================================

  function blackFlash() {
    if (!canAttack()) return;
    if (!takeoverComplete) return;
    if (player.skillCd > 0) return;

    player.skillCd = 1.25;

    player.attacking = 0.28;
    player.attackType = "blackFlash";

    const range = 135;

    // Black and crimson lightning burst.
    explosion(
      player.x,
      player.y,
      "#240015",
      120,
      0.4
    );

    explosion(
      player.x,
      player.y,
      "#ff1744",
      78,
      0.25
    );

    particles(
      player.x,
      player.y,
      "#ff163b",
      45,
      250
    );

    particles(
      player.x,
      player.y,
      "#100b16",
      35,
      195
    );

    for (let i = 0; i < 9; i++) {
      effects.push({
        type: "lightning",

        x: player.x,
        y: player.y,

        angle: rand(
          0,
          Math.PI * 2
        ),

        radius: rand(65, 135),

        color:
          i % 2 === 0
            ? "#fa123b"
            : "#200817",

        life: 0.24,
        maxLife: 0.24
      });
    }

    for (const enemy of enemies) {
      if (enemy.dead) continue;

      if (
        distance(
          player.x,
          player.y,
          enemy.x,
          enemy.y
        ) < range + enemy.radius
      ) {
        damageEnemy(
          enemy,
          125,
          "#ff1744"
        );
      }
    }

    shake = 13;

    say("BLACK FLASH!", 1);

    checkChapterClear();
  }

  // ==========================================
  // DIVERGENT FIST — N
  // TWO HITS: INITIAL + DELAYED IMPACT
  // ==========================================

  function divergentFist() {
    if (!canAttack()) return;
    if (!takeoverComplete) return;
    if (player.divergentCd > 0) return;

    player.divergentCd = 3;

    player.attacking = 0.32;
    player.attackType = "divergent";

    const hitEnemies = [];

    explosion(
      player.x +
        player.facing * 36,
      player.y,
      "#b26bff",
      54,
      0.25
    );

    slashEffect(
      player.x +
        player.facing * 34,
      player.y,
      "#b86cff",
      35,
      player.facing
    );

    for (const enemy of enemies) {
      if (enemy.dead) continue;

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;

      const dist = Math.hypot(dx, dy);

      if (
        dist < 105 + enemy.radius &&
        dx * player.facing > -15
      ) {
        damageEnemy(
          enemy,
          55,
          "#c97bff"
        );

        hitEnemies.push(enemy);
      }
    }

    // Delayed second impact.
    effects.push({
      type: "divergentDelay",

      x: player.x +
        player.facing * 45,

      y: player.y,

      targets: hitEnemies,

      delay: 0.28,
      life: 0.4,
      maxLife: 0.4,

      activated: false
    });

    say("DIVERGENT FIST!", 1.2);

    checkChapterClear();
  }

  // ==========================================
  // FLAME ARROW — K
  // ==========================================

  function flameArrow() {
    if (!canAttack()) return;
    if (player.flameCd > 0) return;

    player.flameCd = 1.5;

    player.attacking = 0.2;
    player.attackType = "flame";

    const direction = player.facing;

    const x =
      player.x + direction * 25;

    const y = player.y - 5;

    projectiles.push({
      type: "flame",

      x: x,
      y: y,

      vx: direction * 480,
      vy: 0,

      radius: 12,

      damage:
        takeoverComplete ? 75 : 48,

      color: "#ff7624",

      life: 1.6,

      enemyOwned: false
    });

    particles(
      x,
      y,
      "#ff8a24",
      15,
      145
    );

    say("FLAME ARROW!", 0.8);
  }

  // ==========================================
  // ENEMY MOVEMENT AND ATTACKS
  // ==========================================

  function updateEnemies(dt) {
    if (!started) return;

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

      const dist = Math.hypot(dx, dy);

      const nx =
        dist > 0 ? dx / dist : 0;

      const ny =
        dist > 0 ? dy / dist : 0;

      // Boss has ranged attacks.
      if (enemy.type === "boss") {
        updateBoss(
          enemy,
          dt,
          nx,
          ny,
          dist
        );

        continue;
      }

      // Enemies chase the player.
      if (
        dist >
        player.radius +
          enemy.radius +
          4
      ) {
        enemy.x +=
          nx * enemy.speed * dt;

        enemy.y +=
          ny * enemy.speed * dt;
      }

      // Contact attack.
      if (
        dist <
          player.radius +
          enemy.radius +
          8 &&
        enemy.attackCd <= 0
      ) {
        damagePlayer(enemy.damage);

        enemy.attackCd = 1.1;

        particles(
          player.x,
          player.y,
          "#ff3d55",
          8,
          85
        );
      }

      enemy.x = clamp(
        enemy.x,
        enemy.radius,
        W - enemy.radius
      );

      enemy.y = clamp(
        enemy.y,
        65 + enemy.radius,
        H - enemy.radius
      );
    }

    checkChapterClear();
  }

  // ==========================================
  // PURPLE KING BOSS AI
  // ==========================================

  function updateBoss(
    boss,
    dt,
    nx,
    ny,
    dist
  ) {
    // Chase the player until in range.
    if (dist > 175) {
      boss.x +=
        nx * boss.speed * dt;

      boss.y +=
        ny * boss.speed * dt;
    }

    // Very close-range attack.
    if (
      dist <
        boss.radius +
          player.radius +
          15 &&
      boss.attackCd <= 0
    ) {
      damagePlayer(
        boss.damage
      );

      explosion(
        boss.x,
        boss.y,
        "#a23bff",
        75,
        0.35
      );

      boss.attackCd = 1.4;

      shake = 6;
    }

    // Purple toxic projectile.
    if (
      boss.shootCd <= 0 &&
      dist < 650
    ) {
      shootBossProjectile(
        boss,
        nx,
        ny
      );

      boss.shootCd =
        rand(0.8, 1.5);
    }

    boss.x = clamp(
      boss.x,
      boss.radius,
      W - boss.radius
    );

    boss.y = clamp(
      boss.y,
      65 + boss.radius,
      H - boss.radius
    );
  }

  // ==========================================
  // PURPLE KING TOXIC PROJECTILE
  // ==========================================

  function shootBossProjectile(
    boss,
    nx,
    ny
  ) {
    const speed = 260;

    projectiles.push({
      type: "poison",

      x: boss.x,
      y: boss.y,

      vx: nx * speed,
      vy: ny * speed,

      radius: 14,

      damage: 15,

      color: "#ae27e8",

      life: 3,

      enemyOwned: true
    });

    particles(
      boss.x,
      boss.y,
      "#bb43ff",
      12,
      125
    );
  }

  // ==========================================
  // UPDATE PROJECTILES
  // ==========================================

  function updateProjectiles(dt) {
    for (
      let i = projectiles.length - 1;
      i >= 0;
      i--
    ) {
      const p = projectiles[i];

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.life -= dt;

      let remove = false;

      // Enemy projectiles hit player.
      if (p.enemyOwned) {
        const dist = distance(
          p.x,
          p.y,
          player.x,
          player.y
        );

        if (
          dist <
          p.radius + player.radius
        ) {
          damagePlayer(p.damage);

          explosion(
            p.x,
            p.y,
            "#ad2bff",
            43,
            0.24
          );

          remove = true;
        }
      } else {
        // Player projectiles hit enemies.
        for (const enemy of enemies) {
          if (enemy.dead) continue;

          const dist = distance(
            p.x,
            p.y,
            enemy.x,
            enemy.y
          );

          if (
            dist <
            p.radius + enemy.radius
          ) {
            damageEnemy(
              enemy,
              p.damage,
              "#ffae42"
            );

            explosion(
              p.x,
              p.y,
              "#ff7926",
              48,
              0.3
            );

            remove = true;
            break;
          }
        }
      }

      if (
        p.life <= 0 ||
        p.x < -50 ||
        p.x > W + 50 ||
        p.y < -50 ||
        p.y > H + 50
      ) {
        remove = true;
      }

      if (remove) {
        projectiles.splice(i, 1);
      }
    }

    checkChapterClear();
  }

  // ==========================================
  // HANDLE COOLDOWNS
  // ==========================================

  function updateCooldowns(dt) {
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

    player.invincible = Math.max(
      0,
      player.invincible - dt
    );

    player.attacking = Math.max(
      0,
      player.attacking - dt
    );
  }

  // ==========================================
  // END OF PART 3
  // ==========================================

  // DO NOT ADD })(); YET.
  // PART 4 CONTINUES DIRECTLY BELOW.

  // ==========================================
  // PART 4 — GRAPHICS AND ANIMATIONS
  // ==========================================

  // ==========================================
  // DRAW PIXEL-ART BACKGROUNDS
  // ==========================================

  function drawBackground() {
    const info = currentChapter();

    ctx.fillStyle = info.sky;
    ctx.fillRect(0, 0, W, H);

    // Distant hills and scenery.
    for (let i = 0; i < 12; i++) {
      const x = i * 100 - 30;
      const height =
        80 + Math.sin(i * 2.7) * 40;

      ctx.fillStyle =
        chapter === 1
          ? "#a8c8d9"
          : chapter === 2
            ? "#aa7743"
            : chapter >= 3
              ? "#211c30"
              : "#173f35";

      ctx.beginPath();
      ctx.moveTo(x, 350);
      ctx.lineTo(x + 60, 350 - height);
      ctx.lineTo(x + 130, 350);
      ctx.fill();
    }

    // Ground.
    ctx.fillStyle = info.ground;
    ctx.fillRect(0, 340, W, 200);

    // Ground detail.
    for (let i = 0; i < 65; i++) {
      const x = (i * 137 + 42) % W;
      const y = 350 + (i * 67) % 180;

      ctx.fillStyle =
        i % 3 === 0
          ? "rgba(255,255,255,0.12)"
          : "rgba(0,0,0,0.12)";

      ctx.fillRect(x, y, 9, 4);
    }

    // Forest: trees.
    if (chapter === 0) {
      for (let i = 0; i < 8; i++) {
        const x = 35 + i * 128;
        const y = 305 + (i % 2) * 35;

        ctx.fillStyle = "#65402b";
        ctx.fillRect(x, y, 16, 65);

        ctx.fillStyle = "#236846";
        ctx.fillRect(x - 25, y - 43, 66, 53);

        ctx.fillStyle = "#31965a";
        ctx.fillRect(x - 15, y - 57, 46, 35);
      }
    }

    // Snowy mountains.
    if (chapter === 1) {
      for (let i = 0; i < 7; i++) {
        const x = i * 155;

        ctx.fillStyle = "#eaf8ff";
        ctx.beginPath();
        ctx.moveTo(x, 355);
        ctx.lineTo(x + 70, 160);
        ctx.lineTo(x + 145, 355);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(x + 45, 230);
        ctx.lineTo(x + 70, 160);
        ctx.lineTo(x + 95, 230);
        ctx.fill();
      }
    }

    // Desert dunes.
    if (chapter === 2) {
      ctx.fillStyle = "#d7a760";

      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(
          i * 230,
          365,
          160,
          45,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Underground stalactites.
    if (chapter === 4 || chapter === 5) {
      ctx.fillStyle = "#171221";

      for (let i = 0; i < 20; i++) {
        const x = i * 52;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 26, 80 + (i % 4) * 25);
        ctx.lineTo(x + 52, 0);
        ctx.fill();
      }
    }

    // Final boss arena.
    if (chapter === 7) {
      ctx.strokeStyle = "#69319f";
      ctx.lineWidth = 5;

      ctx.beginPath();
      ctx.ellipse(
        W / 2,
        H / 2 + 95,
        275,
        115,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.strokeStyle = "#a448e8";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(
        W / 2,
        H / 2 + 95,
        225,
        85,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Dark overlay for later chapters.
    if (chapter >= 3 && chapter <= 6) {
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ==========================================
  // DRAW THE PLAYER
  // ==========================================

  function drawPlayer() {
    if (
      player.invincible > 0 &&
      Math.floor(elapsed * 15) % 2 === 0
    ) {
      return;
    }

    const x = Math.round(player.x);
    const y = Math.round(player.y);

    const moving =
      keys["w"] ||
      keys["a"] ||
      keys["s"] ||
      keys["d"] ||
      keys["arrowup"] ||
      keys["arrowdown"] ||
      keys["arrowleft"] ||
      keys["arrowright"];

    const bob = moving
      ? Math.sin(elapsed * 13) * 3
      : Math.sin(elapsed * 3) * 1.5;

    ctx.save();
    ctx.translate(x, y + bob);

    // Shadow.
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(
      0, 21, 20, 7, 0,
      0, Math.PI * 2
    );
    ctx.fill();

    // Legs.
    ctx.fillStyle = "#242432";
    ctx.fillRect(-13, 8, 10, 20);
    ctx.fillRect(4, 8, 10, 20);

    // Body.
    ctx.fillStyle =
      takeoverComplete
        ? "#130f1b"
        : "#326bba";

    ctx.fillRect(-16, -18, 32, 32);

    // Head.
    ctx.fillStyle =
      takeoverComplete
        ? "#1b1724"
        : "#e5ad83";

    ctx.fillRect(-13, -37, 26, 23);

    // Hair / helmet.
    ctx.fillStyle =
      takeoverComplete
        ? "#08070c"
        : "#4d2f25";

    ctx.fillRect(-15, -41, 30, 11);

    // Eyes.
    ctx.fillStyle =
      takeoverComplete
        ? "#ff244c"
        : "#20202a";

    ctx.fillRect(
      player.facing === 1 ? 4 : -8,
      -27,
      5,
      4
    );

    // Black dragon armor.
    if (takeoverComplete) {
      ctx.fillStyle = "#08070d";

      // Shoulder armor.
      ctx.fillRect(-25, -19, 14, 17);
      ctx.fillRect(11, -19, 14, 17);

      // Chest armor.
      ctx.fillRect(-14, -10, 28, 18);

      ctx.fillStyle = "#a91b3a";
      ctx.fillRect(-4, -8, 8, 15);

      // Dragon horns.
      ctx.fillStyle = "#08070d";

      ctx.beginPath();
      ctx.moveTo(-13, -36);
      ctx.lineTo(-20, -57);
      ctx.lineTo(-4, -39);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(13, -36);
      ctx.lineTo(20, -57);
      ctx.lineTo(4, -39);
      ctx.fill();

      // Dark aura.
      ctx.strokeStyle =
        "rgba(222,38,75,0.55)";

      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(
        0,
        -8,
        29 + Math.sin(elapsed * 7) * 3,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Sword.
    if (
      player.attacking > 0 &&
      player.attackType === "sword"
    ) {
      ctx.strokeStyle = "#e5f5ff";
      ctx.lineWidth = 7;

      ctx.beginPath();
      ctx.moveTo(
        player.facing * 15,
        -10
      );
      ctx.lineTo(
        player.facing * 61,
        -36
      );
      ctx.stroke();

      ctx.strokeStyle = "#8ec8e7";
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(
        player.facing * 22,
        -10,
        48,
        -1.2,
        0.9
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // DRAW ENEMIES
  // ==========================================

  function drawEnemies() {
    for (const enemy of enemies) {
      if (enemy.dead) continue;

      const x = Math.round(enemy.x);
      const y = Math.round(enemy.y);

      const bob =
        Math.sin(enemy.animation) * 4;

      ctx.save();
      ctx.translate(x, y + bob);

      // Shadow.
      ctx.fillStyle =
        "rgba(0,0,0,0.35)";

      ctx.beginPath();
      ctx.ellipse(
        0,
        enemy.radius + 8,
        enemy.radius,
        7,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      const r = enemy.radius;

      if (enemy.type === "boss") {
        drawPurpleKing(enemy);
      } else {
        // Monster body.
        ctx.fillStyle =
          enemy.flash > 0
            ? "#ffffff"
            : enemy.color;

        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          r,
          r * 1.1,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Monster horns.
        ctx.fillStyle =
          enemy.flash > 0
            ? "#ffffff"
            : "#202030";

        ctx.beginPath();
        ctx.moveTo(-r + 3, -r / 2);
        ctx.lineTo(-r - 7, -r - 13);
        ctx.lineTo(-3, -r + 3);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(r - 3, -r / 2);
        ctx.lineTo(r + 7, -r - 13);
        ctx.lineTo(3, -r + 3);
        ctx.fill();

        // Eyes.
        ctx.fillStyle =
          chapter >= 3
            ? "#ff365d"
            : "#111111";

        ctx.fillRect(
          -10,
          -5,
          6,
          6
        );

        ctx.fillRect(
          5,
          -5,
          6,
          6
        );

        // Mouth.
        ctx.fillStyle = "#17101b";
        ctx.fillRect(-5, 7, 11, 4);
      }

      // Enemy health bar.
      const barWidth =
        enemy.type === "boss"
          ? 105
          : 42;

      const barY = -r - 33;

      ctx.fillStyle = "#19191e";

      ctx.fillRect(
        -barWidth / 2,
        barY,
        barWidth,
        7
      );

      ctx.fillStyle =
        enemy.type === "boss"
          ? "#b13aff"
          : "#e64b5c";

      ctx.fillRect(
        -barWidth / 2,
        barY,
        barWidth *
          clamp(
            enemy.hp / enemy.maxHp,
            0,
            1
          ),
        7
      );

      ctx.restore();
    }
  }

  // ==========================================
  // DRAW THE PURPLE KING
  // ==========================================

  function drawPurpleKing(boss) {
    const pulse =
      Math.sin(elapsed * 5) * 4;

    // Purple aura.
    ctx.strokeStyle =
      "rgba(179,52,255,0.45)";

    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.arc(
      0,
      0,
      61 + pulse,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Cloak.
    ctx.fillStyle = "#291037";

    ctx.beginPath();
    ctx.moveTo(-40, -16);
    ctx.lineTo(-53, 65);
    ctx.lineTo(53, 65);
    ctx.lineTo(40, -16);
    ctx.fill();

    // Body armor.
    ctx.fillStyle =
      boss.flash > 0
        ? "#ffffff"
        : "#60209f";

    ctx.fillRect(-36, -30, 72, 76);

    // Head.
    ctx.fillStyle = "#3c155c";
    ctx.fillRect(-29, -65, 58, 39);

    // Crown.
    ctx.fillStyle = "#d39aff";

    ctx.beginPath();
    ctx.moveTo(-35, -64);
    ctx.lineTo(-30, -94);
    ctx.lineTo(-13, -72);
    ctx.lineTo(0, -108);
    ctx.lineTo(13, -72);
    ctx.lineTo(30, -94);
    ctx.lineTo(35, -64);
    ctx.fill();

    // Glowing eyes.
    ctx.fillStyle = "#ff2f8a";
    ctx.fillRect(-18, -50, 12, 8);
    ctx.fillRect(7, -50, 12, 8);

    // Chest gem.
    ctx.fillStyle = "#dd43ff";

    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(13, 2);
    ctx.lineTo(0, 20);
    ctx.lineTo(-13, 2);
    ctx.fill();

    // Arms.
    ctx.fillStyle = "#411669";
    ctx.fillRect(-48, -20, 15, 58);
    ctx.fillRect(33, -20, 15, 58);
  }

  // ==========================================
  // DRAW PROJECTILES
  // ==========================================

  function drawProjectiles() {
    for (const p of projectiles) {
      ctx.save();

      if (p.type === "flame") {
        // Flame trail.
        ctx.fillStyle =
          "rgba(255,120,20,0.35)";

        ctx.beginPath();
        ctx.ellipse(
          p.x - Math.sign(p.vx) * 16,
          p.y,
          23,
          9,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#ff5c18";

        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          p.radius,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#ffeb6d";

        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else if (p.type === "poison") {
        ctx.fillStyle =
          "rgba(177,40,255,0.25)";

        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          p.radius + 10,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#9925dd";

        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          p.radius,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#ed9dff";

        ctx.beginPath();
        ctx.arc(
          p.x - 4,
          p.y - 4,
          5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // ==========================================
  // UPDATE VISUAL EFFECTS
  // ==========================================

  function updateEffects(dt) {
    for (
      let i = effects.length - 1;
      i >= 0;
      i--
    ) {
      const e = effects[i];

      e.life -= dt;

      if (e.type === "particle") {
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        e.vx *= Math.max(
          0,
          1 - dt * 2
        );

        e.vy *= Math.max(
          0,
          1 - dt * 2
        );
      }

      // Spin the Water Wheel.
      if (e.type === "waterWheel") {
        e.rotation += dt * 12;
      }

      // Divergent Fist's delayed hit.
      if (
        e.type === "divergentDelay" &&
        !e.activated
      ) {
        e.delay -= dt;

        if (e.delay <= 0) {
          e.activated = true;

          explosion(
            e.x,
            e.y,
            "#d78cff",
            75,
            0.3
          );

          particles(
            e.x,
            e.y,
            "#b84bff",
            25,
            180
          );

          for (const enemy of e.targets) {
            if (!enemy.dead) {
              damageEnemy(
                enemy,
                85,
                "#e19aff"
              );
            }
          }

          shake = 8;

          checkChapterClear();
        }
      }

      if (e.life <= 0) {
        effects.splice(i, 1);
      }
    }
  }

  // ==========================================
  // DRAW ALL VISUAL EFFECTS
  // ==========================================

  function drawEffects() {
    for (const e of effects) {
      const alpha = clamp(
        e.life / e.maxLife,
        0,
        1
      );

      ctx.save();
      ctx.globalAlpha = alpha;

      if (e.type === "particle") {
        ctx.fillStyle = e.color;

        ctx.fillRect(
          e.x,
          e.y,
          e.size,
          e.size
        );
      }

      if (e.type === "explosion") {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 8 * alpha;

        ctx.beginPath();

        ctx.arc(
          e.x,
          e.y,
          e.radius * (1 - alpha * 0.5),
          0,
          Math.PI * 2
        );

        ctx.stroke();
      }

      if (e.type === "slash") {
        ctx.translate(e.x, e.y);

        ctx.scale(
          e.direction,
          1
        );

        ctx.strokeStyle = e.color;
        ctx.lineWidth = 7 * alpha;

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          e.radius,
          -1.1,
          1.1
        );

        ctx.stroke();
      }

      // ======================================
      // ANIMATED WATER WHEEL
      // ======================================

      if (e.type === "waterWheel") {
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rotation);

        const radius =
          e.radius *
          (0.7 + (1 - alpha) * 0.3);

        // Outer blue water ring.
        ctx.strokeStyle = "#36bfff";
        ctx.lineWidth = 11;
        ctx.lineCap = "round";

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          radius,
          -0.4,
          Math.PI * 1.5
        );

        ctx.stroke();

        // Inner white water ring.
        ctx.strokeStyle = "#c8f8ff";
        ctx.lineWidth = 5;

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          radius * 0.78,
          0.4,
          Math.PI * 1.9
        );

        ctx.stroke();

        // Eight flowing water streams.
        for (let j = 0; j < 8; j++) {
          const a =
            j * Math.PI / 4;

          ctx.strokeStyle =
            j % 2 === 0
              ? "#62e5ff"
              : "#148bc8";

          ctx.lineWidth = 5;

          ctx.beginPath();

          ctx.moveTo(
            Math.cos(a) * radius * 0.3,
            Math.sin(a) * radius * 0.3
          );

          ctx.quadraticCurveTo(
            Math.cos(a + 0.3) *
              radius * 0.75,

            Math.sin(a + 0.3) *
              radius * 0.75,

            Math.cos(a + 0.55) *
              radius,

            Math.sin(a + 0.55) *
              radius
          );

          ctx.stroke();
        }

        // Flying water droplets.
        ctx.fillStyle = "#d8fbff";

        for (let j = 0; j < 12; j++) {
          const a =
            j * Math.PI / 6;

          ctx.fillRect(
            Math.cos(a) *
              (radius + 5),

            Math.sin(a) *
              (radius + 5),

            5,
            8
          );
        }
      }

      // ======================================
      // BLACK FLASH LIGHTNING
      // ======================================

      if (e.type === "lightning") {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 5 * alpha;

        const dx =
          Math.cos(e.angle);

        const dy =
          Math.sin(e.angle);

        ctx.beginPath();
        ctx.moveTo(e.x, e.y);

        ctx.lineTo(
          e.x + dx * e.radius * 0.4,
          e.y + dy * e.radius * 0.4
        );

        ctx.lineTo(
          e.x + dx * e.radius * 0.65 -
            dy * 18,

          e.y + dy * e.radius * 0.65 +
            dx * 18
        );

        ctx.lineTo(
          e.x + dx * e.radius,
          e.y + dy * e.radius
        );

        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ==========================================
  // BLACK SPIRIT TAKEOVER CUTSCENE
  // ==========================================

  function updateCutscene(dt) {
    if (!cutscene) return;

    cutscene.time += dt;

    const t = cutscene.time;

    // Rising dark energy.
    if (Math.random() < 0.8) {
      particles(
        player.x + rand(-35, 35),
        player.y + rand(-10, 40),
        Math.random() < 0.5
          ? "#100a17"
          : "#ff2858",
        2,
        85
      );
    }

    if (t >= cutscene.duration) {
      cutscene = null;

      takeoverComplete = true;
      player.armor = true;

      player.hp = player.maxHp;

      say(
        "BLACK SPIRIT AWAKENED! " +
        "M = BLACK FLASH, " +
        "N = DIVERGENT FIST!",
        6
      );

      refreshUI();
    }
  }

  function drawCutscene() {
    drawBackground();
    drawEnemies();
    drawPlayer();

    ctx.fillStyle =
      "rgba(0,0,0,0.68)";

    ctx.fillRect(0, 0, W, H);

    const progress = clamp(
      cutscene.time /
        cutscene.duration,
      0,
      1
    );

    const radius =
      20 + progress * 170;

    // Black energy sphere.
    ctx.fillStyle =
      "rgba(17,8,26,0.9)";

    ctx.beginPath();

    ctx.arc(
      player.x,
      player.y - 12,
      radius,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // Crimson energy ring.
    ctx.strokeStyle = "#e1214d";
    ctx.lineWidth = 6;

    ctx.beginPath();

    ctx.arc(
      player.x,
      player.y - 12,
      radius + 12,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    // Glowing eyes.
    ctx.fillStyle = "#ff224f";

    ctx.fillRect(
      player.x - 24,
      player.y - 30,
      16,
      8
    );

    ctx.fillRect(
      player.x + 9,
      player.y - 30,
      16,
      8
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "#ff3861";
    ctx.font = "bold 30px monospace";

    ctx.fillText(
      "THE BLACK SPIRIT",
      W / 2,
      85
    );

    ctx.fillStyle = "#eeeeee";
    ctx.font = "18px monospace";

    ctx.fillText(
      progress < 0.5
        ? "Something is taking control..."
        : "Your power is awakening...",
      W / 2,
      120
    );

    ctx.textAlign = "left";
  }

  // ==========================================
  // BLACK SPIRIT DEPARTURE CUTSCENE
  // ==========================================

  function updateSpiritDeparture(dt) {
    if (!spiritDeparture) return;

    spiritDeparture.time += dt;

    if (Math.random() < 0.7) {
      particles(
        player.x + rand(-25, 25),
        player.y + rand(-10, 35),
        "#96254e",
        2,
        100
      );
    }

    if (
      spiritDeparture.time >=
      spiritDeparture.duration
    ) {
      spiritDeparture = null;

      victory = true;
      started = false;

      // Powers stay unlocked!
      takeoverComplete = true;
      player.armor = true;

      say(
        "THE BLACK SPIRIT HAS LEFT. " +
        "YOUR POWERS REMAIN!",
        8
      );

      refreshUI();
    }
  }

  function drawSpiritDeparture() {
    drawBackground();
    drawPlayer();
    drawEffects();

    const t = spiritDeparture.time;

    const fade = clamp(
      1 -
        t /
        spiritDeparture.duration,
      0,
      1
    );

    const rise = t * 55;

    ctx.fillStyle =
      "rgba(0,0,0,0.45)";

    ctx.fillRect(0, 0, W, H);

    // Spirit rises out of the player.
    ctx.save();

    ctx.globalAlpha = fade;

    ctx.fillStyle = "#100b18";

    ctx.beginPath();

    ctx.ellipse(
      player.x + 14,
      player.y - rise,
      35 + t * 9,
      52 + t * 6,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // Spirit eyes.
    ctx.fillStyle = "#ff1948";

    ctx.fillRect(
      player.x + 2,
      player.y - rise - 12,
      9,
      5
    );

    ctx.fillRect(
      player.x + 21,
      player.y - rise - 12,
      9,
      5
    );

    ctx.restore();

    ctx.textAlign = "center";

    ctx.fillStyle = "#ff527b";
    ctx.font = "bold 26px monospace";

    ctx.fillText(
      "THE BLACK SPIRIT DEPARTS",
      W / 2,
      76
    );

    ctx.fillStyle = "#eeeeee";
    ctx.font = "16px monospace";

    ctx.fillText(
      "You are free. Your powers remain.",
      W / 2,
      108
    );

    ctx.textAlign = "left";
  }

  // ==========================================
  // DRAW HUD
  // ==========================================

  function drawHUD() {
    // HUD background.
    ctx.fillStyle =
      "rgba(5,5,12,0.82)";

    ctx.fillRect(0, 0, W, 56);

    // Chapter text.
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px monospace";

    ctx.fillText(
      "CHAPTER " +
        (chapter + 1) +
        " — " +
        currentChapter().name,
      15,
      22
    );

    // Health bar.
    ctx.fillStyle = "#401c27";
    ctx.fillRect(15, 32, 205, 13);

    ctx.fillStyle = "#ec3856";

    ctx.fillRect(
      15,
      32,
      205 *
        (player.hp / player.maxHp),
      13
    );

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    ctx.strokeRect(
      15,
      32,
      205,
      13
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px monospace";

    ctx.fillText(
      Math.ceil(player.hp) +
        " / " +
        player.maxHp,
      80,
      43
    );

    // Remaining enemy count.
    const remaining = enemies.filter(
      enemy => !enemy.dead
    ).length;

    ctx.font = "bold 14px monospace";

    ctx.fillText(
      "ENEMIES: " + remaining,
      W - 155,
      25
    );

    // Message at bottom.
    if (messageTimer > 0) {
      ctx.textAlign = "center";

      ctx.fillStyle =
        "rgba(0,0,0,0.75)";

      ctx.fillRect(
        120,
        H - 70,
        W - 240,
        45
      );

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px monospace";

      ctx.fillText(
        message,
        W / 2,
        H - 42
      );

      ctx.textAlign = "left";
    }

    // Chapter cleared overlay.
    if (chapterCleared && !victory) {
      ctx.fillStyle =
        "rgba(0,0,0,0.55)";

      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";

      ctx.fillStyle = "#6eff91";
      ctx.font = "bold 36px monospace";

      ctx.fillText(
        "CHAPTER CLEARED!",
        W / 2,
        190
      );

      ctx.fillStyle = "#eeeeee";
      ctx.font = "17px monospace";

      ctx.fillText(
        "All enemies defeated!",
        W / 2,
        230
      );

      ctx.fillText(
        "Continue using the button inside the game.",
        W / 2,
        260
      );

      ctx.textAlign = "left";
    }

    // Game over overlay.
    if (gameOver) {
      ctx.fillStyle =
        "rgba(0,0,0,0.75)";

      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";

      ctx.fillStyle = "#ff3c56";
      ctx.font = "bold 44px monospace";

      ctx.fillText(
        "GAME OVER",
        W / 2,
        H / 2
      );

      ctx.fillStyle = "#eeeeee";
      ctx.font = "18px monospace";

      ctx.fillText(
        "Press Restart Game to try again.",
        W / 2,
        H / 2 + 42
      );

      ctx.textAlign = "left";
    }

    // Victory overlay.
    if (victory) {
      ctx.fillStyle =
        "rgba(0,0,0,0.82)";

      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";

      ctx.fillStyle = "#adffbd";
      ctx.font = "bold 40px monospace";

      ctx.fillText(
        "YOU SAVED THE VILLAGERS!",
        W / 2,
        H / 2 - 55
      );

      ctx.fillStyle = "#ffffff";
      ctx.font = "18px monospace";

      ctx.fillText(
        "The Purple King has fallen.",
        W / 2,
        H / 2
      );

      ctx.fillText(
        "The Black Spirit is gone.",
        W / 2,
        H / 2 + 32
      );

      ctx.fillStyle = "#ff5f88";

      ctx.fillText(
        "But its powers remain within you.",
        W / 2,
        H / 2 + 65
      );

      ctx.textAlign = "left";
    }
  }

  // ==========================================
  // END OF PART 4
  // ==========================================

  // DON'T CLOSE THE MAIN FUNCTION YET.
  // PART 5 GOES DIRECTLY UNDER THIS.

  // ==========================================
  // PART 5 — GAME CONTROLS AND MAIN LOOP
  // ==========================================

  // ==========================================
  // UPDATE THE GAME INTERFACE
  // ==========================================

  function refreshUI() {
    const info = currentChapter();

    chapterText.textContent =
      "Chapter " +
      (chapter + 1) +
      " of " +
      chapters.length +
      " — " +
      info.name;

    // Display the correct game status.
    if (victory) {
      statusText.textContent =
        "VICTORY! The Purple King has fallen. " +
        "The Black Spirit has departed, " +
        "but your powers remain.";

    } else if (gameOver) {
      statusText.textContent =
        "Game Over! Press Restart Game.";

    } else if (spiritDeparture) {
      statusText.textContent =
        "The Black Spirit is leaving your body...";

    } else if (cutscene) {
      statusText.textContent =
        "The Black Spirit is taking over!";

    } else if (chapterCleared) {
      statusText.textContent =
        "Chapter cleared! Use the green " +
        "Continue button inside the game.";

    } else if (started) {
      const remaining = enemies.filter(
        enemy => !enemy.dead
      ).length;

      statusText.textContent =
        info.description +
        " Enemies remaining: " +
        remaining;

    } else {
      statusText.textContent =
        "Press Start Adventure to begin!";
    }

    // ========================================
    // NEXT CHAPTER BUTTON INSIDE CANVAS
    // ========================================

    chapterButton.style.display =
      chapterCleared &&
      !victory &&
      !gameOver
        ? "block"
        : "none";

    chapterButton.textContent =
      chapter === chapters.length - 1
        ? "Finish Game"
        : "Continue to Next Chapter";

    // ========================================
    // START BUTTON
    // ========================================

    if (victory) {
      startButton.textContent =
        "Game Completed";

      startButton.disabled = true;

    } else if (gameOver) {
      startButton.textContent =
        "Restart Required";

      startButton.disabled = true;

    } else if (chapterCleared) {
      startButton.textContent =
        "Chapter Cleared";

      startButton.disabled = true;

    } else if (started) {
      startButton.textContent =
        "Adventure Running";

      startButton.disabled = true;

    } else {
      startButton.textContent =
        "Start Adventure";

      startButton.disabled = false;
    }

    // ========================================
    // SKILL BUTTON NAMES
    // ========================================

    if (takeoverComplete) {
      skillLabel.textContent =
        "M — Black Flash";

      divergentLabel.textContent =
        "N — Divergent Fist";

    } else {
      skillLabel.textContent =
        "M — Water Wheel";

      divergentLabel.textContent =
        "N — Locked";
    }

    // ========================================
    // COOLDOWN TEXT
    // ========================================

    function cooldownText(value) {
      return value > 0
        ? value.toFixed(1) + "s"
        : "Ready";
    }

    swordCDLabel.textContent =
      "Sword: " +
      cooldownText(player.swordCd);

    skillCDLabel.textContent =
      (takeoverComplete
        ? "Black Flash: "
        : "Water Wheel: ") +
      cooldownText(player.skillCd);

    divergentCDLabel.textContent =
      takeoverComplete
        ? "Divergent Fist: " +
          cooldownText(player.divergentCd)
        : "Divergent Fist: Locked";

    flameCDLabel.textContent =
      "Flame Arrow: " +
      cooldownText(player.flameCd);

    // ========================================
    // ENABLE AND DISABLE ATTACK BUTTONS
    // ========================================

    swordLabel.disabled =
      !canAttack() ||
      player.swordCd > 0;

    skillLabel.disabled =
      !canAttack() ||
      player.skillCd > 0;

    divergentLabel.disabled =
      !canAttack() ||
      !takeoverComplete ||
      player.divergentCd > 0;

    flameLabel.disabled =
      !canAttack() ||
      player.flameCd > 0;
  }

  // ==========================================
  // START ADVENTURE BUTTON
  // ==========================================

  startButton.addEventListener(
    "click",
    () => {
      if (
        !started &&
        !chapterCleared &&
        !gameOver &&
        !victory
      ) {
        beginChapter();
      }
    }
  );

  // ==========================================
  // RESTART BUTTON
  // ==========================================

  $("dwRestart").addEventListener(
    "click",
    () => {
      resetGame();
    }
  );

  // ==========================================
  // DIFFICULTY SELECTOR
  // ==========================================

  difficultySelect.addEventListener(
    "change",
    () => {
      resetGame();

      say(
        "Difficulty changed to " +
        difficultySelect.value.toUpperCase() +
        "!",
        3
      );
    }
  );

  // ==========================================
  // CONTINUE TO NEXT CHAPTER
  // ==========================================

  chapterButton.addEventListener(
    "click",
    () => {
      if (
        chapterCleared &&
        !gameOver &&
        !victory
      ) {
        beginChapter();
      }
    }
  );

  // ==========================================
  // CLICKABLE ATTACK BUTTONS
  // ==========================================

  swordLabel.addEventListener(
    "click",
    () => {
      swordAttack();
    }
  );

  skillLabel.addEventListener(
    "click",
    () => {
      if (takeoverComplete) {
        blackFlash();
      } else {
        waterWheel();
      }
    }
  );

  divergentLabel.addEventListener(
    "click",
    () => {
      divergentFist();
    }
  );

  flameLabel.addEventListener(
    "click",
    () => {
      flameArrow();
    }
  );

  // Clicking the game swings the sword.
  canvas.addEventListener(
    "click",
    () => {
      swordAttack();
    }
  );

  // ==========================================
  // KEYBOARD CONTROLS
  // ==========================================

  window.addEventListener(
    "keydown",
    event => {
      const key =
        event.key.toLowerCase();

      // Do not use game controls while
      // typing inside another input.
      const element = event.target;

      if (
        element instanceof HTMLElement &&
        (
          element.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"]
            .includes(element.tagName)
        )
      ) {
        return;
      }

      // Prevent the webpage scrolling
      // when using movement or Space.
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

      // Don't repeatedly trigger attacks
      // when a key is held down.
      if (event.repeat) return;

      // Sword — Space or J.
      if (
        key === " " ||
        key === "j"
      ) {
        swordAttack();
      }

      // M — Water Wheel / Black Flash.
      if (key === "m") {
        if (takeoverComplete) {
          blackFlash();
        } else {
          waterWheel();
        }
      }

      // N — Divergent Fist.
      if (key === "n") {
        divergentFist();
      }

      // K — Flame Arrow.
      if (key === "k") {
        flameArrow();
      }
    }
  );

  window.addEventListener(
    "keyup",
    event => {
      const key =
        event.key.toLowerCase();

      keys[key] = false;
    }
  );

  // Prevent movement getting stuck
  // after switching browser tabs.
  window.addEventListener(
    "blur",
    () => {
      for (const key in keys) {
        keys[key] = false;
      }
    }
  );

  // ==========================================
  // FULLSCREEN BUTTON
  // ==========================================

  fullscreenButton.addEventListener(
    "click",
    async () => {
      try {
        if (!document.fullscreenElement) {
          await gameFrame.requestFullscreen();

        } else {
          await document.exitFullscreen();
        }

      } catch (error) {
        say(
          "Fullscreen is not supported here.",
          3
        );
      }
    }
  );

  // Fullscreen appearance.
  document.addEventListener(
    "fullscreenchange",
    () => {
      if (document.fullscreenElement === gameFrame) {
        gameFrame.style.width = "100vw";
        gameFrame.style.height = "100vh";

        gameFrame.style.margin = "0";
        gameFrame.style.padding = "0";

        gameFrame.style.background = "#08080d";

        gameFrame.style.display = "flex";
        gameFrame.style.flexDirection = "column";

        gameFrame.style.alignItems = "center";
        gameFrame.style.justifyContent = "center";

        gameFrame.style.overflow = "auto";

        ui.style.width = "100%";
        ui.style.margin = "0";

        canvas.style.width = "100%";
        canvas.style.maxHeight = "85vh";

        canvas.style.objectFit = "contain";

        fullscreenButton.textContent =
          "⛶ Exit Full Screen";

      } else {
        gameFrame.style.width =
          "min(960px,100%)";

        gameFrame.style.height = "auto";
        gameFrame.style.margin = "12px auto";
        gameFrame.style.padding = "0";

        gameFrame.style.display = "block";
        gameFrame.style.overflow = "visible";

        canvas.style.width = "100%";
        canvas.style.maxHeight = "";
        canvas.style.objectFit = "";

        ui.style.width = "";
        ui.style.margin = "";

        fullscreenButton.textContent =
          "⛶ Full Screen";
      }
    }
  );

  // ==========================================
  // GAME UPDATE
  // ==========================================

  function update(dt) {
    elapsed += dt;

    // Update screen shake.
    shake = Math.max(
      0,
      shake - dt * 20
    );

    // Update message timer.
    messageTimer = Math.max(
      0,
      messageTimer - dt
    );

    // ========================================
    // BLACK SPIRIT TAKEOVER
    // ========================================

    if (cutscene) {
      updateCutscene(dt);
      updateEffects(dt);
      refreshUI();
      return;
    }

    // ========================================
    // BLACK SPIRIT DEPARTURE
    // ========================================

    if (spiritDeparture) {
      updateSpiritDeparture(dt);
      updateEffects(dt);
      refreshUI();
      return;
    }

    // ========================================
    // GAME PAUSED OR FINISHED
    // ========================================

    if (
      !started ||
      gameOver ||
      victory ||
      chapterCleared
    ) {
      updateEffects(dt);
      refreshUI();
      return;
    }

    // ========================================
    // ACTIVE GAMEPLAY
    // ========================================

    updateCooldowns(dt);

    movePlayer(dt);

    updateEnemies(dt);

    updateProjectiles(dt);

    updateEffects(dt);

    checkChapterClear();

    // Update all cooldown labels.
    refreshUI();
  }

  // ==========================================
  // DRAW THE GAME
  // ==========================================

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.save();

    // Screen shake after powerful attacks.
    if (shake > 0) {
      ctx.translate(
        rand(-shake, shake),
        rand(-shake, shake)
      );
    }

    // ========================================
    // BLACK SPIRIT TAKEOVER SCENE
    // ========================================

    if (cutscene) {
      drawCutscene();

      drawEffects();

      drawHUD();

      ctx.restore();
      return;
    }

    // ========================================
    // BLACK SPIRIT DEPARTURE SCENE
    // ========================================

    if (spiritDeparture) {
      drawSpiritDeparture();

      drawHUD();

      ctx.restore();
      return;
    }

    // ========================================
    // NORMAL GAME DRAWING
    // ========================================

    drawBackground();

    drawEnemies();

    drawPlayer();

    drawProjectiles();

    drawEffects();

    drawHUD();

    ctx.restore();
  }

  // ==========================================
  // MAIN ANIMATION LOOP
  // ==========================================

  let lastTime = 0;

  function gameLoop(timestamp) {
    if (!lastTime) {
      lastTime = timestamp;
    }

    // Convert milliseconds to seconds.
    let dt =
      (timestamp - lastTime) / 1000;

    lastTime = timestamp;

    // Prevent giant jumps when returning
    // from another browser tab.
    dt = Math.min(dt, 0.05);

    update(dt);

    draw();

    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // HIDE OLD WELCOME OVERLAY IF PRESENT
  // ==========================================

  const oldMessageBox =
    document.getElementById("messageBox");

  if (oldMessageBox) {
    oldMessageBox.style.display = "none";
  }

  // ==========================================
  // INITIALIZE THE GAME
  // ==========================================

  resetGame();

  requestAnimationFrame(gameLoop);

  console.log(
    "TheDarkWithin game engine loaded!"
  );

  console.log(
    "8 Chapters | Sword | Water Wheel | " +
    "Black Flash | Divergent Fist | " +
    "Flame Arrow | Purple King"
  );

  // ==========================================
  // END OF THEDARKWITHIN
  // ==========================================

})();
