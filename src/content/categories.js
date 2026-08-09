// 泸州老窖科普平台 —— 分类定义
// 本文件由 server/export.js 从本地数据库导出，请勿手动编辑

export const categories = [
  {
    id: "brand",
    name: "品牌与产品",
    description: "从高端国窖1573到大众头曲、二曲，认识泸州老窖的产品家族。",
    icon: "🍶"
  },
  {
    id: "business",
    name: "经营业绩",
    description: "用通俗的数字看懂这家\"浓香鼻祖\"的经营状况与股东回报。",
    icon: "📈"
  },
  {
    id: "digital",
    name: "数智化创新",
    description: "白酒行业首家\"灯塔工厂\"、\"一瓶一码\"五码关联——传统与科技的碰撞。",
    icon: "🤖"
  },
  {
    id: "heritage",
    name: "活态双国宝",
    description: "450年未间断的1573国宝窖池群 + 700年24代口传心授的传统酿制技艺。",
    icon: "🏛️"
  },
  {
    id: "history",
    name: "历史沿革",
    description: "700年酿造史：从元代郭怀玉创制\"甘醇曲\"，到蝉联五届\"国家名酒\"的浓香鼻祖。",
    icon: "🏺"
  }
]

export function getCategoryName(id) {
  const c = categories.find((c) => c.id === id)
  return c ? c.name : id
}

export function getCategoryById(id) {
  return categories.find((c) => c.id === id)
}
