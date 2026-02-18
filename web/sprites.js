import {els, model} from "./globals.js";
import { DraggableRegion, ZoomPanImage } from "./utils.js";

const image = new ZoomPanImage(els.selected_sprite, els.selected_sprite_minimap, null, 1, 1);
const selection_box = new DraggableRegion(image);

var selected_sprite_id = null;

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

function refresh_selected_sprite() {
    var sprite = get_selected_sprite();
    if (sprite == null) {
        return;
    }
    refresh_sprite_list();
}

function refresh_sprite_list() {
    els.sprite_list.replaceChildren();
    for (const id of model.sprite_ids()) {
        const container = document.createElement("div");
        container.classList.add("image-container")

        container.addEventListener("click", (e) => {
            set_selected_sprite_id(Number(id));
        });

        var sprite = model.get_sprite(id);
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
