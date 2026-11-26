export interface Place {
  id: string
  group: string // 分组（简体）
  name: string // 简体名
  en: string
  lon: number
  lat: number
  tz: number // 标准时区（小时）
  westMalaysia?: boolean
}

const MY = (id: string, name: string, en: string, lon: number, lat: number, west = true): Place => ({
  id, group: west ? '马来西亚 · 西马' : '马来西亚 · 东马', name, en, lon, lat, tz: 8, westMalaysia: west,
})

export const PLACES: Place[] = [
  MY('my-png', '槟城', 'Pulau Pinang', 100.311, 5.414),
  MY('my-kul', '吉隆坡', 'Kuala Lumpur', 101.687, 3.139),
  MY('my-sgr', '雪兰莪', 'Selangor', 101.518, 3.074),
  MY('my-jhr', '柔佛', 'Johor', 103.741, 1.492),
  MY('my-prk', '霹雳', 'Perak', 101.09, 4.597),
  MY('my-mlk', '马六甲', 'Melaka', 102.25, 2.19),
  MY('my-nsn', '森美兰', 'Negeri Sembilan', 101.942, 2.726),
  MY('my-phg', '彭亨', 'Pahang', 103.326, 3.808),
  MY('my-kdh', '吉打', 'Kedah', 100.368, 6.125),
  MY('my-pls', '玻璃市', 'Perlis', 100.198, 6.441),
  MY('my-ktn', '吉兰丹', 'Kelantan', 102.238, 6.125),
  MY('my-trg', '登嘉楼', 'Terengganu', 103.132, 5.33),
  MY('my-pjy', '布城', 'Putrajaya', 101.696, 2.926),
  MY('my-swk', '砂拉越', 'Sarawak', 110.359, 1.553, false),
  MY('my-sbh', '沙巴', 'Sabah', 116.075, 5.98, false),
  MY('my-lbn', '纳闽', 'Labuan', 115.242, 5.283, false),
  { id: 'sg', group: '新加坡', name: '新加坡', en: 'Singapore', lon: 103.82, lat: 1.352, tz: 8 },
  { id: 'hk', group: '港澳台', name: '香港', en: 'Hong Kong', lon: 114.169, lat: 22.319, tz: 8 },
  { id: 'mo', group: '港澳台', name: '澳门', en: 'Macau', lon: 113.544, lat: 22.199, tz: 8 },
  { id: 'tw-tpe', group: '港澳台', name: '台北', en: 'Taipei', lon: 121.565, lat: 25.033, tz: 8 },
  { id: 'tw-txg', group: '港澳台', name: '台中', en: 'Taichung', lon: 120.674, lat: 24.148, tz: 8 },
  { id: 'tw-tnn', group: '港澳台', name: '台南', en: 'Tainan', lon: 120.227, lat: 22.999, tz: 8 },
  { id: 'tw-khh', group: '港澳台', name: '高雄', en: 'Kaohsiung', lon: 120.301, lat: 22.627, tz: 8 },
  ...(
    [
      ['bj', '北京', 'Beijing', 116.407, 39.904],
      ['tj', '天津', 'Tianjin', 117.201, 39.085],
      ['sh', '上海', 'Shanghai', 121.474, 31.23],
      ['cq', '重庆', 'Chongqing', 106.551, 29.563],
      ['heb', '石家庄（河北）', 'Shijiazhuang', 114.514, 38.042],
      ['sx', '太原（山西）', 'Taiyuan', 112.549, 37.857],
      ['nm', '呼和浩特（内蒙古）', 'Hohhot', 111.749, 40.842],
      ['ln', '沈阳（辽宁）', 'Shenyang', 123.431, 41.806],
      ['jl', '长春（吉林）', 'Changchun', 125.324, 43.817],
      ['hl', '哈尔滨（黑龙江）', 'Harbin', 126.535, 45.803],
      ['js', '南京（江苏）', 'Nanjing', 118.797, 32.06],
      ['zj', '杭州（浙江）', 'Hangzhou', 120.155, 30.274],
      ['ah', '合肥（安徽）', 'Hefei', 117.227, 31.821],
      ['fj', '福州（福建）', 'Fuzhou', 119.297, 26.075],
      ['fj-xm', '厦门（福建）', 'Xiamen', 118.089, 24.48],
      ['jx', '南昌（江西）', 'Nanchang', 115.858, 28.683],
      ['sd', '济南（山东）', 'Jinan', 117.12, 36.651],
      ['ha', '郑州（河南）', 'Zhengzhou', 113.625, 34.747],
      ['hb', '武汉（湖北）', 'Wuhan', 114.305, 30.593],
      ['hn', '长沙（湖南）', 'Changsha', 112.939, 28.228],
      ['gd', '广州（广东）', 'Guangzhou', 113.264, 23.129],
      ['gd-sz', '深圳（广东）', 'Shenzhen', 114.058, 22.543],
      ['gd-st', '汕头（广东）', 'Shantou', 116.682, 23.354],
      ['gd-mz', '梅州（广东）', 'Meizhou', 116.122, 24.289],
      ['gx', '南宁（广西）', 'Nanning', 108.366, 22.817],
      ['hi', '海口（海南）', 'Haikou', 110.199, 20.044],
      ['sc', '成都（四川）', 'Chengdu', 104.066, 30.572],
      ['gz', '贵阳（贵州）', 'Guiyang', 106.63, 26.647],
      ['yn', '昆明（云南）', 'Kunming', 102.833, 24.88],
      ['xz', '拉萨（西藏）', 'Lhasa', 91.141, 29.646],
      ['sn', '西安（陕西）', "Xi'an", 108.94, 34.341],
      ['gs', '兰州（甘肃）', 'Lanzhou', 103.834, 36.061],
      ['qh', '西宁（青海）', 'Xining', 101.778, 36.617],
      ['nx', '银川（宁夏）', 'Yinchuan', 106.231, 38.487],
      ['xj', '乌鲁木齐（新疆）', 'Urumqi', 87.617, 43.826],
    ] as const
  ).map(([id, name, en, lon, lat]) => ({ id: 'cn-' + id, group: '中国大陆', name, en, lon, lat, tz: 8 })),
]

export const DEFAULT_PLACE_ID = 'my-png'

export const findPlace = (id: string) => PLACES.find((p) => p.id === id)

/** 球面距离（km） */
export const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export const nearestPlace = (lat: number, lon: number) => {
  let best = PLACES[0]
  let bestD = Infinity
  for (const p of PLACES) {
    const d = haversine(lat, lon, p.lat, p.lon)
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return { place: best, distanceKm: bestD }
}
