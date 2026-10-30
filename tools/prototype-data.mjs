export const entries = [
  {
    id: 'guide:ice-and-temperature',
    type: 'guide',
    slug: 'ice-and-temperature',
    audienceZh: '想比较纯饮与加冰差异的读者',
    audienceEn: 'readers comparing neat drinks with ice',
    difficulty: 'beginner',
    aboutRefs: ['drink-style:whisky', 'drink-style:baijiu'],
    references: [
      { key: 'whisky', target_id: 'drink-style:whisky' },
      { key: 'baijiu', target_id: 'drink-style:baijiu' },
    ],
    sources: [
      { key: 'liquid-intelligence', title: 'Liquid Intelligence', publisher: 'Dave Arnold / W. W. Norton', note: 'Reference for chilling, dilution and shaking; no text is reproduced.', accessed: '2026-10-29' },
      { key: 'oxford-spirits', title: 'The Oxford Companion to Spirits and Cocktails', publisher: 'Oxford University Press', note: 'Reference for serving temperature and dilution.', accessed: '2026-10-29' },
    ],
    zhTitle: '加冰这件事，没有标准答案',
    zhSummary: '冰会降温、稀释并改变香气释放；先决定你想保留什么，再决定加不加。',
    zhBody: `加冰不是“会不会喝”的考试。冰同时做三件事：降温、稀释、改变香气释放。先想清楚你想保留什么，再决定怎么加。

## 温度与香气

低温会让挥发性香气变得安静，也会压低酒精刺激。高酒精度的[威士忌](ref:whisky)加一大块冰，入口会更柔，但香气层次也会收窄；[白酒](ref:baijiu)加冰则不像传统喝法，更多是一种个人选择。

## 稀释的节奏

冰融化会带来水。水能打开某些香气，也会削弱酒体和甜感。冰块越大，融化越慢，变化越可控；碎冰降温快，但稀释也快。

## 一个简单的比较方法

先纯饮一小口，记住香气和刺激感；再加冰，隔几分钟再尝。记录温度、冰型和时间，比争论“该不该加冰”更有用。

## 边界

不要用加冰来掩盖劣质酒的问题；也不要把纯饮当作唯一正确的喝法。`,
    enTitle: 'Ice is a choice, not a test',
    enSummary: 'Ice cools, dilutes and changes aroma release. Decide what you want to keep before adding it.',
    enBody: `Adding ice is not a test of how well you drink. Ice does three things at once: it chills, dilutes and changes how aroma reaches you. Decide what you want to preserve before choosing how to add it.

## Temperature and aroma

Cold makes volatile aromas quieter and softens the alcohol. A large cube in a high-strength [whisky](ref:whisky) can make the entry gentler while narrowing the aroma; ice in [baijiu](ref:baijiu) is a personal choice rather than a traditional serve.

## The pace of dilution

Melting ice adds water. A little water can open aroma, but too much weakens body and sweetness. A large cube melts slowly and gives you more control; crushed ice chills fast and dilutes fast.

## A simple comparison

Take a small neat sip and note the aroma and alcohol. Then add ice and taste again after a few minutes. Recording temperature, ice shape and time is more useful than arguing about whether ice is “right”.

## Boundary

Do not use ice to hide a flawed spirit, and do not treat neat drinking as the only correct method.`,
  },
  {
    id: 'guide:choose-a-glass',
    type: 'guide',
    slug: 'choose-a-glass',
    audienceZh: '想理解杯型作用、但不想被仪式绑架的读者',
    audienceEn: 'readers who want to understand glassware without the ceremony',
    difficulty: 'beginner',
    aboutRefs: ['drink-style:wine', 'drink-style:beer'],
    references: [
      { key: 'wine', target_id: 'drink-style:wine' },
      { key: 'beer', target_id: 'drink-style:beer' },
    ],
    sources: [
      { key: 'oxford-wine', title: 'The Oxford Companion to Wine', publisher: 'Oxford University Press', note: 'Reference for glass shape, aroma and serving temperature.', accessed: '2026-10-29' },
      { key: 'oxford-beer', title: 'The Oxford Companion to Beer', publisher: 'Oxford University Press', note: 'Reference for beer glassware and foam.', accessed: '2026-10-29' },
    ],
    zhTitle: '换一只杯子，会有什么不同？',
    zhSummary: '杯型改变香气聚集、入口位置与温度；先理解目的，再谈仪式。',
    zhBody: `杯型会改变三件事：香气在哪里聚集、酒液先接触口腔的哪一部分、温度上升得快不快。它有用，但不是魔法。

## 常见杯型

郁金香杯收口，适合聚拢[葡萄酒](ref:wine)和烈酒的香气；古典杯杯口宽、杯身矮，适合加冰和短饮；高球杯细长，能保留气泡和冰；品脱杯适合[啤酒](ref:beer)，但不利于聚香；香槟杯细长，主要服务于气泡。

## 一只杯子够不够？

日常只用一只通用酒杯也可以。想比较时，用同一款酒分别倒入两种杯子，间隔几分钟闻香和入口，差异会比“专家说应该用哪种杯”更直观。

## 实用优先

杯子要干净、无洗涤剂气味，倒入量不要过满。温度、冰和酒本身，通常比杯型影响更大。

## 边界

不必为了“正确”购买整套酒具；杯型是工具，不是身份考试。`,
    enTitle: 'A different glass, a different view',
    enSummary: 'Glass shape changes aroma concentration, where the liquid hits your mouth and how fast it warms.',
    enBody: `Glass shape changes three things: where aroma gathers, where the liquid first meets your mouth, and how quickly it warms. It matters, but it is not magic.

## Common shapes

A tulip concentrates the aroma of [wine](ref:wine) and spirits. A rocks glass is short and wide, suited to ice and short drinks. A highball is tall and narrow, helping keep bubbles and ice. A pint glass suits [beer](ref:beer) but does not concentrate aroma. A flute is designed mainly for bubbles.

## Do you need more than one?

One decent all-purpose glass is enough for everyday drinking. To compare, pour the same wine into two shapes and smell and taste after a few minutes; the difference will be clearer than any rule about the “correct” glass.

## Practical first

The glass should be clean and free of detergent smell, and it should not be overfilled. Temperature, ice and the drink itself usually matter more than shape.

## Boundary

You do not need a full set of glassware to drink well. A glass is a tool, not an identity test.`,
  },
  {
    id: 'guide:food-pairing',
    type: 'guide',
    slug: 'food-pairing',
    audienceZh: '想理解搭配原则、而不是背清单的读者',
    audienceEn: 'readers who want pairing principles rather than a list of rules',
    difficulty: 'beginner',
    aboutRefs: ['drink-style:wine', 'drink-style:yellow-wine'],
    references: [
      { key: 'wine', target_id: 'drink-style:wine' },
      { key: 'yellow-wine', target_id: 'drink-style:yellow-wine' },
    ],
    sources: [
      { key: 'wset-pairing', title: 'Four rules to masterful food and wine pairing', url: 'https://www.wsetglobal.com/knowledge-centre/blog/2023/july/13/four-rules-to-masterful-food-and-wine-pairing/', publisher: 'WSET', published: '2023-07-13', accessed: '2026-10-29', note: 'Reference for pairing principles; no text is reproduced.' },
      { key: 'oxford-wine', title: 'The Oxford Companion to Wine', publisher: 'Oxford University Press', note: 'Reference for acidity, tannin and sweetness in pairing.', accessed: '2026-10-29' },
    ],
    zhTitle: '先看盘子里，再看杯子里',
    zhSummary: '搭配不是寻找唯一答案，而是平衡浓度、酸度、甜度、脂肪与辛香。',
    zhBody: `搭配不是“红酒配红肉”的公式。先看盘子：食材的重量、油脂、酸度、甜度、咸鲜和辣度，往往比酒的颜色更重要。

## 几条可靠的原则

高酸的[葡萄酒](ref:wine)能切开油脂；甜度可以缓和辣味，但高酒精会放大辣感；单宁会与蛋白质结合，适合红肉，却可能让海鲜显得腥；咸鲜味会放大酒的苦和酒精，搭配时需要更谨慎。

## 先尝一口

先吃一口菜，再喝一口酒，看看味道是被放大、压住还是变干净。酱汁和烹饪方式往往比食材本身更影响搭配，例如同样的鱼，清蒸和红烧需要不同的酒。

## 黄酒与中餐

[黄酒](ref:yellow-wine)的米香、酸度和微甜，适合大闸蟹、红烧肉和酱鸭。温度也会改变搭配效果：温饮更柔，冰镇更清爽。

## 边界

个人偏好优先于规则。搭配的目标是让整顿饭更舒服，不是给每道菜找到唯一正确的酒。`,
    enTitle: 'Look at the plate before the glass',
    enSummary: 'Pairing is not a single right answer; it is a balance of weight, acidity, sweetness, fat and heat.',
    enBody: `Pairing is not the formula “red wine with red meat”. Look at the plate first: the weight, fat, acidity, sweetness, savouriness and heat of the food often matter more than the colour of the wine.

## Reliable principles

High-acid [wine](ref:wine) cuts through fat. Sweetness can soften chilli heat, while high alcohol amplifies it. Tannin binds with protein and suits red meat, but can make fish taste metallic. Savoury, umami-rich dishes amplify bitterness and alcohol, so choose with care.

## Taste together

Take a bite, then a sip, and notice whether the food is amplified, muted or cleaned up. Sauce and cooking method often matter more than the ingredient: steamed fish and braised fish need different wines.

## Huangjiu with Chinese food

The rice aroma, acidity and slight sweetness of [huangjiu](ref:yellow-wine) suit hairy crab, braised pork and soy-braised duck. Temperature changes the match: warm huangjiu is softer, chilled huangjiu is fresher.

## Boundary

Personal preference comes before rules. The aim is a more enjoyable meal, not one “correct” wine for every dish.`,
  },
  {
    id: 'guide:cocktail-basics',
    type: 'guide',
    slug: 'cocktail-basics',
    audienceZh: '刚开始在家调酒、想理解结构的读者',
    audienceEn: 'home bartenders starting with structure rather than recipes',
    difficulty: 'beginner',
    aboutRefs: ['cocktail:negroni', 'drink-style:gin'],
    references: [
      { key: 'negroni', target_id: 'cocktail:negroni' },
      { key: 'gin', target_id: 'drink-style:gin' },
    ],
    sources: [
      { key: 'iba-cocktails', title: 'IBA Cocktails', url: 'https://iba-world.com/cocktails/', publisher: 'International Bartenders Association', note: 'Reference for classic cocktail categories and recipes; no text is reproduced.', accessed: '2026-10-29' },
      { key: 'oxford-spirits', title: 'The Oxford Companion to Spirits and Cocktails', publisher: 'Oxford University Press', note: 'Reference for dilution, shaking and stirring.', accessed: '2026-10-29' },
    ],
    zhTitle: '调酒，是另一种认识酒的方式',
    zhSummary: '从基酒、酸甜、稀释和冰开始，理解一杯鸡尾酒的结构。',
    zhBody: `鸡尾酒不是把几种酒倒在一起。先理解结构：基酒提供骨架，甜味和酸度提供平衡，冰和水提供稀释，装饰提供香气。

## 一个经典公式

酸型鸡尾酒常用“烈酒 + 酸 + 甜”，例如代基里；[内格罗尼](ref:negroni)则是“烈酒 + 苦味 + 甜味”的等量结构。先按标准配方做一次，再调整糖酸比。

## 搅拌还是摇和

搅拌降温、稀释较慢。摇和降温更快，也会带入空气和细小冰屑；含果汁、蛋清或奶油的配方通常摇和。无论哪种，冰的质量和用量都会直接影响成品。

## 从经典开始

先用[金酒](ref:gin)、朗姆酒或威士忌做一杯经典，记录用量、冰和稀释时间。能稳定复现一杯，比背十个配方更有用。

## 边界

调酒不替代理性饮酒。注意酒精度、份量和饮用速度；不要在没有许可或安全条件的地方操作明火。`,
    enTitle: 'A cocktail is another way in',
    enSummary: 'Start with base spirit, sweet, sour, dilution and ice; recipes come after structure.',
    enBody: `A cocktail is not just several spirits poured together. Start with structure: a base spirit gives the frame, sweetness and acidity balance it, ice and water dilute it, and garnish adds aroma.

## A classic formula

Sour-style cocktails often use spirit, acid and sugar, as in a Daiquiri. The [Negroni](ref:negroni) uses equal parts spirit, bitter and sweet. Make the standard recipe once before adjusting the sugar-acid balance.

## Stir or shake

Stirring chills and dilutes slowly. Shaking chills faster and adds air and fine ice; recipes with juice, egg white or cream are usually shaken. In both cases, ice quality and quantity directly change the drink.

## Start with classics

Use [gin](ref:gin), rum or whisky to make one classic and record the measures, ice and dilution time. Being able to repeat one drink is more useful than memorising ten recipes.

## Boundary

Cocktails do not replace sensible drinking. Watch strength, serving size and pace, and never use open flame without permission or safe conditions.`,
  },
  {
    id: 'guide:read-a-label',
    type: 'guide',
    slug: 'read-a-label',
    audienceZh: '想从酒标上读出可用信息的读者',
    audienceEn: 'readers who want useful information from a label',
    difficulty: 'beginner',
    aboutRefs: ['drink-style:whisky', 'drink-style:wine'],
    references: [
      { key: 'whisky', target_id: 'drink-style:whisky' },
      { key: 'wine', target_id: 'drink-style:wine' },
    ],
    sources: [
      { key: 'eu-spirits', title: 'EU Regulation 2019/787', url: 'https://eur-lex.europa.eu/eli/reg/2019/787/oj', publisher: 'European Union', note: 'Reference for spirit-drink definitions and labelling.', accessed: '2026-10-29' },
      { key: 'ttb', title: 'TTB Beverage Alcohol Manual', url: 'https://www.ttb.gov/', publisher: 'U.S. Alcohol and Tobacco Tax and Trade Bureau', note: 'Reference for US beverage-alcohol labelling.', accessed: '2026-10-29' },
      { key: 'gb-7718', title: 'GB 7718-2011《预包装食品标签通则》', publisher: '中华人民共和国卫生部', note: 'Reference for Chinese prepackaged-food labelling; no standard text is reproduced.', accessed: '2026-10-29' },
    ],
    zhTitle: '酒标很小，线索不少',
    zhSummary: '酒标先告诉你类别、产地、酒精度和净含量；宣传语不等于事实。',
    zhBody: `酒标首先是法规文件，其次才是品牌叙事。先找可核对的信息，再读故事。

## 先看这些字段

产品类别、原料、酒精度、净含量、原产国/产区、生产者或装瓶者、生产日期或批号。进口酒还应有中文背标。中国白酒可以看香型、执行标准和生产许可证编号。

## 再看这些词

[葡萄酒](ref:wine)的品种、产区、年份和装瓶者；[威士忌](ref:whisky)的年龄标示、桶型和酒精度；“陈酿”“珍藏”“特级”等词在不同法规下含义不同，不能只凭字样判断品质。

## 一个实用习惯

拍照保存背标，回家后再查生产者和产区。发现标签信息与宣传不一致时，以法规标签和官方渠道为准。

## 边界

酒标能提供线索，但不能替代品鉴，也不能保证你一定会喜欢。`,
    enTitle: 'A small label, plenty of clues',
    enSummary: 'A label tells you category, origin, strength and volume first; marketing words are not facts.',
    enBody: `A label is a regulatory document before it is a brand story. Find the checkable facts first, then read the narrative.

## Start with these fields

Category, ingredients, alcohol strength, net volume, country or region of origin, producer or bottler, and production date or batch. Imported drinks should also carry a local-language back label. Chinese baijiu labels show aroma type, standard code and production licence number.

## Then read the words

For [wine](ref:wine), look at variety, region, vintage and bottler. For [whisky](ref:whisky), look at the age statement, cask type and strength. Terms such as “reserve”, “special” or “premium” have different legal meanings in different markets; do not judge quality from the word alone.

## A useful habit

Photograph the back label and check the producer and region later. If the label and the marketing disagree, trust the regulated label and official channels.

## Boundary

A label gives clues, but it does not replace tasting and cannot guarantee that you will like the drink.`,
  },
  {
    id: 'culture-article:place-and-process',
    type: 'article',
    slug: 'place-and-process',
    topicsZh: ['风土', '产地', '工艺'],
    topicsEn: ['terroir', 'origin', 'process'],
    periodZh: '现代',
    periodEn: 'Modern',
    aboutRefs: ['drink-style:wine', 'drink-style:whisky', 'drink-style:yellow-wine'],
    references: [
      { key: 'wine', target_id: 'drink-style:wine' },
      { key: 'whisky', target_id: 'drink-style:whisky' },
      { key: 'yellow-wine', target_id: 'drink-style:yellow-wine' },
      { key: 'baijiu', target_id: 'drink-style:baijiu' },
    ],
    sources: [
      { key: 'oiv', title: 'International Organisation of Vine and Wine (OIV)', url: 'https://www.oiv.int/', publisher: 'OIV', note: 'Reference for wine origin and labelling; no text is reproduced.', accessed: '2026-10-29' },
      { key: 'swa', title: 'Scotch Whisky Association', url: 'https://www.scotch-whisky.org.uk/', publisher: 'Scotch Whisky Association', note: 'Reference for Scotch production and protected origin.', accessed: '2026-10-29' },
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: 'Reference for baijiu production terms.', accessed: '2026-10-29' },
    ],
    zhTitle: '一杯酒，为什么有地方的味道？',
    zhSummary: '产地通过气候、土壤、品种与工艺进入酒中；风土不是唯一解释。',
    zhBody: `“地方的味道”不是一种神秘物质。它通常来自气候、土壤、原料品种、微生物环境和人为工艺的共同作用。

## 葡萄酒

[葡萄酒](ref:wine)的产地影响成熟度、酸度、糖分和风味。土壤排水、坡向、昼夜温差和降雨都会改变葡萄；酿造与陈年又会在产地之上叠加新的选择。地理标志说明产区与规则，不等于质量排名。

## 威士忌与白酒

[威士忌](ref:whisky)的产地味道来自水、麦芽、酵母、蒸馏器形状、橡木桶和仓库气候；[白酒](ref:baijiu)则与窖池、曲、水质和当地气候有关。同一产区内的不同酒厂，风格也可能相差很大。

## 黄酒

[黄酒](ref:yellow-wine)的米、水、曲和陈酿环境共同决定风味。绍兴酒的地理标志保护的是产区与工艺传统，不是某一种固定味道。

## 边界

风土是理解产地的线索，不是质量的保证。把“地方味道”说成唯一原因，会忽略工艺和人的选择。`,
    enTitle: 'How does a place end up in a glass?',
    enSummary: 'Place enters a drink through climate, soil, variety and process; terroir is not the only explanation.',
    enBody: `The “taste of a place” is not a mysterious substance. It usually comes from climate, soil, plant variety, microbial environment and human process acting together.

## Wine

For [wine](ref:wine), origin affects ripeness, acidity, sugar and flavour. Soil drainage, slope, day-night temperature and rainfall change the grapes; fermentation and ageing add further choices. A geographical indication describes origin and rules, not a quality ranking.

## Whisky and baijiu

The place character of [whisky](ref:whisky) comes from water, malt, yeast, still shape, oak and warehouse climate. For [baijiu](ref:baijiu), pits, qu, water and local climate matter. Different producers in the same region can still make very different spirits.

## Huangjiu

For [huangjiu](ref:yellow-wine), rice, water, qu and the ageing environment shape the flavour. The Shaoxing geographical indication protects an origin and a craft tradition, not one fixed taste.

## Boundary

Terroir is a clue to origin, not a guarantee of quality. Treating “place” as the only cause ignores process and human choice.`,
  },
  {
    id: 'culture-article:pub-and-city',
    type: 'article',
    slug: 'pub-and-city',
    topicsZh: ['酒馆', '城市', '公共生活'],
    topicsEn: ['pubs', 'cities', 'public life'],
    periodZh: '近现代',
    periodEn: 'Modern',
    aboutRefs: ['place:american-bar-savoy', 'place:cafe-central'],
    references: [
      { key: 'savoy', target_id: 'place:american-bar-savoy' },
      { key: 'central', target_id: 'place:cafe-central' },
    ],
    sources: [
      { key: 'oxford-beer', title: 'The Oxford Companion to Beer', publisher: 'Oxford University Press', note: 'Reference for pub culture and beer-history context.', accessed: '2026-10-29' },
      { key: 'camra', title: 'Campaign for Real Ale (CAMRA)', url: 'https://www.camra.org.uk/', publisher: 'CAMRA', note: 'Reference for British pub culture and pub preservation; no text is reproduced.', accessed: '2026-10-29' },
    ],
    zhTitle: '认识一座城，从一间酒馆开始',
    zhSummary: '酒馆是城市生活的切片；历史、街区、常客与酒单共同构成它的性格。',
    zhBody: `酒馆不只是喝酒的地方。它把街区的作息、收入、移民、文学和夜生活压缩在一个房间里。

## 不同类型的酒馆

英式 pub 常与街区和社区生活绑定；法式咖啡馆把街道延伸到室内；美式 bar 更强调调酒与服务；德式 beer hall 用长桌和大杯啤酒组织社交。空间和营业时间，往往比酒单更能说明它属于谁。

## 历史与旅游

[萨沃伊美式酒吧](ref:savoy)的鸡尾酒史、[中央咖啡馆](ref:central)的文学顾客，都是城市记忆的一部分。但名人故事也常被旅游营销放大；读历史时要区分可核实的记录与传说。

## 怎么观察一间酒馆

看它什么时候最热闹、常客如何点单、酒单偏本地还是国际、服务员与客人的关系。点一杯当地常见的酒，比点最贵的酒更容易理解它。

## 边界

酒馆是公共空间，不是布景。尊重当地习惯、营业规则和其他客人，比拍出好看的照片更重要。`,
    enTitle: 'Meet a city through one of its pubs',
    enSummary: 'A pub is a slice of city life; history, neighbourhood, regulars and the drinks list shape its character.',
    enBody: `A pub is not only a place to drink. It compresses a neighbourhood's rhythms, income, migration, literature and nightlife into one room.

## Different kinds of places

The British pub is tied to neighbourhood and community life; the French café extends the street indoors; the American bar emphasises cocktails and service; the German beer hall uses long tables and large beers to organise sociability. Space and opening hours often say more about who belongs than the drinks list.

## History and tourism

The cocktail history of the [American Bar at The Savoy](ref:savoy) and the literary guests of [Café Central](ref:central) are part of urban memory. But celebrity stories are also amplified by tourism; separate verifiable records from legend.

## How to read a pub

Notice when it is busiest, how regulars order, whether the list is local or international, and how staff and guests interact. Ordering a common local drink teaches you more than ordering the most expensive bottle.

## Boundary

A pub is a public space, not a set. Respect local habits, house rules and other guests; that matters more than a good photograph.`,
  },
  {
    id: 'culture-article:beyond-the-pub',
    type: 'article',
    slug: 'beyond-the-pub',
    topicsZh: ['酒厂参观', '酿造', '旅行'],
    topicsEn: ['distillery visits', 'brewing', 'travel'],
    periodZh: '当代',
    periodEn: 'Contemporary',
    aboutRefs: ['place:schlenkerla', 'drink-style:whisky'],
    references: [
      { key: 'schlenkerla', target_id: 'place:schlenkerla' },
      { key: 'whisky', target_id: 'drink-style:whisky' },
    ],
    sources: [
      { key: 'swa-tours', title: 'Scotch Whisky — Tours, Trails and Tourism', url: 'https://www.scotch-whisky.org.uk/discover-scotch/tours-trails-and-tourism/', publisher: 'Scotch Whisky Association', note: 'Reference for distillery tourism; no text is reproduced.', accessed: '2026-10-29' },
      { key: 'oxford-beer', title: 'The Oxford Companion to Beer', publisher: 'Oxford University Press', note: 'Reference for brewery visits and production.', accessed: '2026-10-29' },
    ],
    zhTitle: '从酒馆，再走到酿酒的地方',
    zhSummary: '酒厂与酒庄参观把风味和工艺连起来；提前预约，尊重生产区域。',
    zhBody: `在酒馆里，你看到的是成品；走到酿酒的地方，才会看到风味是怎样被做出来的。

## 参观时看什么

原料如何处理、发酵在哪里发生、蒸馏器或糖化设备长什么样（例如[威士忌](ref:whisky)的壶式蒸馏器）、酒在什么容器里陈年、装瓶前如何调配。生产日和非生产日的参观体验差别很大，提前确认能看到的环节。

## 品鉴与安全

品鉴通常安排在参观末尾。不要驾车，控制品鉴量，喝水并吃点东西。生产区域可能有高温、粉尘、湿滑地面和设备噪音，遵守现场指引。

## 买酒与支持

直接从[酒厂](ref:schlenkerla)或酒庄买酒，能支持生产者的日常工作，也更容易问到具体批次。但纪念版和限定版不一定适合日常饮用，先试再买。

## 边界

参观是理解工艺的入口，不是质量认证。一次旅游体验不能替代对产品标签、来源和风味的独立判断。`,
    enTitle: 'Beyond the pub, to where it is made',
    enSummary: 'Distillery and brewery visits connect flavour with process; book ahead and respect production areas.',
    enBody: `In a pub you see the finished product. At the place where it is made, you see how the flavour was built.

## What to look for

How raw materials are handled, where fermentation happens, what the still or mash equipment looks like (for example a [whisky](ref:whisky) pot still), what vessels hold the spirit, and how it is blended before bottling. Visits on production and non-production days differ greatly; check which stages you will actually see.

## Tasting and safety

Tastings usually come at the end. Do not drive, control the amount you taste, drink water and eat something. Production areas can be hot, dusty, wet and noisy; follow the site's instructions.

## Buying and support

Buying directly from a [brewery](ref:schlenkerla) or distillery supports the people who make the drink and makes it easier to ask about a specific batch. Limited editions are not automatically better for everyday drinking; taste before buying.

## Boundary

A visit is an entry point to process, not a quality certificate. One tour cannot replace independent judgment of the label, the source and the flavour.`,
  },
];
