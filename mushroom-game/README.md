# Moshruum Patch

A browser game for moshruums.com, in three parts:

- **Grow:** a farm rack with 4 slots. Players grow culinary mushrooms (Blue, Pink and Golden Oyster, Lion's Mane, Pioppino, King Trumpet, Black Pearl King, Maitake, Nameko) and functional mushrooms (Lion's Mane, Reishi, Cordyceps, Turkey Tail) in real time. Harvests go into a pantry and a personal Collection.
- **Kitchen (cooking recipes):** plate a dish by tapping mushrooms and over 100 ingredients (vegetables, protein, grains and bread, dairy, fruit, herbs, spices and nuts, sauces), then dragging them into place. Ingredients are searchable. Pick the plate, the surface and a cooking method. Finished dishes go into the **Recipe Book**, tagged with a category (breakfast, soup, pasta and noodles…). Vegan, vegetarian, seafood and meat tags are worked out from the ingredients.
- **Café (barista recipes):** build a drink in clear glass (glass mug, tall glass or short glass), step by step: hot or iced, base, milk, mushroom add-in, sweetener and finishing touches. The add-ins are Moshruum's jars (Morning Booster, Lion's Mane, Evening Glow) plus powders players grow. Finished drinks go into the **Café Menu**.
- **Premium:** both books open with a Premium section of recipes the farm hand-picks, shown with large cinematic covers.
- **Search:** both books have a search bar and category filters (Vegan, Seafood, Soup… for dishes; Coffee, Matcha, Milk tea, Iced, Dairy-free… for drinks).

**Gilded mushrooms:** about 1 in 15 blocks grows gilded, and every player gets one by their 5th block at the latest. Harvesting one reveals the code `GILDED10` for 10% off at the shop. The code stays in the player's Collection.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | Page structure |
| `css/style.css` | Look and layout |
| `js/data.js` | Everything you may want to edit: settings, products, mushrooms, ingredients, drinks, farm recipes |
| `js/art.js` | The illustrations, drawn in code |
| `js/ingredients.js` | The kitchen's ingredient library and its drawings |
| `js/store.js` | Saved progress and the shared gallery |
| `js/app.js` | The game itself |

There is no build step. Progress saves in each visitor's own browser.

## Before going live

1. **Create the discount in Shopify.** In Shopify admin, open **Discounts → Create discount → Amount off order**. Use the code `GILDED10` and 10% off. Set **Limit to one use per customer** and an end date if you like. To change the code or the wording, edit `gildedCode` and `gildedOffer` in `js/data.js`.
2. **Add product links.** In `js/data.js`, set each product's `url` (Morning Booster, Lion's Mane, Evening Glow) to its Shopify product page. Also check the short product descriptions there. The jar label colors and label text match the real jars.
3. **Check the shop link.** `shopUrl` in `js/data.js` is used for the logo and the "Visit the shop" link.

Because the code is shared, people can pass it around. Shopify's one-use-per-customer limit keeps that in check. Unique single-use codes need a small server and are a good fit for the phone app later.

## Put it on moshruums.com

### Option A: GitHub Pages plus an embed

1. In this repository on GitHub, go to **Settings → Pages**, choose **Deploy from a branch**, pick the branch and `/ (root)`, and save.
2. The game is then live at `https://peichihuang.github.io/peichi/mushroom-game/`.
3. On Shopify, add a page and put this in a **Custom Liquid** section, or in the page's HTML view:

```html
<iframe
  src="https://peichihuang.github.io/peichi/mushroom-game/"
  title="Moshruum Patch"
  style="width:100%; height:1100px; border:0;"
  loading="lazy"></iframe>
```

On phones the game stacks vertically and is taller. Linking straight to the game page also works well.

### Option B: upload the folder

If your host accepts static files, upload the whole `mushroom-game` folder and link to its `index.html`.

## Premium recipes and cover photos

The Premium section is set in `MP.premium` in `js/data.js`: a list of recipe ids in the order they appear.

- Without a cover photo, the game draws a cinematic cover from the recipe itself.
- To use a real photo, cook the dish, photograph it, and save the photo in a `covers` folder next to `index.html`, for example `covers/seared-lions-mane.jpg`. Then set `cover: 'covers/seared-lions-mane.jpg'` for that recipe. A wide 16:10 photo works best.
- To feature a player's recipe on the website, tick `featured` for its row in Supabase and paste the photo's address into `cover` (see below).
- In the Claude preview, the owner sees an **Add to Premium** button on every recipe.

## Shared gallery

The Recipe Book and Café Menu always show the farm's recipes (edit them in `MP.farmRecipes` in `js/data.js`) plus each player's own. To let players see each other's recipes on your website, connect a free [Supabase](https://supabase.com) database:

1. Create a Supabase project. In the **SQL editor**, run:

```sql
create table recipes (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('dish', 'drink')),
  title text not null check (char_length(title) <= 60),
  author text check (char_length(author) <= 30),
  notes text check (char_length(notes) <= 1200),
  comp jsonb not null,
  created bigint not null,
  tags text[] default '{}',
  featured boolean not null default false,
  cover text,
  approved boolean not null default false
);
alter table recipes enable row level security;
create policy "read approved" on recipes for select using (approved);
create policy "add new" on recipes for insert with check (approved = false and featured = false and cover is null);
```

2. In **Project settings → API**, copy the project URL and the `anon` public key into `supabaseUrl` and `supabaseKey` in `js/data.js`.
3. New posts wait for approval. To approve one, open the `recipes` table in Supabase and tick `approved`. To publish posts without review, set `galleryNeedsApproval: false` in `js/data.js`, change the `approved` column default to `true`, and change the "add new" policy to `with check (true)`.

Approval is on by default because the posts are public and appear on your brand's site.

## Testing

- Add `?speed=60` to the URL to make time run 60× faster, or `#timelapse` for 120×.
- In the browser console, `MP.debug.setGrowth(0, 1000)` makes the block in slot 1 ready to harvest.
- `#grow`, `#kitchen`, `#cafe`, `#recipes` and `#menu` at the end of the URL open that section directly.

## Ideas for later

- Holiday editions, such as Christmas decor mushrooms, as collectible variants in the Collection.
- Bilingual labels (繁中 / EN), like FORi.
- A "Wild & rare" field guide of species the farm doesn't grow (morels, chanterelles, glow-in-the-dark mushrooms) as rare finds.
- A phone app with the Shopify store built in, and unique single-use discount codes for gilded finds.
