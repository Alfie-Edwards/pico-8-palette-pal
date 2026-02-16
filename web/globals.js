import init, { Model, Region } from "./pkg/pico_8_palette_pal.js";
export { Region } from "./pkg/pico_8_palette_pal.js";

await init();
export const model = new Model();

export const els = Object.fromEntries(
    [
        "spritesheet",
        "minimap",
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
        "edit-spritelet-divider",
        "delete-spritelet",
        "selector-box",
        "selector-anchor-tl",
        "selector-anchor-tr",
        "selector-anchor-bl",
        "selector-anchor-br",
    ].map( id => [id.replaceAll("-", "_"), document.getElementById(id)])
)