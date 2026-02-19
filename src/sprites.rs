use rgb::RGB8;
use wasm_bindgen::prelude::wasm_bindgen;

use crate::{colors::{ColorMap, PICO8_COLOURS, rgb_to_palette_idx}, ids::Id, primitives::{ImageBuffer, Pos, Region}};

pub const W: usize = 128;
pub const H: usize = 128;

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub struct SpriteSheet {
    data: [[i8; H]; W],
}

impl SpriteSheet {

    pub fn new() -> SpriteSheet {
        let mut data = [[0; H]; W];
        for col in 0..W {
            for row in 0..H {
                // Generate a spritesheet with all the colours that looks
                // non-repetitive.
                let x = col / 16;
                let y = row / 16;

                let col_in = col % 16;
                let row_in = row % 16;

                let xf0 = x ^ ((y >> 2) * 7);
                let shift = ((0x3C >> y) & 1) * 4;
                let xf = (xf0 + shift) & 7;

                let a = (xf + 8*y) & 31;
                let b = (a + 16) & 31;

                let v = if col_in + row_in < 16 { a } else { b };
                data[col][row] = (v - 16) as i8;
            }
        }
        Self { data }
    }

    /// Load a 128x128 RGBA image and quantize it into indices.
    pub fn from_rgba(rgba: Vec<u8>) -> SpriteSheet {
        if rgba.len() != W * H * 4 {
            panic!("RGBA buffer must be exactly {}*{}*4 bytes", W, H);
        }

        let mut data = [[0; H]; W];

        for row in 0..H {
            for col in 0..W {
                let offset = (row * W + col) * 4;
                let pixel_rgb= RGB8 {
                    r: rgba[offset + 0],
                    g: rgba[offset + 1],
                    b: rgba[offset + 2],
                };
                data[col][row] = rgb_to_palette_idx(pixel_rgb);
            }
        }

        Self { data: data }
    }

    pub fn render_rgba(self, region: Region, color_map: ColorMap, flip_x: bool, flip_y: bool) -> ImageBuffer {
        let x = region.x as usize;
        let y = region.y as usize;
        let mut w = region.w as usize;
        let mut h = region.h as usize;
        if w == 0 || h == 0 || x >= W || y >= H {
            return ImageBuffer::empty();
        }
        if (x + w) > W {
            w = W - x;
        }
        if (y + h) > H {
            h = W - y;
        }
        let mut data = Vec::with_capacity(w * h * 4);
        for j in 0..h {
            let row =  if flip_y { y + h - 1 - j } else { y + j };
            for i in 0..w {
                let col: usize =  if flip_x { x + w - 1 - i } else { x + i };
                match color_map.get(self.data[col][row]) {
                    Some(color_id) =>  {
                        data.extend(PICO8_COLOURS[(color_id + 16) as usize].iter());
                        data.push(u8::max_value());
                    }
                    None => data.extend([0, 0, 0, 0].iter()),
                }
            }
        }
        return ImageBuffer::new(data, w, h);
    }
}

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash)]
pub struct Spritelet {
    pub region: Region,
    pub color_map: ColorMap,
}

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash)]
pub struct SpriteComponent {
    pub spritelet_id: Id,
    pub pos: Pos,
    pub flip_x: bool,
    pub flip_y: bool,
    pub color_map: ColorMap,
}

#[wasm_bindgen]
impl SpriteComponent {

    #[wasm_bindgen(constructor)]
    pub fn new(spritelet_id: Id, pos: Pos) -> SpriteComponent {
        Self {
            spritelet_id: spritelet_id,
            pos: pos,
            flip_x: false,
            flip_y: false,
            color_map: ColorMap::identity(),
        }
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq, Hash)]
pub struct Sprite {
    components: Vec<SpriteComponent>,
    pub origin: Pos,
    pub color_map: ColorMap,
}

#[wasm_bindgen]
impl Sprite {

    #[wasm_bindgen(constructor)]
    pub fn new() -> Sprite {
        Self {
            components: Vec::new(),
            origin: Pos::origin(),
            color_map: ColorMap::identity(),
        }
    }

    pub fn num_components(&self) -> usize {
        self.components.len()
    }

    pub fn add_component(&mut self, spritelet_id: Id, pos: Pos) {
        self.components.push(SpriteComponent::new(spritelet_id, pos));
    }

    pub fn get_component(&self, i: usize) -> Option<SpriteComponent> {
        if i < self.components.len() {
            Some(self.components[i].clone())
        } else {
            None
        }
    }

    pub fn update_component(&mut self, i: usize, value: SpriteComponent) {
        if i < self.components.len() {
            self.components[i] = value;
        }
    }

    pub fn delete_component(&mut self, i: usize) {
        if i < self.components.len() {
            self.components.remove(i);
        }
    }

    pub fn delete_spritelet(&mut self, id: Id) {
        let mut i = 0;
        while i < self.components.len() {
            if self.components[i].spritelet_id == id {
                self.components.remove(i);
            } else {
                i += 1;
            }
        }
    }

    pub fn shift_component_up(&mut self, i: usize) {
        if i < (self.components.len() - 1) {
            self.components.swap(i, i + 1);
        }
    }

    pub fn shift_component_down(&mut self, i: usize) {
        if i > 0 && i < self.components.len(){
            self.components.swap(i - 1, i);
        }
    }

    #[wasm_bindgen(getter)]
    pub fn top_left(&self) -> Pos {
        if self.components.len() == 0 {
            return Pos::origin();
        }
        let mut x = u8::MAX;
        let mut y = u8::MAX;

        for component in &self.components {
            x = x.min(component.pos.x);
            y = y.min(component.pos.y);
        }
        return Pos::new(x, y);
    }
}

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash)]
pub struct SceneComponent {
    pub sprite_id: Id,
    pub color_map: ColorMap,
}

#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Scene {
    components: Vec<SceneComponent>,
    pub color_map: ColorMap,
}

#[wasm_bindgen]
impl Scene {

    #[wasm_bindgen(constructor)]
    pub fn new() -> Scene {
        Self {
            components: Vec::new(),
            color_map: ColorMap::identity(),
        }
    }

    pub fn add_component(&mut self, id: Id) {
        self.components.push(
            SceneComponent {
                sprite_id: id,
                color_map: ColorMap::identity(),
        });
    }

    pub fn get_component(&self, i: usize) -> Option<SceneComponent> {
        if i < self.components.len() {
            Some(self.components[i].clone())
        } else {
            None
        }
    }

    pub fn update_component(&mut self, i: usize, value: SceneComponent) {
        if i < self.components.len() {
            self.components[i] = value;
        }
    }

    pub fn delete_component(&mut self, i: usize) {
        if i < self.components.len() {
            self.components.remove(i);
        }
    }

    pub fn delete_sprite(&mut self, id: Id) {
        let mut i = 0;
        while i < self.components.len() {
            if self.components[i].sprite_id == id {
                self.components.remove(i);
            } else {
                i += 1;
            }
        }
    }
}
