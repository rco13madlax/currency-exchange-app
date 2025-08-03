import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || 'USD'
  const to = searchParams.get('to') || 'CNY'

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    
    if (!apiKey) {
      // 如果没有API密钥，返回模拟数据
      return getMockRates(from, to)
    }

    // 使用真实的汇率API
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}`,
      { 
        next: { revalidate: 300 }, // 缓存5分钟
        headers: {
          'Accept': 'application/json',
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.result === 'success') {
      return NextResponse.json({
        success: true,
        rate: data.conversion_rate,
        from,
        to,
        lastUpdated: new Date().toISOString(),
        source: 'exchangerate-api'
      })
    } else {
      throw new Error('API请求失败: ' + data.error_type)
    }
  } catch (error) {
    console.error('汇率API错误:', error)
    // 如果真实API失败，返回模拟数据
    return getMockRates(from, to)
  }
}

// 模拟汇率数据
function getMockRates(from: string, to: string) {
  const mockRates: { [key: string]: number } = {
    'USD-CNY': 7.25,
    'USD-EUR': 0.85,
    'USD-JPY': 150.3,
    'USD-GBP': 0.78,
    'USD-KRW': 1320.5,
    'USD-AUD': 1.52,
    'USD-CAD': 1.35,
    'USD-CHF': 0.88,
    'USD-SGD': 1.35,
    'EUR-CNY': 8.53,
    'EUR-USD': 1.18,
    'EUR-JPY': 177.4,
    'EUR-GBP': 0.92,
    'GBP-CNY': 9.28,
    'GBP-USD': 1.28,
    'GBP-EUR': 1.09,
    'JPY-CNY': 0.048,
    'CNY-USD': 0.138,
    'CNY-EUR': 0.117,
    'CNY-JPY': 20.73,
    'CNY-GBP': 0.108
  }

  const key = `${from}-${to}`
  const reverseKey = `${to}-${from}`
  
  let rate = 1
  if (from === to) {
    rate = 1
  } else if (mockRates[key]) {
    rate = mockRates[key]
  } else if (mockRates[reverseKey]) {
    rate = 1 / mockRates[reverseKey]
  } else {
    // 如果找不到汇率，生成一个合理的随机值
    rate = Math.random() * 10 + 0.1
  }

  return NextResponse.json({
    success: true,
    rate,
    from,
    to,
    lastUpdated: new Date().toISOString(),
    source: 'mock-data'
  })
}

// 获取历史汇率数据
export async function POST(request: NextRequest) {
  const { from, to, days = 7 } = await request.json()
  
  // 生成模拟历史数据
  const historicalData = []
  const baseRate = await GET(new NextRequest(`${request.url}?from=${from}&to=${to}`))
    .then(res => res.json())
    .then(data => data.rate)
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    // 生成轻微波动的汇率
    const variation = (Math.random() - 0.5) * 0.1 // ±5%的波动
    const rate = baseRate * (1 + variation)
    
    historicalData.push({
      date: date.toISOString().split('T')[0],
      rate: parseFloat(rate.toFixed(6))
    })
  }
  
  return NextResponse.json({
    success: true,
    data: historicalData,
    from,
    to,
    days
  })
}