'use client'

import React, { useState, useEffect, useCallback, memo } from 'react'
import { ArrowUpDown, TrendingUp, Calculator, Globe, RefreshCw, Menu, Search, Star, Clock, MoreHorizontal, Bell, User, Settings, CreditCard, Shield, HelpCircle, LogOut, Eye, EyeOff, ChevronRight } from 'lucide-react'
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

// 🔥 关键修复：将模态框组件提取到外部，使用 memo 优化
const LoginModal = memo(({ 
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
}) => {
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="请输入邮箱地址"
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
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="请输入密码"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={onLogin}
            disabled={!loginForm.email || !loginForm.password}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            登录
          </button>
          
          <div className="text-center">
            <span className="text-gray-500 text-sm">还没有账户？</span>
            <button 
              onClick={onSwitchToRegister}
              className="text-blue-600 text-sm font-medium ml-1"
            >
              立即注册
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full text-gray-500 py-2"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
})

const RegisterModal = memo(({
  showRegister,
  registerForm,
  authError,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onRegister,
  onClose,
  onSwitchToLogin
}: {
  showRegister: boolean
  registerForm: { name: string; email: string; password: string; confirmPassword: string }
  authError: string
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onConfirmPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRegister: () => void
  onClose: () => void
  onSwitchToLogin: () => void
}) => {
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
        className="bg-white w-full max-w-sm rounded-2xl p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">创建账户</h2>
          <p className="text-gray-500">加入汇率通大家庭</p>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="请输入您的姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input
              type="email"
              value={registerForm.email}
              onChange={onEmailChange}
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="请输入邮箱地址"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input
              type="password"
              value={registerForm.password}
              onChange={onPasswordChange}
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="请输入密码"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
            <input
              type="password"
              value={registerForm.confirmPassword}
              onChange={onConfirmPasswordChange}
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="请再次输入密码"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={onRegister}
            disabled={!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.confirmPassword}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            注册
          </button>
          
          <div className="text-center">
            <span className="text-gray-500 text-sm">已有账户？</span>
            <button 
              onClick={onSwitchToLogin}
              className="text-blue-600 text-sm font-medium ml-1"
            >
              立即登录
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full text-gray-500 py-2"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
})

