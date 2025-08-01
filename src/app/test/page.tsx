'use client'

import React, { useState, useCallback } from 'react'

export default function MinimalTestApp() {
  const [showLogin, setShowLogin] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  // 使用 useCallback 优化的处理函数
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, email: e.target.value }))
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, password: e.target.value }))
  }, [])

  const LoginModal = () => {
    if (!showLogin) return null

    return (
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowLogin(false)
          }
        }}
      >
        <div 
          className="bg-white w-full max-w-sm rounded-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">测试登录</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={handleEmailChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="请输入邮箱地址"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="请输入密码"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => console.log('登录', loginForm)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
            >
              登录
            </button>
            
            <button
              onClick={() => setShowLogin(false)}
              className="w-full text-gray-500 py-2"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">输入框焦点测试</h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">普通输入框测试</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="这个输入框应该工作正常"
            />
          </div>
        </div>
        
        <button
          onClick={() => setShowLogin(true)}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold mb-4"
        >
          打开模态框测试
        </button>
        
        <div className="text-center text-sm text-gray-500">
          <p>📝 测试说明：</p>
          <p>1. 先测试上面的普通输入框</p>
          <p>2. 然后点击按钮测试模态框输入框</p>
          <p>3. 在模态框中连续输入字符</p>
          <p>4. 观察是否会失去焦点</p>
        </div>
      </div>

      <LoginModal />
    </div>
  )
}