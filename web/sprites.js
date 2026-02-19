import {els, model} from "./globals.js";
import { Pos, Region } from "./pkg/pico_8_palette_pal.js";
import { DraggableRegion, onDrag, ZoomPanImage } from "./utils.js";

const selected_sprite = new ZoomPanImage(els.selected_sprite, els.selected_sprite_minimap);
const selection_box = new DraggableRegion(selected_sprite, false);

var selected_sprite_id = null;
var selected_component_i = null;

function get_selected_sprite() {
    if (selected_sprite_id == null) {
        return null;
    }
    return model.get_sprite(selected_sprite_id);
}

function set_selected_sprite_id(value) {
    selected_sprite_id = value;
    var sprite = get_selected_sprite();
    if (sprite == null) {
        selection_box.set_region(null);
        els.sprite_list.hidden = false;
        els.edit_sprite.hidden = true;
    } else {
        els.sprite_list.hidden = true;
        els.edit_sprite.hidden = false;
        refresh_selected_sprite();
    }
}

function set_selected_component_i(value) {
    selected_component_i = value;
    refresh_component_list();

    var sprite = get_selected_sprite();
    if (sprite == null) {
        return;
    }

    var component = sprite.get_component(selected_component_i);
    if (component != null) {
        var spritelet = model.get_spritelet(component.spritelet_id);
        if (spritelet != null) {
            selection_box.set_region(new Region(
                component.pos.x,
                component.pos.y,
                spritelet.region.w,
                spritelet.region.h,
            ));
        }
    }
}

function refresh_selected_sprite() {
    refresh_component_list();

    var sprite = get_selected_sprite();
    if (sprite == null) {
        return;
    }
    selected_sprite.set_image_data(model.render_sprite_rgba(selected_sprite_id), sprite.top_left);
}

function refresh_component_list() {
    els.sprite_component_list.replaceChildren();
    var sprite = get_selected_sprite();
    if (sprite == null || sprite.num_components() == 0) {
        els.sprite_component_list.append("drag spritelet over to add...")
        return;
    }
    for (let i = sprite.num_components() - 1; i >= 0; i--) {
        var component = sprite.get_component(i);
        if (component == null) {
            continue;
        }
        const container = document.createElement("div");
        container.classList.add("h-box")

        const image_container = document.createElement("div");
        image_container.classList.add("image-container")

        container.addEventListener("click", (e) => {
            set_selected_component_i(Number(i));
        });

        if (i == selected_component_i) {
            image_container.style.borderWidth = "3px"
        }

        var canvas = document.createElement("canvas");
        const buffer = model.render_spritelet_color_mapped_rgba(
            component.spritelet_id,
            component.color_map,
            component.flip_x, component.flip_y
        );
        canvas.width = buffer.width;
        canvas.height = buffer.height;
        var image_data = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
        canvas.getContext("2d", { alpha: true }).putImageData(image_data, 0, 0);
        image_container.append(canvas);

        var flip_bar = document.createElement("div");
        flip_bar.classList.add("v-box");
        var flip_x_label = document.createElement("label");
        var flip_y_label = document.createElement("label");
        flip_x_label.append("flip-x");
        flip_y_label.append("flip-y");
        var flip_x = document.createElement("input");
        var flip_y = document.createElement("input");
        flip_x.type = "checkbox";
        flip_y.type = "checkbox";
        flip_x.checked = component.flip_x;
        flip_y.checked = component.flip_y;
        flip_x.addEventListener("click", (e) => { e.stopPropagation(); });
        flip_y.addEventListener("click", (e) => { e.stopPropagation(); });
        flip_x.addEventListener("change", (e) => {
            var sprite = get_selected_sprite();
            if (sprite != null) {
                var component = sprite.get_component(i);
                if (component != null) {
                    component.flip_x = e.target.checked;
                    sprite.update_component(i, component);
                    model.update_sprite(selected_sprite_id, sprite);
                    refresh_component_list();
                    refresh_selected_sprite();
                }
            }
        });
        flip_y.addEventListener("change", (e) => {
            var sprite = get_selected_sprite();
            if (sprite != null) {
                var component = sprite.get_component(i);
                if (component != null) {
                    component.flip_y = e.target.checked;
                    sprite.update_component(i, component);
                    model.update_sprite(selected_sprite_id, sprite);
                    refresh_component_list();
                    refresh_selected_sprite();
                }
            }
        });
        flip_x_label.append(flip_x);
        flip_y_label.append(flip_y);
        flip_bar.append(flip_x_label);
        flip_bar.append(flip_y_label);

        var order_bar = document.createElement("div");
        order_bar.classList.add("v-box");
        var shift_up = document.createElement("button");
        var shift_down = document.createElement("button");
        shift_up.classList.add("button", "pixel-corners-1");
        shift_down.classList.add("button", "pixel-corners-1");
        shift_up.append("▲");
        shift_down.append("▼");
        shift_up.addEventListener("click", (e) => {
            var sprite = get_selected_sprite();
            if (sprite != null) {
                sprite.shift_component_up(i);
                model.update_sprite(selected_sprite_id, sprite);
                if (i == selected_component_i && i < (sprite.num_components() - 1)) {
                    set_selected_component_i(i + 1);
                } else if (i == (selected_component_i - 1)) {
                    set_selected_component_i(i);
                } else {
                    refresh_component_list();
                }
                refresh_selected_sprite();
            }
            e.stopPropagation();
        });
        shift_down.addEventListener("click", (e) => {
            var sprite = get_selected_sprite();
            if (sprite != null) {
                sprite.shift_component_down(i);
                model.update_sprite(selected_sprite_id, sprite);
                if (i == selected_component_i && i > 0) {
                    set_selected_component_i(i - 1);
                } else if (i == (selected_component_i + 1)) {
                    set_selected_component_i(i);
                } else {
                    refresh_component_list();
                }
                refresh_selected_sprite();
            }
            e.stopPropagation();
        });
        order_bar.append(shift_up);
        order_bar.append(shift_down);

        container.append(image_container);
        container.append(flip_bar);
        container.append(order_bar);
        els.sprite_component_list.append(container);
    }
}

