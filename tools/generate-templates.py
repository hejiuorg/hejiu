import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTRACTS = os.path.join(
    ROOT,
    "site-repositories",
    "site-alcoholic-beverages",
    "packages",
    "contracts",
)
types_doc = json.load(open(os.path.join(CONTRACTS, "types.json"), encoding="utf-8"))
sites_doc = json.load(open(os.path.join(CONTRACTS, "sites.json"), encoding="utf-8"))
site_repo = {s["key"]: s["contentRepository"] for s in sites_doc["sites"]}

extra = {
    "drink-style": "parent_style_id: null\naroma_family: \"\"",
    "drink": "style_refs:\n  - drink-style:example-style\nbrand_refs: []\nproducer_refs: []\nregion_refs: []\ningredient_refs: []\nprocess_refs: []\nabv:\n  min: 0\n  max: 0\n  unit: percent-vol",
    "brand": "producer_refs:\n  - producer:example-producer\nregion_refs: []\nofficial_url: \"\"\nfounded_year: null",
    "producer": "region_refs:\n  - region:example-region\nofficial_url: \"\"\nfounded_year: null\norganization_type: \"\"",
    "ingredient": "kind: \"\"\nregion_refs: []",
    "variety": "species: \"\"\nregion_refs: []",
    "region": "level: other\nparent_id: null\ncountry_code: null\nlatitude: null\nlongitude: null",
    "process": "applies_to_refs: []",
    "term": "also_known_as: []",
    "standard": "issuer: \"\"\nstandard_code: \"\"\neffective_date: \"\"\nscope: \"\"",
    "cocktail": "style: \"\"\ningredient_refs: []\norigin_place: \"\"",
    "guide": "about_refs: []\naudience: \"\"\ndifficulty: beginner",
    "technique": "applies_to_refs: []\nabout_refs: []",
    "recipe": "product_id: cocktail:example-cocktail\nsource_version: \"\"\nmethod: stir\nyield:\n  amount: 1\n  unit: drink\n  serves: 1\ningredients:\n  - ingredient_key: ice\n    name: 冰\n    amount: 1\n    unit: 杯\nsteps:\n  - 写下有来源的步骤。\nvessel_refs: []\ntool_refs: []\ntechnique_refs: []\ngarnish: \"\"",
    "vessel": "materials: []\ncapacity_ml: null\nuses_for: \"\"",
    "tool": "materials: []\npurpose: \"\"",
    "pairing": "food: \"\"\ndrink_refs: []\nabout_refs: []",
    "article": "about_refs: []\ntopics: []\nperiod: \"\"",
    "person": "birth_year: null\ndeath_year: null\nroles: []\nregion_refs: []",
    "book": "author_names: []\nauthor_refs: []\npublication: \"\"\nisbn: \"\"",
    "custom": "region_refs: []\nperiod: \"\"",
    "historical-event": "date_text: \"\"\nyear_start: null\nyear_end: null\ncalendar: \"\"\nplace_refs: []",
    "artwork": "creator_refs: []\nmedium: \"\"\ncollection: \"\"",
    "poem": "author_name: \"\"\nsource_title: \"\"\ndynasty: \"\"\ntext_variant: \"\"\nabout_refs: []",
    "organization": "region_refs: []\nfounded_year: null\nofficial_url: \"\"",
    "place": "subtype: pub\naddress: \"\"\naddress_en: \"\"\ncity: \"\"\ncountry: \"\"\nlatitude: null\nlongitude: null\nofficial_url: \"\"\nproducer_refs: []\nregion_refs: []\noperating_status: unknown\nverified_at: null\nfounded_year: null",
    "route": "stop_ids:\n  - place_id: place:example-one\n    order: 1\n  - place_id: place:example-two\n    order: 2\nmode: \"\"\nupdated_at: null",
    "event": "start: 2026-01-01T18:00:00+08:00\nend: 2026-01-01T20:00:00+08:00\ntimezone: Asia/Shanghai\nplace_refs:\n  - place:example-place\norganizer_refs: []\nofficial_url: \"\"\nevent_status: unknown",
}

for type_doc in types_doc["types"]:
    type_name = type_doc["type"]
    repo = site_repo[type_doc["site"]]
    path = os.path.join(ROOT, "content-repositories", repo, "templates", f"{type_name}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    extra_fields = extra[type_name]
    front = f"""---
schema_version: 1
id: {type_doc['namespace']}:example-entry
type: {type_name}
lang: zh
slug: example-entry
title: 示例{type_name}
summary: 这是 {type_name} 类型的草稿模板，不是正式内容。
status: draft
revision: 1
legacy_refs: []
aliases: []
tags: []
related: []
references: []
sources: []
rights:
  status: unverified
{extra_fields}
---
"""
    if type_name in ("route", "event"):
        body = f"""# 示例{type_name}

> 草稿模板。没有经核验的路线或活动时不得生成正式页面；此文件只用于验证 {type_name} 的 schema 和构建器。

## 正文

写下可追查来源的事实、时间与限制。未知字段保持 `null`，不要猜测。
"""
    else:
        body = f"""# 示例{type_name}

> 草稿模板。复制到 `zh/{type_name}/` 与 `en/{type_name}/` 后再填写；英文必须依据中文源文件翻译并记录 `source_revision` 与 `source_sha256`。

## 正文

写下来源可支持的事实，并删除所有不适用的占位内容。

## 参考资料

在 front matter 的 `sources` 中登记来源；正文不伪造出处。
"""
    with open(path, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(front + "\n" + body)
print(f"Wrote {len(types_doc['types'])} templates.")
