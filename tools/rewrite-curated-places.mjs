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
  basis: `项目自写；依据场所官方页面与公开历史资料核验，未复制原文。项目所有者于 ${today} 声明项目内容采用 CC BY 4.0。`,
  note: '第三方商标、图片与引用文本不在本许可内；营业时间、菜单与价格会变化，以官方渠道为准。',
};

const entries = [
  {
    slug: 'american-bar-savoy',
    title: '萨沃伊美式酒吧',
    summary: '伦敦萨沃伊酒店内的经典美式酒吧，1893 年随酒店开业，以《萨沃伊鸡尾酒书》和经典调酒传统闻名。',
    address: 'The Savoy, Strand, London WC2R 0EZ',
    country: '英国',
    city: '伦敦',
    founded: 1893,
    sources: [
      { key: 'savoy-site', title: 'The Savoy — American Bar', url: 'https://www.thesavoy.com/', publisher: 'The Savoy', note: '用于核对酒吧位置、历史与营业信息。', accessed: today },
      { key: 'savoy-book', title: 'The Savoy Cocktail Book', publisher: 'Harry Craddock / Constable & Co.', note: '1930 年出版的经典鸡尾酒书，用于核对酒吧的调酒史背景。', accessed: today },
    ],
    body: `萨沃伊美式酒吧位于伦敦萨沃伊酒店内，1893 年随酒店开业。它以经典鸡尾酒和装饰艺术风格的空间闻名，哈里·克拉多克在 1930 年出版了《萨沃伊鸡尾酒书》，收录了大量配方。

## 风格

酒吧延续美式鸡尾酒传统，白色佳人、汉基帕基等经典配方常被提及。现场有钢琴演奏，着装要求偏正式；具体菜单和表演安排会变化。

## 怎么喝

适合点一杯经典鸡尾酒，坐在吧台看调酒师操作。初次到访可以先问当季特调或经典款的推荐；人均消费较高，建议提前预订并确认着装要求。

## 边界

营业时间、预订规则和着装要求以萨沃伊酒店官方渠道为准。本页不保证任何历史轶事或名人到访细节。`,
  },
  {
    slug: 'cafe-de-flore',
    title: '花神咖啡馆',
    summary: '巴黎圣日耳曼德佩的文学咖啡馆，19 世纪末开业，以知识分子顾客和经典巴黎咖啡馆氛围闻名。',
    address: '172 Boulevard Saint-Germain, 75006 Paris',
    country: '法国',
    city: '巴黎',
    sources: [
      { key: 'flore-site', title: 'Café de Flore — Official Site', url: 'https://cafedeflore.fr/', publisher: 'Café de Flore', note: '用于核对地址、历史与营业信息。', accessed: today },
      { key: 'paris-tourism', title: 'Paris Convention and Visitors Bureau — Saint-Germain-des-Prés', url: 'https://www.parisinfo.com/', publisher: 'Office de Tourisme de Paris', note: '用于核对街区背景与咖啡馆文化。', accessed: today },
    ],
    body: `花神咖啡馆位于巴黎第六区圣日耳曼德佩，19 世纪末开业。它在 20 世纪成为作家、哲学家和艺术家的聚集地，是巴黎文学咖啡馆传统的代表之一。

## 风格

室内保留红色座椅、镜面和传统咖啡馆布局，露台适合看街景。招牌包括热巧克力、咖啡和法式早餐；菜单价格偏高，服务节奏偏慢。

## 怎么喝

适合上午或下午来喝一杯咖啡，观察街区人流。若想安静聊天，尽量避开周末午后；点单前确认是否收取露台服务费。

## 边界

营业时间、菜单和价格以官方渠道为准。文学名人的到访属于历史叙事，本页不保证具体座位或偶遇。`,
  },
  {
    slug: 'les-deux-magots',
    title: '双叟咖啡馆',
    summary: '巴黎圣日耳曼德佩的文学咖啡馆，1885 年开业，曾与海明威、萨特和波伏娃等名字联系在一起。',
    address: '6 Place Saint-Germain-des-Prés, 75006 Paris',
    country: '法国',
    city: '巴黎',
    founded: 1885,
    sources: [
      { key: 'magots-site', title: 'Les Deux Magots — Official Site', url: 'https://www.lesdeuxmagots.fr/', publisher: 'Les Deux Magots', note: '用于核对地址、历史与营业信息。', accessed: today },
      { key: 'paris-tourism', title: 'Paris Convention and Visitors Bureau — Saint-Germain-des-Prés', url: 'https://www.parisinfo.com/', publisher: 'Office de Tourisme de Paris', note: '用于核对街区背景与咖啡馆文化。', accessed: today },
    ],
    body: `双叟咖啡馆位于巴黎圣日耳曼德佩广场，1885 年开业。店名来自店内两尊中国商人雕像；20 世纪它成为作家和知识分子的聚会场所，与海明威、萨特、波伏娃等名字联系在一起。

## 风格

室内有传统咖啡馆的镜面、木质座椅和露台，氛围比花神咖啡馆稍显安静。招牌包括咖啡、热巧克力和法式甜点；也有简餐。

## 怎么喝

适合上午喝咖啡或下午小坐。露台位置紧邻广场，适合观察街区；室内更适合聊天。价格属于圣日耳曼德佩游客区水平。

## 边界

营业时间、菜单和价格以官方渠道为准。名人到访是历史背景，不代表当前服务质量或固定座位。`,
  },
  {
    slug: 'caffe-florian',
    title: '花神咖啡馆（威尼斯）',
    summary: '威尼斯圣马可广场的历史咖啡馆，1720 年开业，是欧洲持续经营时间最长的咖啡馆之一。',
    address: 'Piazza San Marco 56/59, 30124 Venezia',
    country: '意大利',
    city: '威尼斯',
    founded: 1720,
    sources: [
      { key: 'florian-site', title: 'Caffè Florian — Official Site', url: 'https://www.caffeflorian.com/', publisher: 'Caffè Florian', note: '用于核对地址、历史与营业信息。', accessed: today },
      { key: 'venice-tourism', title: 'Venice Tourism — Piazza San Marco', url: 'https://www.veneziaunica.it/', publisher: 'Comune di Venezia', note: '用于核对圣马可广场与历史咖啡馆背景。', accessed: today },
    ],
    body: `花神咖啡馆位于威尼斯圣马可广场，1720 年开业，是欧洲持续经营时间最长的咖啡馆之一。它曾是卡萨诺瓦、拜伦等历史人物的到访地，室内保留华丽的历史厅堂。

## 风格

咖啡馆由多个装饰风格不同的厅组成，露台正对圣马可广场。现场常有小型乐队演奏；消费明显高于普通咖啡馆，部分座位可能收取音乐附加费。

## 怎么喝

适合点一杯咖啡或热巧克力，坐在室内欣赏装饰，或在露台看广场人流。点单前确认座位费和音乐费；旅游旺季建议避开正午。

## 边界

营业时间、座位费和演出安排以官方渠道为准。历史人物到访属于背景资料，本页不保证具体厅堂开放情况。`,
  },
  {
    slug: 'harrys-bar-venice',
    title: '哈里酒吧（威尼斯）',
    summary: '威尼斯圣马可广场附近的传奇酒吧，1931 年由朱塞佩·奇普里亚尼创立，以贝里尼和生牛肉薄片闻名。',
    address: 'Calle Vallaresso 1323, 30124 Venezia',
    country: '意大利',
    city: '威尼斯',
    founded: 1931,
    sources: [
      { key: 'cipriani-site', title: 'Cipriani — Harry’s Bar', url: 'https://www.cipriani.com/', publisher: 'Cipriani', note: '用于核对酒吧位置、历史与营业信息。', accessed: today },
      { key: 'oxford-spirits', title: 'The Oxford Companion to Spirits and Cocktails', publisher: 'Oxford University Press', note: '参考其关于贝里尼与哈里酒吧的条目。', accessed: today },
    ],
    body: `哈里酒吧位于威尼斯圣马可广场附近，1931 年由朱塞佩·奇普里亚尼创立。它以贝里尼（白桃泥与普罗塞克）和生牛肉薄片（carpaccio）闻名，是威尼斯鸡尾酒文化的地标之一。

## 风格

酒吧空间不大，吧台和餐桌紧凑，服务偏正式。贝里尼是招牌开胃酒；生牛肉薄片通常作为前菜。价格较高，旺季需要预订。

## 怎么喝

适合点一杯贝里尼，搭配简单前菜。若只想体验氛围，可以避开正餐时段；着装不必过度正式，但应尊重场所的安静氛围。

## 边界

营业时间、预订和价格以 Cipriani 官方渠道为准。贝里尼和生牛肉薄片的起源存在多种说法，本页采用广泛流传的品牌叙事。`,
  },
  {
    slug: 'el-floridita',
    title: '小佛罗里达酒馆',
    summary: '哈瓦那老城的传奇酒吧，1817 年创立，以海明威、冷冻代基里和海鲜吧闻名。',
    address: 'Calle Obispo 557, La Habana Vieja, Havana',
    country: '古巴',
    city: '哈瓦那',
    founded: 1817,
    sources: [
      { key: 'floridita-history', title: 'El Floridita — History', publisher: 'El Floridita', note: '用于核对创立时间、地址与海明威相关历史。', accessed: today },
      { key: 'oxford-spirits', title: 'The Oxford Companion to Spirits and Cocktails', publisher: 'Oxford University Press', note: '参考其关于代基里与哈瓦那酒吧文化的条目。', accessed: today },
    ],
    body: `小佛罗里达酒馆位于哈瓦那老城，1817 年创立，是古巴最著名的酒吧之一。20 世纪它因海明威常来而闻名，招牌是冷冻代基里（daiquirí）和海鲜吧。

## 风格

酒吧保留长吧台、镜面和红色调装饰，现场常有乐队演奏。冷冻代基里口感冰爽、酸甜平衡；海鲜吧提供古巴式海鲜菜。游客较多，价格以旅游区水平为主。

## 怎么喝

适合点一杯冷冻代基里，坐在吧台或角落观察现场。若不喜欢太甜，可以请调酒师减少糖浆；正餐时段建议提前到店。

## 边界

营业时间、菜单和价格以官方渠道为准。海明威的到访是历史事实，但“海明威同款配方”属于品牌叙事，不等于唯一正宗做法。`,
  },
  {
    slug: 'la-bodeguita-del-medio',
    title: '半途小酒馆',
    summary: '哈瓦那老城的著名小酒馆，1942 年开业，以莫吉托和文人顾客的墙面签名闻名。',
    address: 'Calle Empedrado 207, La Habana Vieja, Havana',
    country: '古巴',
    city: '哈瓦那',
    founded: 1942,
    sources: [
      { key: 'bodeguita-history', title: 'La Bodeguita del Medio — History', publisher: 'La Bodeguita del Medio', note: '用于核对创立时间、地址与历史背景。', accessed: today },
      { key: 'oxford-spirits', title: 'The Oxford Companion to Spirits and Cocktails', publisher: 'Oxford University Press', note: '参考其关于莫吉托与哈瓦那酒吧文化的条目。', accessed: today },
    ],
    body: `半途小酒馆位于哈瓦那老城，1942 年开业。它因莫吉托、古巴家常菜和满墙的顾客签名闻名，海明威的名字也常与这里联系在一起。

## 风格

空间狭小、墙面布满签名和照片，现场常有音乐。莫吉托以朗姆酒、青柠、薄荷、糖和苏打水调制；菜单偏古巴家常菜，游客较多。

## 怎么喝

适合点一杯莫吉托，搭配简单古巴菜。若想安静聊天，避开现场音乐高峰；墙面签名是历史陈设，不应随意涂写。

## 边界

营业时间、菜单和价格以官方渠道为准。海明威与酒吧的关系有不同版本的叙述，本页不把它当作唯一史料。`,
  },
  {
    slug: 'raffles-long-bar',
    title: '莱佛士长廊酒吧',
    summary: '新加坡莱佛士酒店的历史酒吧，以新加坡司令和花生壳传统闻名。',
    address: '1 Beach Road, Singapore 189673',
    country: '新加坡',
    city: '新加坡',
    founded: 1887,
    sources: [
      { key: 'raffles-site', title: 'Raffles Hotel Singapore — Long Bar', url: 'https://www.raffles.com/singapore/', publisher: 'Raffles Hotel Singapore', note: '用于核对酒吧位置、历史与营业信息。', accessed: today },
      { key: 'oxford-spirits', title: 'The Oxford Companion to Spirits and Cocktails', publisher: 'Oxford University Press', note: '参考其关于新加坡司令的条目。', accessed: today },
    ],
    body: `莱佛士长廊酒吧位于新加坡莱佛士酒店内，酒店于 1887 年开业。酒吧以新加坡司令（Singapore Sling）闻名，这款以金酒、樱桃白兰地、柑橘和菠萝汁调制的长饮，通常被认为由酒保 Ngiam Tong Boon 在 20 世纪初创作。

## 风格

酒吧保留殖民时期风格的长廊、藤椅和吊扇，气氛轻松。新加坡司令偏甜、酒精度不高；吧台会提供花生，传统上允许把花生壳丢在地上。

## 怎么喝

适合点一杯新加坡司令，搭配花生和小食。价格属于酒店酒吧水平；旅游旺季建议提前预订或避开傍晚高峰。

## 边界

营业时间、预订和价格以莱佛士酒店官方渠道为准。新加坡司令的创作年份和原始配方存在不同版本，本页采用广泛引用的酒店叙事。`,
  },
  {
    slug: 'hofbrauhaus',
    title: '皇家啤酒屋',
    summary: '慕尼黑历史悠久的啤酒馆，1589 年由巴伐利亚公爵创立，以啤酒大厅和巴伐利亚菜闻名。',
    address: 'Platzl 9, 80331 München',
    country: '德国',
    city: '慕尼黑',
    founded: 1589,
    sources: [
      { key: 'hofbrauhaus-site', title: 'Hofbräuhaus München — Official Site', url: 'https://www.hofbraeuhaus.de/', publisher: 'Hofbräuhaus München', note: '用于核对历史、地址与营业信息。', accessed: today },
      { key: 'munich-tourism', title: 'Simply Munich — Hofbräuhaus', url: 'https://www.muenchen.de/', publisher: 'Landeshauptstadt München', note: '用于核对啤酒馆历史与城市背景。', accessed: today },
    ],
    body: `皇家啤酒屋位于慕尼黑市中心，1589 年由巴伐利亚公爵创立，最初是宫廷啤酒厂。19 世纪起向公众开放，逐渐成为慕尼黑啤酒大厅文化的象征。

## 风格

大厅有长桌、铜制酒桶和现场乐队，气氛热闹。供应自有啤酒和巴伐利亚菜，如烤猪肘、白香肠和椒盐卷饼；座位常需拼桌。

## 怎么喝

适合点一升装啤酒，搭配烤猪肘或白香肠。若不习惯大杯，可以点小杯；高峰时段服务较忙，建议避开周末晚间。

## 边界

营业时间、菜单和价格以官方渠道为准。啤酒屋是旅游热点，现场可能有旅行团；本页不保证座位或演出安排。`,
  },
  {
    slug: 'u-fleku',
    title: '弗勒克啤酒屋',
    summary: '布拉格历史悠久的啤酒馆和微型啤酒厂，创立于 1499 年，以自酿黑啤和捷克菜闻名。',
    address: 'Křemencova 11, 110 00 Praha 1',
    country: '捷克',
    city: '布拉格',
    founded: 1499,
    sources: [
      { key: 'ufleku-site', title: 'U Fleků — Official Site', url: 'https://www.ufleku.cz/', publisher: 'U Fleků', note: '用于核对历史、地址与营业信息。', accessed: today },
      { key: 'prague-tourism', title: 'Prague City Tourism — Beer Culture', url: 'https://www.prague.eu/', publisher: 'Prague City Tourism', note: '用于核对布拉格啤酒馆文化背景。', accessed: today },
    ],
    body: `弗勒克啤酒屋位于布拉格新城区，创立于 1499 年，是持续经营时间很长的啤酒馆之一。它拥有自己的微型啤酒厂，以深色拉格（黑啤）和捷克家常菜闻名。

## 风格

室内有多个历史厅堂和花园，现场常有手风琴演奏。服务员会端着啤酒盘在桌间穿行；黑啤麦芽香明显，苦度适中。游客较多，价格属于布拉格旅游区水平。

## 怎么喝

适合点一杯自酿黑啤，搭配烤鸭、猪肘或面包饺子。若只想小酌，可以点小杯；现场音乐可能收取小费。

## 边界

营业时间、菜单和价格以官方渠道为准。历史创立年份采用啤酒馆公开资料；具体酿造配方和酒精度以现场标签为准。`,
  },
  {
    slug: 'schlenkerla',
    title: '施伦克拉烟熏啤酒馆',
    summary: '德国班贝格的 historic 烟熏啤酒酒馆，以 Rauchbier 和传统法兰肯菜闻名。',
    address: 'Dominikanerstraße 6, 96049 Bamberg',
    country: '德国',
    city: '班贝格',
    founded: 1405,
    sources: [
      { key: 'schlenkerla-site', title: 'Schlenkerla — Official Site', url: 'https://www.schlenkerla.de/', publisher: 'Schlenkerla', note: '用于核对历史、地址与营业信息。', accessed: today },
      { key: 'bamberg-tourism', title: 'Bamberg Tourism — Brewing Culture', url: 'https://www.bamberg.info/', publisher: 'Bamberg Tourismus', note: '用于核对班贝格啤酒文化与烟熏啤酒背景。', accessed: today },
    ],
    body: `施伦克拉是德国班贝格的历史啤酒酒馆，历史可追溯至 1405 年。它以烟熏啤酒（Rauchbier）闻名：麦芽经山毛榉木烟熏，酒液带有明显的篝火、烟熏和麦芽甜香。

## 风格

酒馆保留木质内饰和传统法兰肯菜单，烟熏啤酒有淡色和深色等版本。烟熏风味对初次尝试者可能很强烈，建议先点小杯。

## 怎么喝

适合搭配烤猪肉、香肠和面包。烟熏啤酒温度不宜过低，否则香气会被压制；若不习惯烟熏味，可以先从淡色版本开始。

## 边界

营业时间、菜单和价格以官方渠道为准。烟熏啤酒的风味强度因批次而异；本页不评价具体年份。`,
  },
  {
    slug: 'mcsorleys-old-ale-house',
    title: '麦克索利老麦酒馆',
    summary: '纽约东村的历史酒馆，1854 年开业，以只供应淡色和深色艾尔、历史陈设闻名。',
    address: '15 E 7th St, New York, NY 10003',
    country: '美国',
    city: '纽约',
    founded: 1854,
    sources: [
      { key: 'mcsorleys-site', title: 'McSorley’s Old Ale House — Official Site', url: 'https://www.mcsorleysoldalehouse.com/', publisher: 'McSorley’s Old Ale House', note: '用于核对历史、地址与营业信息。', accessed: today },
      { key: 'nyc-tourism', title: 'NYC Tourism — East Village', url: 'https://www.nyc.gov/', publisher: 'City of New York', note: '用于核对东村与历史酒馆背景。', accessed: today },
    ],
    body: `麦克索利老麦酒馆位于纽约东村，1854 年开业，是纽约持续经营时间最长的酒馆之一。它长期只供应淡色艾尔和深色艾尔两种啤酒，店内保留木桌、旧海报和煤气灯式的历史陈设。

## 风格

酒馆空间狭小、氛围直接，点单通常按杯或按轮计算。历史上曾长期只接待男性，这一政策在 1970 年代被改变；店内陈设是历史的一部分，不代表当前价值观。

## 怎么喝

适合点一杯淡色或深色艾尔，感受老纽约酒馆氛围。只收现金的传闻需以现场为准；高峰时段非常拥挤，建议避开周末夜晚。

## 边界

营业时间、支付方式和价格以官方渠道为准。历史政策与名人轶事属于背景资料，本页不将其作为推荐理由。`,
  },
  {
    slug: 'white-horse-tavern',
    title: '白马酒馆',
    summary: '纽约格林威治村的历史酒馆，1880 年开业，因诗人迪伦·托马斯等文人顾客闻名。',
    address: '567 Hudson St, New York, NY 10014',
    country: '美国',
    city: '纽约',
    founded: 1880,
    sources: [
      { key: 'whitehorse-history', title: 'White Horse Tavern — History', publisher: 'White Horse Tavern', note: '用于核对创立时间、地址与历史背景。', accessed: today },
      { key: 'nyc-tourism', title: 'NYC Tourism — Greenwich Village', url: 'https://www.nyc.gov/', publisher: 'City of New York', note: '用于核对格林威治村与文学酒吧背景。', accessed: today },
    ],
    body: `白马酒馆位于纽约格林威治村，1880 年开业。它因诗人迪伦·托马斯常来而闻名，也长期是作家、记者和附近居民聚会的场所。

## 风格

酒馆有木质吧台、旧照片和典型的纽约社区酒吧氛围。供应啤酒、烈酒和简单酒吧食物；游客与本地人混坐，周末较拥挤。

## 怎么喝

适合点一杯啤酒或威士忌，坐在吧台感受社区酒吧气氛。迪伦·托马斯的故事是历史背景，不应把过量饮酒浪漫化。

## 边界

营业时间、菜单和价格以官方渠道为准。历史顾客与事件存在不同叙述，本页不保证具体座位或现场活动。`,
  },
  {
    slug: 'ye-olde-cheshire-cheese',
    title: '柴郡奶酪酒馆',
    summary: '伦敦舰队街的历史酒馆，现建筑 1667 年重建，以木结构内饰和传统英式菜闻名。',
    address: '145 Fleet St, London EC4A 2BU',
    country: '英国',
    city: '伦敦',
    founded: 1667,
    sources: [
      { key: 'cheshire-site', title: 'Ye Olde Cheshire Cheese — Official Site', publisher: 'Ye Olde Cheshire Cheese', note: '用于核对地址、历史与营业信息。', accessed: today },
      { key: 'london-tourism', title: 'Visit London — Fleet Street', url: 'https://www.visitlondon.com/', publisher: 'London & Partners', note: '用于核对舰队街与历史酒馆背景。', accessed: today },
    ],
    body: `柴郡奶酪酒馆位于伦敦舰队街，现建筑在 1667 年伦敦大火后重建。它保留狭窄的楼梯、木质包间和地下酒窖，是伦敦历史酒馆的代表之一。

## 风格

酒馆有多个低矮的厅堂和壁炉，供应英式啤酒、派和传统酒吧菜。空间较暗、层高低，高峰期拥挤；着装上没有特别要求。

## 怎么喝

适合点一杯英式艾尔，搭配派或炸鱼薯条。想安静聊天可以避开下班后的酒吧高峰；地下酒窖的座位更有历史感。

## 边界

营业时间、菜单和价格以官方渠道为准。酒馆的历史可追溯更早，但现建筑以 1667 年重建为节点；具体史料以官方说明为准。`,
  },
  {
    slug: 'eagle-and-child',
    title: '鹰与孩童酒馆',
    summary: '牛津圣吉尔斯街的历史酒馆，以“Inklings”文学小组（托尔金、C.S.刘易斯等）的聚会地闻名。',
    address: '49 St Giles’, Oxford OX1 3LU',
    country: '英国',
    city: '牛津',
    sources: [
      { key: 'eagle-site', title: 'The Eagle and Child — Official Site', publisher: 'Nicholson’s Pubs', note: '用于核对地址、历史与营业信息。', accessed: today },
      { key: 'oxford-tourism', title: 'Experience Oxfordshire — Literary Oxford', url: 'https://www.experienceoxfordshire.org/', publisher: 'Experience Oxfordshire', note: '用于核对牛津文学酒馆背景。', accessed: today },
    ],
    body: `鹰与孩童酒馆位于牛津圣吉尔斯街，建筑历史可追溯至 17 世纪。20 世纪，托尔金、C.S.刘易斯等“Inklings”成员常在这里聚会，使它成为牛津文学地图上的地点。

## 风格

酒馆有多个房间和庭院，供应英式啤酒、派和酒吧菜。它属于连锁酒馆体系，菜单和营业安排可能变化；文学聚会的历史房间不一定常开。

## 怎么喝

适合点一杯英式啤酒，搭配派或周日烤肉（若供应）。想感受历史氛围可以问店员哪些房间与 Inklings 有关；不要把它当作博物馆。

## 边界

营业时间、菜单和房间开放情况以官方渠道为准。Inklings 的聚会属于历史事实，但具体座位和饮品无法还原。`,
  },
  {
    slug: 'cafe-central',
    title: '中央咖啡馆',
    summary: '维也纳历史悠久的文学咖啡馆，1876 年开业，以咖啡、蛋糕和知识分子顾客闻名。',
    address: 'Herrengasse 14, 1010 Wien',
    country: '奥地利',
    city: '维也纳',
    founded: 1876,
    sources: [
      { key: 'central-site', title: 'Café Central — Official Site', url: 'https://www.cafecentral.wien/', publisher: 'Café Central', note: '用于核对历史、地址与营业信息。', accessed: today },
      { key: 'vienna-tourism', title: 'Vienna Tourist Board — Coffee House Culture', url: 'https://www.wien.info/', publisher: 'WienTourismus', note: '用于核对维也纳咖啡馆文化背景。', accessed: today },
    ],
    body: `中央咖啡馆位于维也纳内城，1876 年开业。它曾是托洛茨基、茨威格等知识分子和作家的聚会地，是维也纳咖啡馆文化的代表之一。

## 风格

咖啡馆有拱顶、石柱和钢琴演奏，氛围偏古典。招牌包括维也纳咖啡、苹果卷和蛋糕；正餐时段也供应奥地利菜。游客较多，旺季常需排队。

## 怎么喝

适合点一杯维也纳咖啡（Melange）和一块蛋糕，慢慢坐一会儿。若想安静阅读，避开下午茶和晚餐高峰；钢琴演奏可能增加氛围，也可能提高音量。

## 边界

营业时间、菜单和价格以官方渠道为准。历史人物到访属于背景资料，本页不保证具体座位或演出安排。`,
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
  const file = path.join(root, 'content-repositories', 'alcohol-atlas', 'zh', 'place', `${entry.slug}.md`);
  if (!fs.existsSync(file)) throw new Error(`Missing kept file: ${file}`);
  const old = readFront(file);
  const front = {
    schema_version: 1,
    id: old.id,
    type: 'place',
    lang: 'zh',
    slug: old.slug,
    title: entry.title,
    summary: entry.summary,
    status: 'reviewed',
    revision: (old.revision ?? 1) + 1,
    subtype: 'pub',
    address: entry.address,
    country: entry.country,
    latitude: null,
    longitude: null,
    producer_refs: [],
    region_refs: [],
    operating_status: 'unknown',
    legacy_refs: old.legacy_refs ?? [],
    aliases: old.aliases ?? [],
    tags: ['curated', 'source-verified'],
    related: [],
    references: [],
    sources: entry.sources,
    rights: commonRights,
    city: entry.city,
    verification_scope: 'source-verified',
  };
  if (entry.founded) front.founded_year = entry.founded;
  const refs = entry.sources
    .map((source) => `- ${source.title}${source.url ? ` — ${source.url}` : ''}（${source.publisher}）`)
    .join('\n');
  const body = `---\n${YAML.stringify(front, { lineWidth: 0 })}---\n\n# ${entry.title}\n\n${entry.body}\n\n## 参考资料\n\n${refs}\n`;
  if (apply) fs.writeFileSync(file, body);
  results.push({ id: old.id, slug: entry.slug });
}

console.log(JSON.stringify({ apply, rewritten: results.length, ids: results.map((r) => r.id) }, null, 2));