export function refresh_sprite_spritelet_list() {
    els.spritelet_list_2.replaceChildren();
    for (const id of model.spritelet_ids()) {
        const container = document.createElement("div");
        container.classList.add("image-container")

        var spritelet = model.get_spritelet(id);
        var canvas = document.createElement("canvas");
        canvas.width = spritelet.region.w;
        canvas.height = spritelet.region.h;
        const buffer = model.render_spritelet_rgba(id);
        var image_data = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
        canvas.getContext("2d", { alpha: true }).putImageData(image_data, 0, 0);

        container.addEventListener("pointerdown", (e) => {
            els.drag_ghost.width = canvas.width;
            els.drag_ghost.height = canvas.height;
            els.drag_ghost.getContext("2d", { alpha: true }).putImageData(image_data, 0, 0);
        });
        onDrag(container, (e) => {
            const rect = els.drag_ghost.getBoundingClientRect();
            els.drag_ghost.hidden = false;
            els.drag_ghost.style.left = Math.round(e.clientX - rect.width / 2) + "px";
            els.drag_ghost.style.top = Math.round(e.clientY - rect.height / 2) + "px";
            els.sprite_component_list_drag_preview.hidden = false;
        });
        container.addEventListener("pointerup", (e) => {
            els.sprite_component_list_drag_preview.hidden = true;
            els.drag_ghost.hidden = true;
            if (document.elementFromPoint(e.clientX, e.clientY)?.closest("#selected-sprite")) {
                var sprite = get_selected_sprite();
                if (sprite != null) {
                    let i = sprite.num_components();
                    let [drop_x, drop_y] = selected_sprite.client_to_image(e.clientX, e.clientY)
                    sprite.add_component(id, new Pos(drop_x, drop_y));
                    let component = sprite.get_component(i);
                    let spritelet = model.get_spritelet(component.spritelet_id);
                    let [x, y] = selected_sprite.client_to_image(e.clientX, e.clientY);
                    component.pos = new Pos(
                        Math.max(0, x - spritelet.region.w),
                        Math.max(0, y - spritelet.region.h));
                    sprite.update_component(i, component);
                    model.update_sprite(selected_sprite_id, sprite);
                    set_selected_component_i(i);
                    refresh_selected_sprite();
                }
            }
        });

        container.append(canvas);
        els.spritelet_list_2.append(container);
    }
}

function refresh_sprite_list() {
    els.sprite_list.replaceChildren();
    for (const id of model.sprite_ids()) {
        const container = document.createElement("div");
        container.classList.add("image-container")

        container.addEventListener("click", (e) => {
            set_selected_sprite_id(Number(id));
        });

        var canvas = document.createElement("canvas");
        const buffer = model.render_sprite_rgba(id);
        canvas.width = buffer.width;
        canvas.height = buffer.height;
        var image_data = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
        canvas.getContext("2d", { alpha: true }).putImageData(image_data, 0, 0);
        els.sprite_list.append(container);
    }
    els.sprite_list.append(els.add_sprite);
}

els.selected_sprite_zoom.addEventListener("input", (e) => {
    selected_sprite.set_zoom(els.selected_sprite_zoom.valueAsNumber);
    els.selected_sprite_zoom.valueAsNumber = selected_sprite.zoom;
});

els.selected_sprite_pan_x.addEventListener("input", (e) => {
    selected_sprite.set_pan(els.selected_sprite_pan_x.valueAsNumber, selected_sprite.pan.y);
    els.selected_sprite_pan_x.valueAsNumber = selected_sprite.pan.x;
});

els.selected_sprite_pan_y.addEventListener("input", (e) => {
    selected_sprite.set_pan(selected_sprite.pan.x, els.selected_sprite_pan_y.valueAsNumber);
    els.selected_sprite_pan_y.valueAsNumber = selected_sprite.pan.y;
});

els.selected_sprite.addEventListener('region_changed', (e) => {
    if (e.detail.region != null) {
        var sprite = get_selected_sprite();
        if (sprite != null) {
            var component = sprite.get_component(selected_component_i);
            if (component != null) {
                component.pos = new Pos(e.detail.region.x, e.detail.region.y);
                sprite.update_component(selected_component_i, component);
                model.update_sprite(selected_sprite_id, sprite);
            }
            refresh_selected_sprite();
        }
    }
});

els.selected_sprite.addEventListener("zoom_changed", (e) => {
    els.selected_sprite_zoom.valueAsNumber = selected_sprite.zoom;
});

els.selected_sprite.addEventListener("pan_changed", (e) => {
    els.selected_sprite_pan_x.valueAsNumber = selected_sprite.pan.x;
    els.selected_sprite_pan_y.valueAsNumber = selected_sprite.pan.y;
});

els.add_sprite.addEventListener("click", (e) => {
    model.new_sprite();
    refresh_sprite_list();
});

// Layout behaviour that flex can't acheive.
new ResizeObserver(entries => {
    const { height } = entries[0].contentRect;
    els.selected_sprite.style.width = height + "px";
}).observe(els.selected_sprite);

window.addEventListener("resize", () => {
    selection_box.update();
});
