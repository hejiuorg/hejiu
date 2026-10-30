---
schema_version: 1
id: region:china
type: region
lang: zh
slug: china
title: 中国
summary: 地区层级中的国家节点。酒类产区、生产者与地点通过地区键关联到这里。
status: reviewed
revision: 1
level: country
country_code: CN
legacy_refs: []
aliases:
  - 中华人民共和国
tags: []
related: []
references: []
sources:
  - key: gbt-2260
    title: GB/T 2260-2007 中华人民共和国行政区划代码
    publisher: 中华人民共和国国家质量监督检验检疫总局、中国国家标准化管理委员会
    published: "2007"
    accessed: 2026-10-29
rights:
  status: allowed
  license: CC-BY-4.0
  basis: 项目自写样本；仅使用公开的行政区划层级信息。 项目所有者于 2026-10-29 声明项目内容采用 CC BY 4.0。
  note: 第三方标准、商标、图片与引用文本不在本许可内；来源仅作核验引用。旧站档案中的事实与营业断言仍需独立核验。
verification_scope: source-verified
---

# 中国

本页是地区层级的国家节点，用于组织产区、生产者与地点。它不是酒类分类，也不表示所有酒款都来自同一个产区。

## 在知识结构中的位置

- 省级地区以本页为上级节点。
- 酒类风格、品牌与产品通过各自实体的 `from-region` 关系指向具体地区，而不是笼统地指向国家。
- 地点的地址与营业信息仍由地点实体保存，不复制到地区页。

## 参考资料

行政区划代码依据 GB/T 2260-2007；具体省、市条目以公开行政区划资料为准。
