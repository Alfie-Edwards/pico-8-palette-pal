import { Region } from "./globals.js";

export function onDrag(element, handler) {
    var origin = {x: 0, y: 0};

    const listener = (e) => {
        if (e.buttons & 1) {
            const client_rect = e.target.getBoundingClientRect();
            return handler(e, { x: e.clientX - client_rect.x - origin.x, y: e.clientY - client_rect.y - origin.y });
        }
    }

    element.addEventListener("pointerdown", (e) => {
        const client_rect = e.target.getBoundingClientRect();
        origin = { x: e.clientX - client_rect.x, y: e.clientY - client_rect.y }
        element.setPointerCapture(e.pointerId);
        listener(e);
        element.addEventListener("pointermove", listener);
    });

    element.addEventListener("pointerup", (e) => {
        try { element.releasePointerCapture(e.pointerId); } catch (err) {}
        try { element.removeEventListener("pointermove", listener); } catch (err) {};
    });
}

export class ZoomPanImage {
    constructor(main_canvas, minimap_canvas, image_data, width, height) {
        this.main_canvas = main_canvas;
        this.minimap_canvas = minimap_canvas;
        this.zoom = 1;
        this.pan = {x: 0, y: 0}
        this.main_ctx = main_canvas.getContext("2d", { alpha: true });
        this.minimap_ctx = minimap_canvas.getContext("2d", { alpha: true });

        onDrag(this.minimap_canvas, (e) => {
            const rect = this.minimap_canvas.getBoundingClientRect();
            const offset = 64 / this.zoom;
            this.set_pan(
                this.width * (e.clientX - rect.left) / rect.width - offset,
                this.height * (e.clientY - rect.top) / rect.height - offset);
            this.#redraw();
        });

        this.set_image_data(image_data, width, height);
    }

    set_pan(x, y) {
        const limit_x = this.width - (this.width / this.zoom);
        const limit_y = this.height - (this.height / this.zoom);
        x = Math.max(0, Math.min(x, limit_x));
        y = Math.max(0, Math.min(y, limit_y));
        if (this.pan.x == x && this.pan.y == y) {
            return
        }
        this.pan.x = x;
        this.pan.y = y;
        this.main_canvas.dispatchEvent(
            new CustomEvent('pan_changed', {
                detail: {
                    pan: this.pan,
                }
            })
        );
    }

    set_zoom(zoom) {
        zoom = Math.max(1, zoom);
        if (zoom == this.zoom) {
            return;
        }
        var prev_zoom = this.zoom
        this.zoom = zoom
        this.main_canvas.dispatchEvent(
            new CustomEvent('zoom_changed', {
                detail: {
                    zoom: this.zoom,
                }
            })
        );
        var pan_x_shift = (this.width / 2) * (this.zoom - prev_zoom) / (prev_zoom * this.zoom);
        var pan_y_shift = (this.height / 2) * (this.zoom - prev_zoom) / (prev_zoom * this.zoom);
        this.set_pan(this.pan.x + pan_x_shift, this.pan.y + pan_y_shift);
    }

    set_image_data(image_data, width, height) {
        this.image_data = image_data;
        this.width = width;
        this.height = height;
        this.main_canvas.width = width
        this.main_canvas.height = height
        this.minimap_canvas.width = width
        this.minimap_canvas.height = height
        if (this.image_data != null) {
            this.main_canvas.hidden = false;
            this.#redraw();
        } else {
            this.main_canvas.hidden = true;
        }
    }

    client_to_image(x, y) {
        const rect = this.main_canvas.getBoundingClientRect();
        const view_x = (x - rect.x) / rect.width;
        const view_y = (y - rect.y) / rect.height;
        return [
            this.pan.x + view_x * (this.width / this.zoom),
            this.pan.y + view_y * (this.height / this.zoom)
        ];
    }

    #redraw() {
        const width = this.width / this.zoom;
        const height = this.height / this.zoom;
        this.main_ctx.putImageData(this.image_data, 0, 0);
        this.main_ctx.imageSmoothingEnabled = false;
        this.main_ctx.drawImage(this.main_canvas, this.pan.x, this.pan.y, width, height, 0, 0, this.width, this.height);

        this.minimap_ctx.putImageData(this.image_data, 0, 0);
        this.minimap_ctx.save();
        this.minimap_ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
        this.minimap_ctx.beginPath();
        this.minimap_ctx.rect(0, 0, this.width, this.height);
        this.minimap_ctx.rect(this.pan.x, this.pan.y, width, height);
        this.minimap_ctx.fill("evenodd");
        this.minimap_ctx.strokeStyle = "white";
        this.minimap_ctx.lineWidth = 1;
        this.minimap_ctx.strokeRect(
            Math.round(this.pan.x) + 0.5,
            Math.round(this.pan.y) + 0.5,
            Math.round(width) - 1,
            Math.round(height) - 1
        );
        this.minimap_ctx.restore();
    }
}

