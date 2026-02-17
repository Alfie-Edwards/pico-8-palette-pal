import {els, model} from "./globals.js";
import { refresh_selected_spritelet, refresh_spritelet_list } from "./spritelets.js";
import { DraggableRegion, ZoomPanImage } from "./utils.js";

export const spritesheet = new ZoomPanImage(els.spritesheet, els.spritesheet_minimap, get_image_data(), 128, 128);
export const selection_box = new DraggableRegion(spritesheet);

function get_image_data() {
    return new ImageData(
        new Uint8ClampedArray(
            model.render_spritesheet_rgba()
        ),
        128,
        128
    );
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

    if (rgba.length != (128 * 128 * 4)) {
        return;
    }
    model.load_spritesheet_rgba(rgba);
    spritesheet.set_image_data(get_image_data());
    refresh_selected_spritelet();
    refresh_spritelet_list();
});

els.spritesheet_zoom.addEventListener("input", (e) => {
    spritesheet.set_zoom(els.spritesheet_zoom.valueAsNumber);
    els.spritesheet_zoom.valueAsNumber = spritesheet.zoom;
});


els.spritesheet_pan_x.addEventListener("input", (e) => {
    spritesheet.set_pan(els.spritesheet_pan_x.valueAsNumber, spritesheet.pan.y);
    els.spritesheet_pan_x.valueAsNumber = spritesheet.pan.x;
});

els.spritesheet_pan_y.addEventListener("input", (e) => {
    spritesheet.set_pan(els.spritesheet_pan_y.valueAsNumber, spritesheet.pan.y);
    els.spritesheet_pan_y.valueAsNumber = spritesheet.pan.y;
});

// Layout behaviour that flex can't acheive.
new ResizeObserver(entries => {
    const { height } = entries[0].contentRect;
    els.spritesheet.style.width = height + "px";
}).observe(els.spritesheet);

window.addEventListener("resize", () => {
    selection_box.update();
});
