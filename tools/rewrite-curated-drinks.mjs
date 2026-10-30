import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apply = process.argv.includes('--apply');
const today = '2026-10-29';

const commonRights = {
  status: 'allowed',
  license: 'CC-BY-4.0',
  basis: `项目自写；依据生产者、产区协会或公开标准核验，未复制原文。项目所有者于 ${today} 声明项目内容采用 CC BY 4.0。`,
  note: '第三方标准、商标、图片与引用文本不在本许可内；来源仅作核验引用。',
};

const entries = [
  {
    file: 'drink/guizhou-moutai.md',
    title: '茅台酒',
    summary: '产自贵州仁怀茅台镇的酱香型白酒代表，以高粱和小麦高温大曲酿造，常见酒精度 53% vol。',
    aliases: ['Moutai', 'Kweichow Moutai'],
    styles: ['drink-style:baijiu'],
    abv: { min: 53, max: 53, unit: 'percent-vol' },
    sources: [
      { key: 'moutai-site', title: '贵州茅台酒股份有限公司官方网站', publisher: '贵州茅台酒股份有限公司', note: '用于核对产品系列、产地与公开的企业信息。', accessed: today },
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对酱香型白酒与相关工艺术语。', accessed: today },
    ],
    body: `茅台酒产自贵州省仁怀市茅台镇，是酱香型白酒的代表。它以高粱为原料，用小麦制作高温大曲，经多轮蒸煮、发酵、取酒，基酒再经贮存和勾调。常见飞天茅台酒精度为 53% vol。

## 风格

酱香型白酒的香气常被描述为酱香、焦香、花果香和焙烤香并存，酒体较厚，回味长。茅台镇河谷的气候、水源和长期酿造环境被视为风味条件之一；“离开茅台镇酿不出茅台”是行业说法，不宜当作严格的科学结论。

## 怎么喝

用小杯纯饮，先闻香再小口品尝，注意酒精刺激与回甘。加冰或大量兑水会改变香气结构；如果要加水，建议逐滴加入。

## 边界

本页描述产品类别和公开信息，不构成质量排名、收藏建议或投资建议。具体酒款的真伪、年份、批次和价格，应以官方渠道和标签为准。`,
  },
  {
    file: 'drink/sichuan-wuliangye.md',
    title: '五粮液',
    summary: '产自四川宜宾的浓香型白酒，以高粱、大米、糯米、小麦、玉米五种粮食为原料，常见酒精度 52% vol。',
    aliases: ['Wuliangye'],
    styles: ['drink-style:baijiu', 'drink-style:strong-aroma-baijiu'],
    abv: { min: 52, max: 52, unit: 'percent-vol' },
    sources: [
      { key: 'wuliangye-site', title: '宜宾五粮液股份有限公司官方网站', publisher: '宜宾五粮液股份有限公司', note: '用于核对产地、原料与产品系列。', accessed: today },
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对浓香型白酒与续糟配料等术语。', accessed: today },
    ],
    body: `五粮液产自四川宜宾，以高粱、大米、糯米、小麦、玉米五种粮食为原料，属浓香型白酒。老窖池持续发酵、续糟配料和混蒸混烧是其主要工艺特征，常见产品酒精度为 52% vol。

## 风格

香气以窖香、粮香和甜香为主，入口绵甜，酒体较饱满，尾味干净。浓香型的主体香气通常与己酸乙酯有关，但不同窖池、年份和勾调会带来明显差异。

## 怎么喝

小杯纯饮，搭配川菜时要注意辣味会放大酒精刺激。加冰并非传统喝法，但会降低刺激、改变香气释放。

## 边界

本页只说明产品类别与工艺，不评价具体年份或批次。购买时应通过正规渠道核对标签、防伪与生产信息。`,
  },
  {
    file: 'drink/shanxi-fenjiu.md',
    title: '汾酒',
    summary: '产自山西汾阳杏花村的清香型白酒代表，以高粱、大麦和豌豆制曲，常见酒精度 53% vol。',
    aliases: ['Fenjiu', 'Xinghuacun Fenjiu'],
    styles: ['drink-style:baijiu'],
    abv: { min: 53, max: 53, unit: 'percent-vol' },
    sources: [
      { key: 'fenjiu-site', title: '山西杏花村汾酒厂股份有限公司官方网站', publisher: '山西杏花村汾酒厂股份有限公司', note: '用于核对产地、原料与产品信息。', accessed: today },
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对清香型白酒与清蒸二次清工艺术语。', accessed: today },
    ],
    body: `汾酒产自山西汾阳杏花村，是清香型白酒的代表。它以高粱为原料，大麦和豌豆制曲，采用清蒸二次清工艺，常见酒精度为 53% vol。

## 风格

清香型白酒强调干净、爽净，香气以乙酸乙酯为主体，常带粮香和轻微果香，入口绵甜，落口爽净。它与浓香型的窖香、酱香型的焦香形成明显区别。

## 怎么喝

小杯纯饮即可；也有人温饮，但温度不宜过高。不要用浓香型或酱香型的标准评判清香型，风格差异不是质量高低。

## 边界

本页描述品类与工艺，不评价具体产品。具体酒款的原料比例、年份和酒精度，应以标签与生产者信息为准。`,
  },
  {
    file: 'drink/sichuan-luzhoulaojiao.md',
    title: '泸州老窖',
    summary: '产自四川泸州的浓香型白酒代表，以老窖池续糟发酵为特色，常见产品酒精度 52% vol。',
    aliases: ['Luzhou Laojiao'],
    styles: ['drink-style:baijiu', 'drink-style:strong-aroma-baijiu'],
    abv: { min: 52, max: 52, unit: 'percent-vol' },
    sources: [
      { key: 'luzhou-site', title: '泸州老窖股份有限公司官方网站', publisher: '泸州老窖股份有限公司', note: '用于核对产地、窖池与产品系列信息。', accessed: today },
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对浓香型白酒与泥窖固态发酵术语。', accessed: today },
    ],
    body: `泸州老窖产自四川泸州，是浓香型白酒的代表之一。其老窖池群连续使用时间长，“续糟配料、混蒸混烧”的泥窖固态发酵形成窖香浓郁的风格，常见产品酒精度为 52% vol。

## 风格

香气以窖香、粮香和己酸乙酯为主，入口甜绵，酒体较丰满，尾味净。老窖池的微生物群落是浓香型风味的重要条件，但“窖池越老酒越好”仍是经验说法，不能替代具体品评。

## 怎么喝

小杯纯饮，适合搭配味道较浓的中式菜肴。开瓶后避免长时间暴晒和高温存放。

## 边界

本页只说明品类与工艺，不评价具体产品。具体酒款的年份、批次和价格，应以官方渠道与标签为准。`,
  },
  {
    file: 'drink/sichuan-jiannanchun.md',
    title: '剑南春',
    summary: '产自四川绵竹的浓香型白酒，以五粮为原料、泥窖固态发酵，常见酒精度 52% vol。',
    aliases: ['Jiannanchun'],
    styles: ['drink-style:baijiu', 'drink-style:strong-aroma-baijiu'],
    abv: { min: 52, max: 52, unit: 'percent-vol' },
    sources: [
      { key: 'jiannanchun-site', title: '四川剑南春（集团）有限责任公司官方网站', publisher: '四川剑南春（集团）有限责任公司', note: '用于核对产地、原料与产品信息。', accessed: today },
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对浓香型白酒工艺术语。', accessed: today },
    ],
    body: `剑南春产自四川绵竹，属浓香型白酒。它以高粱、大米、糯米、小麦、玉米为原料，采用泥窖固态发酵、续糟配料等传统工艺，常见酒精度为 52% vol。

## 风格

剑南春通常被描述为醇厚、甘冽，窖香与粮香并重，入口有甜感，尾味干净。它与川南浓香型在气候、窖池和勾调上存在差异，风格并不完全一致。

## 怎么喝

小杯纯饮，或搭配口味较重的菜肴。初次尝试可以少量倒酒，先闻香再入口，避免空腹快速饮用。

## 边界

本页只说明产品类别与工艺，不评价具体年份或批次。具体产品的原料、酒精度和生产信息，应以标签与官方渠道为准。`,
  },
  {
    file: 'drink/jiangsu-yanghe.md',
    title: '洋河酒',
    summary: '产自江苏宿迁的浓香型白酒品牌，以“绵柔”风格和蓝色经典系列知名，酒精度覆盖多个度数。',
    aliases: ['Yanghe', 'Yanghe Blue Classic'],
    styles: ['drink-style:baijiu', 'drink-style:strong-aroma-baijiu'],
    sources: [
      { key: 'yanghe-site', title: '江苏洋河酒厂股份有限公司官方网站', publisher: '江苏洋河酒厂股份有限公司', note: '用于核对产地、产品系列与公开信息。', accessed: today },
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对浓香型白酒与相关工艺术语。', accessed: today },
    ],
    body: `洋河产自江苏宿迁，属浓香型白酒。现代产品以“绵柔”风格著称，主打海之蓝、天之蓝、梦之蓝系列，酒精度覆盖 38%–52% vol 等不同规格。

## 风格

“绵柔”是风味描述，不是法定香型。洋河的工艺仍以浓香型固态发酵为基础，强调入口柔和、甜感明显、刺激感较低；不同度数和系列之间的差异很大。

## 怎么喝

按酒精度选择喝法：低度产品可以纯饮或加冰，高度产品更适合小杯慢饮。搭配淮扬菜等清淡菜肴时，注意甜味和鲜味会改变对酒精感的判断。

## 边界

本页只说明品牌与品类，不评价具体产品。具体酒款的基酒年份、调味酒比例和酒精度，应以标签与官方信息为准。`,
  },
  {
    file: 'drink/shaanxi-xifengjiu.md',
    title: '西凤酒',
    summary: '产自陕西凤翔的凤香型白酒代表，以高粱、大麦、小麦和豌豆制曲，常见酒精度 55% vol。',
    aliases: ['Xifengjiu', 'Xifeng Jiu'],
    styles: ['drink-style:baijiu'],
    abv: { min: 55, max: 55, unit: 'percent-vol' },
    sources: [
      { key: 'xifeng-site', title: '陕西西凤酒股份有限公司官方网站', publisher: '陕西西凤酒股份有限公司', note: '用于核对产地、原料与产品信息。', accessed: today },
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对凤香型白酒与酒海贮存等术语。', accessed: today },
    ],
    body: `西凤酒产自陕西凤翔，是凤香型白酒的代表。它以高粱为原料，大麦、小麦、豌豆制曲，采用土暗窖发酵、酒海贮存，常见酒精度为 55% vol。

## 风格

凤香型介于清香与浓香之间，常带有己酸乙酯与乙酸乙酯的复合香气，入口挺拔，回味较长。酒海（荆条编桶、内糊猪血和蛋清等）是传统贮存容器，会影响酒体风格。

## 怎么喝

小杯纯饮，适合搭配西北风味的肉类和面食。高度酒不宜快饮；初次尝试可先少量，适应其挺拔的酸香和酒精感。

## 边界

本页只说明品类与工艺，不评价具体产品。具体酒款的贮存时间、勾调和酒精度，应以标签与官方渠道为准。`,
  },
  {
    file: 'brand/gujing-gongjiu.md',
    title: '古井贡酒',
    summary: '产自安徽亳州的浓香型白酒品牌，以“年份原浆”系列知名，产品覆盖多个酒精度。',
    aliases: ['Gujing Gongjiu'],
    officialUrl: 'https://www.gujing.com/',
    sources: [
      { key: 'gujing-site', title: '安徽古井集团有限责任公司官方网站', publisher: '安徽古井集团有限责任公司', note: '用于核对产地、产品系列与企业公开信息。', accessed: today },
      { key: 'producer-page', title: '古井贡酒生产者页', publisher: '喝酒去项目', note: '项目内已核验的生产者条目，记录公司身份与产地。', accessed: today },
    ],
    body: `古井贡酒产自安徽亳州，是浓香型白酒品牌，以“年份原浆”系列最为知名。其酿造使用当地水源、泥窖固态发酵和续糟配料，产品覆盖 40%–52% vol 等不同度数。

## 风格

古井贡酒通常表现为窖香、粮香和甜香并重，入口绵甜，酒体较柔和。不同系列和度数之间的差异明显，不能用一个风味描述覆盖全部产品。

## 关于“年份原浆”

“年份原浆”是产品系列名称，不等于瓶中每一滴酒的实际年份。具体年份标识、基酒比例和调味酒信息，应以产品标签和企业公开说明为准。

## 边界

本页只说明品牌与品类，不评价具体产品。购买时应通过正规渠道核对防伪、生产批次和标签信息。`,
  },
  {
    file: 'drink/sichuan-langjiu.md',
    title: '郎酒',
    summary: '产自四川古蔺赤水河畔的白酒品牌，兼有酱香与浓香产品，青花郎等酱香产品较为知名。',
    aliases: ['Langjiu', 'Hongyun Lang'],
    styles: ['drink-style:baijiu'],
    sources: [
      { key: 'langjiu-site', title: '四川郎酒股份有限公司官方网站', publisher: '四川郎酒股份有限公司', note: '用于核对产地、产品系列与公开信息。', accessed: today },
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对酱香型与浓香型白酒术语。', accessed: today },
    ],
    body: `郎酒产自四川古蔺二郎镇，位于赤水河畔，产品兼有酱香型和浓香型，其中青花郎等酱香产品较为知名。常见酱香产品酒精度为 53% vol。

## 风格

酱香产品通常具有酱香、焦香和花果香，酒体较厚；浓香产品则更强调窖香和粮香。赤水河谷的气候与水源被视为其酿造条件之一，但不同厂区和产品线的风格并不相同。

## 怎么喝

酱香产品适合小杯纯饮，浓香产品可以按个人习惯纯饮或搭配菜肴。高度酒不宜快速饮用，开瓶后应避免高温和阳光直射。

## 边界

本页只说明品牌与品类，不评价具体产品。具体酒款的香型、年份和酒精度，应以标签与官方渠道为准。`,
  },
  {
    file: 'drink/hunan-jiugui.md',
    title: '酒鬼酒',
    summary: '产自湖南吉首的馥郁香型白酒，融合浓香、清香和酱香工艺特点，常见酒精度 52% vol。',
    aliases: ['Jiugui', 'Jiugui Liquor'],
    styles: ['drink-style:baijiu'],
    abv: { min: 52, max: 52, unit: 'percent-vol' },
    sources: [
      { key: 'jiugui-site', title: '酒鬼酒股份有限公司官方网站', publisher: '酒鬼酒股份有限公司', note: '用于核对产地、香型与产品信息。', accessed: today },
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对馥郁香型白酒的术语与工艺边界。', accessed: today },
    ],
    body: `酒鬼酒产自湖南吉首，属馥郁香型白酒。该香型融合浓香、清香和酱香工艺特点，以高粱、大米、糯米、小麦、玉米为原料，常见酒精度为 52% vol。

## 风格

馥郁香型的典型描述是“前浓、中清、后酱”：入口有浓香的甜绵，中段清爽，回味带酱香。它是行业标准中的香型分类，不是营销形容词；不同产品和年份仍会有差异。

## 怎么喝

小杯纯饮，适合搭配湘菜等味道鲜明的菜肴。初次尝试可以少量入口，感受香气层次；不要用单一香型的标准去判断它。

## 边界

本页只说明品类与工艺，不评价具体产品。具体酒款的原料、年份和酒精度，应以标签与官方信息为准。`,
  },
  {
    file: 'drink/zhejiang-guyuelongshan.md',
    title: '古越龙山花雕酒',
    summary: '浙江绍兴黄酒品牌，以糯米、麦曲和鉴湖水酿造，花雕、加饭等产品常见酒精度 15%–18% vol。',
    aliases: ['Guyuelongshan', 'Guyuelongshan Huadiao'],
    styles: ['drink-style:yellow-wine'],
    sources: [
      { key: 'guyuelongshan-site', title: '浙江古越龙山绍兴酒股份有限公司官方网站', publisher: '浙江古越龙山绍兴酒股份有限公司', note: '用于核对产地、产品系列与公开信息。', accessed: today },
      { key: 'gb-yellow-wine', title: 'GB/T 13662-2018《黄酒》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对黄酒分类与技术要求。', accessed: today },
      { key: 'gb-shaoxing', title: 'GB/T 17946-2008《地理标志产品 绍兴酒（绍兴黄酒）》', publisher: '国家标准化管理委员会', note: '用于核对绍兴酒的地理标志与原料要求。', accessed: today },
    ],
    body: `古越龙山是浙江绍兴黄酒品牌，主打花雕、加饭等绍兴酒产品。以糯米、麦曲和鉴湖水酿造，经压榨、煎酒和陈酿，酒精度通常在 15%–18% vol。

## 风格

绍兴黄酒通常具有米香、麦曲香和陈香，口感从半干到半甜不等。花雕是绍兴酒的传统称谓，不等于固定甜度；加饭酒偏半干，善酿酒偏甜，具体糖分应看标签。

## 怎么喝

可以温饮，温度约 35–45°C，也可以常温或冰镇。温饮能释放香气、降低刺激，但温度过高会破坏风味。适合搭配大闸蟹、红烧肉和酱鸭。

## 边界

本页只说明品牌与品类，不评价具体年份。具体酒款的糖分、酒龄和是否添加焦糖色，应以标签与官方信息为准。`,
  },
  {
    file: 'drink/shandong-tsingtao.md',
    title: '青岛啤酒',
    summary: '产自山东青岛的拉格啤酒品牌，1903 年创办，主力产品酒精度约 4% vol。',
    aliases: ['Tsingtao', 'Tsingtao Beer'],
    styles: ['drink-style:beer'],
    sources: [
      { key: 'tsingtao-site', title: '青岛啤酒股份有限公司官方网站', publisher: '青岛啤酒股份有限公司', note: '用于核对品牌历史、产地与产品信息。', accessed: today },
      { key: 'oxford-beer', title: 'The Oxford Companion to Beer', publisher: 'Oxford University Press', note: '参考其关于拉格啤酒与中国啤酒工业的条目。', accessed: today },
    ],
    body: `青岛啤酒产自山东青岛，是中国历史最久的啤酒品牌之一，1903 年由德英商人创办。主力产品为下面发酵的拉格啤酒，常见酒精度约 4% vol。

## 风格

青岛啤酒通常表现为干净、清爽，苦度适中，带有轻微的麦芽甜香和酒花香气。不同产品线（经典、纯生、白啤、黑啤等）风格差异明显，不能用一个描述概括。

## 怎么喝

充分冰镇后饮用，使用干净的玻璃杯有助于观察泡沫和香气。搭配海鲜、烧烤和中性口味菜肴较合适；久放或反复升温会加速氧化。

## 边界

本页只说明品牌与品类，不评价具体产品。具体酒款的原料、原麦汁浓度和酒精度，应以标签与官方信息为准。`,
  },
  {
    file: 'drink/beijing-erguotou.md',
    title: '二锅头',
    summary: '北京传统白酒工艺与产品类别，因取第二锅冷却流出的酒液而得名，风格清香、直接。',
    aliases: ['Erguotou'],
    styles: ['drink-style:baijiu'],
    sources: [
      { key: 'gb-baijiu', title: 'GB/T 15109-2021《白酒工业术语》', publisher: '国家市场监督管理总局、国家标准化管理委员会', note: '用于核对二锅头工艺与白酒术语。', accessed: today },
      { key: 'cada', title: '中国酒业协会 — 白酒品类与工艺公开资料', publisher: '中国酒业协会', note: '用于核对北京二锅头的传统工艺背景；仅作核验引用。', accessed: today },
    ],
    body: `二锅头是北京传统白酒工艺和产品类别，因蒸馏时只取第二锅冷却流出的酒液而得名。它以高粱为主料，采用麸曲或大曲发酵，常见酒精度为 43%–56% vol，风格清香、直接。

## 风格

二锅头通常入口冲、香气直接、尾味干净，价格区间跨度很大。它不是一个单一品牌，红星、牛栏山等都有二锅头产品；不同企业的原料、曲种和勾调差异明显。

## 怎么喝

传统上用小杯纯饮，也常被用于调制鸡尾酒或浸泡果酒。由于酒精度较高，不宜快饮；搭配北京小吃时注意咸味和油脂会改变对酒精刺激的感受。

## 边界

本页只说明工艺类别，不评价具体品牌。具体产品的原料、酒精度和生产标准，应以标签与企业公开信息为准。`,
  },
  {
    file: 'drink/shandong-changyu.md',
    title: '张裕葡萄酒',
    summary: '山东烟台葡萄酒品牌，张裕公司创建于 1892 年，产品覆盖干红、干白和白兰地。',
    aliases: ['Changyu', 'Changyu Pioneer'],
    styles: ['drink-style:wine'],
    sources: [
      { key: 'changyu-site', title: '烟台张裕葡萄酿酒股份有限公司官方网站', publisher: '烟台张裕葡萄酿酒股份有限公司', note: '用于核对品牌历史、产地与产品系列。', accessed: today },
      { key: 'oiv', title: 'International Organisation of Vine and Wine (OIV)', url: 'https://www.oiv.int/', publisher: 'OIV', note: '用于核对葡萄酒的国际技术口径。', accessed: today },
    ],
    body: `张裕葡萄酒产自山东烟台，张裕公司创建于 1892 年，是中国最早的现代葡萄酒企业之一。产品覆盖干红、干白、白兰地等，代表品种包括蛇龙珠、赤霞珠和霞多丽。

## 风格

张裕的产品线跨度很大，从日常餐酒到酒庄酒都有。烟台产区的海洋性气候影响葡萄成熟度；不同系列、年份和品种之间的风格差异，比品牌名本身更重要。

## 关于蛇龙珠

蛇龙珠（Cabernet Gernischt）是中国葡萄酒中的代表性品种之一，其与佳美娜的亲缘关系曾引发研究讨论。酒标上的品种应以企业检测和标签为准。

## 怎么喝

干红适合搭配红肉和中式浓味菜肴，干白适合海鲜和清淡菜肴。饮用温度分别为约 16–18°C 和 8–12°C；开瓶后尽快喝完。

## 边界

本页只说明品牌与品类，不评价具体产品。具体酒款的品种比例、年份和产地，应以标签与官方信息为准。`,
  },
  {
    file: 'drink/scotland-themacallan.md',
    title: '麦卡伦18年雪莉桶',
    summary: '苏格兰斯佩塞单一麦芽威士忌，以雪莉调味橡木桶陈年风格著称，常见酒精度 43% vol。',
    aliases: ['The Macallan 18', 'Macallan Sherry Oak 18'],
    styles: ['drink-style:whisky'],
    abv: { min: 43, max: 43, unit: 'percent-vol' },
    sources: [
      { key: 'macallan-site', title: 'The Macallan — Official Site', url: 'https://www.themacallan.com/', publisher: 'The Macallan', note: '用于核对产品系列、桶型与酒精度。', accessed: today },
      { key: 'swa', title: 'Scotch Whisky Association — Regulations', url: 'https://www.scotch-whisky.org.uk/', publisher: 'Scotch Whisky Association', note: '用于核对苏格兰威士忌的法定陈年与标识要求。', accessed: today },
    ],
    body: `麦卡伦是苏格兰斯佩塞产区的单一麦芽威士忌品牌，以雪莉调味橡木桶陈年风格著称。麦卡伦 18 年雪莉桶常见酒精度为 43% vol，风味以干果、香料、黑巧克力为主。

## 风格

雪莉桶带来葡萄干、无花果、橙皮和木质香料的气息，酒体较饱满。不同版本、批次和桶型会带来差异；“18 年”指瓶中酒液的最低陈年时间，不是单一桶的年龄。

## 怎么喝

纯饮可以完整体验香气；加少量室温水能降低酒精刺激、打开干果和香料层次。加冰会降温和稀释，适合较高酒精度或较厚重的批次。

## 边界

本页只说明品牌与品类，不评价具体批次。具体酒款的桶型、装瓶酒精度和版本信息，应以瓶身标签与官方渠道为准。`,
  },
  {
    file: 'drink/japan-yamazaki.md',
    title: '山崎单一麦芽威士忌',
    summary: '日本三得利在京都山崎设立的麦芽威士忌蒸馏厂，1923 年投产，常见酒精度 43% vol。',
    aliases: ['Yamazaki', 'Suntory Yamazaki'],
    styles: ['drink-style:whisky'],
    abv: { min: 43, max: 43, unit: 'percent-vol' },
    sources: [
      { key: 'suntory-site', title: 'Suntory — Yamazaki Distillery', url: 'https://www.suntory.com/', publisher: 'Suntory', note: '用于核对蒸馏厂历史、产地与产品信息。', accessed: today },
      { key: 'yoshu', title: '日本洋酒酒造组合 — 日本威士忌标示标准', publisher: '日本洋酒酒造组合', note: '用于核对日本威士忌的原料、蒸馏与陈年地点要求。', accessed: today },
    ],
    body: `山崎是日本三得利在京都府山崎设立的麦芽威士忌蒸馏厂，1923 年投产，是日本威士忌产业的起点之一。山崎单一麦芽常使用水楢桶和雪莉桶，常见酒精度为 43% vol。

## 风格

山崎通常表现为细腻、平衡，带有花果香、蜂蜜和檀香般的木质气息。水楢桶会带来特有的沉香、椰子与香料感；不同年份和桶型的差异很大。

## 怎么喝

纯饮或加少量水，适合用小郁金香杯聚集香气。加冰会降低香气释放；高球是日本常见的日常喝法，但会稀释细节。

## 边界

本页只说明品牌与品类，不评价具体批次。日本威士忌的标示规则近年收紧，具体产品是否符合“日本威士忌”定义，应以标签与协会标准为准。`,
  },
  {
    file: 'drink/ireland-jamesonirishwhiskey.md',
    title: '尊美醇爱尔兰威士忌',
    summary: '爱尔兰调和威士忌品牌，由 Midleton 蒸馏厂生产，三次蒸馏，常见酒精度 40% vol。',
    aliases: ['Jameson', 'Jameson Irish Whiskey'],
    styles: ['drink-style:whisky'],
    abv: { min: 40, max: 40, unit: 'percent-vol' },
    sources: [
      { key: 'jameson-site', title: 'Jameson — Official Site', url: 'https://www.jamesonwhiskey.com/', publisher: 'Jameson', note: '用于核对品牌历史、工艺与产品信息。', accessed: today },
      { key: 'irish-whiskey', title: 'Irish Whiskey Association — Protected Status', url: 'https://www.irishwhiskeyassociation.ie/', publisher: 'Irish Whiskey Association', note: '用于核对爱尔兰威士忌的地理标志与最低陈年要求。', accessed: today },
    ],
    body: `尊美醇是爱尔兰调和威士忌品牌，由 Midleton 蒸馏厂生产，采用三次蒸馏，常见酒精度为 40% vol。风味以谷物甜香、青苹果和香草为主，口感顺滑。

## 风格

三次蒸馏带来较轻的酒体和柔和的刺激感；调和工艺再平衡谷物威士忌与壶式威士忌的比例。它适合作为爱尔兰威士忌的入门，但不代表全部爱尔兰风格。

## 怎么喝

纯饮、加冰或加苏打水都可以；也常用于爱尔兰咖啡。加水量不宜过多，以免冲淡谷物甜香。

## 边界

本页只说明品牌与品类，不评价具体批次。爱尔兰威士忌必须在地理标志范围内生产并陈年至少三年；具体酒款的陈年与桶型以标签为准。`,
  },
  {
    file: 'drink/usa-jackdaniels.md',
    title: '杰克丹尼老7号',
    summary: '美国田纳西威士忌，采用林肯县木炭过滤工艺，常见酒精度 40% vol。',
    aliases: ["Jack Daniel's", 'Old No. 7'],
    styles: ['drink-style:whisky'],
    abv: { min: 40, max: 40, unit: 'percent-vol' },
    sources: [
      { key: 'jack-site', title: "Jack Daniel's — Official Site", url: 'https://www.jackdaniels.com/', publisher: "Jack Daniel's", note: '用于核对产地、工艺与产品信息。', accessed: today },
      { key: 'ttb', title: 'TTB Beverage Alcohol Manual — Distilled Spirits', url: 'https://www.ttb.gov/', publisher: 'U.S. Alcohol and Tobacco Tax and Trade Bureau', note: '用于核对田纳西威士忌与波本的标识规则。', accessed: today },
    ],
    body: `杰克丹尼老 7 号是田纳西威士忌，产自美国田纳西州林奇堡。它采用林肯县工艺，将新蒸馏酒经枫木炭过滤后再入新烘烤橡木桶陈年，常见酒精度为 40% vol。

## 风格

木炭过滤带来柔和的入口，香草、焦糖、香蕉和橡木风味明显。它使用新烘烤橡木桶，工艺与波本相近；田纳西威士忌是独立类别，木炭过滤是其标识性步骤。

## 怎么喝

纯饮、加冰或调制可乐桶都很常见。高球能突出香草和木质风味；加冰会降低甜感和酒精刺激。

## 边界

本页只说明品牌与品类，不评价具体批次。具体酒款的陈年时间、桶型和装瓶酒精度，应以瓶身标签与官方信息为准。`,
  },
  {
    file: 'drink/france-hennessyxo.md',
    title: '轩尼诗XO',
    summary: '法国干邑白兰地，由轩尼诗调配百余种生命之水，常见酒精度 40% vol。',
    aliases: ['Hennessy XO', 'Hennessy X.O'],
    styles: ['drink-style:brandy'],
    abv: { min: 40, max: 40, unit: 'percent-vol' },
    sources: [
      { key: 'hennessy-site', title: 'Hennessy — Official Site', url: 'https://www.hennessy.com/', publisher: 'Hennessy', note: '用于核对产品系列、调配与酒精度信息。', accessed: today },
      { key: 'bnic', title: 'BNIC — Cognac Production Rules', url: 'https://www.cognac.fr/en/', publisher: 'Bureau National Interprofessionnel du Cognac', note: '用于核对干邑的产区、蒸馏与陈年等级。', accessed: today },
    ],
    body: `轩尼诗 XO 是干邑白兰地，由轩尼诗酒庄调配超过 100 种生命之水（eaux-de-vie），常见酒精度为 40% vol。XO 在干邑法规中代表最低陈年等级，不是某一固定年份。

## 风格

风味以干果、可可、香料和木质为主，酒体较饱满，回味长。不同批次的调配比例会变化，XO 的核心是风格稳定性，而不是单一年份。

## 怎么喝

纯饮时用郁金香杯，室温或手掌微温即可；加冰会降低香气释放，但适合较高酒精度或较年轻的批次。也可用于 Sidecar 等经典鸡尾酒。

## 边界

本页只说明品牌与品类，不评价具体批次。干邑的等级标示有法定最低陈年要求，具体酒款以瓶身标签与官方信息为准。`,
  },
  {
    file: 'drink/france-domperignon.md',
    title: '唐·培里侬香槟',
    summary: '酩悦香槟旗下的年份香槟品牌，只在特定年份生产，常见酒精度 12.5% vol。',
    aliases: ['Dom Pérignon', 'Dom Perignon'],
    styles: ['drink-style:wine'],
    abv: { min: 12.5, max: 12.5, unit: 'percent-vol' },
    sources: [
      { key: 'dom-site', title: 'Dom Pérignon — Official Site', url: 'https://www.domperignon.com/', publisher: 'Dom Pérignon', note: '用于核对年份香槟、葡萄品种与酿造信息。', accessed: today },
      { key: 'champagne', title: 'Comité Champagne — Champagne Production Rules', url: 'https://www.champagne.fr/', publisher: 'Comité Interprofessionnel du vin de Champagne', note: '用于核对香槟产区的法定工艺与标识。', accessed: today },
    ],
    body: `唐·培里侬是酩悦香槟旗下的年份香槟品牌，只在特定年份生产，以霞多丽和黑皮诺调配，常见酒精度为 12.5% vol。

## 风格

唐·培里侬通常强调酸度、矿物感和陈年带来的烘焙香气。每个年份的混酿比例、除渣时间和酒泥陈年时间会变化；“年份香槟”意味着酒液主要来自标示年份，而不是无年份调配。

## 怎么喝

充分冰镇至约 8–10°C，用郁金香杯或白葡萄酒杯能更好聚集香气。开瓶时避免猛烈摇晃；倒酒后稍等片刻，让气泡和香气稳定。

## 边界

本页只说明品牌与品类，不评价具体年份。香槟的甜度、年份和除渣信息以标签为准；唐·培里侬不是无年份香槟。`,
  },
  {
    file: 'drink/france-chateaulafiterothschild.md',
    title: '拉菲古堡红葡萄酒',
    summary: '法国波尔多波亚克一级庄，以赤霞珠为主的混酿，酒体紧致、陈年潜力长。',
    aliases: ['Château Lafite Rothschild', 'Lafite'],
    styles: ['drink-style:wine'],
    sources: [
      { key: 'lafite-site', title: 'Château Lafite Rothschild — Official Site', url: 'https://www.lafite.com/', publisher: 'Domaines Barons de Rothschild (Lafite)', note: '用于核对酒庄、产区与正牌酒信息。', accessed: today },
      { key: 'oxford-wine', title: 'The Oxford Companion to Wine', publisher: 'Oxford University Press', note: '参考其关于波尔多左岸、波亚克与一级庄的条目。', accessed: today },
    ],
    body: `拉菲古堡位于法国波尔多波亚克产区，是 1855 年分级中的一级庄。正牌酒以赤霞珠为主，混酿梅洛、品丽珠等，酒体通常紧致，陈年潜力长。

## 风格

年轻时常有黑加仑、雪松、铅笔芯和烟草气息，单宁细密；陈年后发展出皮革、菌菇和雪松的复杂香气。不同年份差异很大，不能用一个年份的表现代表酒庄。

## 怎么喝

饮用温度约 16–18°C，年轻酒款可醒酒 1–2 小时，老酒应减少醒酒时间并注意沉淀。适合搭配红肉、野味和硬质奶酪。

## 边界

“拉菲”中文常被泛用，正牌酒标为 Château Lafite Rothschild；副牌和集团其他产品不是同一款酒。具体年份、批次和真伪应以酒标与官方渠道为准。`,
  },
  {
    file: 'drink/france-romaneeconti.md',
    title: '罗曼尼·康帝',
    summary: '法国勃艮第沃恩-罗曼尼村的特级园，由罗曼尼·康帝酒庄拥有，全部种植黑皮诺。',
    aliases: ['Romanée-Conti', 'DRC'],
    styles: ['drink-style:wine'],
    sources: [
      { key: 'oxford-wine', title: 'The Oxford Companion to Wine', publisher: 'Oxford University Press', note: '参考其关于罗曼尼·康帝特级园、黑皮诺与勃艮第分级的条目。', accessed: today },
      { key: 'oiv', title: 'International Organisation of Vine and Wine (OIV)', url: 'https://www.oiv.int/', publisher: 'OIV', note: '用于核对葡萄酒产地与标签的技术口径。', accessed: today },
    ],
    body: `罗曼尼·康帝是法国勃艮第沃恩-罗曼尼村的特级园，由罗曼尼·康帝酒庄（Domaine de la Romanée-Conti，DRC）拥有，全部种植黑皮诺。产量很小，酒体以香气复杂、陈年潜力著称。

## 风格

年轻的罗曼尼·康帝常表现为红色浆果、玫瑰、香料和矿物感，单宁细密；陈年后发展出菌菇、落叶和皮革气息。它的价值不仅来自风味，也来自极低的产量和长期的市场稀缺。

## 怎么喝

饮用温度约 15–17°C，老酒通常不建议长时间醒酒，以免香气过快消散。杯型以勃艮第杯为宜，倒酒量少，便于聚香。

## 边界

“康帝”常被误用作所有 DRC 酒的代称；酒庄还有其他特级园产品。具体酒款、年份和真伪应以酒标、酒庄信息和专业鉴定为准。`,
  },
  {
    file: 'drink/australia-penfolds-grange.md',
    title: '奔富葛兰许',
    summary: '澳大利亚奔富酒庄旗舰酒，由马克斯·舒伯特于 1951 年首创，以设拉子为主的跨产区混酿。',
    aliases: ['Penfolds Grange', 'Grange'],
    styles: ['drink-style:wine'],
    sources: [
      { key: 'penfolds-site', title: 'Penfolds — Grange', url: 'https://www.penfolds.com/', publisher: 'Penfolds', note: '用于核对葛兰许的历史、品种与酿造信息。', accessed: today },
      { key: 'oxford-wine', title: 'The Oxford Companion to Wine', publisher: 'Oxford University Press', note: '参考其关于澳大利亚设拉子与葛兰许的条目。', accessed: today },
    ],
    body: `奔富葛兰许是澳大利亚奔富酒庄的旗舰酒，由马克斯·舒伯特于 1951 年首创，以设拉子为主、常混少量赤霞珠，在美国橡木桶中陈年。

## 风格

葛兰许通常酒体饱满，带有黑莓、黑胡椒、摩卡和雪松气息，单宁厚实，陈年潜力长。它是跨产区混酿，不以单一葡萄园标示；酒标年份是葡萄采收年。

## 怎么喝

饮用温度约 16–18°C，年轻年份可醒酒 1–2 小时，老年份注意沉淀。适合搭配烤牛肉、羊排和硬质奶酪。

## 边界

本页只说明品牌与品类，不评价具体年份。葛兰许的价格和稀缺性不等于每个年份都同样出色；具体酒款以标签与官方信息为准。`,
  },
  {
    file: 'drink/italy-sassicaia.md',
    title: '西施佳雅',
    summary: '意大利托斯卡纳保格利产区的葡萄酒，以赤霞珠和品丽珠为主，是“超级托斯卡纳”代表之一。',
    aliases: ['Sassicaia', 'Tenuta San Guido'],
    styles: ['drink-style:wine'],
    sources: [
      { key: 'sassicaia-site', title: 'Tenuta San Guido — Sassicaia', url: 'https://www.sassicaia.com/', publisher: 'Tenuta San Guido', note: '用于核对酒庄、产区、品种与酿造信息。', accessed: today },
      { key: 'oxford-wine', title: 'The Oxford Companion to Wine', publisher: 'Oxford University Press', note: '参考其关于超级托斯卡纳、保格利与西施佳雅的条目。', accessed: today },
    ],
    body: `西施佳雅是意大利托斯卡纳保格利产区的葡萄酒，由圣圭托酒庄生产，以赤霞珠和品丽珠为主。它是“超级托斯卡纳”的代表之一，拥有自己的 DOC 产区。

## 风格

西施佳雅通常表现为黑加仑、雪松、地中海灌木和矿物感，酒体中等偏饱满，单宁细致。它不使用桑娇维塞作为主要品种，因此不同于传统基安蒂。

## 怎么喝

饮用温度约 16–18°C，年轻年份可醒酒约 1 小时。适合搭配托斯卡纳牛排、烤肉和硬质奶酪。

## 边界

“超级托斯卡纳”是历史形成的市场称呼，不是正式分级。具体酒款的品种比例、年份和产区规则，应以酒标与酒庄信息为准。`,
  },
  {
    file: 'drink/cuba-bacardi-carta-blanca.md',
    title: '百加得白朗姆',
    summary: '以糖蜜为原料的白朗姆酒，经活性炭过滤，常见酒精度 40% vol，适合调制莫吉托和代基里。',
    aliases: ['Bacardi Carta Blanca', 'Bacardi White Rum'],
    styles: ['drink-style:rum'],
    abv: { min: 40, max: 40, unit: 'percent-vol' },
    sources: [
      { key: 'bacardi-site', title: 'Bacardí — Official Site', url: 'https://www.bacardi.com/', publisher: 'Bacardí', note: '用于核对品牌历史、原料与产品信息。', accessed: today },
      { key: 'eu-spirits', title: 'EU Regulation 2019/787 — Rum Definitions', url: 'https://eur-lex.europa.eu/eli/reg/2019/787/oj', publisher: 'European Union', note: '用于核对朗姆酒的定义与最低酒精度。', accessed: today },
    ],
    body: `百加得白朗姆以糖蜜为原料，经发酵、蒸馏和活性炭过滤，常见酒精度为 40% vol。品牌起源于 1862 年的古巴圣地亚哥，现总部位于百慕大。

## 风格

白朗姆通常轻盈、干净，带有甘蔗甜香和轻微香草气息。活性炭过滤会去除部分颜色和较重的风味，使其适合作为鸡尾酒的基酒。

## 怎么喝

莫吉托、代基里、自由古巴都适合用它调制。调酒时注意青柠酸度、糖浆甜度和冰块稀释的平衡；纯饮时可以加冰，但风味较直接。

## 边界

本页只说明品牌与品类，不评价具体产品。具体酒款的原料、陈年时间和是否加糖，应以标签与官方信息为准。`,
  },
  {
    file: 'drink/cuba-havana-club-7-year-old.md',
    title: '哈瓦那俱乐部7年',
    summary: '古巴朗姆酒品牌，以糖蜜蒸馏的朗姆酒调配并陈年，常见酒精度 40% vol。',
    aliases: ['Havana Club 7', 'Havana Club Añejo 7 Años'],
    styles: ['drink-style:rum'],
    abv: { min: 40, max: 40, unit: 'percent-vol' },
    sources: [
      { key: 'havana-site', title: 'Havana Club — Official Site', url: 'https://www.havanaclub.com/', publisher: 'Havana Club', note: '用于核对产品系列、陈年与酒精度信息。', accessed: today },
      { key: 'eu-spirits', title: 'EU Regulation 2019/787 — Rum Definitions', url: 'https://eur-lex.europa.eu/eli/reg/2019/787/oj', publisher: 'European Union', note: '用于核对朗姆酒的定义与类别。', accessed: today },
    ],
    body: `哈瓦那俱乐部 7 年是古巴朗姆酒品牌，由古巴糖蜜蒸馏的朗姆酒调配并陈年，常见酒精度为 40% vol。风味以香草、焦糖、烟草和热带水果为主。

## 风格

它属于较圆润的深色/陈年朗姆，适合纯饮或加冰。酒名中的“7 年”是产品名称中的陈年标示，具体调和原酒的年龄结构与比例由生产者决定，不等于瓶中最年轻酒液一定是 7 年。

## 怎么喝

纯饮时加一块大冰，能降低刺激并缓慢释放香气；也适合调制古巴朗姆风格的鸡尾酒。加可乐会遮盖大部分细节。

## 边界

本页只说明品牌与品类，不评价具体批次。具体酒款的陈年、甜度和产地信息，应以标签与官方渠道为准。`,
  },
  {
    file: 'drink/uk-beefeater.md',
    title: '必富达伦敦干金酒',
    summary: '伦敦干金酒品牌，1863 年创立，以杜松子和柑橘等植物原料蒸馏，常见酒精度 40% vol。',
    aliases: ['Beefeater', 'Beefeater London Dry Gin'],
    styles: ['drink-style:gin'],
    abv: { min: 40, max: 40, unit: 'percent-vol' },
    sources: [
      { key: 'beefeater-site', title: 'Beefeater — Official Site', url: 'https://www.beefeatergin.com/', publisher: 'Beefeater', note: '用于核对品牌历史、植物原料与产品信息。', accessed: today },
      { key: 'gin-guild', title: 'The Gin Guild — Gin Categories', url: 'https://www.theginguild.com/', publisher: 'The Gin Guild', note: '用于核对伦敦干金与蒸馏金酒的类别定义。', accessed: today },
    ],
    body: `必富达是伦敦干金酒品牌，由 James Burrough 于 1863 年创立，以杜松子、柑橘皮、当归等植物原料蒸馏，常见酒精度为 40% vol（部分版本为 47%）。

## 风格

必富达通常表现为杜松子突出、柑橘清新、辛香明显，酒体较干。伦敦干金是工艺类别，不表示必须产自伦敦；它要求在蒸馏过程中加入植物原料，成品不得通过添加香精来制造主要风味。

## 怎么喝

马丁尼、金汤力、内格罗尼都适合。金汤力中汤力水的甜苦会放大或掩盖植物细节，青柠和冰量也会改变平衡。

## 边界

本页只说明品牌与品类，不评价具体批次。具体酒款的植物配方、蒸馏次数和酒精度，应以标签与官方信息为准。`,
  },
  {
    file: 'drink/sweden-absolutvodka.md',
    title: '绝对伏特加',
    summary: '瑞典伏特加品牌，以冬小麦为原料、连续蒸馏，常见酒精度 40% vol。',
    aliases: ['Absolut Vodka', 'Absolut'],
    styles: ['drink-style:vodka'],
    abv: { min: 40, max: 40, unit: 'percent-vol' },
    sources: [
      { key: 'absolut-site', title: 'Absolut — Official Site', url: 'https://www.absolut.com/', publisher: 'Absolut', note: '用于核对原料、产地与产品信息。', accessed: today },
      { key: 'eu-spirits', title: 'EU Regulation 2019/787 — Vodka Definition', url: 'https://eur-lex.europa.eu/eli/reg/2019/787/oj', publisher: 'European Union', note: '用于核对伏特加的定义与最低酒精度。', accessed: today },
    ],
    body: `绝对伏特加以瑞典冬小麦为原料，在 Åhus 生产，采用连续蒸馏，常见酒精度为 40% vol。品牌以纯净、柔和的口感和标志性瓶身闻名。

## 风格

伏特加的风味差异主要来自原料、蒸馏和过滤，不是所有伏特加都完全无味。绝对伏特加通常口感干净、略带谷物甜感，适合作为鸡尾酒基酒。

## 怎么喝

充分冷藏后纯饮，或用于莫斯科骡子、血腥玛丽、伏特加马天尼。由于风味中性，它在调酒中更像结构而非主角，但高酒精度会显著影响成品平衡。

## 边界

本页只说明品牌与品类，不评价具体产品。具体酒款的原料、蒸馏次数和添加物，应以标签与官方信息为准。`,
  },
  {
    file: 'drink/italy-campari.md',
    title: '金巴利',
    summary: '意大利苦味开胃酒，1860 年创立于米兰，酒精度通常 20.5%–25% vol，苦甜平衡。',
    aliases: ['Campari', 'Bitter Campari'],
    styles: ['drink-style:aperitif', 'drink-style:liqueur'],
    sources: [
      { key: 'campari-site', title: 'Campari — Official Site', url: 'https://www.campari.com/', publisher: 'Campari', note: '用于核对品牌历史、产品与酒精度信息。', accessed: today },
      { key: 'iba', title: 'International Bartenders Association — Negroni', url: 'https://iba-world.com/iba-cocktail/negroni/', publisher: 'IBA', note: '用于核对金巴利在内格罗尼中的角色与配方。', accessed: today },
    ],
    body: `金巴利是意大利苦味开胃酒，1860 年由 Gaspare Campari 在米兰创立。它以草本、根茎和柑橘浸提，酒精度通常为 20.5%–25% vol，苦甜平衡。

## 风格

金巴利有明显的苦味、橙皮和草本香气，甜度中等。它是配制酒，不是金酒；内格罗尼中的红色苦味成分通常就是它。不同国家的配方和酒精度可能略有差异。

## 怎么喝

加冰、加苏打水或少量橙片即可作为开胃酒；也用于内格罗尼、美国佬和金巴利苏打。初次尝试可从金巴利苏打开始，降低酒精和苦味强度。

## 边界

本页只说明品牌与品类，不评价具体产品。具体酒款的酒精度、糖分和配方，应以标签与官方信息为准。`,
  },
  {
    file: 'drink/france-chartreuse.md',
    title: '查特酒',
    summary: '法国加尔都西会修士在 Voiron 生产的草本利口酒，绿查特酒精度 55% vol，黄查特 40% vol。',
    aliases: ['Chartreuse', 'Green Chartreuse', 'Yellow Chartreuse'],
    styles: ['drink-style:liqueur'],
    sources: [
      { key: 'chartreuse-site', title: 'Chartreuse — Official Site', url: 'https://www.chartreuse.fr/', publisher: 'Pères Chartreux', note: '用于核对品牌历史、产品与酒精度信息。', accessed: today },
      { key: 'oxford-spirits', title: 'The Oxford Companion to Spirits and Cocktails', publisher: 'Oxford University Press', note: '参考其关于查特酒、修道院利口酒与调酒应用的条目。', accessed: today },
    ],
    body: `查特酒是法国加尔都西会修士在 Voiron 生产的草本利口酒，配方含 130 种植物，绿查特酒精度为 55% vol，黄查特为 40% vol。

## 风格

绿查特酒精度更高、风味更强烈，带有明显的草本、茴香和薄荷感；黄查特更甜、更柔和。它是利口酒，不是药；“修士配方”属于品牌历史叙事，具体配方并未公开。

## 怎么喝

可以纯饮、加冰，也常用于 Last Word、Champs-Élysées 等经典鸡尾酒。由于风味强烈，调酒时用量通常较小。

## 边界

本页只说明品牌与品类，不评价具体产品。查特酒的生产地点和配方属于品牌专有信息；具体酒款的酒精度与标签以官方信息为准。`,
  },
  {
    file: 'drink/ireland-guinnessdraughtstout.md',
    title: '健力士世涛啤酒',
    summary: '爱尔兰都柏林圣詹姆斯门啤酒厂生产的干世涛，代表产品酒精度约 4.2% vol。',
    aliases: ['Guinness Draught', 'Guinness Stout'],
    styles: ['drink-style:beer'],
    abv: { min: 4.2, max: 4.2, unit: 'percent-vol' },
    sources: [
      { key: 'guinness-site', title: 'Guinness — Official Site', url: 'https://www.guinness.com/', publisher: 'Guinness', note: '用于核对品牌历史、产品与酒精度信息。', accessed: today },
      { key: 'oxford-beer', title: 'The Oxford Companion to Beer', publisher: 'Oxford University Press', note: '参考其关于世涛、爱尔兰啤酒与氮气啤酒的条目。', accessed: today },
    ],
    body: `健力士是爱尔兰都柏林圣詹姆斯门啤酒厂生产的干世涛，代表产品 Guinness Draught 酒精度约 4.2% vol。它以烘焙大麦带来咖啡、可可般的深色和苦味，氮气版本口感更绵密。

## 风格

世涛不是“黑啤”的同义词，颜色深不代表酒体一定厚重。健力士 Draught 酒体中等偏轻，苦味来自烘焙大麦，氮气充填形成细密泡沫和顺滑口感。

## 怎么喝

适合在约 6–8°C 饮用，使用直身品脱杯；氮气版本倒酒后有明显的泡沫沉降过程。搭配牡蛎、炖肉和爱尔兰面包较合适。

## 边界

本页只说明品牌与品类，不评价具体产品。不同包装（罐装、瓶装、生啤）的氮气工艺和口感不同，具体以标签与官方信息为准。`,
  },
  {
    file: 'drink/czech-pilsnerurquell.md',
    title: '皮尔森之源',
    summary: '捷克皮尔森市的淡色拉格啤酒，1842 年首次酿造，酒精度约 4.4% vol。',
    aliases: ['Pilsner Urquell', 'Plzeňský Prazdroj'],
    styles: ['drink-style:beer'],
    abv: { min: 4.4, max: 4.4, unit: 'percent-vol' },
    sources: [
      { key: 'pilsner-site', title: 'Pilsner Urquell — Official Site', url: 'https://www.pilsnerurquell.com/', publisher: 'Plzeňský Prazdroj', note: '用于核对品牌历史、原料与酿造信息。', accessed: today },
      { key: 'bjcp', title: 'BJCP 2021 Beer Style Guidelines — Czech Pale Lager', url: 'https://www.bjcp.org/style/2021/beer/', publisher: 'Beer Judge Certification Program', note: '用于核对捷克淡色拉格的风格描述。', accessed: today },
    ],
    body: `皮尔森之源产自捷克皮尔森市，1842 年首次酿造，是淡色拉格啤酒的原型之一。使用当地软水、萨兹酒花、三重煮出糖化和开放式发酵，酒精度约 4.4% vol。

## 风格

皮尔森之源通常表现为麦芽甜香、萨兹酒花的草本与辛香，苦味清晰但平衡，收口干净。它是淡色拉格，不是重酒体或高苦度的 IPA。

## 怎么喝

冷藏至约 6–8°C，使用洁净的玻璃杯。捷克常见的倒酒方式会产生不同厚度的泡沫，影响香气和口感；在家中不必追求复杂仪式。

## 边界

“Pilsner”已成为风格名，但只有皮尔森之源等特定产品拥有原产地标识。具体酒款的原料、原麦汁浓度和酒精度，应以标签与官方信息为准。`,
  },
];

