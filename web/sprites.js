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
    if (get_selected_sprite() != null) {
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

window.addEventListener("resize", () => {
    selection_box.update();
});
