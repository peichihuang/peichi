# Moshruum Patch

A cozy browser game for moshruums.com. Visitors pick one of the farm's mushroom varieties, then mist it, give it fresh air and sing to it while it grows in real time. Harvested mushrooms fill a field guide and a basket, and players can save a picture card of their mushroom to share.

Everything lives in one file, `index.html`. There is no build step, no server and no tracking. Progress is saved in each visitor's own browser (localStorage).

## How the game works

| Stage | Growth points | What players see |
| --- | --- | --- |
| Just planted | 0 | Sawdust block with grain spawn, bag closed |
| Colonizing | 40 | White mycelium spreads until the block turns white |
| Pinning | 260 | Bag opens and tiny pins appear |
| Baby mushrooms | 420 | The mushroom appears, with a little face |
| Fruiting | 640 | Caps open up and keep growing |
| Ready to harvest | 1000 | Harvest button, picture card and field guide entry |

- **Humidity** drops about 1% RH per minute. The ideal range is 85–95%. **Mist** raises it.
- **CO₂** builds up from the colonizing stage on. Under 1,000 ppm is ideal once pins appear. **Fresh air** lowers it. While colonizing, the game explains that mycelium likes stuffy air, just like on a real farm.
- **Growth** is 1 point per minute when both readings are ideal, and slower otherwise. A well-tended block is ready in about 17 hours, so people come back the next day. Care actions give small boosts, so a first visit already shows progress.
- Nothing ever dies. Neglect only slows growth.
- About 1 in 12 blocks is a rare **glow-in-the-dark** mushroom.
- The room follows the visitor's local time: dawn, day, dusk and night. At night the mushroom gets sleepy.
- Harvest weight in grams depends on how well the block was cared for.

## Put it on moshruums.com

### Option A: host it free with GitHub Pages, then embed it

1. In this repository on GitHub, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**. Pick the branch and the `/ (root)` folder, then save.
3. After a minute the game is live at `https://peichihuang.github.io/peichi/mushroom-game/`.
4. On your website, add an embed or code block with:

```html
<iframe
  src="https://peichihuang.github.io/peichi/mushroom-game/"
  title="Moshruum Patch, a mushroom growing game"
  style="width:100%; height:900px; border:0; border-radius:24px;"
  loading="lazy"></iframe>
```

On phones the game is taller, about 1,300px with the controls below the scene. If your site builder supports it, use a taller embed on mobile, or link to the game page directly.

### Option B: upload the file to your own site

If your website host lets you upload HTML files, upload `index.html` (for example as `/grow/index.html`). Then link to it, or embed it with the iframe above.

## Things you can change

At the top of the `<script>` in `index.html`:

- `SHOP_URL` is where the logo and "Taste the real thing" link go. Point it at your shop page.
- `STORE_KEY` is the save slot name. Change it only if you want everyone to start over.

The varieties, facts and kitchen tips are in the `SPECIES` list, and the random names are in `NAMES`.

## Testing and demos

- Add `?speed=60` to the URL to make time run 60× faster, or `#timelapse` for 120×. A full grow then takes minutes instead of a day.
- In the browser console, `moshruum.debug.setGrowth(1000)` jumps the current mushroom to harvest.
- To reset, clear the site's data in the browser.
