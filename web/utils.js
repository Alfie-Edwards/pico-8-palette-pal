import { Region } from "./globals.js";

const W = 128
const H = 128

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
    constructor(main_canvas, minimap_canvas, buffer, pos) {
        this.main_canvas = main_canvas;
        this.minimap_canvas = minimap_canvas;
        this.minimap_canvas.width = W;
        this.minimap_canvas.height = H;
        this.zoom = 0;
        this.pan = {x: 0, y: 0}
        this.main_ctx = this.main_canvas.getContext("2d", { alpha: true });
        this.minimap_ctx = this.minimap_canvas.getContext("2d", { alpha: true });
        this.offscreen_canvas = new OffscreenCanvas(0, 0);
        this.offscreen_ctx = this.offscreen_canvas.getContext("2d", { alpha: true });
        this.set_image_data(buffer, pos);

        onDrag(this.minimap_canvas, (e) => {
            const rect = this.minimap_canvas.getBoundingClientRect();
            var zoom_amount = (2 ** this.zoom);
            const offset_x = (this.width / 2) / zoom_amount;
            const offset_y = (this.height / 2) / zoom_amount;
            this.set_pan(
                this.width * (e.clientX - rect.left) / rect.width - offset_x,
                this.height * (e.clientY - rect.top) / rect.height - offset_y);
            this.#redraw();
        });
    }

    set_pan(x, y) {
        var zoom_amount = (2 ** this.zoom);
        const limit_x = W - (W / zoom_amount);
        const limit_y = H - (H / zoom_amount);
        x = Math.max(0, Math.min(x, limit_x));
        y = Math.max(0, Math.min(y, limit_y));
        if (this.pan.x == x && this.pan.y == y) {
            return
        }
        this.pan.x = Math.round(x);
        this.pan.y = Math.round(y);
        this.main_canvas.dispatchEvent(
            new CustomEvent('pan_changed', {
                detail: {
                    pan: this.pan,
                }
            })
        );
        this.#redraw();
    }

    set_zoom(zoom) {
        if (zoom == this.zoom) {
            return;
        }
        if (zoom < 0) {
            zoom = 0;
        }
        if (zoom > 5) {
            zoom = 5;
        }
        var prev_zoom_amount = (2 ** this.zoom)
        this.zoom = zoom
        this.main_canvas.dispatchEvent(
            new CustomEvent('zoom_changed', {
                detail: {
                    zoom: this.zoom,
                }
            })
        );
        var zoom_amount = (2 ** this.zoom);
        var pan_x_shift = (this.width / 2) * (zoom_amount - prev_zoom_amount) / (prev_zoom_amount * zoom_amount);
        var pan_y_shift = (this.height / 2) * (zoom_amount - prev_zoom_amount) / (prev_zoom_amount * zoom_amount);
        this.set_pan(this.pan.x + pan_x_shift, this.pan.y + pan_y_shift);

        var main_canvas_scale = 2 ** -this.zoom;
        this.main_canvas.width = W * main_canvas_scale
        this.main_canvas.height = H * main_canvas_scale
        this.#redraw();
    }

    set_image_data(buffer, pos) {
        if (buffer == null) {
            this.image_data = null;
            this.width = 0;
            this.height = 0;
        } else {
            this.image_data = new ImageData(
                new Uint8ClampedArray(
                    buffer.data
                ),
                buffer.width,
                buffer.height
            );
            this.width = buffer.width;
            this.height = buffer.height;
        }
        if (pos == null) {
            this.pos = {x: 0, y: 0}
        } else {
            this.pos = { x: pos.x, y: pos.y };
        }
        var main_canvas_scale = 2 ** -this.zoom;
        this.main_canvas.width = W * main_canvas_scale
        this.main_canvas.height = H * main_canvas_scale
        this.offscreen_canvas.width = this.width
        this.offscreen_canvas.height = this.height

        if (this.image_data != null) {
            this.offscreen_ctx.putImageData(this.image_data, 0, 0);
            this.main_canvas.hidden = false;
            this.#redraw();
        } else {
            this.main_canvas.hidden = true;
        }
        console.log(this.pos)
    }

    client_to_image(x, y) {
        var zoom_amount = (2 ** this.zoom);
        const rect = this.main_canvas.getBoundingClientRect();
        const view_x = (x - rect.x) / rect.width;
        const view_y = (y - rect.y) / rect.height;
        return [
            this.pan.x + view_x * (W / zoom_amount),
            this.pan.y + view_y * (H / zoom_amount)
        ];
    }

    #redraw() {
        var zoom_amount = (2 ** this.zoom);
        this.main_ctx.clearRect(0, 0, this.width, this.height);
        this.main_ctx.imageSmoothingEnabled = false;const view_width  = W / zoom_amount;
        const view_height = H / zoom_amount;
        const raw_src_x = this.pan.x - this.pos.x;
        const raw_src_y = this.pan.y - this.pos.y;
        const src_x = Math.max(0, raw_src_x);
        const src_y = Math.max(0, raw_src_y);
        const width  = Math.max(0, Math.min(this.width,  raw_src_x + view_width) - src_x);
        const height = Math.max(0, Math.min(this.height, raw_src_y + view_height) - src_y);
        const dst_x = Math.max(0, -raw_src_x);
        const dst_y = Math.max(0, -raw_src_y);

        /* main canvas */
        this.main_ctx.clearRect(0, 0, view_width, view_height);
        this.main_ctx.drawImage(
            this.offscreen_canvas,
            src_x, src_y, width, height,
            dst_x, dst_y, width, height
        );
        this.main_ctx.save();
        this.main_ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        this.main_ctx.beginPath();
        this.main_ctx.rect(0, 0, view_width, view_height);
        this.main_ctx.rect(dst_x, dst_y, width, height);
        this.main_ctx.fill("evenodd");
        this.main_ctx.rect(dst_x, dst_y, width, height);
        this.main_ctx.restore();

        /* minimap */
        this.minimap_ctx.clearRect(0, 0, W, H);
        this.minimap_ctx.drawImage(
            this.offscreen_canvas,
            0, 0, this.width, this.height,
            this.pos.x, this.pos.y, this.width, this.height
        );
        this.minimap_ctx.save();
        this.minimap_ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
        this.minimap_ctx.beginPath();
        this.minimap_ctx.rect(0, 0, W, H);
        this.minimap_ctx.rect(this.pan.x, this.pan.y, view_width, view_height);
        this.minimap_ctx.fill("evenodd");
        this.minimap_ctx.strokeStyle = "white";
        this.minimap_ctx.lineWidth = 1;
        this.minimap_ctx.strokeRect(
            Math.round(this.pan.x) + 0.5,
            Math.round(this.pan.y) + 0.5,
            Math.round(view_width) - 1,
            Math.round(view_height) - 1
        );
        this.minimap_ctx.restore();
    }
}

