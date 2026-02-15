import init, { Model, Region } from "../pkg/pico_8_palette_pal.js";

await init();         // MUST await this
const model = new Model();

var selected_spritelet_id = null;
var selected_sprite_id = null;
var selected_scene_id = null;

const els = Object.fromEntries(
    [
        "spritesheet",
        "load-spritesheet-button",
        "edit-selected-spritelet",
        "selected-spritelet",
        "selected-spritelet-x",
        "selected-spritelet-y",
        "selected-spritelet-width",
        "selected-spritelet-height",
        "add-spritelet",
    ].map( id => [id.replaceAll("-", "_"), document.getElementById(id)])
)
console.log(els)

const spritesheet_ctx = els.spritesheet.getContext("2d", { alpha: true });
const selected_spritelet_ctx = els.selected_spritelet.getContext("2d", { alpha: true });

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

function draw_spritesheet() {
    spritesheet.width = 128
    spritesheet.height = 128
    const bytes = model.render_spritesheet_rgba();
    const img = new ImageData(new Uint8ClampedArray(bytes), 128, 128);
    spritesheet_ctx.putImageData(img, 0, 0);
}

els.load_spritesheet_button.addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) {
        return;
    }
    var rgba = await loadRgba(f);
    if (rgba.length != (128 * 128 * 4)) {
        return;
    }
    model.load_spritesheet_rgba(rgba);

    draw_spritesheet();

    // Allow selecting the same file again
    e.target.value = "";
});

els.add_spritelet.addEventListener("click", (e) => {
    set_selected_spritelet_id(model.new_spritelet(new Region(64, 64, 8, 8)));
});

function get_selected_spritelet() {
    if (selected_spritelet_id == null) {
        return null;
    }
    return model.get_spritelet(selected_spritelet_id);
}

els.selected_spritelet_x.addEventListener("input", (e) => {
    if (els.selected_spritelet_x.valueAsNumber < 0) {
        els.selected_spritelet_x.valueAsNumber = 0;
    }
    if (els.selected_spritelet_x.valueAsNumber + els.selected_spritelet_width.valueAsNumber > 128) {
        els.selected_spritelet_x.valueAsNumber = 128 - els.selected_spritelet_width.valueAsNumber;
    }
    var spritelet = get_selected_spritelet();
    if (spritelet != null) {
        spritelet.region = new Region(
            els.selected_spritelet_x.valueAsNumber,
            spritelet.region.y,
            spritelet.region.w,
            spritelet.region.h
        );
    }
    model.update_spritelet(selected_spritelet_id, spritelet);
    refresh_selected_spritelet();
});

els.selected_spritelet_y.addEventListener("input", (e) => {
    if (els.selected_spritelet_y.valueAsNumber < 0) {
        els.selected_spritelet_y.valueAsNumber = 0;
    }
    if (els.selected_spritelet_y.valueAsNumber + els.selected_spritelet_height.valueAsNumber > 128) {
        els.selected_spritelet_y.valueAsNumber = 128 - els.selected_spritelet_height.valueAsNumber;
    }
    var spritelet = get_selected_spritelet();
    if (spritelet != null) {
        spritelet.region = new Region(
            spritelet.region.x,
            els.selected_spritelet_y.valueAsNumber,
            spritelet.region.w,
            spritelet.region.h
        );
    }
    model.update_spritelet(selected_spritelet_id, spritelet);
    refresh_selected_spritelet();
});

els.selected_spritelet_width.addEventListener("input", (e) => {
    if (els.selected_spritelet_width.valueAsNumber < 1) {
        els.selected_spritelet_width.valueAsNumber = 1;
    }
    if (els.selected_spritelet_x.valueAsNumber + els.selected_spritelet_width.valueAsNumber > 128) {
        els.selected_spritelet_width.valueAsNumber = 128 - els.selected_spritelet_x.valueAsNumber;
    }
    var spritelet = get_selected_spritelet();
    if (spritelet != null) {
        spritelet.region = new Region(
            spritelet.region.x,
            spritelet.region.y,
            els.selected_spritelet_width.valueAsNumber,
            spritelet.region.h
        );
    }
    model.update_spritelet(selected_spritelet_id, spritelet);
    refresh_selected_spritelet();
});

els.selected_spritelet_height.addEventListener("input", (e) => {
    if (els.selected_spritelet_height.valueAsNumber < 1) {
        els.selected_spritelet_height.valueAsNumber = 1;
    }
    if (els.selected_spritelet_y.valueAsNumber + els.selected_spritelet_height.valueAsNumber > 128) {
        els.selected_spritelet_height.valueAsNumber = 128 - els.selected_spritelet_y.valueAsNumber;
    }
    var spritelet = get_selected_spritelet();
    if (spritelet != null) {
        spritelet.region = new Region(
            spritelet.region.x,
            spritelet.region.y,
            spritelet.region.w,
            els.selected_spritelet_height.valueAsNumber
        );
    }
    model.update_spritelet(selected_spritelet_id, spritelet);
    refresh_selected_spritelet();
});

function set_selected_spritelet_id(value) {
    selected_spritelet_id = value;
    if (get_selected_spritelet() == null) {
        els.edit_selected_spritelet.hidden = true;
    } else {
        refresh_selected_spritelet();
        els.edit_selected_spritelet.hidden = false;
    }
}

function refresh_selected_spritelet() {
    var spritelet = get_selected_spritelet();
    els.selected_spritelet_x.value = spritelet.region.x;
    els.selected_spritelet_y.value = spritelet.region.y;
    els.selected_spritelet_width.value = spritelet.region.w;
    els.selected_spritelet_height.value = spritelet.region.h;

    els.selected_spritelet.width = spritelet.region.w;
    els.selected_spritelet.height = spritelet.region.h;
    const bytes = model.render_spritelet_rgba(selected_spritelet_id);
    const img = new ImageData(new Uint8ClampedArray(bytes), spritelet.region.w, spritelet.region.h);
    selected_spritelet_ctx.putImageData(img, 0, 0);
}

draw_spritesheet();