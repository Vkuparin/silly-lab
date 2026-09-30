# Art and audio manifest

The 1.0 visuals in `src/Art.tsx` are original inline vector artwork created for this project: normal mole, gold-crowned mole, star-hat mole and crossed-out bomb. Shapes and expressions share one 180×180 coordinate system; artwork is bundled with the frontend and never downloaded at runtime.

`src/index.css` supplies original CSS scene layers (sky, sun, clouds, hills, flowers and space planet), shaded hole rims, UI treatments and restrained transitions. Garden, Snow Garden and Space Garden change scenery without changing target meaning. OS emoji are used for avatar choices only; their appearance depends on the system font. Flower/star symbols are typographic decoration, not distinct gameplay targets.

Effects in `src/sound.ts` and music patterns in `src/music.ts` are synthesized with WebAudio; no external recordings, stock imagery, raster assets or fonts were added. Existing open-source dependency licenses continue to apply to their respective packages. No third-party artwork attribution is required for the new original SVG/CSS work.
