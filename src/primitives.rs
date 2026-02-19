use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash)]
pub struct Pos {
    pub x: u8,
    pub y: u8,
}

#[wasm_bindgen]
impl Pos {
    #[wasm_bindgen(constructor)]
    pub fn new(x: u8, y: u8) -> Pos {
        Pos { x, y }
    }

    pub fn origin() -> Pos {
        Pos { x: 0, y: 0 }
    }
}

/// x, y, w, h.
#[wasm_bindgen]
#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash)]
pub struct Region {
    pub x: u8,
    pub y: u8,
    pub w: u8,
    pub h: u8,
}

#[wasm_bindgen]
impl Region {
    #[wasm_bindgen(constructor)]
    pub fn new(x: u8, y: u8, w: u8, h: u8) -> Region {
        Self { x, y, w, h }
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq, Hash)]
pub struct ImageBuffer {
    data: Vec<u8>,
    pub width: usize,
    pub height: usize,
}

#[wasm_bindgen]
impl ImageBuffer {

    #[wasm_bindgen(constructor)]
    pub fn new(data: Vec<u8>, width: usize, height: usize) -> ImageBuffer {
        Self { data, width, height }
    }

    pub fn empty() -> ImageBuffer {
        ImageBuffer::new(Vec::new(), 0, 0)
    }

    pub fn full(r: u8, g: u8, b: u8, a: u8, width: usize, height: usize) -> ImageBuffer {
        let mut data = Vec::with_capacity(width * height * 4);
        for _ in 0..(width * height) {
            data.extend_from_slice(&[r, g, b, a]);
        }
        return ImageBuffer::new(data, width, height);
    }

    #[wasm_bindgen(getter)]
    pub fn data(&self) -> Vec<u8> {
        self.data.clone()
    }

    pub fn write(&mut self, image: &ImageBuffer, pos: Pos) {
        if self.width == 0 || self.height == 0 || image.width == 0 || image.height == 0 {
            return;
        }

        let px = pos.x as isize;
        let py = pos.y as isize;

        let dst_w = self.width as isize;
        let dst_h = self.height as isize;
        let src_w = image.width as isize;
        let src_h = image.height as isize;

        let dst_x0 = px.max(0);
        let dst_y0 = py.max(0);
        let dst_x1 = (px + src_w).min(dst_w);
        let dst_y1 = (py + src_h).min(dst_h);

        if dst_x0 >= dst_x1 || dst_y0 >= dst_y1 {
            return;
        }

        let src_x0 = (dst_x0 - px) as usize;
        let src_y0 = (dst_y0 - py) as usize;

        let copy_w_px = (dst_x1 - dst_x0) as usize;
        let copy_h_px = (dst_y1 - dst_y0) as usize;
        let row_bytes = copy_w_px * 4;

        for row in 0..copy_h_px {
            let dst_y = (dst_y0 as usize) + row;
            let src_y = src_y0 + row;

            let dst_i = (dst_y * self.width + (dst_x0 as usize)) * 4;
            let src_i = (src_y * image.width + src_x0) * 4;

            self.data[dst_i..dst_i + row_bytes]
                .copy_from_slice(&image.data[src_i..src_i + row_bytes]);
        }
    }
}