# pico-8-palette-pal
A tool to help artists work with the technical aspects of PICO-8 palettes and sprite drawing.

PICO-8 can display 32 colours, but only 16 can be on-screen at any one time.
The sprite sheet only uses a fixed set of 16 of the 32 colours, meaning art must be mapped into the reduced colour space by the artist, then correctly unmapped at draw time. This is further complicated by things like palette swapping, masking out parts of sprites, and changing the sceen palette scene-to-scene to make use of more colours.

This tool allows you to work with a sprite sheet in the full 32 displayable colours. It is not a drawing tool, the 128X128 sprite sheet must be created externally and imported. Colours will be quantized to the nearest PICO-8 colour. The output is a sprite sheet with remapped colours such that it can be imported into PICO-8, along with code for drawing each sprite.

  - You can label rectangular regions of the sprite sheet.
  - You can combine one or more regions into a sprite, with each region individually positioned.
  - You can define multiple scenes with individual screen palettes, enabling more than 16 colours to be used overall.
  - Palette swaps and masking can be applied at all levels.