export class DraggableRegion {
    constructor(image, allow_resize) {
        this.image = image;
        this.region = null;
        this.allow_resize = allow_resize;

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

        if (this.allow_resize) {
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
                sheet_x = Math.max(this.region.x + 1, Math.min(W, sheet_x));
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
                sheet_y = Math.max(this.region.y + 1, Math.min(H, sheet_y));
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
                sheet_x = Math.max(this.region.x + 1, Math.min(W, sheet_x));
                sheet_y = Math.max(this.region.y + 1, Math.min(H, sheet_y));

                this.set_region(new Region(
                    this.region.x,
                    this.region.y,
                    Math.round(sheet_x - this.region.x),
                    Math.round(sheet_y - this.region.y)));
            });
        }

        onDrag(this.box, (e, drag_offset) => {
            if (this.region == null) {
                return;
            }
            var zoom_amount = (2 ** this.image.zoom);
            const rect = this.image.main_canvas.getBoundingClientRect();
            const zx = W / zoom_amount;
            const zy = H / zoom_amount;
            var dx = drag_offset.x * zx / rect.width;
            var dy = drag_offset.y * zy / rect.height;
            dx = Math.max(-this.region.x, Math.min(W - this.region.x -this.region.w, dx));
            dy = Math.max(-this.region.y, Math.min(H - this.region.y -this.region.h, dy));

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

        var zoom_amount = (2 ** this.image.zoom);
        var x_offset = 0;
        var y_offset = 0;
        const spritesheet_rect = this.image.main_canvas.getBoundingClientRect();
        if (zoom_amount < 1) {
            x_offset = (1 - zoom_amount) / 2;
            y_offset = (1 - zoom_amount) / 2;
        }
        const rel_l = x_offset + (this.region.x - this.image.pan.x) * zoom_amount / W;
        const rel_t = y_offset + (this.region.y - this.image.pan.y) * zoom_amount / H;
        const rel_r = x_offset + (this.region.x + this.region.w - this.image.pan.x) * zoom_amount / W;
        const rel_b = y_offset + (this.region.y + this.region.h - this.image.pan.y) * zoom_amount / H;
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
