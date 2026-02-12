mod colors;
mod draw_call;
mod ids;
mod primitives;
mod sprites;

use std::collections::HashMap;

use colors::ColorMap;
use sprites::{Spritelet, Sprite, Scene};
use wasm_bindgen::prelude::wasm_bindgen;
use ids::new_id;

use crate::{ids::Id, primitives::Region, sprites::{H, SpriteSheet, W}};

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

    pub fn render_spritesheet_rgba(&self) -> Vec<u8> {
        self.sprite_sheet.render_rgba(0, 0, W, H, ColorMap::identity())
    }

    // SPRITELETS

    fn new_spritelet(&mut self, region: Region) -> Id {
        let id = new_id();
        self.spritelets.insert(id, Spritelet {
            region,
            color_map: ColorMap::identity(),
        });
        return id;
    }

    fn get_spritelet(&mut self, id: Id) -> Option<Spritelet> {
        if self.spritelets.contains_key(&id) {
            Some(self.spritelets[&id].clone())
        } else {
            None
        }
    }

    fn update_spritelet(&mut self, id: Id, value: Spritelet) {
        if self.spritelets.contains_key(&id) {
            self.spritelets.insert(id, value);
        }
    }

    fn delete_spritelet(&mut self, id: Id) {
        self.spritelets.remove(&id);
        for sprite in self.sprites.values_mut() {
            sprite.delete_spritelet(id)
        }
    }

    // SPRITES

    fn new_sprite(&mut self) -> Id {
        let id = new_id();
        self.sprites.insert(id, Sprite::new());
        return id;
    }

    fn get_sprite(&mut self, id: Id) -> Option<Sprite> {
        if self.sprites.contains_key(&id) {
            Some(self.sprites[&id].clone())
        } else {
            None
        }
    }

    fn update_sprite(&mut self, id: Id, value: Sprite) {
        if self.sprites.contains_key(&id) {
            self.sprites.insert(id, value);
        }
    }

    fn delete_sprite(&mut self, id: Id) {
        self.sprites.remove(&id);
        for scene in self.scenes.values_mut() {
            scene.delete_sprite(id);
        }
    }

    // SCENES

    fn new_scene(&mut self) -> Id {
        let id = new_id();
        self.scenes.insert(id, Scene::new());
        return id;
    }

    fn get_scene(&mut self, id: Id) -> Option<Scene> {
        if self.scenes.contains_key(&id) {
            Some(self.scenes[&id].clone())
        } else {
            None
        }
    }

    fn update_scene(&mut self, id: Id, value: Scene) {
        if self.scenes.contains_key(&id) {
            self.scenes.insert(id, value);
        }
    }

    fn delete_scene(&mut self, id: Id) {
        self.scenes.remove(&id);
    }
}
