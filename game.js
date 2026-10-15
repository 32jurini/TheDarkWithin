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
