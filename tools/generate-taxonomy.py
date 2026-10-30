import collections
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEJIU = os.path.dirname(ROOT)
BASELINE = os.path.join(HEJIU, "docs", "audit", "source-baseline.json")
BASE = os.path.join(ROOT, "content-repositories", "alcoholic-beverages")
GUIDE = os.path.join(ROOT, "content-repositories", "alcohol-guide")

base = json.load(open(BASELINE, encoding="utf-8"))
refs = base["diagnostics"]["unregisteredTagReferences"]
counts = collections.Counter(x["tag"] for x in refs)

meanings = {
    "aksum": ("阿克苏姆（古阿克苏姆王国所在地）", "origin"),
    "alpine_herbs": ("阿尔卑斯草本", "flavor"),
    "amaro": ("苦味利口酒类别", "style"),
    "ancient_african": ("古非洲酿酒传统", "origin"),
    "andes": ("安第斯地区", "origin"),
    "arctic": ("北极地区", "origin"),
    "arrack": ("亚力酒/椰花酒类蒸馏酒", "style"),
    "assyrtiko": ("阿斯提可葡萄品种", "ingredient"),
    "aztec": ("阿兹特克文化", "culture"),
    "barrel_aged": ("桶陈", "process"),
    "buffalo_trace": ("水牛足迹（品牌）", "brand"),
    "cape_dutch": ("开普荷兰（南非建筑/文化风格）", "origin"),
    "cashew": ("腰果", "ingredient"),
    "citrus": ("柑橘", "flavor"),
    "cloudberry": ("云莓", "ingredient"),
    "coca": ("古柯/可口可乐相关（旧标签，需逐条确认）", "ingredient"),
    "czech_national": ("捷克国民品牌/传统", "marketing"),
    "digestif": ("餐后酒", "occasion"),
    "eau_de_vie": ("生命之水/水果蒸馏酒", "style"),
    "family": ("家族经营", "producer"),
    "fernandito": ("Fernandito（Fernet加可乐的饮用方式）", "cocktail"),
    "fernet": ("菲奈特苦酒类别", "style"),
    "fondue": ("奶酪火锅", "pairing"),
    "gascon": ("加斯科涅地区", "origin"),
    "gesho": ("格绍（埃塞俄比亚苦木，用于蜂蜜酒）", "ingredient"),
    "gi": ("地理标志", "term"),
    "gin_and_tonic": ("金汤力", "cocktail"),
    "goa": ("果阿地区", "origin"),
    "grain_beer": ("谷物啤酒", "style"),
    "high_abv": ("高酒精度", "term"),
    "homebrew": ("家酿", "process"),
    "honey": ("蜂蜜", "ingredient"),
    "honey_wine": ("蜂蜜酒", "style"),
    "icewine": ("冰酒", "style"),
    "inniskillin": ("云岭（加拿大冰酒品牌）", "brand"),
    "international": ("国际奖项/市场", "marketing"),
    "islay": ("艾雷岛", "origin"),
    "kusu": ("久须（日本熊本县传统蒸馏酒）", "style"),
    "lapland": ("拉普兰地区", "origin"),
    "national_quality": ("国家级名酒/质量称号（旧宣传标签）", "marketing"),
    "noble": ("贵腐/高贵（旧术语）", "term"),
    "nordic_whisky": ("北欧威士忌", "style"),
    "okinawa": ("冲绳", "origin"),
    "peated": ("泥煤风味", "flavor"),
    "pisco": ("皮斯科", "style"),
    "pisco_sour": ("皮斯科酸", "cocktail"),
    "portuguese_national": ("葡萄牙国民品牌/传统", "marketing"),
    "pot_still": ("壶式蒸馏", "process"),
    "premier_cru_supérieur": ("波尔多一级庄/优级（旧分级术语）", "term"),
    "rice_aroma": ("米香型", "flavor"),
    "royal_warrant": ("皇家认证", "marketing"),
    "rye": ("黑麦", "ingredient"),
    "ryukyu": ("琉球", "origin"),
    "sabeco": ("Sabeco（越南西贡啤酒品牌）", "brand"),
    "saigon": ("西贡（品牌/地名）", "brand"),
    "santorini": ("圣托里尼", "origin"),
    "sauternes": ("苏玳", "origin"),
    "setubal": ("塞图巴尔", "origin"),
    "speyside": ("斯佩塞", "origin"),
    "summer": ("夏季", "occasion"),
    "swedish_oak": ("瑞典橡木", "process"),
    "swedish_tradition": ("瑞典传统", "origin"),
    "thai": ("泰国", "origin"),
    "triple_blend": ("三重调和", "process"),
    "triple_distilled": ("三次蒸馏", "process"),
    "tropical_aging": ("热带陈年", "process"),
    "vidal": ("威代尔葡萄品种", "ingredient"),
    "vintage": ("年份", "term"),
    "volcanic": ("火山土壤/风味", "flavor"),
    "wimbledon": ("温布尔登", "event"),
    "winter": ("冬季", "occasion"),
}

