# Tools (hidden from the website; listed in _config.yml)

Scripts used to build and check the site. Fictional sample people only: never use a real person's details.

## Setup (once per session)
- Test browser: Playwright is usually preinstalled (`NODE_PATH=$(npm root -g)`). Scripts are `.cjs` because the repo is an ES-module package.
- Environment: `KYE_SCRATCH` = a scratch folder (default `/tmp/kye-scratch`; keeps a font cache and `chart.json`), `KYE_REPO` = the folder to test (default: current folder). Test the clean copy of `main`, not a messy branch.
- Sample chart data: copy `worker.js astro-engine.js numerology-calculator.js cities.js cities-data.js package.json data/` into `$KYE_SCRATCH/wrun`, run `npm install` there, then `node tools/test/make_sample_chart.mjs $KYE_SCRATCH/chart.json`. Human Design needs a paid outside service, so `results.cjs` uses placeholder Human Design data.
- Renders: `python3 -m venv v && v/bin/pip install bpy pillow numpy` (Blender 5.3 as a module; Cycles path tracer; about 4 to 10 minutes per picture on 4 cores).

## Test scripts (`tools/test/`)
- `results.cjs <outDir> <tag> [repo]`: loading screen, full results page, and opened Numerology, Pinnacle, Reading and Timeline cards. Prints every card title's size and whether it fits on one line.
- `whole_page.cjs <outDir> /index.html <tag> 3500`: the entire page top to bottom in Relational mode (the owner asks for the WHOLE page, not crops).
- `form.cjs`: the form in Individual and Relational mode.
- `ribbon.cjs` + `ribbon_symmetry.py`: the energy ribbon alone, and a number for how alike its two ends are (left end vs right end turned 180 degrees).
- `pinnacles.cjs`: the text under each Pinnacle for two sample birth dates. `relationship_buttons.cjs`: the buttons are hidden for Individual and shown for Relational.

## Renders (`tools/render/jewel.py`)
Hero (the jewel in the old solar system's exact spot: pearl centre 294,264 on a 390px phone, 12 degrees clockwise): 
`SEED=3 SATIN=0.003,0.003,0.003 ROUGH=0.2 RAKE=250 TOPL=100 LEAN=0.18 LM=0.04 WORLD=0.05 FSTOP=16 WL=1.1 VELW=0.03,0.03,0.03 python jewel.py -- hero out.png 1410 420` (saved as `img/jewel/hero.webp`, quality 88). 
Diamond divider: `EL=42 LM=3.0 WORLD=1.0 GL=12 python jewel.py -- gem out.png 320 300`, crop to its bounding box (`img/jewel/gem.webp`). 
Light amount `LM` matters: too high turns the pearl to a flat white ball. All light is neutral white (no tint) and diamonds have no dispersion, on purpose.
