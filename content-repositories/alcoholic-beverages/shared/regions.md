# 地区键与层级（样本）

地区实体是事实来源；本表只登记稳定键和层级，供跨仓引用。全量旧国家、省份键在 G4 逐条映射。

| 键 | 中文 | English | 层级 | 上级 |
| --- | --- | --- | --- | --- |
| `region:china` | 中国 | China | country | — |
| `region:anhui` | 安徽省 | Anhui | province | `region:china` |
| `region:bozhou` | 亳州市 | Bozhou | city | `region:anhui` |