tags = sorted(counts)
missing = [tag for tag in tags if tag not in meanings]
if missing:
    raise SystemExit(f"Missing mappings: {missing}")

os.makedirs(os.path.join(BASE, "shared", "taxonomy"), exist_ok=True)
lines = [
    "# 旧站未登记标签映射",
    "",
    "本表覆盖 `docs/audit/source-baseline.json` 诊断列出的全部 71 个未登记标签，共 81 次引用。G1 只建立映射归属；标签是否保留由 G4 逐条核对，不能删除引用后声称校验通过。",
    "",
    "| 标签键 | 建议含义 | 归属维度 | 引用次数 | 状态 | G4 处置 |",
    "| --- | --- | --- | --- | --- | --- |",
]
for tag in tags:
    meaning, dimension = meanings[tag]
    lines.append(
        f"| `{tag}` | {meaning} | {dimension} | {counts[tag]} | pending-review | 逐条核对；确认后进入受控词表或记录弃用原因 |"
    )
lines += [
    "",
    "维度：flavor 风味、ingredient 原料、process 工艺、origin 产地、style 类型、cocktail 饮用方式、pairing 搭配、occasion 场景、term 术语、marketing 旧宣传、brand 品牌、producer 生产者属性、culture 文化、event 活动、pending 待核。",
    "",
    "注意：旧站的 `national_quality`、`international`、`royal_warrant` 等标签带有宣传或奖项性质，不能直接作为事实或当代认证复用。",
]
open(os.path.join(BASE, "shared", "taxonomy", "legacy-tags.md"), "w", encoding="utf-8").write(
    "\n".join(lines) + "\n"
)

categories = {
    "baijiu": "白酒",
    "yellow_wine": "黄酒",
    "wine": "葡萄酒",
    "beer": "啤酒",
    "sake": "清酒",
    "whisky": "威士忌",
    "brandy": "白兰地",
    "vodka": "伏特加",
    "rum": "朗姆酒",
    "tequila": "龙舌兰酒",
    "gin": "金酒",
    "soju": "烧酒",
    "liqueur": "利口酒",
    "aperitif": "开胃酒",
    "baijiu_medicinal": "保健酒",
    "fruit_wine": "果酒",
    "other": "其他酒类",
}
cat_lines = [
    "# 旧站分类与别名映射",
    "",
    "旧站 17 个分类是多用途目录，不等同于互斥的类型体系。本表保留旧键，说明 G1 的维度归属，G4 再逐条判型。",
    "",
    "| 旧分类键 | 旧显示名 | G1 维度 | 状态 | 处置 |",
    "| --- | --- | --- | --- | --- |",
]
for key, name in categories.items():
    dimension = (
        "usage/legacy-functional"
        if key == "baijiu_medicinal"
        else ("occasion/style" if key == "aperitif" else "drink-style family")
    )
    note = (
        "保留旧词；旧功能称呼不作为事实背书"
        if key in ("baijiu_medicinal", "aperitif")
        else "按酒类风格维度映射，具体对象判型后进入 drink-style/drink/brand 等类型"
    )
    cat_lines.append(f"| `{key}` | {name} | {dimension} | pending-review | {note} |")
