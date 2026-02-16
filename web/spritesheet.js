import {els, model} from "../globals.js";
import { get_selected_spritelet } from "./spritelets.js";
import { onDrag } from "./utils.js";

const spritesheet_ctx = els.spritesheet.getContext("2d", { alpha: true });
const minimap_ctx = els.minimap.getContext("2d", { alpha: true });
els.spritesheet.width = 128
els.spritesheet.height = 128
els.minimap.width = 128
els.minimap.height = 128

var image_data = null;
var prev_zoom = 1;

function update_image() {
    image_data = new ImageData(
        new Uint8ClampedArray(
            model.render_spritesheet_rgba()
        ),
        128,
        128
    );
    draw_spritesheet();
    draw_minimap();
}

function draw_spritesheet() {
    const wh = 128 / els.spritesheet_zoom.valueAsNumber;
    var pan_x = els.spritesheet_pan_x.valueAsNumber;
    var pan_y = els.spritesheet_pan_y.valueAsNumber;
    spritesheet_ctx.putImageData(image_data, 0, 0);
    spritesheet_ctx.imageSmoothingEnabled = false;
    spritesheet_ctx.drawImage(els.spritesheet, pan_x, pan_y, wh, wh, 0, 0, 128, 128);
}

function draw_minimap() {
    minimap_ctx.putImageData(image_data, 0, 0);
    const x = els.spritesheet_pan_x.valueAsNumber;
    const y = els.spritesheet_pan_y.valueAsNumber;
    const z = 128 / els.spritesheet_zoom.valueAsNumber;

    minimap_ctx.save();

    minimap_ctx.fillStyle = "rgba(128, 128, 128, 0.5)";

    minimap_ctx.beginPath();
    minimap_ctx.rect(0, 0, 128, 128);
    minimap_ctx.rect(x, y, z, z);
    minimap_ctx.fill("evenodd");

    minimap_ctx.strokeStyle = "white";
    minimap_ctx.lineWidth = 1;
    minimap_ctx.strokeRect(
        Math.round(x) + 0.5,
        Math.round(y) + 0.5,
        Math.round(z) - 1,
        Math.round(z) - 1
    );

    minimap_ctx.restore();
}

function clamp_pan() {
    const limit = (128 - (128 / els.spritesheet_zoom.valueAsNumber));
    var pan_x = els.spritesheet_pan_x.valueAsNumber;
    var pan_y = els.spritesheet_pan_y.valueAsNumber;
    pan_x = Math.max(0, Math.min(pan_x, limit));
    pan_y = Math.max(0, Math.min(pan_y, limit));
    els.spritesheet_pan_x.valueAsNumber = pan_x;
    els.spritesheet_pan_y.valueAsNumber = pan_y;
}

els.load_spritesheet_button.addEventListener("change", async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) {
        return;
    }

    const bitmap = await createImageBitmap(f);

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

    console.log("hello")
    if (rgba.length != (128 * 128 * 4)) {
        return;
    }
    console.log("hi")
    model.load_spritesheet_rgba(rgba);
    update_image();
});

els.spritesheet_zoom.addEventListener("input", (e) => {
    var new_zoom = els.spritesheet_zoom.valueAsNumber;
    const limit = (128 - (128 / new_zoom));
    var pan_x = els.spritesheet_pan_x.valueAsNumber;
    var pan_y = els.spritesheet_pan_y.valueAsNumber;
    var shift = 64 * (new_zoom - prev_zoom) / (prev_zoom * new_zoom);
    pan_x += shift;
    pan_y += shift;

    pan_x = Math.max(0, Math.min(pan_x, limit));
    pan_y = Math.max(0, Math.min(pan_y, limit));
    els.spritesheet_pan_x.valueAsNumber = pan_x;
    els.spritesheet_pan_y.valueAsNumber = pan_y;

    prev_zoom = new_zoom;
    draw_spritesheet();
    draw_minimap();
    update_selector_box();
});

els.spritesheet_pan_x.addEventListener("input", (e) => {
    clamp_pan();
    draw_spritesheet();
    draw_minimap();
    update_selector_box();
});

els.spritesheet_pan_y.addEventListener("input", (e) => {
    clamp_pan();
    draw_spritesheet();
    draw_minimap();
    update_selector_box();
});

onDrag(els.minimap, (e) => {
    const rect = els.minimap.getBoundingClientRect();
    const offset = 64 / els.spritesheet_zoom.valueAsNumber;
    els.spritesheet_pan_x.valueAsNumber = 128 * (e.clientX - rect.left) / rect.width - offset;
    els.spritesheet_pan_y.valueAsNumber = 128 * (e.clientY - rect.top) / rect.height - offset;
    clamp_pan();
    draw_spritesheet();
    draw_minimap();
    update_selector_box();
});

// Layout behaviour that flex can't acheive.
new ResizeObserver(entries => {
    const { height } = entries[0].contentRect;
    els.spritesheet.style.width = height + "px";
}).observe(els.spritesheet);

export function update_selector_box() {
    const spritelet = get_selected_spritelet();
    const zoom = els.spritesheet_zoom.valueAsNumber;
    var pan_x = els.spritesheet_pan_x.valueAsNumber;
    var pan_y = els.spritesheet_pan_y.valueAsNumber;
    const rel_l = (spritelet.region.x - pan_x) * zoom / 128;
    const rel_t = (spritelet.region.y - pan_y) * zoom / 128;
    const rel_r = (spritelet.region.x + spritelet.region.w - pan_x) * zoom / 128;
    const rel_b = (spritelet.region.y + spritelet.region.h - pan_y) * zoom / 128;
    const canvas_rect = els.spritesheet.getBoundingClientRect();
    const pix_l = rel_l * canvas_rect.width;
    const pix_t = rel_t * canvas_rect.height;
    const pix_r = rel_r * canvas_rect.width;
    const pix_b = rel_b * canvas_rect.height;
    console.log(pix_l, pix_t, pix_r, pix_b)

    els.selector_box.style.left = pix_l + "px";
    els.selector_box.style.top = pix_t + "px";
    els.selector_box.style.width = pix_r - pix_l + "px";
    els.selector_box.style.height = pix_b - pix_t + "px";
    els.selector_anchor_tl.style.left = pix_l + "px";
    els.selector_anchor_tl.style.top = pix_t + "px";
    els.selector_anchor_tr.style.left = pix_r + "px";
    els.selector_anchor_tr.style.top = pix_t + "px";
    els.selector_anchor_bl.style.left = pix_l + "px";
    els.selector_anchor_bl.style.top = pix_b + "px";
    els.selector_anchor_br.style.left = pix_r + "px";
    els.selector_anchor_br.style.top = pix_b + "px";
}

update_image();
