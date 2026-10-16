
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