function readFront(file) {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`No frontmatter: ${file}`);
  return YAML.parse(match[1]);
}

const results = [];
for (const entry of entries) {
  const file = path.join(root, 'content-repositories', 'alcoholic-beverages', 'zh', entry.file);
  if (!fs.existsSync(file)) throw new Error(`Missing kept file: ${file}`);
  const old = readFront(file);
  const isBrand = old.type === 'brand';
  const front = {
    schema_version: 1,
    id: old.id,
    type: old.type,
    lang: 'zh',
    slug: old.slug,
    title: entry.title,
    summary: entry.summary,
    status: 'reviewed',
    revision: (old.revision ?? 1) + 1,
  };
  if (isBrand) {
    front.producer_refs = old.producer_refs ?? [];
    front.region_refs = old.region_refs ?? [];
    front.official_url = entry.officialUrl ?? old.official_url ?? null;
    front.founded_year = old.founded_year ?? null;
  } else {
    front.style_refs = entry.styles ?? [];
    front.brand_refs = old.brand_refs ?? [];
    front.producer_refs = old.producer_refs ?? [];
    front.region_refs = old.region_refs ?? [];
    front.ingredient_refs = old.ingredient_refs ?? [];
    front.process_refs = old.process_refs ?? [];
  }
  front.legacy_refs = old.legacy_refs ?? [];
  front.aliases = entry.aliases ?? [];
  front.tags = ['curated', 'source-verified'];
  front.related = [];
  front.references = isBrand && old.references?.length ? old.references.filter((ref) => ['producer:gujing-distillery', 'region:bozhou'].includes(ref.target_id)) : [];
  front.sources = entry.sources;
  front.rights = commonRights;
  front.verification_scope = 'source-verified';
  if (entry.abv) front.abv = entry.abv;

  const refs = entry.sources
    .map((source) => `- ${source.title}${source.url ? ` — ${source.url}` : ''}（${source.publisher}）`)
    .join('\n');
  const body = `---\n${YAML.stringify(front, { lineWidth: 0 })}---\n\n# ${entry.title}\n\n${entry.body}\n\n## 参考资料\n\n${refs}\n`;
  if (apply) fs.writeFileSync(file, body);
  results.push({ id: old.id, file: entry.file });
}

console.log(JSON.stringify({ apply, rewritten: results.length, ids: results.map((r) => r.id) }, null, 2));
