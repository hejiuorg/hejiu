import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEJIU = os.path.dirname(ROOT)
LEDGER = os.path.join(HEJIU, "docs", "audit", "legacy-ledger.json")
OUT = os.path.join(ROOT, "migration", "entity-map.json")

mapped = {
    "liquor:anhui_gujinggongjiu": {
        "status": "split",
        "targetRefs": ["brand:gujing-gongjiu", "drink:gujing-gongjiu-nianfen-yuanjiang-20"],
        "reason": "旧记录把品牌历史与具体产品线混在同一条；品牌身份保留为 brand，产品线拆为 drink，二者均保留原记录键。",
    },
    "pub:lao_baijiu_guan": {
        "status": "migrated-needs-review",
        "targetRefs": ["place:lao-baijiu-guan"],
        "reason": "迁为 place/pub；地址与故事保留，坐标、营业状态和来源待复核。",
    },
    "poetry:1": {
        "status": "merged",
        "targetRefs": ["poem:jiang-jin-jiu-excerpt"],
        "reason": "旧站四句同属李白《将进酒》节选，合并为一条诗词记录。",
    },
    "poetry:2": {
        "status": "merged",
        "targetRefs": ["poem:jiang-jin-jiu-excerpt"],
        "reason": "旧站四句同属李白《将进酒》节选，合并为一条诗词记录。",
    },
    "poetry:3": {
        "status": "merged",
        "targetRefs": ["poem:jiang-jin-jiu-excerpt"],
        "reason": "旧站四句同属李白《将进酒》节选，合并为一条诗词记录。",
    },
    "poetry:4": {
        "status": "merged",
        "targetRefs": ["poem:jiang-jin-jiu-excerpt"],
        "reason": "旧站四句同属李白《将进酒》节选，合并为一条诗词记录。",
    },
}

ledger = json.load(open(LEDGER, encoding="utf-8"))
records = []
for row in ledger["records"]:
    key = row["legacyKey"]
    entry = mapped.get(key)
    records.append(
        {
            "legacyKey": key,
            "sourceFile": row["sourceFile"],
            "sourceIndex": row["sourceIndex"],
            "title": row["title"],
            "expectedContentRepository": row["expectedContentRepository"],
            "status": entry["status"] if entry else "pending-classification",
            "targetRefs": entry["targetRefs"] if entry else [],
            "reason": entry["reason"] if entry else None,
        }
    )

payload = {
    "schemaVersion": 1,
    "date": "2026-10-29",
    "sourceSnapshotSha256": ledger["sourceSnapshotSha256"],
    "status": "G2 sample mappings recorded; all other handoff records remain pending-classification",
    "records": records,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8", newline="\n") as handle:
    json.dump(payload, handle, ensure_ascii=False, indent=2)
    handle.write("\n")

statuses = {}
for record in records:
    statuses[record["status"]] = statuses.get(record["status"], 0) + 1
print(f"Wrote {len(records)} records: {statuses}")
