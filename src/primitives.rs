use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash)]
pub struct Pos {
    x: i8,
    y: i8,
}

#[wasm_bindgen]
impl Pos {
    #[wasm_bindgen(constructor)]
    pub fn new(x: i8, y: i8) -> Pos {
        Pos { x, y }
    }

    pub fn origin() -> Pos {
        Pos { x: 0, y: 0 }
    }

    #[wasm_bindgen(getter)]
    pub fn x(&self) -> i8 { self.x }

    #[wasm_bindgen(getter)]
    pub fn y(&self) -> i8 { self.y }
}

/// x, y, w, h.
#[wasm_bindgen]
#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash)]
pub struct Region {
    x: u8,
    y: u8,
    w: u8,
    h: u8,
}

#[wasm_bindgen]
impl Region {
    #[wasm_bindgen(constructor)]
    pub fn new(x: u8, y: u8, w: u8, h: u8) -> Region {
        Self { x, y, w, h }
    }

    #[wasm_bindgen(getter)]
    pub fn x(&self) -> u8 { self.x }

    #[wasm_bindgen(getter)]
    pub fn y(&self) -> u8 { self.y }

    #[wasm_bindgen(getter)]
    pub fn w(&self) -> u8 { self.w }

    #[wasm_bindgen(getter)]
    pub fn h(&self) -> u8 { self.h }
}