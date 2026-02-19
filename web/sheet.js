import {els, model, Region} from "./globals.js";
import { refresh_sprite_spritelet_list } from "./sprites.js";
import { DraggableRegion, ZoomPanImage } from "./utils.js";

const spritesheet = new ZoomPanImage(els.spritesheet, els.spritesheet_minimap, model.render_spritesheet_rgba());
const selection_box = new DraggableRegion(spritesheet, true);
var selected_spritelet_id = null;
const selected_spritelet_ctx = els.selected_spritelet.getContext("2d", { alpha: true });

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
    model.load_spritesheet_rgba(rgba)
    spritesheet.set_image_data(model.render_spritesheet_rgba());
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
    spritesheet.set_pan(spritesheet.pan.x, els.spritesheet_pan_y.valueAsNumber);
    els.spritesheet_pan_y.valueAsNumber = spritesheet.pan.y;
});

els.add_spritelet.addEventListener("click", (e) => {
    const z = 128 / (2 ** els.spritesheet_zoom.valueAsNumber);
    const x = Math.round(els.spritesheet_pan_x.valueAsNumber + 0.25 * z);
    const y = Math.round(els.spritesheet_pan_y.valueAsNumber + 0.25 * z);
    const wh = Math.round(z * 0.5)
    set_selected_spritelet_id(model.new_spritelet(new Region(x, y, wh, wh)));
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
        els.selected_spritelet_toolbar.hidden = true;
        els.edit_spritelet_divider.hidden = true;
        selection_box.set_region(null);
    } else {
        refresh_selected_spritelet();
        els.selected_spritelet_toolbar.hidden = false;
        els.edit_spritelet_divider.hidden = false;
    }
}

function refresh_selected_spritelet() {
    var spritelet = get_selected_spritelet();
    if (spritelet == null) {
        return;
    }
    els.selected_spritelet_x.value = spritelet.region.x;
    els.selected_spritelet_y.value = spritelet.region.y;
    els.selected_spritelet_width.value = spritelet.region.w;
    els.selected_spritelet_height.value = spritelet.region.h;

    els.selected_spritelet.width = spritelet.region.w;
    els.selected_spritelet.height = spritelet.region.h;
    const buffer = model.render_spritelet_rgba(selected_spritelet_id);
    const img = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
    selected_spritelet_ctx.putImageData(img, 0, 0);

    selection_box.set_region(spritelet.region);
    refresh_spritelet_list();
}

function refresh_spritelet_list() {
    els.spritelet_list.replaceChildren();
    for (const id of model.spritelet_ids()) {
        const container = document.createElement("div");
        container.classList.add("image-container")

        container.addEventListener("click", (e) => {
            set_selected_spritelet_id(Number(id));
        });

        var spritelet = model.get_spritelet(id);
        var canvas = document.createElement("canvas");
        canvas.width = spritelet.region.w;
        canvas.height = spritelet.region.h;
        const buffer = model.render_spritelet_rgba(id);
        var image_data = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
        canvas.getContext("2d", { alpha: true }).putImageData(image_data, 0, 0);

        container.append(canvas);
        els.spritelet_list.append(container);

        if (id == selected_spritelet_id) {
            container.style.borderWidth = "3px"
        }
    }
    els.spritelet_list.append(els.add_spritelet);
    refresh_sprite_spritelet_list();
}

els.delete_spritelet.addEventListener("click", (e) => {
    if (selected_spritelet_id != null) {
        var ids = model.spritelet_ids();
        var new_id = null;
        for (var i of ids) {
            if (ids[i] == selected_spritelet_id) {
                if (i > 0) {
                    new_id = ids[i - 1];
                } else if (ids.length > 1) {
                    new_id = ids[1];
                }
                break;
            }
        }
        model.delete_spritelet(selected_spritelet_id);
        refresh_spritelet_list();
        set_selected_spritelet_id(new_id);
    }
});

els.spritesheet.addEventListener('region_changed', (e) => {
    if (e.detail.region != null) {
        var selected_spritelet = get_selected_spritelet();
        if (selected_spritelet != null) {
            selected_spritelet.region = new Region(
                e.detail.region.x,
                e.detail.region.y,
                e.detail.region.w,
                e.detail.region.h);
            model.update_spritelet(selected_spritelet_id, selected_spritelet);
            refresh_selected_spritelet();
        }
    }
});

els.spritesheet.addEventListener("zoom_changed", (e) => {
    els.spritesheet_zoom.valueAsNumber = spritesheet.zoom;
});

els.spritesheet.addEventListener("pan_changed", (e) => {
    els.spritesheet_pan_x.valueAsNumber = spritesheet.pan.x;
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
