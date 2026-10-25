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

/* Moshruums products offered in the cafe. Fill in the real product links. */
MP.products = [
  { id: 'morning', name: 'Morning Booster', line: 'Moshruums blend', color: '#C08A45',
    note: 'Our morning blend. Stir a serving into coffee, matcha or a smoothie.', url: 'https://moshruums.com' },
  { id: 'lionsmane', name: "Lion's Mane", line: 'Moshruums powder', color: '#E4D5B5',
    note: "Lion's mane grown and dried on our farm. Mild and a little sweet.", url: 'https://moshruums.com' },
  { id: 'evening', name: 'Evening Glow', line: 'Moshruums blend', color: '#8A4A3E',
    note: 'Our evening blend, made for a slow, cozy cup.', url: 'https://moshruums.com' },
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
  { label: 'Just planted', at: 0 },
  { label: 'Colonizing', at: 40 },
  { label: 'Pinning', at: 260 },
  { label: 'Young', at: 420 },
  { label: 'Fruiting', at: 640 },
  { label: 'Ready to harvest', at: 1000 },
];

MP.names = ['Puff', 'Button', 'Moss', 'Dew', 'Bun', 'Pebble', 'Toffee', 'Biscuit', 'Nugget', 'Fern', 'Sprout', 'Mochi', 'Pip', 'Clover', 'Hazel', 'Juniper', 'Dumpling', 'Marble', 'Bramble', 'Sesame', 'Bean', 'Taffy', 'Willow', 'Acorn', 'Olive', 'Maple'];

/* ---------- Kitchen ---------- */
MP.ingredients = {
  // base
  toast: { name: 'Sourdough', cat: 'base', r: 62, line: 'thick-cut, toasted' },
  rice: { name: 'Rice', cat: 'base', r: 58, line: 'short-grain' },
  noodles: { name: 'Noodles', cat: 'base', r: 58, line: 'fresh egg noodles' },
  egg: { name: 'Soft egg', cat: 'base', r: 30, line: 'jammy, halved' },
  tofu: { name: 'Tofu', cat: 'base', r: 34, line: 'seared cubes' },
  bokchoy: { name: 'Bok choy', cat: 'base', r: 50, line: 'halved' },
  tomato: { name: 'Cherry tomato', cat: 'base', r: 26, line: 'halved' },
  garlic: { name: 'Garlic', cat: 'base', r: 22, line: 'cloves' },
  shallot: { name: 'Shallot', cat: 'base', r: 26, line: 'sliced rings' },
  butter: { name: 'Butter', cat: 'base', r: 20, line: 'cultured' },
  lemon: { name: 'Lemon', cat: 'base', r: 26, line: 'wedge' },
  // garnish
  thyme: { name: 'Thyme', cat: 'garnish', r: 34, line: 'fresh sprig' },
  scallion: { name: 'Scallion', cat: 'garnish', r: 30, line: 'thinly sliced' },
  chili: { name: 'Chili', cat: 'garnish', r: 26, line: 'sliced' },
  micro: { name: 'Microgreens', cat: 'garnish', r: 26, line: 'a small handful' },
  parmesan: { name: 'Parmesan', cat: 'garnish', r: 30, line: 'shaved' },
  sesame: { name: 'Sesame', cat: 'garnish', r: 30, line: 'toasted' },
  salt: { name: 'Flaky salt', cat: 'garnish', r: 26, line: 'a pinch' },
  miso: { name: 'Miso glaze', cat: 'garnish', r: 70, line: 'white miso, honey, butter' },
  cream: { name: 'Cream sauce', cat: 'garnish', r: 66, line: 'garlic and thyme' },
  chilioil: { name: 'Chili oil', cat: 'garnish', r: 30, line: 'a few drops' },
};

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
  ceramic: { name: 'Ceramic cup', line: 'with saucer' },
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

