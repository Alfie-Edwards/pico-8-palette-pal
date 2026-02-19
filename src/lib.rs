mod colors;
mod draw_call;
mod ids;
mod primitives;
mod sprites;

use std::{cmp::{max, min}, collections::HashMap, i32};

use colors::ColorMap;
use sprites::{Spritelet, Sprite, Scene};
use wasm_bindgen::prelude::wasm_bindgen;
use ids::new_id;

use crate::{ids::Id, primitives::{ImageBuffer, Pos, Region}, sprites::{H, SpriteSheet, W}};

#[wasm_bindgen]
pub struct Model {
    sprite_sheet: SpriteSheet,
    spritelets: HashMap<Id, Spritelet>,
    sprites: HashMap<Id, Sprite>,
    scenes: HashMap<Id, Scene>,
}

#[wasm_bindgen]
impl Model {

    #[wasm_bindgen(constructor)]
    pub fn new() -> Model {
        Self {
            sprite_sheet: SpriteSheet::new(),
            spritelets: HashMap::new(),
            sprites: HashMap::new(),
            scenes: HashMap::new(),
        }
    }

    // SPRITE SHEET

    pub fn load_spritesheet_rgba(&mut self, rgba: Vec<u8>) {
        self.sprite_sheet = SpriteSheet::from_rgba(rgba);
    }

    pub fn render_spritesheet_rgba(&self) -> ImageBuffer {
        self.sprite_sheet.render_rgba(Region::new(0, 0, W as u8, H as u8), ColorMap::identity(), false, false)
    }

    pub fn render_spritelet_rgba(&self, id: Id) -> ImageBuffer {
        self.render_spritelet_color_mapped_rgba(id, ColorMap::identity(), false, false)
    }

    pub fn render_spritelet_color_mapped_rgba(&self, id: Id, color_map: ColorMap, flip_x: bool, flip_y: bool) -> ImageBuffer {
        if !self.spritelets.contains_key(&id) {
            return ImageBuffer::empty();
        }
        return self.sprite_sheet.render_rgba(
            self.spritelets[&id].region,
            self.spritelets[&id].color_map * color_map,
            flip_x, flip_y,
        );
    }

    pub fn render_sprite_color_mapped_rgba(&self, id: Id, color_map: ColorMap) -> ImageBuffer {
        match self.get_sprite(id) {
            None => {
                return ImageBuffer::empty();
            },
            Some(sprite) => {
                let mut l = i32::MAX;
                let mut t = i32::MAX;
                let mut r = i32::MIN;
                let mut b = i32::MIN;

                for i in 0..sprite.num_components() {
                    match self.sprites[&id].get_component(i) {
                        Some(component) => {
                            l = min(l, component.pos.x as i32);
                            t = min(t, component.pos.y as i32);

                            match self.get_spritelet(component.spritelet_id) {
                                Some(spritelet) => {
                                    r = max(r, component.pos.x as i32 + spritelet.region.w as i32);
                                    b = max(b, component.pos.y as i32 + spritelet.region.h as i32);
                                },
                                None => {
                                    r = max(r, component.pos.x as i32);
                                    b = max(b, component.pos.y as i32);
                                },
                            }
                        },
                        None => { },
                    }
                }

                let width = (r - l) as usize;
                let height = (b - t) as usize;
                let mut result_image = ImageBuffer::full(0, 0, 0, 0, width, height);
                for i in 0..sprite.num_components() {
                    match self.sprites[&id].get_component(i) {
                        Some(component) => {
                            let spritelet_image = self.render_spritelet_color_mapped_rgba(
                                component.spritelet_id, color_map,
                                component.flip_x, component.flip_y);
                            let relative_pos = Pos::new(component.pos.x - l as u8, component.pos.y - t as u8);
                            result_image.write(&spritelet_image, relative_pos);
                        },
                        None => { },
                    }
                }

                return result_image;
            }
        }
    }

    pub fn render_sprite_rgba(&self, id: Id) -> ImageBuffer {
        self.render_sprite_color_mapped_rgba(id, ColorMap::identity())
    }

    // SPRITELETS

    pub fn spritelet_ids(&self) -> Vec<Id> {
        let mut ids: Vec<Id> = self.spritelets.keys().cloned().collect();
        ids.sort();
        return ids;
    }

    pub fn new_spritelet(&mut self, region: Region) -> Id {
        let id = new_id();
        self.spritelets.insert(id, Spritelet {
            region,
            color_map: ColorMap::identity(),
        });
        return id;
    }

    pub fn get_spritelet(&self, id: Id) -> Option<Spritelet> {
        if self.spritelets.contains_key(&id) {
            Some(self.spritelets[&id].clone())
        } else {
            None
        }
    }

    pub fn update_spritelet(&mut self, id: Id, value: Spritelet) {
        if self.spritelets.contains_key(&id) {
            self.spritelets.insert(id, value);
        }
    }

    pub fn delete_spritelet(&mut self, id: Id) {
        self.spritelets.remove(&id);
        for sprite in self.sprites.values_mut() {
            sprite.delete_spritelet(id);
        }
    }

    // SPRITES

    pub fn sprite_ids(&self) -> Vec<Id> {
        let mut ids: Vec<Id> = self.sprites.keys().cloned().collect();
        ids.sort();
        return ids;
    }


   pub fn new_sprite(&mut self) -> Id {
        let id = new_id();
        self.sprites.insert(id, Sprite::new());
        return id;
    }

    pub fn get_sprite(&self, id: Id) -> Option<Sprite> {
        if self.sprites.contains_key(&id) {
            Some(self.sprites[&id].clone())
        } else {
            None
        }
    }

    pub fn update_sprite(&mut self, id: Id, value: Sprite) {
        if self.sprites.contains_key(&id) {
            self.sprites.insert(id, value);
        }
    }

    pub fn delete_sprite(&mut self, id: Id) {
        self.sprites.remove(&id);
        for scene in self.scenes.values_mut() {
            scene.delete_sprite(id);
        }
    }

    // SCENES

    pub fn scene_ids(&self) -> Vec<Id> {
        let mut ids: Vec<Id> = self.scenes.keys().cloned().collect();
        ids.sort();
        return ids;
    }

    pub fn new_scene(&mut self) -> Id {
        let id = new_id();
        self.scenes.insert(id, Scene::new());
        return id;
    }

    pub fn get_scene(&self, id: Id) -> Option<Scene> {
        if self.scenes.contains_key(&id) {
            Some(self.scenes[&id].clone())
        } else {
            None
        }
    }

    pub fn update_scene(&mut self, id: Id, value: Scene) {
        if self.scenes.contains_key(&id) {
            self.scenes.insert(id, value);
        }
    }

    pub fn delete_scene(&mut self, id: Id) {
        self.scenes.remove(&id);
    }
}
