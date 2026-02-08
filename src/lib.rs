use std::{f32::INFINITY, sync::OnceLock};

use wasm_bindgen::prelude::*;
use rgb::{RGB8};
use oklab::{srgb_to_oklab, Oklab};

const W: usize = 128;
const H: usize = 128;

const PICO8_COLOURS: [RGB8; 32] = [
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

#[wasm_bindgen]
pub struct SpriteSheet {
    data: [[i8; H]; W],
}

#[wasm_bindgen]
impl SpriteSheet {

    #[wasm_bindgen(constructor)]
    /// Load a 128x128 RGBA image and quantize it into indices.
    pub fn from_rgba(&mut self, rgba: Vec<u8>) -> SpriteSheet{
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
}

// Return the pico-8 palette index closest to the input color in oklab space.
fn rgb_to_palette_idx(color_rgb: RGB8) -> i8 {
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