export class DraggableRegion {
    constructor(image) {
        this.image = image;
        this.region = null;

        this.box = document.createElement("div");
        this.anchor_tl = document.createElement("div");
        this.anchor_tr = document.createElement("div");
        this.anchor_bl = document.createElement("div");
        this.anchor_br = document.createElement("div");
        this.box.classList.add("selector-box");
        this.anchor_tl.classList.add("selector-anchor");
        this.anchor_tr.classList.add("selector-anchor");
        this.anchor_bl.classList.add("selector-anchor");
        this.anchor_br.classList.add("selector-anchor");

        for (var x of [this.box, this.anchor_tl, this.anchor_tr, this.anchor_bl, this.anchor_br]) {
            x.hidden = true;
            this.image.main_canvas.parentElement.append(x);
        }

        this.image.main_canvas.addEventListener("zoom_changed", (e) => { this.update(); });
        this.image.main_canvas.addEventListener("pan_changed", (e) => { this.update(); });

        onDrag(this.anchor_tl, (e) => {
            if (this.region == null) {
                return;
            }
            const r = this.region.x + this.region.w;
            const b = this.region.y + this.region.h;
            let [sheet_x, sheet_y] = this.image.client_to_image(e.clientX, e.clientY);
            sheet_x = Math.max(0, Math.min(r - 1, sheet_x));
            sheet_y = Math.max(0, Math.min(b - 1, sheet_y));
            const dx = sheet_x - this.region.x;
            const dy = sheet_y - this.region.y;

            this.set_region(new Region(
                Math.round(sheet_x),
                Math.round(sheet_y),
                Math.round(this.region.w - dx),
                Math.round(this.region.h - dy)));
        });

        onDrag(this.anchor_tr, (e) => {
            if (this.region == null) {
                return;
            }
            const b = this.region.y + this.region.h;
            let [sheet_x, sheet_y] = this.image.client_to_image(e.clientX, e.clientY);
            sheet_x = Math.max(this.region.x + 1, Math.min(128, sheet_x));
            sheet_y = Math.max(0, Math.min(b - 1, sheet_y));
            const dy = sheet_y - this.region.y;

            this.set_region(new Region(
                this.region.x,
                Math.round(sheet_y),
                Math.round(sheet_x - this.region.x),
                Math.round(this.region.h - dy)));
        });

        onDrag(this.anchor_bl, (e) => {
            if (this.region == null) {
                return;
            }
            const r = this.region.x + this.region.w;
            let [sheet_x, sheet_y] = this.image.client_to_image(e.clientX, e.clientY);
            sheet_x = Math.max(0, Math.min(r - 1, sheet_x));
            sheet_y = Math.max(this.region.y + 1, Math.min(this.image.height, sheet_y));
            const dx = sheet_x - this.region.x;

            this.set_region(new Region(
                Math.round(sheet_x),
                this.region.y,
                Math.round(this.region.w - dx),
                Math.round(sheet_y - this.region.y)));
        });

        onDrag(this.anchor_br, (e) => {
            if (this.region == null) {
                return;
            }
            let [sheet_x, sheet_y] = this.image.client_to_image(e.clientX, e.clientY);
            sheet_x = Math.max(this.region.x + 1, Math.min(this.image.width, sheet_x));
            sheet_y = Math.max(this.region.y + 1, Math.min(this.image.height, sheet_y));

            this.set_region(new Region(
                this.region.x,
                this.region.y,
                Math.round(sheet_x - this.region.x),
                Math.round(sheet_y - this.region.y)));
        });

        onDrag(this.box, (e, drag_offset) => {
            if (this.region == null) {
                return;
            }
            const rect = this.image.main_canvas.getBoundingClientRect();
            const zx = this.image.width / this.image.zoom;
            const zy = this.image.height / this.image.zoom;
            var dx = drag_offset.x * zx / rect.width;
            var dy = drag_offset.y * zy / rect.height;
            dx = Math.max(-this.region.x, Math.min(this.image.width - this.region.x -this.region.w, dx));
            dy = Math.max(-this.region.y, Math.min(this.image.height - this.region.y -this.region.h, dy));

            this.set_region(new Region(
                Math.round(this.region.x + dx),
                Math.round(this.region.y + dy),
                this.region.w,
                this.region.h));
        });
    }

    set_region(region) {
        if ((this.region == null && region == null) || (
                this.region != null &&
                region != null &&
                this.region.x == region.x &&
                this.region.y == region.y &&
                this.region.w == region.w &&
                this.region.h == region.h)) {
            return;
        }
        this.region = region;
        this.update();
        this.image.main_canvas.dispatchEvent(
            new CustomEvent('region_changed', {
                detail: {
                    region: this.region,
                }
            })
        );
    }

    update() {
        if (this.region == null) {
            this.anchor_tl.hidden = true;
            this.anchor_tr.hidden = true;
            this.anchor_bl.hidden = true;
            this.anchor_br.hidden = true;
            this.box.hidden = true;
            return;
        }

        const rel_l = (this.region.x - this.image.pan.x) * this.image.zoom / this.image.width;
        const rel_t = (this.region.y - this.image.pan.y) * this.image.zoom / this.image.height;
        const rel_r = (this.region.x + this.region.w - this.image.pan.x) * this.image.zoom / this.image.width;
        const rel_b = (this.region.y + this.region.h - this.image.pan.y) * this.image.zoom / this.image.height;
        const spritesheet_rect = this.image.main_canvas.getBoundingClientRect();
        const pix_l = rel_l * spritesheet_rect.width;
        const pix_t = rel_t * spritesheet_rect.height;
        const pix_r = rel_r * spritesheet_rect.width;
        const pix_b = rel_b * spritesheet_rect.height;

        this.box.style.left = pix_l + "px";
        this.box.style.top = pix_t + "px";
        this.box.style.width = pix_r - pix_l + "px";
        this.box.style.height = pix_b - pix_t + "px";
        this.anchor_tl.style.left = pix_l + "px";
        this.anchor_tl.style.top = pix_t + "px";
        this.anchor_tr.style.left = pix_r + "px";
        this.anchor_tr.style.top = pix_t + "px";
        this.anchor_bl.style.left = pix_l + "px";
        this.anchor_bl.style.top = pix_b + "px";
        this.anchor_br.style.left = pix_r + "px";
        this.anchor_br.style.top = pix_b + "px";

        this.anchor_tl.hidden = false;
        this.anchor_tr.hidden = false;
        this.anchor_bl.hidden = false;
        this.anchor_br.hidden = false;
        this.box.hidden = false;
    }
}
