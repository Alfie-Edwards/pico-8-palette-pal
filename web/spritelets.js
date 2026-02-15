import {els, model, Region} from "../globals.js";

var selected_spritelet_id = null;

const selected_spritelet_ctx = els.selected_spritelet.getContext("2d", { alpha: true });

els.add_spritelet.addEventListener("click", (e) => {
    const z = 128 / els.spritesheet_zoom.valueAsNumber;
    const x = Math.round(els.spritesheet_pan_x.valueAsNumber + 0.125 * z);
    const y = Math.round(els.spritesheet_pan_y.valueAsNumber + 0.125 * z);
    const wh = Math.round(z * 0.75)
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
    } else {
        refresh_selected_spritelet();
        els.selected_spritelet_toolbar.hidden = false;
        els.edit_spritelet_divider.hidden = false;
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

    refresh_spritelet_list();
}

function refresh_spritelet_list() {
    els.spritelet_list.replaceChildren();
    for (const id in model.spritelet_ids()) {
        console.log(id);
        const container = document.createElement("div");
        container.classList.add("image-container")

        container.addEventListener("click", (e) => {
            set_selected_spritelet_id(Number(id));
        });

        const spritelet = model.get_spritelet(id);
        const canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d", { alpha: true });
        canvas.width = spritelet.region.w;
        canvas.height = spritelet.region.h;
        const bytes = model.render_spritelet_rgba(id);
        var image_data = new ImageData(new Uint8ClampedArray(bytes), spritelet.region.w, spritelet.region.h);
        ctx.putImageData(image_data, 0, 0);

        if (id == selected_spritelet_id) {
            container.style.borderWidth = "3px"
        }

        container.append(canvas);
        els.spritelet_list.append(container);
    }
}

els.delete_spritelet.addEventListener("click", (e) => {
    if (selected_spritelet_id != null) {
        model.delete_spritelet(selected_spritelet_id);
        refresh_spritelet_list();
        set_selected_spritelet_id(null);
    }
});
