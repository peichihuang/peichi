/* Moshruum Patch: game data. Edit names, copy and links here. */
(function (MP) {
'use strict';

MP.config = {
  shopUrl: 'https://moshruums.com',
  storeKey: 'moshruum-patch-v2',
  /* Shared recipe gallery on your own website (see README, "Shared gallery").
     Leave blank and the gallery shows farm recipes plus each visitor's own. */
  supabaseUrl: '',
  supabaseKey: '',
  /* true: new posts wait for your approval before everyone sees them. */
  galleryNeedsApproval: true,
  /* Gilded mushrooms: a rare harvest that reveals a Shopify discount code.
     Create this code in Shopify (Discounts) before going live. */
  gildedCode: 'GILDED10',
  gildedOffer: '10% off your next order',
  gildedChance: 1 / 15,
  gildedGuaranteeBy: 5, // the first gilded mushroom arrives by this block at the latest
};

/* Moshruums products offered in the cafe. Fill in the real product links.
   label: the jar's label color. tagline and sub are printed on the label. */
MP.products = [
  { id: 'morning', name: 'Morning Booster', full: 'Morning Booster, Triple Mushroom Complex Powder', line: 'Triple mushroom complex',
    label: '#FAEC88', tagline: 'ENERGY | DAILY DEFENSE | FOCUS', sub: 'triple mushroom complex', color: '#C9A46A',
    note: "A triple mushroom complex of Cordyceps, Lion's Mane and Turkey Tail, made for your morning cup.", url: 'https://moshruums.com',
    mushrooms: ['cordyceps', 'lions', 'turkeytail'] },
  { id: 'lionsmane', name: "Lion's Mane", full: "Organic Lion's Mane Mushroom Extract Powder", line: 'Organic extract powder',
    label: '#CCCEF6', mushrooms: ['lions'], tagline: 'CLARITY | MENTAL WELLNESS | FOCUS', sub: 'mushroom extract powder', color: '#E2D3B4',
    note: "Organic lion's mane mushroom extract powder.", url: 'https://moshruums.com' },
  { id: 'evening', name: 'Evening Glow', full: 'Evening Glow, Nighttime Mushroom Complex Powder', line: 'Nighttime mushroom complex',
    label: '#EDBCC9', tagline: 'UNWIND | BALANCE | GLOW', sub: 'four mushroom complex', color: '#9A6A5A',
    note: 'A thoughtful blend of Reishi, Tremella, Shiitake and Chaga for evening rituals and quiet moments.', url: 'https://moshruums.com',
    mushrooms: ['reishi'] },
];

/* group: culinary | functional. Lion's mane is both. */
MP.species = {
  blue: { name: 'Blue Oyster', latin: 'Pleurotus ostreatus', tag: 'BLUE OYSTER', group: 'culinary', grams: 220, pin: '#6F86A3',
    fact: 'Caps start a deep slate blue and fade to soft grey as they open, in overlapping shelves like a stack of fans.',
    use: 'Tear by hand and sear in a hot pan until the edges crisp.' },
  pink: { name: 'Pink Oyster', latin: 'Pleurotus djamor', tag: 'PINK OYSTER', group: 'culinary', grams: 200, pin: '#E28AA2',
    fact: 'A warmth-loving oyster and one of the fastest growers. The pink fades to tan once cooked.',
    use: 'Pan-fry until crisp for a savory, almost bacon-like bite.' },
  golden: { name: 'Golden Oyster', latin: 'Pleurotus citrinopileatus', tag: 'GOLDEN OYSTER', group: 'culinary', grams: 180, pin: '#E3B634',
    fact: 'Grows in bouquets of lemon-yellow funnels with thin, delicate caps.',
    use: 'Nutty and a little floral. Cook quickly in butter and add at the end.' },
  lions: { name: "Lion's Mane", latin: 'Hericium erinaceus', tag: "LION'S MANE", group: 'culinary', functional: true, grams: 280, pin: '#EFE3C9',
    fact: 'No caps and no gills, just a soft pom-pom of dangling spines.',
    use: 'Slice into thick steaks and sear in butter. Many say it tastes like crab.' },
  pioppino: { name: 'Pioppino', latin: 'Cyclocybe aegerita', tag: 'PIOPPINO', group: 'culinary', grams: 170, pin: '#7A4E33',
    fact: 'Named for the Italian word for poplar. Tight bunches of long stems with chestnut caps.',
    use: 'Stays firm and crunchy when cooked. Lovely in risotto and stir-fries.' },
  king: { name: 'King Trumpet', latin: 'Pleurotus eryngii', tag: 'KING TRUMPET', group: 'culinary', grams: 240, pin: '#B8916A',
    fact: 'The biggest oyster relative. The thick, meaty stem is the best part.',
    use: 'Cut the stem into coins, score them, and sear like scallops.' },
  pearl: { name: 'Black Pearl King', latin: 'Pleurotus hybrid', tag: 'BLACK PEARL', group: 'culinary', grams: 230, pin: '#4A4D55',
    fact: 'A cross between king trumpet and oyster, with dark pearl-grey caps on sturdy stems.',
    use: 'Roast or grill whole. The stems stay juicy and the caps turn golden.' },
  maitake: { name: 'Maitake', latin: 'Grifola frondosa', tag: 'MAITAKE', group: 'culinary', grams: 300, pin: '#8A715E',
    fact: 'Hen of the woods, for its ruffled fronds. Maitake means "dancing mushroom" in Japanese.',
    use: 'Pull into clusters and roast hot until the edges crackle.' },
  nameko: { name: 'Nameko', latin: 'Pholiota nameko', tag: 'NAMEKO', group: 'culinary', grams: 130, pin: '#C8682C',
    fact: 'Little amber caps with a naturally glossy coat.',
    use: 'A favorite in miso soup. The coat gives broth a silky body.' },
  reishi: { name: 'Reishi', latin: 'Ganoderma lucidum', tag: 'REISHI', group: 'functional', grams: 90, pin: '#8B2F1E', powder: '#7A3B2A',
    fact: 'Called lingzhi in Chinese. A glossy, lacquered shelf with a cream edge while it is still growing.',
    use: 'Woody and bitter, so it is dried and simmered into tea rather than eaten.' },
  cordyceps: { name: 'Cordyceps', latin: 'Cordyceps militaris', tag: 'CORDYCEPS', group: 'functional', grams: 60, pin: '#E58A2E', powder: '#D9822B', jar: true,
    fact: 'Bright orange clubs. On farms it is grown in glass jars of brown rice.',
    use: 'Dried and steeped into a light, savory tea, or ground into blends.' },
  turkeytail: { name: 'Turkey Tail', latin: 'Trametes versicolor', tag: 'TURKEY TAIL', group: 'functional', grams: 80, pin: '#7C6A58', powder: '#8D8270',
    fact: "Thin, leathery fans striped like a turkey's tail feathers.",
    use: 'Too tough to chew, so it is simmered for a long time into tea.' },
};
MP.culinary = ['blue', 'pink', 'golden', 'lions', 'pioppino', 'king', 'pearl', 'maitake', 'nameko'];
MP.functional = ['lions', 'reishi', 'cordyceps', 'turkeytail'];

MP.stages = [
  { label: 'Inoculated', at: 0 },
  { label: 'Colonizing', at: 40 },
  { label: 'Pinning', at: 260 },
  { label: 'Young', at: 420 },
  { label: 'Fruiting', at: 640 },
  { label: 'Ready to harvest', at: 1000 },
];

MP.names = ['Puff', 'Button', 'Moss', 'Dew', 'Bun', 'Pebble', 'Toffee', 'Biscuit', 'Nugget', 'Fern', 'Sprout', 'Mochi', 'Pip', 'Clover', 'Hazel', 'Juniper', 'Dumpling', 'Marble', 'Bramble', 'Sesame', 'Bean', 'Taffy', 'Willow', 'Acorn', 'Olive', 'Maple'];

/* ---------- Kitchen ---------- */
MP.methods = {
  raw: { name: 'Fresh', line: 'as harvested', verb: 'Clean the mushrooms with a dry brush and keep them fresh' },
  seared: { name: 'Seared', line: 'hot pan, butter', verb: 'Sear the mushrooms in a hot pan with butter until deep golden' },
  roasted: { name: 'Roasted', line: '220 °C oven', verb: 'Toss the mushrooms with oil and salt and roast at 220 °C until crisp at the edges' },
  braised: { name: 'Glazed', line: 'soy and miso', verb: 'Brown the mushrooms, then glaze with soy, miso and a splash of water until sticky' },
};

MP.plates = {
  stone: { name: 'Stoneware', line: 'charcoal glaze' },
  porcelain: { name: 'Porcelain', line: 'wide rim' },
  celadon: { name: 'Celadon bowl', line: 'pale green' },
  deepbowl: { name: 'Deep bowl', line: 'for soups and noodles' },
  board: { name: 'Walnut board', line: 'oiled wood' },
};
MP.surfaces = {
  stone: { name: 'Grey stone' },
  linen: { name: 'Linen' },
  marble: { name: 'Marble' },
  walnut: { name: 'Walnut' },
};

/* ---------- Cafe ---------- */
MP.cups = {
  mug: { name: 'Glass mug', line: 'for hot drinks' },
  glass: { name: 'Tall glass', line: 'shows the layers' },
  rocks: { name: 'Short glass', line: 'for small pours' },
};
MP.bases = {
  espresso: { name: 'Espresso', color: '#3E2618', top: '#A86F3D', latte: 0.6, layer: true, step: 'Pull a double shot of espresso' },
  coldbrew: { name: 'Cold brew', color: '#2E1C12', top: '#4A2E1C', latte: 0.55, layer: true, step: 'Pour 150 ml of cold brew' },
  matcha: { name: 'Matcha', color: '#6E9A3E', top: '#86AE52', latte: 0.5, layer: true, step: 'Whisk 2 g of matcha with 60 ml of 80 °C water until frothy' },
  hojicha: { name: 'Hojicha', color: '#8A4F2C', top: '#A86A40', latte: 0.5, layer: true, step: 'Steep 4 g of hojicha in 120 ml of hot water for 3 minutes' },
  blacktea: { name: 'Black tea', color: '#8C3A17', top: '#A9532A', latte: 0.45, layer: true, step: 'Brew strong black tea, 2 bags in 150 ml, for 5 minutes' },
  chai: { name: 'Chai', color: '#9C6232', top: '#B97C46', latte: 0.5, layer: false, step: 'Simmer black tea with cinnamon, cardamom, ginger and clove' },
  cacao: { name: 'Cacao', color: '#4B2A1D', top: '#6A3C28', latte: 0.5, layer: false, step: 'Whisk 2 tbsp of cacao with a splash of hot water into a paste' },
  berry: { name: 'Berry smoothie', color: '#8E2F52', top: '#A84468', latte: 0.25, layer: false, smoothie: true, step: 'Blend a cup of frozen berries with half a banana' },
  banana: { name: 'Banana oat smoothie', color: '#E2CB8F', top: '#EAD7A4', latte: 0.25, layer: false, smoothie: true, step: 'Blend a frozen banana, 2 tbsp of oats and a pinch of cinnamon' },
};
MP.milks = {
  none: { name: 'No milk', color: null },
  oat: { name: 'Oat milk', short: 'Oat', color: '#EEE4D2' },
  whole: { name: 'Whole milk', short: 'Whole milk', color: '#FAF7F1' },
  almond: { name: 'Almond milk', short: 'Almond', color: '#EFE2CF' },
  coconut: { name: 'Coconut milk', short: 'Coconut', color: '#FBFAF6' },
};
MP.sweets = {
  none: { name: 'Unsweetened' },
  honey: { name: 'Honey', line: 'local wildflower' },
  maple: { name: 'Maple syrup', line: 'dark' },
  brown: { name: 'Brown sugar syrup', line: 'streaks the glass' },
  vanilla: { name: 'Vanilla', line: 'bean syrup' },
};
MP.finishes = {
  art: { name: 'Latte art', line: 'hot milk drinks' },
  foam: { name: 'Cold foam', line: 'thick and silky' },
  cinnamon: { name: 'Cinnamon', line: 'dusted' },
  cocoa: { name: 'Cocoa', line: 'dusted' },
  matchadust: { name: 'Matcha dust', line: 'dusted' },
  pearls: { name: 'Tapioca pearls', line: 'chewy, at the bottom' },
  flowers: { name: 'Edible flowers', line: 'violas' },
};

/* Dish categories players can tag, also used by the recipe search. */
MP.courses = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', soup: 'Soup', salad: 'Salad',
  noodles: 'Pasta & noodles', rice: 'Rice & bowls', toast: 'Toast & tacos', snack: 'Snack', dessert: 'Dessert',
};

/* Premium recipes: hand-picked by the farm and shown first in each book.
   cover: your own photo, for example 'covers/seared-lions-mane.jpg' in this folder.
   Leave cover empty and the game draws a cinematic cover from the recipe. */
MP.premium = [
  { id: 'farm-1', cover: '' },
  { id: 'farm-7', cover: '' },
  { id: 'farm-4', cover: '' },
  { id: 'farm-5', cover: '' },
];

/* Recipes from the farm, always shown in the gallery. */
MP.farmRecipes = [
  { id: 'farm-1', kind: 'dish', title: "Seared Lion's Mane on Sourdough", author: 'Moshruums farm', farm: true, created: 3, tags: ['breakfast', 'toast'],
    notes: "Press thick lion's mane slices in a hot pan with butter until both sides are deep golden. Pile onto toasted sourdough over a little garlic cream sauce, then finish with thyme, lemon and flaky salt.",
    comp: { plate: 'stone', surface: 'stone', method: 'seared', items: [
      { t: 'cream', x: 205, y: 210, r: -8, s: 1.05 }, { t: 'toast', x: 196, y: 204, r: -12, s: 1 },
      { t: 'lions', x: 178, y: 186, r: -18, s: 1 }, { t: 'lions', x: 226, y: 214, r: 14, s: 0.9 },
      { t: 'thyme', x: 262, y: 152, r: 30, s: 1 }, { t: 'lemon', x: 112, y: 268, r: -20, s: 1 },
      { t: 'salt', x: 200, y: 196, r: 0, s: 1 } ] } },
  { id: 'farm-2', kind: 'dish', title: 'Roasted Blue Oyster Rice Bowl', author: 'Moshruums farm', farm: true, created: 2, tags: ['lunch', 'rice'],
    notes: 'Tear blue oysters into big pieces and roast at 220 °C until the edges crisp. Serve over warm rice with a jammy egg, scallion, toasted sesame and a few drops of chili oil.',
    comp: { plate: 'celadon', surface: 'linen', method: 'roasted', items: [
      { t: 'rice', x: 200, y: 205, r: 0, s: 1.4 }, { t: 'blue', x: 160, y: 170, r: -30, s: 1 },
      { t: 'blue', x: 232, y: 176, r: 24, s: 0.95 }, { t: 'blue', x: 170, y: 240, r: -150, s: 0.9 },
      { t: 'egg', x: 238, y: 238, r: 10, s: 1.1 }, { t: 'scallion', x: 205, y: 200, r: 0, s: 1 },
      { t: 'sesame', x: 196, y: 222, r: 0, s: 1.2 }, { t: 'chilioil', x: 150, y: 206, r: 0, s: 1 } ] } },
  { id: 'farm-3', kind: 'dish', title: 'Miso-Glazed King Trumpet', author: 'Moshruums farm', farm: true, created: 1, tags: ['dinner'],
    notes: 'Halve king trumpets lengthwise and score the cut side. Brown them cut-side down, then glaze with white miso, honey and butter. Serve on a swoosh of extra glaze with scallion and microgreens.',
    comp: { plate: 'porcelain', surface: 'marble', method: 'braised', items: [
      { t: 'miso', x: 200, y: 214, r: -18, s: 1.1 }, { t: 'king', x: 168, y: 200, r: 70, s: 0.9 },
      { t: 'king', x: 226, y: 214, r: 62, s: 0.9 }, { t: 'scallion', x: 196, y: 178, r: 0, s: 0.9 },
      { t: 'micro', x: 250, y: 168, r: 10, s: 1 }, { t: 'sesame', x: 204, y: 236, r: 0, s: 1 } ] } },
  { id: 'farm-4', kind: 'drink', title: 'Morning Booster Oat Latte', author: 'Moshruums farm', farm: true, created: 3,
    notes: 'Pull a double shot, stir in a serving of Morning Booster with a teaspoon of honey, then top with steamed oat milk and pour a heart.',
    comp: { cup: 'mug', temp: 'hot', base: 'espresso', milk: 'oat', mush: ['morning'], sweet: 'honey', finish: ['art'], surface: 'walnut' } },
  { id: 'farm-5', kind: 'drink', title: "Iced Lion's Mane Matcha", author: 'Moshruums farm', farm: true, created: 2,
    notes: "Whisk matcha with a serving of Lion's Mane powder and a little maple. Fill a tall glass with ice and whole milk, then pour the matcha over the top so it layers.",
    comp: { cup: 'glass', temp: 'iced', base: 'matcha', milk: 'whole', mush: ['lionsmane'], sweet: 'maple', finish: [], surface: 'marble' } },
  { id: 'farm-6', kind: 'drink', title: 'Evening Glow Hojicha Milk Tea', author: 'Moshruums farm', farm: true, created: 1,
    notes: 'Steep hojicha strong and stir in Evening Glow. Swirl brown sugar syrup around a glass, add tapioca pearls and ice, then pour in the tea and oat milk.',
    comp: { cup: 'glass', temp: 'iced', base: 'hojicha', milk: 'oat', mush: ['evening'], sweet: 'brown', finish: ['pearls'], surface: 'linen' } },
  { id: 'farm-7', kind: 'dish', title: 'Maitake Mushroom Ramen', author: 'Moshruums farm', farm: true, created: 4, tags: ['dinner', 'soup', 'noodles'],
    notes: 'Roast maitake clusters until crisp. Simmer mushroom broth with ginger and a spoon of miso, add udon, and top with the maitake, a jammy egg, scallion, nori and a few drops of chili oil.',
    comp: { plate: 'deepbowl', surface: 'walnut', method: 'roasted', items: [
      { t: 'broth', x: 200, y: 200, r: 0, s: 1.9 }, { t: 'udon', x: 196, y: 210, r: 0, s: 1.6 },
      { t: 'maitake', x: 162, y: 168, r: -20, s: 1.2 }, { t: 'maitake', x: 236, y: 186, r: 30, s: 1 },
      { t: 'egg', x: 232, y: 244, r: 20, s: 1.1 }, { t: 'nori', x: 140, y: 236, r: 10, s: 1.2 },
      { t: 'scallion', x: 196, y: 196, r: 0, s: 1 }, { t: 'chilioil', x: 176, y: 252, r: 0, s: 1 } ] } },
  { id: 'farm-8', kind: 'dish', title: 'Golden Oyster Tacos', author: 'Moshruums farm', farm: true, created: 5, tags: ['lunch', 'toast'],
    notes: 'Sear golden oysters hard in a dry pan, then finish with oil and smoked paprika. Pile onto warm tortillas with red cabbage, avocado, pickled red onion, cilantro and lime.',
    comp: { plate: 'board', surface: 'linen', method: 'seared', items: [
      { t: 'tortilla', x: 140, y: 196, r: 0, s: 1.05 }, { t: 'tortilla', x: 262, y: 200, r: 0, s: 1.05 },
      { t: 'cabbage', x: 140, y: 200, r: 0, s: 1 }, { t: 'golden', x: 136, y: 186, r: -30, s: 1 },
      { t: 'cabbage', x: 262, y: 204, r: 40, s: 1 }, { t: 'golden', x: 266, y: 190, r: 20, s: 1 },
      { t: 'avocado', x: 200, y: 280, r: 30, s: 0.7 }, { t: 'redonion', x: 160, y: 222, r: 0, s: 0.7 },
      { t: 'cilantro', x: 250, y: 220, r: 0, s: 1 }, { t: 'lime', x: 320, y: 120, r: 30, s: 1 } ] } },
  { id: 'farm-9', kind: 'dish', title: 'Scallops with Pioppino and Brown Butter', author: 'Moshruums farm', farm: true, created: 6, tags: ['dinner'],
    notes: 'Sear scallops for 90 seconds a side. In the same pan, brown butter with pioppino and thyme. Spoon over the scallops on a bed of polenta and finish with lemon.',
    comp: { plate: 'porcelain', surface: 'marble', method: 'seared', items: [
      { t: 'polenta', x: 200, y: 200, r: 0, s: 1.2 }, { t: 'scallop', x: 200, y: 200, r: 0, s: 1.6 },
      { t: 'pioppino', x: 150, y: 170, r: -40, s: 1 }, { t: 'pioppino', x: 246, y: 226, r: 140, s: 1 },
      { t: 'thyme', x: 248, y: 160, r: 30, s: 0.9 }, { t: 'lemon', x: 140, y: 250, r: -20, s: 0.9 } ] } },
  { id: 'farm-10', kind: 'drink', title: "Hot Lion's Mane Hojicha Latte", author: 'Moshruums farm', farm: true, created: 4,
    notes: "Steep hojicha strong, stir in a serving of Lion's Mane and a little maple, then top with steamed oat milk and pour a heart.",
    comp: { cup: 'mug', temp: 'hot', base: 'hojicha', milk: 'oat', mush: ['lionsmane'], sweet: 'maple', finish: ['art'], surface: 'linen' } },
  { id: 'farm-11', kind: 'drink', title: 'Evening Glow Berry Smoothie', author: 'Moshruums farm', farm: true, created: 5,
    notes: 'Blend frozen berries, half a banana, almond milk and a serving of Evening Glow until smooth. Finish with edible flowers.',
    comp: { cup: 'glass', temp: 'iced', base: 'berry', milk: 'almond', mush: ['evening'], sweet: 'none', finish: ['flowers'], surface: 'marble' } },
];

})(window.MP = window.MP || {});
