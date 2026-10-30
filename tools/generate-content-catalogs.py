import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content-repositories")

TYPE_LABELS = {
    "zh": {
        "drink-style": "酒类风格",
        "drink": "酒款",
        "brand": "品牌",
        "producer": "生产者",
        "ingredient": "原料",
        "variety": "品种",
        "region": "产区",
        "process": "工艺",
        "term": "术语",
        "standard": "标准",
        "cocktail": "鸡尾酒",
        "guide": "指南",
        "technique": "技法",
        "recipe": "配方",
        "vessel": "酒器",
        "tool": "器具",
        "pairing": "搭配",
        "article": "文章",
        "person": "人物",
        "book": "典籍",
        "custom": "礼俗",
        "historical-event": "历史事件",
        "artwork": "艺术作品",
        "poem": "诗词",
        "organization": "组织",
        "place": "地点",
        "route": "路线",
        "event": "活动",
    },
    "en": {
        "drink-style": "Drink styles",
        "drink": "Drinks",
        "brand": "Brands",
        "producer": "Producers",
        "ingredient": "Ingredients",
        "variety": "Varieties",
        "region": "Regions",
        "process": "Processes",
        "term": "Terms",
        "standard": "Standards",
        "cocktail": "Cocktails",
        "guide": "Guides",
        "technique": "Techniques",
        "recipe": "Recipes",
        "vessel": "Glassware",
        "tool": "Tools",
        "pairing": "Pairings",
        "article": "Articles",
        "person": "People",
        "book": "Books",
        "custom": "Customs",
        "historical-event": "Historical events",
        "artwork": "Artworks",
        "poem": "Poetry",
        "organization": "Organizations",
        "place": "Places",
        "route": "Routes",
        "event": "Events",
    },
}

REPO_TITLES = {
    "alcoholic-beverages": ("识酒内容仓", "Drinks content repository"),
    "alcohol-guide": ("喝法内容仓", "Ways-to-drink content repository"),
    "alcohol-culture": ("酒文化内容仓", "Drink culture content repository"),
    "alcohol-atlas": ("去处内容仓", "Places content repository"),
}


def frontmatter(path):
    text = open(path, encoding="utf-8").read()
    match = re.match(r"^---\n([\s\S]*?)\n---", text)
    data = match.group(1) if match else ""
    title = re.search(r"^title:\s*(.+)$", data, re.M)
    summary = re.search(r"^summary:\s*(.+)$", data, re.M)
    status = re.search(r"^status:\s*(.+)$", data, re.M)
    return (
        (title.group(1).strip().strip('"') if title else os.path.basename(path)),
        (summary.group(1).strip().strip('"') if summary else ""),
        (status.group(1).strip().strip('"') if status else ""),
    )


for repo in sorted(os.listdir(CONTENT)):
    repo_dir = os.path.join(CONTENT, repo)
    if not os.path.isdir(repo_dir):
        continue
    for lang in ("zh", "en"):
        lang_dir = os.path.join(repo_dir, lang)
        if not os.path.isdir(lang_dir):
            continue
        entries = []
        for type_name in sorted(os.listdir(lang_dir)):
            type_dir = os.path.join(lang_dir, type_name)
            if not os.path.isdir(type_dir):
                continue
            files = sorted(
                f
                for f in os.listdir(type_dir)
                if f.endswith(".md") and f != "README.md"
            )
            if not files:
                continue
            entries.append((type_name, files))
            type_lines = [
                f"# {TYPE_LABELS[lang][type_name]}",
                "",
                f"[返回{'中文' if lang == 'zh' else 'English'}目录](../README.md)",
                "",
            ]
            for filename in files:
                title, summary, status = frontmatter(os.path.join(type_dir, filename))
                marker = "" if status == "reviewed" else f"（{status}）"
                type_lines.append(f"- [{title}{marker}]({filename}) — {summary}")
            type_lines.append("")
            if lang == "zh":
                type_lines.append("状态不是 `reviewed` 的条目只用于迁移预览，不进入正式搜索。")
            else:
                type_lines.append("Entries not marked `reviewed` are migration previews and are excluded from production search.")
            type_lines.append("")
            open(os.path.join(type_dir, "README.md"), "w", encoding="utf-8").write(
                "\n".join(type_lines)
            )

        title_zh, title_en = REPO_TITLES[repo]
        heading = f"# {title_zh} · {'中文目录' if lang == 'zh' else 'English catalog'}"
        lines = [
            heading,
            "",
            f"返回仓库首页：[README.md](../README.md)",
            "",
            "本目录由内容文件生成，校验命令会检查目录是否过期或出现断链。",
            "",
        ]
        for type_name, files in entries:
            lines += [f"## {TYPE_LABELS[lang][type_name]}", ""]
            for filename in files:
                title, summary, status = frontmatter(os.path.join(lang_dir, type_name, filename))
                marker = "" if status == "reviewed" else f"（{status}）"
                lines.append(f"- [{title}{marker}]({type_name}/{filename}) — {summary}")
            lines.append("")
        open(os.path.join(lang_dir, "README.md"), "w", encoding="utf-8").write(
            "\n".join(lines)
        )
print("Catalogs generated.")
