import { createClient } from '@supabase/supabase-js'

// 直接配置连接信息
const supabaseUrl = 'https://cozhumvojjyfafexsrvq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvemh1bXZvamp5ZmFmZXhzcnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTkxNTgsImV4cCI6MjA2OTUzNTE1OH0.U9oCwKjx2dtKLjhKU1Wf4dXCWWm0uodCwj6G-fUnVRc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url?: string
  created_at: string
}

export interface UserFavorite {
  id: string
  user_id: string
  from_currency: string
  to_currency: string
  created_at: string
}

export interface RateAlert {
  id: string
  user_id: string
  from_currency: string
  to_currency: string
  target_rate: number
  condition: 'above' | 'below'
  is_active: boolean
  created_at: string
}

export interface ConversionHistory {
  id: string
  user_id: string
  from_currency: string
  to_currency: string
  from_amount: number
  to_amount: number
  exchange_rate: number
  created_at: string
}

// 货币数据
export const currencies = [
  { code: 'USD', name: '美元', flag: '🇺🇸', popular: true },
  { code: 'CNY', name: '人民币', flag: '🇨🇳', popular: true },
  { code: 'EUR', name: '欧元', flag: '🇪🇺', popular: true },
  { code: 'JPY', name: '日元', flag: '🇯🇵', popular: true },
  { code: 'GBP', name: '英镑', flag: '🇬🇧', popular: true },
  { code: 'KRW', name: '韩元', flag: '🇰🇷', popular: false },
  { code: 'AUD', name: '澳元', flag: '🇦🇺', popular: false },
  { code: 'CAD', name: '加元', flag: '🇨🇦', popular: false },
  { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭', popular: false },
  { code: 'SGD', name: '新加坡元', flag: '🇸🇬', popular: false }
]