// 货币选择器组件
const CurrencyPicker = memo(({ isVisible, onSelect, onClose, selectedCurrency }: {
  isVisible: boolean
  onSelect: (code: string) => void
  onClose: () => void
  selectedCurrency: string
}) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl animate-slideUp max-h-[80vh]">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">选择货币</h3>
            <button onClick={onClose} className="p-2">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="mt-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="搜索货币..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto">
          <div className="p-4">
            <div className="text-sm font-medium text-gray-500 mb-3">热门货币</div>
            {currencies.filter(c => c.popular).map(currency => (
              <button
                key={currency.code}
                onClick={() => {
                  onSelect(currency.code)
                  onClose()
                }}
                className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors ${
                  selectedCurrency === currency.code ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                <span className="text-2xl">{currency.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{currency.code}</div>
                  <div className="text-sm text-gray-500">{currency.name}</div>
                </div>
                {currency.popular && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </button>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-100">
            <div className="text-sm font-medium text-gray-500 mb-3">其他货币</div>
            {currencies.filter(c => !c.popular).map(currency => (
              <button
                key={currency.code}
                onClick={() => {
                  onSelect(currency.code)
                  onClose()
                }}
                className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors ${
                  selectedCurrency === currency.code ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                <span className="text-2xl">{currency.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{currency.code}</div>
                  <div className="text-sm text-gray-500">{currency.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

// 主应用组件
export default function CurrencyExchangeApp() {
  const { user, userProfile, loading: authLoading, signUp, signIn, signOut } = useAuth()
  
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
  const fetchExchangeRate = async (from: string, to: string) => {
    try {
      const response = await fetch(`/api/rates?from=${from}&to=${to}`)
      const data = await response.json()
      
      if (data.success) {
        return {
          rate: data.rate,
          lastUpdated: data.lastUpdated,
          source: data.source
        }
      } else {
        throw new Error('获取汇率失败')
      }
    } catch (error) {
      console.error('汇率获取错误:', error)
      return null
    }
  }

  // 获取历史数据
  const fetchHistoricalData = async (from: string, to: string) => {
    try {
      const response = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, days: 7 })
      })
      const data = await response.json()
      
      if (data.success) {
        setChartData(data.data)
      }
    } catch (error) {
      console.error('历史数据获取错误:', error)
    }
  }

  // 转换货币
  const convertCurrency = async () => {
    if (!amount || isNaN(parseFloat(amount))) return
    
    setLoading(true)
    const rateData = await fetchExchangeRate(fromCurrency, toCurrency)
    
    if (rateData) {
      const result = (parseFloat(amount) * rateData.rate).toFixed(2)
      setConvertedAmount(result)
      setExchangeRate(rateData)
      
      // 保存转换历史（仅限已登录用户）
      if (user) {
        await supabase.from('conversion_history').insert([
          {
            user_id: user.id,
            from_currency: fromCurrency,
            to_currency: toCurrency,
            from_amount: parseFloat(amount),
            to_amount: parseFloat(result),
            exchange_rate: rateData.rate
          }
        ])
      }
    }
    
    setLoading(false)
  }

  // 🔥 关键修复：稳定的事件处理函数
  const handleLoginEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, email: e.target.value }))
  }, [])

  const handleLoginPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, password: e.target.value }))
  }, [])

  const handleTogglePassword = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const handleLogin = useCallback(async () => {
    setAuthError('')
    const { error } = await signIn(loginForm.email, loginForm.password)
    
    if (error) {
      setAuthError(error.message)
    } else {
      setShowLogin(false)
      setLoginForm({ email: '', password: '' })
    }
  }, [loginForm.email, loginForm.password, signIn])

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

  const handleRegister = useCallback(async () => {
    setAuthError('')
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('密码不匹配')
      return
    }
    
    const { error } = await signUp(registerForm.email, registerForm.password, registerForm.name)
    
    if (error) {
      setAuthError(error.message)
    } else {
      setShowRegister(false)
      setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' })
    }
  }, [registerForm, signUp])

  const handleLogout = async () => {
    await signOut()
    setCurrentTab('converter')
  }

  // 切换货币
  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    if (convertedAmount && amount) {
      setAmount(convertedAmount)
      setConvertedAmount(amount)
    }
  }

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

  // 监听货币变化
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      convertCurrency()
    }
    fetchHistoricalData(fromCurrency, toCurrency)
  }, [fromCurrency, toCurrency])

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
              className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium"
            >
              登录
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // 转换器标签页
  const ConverterTab = () => (
    <div className="p-4 space-y-6">
      {/* 金额输入卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="text-sm text-gray-500 mb-2">输入金额</div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full text-3xl font-bold text-gray-800 bg-transparent border-none outline-none"
          placeholder="0"
        />
      </div>

      {/* 货币选择 */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <button
            onClick={() => setShowCurrencyPicker('from')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {currencies.find(c => c.code === fromCurrency)?.flag}
              </span>
              <div className="text-left">
                <div className="font-semibold text-lg">{fromCurrency}</div>
                <div className="text-sm text-gray-500">
                  {currencies.find(c => c.code === fromCurrency)?.name}
                </div>
              </div>
            </div>
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 交换按钮 */}
        <div className="flex justify-center">
          <button
            onClick={swapCurrencies}
            className="p-4 bg-blue-500 rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <ArrowUpDown className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <button
            onClick={() => setShowCurrencyPicker('to')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {currencies.find(c => c.code === toCurrency)?.flag}
              </span>
              <div className="text-left">
                <div className="font-semibold text-lg">{toCurrency}</div>
                <div className="text-sm text-gray-500">
                  {currencies.find(c => c.code === toCurrency)?.name}
                </div>
              </div>
            </div>
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 结果卡片 */}
      {convertedAmount && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">转换结果</div>
            <div className="text-4xl font-bold text-gray-800 mb-2">
              {loading ? <RefreshCw className="w-8 h-8 animate-spin mx-auto" /> : convertedAmount}
            </div>
            <div className="text-lg text-gray-600 mb-3">{toCurrency}</div>
            {exchangeRate && (
              <div className="text-sm text-gray-500">
                1 {fromCurrency} = {exchangeRate.rate.toFixed(4)} {toCurrency}
                <br />
                <span className="text-xs">
                  更新时间: {new Date(exchangeRate.lastUpdated).toLocaleTimeString('zh-CN')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 转换按钮 */}
      <button
        onClick={convertCurrency}
        disabled={loading || !amount || amount === '0'}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            转换中...
          </>
        ) : (
          <>
            <Calculator className="w-5 h-5" />
            立即转换
          </>
        )}
      </button>

      {/* 快捷金额 */}
      <div className="grid grid-cols-4 gap-3">
        {['100', '500', '1000', '5000'].map(quickAmount => (
          <button
            key={quickAmount}
            onClick={() => setAmount(quickAmount)}
            className="py-3 bg-white rounded-xl shadow-sm border border-gray-100 font-medium active:scale-95 transition-transform"
          >
            {quickAmount}
          </button>
        ))}
      </div>
    </div>
  )

  // 汇率标签页
  const RatesTab = () => (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{fromCurrency}/{toCurrency} 走势</h3>
          <span className="text-sm text-gray-500">近7天</span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false}
                tick={{fontSize: 12}}
              />
              <YAxis hide domain={['dataMin - 0.01', 'dataMax + 0.01']} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 热门汇率 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg px-2">热门汇率</h3>
        {currencies.filter(c => c.popular && c.code !== fromCurrency).map(currency => (
          <div key={currency.code} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currency.flag}</span>
                <div>
                  <div className="font-semibold">{fromCurrency}/{currency.code}</div>
                  <div className="text-sm text-gray-500">{currency.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">--</div>
                <div className="text-sm text-green-600">+0.00%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // 个人中心标签页
  const ProfileTab = () => (
    <div className="p-4 space-y-6">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{userProfile?.name || '用户'}</h3>
            <p className="text-white/80">{userProfile?.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <div className="text-2xl font-bold">12</div>
            <div className="text-sm text-white/80">转换次数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">5</div>
            <div className="text-sm text-white/80">收藏货币</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">3</div>
            <div className="text-sm text-white/80">价格提醒</div>
          </div>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {[
          { icon: Star, label: '我的收藏', desc: '收藏的货币对' },
          { icon: Bell, label: '价格提醒', desc: '汇率变动通知' },
          { icon: Settings, label: '设置', desc: '个人偏好设置' },
          { icon: CreditCard, label: '会员中心', desc: '升级获得更多功能' },
          { icon: Shield, label: '隐私安全', desc: '账户安全设置' },
          { icon: HelpCircle, label: '帮助中心', desc: '常见问题解答' }
        ].map((item, index) => (
          <button key={index} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-800">{item.label}</div>
              <div className="text-sm text-gray-500">{item.desc}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      {/* 退出登录 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-4 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">退出登录</span>
        </button>
      </div>
    </div>
  )

  // 底部导航
  const BottomNav = () => (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {[
          { id: 'converter', icon: Calculator, label: '转换' },
          { id: 'rates', icon: TrendingUp, label: '汇率' },
          { id: 'history', icon: Clock, label: '历史' },
          { id: 'profile', icon: User, label: '我的' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center py-2 px-4 rounded-xl transition-colors ${
              currentTab === tab.id 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-500'
            }`}
          >
            <tab.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  if (authLoading) {
    return (
      <div className="max-w-sm mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <>
      <div className="max-w-sm mx-auto bg-gray-50 min-h-screen flex flex-col">
        <AppHeader />
        
        <div className="flex-1 overflow-y-auto">
          {currentTab === 'converter' && <ConverterTab />}
          {currentTab === 'rates' && <RatesTab />}
          {currentTab === 'profile' && <ProfileTab />}
          {currentTab === 'history' && (
            <div className="p-4 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>历史记录功能开发中...</p>
            </div>
          )}
        </div>

        <BottomNav />
      </div>

      {/* 🔥 关键修复：模态框作为独立组件渲染 */}
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

      <RegisterModal
        showRegister={showRegister}
        registerForm={registerForm}
        authError={authError}
        onNameChange={handleRegisterNameChange}
        onEmailChange={handleRegisterEmailChange}
        onPasswordChange={handleRegisterPasswordChange}
        onConfirmPasswordChange={handleRegisterConfirmPasswordChange}
        onRegister={handleRegister}
        onClose={handleCloseRegister}
        onSwitchToLogin={handleSwitchToLogin}
      />

      <CurrencyPicker 
        isVisible={showCurrencyPicker !== null}
        onSelect={(currency) => {
          if (showCurrencyPicker === 'from') {
            setFromCurrency(currency)
          } else {
            setToCurrency(currency)
          }
        }}
        onClose={() => setShowCurrencyPicker(null)}
        selectedCurrency={showCurrencyPicker === 'from' ? fromCurrency : toCurrency}
      />
    </>
  )
}