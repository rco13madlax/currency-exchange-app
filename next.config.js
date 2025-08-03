/** @type {import('next').NextConfig} */
const nextConfig = {
  // 重新启用静态导出
  output: 'export',
  
  // 禁用图像优化
  images: {
    unoptimized: true,
  },
  
  // 配置基础路径
  basePath: '',
  
  // 配置尾随斜杠
  trailingSlash: true,
  
  // 优化构建
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig