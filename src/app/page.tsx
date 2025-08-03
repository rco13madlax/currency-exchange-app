'use client'

import React, { useState, useEffect, useCallback, memo, useRef } from 'react'
import { ArrowUpDown, TrendingUp, Calculator, Globe, RefreshCw, Search, Star, Clock, MoreHorizontal, Bell, User, Settings, CreditCard, Shield, HelpCircle, LogOut, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/hooks/useAuth'
import { supabase, currencies } from '@/lib/supabase'

interface ExchangeRate {
  rate: number
  lastUpdated: string
  source: string
}

interface ChartData {
  date: string
  rate: number
}

interface MarketRates {
  [key: string]: number
}

// 🔥 独立输入框组件 - 只更新值，不触发计算
const AmountInput = memo(function AmountInput({
  value,
  onChange,
  disabled = false
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
      onChange(newValue) // 直接更新，不触发计算
    }
  }, [onChange])

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <label className="block text-sm font-medium text-gray-700 mb-2">输入金额</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="w-full text-3xl font-bold border-none outline-none bg-transparent placeholder-gray-400 disabled:opacity-50"
        placeholder="0"
        inputMode="decimal"
        autoComplete="off"
      />
    </div>
  )
})

// 货币选择器
const CurrencyPicker = memo(function CurrencyPicker({
  isOpen,
  onClose,
  onSelect,
  selectedCurrency
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (currency: string) => void
  selectedCurrency: string
}) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredCurrencies = currencies.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">选择货币</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none"
              placeholder="搜索货币..."
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredCurrencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => {
                onSelect(currency.code)
                onClose()
              }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 ${
                selectedCurrency === currency.code ? 'bg-blue-50' : ''
              }`}
            >
              <span className="text-2xl">{currency.flag}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{currency.code}</div>
                <div className="text-sm text-gray-500">{currency.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

// 主应用组件
export default function CurrencyExchangeApp() {
  const auth = useAuth()
  const { user, userProfile, loading: authLoading } = auth
  
  const [currentTab, setCurrentTab] = useState('converter')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('CNY')
  const [amount, setAmount] = useState('100')
  const [convertedAmount, setConvertedAmount] = useState('')
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCurrencyPicker, setShowCurrencyPicker] = useState<'from' | 'to' | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])

  // 获取汇率
  const fetchExchangeRate = useCallback(async (from: string, to: string): Promise<ExchangeRate> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (from === to) {
      return { rate: 1.0, lastUpdated: new Date().toISOString(), source: 'local' }
    }
    
    const marketRates: MarketRates = {
      'USD-CNY': 7.314, 'USD-EUR': 0.872, 'USD-JPY': 156.24, 'USD-GBP': 0.820,
      'CNY-USD': 0.1368, 'EUR-USD': 1.147, 'JPY-USD': 0.0064, 'GBP-USD': 1.220
    }

    const key = `${from}-${to}`
    const reverseKey = `${to}-${from}`
    
    let baseRate = 1
    if (key in marketRates) {
      baseRate = marketRates[key]
    } else if (reverseKey in marketRates) {
      baseRate = 1 / marketRates[reverseKey]
    }

    const variation = (Math.random() - 0.5) * 0.006
    const finalRate = baseRate * (1 + variation)

    return {
      rate: Number(finalRate.toFixed(6)),
      lastUpdated: new Date().toISOString(),
      source: 'market-data'
    }
  }, [])

  // 执行转换
  const performConversion = useCallback(async (amountToConvert: string) => {
    if (!amountToConvert || isNaN(parseFloat(amountToConvert))) {
      setConvertedAmount('')
      setExchangeRate(null)
      return
    }
    
    setLoading(true)
    
    try {
      const rateData = await fetchExchangeRate(fromCurrency, toCurrency)
      const result = fromCurrency === toCurrency 
        ? parseFloat(amountToConvert).toFixed(2)
        : (parseFloat(amountToConvert) * rateData.rate).toFixed(2)
      
      setConvertedAmount(result)
      setExchangeRate(rateData)
      
      // 保存历史记录
      if (user) {
        await supabase.from('conversion_history').insert([{
          user_id: user.id,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          from_amount: parseFloat(amountToConvert),
          to_amount: parseFloat(result),
          exchange_rate: rateData.rate
        }])
      }
    } catch (error) {
      console.error('转换失败:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchExchangeRate, fromCurrency, toCurrency, user])

  // 处理金额变化 - 只更新状态，不计算
  const handleAmountChange = useCallback((newAmount: string) => {
    setAmount(newAmount)
    // 🔥 移除自动计算，只在用户点击按钮时计算
  }, [])

  // 🔥 移除自动转换的 useEffect
  // 只有用户主动点击按钮或切换货币时才计算

  // 货币变化时自动转换一次（因为用户主动选择了新货币）
  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      performConversion(amount)
    }
  }, [fromCurrency, toCurrency]) // 🔥 移除 amount 依赖，避免输入时自动计算

  // 交换货币
  const swapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }, [fromCurrency, toCurrency])

  // 生成图表数据
  useEffect(() => {
    const data: ChartData[] = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const variation = (Math.random() - 0.5) * 0.01
      const rate = Number((7.314 * (1 + variation)).toFixed(4))
      
      data.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        rate: rate
      })
    }
    setChartData(data)
  }, [])

  // 加载状态
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6" />
            <h1 className="text-xl font-bold">汇率通</h1>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5" />
            {user ? (
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            ) : (
              <button className="px-4 py-2 bg-white/20 rounded-full text-sm">登录</button>
            )}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="p-4 space-y-6">
        {currentTab === 'converter' && (
          <>
            {/* 金额输入 - 只更新值，不自动计算 */}
            <AmountInput
              value={amount}
              onChange={handleAmountChange}
              disabled={loading}
            />

            {/* 货币选择 */}
            <div className="space-y-4">
              <button
                onClick={() => setShowCurrencyPicker('from')}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{currencies.find(c => c.code === fromCurrency)?.flag}</span>
                  <div className="text-left">
                    <div className="font-semibold">{fromCurrency}</div>
                    <div className="text-sm text-gray-500">{currencies.find(c => c.code === fromCurrency)?.name}</div>
                  </div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>

              <div className="flex justify-center">
                <button
                  onClick={swapCurrencies}
                  className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center"
                >
                  <ArrowUpDown className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setShowCurrencyPicker('to')}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{currencies.find(c => c.code === toCurrency)?.flag}</span>
                  <div className="text-left">
                    <div className="font-semibold">{toCurrency}</div>
                    <div className="text-sm text-gray-500">{currencies.find(c => c.code === toCurrency)?.name}</div>
                  </div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 结果显示 */}
            {convertedAmount && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
                <div className="text-sm text-gray-600 mb-2">转换结果</div>
                <div className="text-3xl font-bold text-gray-800">{convertedAmount}</div>
                {exchangeRate && (
                  <div className="text-sm text-gray-500 mt-2">
                    1 {fromCurrency} = {exchangeRate.rate.toFixed(6)} {toCurrency}
                  </div>
                )}
              </div>
            )}

            {/* 转换按钮 - 点击时手动计算 */}
            <button
              onClick={() => performConversion(amount)}
              disabled={loading || !amount}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 active:scale-95 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  计算中...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  {amount ? '立即转换' : '请输入金额'}
                </>
              )}
            </button>
          </>
        )}

        {currentTab === 'rates' && (
          <div className="space-y-6">
            {/* 图表 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <h3 className="font-bold text-xl mb-4">USD/CNY 走势</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
        <div className="flex justify-around">
          <button
            onClick={() => setCurrentTab('converter')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg ${
              currentTab === 'converter' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <Calculator className="w-5 h-5" />
            <span className="text-xs">转换</span>
          </button>
          <button
            onClick={() => setCurrentTab('rates')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg ${
              currentTab === 'rates' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">汇率</span>
          </button>
        </div>
      </div>

      {/* 货币选择器 */}
      <CurrencyPicker
        isOpen={showCurrencyPicker !== null}
        onClose={() => setShowCurrencyPicker(null)}
        onSelect={(currency) => {
          if (showCurrencyPicker === 'from') {
            setFromCurrency(currency)
          } else if (showCurrencyPicker === 'to') {
            setToCurrency(currency)
          }
          setShowCurrencyPicker(null)
        }}
        selectedCurrency={showCurrencyPicker === 'from' ? fromCurrency : toCurrency}
      />
    </div>
  )
}