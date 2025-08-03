'use client'

import React, { useState, useEffect, useCallback, memo, useRef } from 'react'
import { ArrowUpDown, TrendingUp, Calculator, Globe, RefreshCw, Search, Star, Clock, MoreHorizontal, Bell, User, Settings, CreditCard, Shield, HelpCircle, LogOut, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/hooks/useAuth'
import { supabase, currencies } from '@/lib/supabase'

// 防抖函数实现
function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T & { cancel: () => void }
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }
  
  return debounced
}

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

// 🔥 完全隔离的输入框组件 - 绝对不会失焦
const AmountInput = memo(function AmountInput({
  initialValue,
  onAmountChange,
  disabled
}: {
  initialValue: string
  onAmountChange: (value: string) => void
  disabled?: boolean
}) {
  // 使用内部状态，完全独立于父组件
  const [value, setValue] = useState(initialValue)
  const [hasChanged, setHasChanged] = useState(false)
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // 只允许数字和小数点
    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
      setValue(newValue)
      setHasChanged(true)
    }
  }, [])
  
  // 只在失去焦点时同步到父组件
  const handleBlur = useCallback(() => {
    if (hasChanged) {
      onAmountChange(value)
      setHasChanged(false)
    }
  }, [value, hasChanged, onAmountChange])
  
  // 按回车键时同步
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hasChanged) {
      onAmountChange(value)
      setHasChanged(false)
    }
  }, [value, hasChanged, onAmountChange])
  
  // 只在组件首次挂载时同步外部值
  const isFirstMount = useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      setValue(initialValue)
      isFirstMount.current = false
    }
  }, [initialValue])

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        输入金额 {hasChanged && <span className="text-blue-500 text-xs">(按回车或点击其他地方更新)</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        className="w-full text-3xl font-bold border-none outline-none bg-transparent placeholder-gray-400 disabled:opacity-50"
        placeholder="0"
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
    </div>
  )
})