/* Recipes from the farm, always shown in the gallery. */
MP.farmRecipes = [
  { id: 'farm-1', kind: 'dish', title: "Seared Lion's Mane on Sourdough", author: 'Moshruums farm', farm: true, created: 3,
    notes: "Press thick lion's mane slices in a hot pan with butter until both sides are deep golden. Pile onto toasted sourdough over a little garlic cream sauce, then finish with thyme, lemon and flaky salt.",
    comp: { plate: 'stone', surface: 'stone', method: 'seared', items: [
      { t: 'cream', x: 205, y: 210, r: -8, s: 1.05 }, { t: 'toast', x: 196, y: 204, r: -12, s: 1 },
      { t: 'lions', x: 178, y: 186, r: -18, s: 1 }, { t: 'lions', x: 226, y: 214, r: 14, s: 0.9 },
      { t: 'thyme', x: 262, y: 152, r: 30, s: 1 }, { t: 'lemon', x: 112, y: 268, r: -20, s: 1 },
      { t: 'salt', x: 200, y: 196, r: 0, s: 1 } ] } },
  { id: 'farm-2', kind: 'dish', title: 'Roasted Blue Oyster Rice Bowl', author: 'Moshruums farm', farm: true, created: 2,
    notes: 'Tear blue oysters into big pieces and roast at 220 °C until the edges crisp. Serve over warm rice with a jammy egg, scallion, toasted sesame and a few drops of chili oil.',
    comp: { plate: 'celadon', surface: 'linen', method: 'roasted', items: [
      { t: 'rice', x: 200, y: 205, r: 0, s: 1.4 }, { t: 'blue', x: 160, y: 170, r: -30, s: 1 },
      { t: 'blue', x: 232, y: 176, r: 24, s: 0.95 }, { t: 'blue', x: 170, y: 240, r: -150, s: 0.9 },
      { t: 'egg', x: 238, y: 238, r: 10, s: 1.1 }, { t: 'scallion', x: 205, y: 200, r: 0, s: 1 },
      { t: 'sesame', x: 196, y: 222, r: 0, s: 1.2 }, { t: 'chilioil', x: 150, y: 206, r: 0, s: 1 } ] } },
  { id: 'farm-3', kind: 'dish', title: 'Miso-Glazed King Trumpet', author: 'Moshruums farm', farm: true, created: 1,
    notes: 'Halve king trumpets lengthwise and score the cut side. Brown them cut-side down, then glaze with white miso, honey and butter. Serve on a swoosh of extra glaze with scallion and microgreens.',
    comp: { plate: 'porcelain', surface: 'marble', method: 'braised', items: [
      { t: 'miso', x: 200, y: 214, r: -18, s: 1.1 }, { t: 'king', x: 168, y: 200, r: 70, s: 0.9 },
      { t: 'king', x: 226, y: 214, r: 62, s: 0.9 }, { t: 'scallion', x: 196, y: 178, r: 0, s: 0.9 },
      { t: 'micro', x: 250, y: 168, r: 10, s: 1 }, { t: 'sesame', x: 204, y: 236, r: 0, s: 1 } ] } },
  { id: 'farm-4', kind: 'drink', title: 'Morning Booster Oat Latte', author: 'Moshruums farm', farm: true, created: 3,
    notes: 'Pull a double shot, stir in a serving of Morning Booster with a teaspoon of honey, then top with steamed oat milk and pour a heart.',
    comp: { cup: 'ceramic', temp: 'hot', base: 'espresso', milk: 'oat', mush: ['morning'], sweet: 'honey', finish: ['art'], surface: 'walnut' } },
  { id: 'farm-5', kind: 'drink', title: "Iced Lion's Mane Matcha", author: 'Moshruums farm', farm: true, created: 2,
    notes: "Whisk matcha with a serving of Lion's Mane powder and a little maple. Fill a tall glass with ice and whole milk, then pour the matcha over the top so it layers.",
    comp: { cup: 'glass', temp: 'iced', base: 'matcha', milk: 'whole', mush: ['lionsmane'], sweet: 'maple', finish: [], surface: 'marble' } },
  { id: 'farm-6', kind: 'drink', title: 'Evening Glow Hojicha Milk Tea', author: 'Moshruums farm', farm: true, created: 1,
    notes: 'Steep hojicha strong and stir in Evening Glow. Swirl brown sugar syrup around a glass, add tapioca pearls and ice, then pour in the tea and oat milk.',
    comp: { cup: 'glass', temp: 'iced', base: 'hojicha', milk: 'oat', mush: ['evening'], sweet: 'brown', finish: ['pearls'], surface: 'linen' } },
];

})(window.MP = window.MP || {});
