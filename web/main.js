import init, { Model } from "../pkg/pico_8_palette_pal.js";

await init();         // MUST await this
const model = new Model();

const els = Object.fromEntries(
    [
        "spritesheet",
        "load-spritesheet-button",
    ].map( id => [id.replaceAll("-", "_"), document.getElementById(id)])
)
console.log(els)

const ctx = els.spritesheet.getContext("2d", { alpha: true });
spritesheet.width = 128;
spritesheet.height = 128;
ctx.imageSmoothingEnabled = false;

async function loadRgba(file) {
  const bitmap = await createImageBitmap(file);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);

  const offscreen_ctx = canvas.getContext("2d");

  offscreen_ctx.drawImage(bitmap, 0, 0);
  const imageData = offscreen_ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  const clamped = imageData.data;
  const rgba = new Uint8Array(
    clamped.buffer,
    clamped.byteOffset,
    clamped.byteLength
  );

  return rgba;
}

function draw() {
  const bytes = model.render_spritesheet_rgba();
  const img = new ImageData(new Uint8ClampedArray(bytes), 128, 128);
  ctx.putImageData(img, 0, 0);
}

els.load_spritesheet_button.addEventListener("change", async (ev) => {
    const f = ev.target.files[0];
    if (!f) {
        return;
    }
    var rgba = await loadRgba(f);
    console.log("model __wbg_ptr:", model.__wbg_ptr);
    if (rgba.length != (128 * 128 * 4)) {
        return;
    }
    model.load_spritesheet_rgba(rgba);

    draw();

    // Allow selecting the same file again
    ev.target.value = "";
});

draw();