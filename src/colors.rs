use std::{f32::INFINITY, sync::OnceLock};

use rgb::{RGB8};
use oklab::{srgb_to_oklab, Oklab};

pub const PICO8_COLOURS: [RGB8; 32] = [
    RGB8 {r:  41, g:  24, b:  20},
    RGB8 {r:  17, g:  29, b:  53},
    RGB8 {r:  66, g:  33, b:  54},
    RGB8 {r:  18, g:  83, b:  89},
    RGB8 {r: 116, g:  47, b:  41},
    RGB8 {r:  73, g:  51, b:  59},
    RGB8 {r: 162, g: 136, b: 121},
    RGB8 {r: 243, g: 239, b: 125},
    RGB8 {r: 190, g:  18, b:  80},
    RGB8 {r: 255, g: 108, b:  36},
    RGB8 {r: 168, g: 231, b:  46},
    RGB8 {r:   0, g: 181, b:  67},
    RGB8 {r:   6, g:  90, b: 181},
    RGB8 {r: 117, g:  70, b: 101},
    RGB8 {r: 255, g: 110, b:  89},
    RGB8 {r: 255, g: 157, b: 129},
    RGB8 {r:   0, g:   0, b:   0},
    RGB8 {r:  29, g:  43, b:  83},
    RGB8 {r: 126, g:  37, b:  83},
    RGB8 {r:   0, g: 135, b:  81},
    RGB8 {r: 171, g:  82, b:  54},
    RGB8 {r:  95, g:  87, b:  79},
    RGB8 {r: 194, g: 195, b: 199},
    RGB8 {r: 255, g: 241, b: 232},
    RGB8 {r: 255, g:   0, b:  77},
    RGB8 {r: 255, g: 163, b:   0},
    RGB8 {r: 255, g: 236, b:  39},
    RGB8 {r:   0, g: 228, b:  54},
    RGB8 {r:  41, g: 173, b: 255},
    RGB8 {r: 131, g: 118, b: 156},
    RGB8 {r: 255, g: 119, b: 168},
    RGB8 {r: 255, g: 204, b: 170},
];

static PICO8_COLOURS_OKLAB: OnceLock<[Oklab; 32]> = OnceLock::new();

fn pico8_colors_oklab() -> &'static [Oklab; 32] {
    PICO8_COLOURS_OKLAB.get_or_init(
        || std::array::from_fn(|i| srgb_to_oklab(PICO8_COLOURS[i]))
    )
}

// Return the pico-8 palette index closest to the input color in oklab space.
pub fn rgb_to_palette_idx(color_rgb: RGB8) -> i8 {
    let color_oklab = srgb_to_oklab(color_rgb);
    let i = quantize_oklab(color_oklab, pico8_colors_oklab());

    // Convert to pico-8 palette index.
    return (i as i8) - 16;
}

// Returns the index of the color in the palette that was closest to the input color.
fn quantize_oklab<'a, I>(color: Oklab, palette: I) -> usize
where
    I : IntoIterator<Item = &'a Oklab>,
{
    let mut closest_i = 0;
    let mut closest_sqdist = INFINITY;
    let mut i = 0;
    for palette_color in palette {
        let da = palette_color.a - color.a;
        let db = palette_color.b - color.b;
        let dl = palette_color.l - color.l;
        let sqdist = da * da + db * db + dl * dl;
        if sqdist < closest_sqdist {
            closest_sqdist = sqdist;
            closest_i = i;
        }
        i += 1;
    }
    return closest_i
}

use wasm_bindgen::prelude::wasm_bindgen;

/// Map all 32 pico-8 colors (-16..15) to either a pico-8 color or transparent.

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash)]
pub struct ColorMap {
    mapping: [Option<i8>; 32],
}

#[wasm_bindgen]
impl ColorMap {
    pub fn all_transparent() -> Self {
        Self { mapping: [None; 32] }
    }

    pub fn identity() -> Self {
        Self { mapping: std::array::from_fn(|i| Some(i as i8 - 16)) }
    }

    pub fn set(&mut self, from: i8, to: Option<i8>) {
        self.mapping[(from + 16) as usize] = to
    }

    pub fn get(&self, from: i8) -> Option<i8> {
        self.mapping[(from + 16) as usize]
    }

    pub fn then(&self, rhs: ColorMap) -> ColorMap {
        let mut out = ColorMap::all_transparent();
        for col in -16i8..16 {
            match self.get(col) {
                Some(x) => out.set(col, rhs.get(x)),
                None => out.set(col, None),
            }
        }
        return out;
    }
}

impl std::ops::Mul for ColorMap {
    type Output = ColorMap;

    fn mul(self, rhs: ColorMap) -> ColorMap {
        self.then(rhs)
    }
}
