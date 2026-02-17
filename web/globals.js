import init, { Model, Region } from "./pkg/pico_8_palette_pal.js";
export { Region } from "./pkg/pico_8_palette_pal.js";

await init();
export const model = new Model();

export const els = Object.fromEntries(
    [
        "spritesheet",
        "spritesheet-box",
        "spritesheet-minimap",
        "load-spritesheet-button",
        "selected-spritelet-toolbar",
        "selected-spritelet",
        "selected-spritelet-x",
        "selected-spritelet-y",
        "selected-spritelet-width",
        "selected-spritelet-height",
        "add-spritelet",
        "spritesheet-zoom",
        "spritesheet-pan-x",
        "spritesheet-pan-y",
        "spritelet-list",
        "spritelet-list-2",
        "edit-spritelet-divider",
        "delete-spritelet",
        "selected-sprite",
    ].map( id => [id.replaceAll("-", "_"), document.getElementById(id)])
)