// 模态框组件
const LoginModal = memo(function LoginModal({ 
  showLogin, 
  loginForm, 
  authError, 
  showPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onClose,
  onSwitchToRegister
}: {
  showLogin: boolean
  loginForm: { email: string; password: string }
  authError: string
  showPassword: boolean
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTogglePassword: () => void
  onLogin: () => void
  onClose: () => void
  onSwitchToRegister: () => void
}) {
  if (!showLogin) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white w-full max-w-sm rounded-2xl p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎回来</h2>
          <p className="text-gray-500">登录您的汇率通账户</p>
        </div>
        
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
            {authError}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input
              type="email"
              value={loginForm.email}
              onChange={onEmailChange}
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入邮箱"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={onPasswordChange}
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12"
                placeholder="请输入密码"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button
            onClick={onLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            登录
          </button>
          
          <div className="text-center">
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              还没有账户？立即注册
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

// 注册模态框
const RegisterModal = memo(function RegisterModal({
  showRegister,
  registerForm,
  authError,
  showPassword,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onRegister,
  onClose,
  onSwitchToLogin
}: {
  showRegister: boolean
  registerForm: { name: string; email: string; password: string; confirmPassword: string }
  authError: string
  showPassword: boolean
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onConfirmPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTogglePassword: () => void
  onRegister: () => void
  onClose: () => void
  onSwitchToLogin: () => void
}) {
  if (!showRegister) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white w-full max-w-sm rounded-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">创建账户</h2>
          <p className="text-gray-500">注册汇率通账户</p>
        </div>
        
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
            {authError}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
            <input
              type="text"
              value={registerForm.name}
              onChange={onNameChange}
              autoComplete="name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入姓名"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input
              type="email"
              value={registerForm.email}
              onChange={onEmailChange}
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入邮箱"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={registerForm.password}
                onChange={onPasswordChange}
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12"
                placeholder="请输入密码"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
            <input
              type={showPassword ? "text" : "password"}
              value={registerForm.confirmPassword}
              onChange={onConfirmPasswordChange}
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请再次输入密码"
            />
          </div>
          
          <button
            onClick={onRegister}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            注册
          </button>
          
          <div className="text-center">
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              已有账户？立即登录
            </button>
          </div>
        </div>
      </div>
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
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">选择货币</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                selectedCurrency === currency.code ? 'bg-blue-50 border border-blue-200' : ''
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
  // 🔥 关键修复：使用 ref 缓存 useAuth 返回值，避免频繁重渲染
  const authData = useAuth()
  const authRef = useRef(authData)
  authRef.current = authData
  
  const { user, userProfile, loading: authLoading } = authData
  
  const [currentTab, setCurrentTab] = useState('converter')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('CNY')
  const [amount, setAmount] = useState('100')
  const [convertedAmount, setConvertedAmount] = useState('')
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCurrencyPicker, setShowCurrencyPicker] = useState<'from' | 'to' | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  
  // 认证相关状态
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')

  // 获取汇率数据
  const fetchExchangeRate = useCallback(async (from: string, to: string): Promise<ExchangeRate> => {
    console.log(`💱 计算汇率: ${from} → ${to}`)
    
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    
    if (from === to) {
      return {
        rate: 1.0,
        lastUpdated: new Date().toISOString(),
        source: 'local'
      }
    }
    
    const marketRates: MarketRates = {
      'USD-CNY': 7.314, 'USD-EUR': 0.872, 'USD-JPY': 156.24, 'USD-GBP': 0.820,
      'USD-AUD': 1.589, 'USD-CAD': 1.439, 'USD-CHF': 0.912, 'USD-SGD': 1.361,
      'USD-HKD': 7.851, 'USD-KRW': 1435.5, 'USD-INR': 83.42, 'USD-THB': 36.85,
      'USD-MYR': 4.73, 'EUR-CNY': 8.389, 'EUR-USD': 1.147, 'EUR-JPY': 179.15,
      'EUR-GBP': 0.941, 'EUR-CHF': 1.046, 'GBP-CNY': 8.923, 'GBP-USD': 1.220,
      'GBP-EUR': 1.063, 'GBP-JPY': 190.53, 'JPY-CNY': 0.0468, 'JPY-USD': 0.0064,
      'JPY-EUR': 0.0056, 'JPY-GBP': 0.0052, 'CNY-USD': 0.1368, 'CNY-EUR': 0.1192,
      'CNY-JPY': 21.36, 'CNY-GBP': 0.112, 'CNY-HKD': 1.074, 'CNY-AUD': 0.217,
      'CNY-CAD': 0.197, 'AUD-USD': 0.629, 'AUD-CNY': 4.602, 'CAD-USD': 0.695,
      'CAD-CNY': 5.082, 'CHF-USD': 1.096, 'SGD-USD': 0.735, 'HKD-CNY': 0.932,
      'HKD-USD': 0.127, 'KRW-USD': 0.0007, 'INR-USD': 0.012, 'THB-USD': 0.027,
      'MYR-USD': 0.211
    }

    const key = `${from}-${to}`
    const reverseKey = `${to}-${from}`
    
    let baseRate = 1
    
    if (key in marketRates) {
      baseRate = marketRates[key]
    } else if (reverseKey in marketRates) {
      baseRate = 1 / marketRates[reverseKey]
    } else {
      const fromToUSDKey = `${from}-USD`
      const USDFromKey = `USD-${from}`
      const USDToKey = `USD-${to}`
      const toUSDKey = `${to}-USD`
      
      const fromToUSD = fromToUSDKey in marketRates ? marketRates[fromToUSDKey] : 
                       (USDFromKey in marketRates ? 1 / marketRates[USDFromKey] : 1)
      const USDToTo = USDToKey in marketRates ? marketRates[USDToKey] : 
                     (toUSDKey in marketRates ? 1 / marketRates[toUSDKey] : 1)
      baseRate = fromToUSD * USDToTo
    }

    const now = new Date()
    const timeVariation = Math.sin(now.getTime() / 300000) * 0.003
    const randomVariation = (Math.random() - 0.5) * 0.006
    const finalVariation = timeVariation + randomVariation
    
    const finalRate = baseRate * (1 + finalVariation)
    const roundedRate = Number(finalRate.toFixed(6))

    console.log(`✅ 汇率计算完成: ${from} → ${to} = ${roundedRate}`)

    return {
      rate: roundedRate,
      lastUpdated: new Date().toISOString(),
      source: 'market-data'
    }
  }, [])

  // 🔥 关键修复：稳定的转换函数
  const performConversion = useCallback(async (amountToConvert: string) => {
    if (!amountToConvert || isNaN(parseFloat(amountToConvert))) return
    
    setLoading(true)
    
    try {
      const rateData = await fetchExchangeRate(fromCurrency, toCurrency)
      
      if (rateData) {
        const result = fromCurrency === toCurrency 
          ? parseFloat(amountToConvert).toFixed(2)
          : (parseFloat(amountToConvert) * rateData.rate).toFixed(2)
        
        setConvertedAmount(result)
        setExchangeRate(rateData)
        
        // 保存转换历史（使用 ref 避免依赖问题）
        if (authRef.current.user) {
          await supabase.from('conversion_history').insert([
            {
              user_id: authRef.current.user.id,
              from_currency: fromCurrency,
              to_currency: toCurrency,
              from_amount: parseFloat(amountToConvert),
              to_amount: parseFloat(result),
              exchange_rate: rateData.rate
            }
          ])
        }
      }
    } catch (error) {
      console.error('转换失败:', error)
      if (fromCurrency === toCurrency) {
        setConvertedAmount(parseFloat(amountToConvert).toFixed(2))
        setExchangeRate({
          rate: 1,
          lastUpdated: new Date().toISOString(),
          source: 'local'
        })
      }
    } finally {
      setLoading(false)
    }
  }, [fetchExchangeRate, fromCurrency, toCurrency])

  // 🔥 修复：手动转换模式，取消自动计算
  const handleAmountUpdate = useCallback((newAmount: string) => {
    setAmount(newAmount)
    // 移除自动转换，只更新金额
    if (!newAmount) {
      setConvertedAmount('')
      setExchangeRate(null)
    }
  }, [])

  // 移除自动转换的 useEffect
  // useEffect(() => {
  //   if (amount && fromCurrency && toCurrency) {
  //     performConversion(amount)
  //   }
  // }, [fromCurrency, toCurrency, performConversion, amount])

  // 生成图表数据
  const generateChartData = useCallback((baseRate: number) => {
    const data: ChartData[] = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const variation = (Math.random() - 0.5) * 0.01
      const rate = Number((baseRate * (1 + variation)).toFixed(4))
      
      data.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        rate: rate
      })
    }
    
    return data
  }, [])

  // 初始化图表数据
  useEffect(() => {
    const defaultData = generateChartData(7.314)
    setChartData(defaultData)
  }, [generateChartData])

  // 稳定的事件处理函数
  const handleLoginEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, email: e.target.value }))
  }, [])

  const handleLoginPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, password: e.target.value }))
  }, [])

  const handleRegisterNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm(prev => ({ ...prev, name: e.target.value }))
  }, [])

  const handleRegisterEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm(prev => ({ ...prev, email: e.target.value }))
  }, [])

  const handleRegisterPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm(prev => ({ ...prev, password: e.target.value }))
  }, [])

  const handleRegisterConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))
  }, [])

  const handleTogglePassword = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  // 认证处理函数
  const handleLogin = useCallback(async () => {
    if (!loginForm.email || !loginForm.password) {
      setAuthError('请填写所有字段')
      return
    }

    setAuthError('')
    const { error } = await authRef.current.signIn(loginForm.email, loginForm.password)
    
    if (error) {
      setAuthError(error.message || '登录失败，请检查邮箱和密码')
    } else {
      setShowLogin(false)
      setLoginForm({ email: '', password: '' })
    }
  }, [loginForm])

  const handleRegister = useCallback(async () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      setAuthError('请填写所有字段')
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('两次输入的密码不一致')
      return
    }

    if (registerForm.password.length < 6) {
      setAuthError('密码至少需要6位')
      return
    }

    setAuthError('')
    const { error } = await authRef.current.signUp(registerForm.email, registerForm.password, registerForm.name)
    
    if (error) {
      setAuthError(error.message || '注册失败，请稍后重试')
    } else {
      setShowRegister(false)
      setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' })
    }
  }, [registerForm])

  const handleLogout = useCallback(async () => {
    await authRef.current.signOut()
    setCurrentTab('converter')
  }, [])

  // 交换货币 - 修改为手动触发
  const swapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    // 交换货币后不自动计算，需要用户手动点击按钮
    // if (convertedAmount && amount) {
    //   setAmount(convertedAmount)
    //   setConvertedAmount(amount)
    // }
  }, [fromCurrency, toCurrency])

  // 模态框控制函数
  const handleCloseLogin = useCallback(() => {
    setShowLogin(false)
    setAuthError('')
  }, [])

  const handleCloseRegister = useCallback(() => {
    setShowRegister(false)
    setAuthError('')
  }, [])

  const handleSwitchToRegister = useCallback(() => {
    setShowLogin(false)
    setShowRegister(true)
    setAuthError('')
  }, [])

  const handleSwitchToLogin = useCallback(() => {
    setShowRegister(false)
    setShowLogin(true)
    setAuthError('')
  }, [])

  // 状态栏组件
  const StatusBar = () => (
    <div className="flex justify-between items-center text-white text-sm font-medium bg-black/20 px-4 py-2">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <div className="w-4 h-2 border border-white rounded-sm">
          <div className="w-3 h-1 bg-white rounded-sm m-0.5"></div>
        </div>
        <span>100%</span>
      </div>
    </div>
  )

  // 应用头部
  const AppHeader = () => (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <StatusBar />
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6" />
          <h1 className="text-xl font-bold">汇率通</h1>
        </div>
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5" />
          {user ? (
            <button
              onClick={() => setCurrentTab('profile')}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
            >
              <User className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium"
            >
              登录
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // 底部导航
  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {[
          { key: 'converter', icon: Calculator, label: '转换' },
          { key: 'rates', icon: TrendingUp, label: '汇率' },
          { key: 'profile', icon: User, label: user ? '我的' : '登录' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'profile' && !user) {
                setShowLogin(true)
              } else {
                setCurrentTab(tab.key)
              }
            }}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              currentTab === tab.key ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // 转换器标签页 - 完全稳定版本
  const ConverterTab = memo(function ConverterTab() {
    return (
      <div className="p-4 space-y-6">
        {/* 使用完全独立的金额输入组件 */}
        <AmountInput
          initialValue={amount}
          onAmountChange={handleAmountUpdate}
          disabled={loading}
        />

        {/* 货币选择 */}
        <div className="space-y-4">
          {/* 源货币 */}
          <button
            onClick={() => setShowCurrencyPicker('from')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
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

          {/* 交换按钮 */}
          <div className="flex justify-center">
            <button
              onClick={swapCurrencies}
              className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:bg-blue-700"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* 目标货币 */}
          <button
            onClick={() => setShowCurrencyPicker('to')}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
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
                1 {fromCurrency} = {fromCurrency === toCurrency ? '1.000000' : exchangeRate.rate.toFixed(6)} {toCurrency}
              </div>
            )}
          </div>
        )}

        {/* 转换按钮 - 强调手动操作 */}
        <button
          onClick={() => performConversion(amount)}
          disabled={loading || !amount}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform disabled:opacity-50 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              计算中...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              点击计算汇率
            </>
          )}
        </button>
      </div>
    )
  })

  // 汇率标签页 - 美化图表
  const RatesTab = () => {
    const popularRates = [
      { from: 'USD', to: 'CNY', rate: 7.314, change: '+0.12%' },
      { from: 'EUR', to: 'CNY', rate: 8.389, change: '-0.08%' },
      { from: 'GBP', to: 'CNY', rate: 8.923, change: '+0.05%' },
      { from: 'JPY', to: 'CNY', rate: 0.0468, change: '-0.03%' }
    ]

    return (
      <div className="p-4 space-y-6">
        {/* 美化的汇率走势图 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-xl text-gray-800">USD/CNY 走势</h3>
              <p className="text-sm text-gray-500 mt-1">美元对人民币汇率</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                近7天
              </span>
            </div>
          </div>
          
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fontSize: 12, 
                    fill: '#6B7280',
                    fontWeight: 500
                  }}
                  tickMargin={10}
                />
                
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fontSize: 12, 
                    fill: '#6B7280',
                    fontWeight: 500
                  }}
                  tickMargin={10}
                  domain={['dataMin - 0.02', 'dataMax + 0.02']}
                  tickFormatter={(value) => value.toFixed(3)}
                />
                
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  formatter={(value: number) => [
                    `¥${value.toFixed(4)}`, 
                    '汇率'
                  ]}
                  labelFormatter={(label) => `${label}`}
                  cursor={{ 
                    stroke: '#3B82F6', 
                    strokeWidth: 1,
                    strokeDasharray: '5 5'
                  }}
                />
                
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ 
                    fill: '#fff', 
                    stroke: '#3B82F6',
                    strokeWidth: 3, 
                    r: 5,
                    filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
                  }}
                  activeDot={{ 
                    r: 7, 
                    fill: '#3B82F6',
                    stroke: '#fff',
                    strokeWidth: 3,
                    filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.4))'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* 图表装饰 */}
            <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>汇率走势</span>
            </div>
          </div>
          
          {/* 图表底部信息 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>数据更新时间: {new Date().toLocaleString('zh-CN')}</span>
              <span className="text-green-600 font-medium">↗ 实时数据</span>
            </div>
          </div>
        </div>

        {/* 热门汇率 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-lg mb-4">热门汇率</h3>
          {popularRates.map((rate, index) => (
            <div key={index} className={`flex items-center justify-between py-3 ${index !== popularRates.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currencies.find(c => c.code === rate.from)?.flag}</span>
                  <span className="font-medium">{rate.from}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-lg">{currencies.find(c => c.code === rate.to)?.flag}</span>
                  <span className="font-medium">{rate.to}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{rate.rate}</div>
                <div className={`text-sm ${rate.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {rate.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 当前汇率信息 */}
        {exchangeRate && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="text-center">
              <div className="text-sm text-blue-600 mb-2 font-medium">当前汇率</div>
              <div className="text-3xl font-bold text-blue-800 mb-1">
                1 {fromCurrency} = {fromCurrency === toCurrency ? '1.000000' : exchangeRate.rate.toFixed(6)} {toCurrency}
              </div>
              <div className="text-xs text-blue-600">
                更新时间: {new Date(exchangeRate.lastUpdated).toLocaleTimeString('zh-CN')}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 个人中心标签页
  const ProfileTab = () => (
    <div className="p-4 space-y-6">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{userProfile?.name || '用户'}</h2>
            <p className="text-white/80">{userProfile?.email}</p>
          </div>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {[
          { icon: Clock, label: '转换历史', action: () => {} },
          { icon: Star, label: '收藏汇率', action: () => {} },
          { icon: Bell, label: '汇率提醒', action: () => {} },
          { icon: Settings, label: '设置', action: () => {} }
        ].map((item, index) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
              index !== 3 ? 'border-b border-gray-100' : ''
            }`}
          >
            <item.icon className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-left font-medium">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      {/* 其他选项 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {[
          { icon: Shield, label: '隐私设置', action: () => {} },
          { icon: HelpCircle, label: '帮助中心', action: () => {} },
          { icon: CreditCard, label: '关于我们', action: () => {} }
        ].map((item, index) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
              index !== 2 ? 'border-b border-gray-100' : ''
            }`}
          >
            <item.icon className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-left font-medium">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      {/* 退出登录 */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 border border-red-200 hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        退出登录
      </button>
    </div>
  )

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <AppHeader />
      
      <div className="pb-20">
        {currentTab === 'converter' && <ConverterTab />}
        {currentTab === 'rates' && <RatesTab />}
        {currentTab === 'profile' && user && <ProfileTab />}
      </div>

      <BottomNavigation />

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

      {/* 登录模态框 */}
      <LoginModal
        showLogin={showLogin}
        loginForm={loginForm}
        authError={authError}
        showPassword={showPassword}
        onEmailChange={handleLoginEmailChange}
        onPasswordChange={handleLoginPasswordChange}
        onTogglePassword={handleTogglePassword}
        onLogin={handleLogin}
        onClose={handleCloseLogin}
        onSwitchToRegister={handleSwitchToRegister}
      />

      {/* 注册模态框 */}
      <RegisterModal
        showRegister={showRegister}
        registerForm={registerForm}
        authError={authError}
        showPassword={showPassword}
        onNameChange={handleRegisterNameChange}
        onEmailChange={handleRegisterEmailChange}
        onPasswordChange={handleRegisterPasswordChange}
        onConfirmPasswordChange={handleRegisterConfirmPasswordChange}
        onTogglePassword={handleTogglePassword}
        onRegister={handleRegister}
        onClose={handleCloseRegister}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  )
}