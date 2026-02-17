import {els, model, Region} from "./globals.js";
import { update_selector_box } from "./spritesheet.js";
import { onDrag } from "./utils.js";

var selected_spritelet_id = null;

const selected_spritelet_ctx = els.selected_spritelet.getContext("2d", { alpha: true });

els.add_spritelet.addEventListener("click", (e) => {
    const z = 128 / els.spritesheet_zoom.valueAsNumber;
    const x = Math.round(els.spritesheet_pan_x.valueAsNumber + 0.25 * z);
    const y = Math.round(els.spritesheet_pan_y.valueAsNumber + 0.25 * z);
    const wh = Math.round(z * 0.5)
    set_selected_spritelet_id(model.new_spritelet(new Region(x, y, wh, wh)));
});

export function get_selected_spritelet() {
    if (selected_spritelet_id == null) {
        return null;
    }
    return model.get_spritelet(selected_spritelet_id);
}

function get_sheet_coords(x, y) {
    const rect = els.spritesheet.getBoundingClientRect();
    var pan_x = els.spritesheet_pan_x.valueAsNumber;
    var pan_y = els.spritesheet_pan_y.valueAsNumber;
    const zoom = els.spritesheet_zoom.valueAsNumber;
    const view_x = (x - rect.x) / rect.width;
    const view_y = (y - rect.y) / rect.height;
    return [pan_x + view_x * (128 / zoom), pan_y + view_y * (128 / zoom)];
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
        els.selector_box.hidden = true;
        els.selector_anchor_tl.hidden = true;
        els.selector_anchor_tr.hidden = true;
        els.selector_anchor_bl.hidden = true;
        els.selector_anchor_br.hidden = true;
    } else {
        refresh_selected_spritelet();
        els.selected_spritelet_toolbar.hidden = false;
        els.edit_spritelet_divider.hidden = false;
        els.selector_box.hidden = false;
        els.selector_anchor_tl.hidden = false;
        els.selector_anchor_tr.hidden = false;
        els.selector_anchor_bl.hidden = false;
        els.selector_anchor_br.hidden = false;
    }
}

export function refresh_selected_spritelet() {
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
    const bytes = model.render_spritelet_rgba(selected_spritelet_id);
    const img = new ImageData(new Uint8ClampedArray(bytes), spritelet.region.w, spritelet.region.h);
    selected_spritelet_ctx.putImageData(img, 0, 0);

    update_selector_box();
    refresh_spritelet_list();
}

export function refresh_spritelet_list() {
    els.spritelet_list.replaceChildren();
    els.spritelet_list_2.replaceChildren();
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
        const bytes = model.render_spritelet_rgba(id);
        var image_data = new ImageData(new Uint8ClampedArray(bytes), spritelet.region.w, spritelet.region.h);
        canvas.getContext("2d", { alpha: true }).putImageData(image_data, 0, 0);

        container.append(canvas);
        els.spritelet_list.append(container);

        let clone = container.cloneNode(true);
        clone.lastChild.getContext("2d", {alpha :true}).putImageData(image_data, 0, 0);
        els.spritelet_list_2.append(clone);

        if (id == selected_spritelet_id) {
            container.style.borderWidth = "3px"
        }
    }
}

els.delete_spritelet.addEventListener("click", (e) => {
    if (selected_spritelet_id != null) {
        var ids = model.spritelet_ids();
        var new_id = null;
        for (var i in ids) {
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

onDrag(els.selector_anchor_tl, (e) => {
    var spritelet = get_selected_spritelet();
    if (spritelet == null) {
        return;
    }
    const r = spritelet.region.x + spritelet.region.w;
    const b = spritelet.region.y + spritelet.region.h;
    var [sheet_x, sheet_y] = get_sheet_coords(e.clientX, e.clientY);
    sheet_x = Math.max(0, Math.min(r - 1, sheet_x));
    sheet_y = Math.max(0, Math.min(b - 1, sheet_y));
    const dx = sheet_x - spritelet.region.x;
    const dy = sheet_y - spritelet.region.y;

    spritelet.region = new Region(
        Math.round(sheet_x),
        Math.round(sheet_y),
        Math.round(spritelet.region.w - dx),
        Math.round(spritelet.region.h - dy));
    model.update_spritelet(selected_spritelet_id, spritelet);
    refresh_selected_spritelet();
});

onDrag(els.selector_anchor_tr, (e) => {
    var spritelet = get_selected_spritelet();
    if (spritelet == null) {
        return;
    }
    const b = spritelet.region.y + spritelet.region.h;
    var [sheet_x, sheet_y] = get_sheet_coords(e.clientX, e.clientY);
    sheet_x = Math.max(spritelet.region.x + 1, Math.min(128, sheet_x));
    sheet_y = Math.max(0, Math.min(b - 1, sheet_y));
    const dy = sheet_y - spritelet.region.y;

    spritelet.region = new Region(
        spritelet.region.x,
        Math.round(sheet_y),
        Math.round(sheet_x - spritelet.region.x),
        Math.round(spritelet.region.h - dy));
    model.update_spritelet(selected_spritelet_id, spritelet);
    refresh_selected_spritelet();
});

onDrag(els.selector_anchor_bl, (e) => {
    var spritelet = get_selected_spritelet();
    if (spritelet == null) {
        return;
    }
    const r = spritelet.region.x + spritelet.region.w;
    var [sheet_x, sheet_y] = get_sheet_coords(e.clientX, e.clientY);
    sheet_x = Math.max(0, Math.min(r - 1, sheet_x));
    sheet_y = Math.max(spritelet.region.y + 1, Math.min(128, sheet_y));
    const dx = sheet_x - spritelet.region.x;

    spritelet.region = new Region(
        Math.round(sheet_x),
        spritelet.region.y,
        Math.round(spritelet.region.w - dx),
        Math.round(sheet_y - spritelet.region.y));
    model.update_spritelet(selected_spritelet_id, spritelet);
    refresh_selected_spritelet();
});

onDrag(els.selector_anchor_br, (e) => {
    var spritelet = get_selected_spritelet();
    if (spritelet == null) {
        return;
    }
    var [sheet_x, sheet_y] = get_sheet_coords(e.clientX, e.clientY);
    sheet_x = Math.max(spritelet.region.x + 1, Math.min(128, sheet_x));
    sheet_y = Math.max(spritelet.region.y + 1, Math.min(128, sheet_y));

    spritelet.region = new Region(
        spritelet.region.x,
        spritelet.region.y,
        Math.round(sheet_x - spritelet.region.x),
        Math.round(sheet_y - spritelet.region.y));
    model.update_spritelet(selected_spritelet_id, spritelet);
    refresh_selected_spritelet();
});

onDrag(els.selector_box, (e, drag_offset) => {
    var spritelet = get_selected_spritelet();
    if (spritelet == null) {
        return;
    }
    const rect = els.spritesheet.getBoundingClientRect();
    const z = 128 / els.spritesheet_zoom.valueAsNumber;
    var dx = drag_offset.x * z / rect.width;
    var dy = drag_offset.y * z / rect.height;
    dx = Math.max(-spritelet.region.x, Math.min(128 - spritelet.region.x -spritelet.region.w, dx));
    dy = Math.max(-spritelet.region.y, Math.min(128 - spritelet.region.y -spritelet.region.h, dy));

    spritelet.region = new Region(
        Math.round(spritelet.region.x + dx),
        Math.round(spritelet.region.y + dy),
        spritelet.region.w,
        spritelet.region.h);
    model.update_spritelet(selected_spritelet_id, spritelet);
    refresh_selected_spritelet();
});
