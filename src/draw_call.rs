use crate::primitives::Region;

/// Map all 16 pico-8 sprite sheet colors (0..15) to either a pico-8 color or transparent.
pub type Palette = [Option<i8>; 16];

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub struct DrawCall {
    x: u8,
    y: u8,
    region: Region,
    palette: Palette,
    flip_x: bool,
    flip_y: bool,
}

impl DrawCall {
    fn offset(&self, x: i8, y: i8) -> DrawCall {
        DrawCall {
            x: (self.x as i8 + x) as u8,
            y: (self.y as i8 + y) as u8,
            region: self.region,
            palette: self.palette,
            flip_x: self.flip_x,
            flip_y: self.flip_y,
        }
    }
}