cat_lines += [
    "",
    "## 已登记的别名问题",
    "",
    "| 旧记录键 | 旧分类 | 映射目标 | 状态 | 说明 |",
    "| --- | --- | --- | --- | --- |",
    "| `liquor:fujian_fujianlaojiu` | `huangjiu` | `yellow_wine` | mapped-alias | 福建老酒旧记录使用未登记别名；保留 legacy_category，G4 判型后迁移 |",
    "| `liquor:shanghai_shikumen` | `huangjiu` | `yellow_wine` | mapped-alias | 石库门黄酒旧记录使用未登记别名；保留 legacy_category，G4 判型后迁移 |",
    "",
    "`huangjiu` 只是旧别名，不是新的受控分类键；`yellow_wine` 为登记键。",
]
open(os.path.join(BASE, "shared", "taxonomy", "legacy-categories.md"), "w", encoding="utf-8").write(
    "\n".join(cat_lines) + "\n"
)

tag_lines = [
    "# 受控标签（G1 样本）",
    "",
    "本表只登记当前样本使用的标签。旧站 71 个未登记标签见 `legacy-tags.md`，在 G4 核对前不进入本表。",
    "",
    "| 标签键 | 中文 | English | 维度 |",
    "| --- | --- | --- | --- |",
    "| `baijiu` | 白酒 | Baijiu | style |",
    "| `strong-aroma` | 浓香型 | Strong aroma | style |",
    "| `migration-sample` | 迁移样本 | Migration sample | workflow |",
    "| `classic-cocktail` | 经典鸡尾酒 | Classic cocktail | style |",
    "| `public-domain` | 公共领域文本 | Public-domain text | rights |",
    "| `museum` | 博物馆 | Museum | place-type |",
]
open(os.path.join(BASE, "shared", "taxonomy", "tags.md"), "w", encoding="utf-8").write(
    "\n".join(tag_lines) + "\n"
)

region_lines = [
    "# 地区键与层级（样本）",
    "",
    "地区实体是事实来源；本表只登记稳定键和层级，供跨仓引用。全量旧国家、省份键在 G4 逐条映射。",
    "",
    "| 键 | 中文 | English | 层级 | 上级 |",
    "| --- | --- | --- | --- | --- |",
    "| `region:china` | 中国 | China | country | — |",
    "| `region:anhui` | 安徽省 | Anhui | province | `region:china` |",
    "| `region:bozhou` | 亳州市 | Bozhou | city | `region:anhui` |",
]
open(os.path.join(BASE, "shared", "regions.md"), "w", encoding="utf-8").write(
    "\n".join(region_lines) + "\n"
)

os.makedirs(GUIDE + "/shared", exist_ok=True)
ingredient_lines = [
    "# 配方本地配料键（样本）",
    "",
    "这里只登记尚无全局实体、但配方需要稳定引用的配料键。若 beverages 已建立原料实体，应改用 `item_ref` 指向全局 ID，不得维护两套相互矛盾的事实。",
    "",
    "| 键 | 中文 | English | 说明 |",
    "| --- | --- | --- | --- |",
    "| `gin` | 金酒 | Gin | 基酒；待 beverages 建立基酒实体后改为 item_ref |",
    "| `campari` | 金巴利苦酒 | Campari | 苦味开胃酒；品牌与产品身份待 G4 判型 |",
    "| `sweet-vermouth` | 甜味美思 | Sweet vermouth | 加香加强葡萄酒 |",
    "| `orange-peel` | 橙皮 | Orange peel | 装饰用柑橘皮 |",
    "| `ice` | 冰 | Ice | 调制与侍饮用冰 |",
]
open(os.path.join(GUIDE, "shared", "ingredients.md"), "w", encoding="utf-8").write(
    "\n".join(ingredient_lines) + "\n"
)
print(f"Wrote taxonomy for {len(tags)} tags, {len(categories)} categories, 5 ingredient keys.")
