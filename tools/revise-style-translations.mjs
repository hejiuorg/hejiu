import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apply = process.argv.includes('--apply');

const bodies = {
  aperitif: `An aperitif is a drink category defined by when it is served, not by one raw material. Vermouth, bitters, anise spirits, dry fortified wines and even low-alcohol cocktails can all belong to the occasion. The common thread is usually bitterness, dryness or freshness; the aim is to open the palate before a meal, not to deliver a large dose of alcohol.

## Common types

- **Vermouth**: wine aromatised with bitter plants and spices; dry, sweet and semi-sweet styles exist.
- **Bitters and amaro**: herbal, root and citrus infusions with a bitter-sweet balance. Italian amaro is often drunk after a meal, but it can also serve as an aperitif.
- **Anise spirits**: French pastis and Greek ouzo, which usually cloud when water is added and have a strong flavour.
- **Aperitif cocktails**: Spritz, Americano and Negroni, whose strength and sweetness vary too much to treat as one drink.

## How to serve

Serve chilled, often over ice, with soda or a piece of citrus peel. Bitterness is central, but perception varies. A first attempt can start with a low-bitterness, lower-alcohol vermouth or a Spritz. Keep the pre-meal serve small; a high-sugar, high-alcohol drink is not a substitute for a true aperitif.

## Boundary

This page describes the occasion and the categories, not specific brands. Check the label and producer information for the base drink, bitter source, sugar and strength.`,

  'baijiu-medicinal': `“Health liquor” usually means a compounded liquor made with a distilled spirit or yellow wine as the base, plus food-medicine ingredients, edible medicinal herbs or extracts. It belongs to the food or health-food category, not to medicine. In China, a health-function claim must meet health-food registration or filing rules, and ordinary compounded liquor may not claim to treat disease.

## Differences from medicinal and lu liquor

- **Health liquor**: emphasises a legally registered or filed health function; the label and instructions are strictly regulated.
- **Medicinal liquor**: traditionally made by steeping medicinal herbs in alcohol; some products fall under drug regulation and must not be confused with ordinary food.
- **Lu liquor**: a broad category made by blending a distilled spirit, fermented wine or edible alcohol with edible ingredients; not every lu liquor is a health liquor.

## Buying and drinking

Check for the blue-hat health-food mark, approval or filing number, and the stated suitable group, unsuitable group and daily amount. Do not buy on the basis of verbal claims such as “tonic” or “treats rheumatism”, and do not use it as a substitute for medical treatment. It still contains alcohol; pregnant people, minors, people with liver disease and people taking medication should avoid it.

## Boundary

This page describes the category and its regulatory boundary, not any product. Check the label and the regulator's public information for approval status, ingredients and strength.`,

  beer: `Beer is made from cereal, usually barley malt but also wheat, corn or rice, through mashing, boiling and fermentation. Most modern beer is hopped during the boil for bitterness, aroma and stability. Alcohol is usually modest, but the range of styles is enormous.

## Understanding styles through fermentation

The most useful broad split is **ale** and **lager**. Ales ferment warm with brewer's yeast and often show fruity esters; lagers ferment cool and usually taste cleaner. The BJCP guidelines also separate wheat beer, stout, porter, sour beer and IPA families, but these are style labels, not quality grades.

## Ingredients and process

Water, malt, hops and yeast are the basic ingredients. Specialty malts determine colour and roasted flavour, hops determine bitterness and aroma, and yeast determines fermentation by-products. A “pure” brewing law describes one legal tradition; it does not mean every good beer must use only four ingredients.

## How to drink

Lager, wheat beer and most pale ales are best well chilled. Stouts, barley wines and barrel-aged beers can be served warmer so the aroma is more complete. Glass shape affects foam and aroma concentration, but the rules need not be mysterious. Look at the foam and clarity, smell malt, hops and fermentation, then judge bitterness, sweetness and finish.

## Boundary

This page describes the shared structure and common categories of beer, not specific brands, and does not call any style “best”. Check the label and producer information for ingredients, strength and flavour.`,

  brandy: `Brandy is a spirit distilled from wine or another fruit wine. Grape brandy is the most common; apple, cherry, plum and other fruit brandies are separate traditions. It belongs alongside whisky, which is grain-based, and rum, which is sugarcane-based, as a distilled spirit category.

## Main types

- **Cognac**: grape brandy from its French appellation, mainly from Ugni Blanc and other grapes, double-distilled and oak-aged. VS, VSOP and XO indicate different minimum ageing tiers.
- **Armagnac**: grape brandy from Gascony, often column-distilled, usually more robust and aromatic; vintage-dated products also exist.
- **Calvados**: apple brandy from Normandy, distilled from cider and protected by appellation rules.
- **Pomace brandy**: distilled from grape skins and seeds; Italian grappa and French marc belong to this tradition.
- **Fruit brandy**: distilled from fermented cherries, plums, pears and other fruit; German-speaking Kirschwasser and Williams pear brandy are common examples.

## Ageing and blending

Oak adds vanilla, caramel, spice and wood. Cognac and Armagnac have different vintage rules: Cognac is usually a blend and the grade indicates minimum age, while Armagnac can be sold as a single vintage. Longer ageing does not automatically mean better quality; base-spirit structure and the blending aim matter too.

## How to drink

Serve neat in a tulip or balloon glass at room temperature, or slightly warmed. Ice lowers aroma release but can suit a high-strength or younger spirit. Brandy also works in classics such as the Sidecar and Brandy Alexander.

## Boundary

This page describes the categories and legal framework, not specific houses. Check the label and producer information for grape variety, distillation, cask and ageing.`,

  'fruit-wine': `Fruit wine is an alcoholic drink made by fermenting fruit juice or fruit extract with yeast. It is usually lower in alcohol than a distilled spirit, and its flavour depends on the fruit variety, ripeness, fermentation and residual sugar. Cider, perry, cherry wine and blueberry wine belong here; Chinese industry standards also set requirements for fruit-wine ingredients and basic process.

## Differences from neighbouring categories

- **Fruit wine vs wine**: wine is specifically fermented from grapes; other fermented fruit drinks usually fall under fruit wine.
- **Fruit wine vs fruit liqueur**: liqueur is a spirit base with juice or flavouring and added sugar, usually stronger; fruit wine is fermented.
- **Fruit wine vs fruit brandy**: fruit brandy is distilled; fruit wine is not.

## Styles and sweetness

Fruit wine can be dry, off-dry or sweet. Cider ranges from dry and sharp to soft and sweet; berry wines often keep high acidity; cherry wine can show almond-like stone-fruit notes. Fermentation temperature, yeast choice and malolactic fermentation all change the final style.

## How to drink

Most fruit wines are served chilled; sweet styles can be served over ice or used in Spritz-style drinks. Dry cider suits pork, cheese and fried food; sweet fruit wine suits dessert or sipping. Refrigerate after opening and finish soon, especially low-alcohol, low-sulphite products.

## Boundary

This page describes the category and process, not specific brands. Check the label and producer information for fruit proportion, residual sugar, strength and additives.`,

  gin: `Gin is a distilled spirit whose core flavour comes from juniper. EU rules require a clear juniper character and a minimum bottling strength of 37.5% ABV. Beyond juniper, producers often add coriander seed, angelica, citrus peel and iris root to create their own recipes.

## Three common labels

- **Distilled gin**: a grain-spirit base is redistilled with juniper and other botanicals; a small amount of flavouring may be added after distillation.
- **London dry gin**: botanicals are added during distillation, and the finished product may not rely on added essences or sugar for its main flavour; it does not have to be made in England.
- **Compound gin**: botanicals are steeped or mixed into alcohol without redistillation; the category is legal, but the style is usually more direct.

## Flavour and mixing

Gin styles range from dry, piney and citrus-led to floral, spicy and modern “new western” profiles. It is the base of classics such as the martini and Negroni, and it also pairs with tonic. Tonic's sweetness and bitterness can amplify or mask botanical detail; ice volume and lime also change the final flavour.

## How to drink

Neat, a little water or ice can help; smell juniper and citrus first, then judge the alcohol and finish. In mixing, price is not the only guide: a strong, clearly flavoured gin suits a martini, while a softer or more aromatic gin suits tonic. Producers rarely disclose the full botanical recipe, and “London Dry” on the label does not mean the gin was made in London.

## Boundary

This page describes categories and process, not specific brands. Check producer information for ingredients, distillation and bottling strength.`,

  liqueur: `Liqueur is a sweetened spirit flavoured with fruit, herbs, nuts, cream or other ingredients. EU rules set minimum sugar and alcohol levels; national standards can be more detailed. It differs from bitters, which are usually low in sugar and used in small dashes as a seasoning.

## Common families

- **Fruit liqueurs**: citrus, cherry, peach and blackcurrant, common in sweet cocktails.
- **Herbal and bitter liqueurs**: Chartreuse, Campari and Aperol, ranging from bitter-sweet to complex herbal.
- **Nut liqueurs**: almond, hazelnut and walnut, often used in desserts and after-dinner drinks.
- **Cream liqueurs**: made with dairy, thick in texture and requiring careful storage.
- **Coffee liqueurs**: coffee-bean infusions or blends, common in the White Russian and espresso martini.

## How to drink

Liqueurs can be served neat, over ice, with milk or soda, and are often the sweet and aromatic element of a cocktail. Because they already contain sugar, reduce or omit other syrups in the recipe. Refrigerate cream liqueurs after opening and watch the shelf life.

## Boundary

This page describes categories and common flavours, not specific brands. Check the label and producer information for base spirit, sugar, strength and additives.`,

  rum: `Rum is a spirit made by fermenting and distilling sugarcane juice, molasses or sugarcane syrup. It is produced mainly in the Caribbean but also in Latin America, the Indian Ocean and Asia. Differences in raw material, still and ageing produce a range from light and clean to dark and rich.

## Common categories

- **White rum**: usually filtered, pale and light, suited to Mojitos and Daiquiris.
- **Gold rum**: may be briefly oak-aged or coloured with caramel, rounder than white rum.
- **Dark rum**: aged longer or given molasses/caramel, with vanilla, caramel and wood notes, suited to sipping or dark cocktails.
- **Rhum agricole**: fermented and distilled directly from sugarcane juice, common in Martinique and elsewhere, with a more herbal, vivid style.
- **Cachaça**: distilled from Brazilian sugarcane juice and a national spirit of Brazil; it is technically similar to rum but a separate legal and category, not simply a synonym.

## Ageing and sweetness

Rum can age in tropical or temperate climates, and tropical ageing is usually faster. Some producers add sugar or caramel, and global rules do not limit this uniformly; “age” and “sweetness” therefore do not always correspond. Check the label for raw material, origin, ageing and additives.

## How to drink

White rum suits mixing; gold rum and agricole can be served over ice; dark rum suits sipping or tropical cocktails. The Mojito and Daiquiri look simple, but the balance of lime, sugar and ice changes the drink markedly.

## Boundary

This page describes categories and process, not specific brands. Check the label and producer information for raw material, age and added sugar.`,

  sake: `Sake is a traditional Japanese alcoholic drink made from rice, water, koji mould and yeast. Like wine, it is fermented rather than distilled; alcohol is usually around 15% ABV, with some genshu or namazake higher.

## Polishing ratio and categories

Sake style is shaped first by the polishing ratio: the lower the percentage of rice remaining after milling, the fewer the off-flavour sources and the finer the aroma. Common categories include:

- **Junmai**: only rice, water, koji and yeast; no added brewer's alcohol.
- **Honjozo**: a small amount of brewer's alcohol is added to lift aroma and texture; the polishing ratio has a legal upper limit.
- **Ginjo / daiginjo**: fermented longer at lower temperature, often with floral and fruit notes; daiginjo requires a stricter polishing ratio.
- **Junmai ginjo / junmai daiginjo**: meet both the junmai and ginjo conditions.

## Namazake, hi-ire and ageing

“Namazake” is unpasteurised sake and usually needs refrigeration; “hi-ire” is the pasteurisation step. Unpasteurised sake is livelier but changes faster. Ageing brings nutty, grainy and creamy notes, and not every sake is suited to long storage.

## How to drink

Sake can be chilled, at room temperature or warmed. Ginjo styles usually suit cooler temperatures to preserve aroma; junmai and fuller styles can be warmed, but not overheated. Traditional masu and ochoko cups have their uses, and glass shape affects aroma concentration, but the rules need not be absolute.

## Boundary

This page describes categories and process, not specific breweries. Check the label and brewery information for polishing ratio, strength, added alcohol and storage.`,

  soju: `Soju is a traditional Korean alcoholic drink. Traditional soju is made from rice or other grains by fermentation and distillation and is relatively strong; most modern mass-market soju is “diluted soju”, made from edible alcohol with water, sweetener and flavouring, usually 16%–25% ABV.

## Distilled and diluted types

- **Distilled soju**: retains the traditional process, found in regional producers such as Andong and Jeonju, with more flavour and usually a higher price.
- **Diluted soju**: industrially produced, clean and noticeably sweet, the mainstay of Korean restaurants and home drinking.
- **Regional soju**: different regions have their own ingredients and flavour traditions, such as rice- or wheat-based recipes.

Soju and Japanese shochu are not the same drink: their ingredients, distillation systems and flavour traditions differ. The shared Chinese character for “burn” does not make them interchangeable.

## How to drink

Soju is usually chilled and poured into small glasses, often with grilled meat, seafood and spicy food. The Korean “bomb shot” mixes soju with beer; it is a serving style, not a separate category. Because diluted soju is light, juice or soda is also common.

## Boundary

This page describes categories and process, not specific brands. Check the label and producer information for ingredients, strength and sweeteners.`,

  tequila: `Tequila is a distilled spirit made from blue Weber agave (Agave tequilana Weber var. azul) in designated regions of Mexico, mainly Jalisco and neighbouring areas. The agave hearts (piña) are cooked, crushed, fermented and distilled. Mezcal, made from other agave species, is a separate category.

## 100% agave and mixto

“100% agave” on the label means all sugars come from agave; without that claim, the product is usually “mixto”, which may add a proportion of other sugars. Both are legal, but flavour and ingredient transparency differ. Look for “100% de agave” when buying.

## Age grades

- **Blanco / plata**: unaged or briefly aged, the most direct style, with agave, citrus and pepper notes.
- **Reposado**: aged in oak for at least two months, rounder in texture.
- **Añejo**: aged at least one year, often with vanilla, caramel and wood notes.
- **Extra añejo**: aged at least three years, closer to an aged spirit in style.

## How to drink

Blanco suits sipping or a margarita; reposado and añejo can be sipped. The traditional salt-and-lime serve is more associated with mixto tequila and is not a required ritual for tasting every tequila. Sip slowly and notice the alcohol and agave flavours.

## Boundary

This page describes categories and the legal framework, not specific brands. Check the label and CRT certification information for agave source, ageing and additives.`,

  vodka: `Vodka is a neutral spirit made from grain, potatoes, molasses or other materials by fermentation and distillation, with filtration or treatment. EU rules require the expected sensory character and a minimum bottling strength of 37.5% ABV. It is not necessarily “tasteless”: raw material, distillation, filtration and trace residues all affect the palate.

## Raw materials and styles

- **Grain vodka**: wheat, rye, corn and barley are common; flavours range from clean to lightly grainy and sweet.
- **Potato vodka**: often described as rounder, with flavour depending on variety and process.
- **Molasses vodka**: made from sugarcane molasses, usually cheaper and more neutral.
- **Flavoured vodka**: base spirit with fruit, herbs or spices; a flavoured spirit, not a traditional neutral vodka.

## How to drink

Vodka is usually served ice-cold and neat, or in a Moscow Mule, Bloody Mary or vodka martini. Because the flavour is neutral, it acts more as structure than as a lead in a cocktail, but its strength still affects balance; dilution and the sugar-acid ratio need adjusting accordingly.

## Boundary

This page describes categories and process, not specific brands. Check the label and producer information for raw material, distillation, filtration and additives.`,

  whisky: `Whisky (spelled whiskey in Ireland and the United States) is a spirit made from grain by mashing, fermentation and distillation, then aged in oak. Grain, still, cask and local climate shape the flavour; regional rules determine which names such as “Scotch” and “bourbon” may legally be used.

## Main traditions

- **Scotch whisky**: must be distilled in Scotland and aged in oak for at least three years, with a bottling strength of at least 40% ABV. Single malt comes from one distillery; blended whisky combines malt and grain whiskies from several distilleries.
- **Irish whiskey**: protected by an Irish geographical indication, often triple-distilled or pot-still, usually softer in texture.
- **American whiskey**: bourbon uses corn as its main grain and new charred oak; rye whiskey uses rye as its main grain. Neither has to be made in a particular state, but both have strict labelling rules.
- **Japanese whisky**: influenced by Scottish methods and known for precise blending; recent industry rules set clearer requirements for ingredients, distillation and ageing location.

## Ageing and labels

Oak gives colour as well as vanilla, spice and wood. Longer ageing does not automatically mean better: base-spirit style, cask type, warehouse position and blending aim all matter. An age statement usually gives the minimum age of the liquid; no age statement does not mean the whisky is unaged.

## How to drink

Neat reveals the full aroma; a little room-temperature water softens the alcohol and opens the nose, but add it gradually. Ice cools and dilutes, which suits stronger or heavier whiskies. A highball is another legitimate serve; neat is not the only “correct” method.

## Boundary

This page describes styles and the legal framework, not specific distilleries or vintages. Check the label and producer information for grain proportions, cask and bottling details.`,

  wine: `Wine is an alcoholic drink made by fermenting grape juice with yeast. The basic variables are not mysterious: grape variety, ripeness, climate, winemaking and ageing vessel together determine colour, acidity, tannin, alcohol and aroma. “Terroir” can be a useful flavour clue, but it should not be treated as a universal explanation.

## Main categories

- **Still wine**: red, white and rosé, the most common types. Red wine is usually fermented with skins to extract colour and tannin; white wine is usually pressed without skins.
- **Sparkling wine**: carbon dioxide from fermentation remains in the wine; Champagne, Cava and Prosecco each have their own rules and regions.
- **Fortified wine**: grape spirit is added during or after fermentation, preserving sugar and raising alcohol, as in Port, Sherry and Madeira.
- **Sweet wine**: sweetness can come from late harvest, noble rot, ice wine or stopped fermentation; it is not the same as adding sugar.

## Vintage and origin

Vintage is the grape harvest year, not the bottling year. Weather affects ripeness and yield in a given year, but in stable climates with skilled winemaking, vintage variation may be less dramatic than legend suggests. AOC, PDO and DOC labels are first about rules and geographical origin, not a quality score.

## How to drink

White wine and light reds usually suit cooler temperatures; full-bodied reds and fortified wines can be warmer. Decanting mainly helps young, tannic wines meet air or separates sediment from old wine; not every wine needs it. Look at colour and clarity, smell the aroma, then judge acidity, tannin, body and finish.

## Boundary

This page describes categories and basic methods, not specific estates or vintages. Check the label and producer information for grape proportions, residual sugar, strength and ageing potential.`,

  'yellow-wine': `Huangjiu is a traditional Chinese fermented grain wine. It uses rice (glutinous, japonica or indica) as the main material, with wheat qu, starter or red yeast for saccharification and fermentation, followed by pressing, clarification, pasteurisation and ageing. Alcohol is usually 14%–20% ABV; it is fermented, not distilled.

## Main types

- **Shaoxing wine**: a protected geographical indication from Shaoxing, Zhejiang, brewed from glutinous rice, wheat qu and Jian Lake water; representative types include yuanhong, jiafan, huadiao, shanniang and xiangxue.
- **Fujian laojiu**: a traditional Fujian huangjiu, often made from glutinous rice and red yeast, with a sweeter, rounder flavour.
- **Jimo laojiu**: a traditional Shandong huangjiu made from broomcorn millet, with a toastier, fuller style.
- **Other regional huangjiu**: Jiangsu, Shanghai, Jiangxi and other regions have their own glutinous-rice traditions.

## Sweetness and age

Huangjiu can be classified by total sugar as dry, semi-dry, semi-sweet and sweet. Jiafan is semi-dry, shanniang is sweeter and xiangxue is sweeter still. “Aged” or “vintage” claims should be checked against the label and producer information; older is not necessarily better for everyone, and the aged aroma and acidity change with time.

## How to drink

Huangjiu can be warmed, served at room temperature or chilled. Warming is usually around 35–45°C, which releases aroma and softens the alcohol, but overheating damages the flavour. It suits hairy crab, braised pork and soy-braised duck. Adding preserved plum or ginger is common but masks the wine's own flavour.

## Boundary

This page describes categories and process, not specific brands. Check the label and producer information for ingredients, sugar, age and whether caramel colour is added.`,
};

let changed = 0;
for (const [slug, body] of Object.entries(bodies)) {
  const file = path.join(root, 'content-repositories', 'alcoholic-beverages', 'en', 'drink-style', `${slug}.md`);
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n\r?\n)# [^\r\n]+\r?\n([\s\S]*?)(\r?\n## References\r?\n)/);
  if (!match) throw new Error(`Unexpected structure: ${file}`);
  const next = `${match[1]}# ${text.match(/^# ([^\r\n]+)/m)?.[1]}\n\n${body}${match[3]}`;
  if (apply) fs.writeFileSync(file, next);
  changed += 1;
}
console.log(JSON.stringify({ apply, changed }, null, 2));
