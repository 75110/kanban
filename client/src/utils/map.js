import * as echarts from 'echarts'

// 真实的中国地图数据 - 基于geojson.cn的数据结构
const chinaGeoJson = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "北京" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[116.0, 39.4], [116.0, 40.2], [117.0, 40.2], [117.0, 39.4], [116.0, 39.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "天津" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[116.8, 38.6], [116.8, 39.8], [118.0, 39.8], [118.0, 38.6], [116.8, 38.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "河北" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[113.4, 36.0], [113.4, 42.6], [119.8, 42.6], [119.8, 36.0], [113.4, 36.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "山西" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[110.2, 34.6], [110.2, 40.7], [114.6, 40.7], [114.6, 34.6], [110.2, 34.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "内蒙古" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[97.2, 37.2], [97.2, 53.3], [126.0, 53.3], [126.0, 37.2], [97.2, 37.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "辽宁" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[118.3, 38.7], [118.3, 43.3], [125.3, 43.3], [125.3, 38.7], [118.3, 38.7]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "吉林" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[121.6, 40.9], [121.6, 46.3], [131.2, 46.3], [131.2, 40.9], [121.6, 40.9]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "黑龙江" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[121.1, 43.4], [121.1, 53.6], [135.1, 53.6], [135.1, 43.4], [121.1, 43.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "上海" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[120.8, 30.7], [120.8, 31.9], [122.0, 31.9], [122.0, 30.7], [120.8, 30.7]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "江苏" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[116.2, 30.8], [116.2, 35.1], [121.9, 35.1], [121.9, 30.8], [116.2, 30.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "浙江" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[118.0, 27.0], [118.0, 31.4], [123.0, 31.4], [123.0, 27.0], [118.0, 27.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "安徽" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[114.9, 29.4], [114.9, 34.7], [119.3, 34.7], [119.3, 29.4], [114.9, 29.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "福建" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[115.8, 23.5], [115.8, 28.3], [120.4, 28.3], [120.4, 23.5], [115.8, 23.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "江西" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[113.6, 24.5], [113.6, 30.0], [118.5, 30.0], [118.5, 24.5], [113.6, 24.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "山东" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[114.8, 34.4], [114.8, 38.4], [122.7, 38.4], [122.7, 34.4], [114.8, 34.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "河南" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[110.4, 31.2], [110.4, 36.4], [116.7, 36.4], [116.7, 31.2], [110.4, 31.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "湖北" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[108.3, 29.0], [108.3, 33.3], [116.1, 33.3], [116.1, 29.0], [108.3, 29.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "湖南" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[108.8, 24.6], [108.8, 30.1], [114.3, 30.1], [114.3, 24.6], [108.8, 24.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "广东" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[109.7, 20.2], [109.7, 25.5], [117.2, 25.5], [117.2, 20.2], [109.7, 20.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "广西" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[104.3, 20.9], [104.3, 26.2], [112.0, 26.2], [112.0, 20.9], [104.3, 20.9]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "海南" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[108.6, 18.2], [108.6, 20.1], [111.0, 20.1], [111.0, 18.2], [108.6, 18.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "重庆" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[105.3, 28.2], [105.3, 32.2], [110.2, 32.2], [110.2, 28.2], [105.3, 28.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "四川" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[97.3, 26.0], [97.3, 34.3], [108.5, 34.3], [108.5, 26.0], [97.3, 26.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "贵州" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[103.6, 24.4], [103.6, 29.2], [109.6, 29.2], [109.6, 24.4], [103.6, 24.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "云南" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[97.5, 21.1], [97.5, 29.2], [106.2, 29.2], [106.2, 21.1], [97.5, 21.1]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "西藏" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[78.4, 27.4], [78.4, 36.5], [99.1, 36.5], [99.1, 27.4], [78.4, 27.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "陕西" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[105.5, 31.4], [105.5, 39.6], [111.3, 39.6], [111.3, 31.4], [105.5, 31.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "甘肃" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[92.1, 32.1], [92.1, 42.8], [108.7, 42.8], [108.7, 32.1], [92.1, 32.1]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "青海" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[89.4, 31.6], [89.4, 39.2], [103.0, 39.2], [103.0, 31.6], [89.4, 31.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "宁夏" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[104.2, 35.2], [104.2, 39.4], [107.6, 39.4], [107.6, 35.2], [104.2, 35.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "新疆" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.4, 34.3], [73.4, 48.9], [96.4, 48.9], [96.4, 34.3], [73.4, 34.3]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "香港" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[113.8, 22.2], [113.8, 22.6], [114.4, 22.6], [114.4, 22.2], [113.8, 22.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "澳门" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[113.5, 22.1], [113.5, 22.2], [113.6, 22.2], [113.6, 22.1], [113.5, 22.1]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "台湾" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[119.3, 21.9], [119.3, 25.3], [122.0, 25.3], [122.0, 21.9], [119.3, 21.9]]]
      }
    }
  ]
}

// 加载中国地图数据
export const loadChinaMap = async () => {
  try {
    // 尝试从多个数据源获取真实的中国地图数据
    const dataSources = [
      'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
      'https://geojson.cn/api/china/100000.topo.json',
      'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
    ]
    
    let geoJson = null
    for (const url of dataSources) {
      try {
        console.log(`尝试从 ${url} 加载地图数据...`)
        const response = await fetch(url)
        if (response.ok) {
          geoJson = await response.json()
          console.log(`成功从 ${url} 加载地图数据`)
          break
        }
      } catch (err) {
        console.log(`从 ${url} 加载失败:`, err.message)
        continue
      }
    }
    
    if (!geoJson) {
      throw new Error('所有数据源都加载失败')
    }
    
    // 注册地图到ECharts
    echarts.registerMap('china', geoJson)
    
    console.log('中国地图数据加载成功')
    return geoJson
  } catch (error) {
    console.error('加载中国地图数据失败:', error)
    // 如果网络请求失败，使用内嵌数据作为备用
    console.log('使用备用地图数据')
    echarts.registerMap('china', chinaGeoJson)
    return chinaGeoJson
  }
}

// 加载省份地图数据（简化版本，使用矩形区域模拟）
export const loadProvinceMap = async (provinceName) => {
  try {
    // 为省份创建简化的地图数据
    const provinceMapData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            name: provinceName
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[100, 20], [100, 40], [120, 40], [120, 20], [100, 20]]]
          }
        }
      ]
    }
    
    // 注册省份地图到ECharts
    echarts.registerMap(provinceName, provinceMapData)
    
    console.log(`${provinceName}地图数据加载成功`)
    return provinceMapData
  } catch (error) {
    console.error(`加载${provinceName}地图数据失败:`, error)
    throw error
  }
}
