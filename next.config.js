// next.config.js - 在项目根目录创建或修改此文件

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用静态导出
  output: 'export',
  
  // 禁用图像优化（静态导出不支持）
  images: {
    unoptimized: true,
  },
  
  // 配置基础路径（如果需要）
  basePath: '',
  
  // 配置尾随斜杠
  trailingSlash: true,
  
  // 禁用服务端功能（静态导出不支持）
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig
