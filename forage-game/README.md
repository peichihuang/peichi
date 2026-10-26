# Moshruums Forage (working title)

A collection game: mushrooms spawn at random across small garden maps, players forage them, and the collection unlocks hidden recipes, holiday decor mushrooms and shop coupons. The long-term plan is a phone app with the Moshruums store built in.

The earlier game, **Mushroom Patch** (grow rack, kitchen, café), is saved unchanged in `../mushroom-game`, at commit `c5258df`.

## Where we are

- `samples/index.html`: five style samples of the same foraging scene (low-poly island, soft 3D cove, illustrated map, clay islands, tiny café). Pick a direction before building the game.
- **Direction D, clay islands** (added after Pei shared a soft-clay 3D artist as a mood reference): matte clay miniatures in warm light, mushrooms as little characters with faces, and a boat to sail between seasonal islands. The artist is a mood reference only; nothing of theirs is copied.
- **Direction E, tiny café** (from Pei's "Tiny Garden" isometric room and needle-felted figure references): each map is a miniature isometric room or garden full of props, with felt-textured mushroom folk. The felt reference uses Sanrio and Nintendo characters, so only the wool texture idea is usable.
- These samples are code sketches. The final look needs concept art and 3D models from an artist; the game code can load their models.

## The core loop

1. **Forage:** each map has a few mushrooms at a time. Tap to pick; new ones spawn over real time, so there's a reason to check back.
2. **Collect:** every species has a common look plus decor variants (holiday, seasonal, map-only, gilded). The field guide shows what's still missing.
3. **Unlock:** collecting the right mushrooms reveals hidden recipes (dishes and drinks from Mushroom Patch) and, rarely, a coupon for the Moshruums shop.
4. **Explore:** new maps open as the collection grows. Each map has its own mushrooms and look.

## Ideas worth keeping

- **Decor as a system, not one-offs.** Build each mushroom from a base shape plus swappable layers (hat, scarf, pattern, color). One drawing of a Santa hat then works on every species, which is how a small team reaches hundreds of collectibles.
- **Farm-only spawns.** A QR code at the farmers market stall or inside a jar lid spawns a mushroom you can't find anywhere else. This ties the game to real visits and purchases.
- **Seasons and events.** Holiday decor only spawns in its season, so collectors come back each year.
- **Recipes as rewards.** Reuse the Kitchen and Café from Mushroom Patch as the place hidden recipes open up.

## Things to get right

- **Coupons:** in the app, coupons need to be single-use codes issued by the store (Shopify can do this), not one shared code. Keep coupon rewards free to earn, with no paid chances.
- **Wild species:** if the game includes wild or rare species, it should never suggest that players can identify wild mushrooms to eat from it.
- **App store:** selling physical products through Shopify inside an app is allowed without Apple's or Google's in-app purchase fees. Anything sold for the game itself would go through them.

## Suggested phases

1. **Style:** pick a direction from the samples and make 5 to 10 finished mushrooms in it.
2. **Web prototype:** one map, about 30 collectibles, spawning, field guide, a few hidden recipes and one coupon. Test it with real customers.
3. **Content:** more maps, decor variants and seasonal events, plus browsing products from the Shopify store.
4. **App:** wrap the web game as a phone app, then add push notifications ("new mushrooms sprouted") and single-use coupon codes.
