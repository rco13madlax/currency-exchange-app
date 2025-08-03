import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, UserProfile } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 🔥 关键修复：使用 ref 避免频繁重新创建函数
  const isInitialized = useRef(false)

  // 🔥 稳定的认证函数，使用 useCallback
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })
    return { data, error }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    return { error }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('未登录') }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    
    if (data) {
      setUserProfile(data)
    }
    
    return { data, error }
  }, [user])

  // 🔥 优化：减少数据库查询
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!profile) {
        // 创建新的用户资料
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: userId,
              name: user?.user_metadata?.name || user?.email?.split('@')[0] || '用户',
              email: user?.email || ''
            }
          ])
          .select()
          .single()
        
        setUserProfile(newProfile)
      } else {
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
    }
  }, [user?.user_metadata?.name, user?.email])

  useEffect(() => {
    // 🔥 防止重复初始化
    if (isInitialized.current) return
    isInitialized.current = true

    // 获取当前用户
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)
        
        if (currentUser) {
          await fetchUserProfile(currentUser.id)
        }
      } catch (error) {
        console.error('获取用户失败:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  // 🔥 返回稳定的引用
  return {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  }
}