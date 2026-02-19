import {els, model} from "./globals.js";
import { DraggableRegion, onDrag, ZoomPanImage } from "./utils.js";

const image = new ZoomPanImage(els.selected_sprite, els.selected_sprite_minimap, null);
const selection_box = new DraggableRegion(image);

var selected_sprite_id = null;
var selected_component_id = null;

function get_selected_sprite() {
    if (selected_sprite_id == null) {
        return null;
    }
    return model.get_sprite(selected_sprite_id);
}

function set_selected_sprite_id(value) {
    selected_sprite_id = value;
    selection_box.set_region(null);
    if (get_selected_sprite() == null) {
        els.sprite_list.hidden = false;
        els.edit_sprite.hidden = true;
    } else {
        els.sprite_list.hidden = true;
        els.edit_sprite.hidden = false;
        refresh_selected_sprite();
    }
}

function set_selected_component_id(value) {
    selected_component_id = value;
    refresh_component_list();
}

function refresh_selected_sprite() {
    refresh_component_list();

    var sprite = get_selected_sprite();
    if (sprite == null) {
        return;
    }
    image.set_image_data(model.render_sprite_rgba(selected_sprite_id));
}

function refresh_component_list() {
    els.sprite_component_list.replaceChildren();
    var sprite = get_selected_sprite();
    if (sprite == null || sprite.num_components() == 0) {
        els.sprite_component_list.append("drag spritelet over to add...")
        return;
    }
    for (var i = 0; i < sprite.num_components(); i++) {
        var component = sprite.get_component(i);
        if (component == null) {
            continue;
        }
        const container = document.createElement("div");
        container.classList.add("h-box")

        const image_container = document.createElement("div");
        image_container.classList.add("image-container")

        container.addEventListener("click", (e) => {
            set_selected_component_id(Number(i));
        });

        if (i == selected_component_id) {
            container.style.borderWidth = "3px"
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
        container.append(image_container);
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
            if (document.elementFromPoint(e.clientX, e.clientY)?.closest("#sprite-component-list")) {
                var sprite = get_selected_sprite();
                if (sprite != null) {
                    sprite.add_component(id);
                    model.update_sprite(selected_sprite_id, sprite);
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

        container.append(canvas);
        els.sprite_list.append(container);
    }
    els.sprite_list.append(els.add_sprite);
}

els.add_sprite.addEventListener("click", (e) => {
    model.new_sprite();
    refresh_sprite_list();
});

window.addEventListener("resize", () => {
    selection_box.update();
});
